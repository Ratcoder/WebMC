package minecraft

import (
	"archive/tar"
	"archive/zip"
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
	defer m.mutex.Unlock()

	if m.state != Empty {
		return errors.New("minecraft server already installed")
	}

	if err := os.MkdirAll(filepath.Join(m.dir, "server"), 0700); err != nil {
		return err
	}

	if err := os.MkdirAll(filepath.Join(m.dir, "backups"), 0700); err != nil {
		return err
	}

	if err := os.MkdirAll(filepath.Join(m.dir, "logs"), 0700); err != nil {
		return err
	}

	if err := installSoftware(m); err != nil {
		return err
	}

	m.state = Stopped
	return nil
}

func (m *Server) Update() error {
	m.mutex.Lock()
	defer m.mutex.Unlock()

	if m.state != Stopped {
		return errors.New("cannot update in state: " + m.state.ToString())
	}

	fmt.Fprintln(m.Logger, "Updating server...")

	backup, err := stoppedBackup(m)
	if err != nil {
		return err
	}

	if err := os.RemoveAll(filepath.Join(m.dir, "server")); err != nil {
		return err
	}

	if err := os.MkdirAll(filepath.Join(m.dir, "server"), 0700); err != nil {
		return err
	}

	if err := installSoftware(m); err != nil {
		return err
	}

	if err := restore(m, backup); err != nil {
		return err
	}

	fmt.Fprintln(m.Logger, "Update complete.")
	m.state = Stopped
	return nil
}

func (m *Server) Backup() error {
	m.mutex.Lock()
	defer m.mutex.Unlock()

	switch m.state {
	case Stopped:
		_, err := stoppedBackup(m)
		return err
	case Running:
		_, err := runningBackup(m)
		return err
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
	// State will always return to Stopped
	defer func() {
		m.state = Stopped
	}()

	return restore(m, backup)
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

// restore restores the server to the specified backup.
// It assumes the server is already stopped.
func restore(m *Server, backup string) error {
	fmt.Fprintf(m.Logger, "Restoring server to backup: %s\n", backup)

	if err := os.RemoveAll(m.dir + "/server/worlds"); err != nil {
		return err
	}

	source, err := os.Open(m.dir + "/backups/" + backup)
	if err != nil {
		return err
	}
	defer source.Close()

	gr, err := gzip.NewReader(source)
	if err != nil {
		return err
	}
	defer gr.Close()

	tr := tar.NewReader(gr)

	for {
		header, err := tr.Next()

		if err == io.EOF {
			// No more files to extract
			return nil
		} else if err != nil {
			return err
		}

		path := filepath.Join(m.dir, "server", header.Name)
		fmt.Fprintf(m.Logger, "Creating file: %s\n", path)

		switch header.Typeflag {
		case tar.TypeDir:
			if err = os.MkdirAll(path, 0700); err != nil {
				fmt.Fprintf(m.Logger, "Server restored.")
				return err
			}
		case tar.TypeReg:
			file, err := os.OpenFile(path, os.O_CREATE|os.O_RDWR, os.FileMode(header.Mode))
			if err != nil {
				return err
			}

			if _, err = io.Copy(file, tr); err != nil {
				return err
			}

			file.Close()
		}
	}
}

// backedUpFiles are the files to be backed up in addition to the worlds folder
var backedUpFiles = []string{"server.properties", "allowlist.json", "permissions.json"}

// stoppedBackup creates a backup of the server by copying entire files.
// It assumes that m.mutex is already locked and that the server is stopped.
// On success, it returns the name of the backup file.
func stoppedBackup(m *Server) (string, error) {
	if m.state != Stopped {
		return "", errors.New("server is not stopped")
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
		return "", err
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
			return "", err
		}

		header, err := tar.FileInfoHeader(fileInfo, "")
		if err != nil {
			return "", err
		}

		header.Name = fileName
		if err = tw.WriteHeader(header); err != nil {
			return "", err
		}

		file, err := os.Open(m.dir + "/server/" + fileName)
		if err != nil {
			return "", err
		}
		defer file.Close()

		if _, err = io.Copy(tw, file); err != nil {
			return "", err
		}
	}

	err = filepath.Walk(m.dir+"/server/worlds", func(fileName string, fileInfo os.FileInfo, err error) error {
		if err != nil {
			return err
		}

		if !fileInfo.Mode().IsRegular() && !fileInfo.IsDir() {
			return nil // Ignore non regular files, unless they are directories
		}

		relativePath, err := filepath.Rel(m.dir+"/server", fileName)
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

		if fileInfo.IsDir() {
			return nil // Directories only need headers
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
	if err != nil {
		return "", err
	}

	fmt.Fprintf(m.Logger, "Backup created: %s\n", name)

	return name, nil
}

// runningBackup creates a backup of a running server using `save hold`, `save query`, and `save resume`.
// It assumes that m.mutex is already locked and that the server is running.
// On success, it returns the name of backup file.
func runningBackup(m *Server) (string, error) {
	if m.state != Running {
		return "", errors.New("server is not running")
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
		return "", err
	}
	defer backupFile.Close()

	gw := gzip.NewWriter(backupFile)
	defer gw.Close()

	tw := tar.NewWriter(gw)
	defer tw.Close()

	for _, fileName := range backedUpFiles {
		fileInfo, err := os.Stat(m.dir + "/server/" + fileName)
		if err != nil {
			return "", err
		}

		header, err := tar.FileInfoHeader(fileInfo, "")
		if err != nil {
			return "", err
		}

		header.Name = fileName
		if err = tw.WriteHeader(header); err != nil {
			return "", err
		}

		file, err := os.Open(m.dir + "/server/" + fileName)
		if err != nil {
			return "", err
		}
		defer file.Close()

		if _, err = io.Copy(tw, file); err != nil {
			return "", err
		}
	}

	// We need to traverse the worlds folder to add every subfolder to tar
	err = filepath.Walk(m.dir+"/server/worlds", func(fileName string, fileInfo os.FileInfo, err error) error {
		if err != nil {
			return err
		}

		if !fileInfo.IsDir() {
			return nil // We are only adding directories
		}

		relativePath, err := filepath.Rel(m.dir+"/server", fileName)
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

		return nil
	})
	if err != nil {
		return "", err
	}

	for _, worldFile := range worldFiles {
		// The worldFiles are displayed as file:len
		// The file needs to be truncated to n bytes
		worldFileParts := strings.Split(worldFile, ":")
		if len(worldFileParts) != 2 {
			return "", errors.New("bad filename: " + worldFile)
		}
		fileName := worldFileParts[0]
		fileLen, err := strconv.ParseInt(worldFileParts[1], 10, 64)
		if err != nil {
			return "", err
		}

		fileInfo, err := os.Stat(m.dir + "/server/worlds/" + fileName)
		if err != nil {
			return "", err
		}

		header, err := tar.FileInfoHeader(fileInfo, "")
		if err != nil {
			return "", err
		}

		header.Name = "worlds/" + fileName
		header.Size = fileLen // File will be truncated
		if err = tw.WriteHeader(header); err != nil {
			return "", err
		}

		file, err := os.Open(m.dir + "/server/worlds/" + fileName)
		if err != nil {
			return "", err
		}
		defer file.Close()

		if _, err = io.CopyN(tw, file, fileLen); err != nil {
			return "", err
		}
	}

	io.WriteString(m.stdinPipe, "save resume\n")

	return name, nil
}

// installSoftware installs the latest Minecraft server software.
// It will cache the software and only download when there is a new version.
// Do not call this function while the server is running.
func installSoftware(m *Server) error {
	fmt.Fprintf(m.Logger, "Installing Minecraft server software...\n")

	url, err := GetLinuxDownload()
	if err != nil {
		return err
	}

	segments := strings.Split(url, "/")
	archivePath := "/etc/webmc/cache/" + segments[len(segments)-1]

	_, err = os.Stat(archivePath)
	if os.IsNotExist(err) {
		fmt.Fprintf(m.Logger, "New software version available: %s\n", url)
		fmt.Fprintf(m.Logger, "Downloading...\n")

		client := &http.Client{
			Timeout: 10 * time.Minute,
		}

		req, err := http.NewRequest("GET", url, nil)
		if err != nil {
			return err
		}
		req.Header.Set("User-Agent", "firefox")

		resp, err := client.Do(req)
		if err != nil {
			return err
		}
		defer resp.Body.Close()

		if resp.StatusCode != http.StatusOK {
			return errors.New("could not download server: " + resp.Status)
		}

		filePart, err := os.Create(archivePath+".part")
		if err != nil {
			return err
		}

		const logEveryBytes = 5 * 1024 * 1024 // 5 MB

		buffer := make([]byte, 32*1024) // 32 KB buffer
		var total int64 = 0
		var lastLogged int64 = 0

		for {
			n, err := resp.Body.Read(buffer)
			if n > 0 {
				written, writeErr := filePart.Write(buffer[:n])
				if writeErr != nil {
					return writeErr
				}
				total += int64(written)

				if total-lastLogged >= logEveryBytes {
					fmt.Fprintf(m.Logger, "Downloaded %d MB...\n", total/(1024*1024))
					lastLogged = total
				}
			}

			if err == io.EOF {
				break
			}
			if err != nil {
				return err
			}
		}

		filePart.Close()
		if err = os.Rename(archivePath+".part", archivePath); err != nil {
			return err
		}

		fmt.Fprintf(m.Logger, "Finished downloading. Total size: %d MB\n", total/(1024*1024))
	} else {
		fmt.Fprintf(m.Logger, "Using cache of latest software: %s\n", archivePath)
	}

	fmt.Fprintf(m.Logger, "Extracting...\n")

	archive, err := zip.OpenReader(archivePath)
	if err != nil {
		return err
	}
	defer archive.Close()

	for _, zipFile := range archive.File {
		path := filepath.Join(m.dir, "server", zipFile.Name)

		if zipFile.FileInfo().IsDir() {
			if err = os.MkdirAll(path, 0700); err != nil {
				return err
			}
			continue
		}

		fileInArchive, err := zipFile.Open()
		if err != nil {
			return err
		}

		// In case the files directory does not exist yet
		if err = os.MkdirAll(filepath.Dir(path), 0700); err != nil {
			return err
		}

		file, err := os.OpenFile(path, os.O_CREATE|os.O_RDWR, 0700)
		if err != nil {
			return err
		}

		if _, err := io.Copy(file, fileInArchive); err != nil {
			return err
		}

		fileInArchive.Close()
		file.Close()
	}

	fmt.Fprintf(m.Logger, "Server software installed.\n")
	return nil
}
