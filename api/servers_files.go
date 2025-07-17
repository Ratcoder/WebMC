package api

import (
	"io"
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"fmt"
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
		if strings.HasSuffix(r.PathValue("file"), "/") {
			// Trailing slash indicates a directory
			if err := os.MkdirAll(absPath, 0700); err != nil {
				http.Error(w, "Internal server error", http.StatusInternalServerError)
			}

			w.WriteHeader(http.StatusCreated)
			fmt.Fprint(w, "Created")
			return
		}
		// No trailing slash is a normal file
		
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

		fmt.Fprint(w, "OK")
	default:
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
	}
}
