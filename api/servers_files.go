package api

import (
	"io"
	"net/http"
	"os"
	"path/filepath"
)

func (api *API) serversFiles(w http.ResponseWriter, r *http.Request) {
	id, ok := canUserManageServer(api, w, r)
	if !ok {
		return
	}

	serverDir := filepath.Join(api.serverManager.Servers[id].GetDir(), "server")
	path := filepath.Clean(r.PathValue("file"))
	absPath := filepath.Join(serverDir, path)

	switch r.Method {
	case http.MethodGet:
		http.ServeFile(w, r, absPath)
	case http.MethodPut:
		file, err := os.Create(absPath)
		if err != nil {
			http.Error(w, "Internal server error", http.StatusInternalServerError)
			return
		}
		defer file.Close()

		if _, err = io.Copy(file, r.Body); err != nil {
			http.Error(w, "Internal server error", http.StatusInternalServerError)
			return
		}
	default:
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
	}
}
