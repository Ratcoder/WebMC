package api

import (
	"encoding/json"
	"fmt"
	"net/http"
	"os"
	"strconv"
	"unicode"
)

type Backup struct {
	Time int64  `json:"time"`
	URL  string `json:"url"`
	Size int64  `json:"size"`
}

func (api *API) backupServer(w http.ResponseWriter, r *http.Request) {
	id, ok := canUserManageServer(api, w, r)
	if !ok {
		return
	}

	err := api.serverManager.Servers[id].Backup()
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	fmt.Fprint(w, "Success")
}

func (api *API) getServerBackups(w http.ResponseWriter, r *http.Request) {
	id, ok := canUserManageServer(api, w, r)
	if !ok {
		return
	}

	entries, err := os.ReadDir(api.serverManager.Servers[id].GetDir() + "/backups")
	if err != nil {
		http.Error(w, "Internal server error", http.StatusInternalServerError)
		return
	}

	var backups []Backup

	for _, entry := range entries {
		info, err := entry.Info()
		if err != nil {
			http.Error(w, "Internal server error", http.StatusInternalServerError)
			return
		}

		backup := Backup{
			Size: info.Size(),
			Time: info.ModTime().Unix(),
			URL:  "/api/servers/" + strconv.FormatInt(id, 10) + "/backups/" + info.Name(),
		}

		backups = append(backups, backup)
	}

	buffer, err := json.Marshal(backups)
	if err != nil {
		http.Error(w, "Internal server error", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.Write(buffer)
}

func (api *API) getServerBackup(w http.ResponseWriter, r *http.Request) {
	id, ok := canUserManageServer(api, w, r)
	if !ok {
		return
	}

	backup := r.PathValue("backup")
	if len(backup) == 0 {
		http.Error(w, "Not found", http.StatusNotFound)
		return
	}

	// backup must be sanitized
	for _, r := range backup {
		if unicode.IsDigit(r) || unicode.IsLower(r) || r == '-' || r == '.' || r == ':' {
			// Only these characters are allowed
		} else {
			http.Error(w, "Not found", http.StatusNotFound)
			return
		}
	}

	http.ServeFile(w, r, api.serverManager.Servers[id].GetDir()+"/backups/"+backup)
}

func (api *API) restoreServerBackup(w http.ResponseWriter, r *http.Request) {
	id, ok := canUserManageServer(api, w, r)
	if !ok {
		return
	}

	backup := r.PathValue("backup")
	if len(backup) == 0 {
		http.Error(w, "Not found", http.StatusNotFound)
		return
	}

	// backup must be sanitized
	for _, r := range backup {
		if unicode.IsDigit(r) || unicode.IsLower(r) || r == '-' || r == '.' || r == ':' {
			// Only these characters are allowed
		} else {
			http.Error(w, "Not found", http.StatusNotFound)
			return
		}
	}

	// Make sure backup exists
	_, err := os.Stat(api.serverManager.Servers[id].GetDir() + "/backups/" + backup)
	if os.IsNotExist(err) {
		http.Error(w, "Not found", http.StatusNotFound)
		return
	}

	err = api.serverManager.Servers[id].Restore(backup)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	fmt.Fprint(w, "Success")
}
