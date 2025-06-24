package minecraft

import (
	"database/sql"
	"strconv"
)

type Manager struct {
	Servers map[int64]*Server
	root    string
}

// Creates a new Manager and loads every Minecraft server in db
func NewManager(db *sql.DB) (*Manager, error) {
	rows, err := db.Query("SELECT server_id FROM servers;")
	if err != nil {
		return nil, err
	}

	manager := Manager{
		Servers: make(map[int64]*Server),
		root:    "/etc/webmc/servers",
	}

	for rows.Next() {
		var id int64
		err = rows.Scan(&id)
		if err != nil {
			return nil, err
		}

		server, err := loadServer(serverPath(manager.root, id))
		if err != nil {
			return nil, err
		}

		manager.Servers[id] = server
	}
	if rows.Err() != nil {
		return nil, err
	}

	return &manager, nil
}

func (m *Manager) Run() {
	for _, server := range m.Servers {
		server.Start()
	}
}

func (m *Manager) AddServer(id int64) error {
	server, err := loadServer(serverPath(m.root, id))
	if err != nil {
		return err
	}

	m.Servers[id] = server
	return nil
}

func serverPath(root string, id int64) string {
	return root + "/" + strconv.FormatInt(id, 10)
}
