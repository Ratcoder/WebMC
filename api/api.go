package api

import (
	"database/sql"
	"errors"
	"fmt"
	"net/http"
	"time"

	"github.com/ratcoder/webmc/minecraft"
)

type API struct {
	db            *sql.DB
	tokens        map[string]accessToken
	serverManager *minecraft.Manager
}

type accessToken struct {
	userId  int
	isAdmin bool
	expires time.Time
}

func (api *API) getAccessToken(r *http.Request) (*accessToken, error) {
	cookie, err := r.Cookie("auth")
	if err != nil {
		return nil, err
	}

	token, ok := api.tokens[cookie.Value]
	if !ok {
		return nil, errors.New("user not authenticated")
	}

	return &token, nil
}

func New(db *sql.DB, m *minecraft.Manager) API {
	return API{db: db, serverManager: m, tokens: make(map[string]accessToken)}
}

func (api *API) Start() error {
	fs := http.FileServer(http.Dir("public"))
	http.Handle("/", fs)

	http.HandleFunc("GET /api/ping", api.ping)
	http.HandleFunc("POST /api/login", api.login)
	http.HandleFunc("POST /api/users", api.addUser)
	// TODO: DELETE /api/users/{id}
	// TODO: Change password
	http.HandleFunc("POST /api/servers", api.createServer)
	// TODO: DELETE /api/servers/{id}
	http.HandleFunc("POST /api/servers/{id}/start", api.startServer)
	http.HandleFunc("POST /api/servers/{id}/stop", api.stopServer)
	http.HandleFunc("POST /api/servers/{id}/install", api.installServer)
	http.HandleFunc("POST /api/servers/{id}/backup", api.backupServer)
	http.HandleFunc("POST /api/servers/{id}/command", api.commandServer)
	http.HandleFunc("GET /api/servers/{id}/logs", api.getServerLogs)
	// TODO: POST   /api/servers/{id}/update
	// TODO: GET    /api/servers/{id}/backups
	// TODO: GET    /api/servers/{id}/backups/{backup}
	// TODO: POST   /api/servers/{id}/backups/{backup}/restore
	// TODO: Edit/upload/delete server files

	return http.ListenAndServe(":8080", nil)
}

func (api *API) ping(w http.ResponseWriter, r *http.Request) {
	fmt.Fprintf(w, "pong")
}
