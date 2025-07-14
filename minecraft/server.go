package minecraft

import (
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"os"
	"os/exec"
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

	if m.state != Stopped {
		return errors.New("minecraft server is not stopped")
	}
	m.state = BackingUp

	fmt.Fprintln(m.Logger, "Creating backup...")

	name := time.Now().Format("2006-01-02-15:04:05") + ".zip"
	// TODO: Remove dependence on zip
	cmd := exec.Command("zip", "-r", m.dir+"/backups/"+name, "worlds", "server.properties", "allowlist.json", "permissions.json")
	cmd.Dir = m.dir + "/server"
	cmd.Stdout = m.Logger
	err := cmd.Run()
	if err != nil {
		m.state = Stopped
		fmt.Fprintln(m.Logger, "ERROR: Failed to create backup")
		return err
	}

	fmt.Fprintf(m.Logger, "Backup made at: %s.\n", name)
	m.state = Stopped
	return nil
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
