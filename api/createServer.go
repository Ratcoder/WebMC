package api

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
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
