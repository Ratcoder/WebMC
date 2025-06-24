package main

import (
	"database/sql"
	"fmt"
	"os"

	_ "github.com/mattn/go-sqlite3"
	"github.com/ratcoder/webmc/api"
	"github.com/ratcoder/webmc/minecraft"
)

func main() {
	fmt.Println("Hello world!")

	db, err := OpenDatabase()
	if err != nil {
		fmt.Println(err)
		os.Exit(1)
	}

	serverManager, err := minecraft.NewManager(db)
	if err != nil {
		fmt.Println(err)
		os.Exit(1)
	}

	serverManager.Run()

	api := api.New(db, serverManager)
	err = api.Start()
	if err != nil {
		fmt.Println(err)
		os.Exit(1)
	}
}

func OpenDatabase() (*sql.DB, error) {
	db, err := sql.Open("sqlite3", "/etc/webmc/test.db")
	if err != nil {
		return nil, err
	}

	_, err = db.Exec(`
	CREATE TABLE IF NOT EXISTS users (
		user_id  INTEGER NOT NULL PRIMARY KEY,
		username TEXT NOT NULL UNIQUE,
		password TEXT NOT NULL,
		is_admin INTEGER NOT NULL
	);
	CREATE TABLE IF NOT EXISTS servers (
		server_id  INTEGER NOT NULL PRIMARY KEY,
		name       TEXT NOT NULL,
		owner_id   INTEGER NOT NULL REFERENCES users
	);
	CREATE TABLE IF NOT EXISTS manages (
		user_id   INTEGER NOT NULL REFERENCES users,
		server_id INTEGER NOT NULL REFERENCES servers,
		PRIMARY KEY (user_id, server_id)
	);
	`)
	if err != nil {
		return nil, err
	}

	return db, nil
}
