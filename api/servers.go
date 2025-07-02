package api

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strconv"
)

type createServerRequest struct {
	Name string `json:"name"`
}

func (api *API) createServer(w http.ResponseWriter, r *http.Request) {
	token, err := api.getAccessToken(r)
	if err != nil || !token.isAdmin {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	body, err := io.ReadAll(r.Body)
	if err != nil {
		http.Error(w, "Internal server error", http.StatusInternalServerError)
		return
	}

	var request createServerRequest
	err = json.Unmarshal(body, &request)
	if err != nil {
		http.Error(w, "Bad request", http.StatusBadRequest)
		return
	}

	if len(request.Name) < 1 {
		http.Error(w, "Bad request", http.StatusBadRequest)
		return
	}

	result, err := api.db.Exec("INSERT INTO servers (name, owner_id) VALUES (?, ?)", request.Name, token.userId)
	if err != nil {
		http.Error(w, "Internal server error", http.StatusInternalServerError)
		return
	}
	id, err := result.LastInsertId()
	if err != nil {
		http.Error(w, "Internal server error", http.StatusInternalServerError)
		return
	}

	err = api.serverManager.AddServer(id)
	if err != nil {
		http.Error(w, "Internal server error", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusCreated)
	fmt.Fprint(w, "Created")
}

type Server struct {
	ServerId int64  `json:"serverId"`
	OwnerId  int64  `json:"ownerId"`
	Name     string `json:"name"`
	State    string `json:"state"`
}

func (api *API) getServers(w http.ResponseWriter, r *http.Request) {
	token, err := api.getAccessToken(r)
	if err != nil {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	rows, err := api.db.Query("SELECT server_id, owner_id, name FROM servers WHERE owner_id = (?)", token.userId)
	if err != nil {
		http.Error(w, "Internal server error1", http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	var response []Server

	for rows.Next() {
		var server Server
		err = rows.Scan(&server.ServerId, &server.OwnerId, &server.Name)
		if err != nil {
			http.Error(w, "Internal server error", http.StatusInternalServerError)
			return
		}
		server.State = api.serverManager.Servers[server.ServerId].GetState().ToString()

		response = append(response, server)
	}
	if err = rows.Err(); err != nil {
		http.Error(w, "Internal server error", http.StatusInternalServerError)
		return
	}

	buffer, err := json.Marshal(response)
	if err != nil {
		http.Error(w, "JSON encoding error", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.Write(buffer)
}

// canUserManageServer checks if the user is authenticated and allowed to manager the server.
// If the user can, it returns the server id and true.
// Otherwise, it returns 0 and false.
func canUserManageServer(api *API, w http.ResponseWriter, r *http.Request) (int64, bool) {
	token, err := api.getAccessToken(r)
	if err != nil {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return 0, false
	}

	id, err := strconv.ParseInt(r.PathValue("id"), 10, 64)
	if err != nil {
		http.Error(w, "Bad request", http.StatusBadRequest)
		return 0, false
	}

	var ownerId int64
	row := api.db.QueryRow("SELECT owner_id FROM servers WHERE server_id = ?", id)

	err = row.Scan(&ownerId)
	if err == sql.ErrNoRows {
		http.Error(w, "Not found", http.StatusNotFound)
		return id, false
	} else if err != nil {
		http.Error(w, "Internal server error", http.StatusInternalServerError)
		return id, false
	}

	if token.isAdmin {
		return id, true
	}

	if token.userId != int(ownerId) {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return id, false
	}

	return id, true
}

func (api *API) startServer(w http.ResponseWriter, r *http.Request) {
	id, ok := canUserManageServer(api, w, r)
	if !ok {
		return
	}

	err := api.serverManager.Servers[id].Start()
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	fmt.Fprint(w, "Success")
}

func (api *API) stopServer(w http.ResponseWriter, r *http.Request) {
	id, ok := canUserManageServer(api, w, r)
	if !ok {
		return
	}

	err := api.serverManager.Servers[id].Stop()
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	fmt.Fprint(w, "Success")
}

func (api *API) installServer(w http.ResponseWriter, r *http.Request) {
	id, ok := canUserManageServer(api, w, r)
	if !ok {
		return
	}

	err := api.serverManager.Servers[id].Install()
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	fmt.Fprint(w, "Success")
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

func (api *API) commandServer(w http.ResponseWriter, r *http.Request) {
	id, ok := canUserManageServer(api, w, r)
	if !ok {
		return
	}

	body, err := io.ReadAll(r.Body)
	if err != nil {
		http.Error(w, "Bad request", http.StatusBadRequest)
		return
	}

	err = api.serverManager.Servers[id].Command(string(body))
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	fmt.Fprint(w, "Success")
}

func (api *API) getServerLogs(w http.ResponseWriter, r *http.Request) {
	id, ok := canUserManageServer(api, w, r)
	if !ok {
		return
	}

	http.ServeFile(w, r, api.serverManager.Servers[id].LogFile)
}
