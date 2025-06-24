package api

import (
	"encoding/json"
	"fmt"
	"golang.org/x/crypto/bcrypt"
	"io"
	"net/http"
)

type addUserRequest struct {
	Username string `json:"username"`
	Password string `json:"password"`
	IsAdmin  bool   `json:"isAdmin"`
}

func (api *API) addUser(w http.ResponseWriter, r *http.Request) {
	// token, err := api.getAccessToken(r)
	// if err != nil || !token.isAdmin {
	// 	http.Error(w, "Unauthorized", http.StatusUnauthorized)
	// 	return
	// }

	body, err := io.ReadAll(r.Body)
	if err != nil {
		http.Error(w, "Internal server error", http.StatusInternalServerError)
		return
	}

	var request addUserRequest
	err = json.Unmarshal(body, &request)
	if err != nil {
		http.Error(w, "Bad request", http.StatusBadRequest)
		return
	}

	if len(request.Username) < 4 || len(request.Password) < 8 {
		http.Error(w, "Bad request", http.StatusBadRequest)
		return
	}

	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(request.Password), 10)
	if err != nil {
		http.Error(w, "Internal server error", http.StatusInternalServerError)
		return
	}

	_, err = api.db.Exec("INSERT INTO users (username, password, is_admin) VALUES (?, ?, ?)", request.Username, hashedPassword, request.IsAdmin)
	if err != nil {
		http.Error(w, "Internal server error", http.StatusInternalServerError)
	}
	// TODO: Send a different error if the username is taken

	w.WriteHeader(http.StatusCreated)
	fmt.Fprint(w, "Created")
}
