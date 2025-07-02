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
	mutex     sync.Mutex
	LogFile   string
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
		return &Server{dir: dir, state: Stopped}, nil
	} else if os.IsNotExist(err) {
		return &Server{dir: dir, state: Empty}, nil
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
	m.cmd.Stdout = file
	m.stdinPipe, err = m.cmd.StdinPipe()
	if err != nil {
		return err
	}

	err = m.cmd.Start()
	if err != nil {
		return err
	}

	go func() {
		err := m.cmd.Wait()
		m.state = Stopped
		if err != nil {
			// Restart if server exits abnormally
			m.Start()
		}
	}()

	m.state = Running
	return nil
}

func (m *Server) Command(command string) error {
	m.mutex.Lock()
	defer m.mutex.Unlock()

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
	m.mutex.Lock()
	defer m.mutex.Unlock()

	if m.state != Running {
		return errors.New("server is already not running")
	}

	_, err := io.WriteString(m.stdinPipe, "stop\n")
	if err != nil {
		return err
	}

	m.cmd.Wait()

	m.state = Stopped
	return nil
}

func (m *Server) Install() error {
	m.mutex.Lock()
	defer m.mutex.Unlock()

	if m.state != Empty {
		return errors.New("minecraft server already installed")
	}

	err := os.Mkdir(m.dir, 0700) // Read/write/execute for owner only
	if err != nil && !os.IsExist(err) {
		return err
	}
	err = os.Mkdir(m.dir+"/server", 0700) // Read/write/execute for owner only
	if err != nil && !os.IsExist(err) {
		return err
	}
	err = os.Mkdir(m.dir+"/logs", 0700) // Read/write/execute for owner only
	if err != nil && !os.IsExist(err) {
		return err
	}
	err = os.Mkdir(m.dir+"/backups", 0700) // Read/write/execute for owner only
	if err != nil && !os.IsExist(err) {
		return err
	}

	uri, err := GetLinuxDownload()
	if err != nil {
		return err
	}
	file := "bedrock-server.zip"

	// TODO: Remove dependence on curl
	cmd := exec.Command("curl", uri, "-A", "firefox", "-o", file)
	err = cmd.Run()
	if err != nil {
		return err
	}

	// TODO: Remove dependence on unzip
	cmd = exec.Command("unzip", file, "-d", m.dir+"/server")
	err = cmd.Run()
	if err != nil {
		return err
	}

	m.state = Stopped
	return nil
}

func (m *Server) Backup() error {
	m.mutex.Lock()
	defer m.mutex.Unlock()

	if m.state != Stopped {
		return errors.New("minecraft server is not stopped")
	}

	name := time.Now().Format("2006-01-02-15:04:05") + ".zip"
	// TODO: Remove dependence on zip
	cmd := exec.Command("zip", "-r", m.dir+"/backups/"+name, "worlds")
	cmd.Dir = m.dir + "/server"
	err := cmd.Run()
	if err != nil {
		return err
	}

	return nil
}

func (m *Server) Restore(backup string) error {
	m.mutex.Lock()
	defer m.mutex.Unlock()

	if m.state != Stopped {
		return errors.New("minecraft server is not stopped")
	}

	// TODO: Remove use of rm
	cmd := exec.Command("rm", "-r", m.dir+"/server/worlds")
	err := cmd.Run()
	if err != nil {
		return err
	}

	// TODO: Remove dependence on unzip
	cmd = exec.Command("unzip", m.dir+"/backups/"+backup, "-d", m.dir+"/server")
	cmd.Dir = m.dir
	err = cmd.Run()
	if err != nil {
		fmt.Println("unzip failed")
		return err
	}

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
