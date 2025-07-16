package minecraft

import (
	"archive/tar"
	"compress/gzip"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"os"
	"os/exec"
	"path/filepath"
	"strconv"
	"strings"
	"sync"
	"time"
)

type Server struct {
	dir       string
	state     State
	cmd       *exec.Cmd
	stdinPipe io.WriteCloser
	mutex     sync.RWMutex
	LogFile   string
	Logger    *Logger
}

type State int

const (
	Empty State = iota
	Installing
	Stopped
	Running
	BackingUp
	Restoring
)

// Loads an existing Minecraft server from a folder
func loadServer(dir string) (*Server, error) {
	_, err := os.Stat(dir + "/server/bedrock_server")
	if err == nil {
		return &Server{dir: dir, state: Stopped, Logger: NewLogger()}, nil
	} else if os.IsNotExist(err) {
		return &Server{dir: dir, state: Empty, Logger: NewLogger()}, nil
	}

	return nil, err
}

func (m *Server) Start() error {
	m.mutex.Lock()
	defer m.mutex.Unlock()

	if m.state != Stopped {
		return errors.New("server cannot be started in this state")
	}

	logName := time.Now().Format("2006-01-02-15-04-05") + ".log"
	file, err := os.Create(m.dir + "/logs/" + logName)
	if err != nil {
		return err
	}
	m.LogFile = m.dir + "/logs/" + logName

	m.cmd = exec.Command("./bedrock_server")
	m.cmd.Dir = m.dir + "/server"
	m.cmd.Stdout = io.MultiWriter(file, m.Logger)
	m.stdinPipe, err = m.cmd.StdinPipe()
	if err != nil {
		return err
	}

	err = m.cmd.Start()
	if err != nil {
		return err
	}

	m.state = Running

	go func() {
		err := m.cmd.Wait()

		m.mutex.Lock()
		m.state = Stopped
		m.mutex.Unlock()

		if err == nil {
			// Program exited normally, don't restart
			return
		}

		if exitErr, ok := err.(*exec.ExitError); ok {
			code := exitErr.ExitCode()
			fmt.Println("Server exited with code:", code)
			if code != 0 {
				// Abnormal exit — restart
				m.Start()
			}
		} else {
			// Some other unexpected error
			fmt.Println("Unexpected error:", err)
			m.Start()
		}
	}()
	return nil
}

func (m *Server) Command(command string) error {
	m.mutex.RLock()
	defer m.mutex.RUnlock()

	if m.state != Running {
		return errors.New("server is not running")
	}

	_, err := io.WriteString(m.stdinPipe, command+"\n")
	if err != nil {
		return err
	}

	return nil
}

func (m *Server) Stop() error {
	return m.Command("stop")
}

func (m *Server) Install() error {
	m.mutex.Lock()
	defer m.mutex.Lock()

	if m.state != Empty {
		return errors.New("minecraft server already installed")
	}
	m.state = Installing

	fmt.Fprintln(m.Logger, "Installing server..")

	err := os.Mkdir(m.dir, 0700) // Read/write/execute for owner only
	if err != nil && !os.IsExist(err) {
		m.state = Empty
		fmt.Fprintf(m.Logger, "ERROR: Failed to create directory: %s\n", m.dir)
		return err
	}
	err = os.Mkdir(m.dir+"/server", 0700) // Read/write/execute for owner only
	if err != nil && !os.IsExist(err) {
		m.state = Empty
		fmt.Fprintf(m.Logger, "ERROR: Failed to create directory: %s\n", m.dir+"/server")
		return err
	}
	err = os.Mkdir(m.dir+"/logs", 0700) // Read/write/execute for owner only
	if err != nil && !os.IsExist(err) {
		m.state = Empty
		fmt.Fprintf(m.Logger, "ERROR: Failed to create directory: %s\n", m.dir+"/logs")
		return err
	}
	err = os.Mkdir(m.dir+"/backups", 0700) // Read/write/execute for owner only
	if err != nil && !os.IsExist(err) {
		m.state = Empty
		fmt.Fprintf(m.Logger, "ERROR: Failed to create directory: %s\n", m.dir+"/backups")
		return err
	}

	fmt.Fprintln(m.Logger, "Getting latest software version...")
	uri, err := GetLinuxDownload()
	if err != nil {
		m.state = Empty
		return err
	}
	file := "bedrock-server.zip"

	fmt.Fprintf(m.Logger, "Downloading: %s\n", uri)
	// TODO: Remove dependence on curl
	cmd := exec.Command("curl", uri, "-A", "firefox", "-o", file)
	err = cmd.Run()
	if err != nil {
		m.state = Empty
		fmt.Fprintln(m.Logger, "ERROR: Failed to download file")
		return err
	}

	fmt.Fprintln(m.Logger, "Downloaded.\nExtracting archive...")
	// TODO: Remove dependence on unzip
	cmd = exec.Command("unzip", file, "-d", m.dir+"/server")
	err = cmd.Run()
	if err != nil {
		m.state = Empty
		fmt.Fprintln(m.Logger, "ERROR: Failed to extract file")
		return err
	}

	fmt.Fprintln(m.Logger, "Server installed.")
	m.state = Stopped
	return nil
}

func (m *Server) Backup() error {
	m.mutex.Lock()
	defer m.mutex.Unlock()

	switch m.state {
	case Stopped:
		return stoppedBackup(m)
	case Running:
		return runningBackup(m)
	default:
		return errors.New("cannot backup in state: " + m.state.ToString())
	}
}

func (m *Server) Restore(backup string) error {
	m.mutex.Lock()
	defer m.mutex.Unlock()

	if m.state != Stopped {
		return errors.New("minecraft server is not stopped")
	}
	m.state = Restoring

	// TODO: Remove use of rm
	cmd := exec.Command("rm", "-r", m.dir+"/server/worlds")
	err := cmd.Run()
	if err != nil {
		m.state = Stopped
		return err
	}

	// TODO: Remove dependence on unzip
	cmd = exec.Command("unzip", m.dir+"/backups/"+backup, "-d", m.dir+"/server")
	cmd.Dir = m.dir
	cmd.Stdout = m.Logger
	err = cmd.Run()
	if err != nil {
		fmt.Println("unzip failed")
		m.state = Stopped
		return err
	}

	m.state = Stopped
	return nil
}

type downloadLinkResponse struct {
	Result struct {
		Links []struct {
			DownloadType string `json:"downloadType"`
			DownloadURL  string `json:"downloadUrl"`
		} `json:"links"`
	} `json:"result"`
}

func GetLinuxDownload() (string, error) {
	resp, err := http.Get("https://net-secondary.web.minecraft-services.net/api/v1.0/download/links")
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return "", err
	}

	var result downloadLinkResponse
	err = json.Unmarshal(body, &result)
	if err != nil {
		return "", err
	}

	for i := 0; i < len(result.Result.Links); i++ {
		if result.Result.Links[i].DownloadType == "serverBedrockLinux" {
			return result.Result.Links[i].DownloadURL, nil
		}
	}

	return "", errors.New("could not find the download link")
}

func (m *Server) GetState() State {
	m.mutex.RLock()
	defer m.mutex.RUnlock()
	return m.state
}

func (m *Server) GetDir() string {
	return m.dir
}

func (s State) ToString() string {
	switch s {
	case Stopped:
		return "stopped"
	case Empty:
		return "empty"
	case Running:
		return "running"
	case BackingUp:
		return "backingUp"
	case Restoring:
		return "restoring"
	default:
		panic("no string for minecraft server state")
	}
}

// backedUpFiles are the files to be backed up in addition to the worlds folder
var backedUpFiles = []string{"server.properties", "allowlist.json", "permissions.json"}

// stoppedBackup creates a backup of the server by copying entire files.
// It assumes that m.mutex is already locked and that the server is stopped.
func stoppedBackup(m *Server) error {
	if m.state != Stopped {
		return errors.New("server is not stopped")
	}
	m.state = BackingUp
	// State will always return to Stopped
	defer func() {
		m.state = Stopped
	}()

	fmt.Fprintf(m.Logger, "Creating backup...\n")

	name := time.Now().Format("2006-01-02-15:04:05") + ".tar.gz"
	backupFile, err := os.Create(m.dir + "/backups/" + name)
	if err != nil {
		return err
	}
	defer backupFile.Close()

	gw := gzip.NewWriter(backupFile)
	defer gw.Close()

	tw := tar.NewWriter(gw)
	defer tw.Close()

	for _, fileName := range backedUpFiles {
		fmt.Fprintf(m.Logger, "Adding: %s\n", fileName)

		fileInfo, err := os.Stat(m.dir + "/server/" + fileName)
		if err != nil {
			return err
		}

		header, err := tar.FileInfoHeader(fileInfo, "")
		if err != nil {
			return err
		}

		header.Name = fileName
		if err = tw.WriteHeader(header); err != nil {
			return err
		}

		file, err := os.Open(m.dir + "/server/" + fileName)
		if err != nil {
			return err
		}
		defer file.Close()

		if _, err = io.Copy(tw, file); err != nil {
			return err
		}
	}

	filepath.Walk(m.dir+"/server/worlds", func(fileName string, fileInfo os.FileInfo, err error) error {
		if err != nil {
			return err
		}

		if !fileInfo.Mode().IsRegular() {
			return nil // Ignore non regular files
		}

		if fileInfo.IsDir() {
			return nil // Ignore directories
		}

		relativePath, err := filepath.Rel(m.dir+"/server/worlds", fileName)
		if err != nil {
			return err
		}

		fmt.Fprintf(m.Logger, "Adding: %s\n", relativePath)

		header, err := tar.FileInfoHeader(fileInfo, "")
		if err != nil {
			return err
		}

		header.Name = relativePath
		if err = tw.WriteHeader(header); err != nil {
			return err
		}

		file, err := os.Open(fileName)
		if err != nil {
			return err
		}
		defer file.Close()

		if _, err = io.Copy(tw, file); err != nil {
			return err
		}

		return nil
	})

	fmt.Fprintf(m.Logger, "Backup created: %s\n", name)

	return nil
}

// runningBackup creates a backup of a running server using `save hold`, `save query`, and `save resume`.
// It assumes that m.mutex is already locked and that the server is running.
func runningBackup(m *Server) error {
	if m.state != Running {
		return errors.New("server is not running")
	}
	m.state = BackingUp
	// State will always return to Running
	defer func() {
		m.state = Running
	}()

	io.WriteString(m.stdinPipe, "save hold\n")

	id, ch := m.Logger.Subscribe()
	ready := false
	isNextLogFiles := false
	var worldFiles []string

	for !ready {
		select {
		case log := <-ch:
			if isNextLogFiles {
				log = strings.TrimSuffix(log, "\n")
				worldFiles = strings.Split(log, ", ")
				ready = true
			} else if strings.Contains(log, "Data saved. Files are now ready to be copied.") {
				isNextLogFiles = true
			}
		default:
			// No available logs yet
			io.WriteString(m.stdinPipe, "save query\n")
			time.Sleep(time.Second)
		}
	}
	m.Logger.Unsubscribe(id)

	name := time.Now().Format("2006-01-02-15:04:05") + ".tar.gz"
	backupFile, err := os.Create(m.dir + "/backups/" + name)
	if err != nil {
		return err
	}
	defer backupFile.Close()

	gw := gzip.NewWriter(backupFile)
	defer gw.Close()

	tw := tar.NewWriter(gw)
	defer tw.Close()

	for _, fileName := range backedUpFiles {
		fileInfo, err := os.Stat(m.dir + "/server/" + fileName)
		if err != nil {
			return err
		}

		header, err := tar.FileInfoHeader(fileInfo, "")
		if err != nil {
			return err
		}

		header.Name = fileName
		if err = tw.WriteHeader(header); err != nil {
			return err
		}

		file, err := os.Open(m.dir + "/server/" + fileName)
		if err != nil {
			return err
		}
		defer file.Close()

		if _, err = io.Copy(tw, file); err != nil {
			return err
		}
	}

	for _, worldFile := range worldFiles {
		// The worldFiles are displayed as file:len
		// The file needs to be truncated to n bytes
		worldFileParts := strings.Split(worldFile, ":")
		if len(worldFileParts) != 2 {
			return errors.New("bad filename: " + worldFile)
		}
		fileName := worldFileParts[0]
		fileLen, err := strconv.ParseInt(worldFileParts[1], 10, 64)
		if err != nil {
			return err
		}

		fileInfo, err := os.Stat(m.dir + "/server/worlds/" + fileName)
		if err != nil {
			return err
		}

		header, err := tar.FileInfoHeader(fileInfo, "")
		if err != nil {
			return err
		}

		header.Name = "worlds/" + fileName
		header.Size = fileLen // File will be truncated
		if err = tw.WriteHeader(header); err != nil {
			return err
		}

		file, err := os.Open(m.dir + "/server/worlds/" + fileName)
		if err != nil {
			return err
		}
		defer file.Close()

		if _, err = io.CopyN(tw, file, fileLen); err != nil {
			return err
		}
	}

	io.WriteString(m.stdinPipe, "save resume\n")

	return nil
}
