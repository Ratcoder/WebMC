package minecraft

import (
	"testing"
)

func TestStoppedBackup(t *testing.T) {
	server, err := loadServer("/etc/webmc/servers/1")
	if err != nil {
		t.Errorf("loadServer: %s", err)
		return
	}

	backup, err := stoppedBackup(server)
	if err != nil {
		t.Errorf("stoppedBackup: %s", err)
		return
	}

	if err = server.Restore(backup); err != nil {
		t.Errorf("Restore: %s", err)
		return
	}
}

func TestRunningBackup(t *testing.T) {
	server, err := loadServer("/etc/webmc/servers/1")
	if err != nil {
		t.Errorf("loadServer: %s", err)
		return
	}

	if err = server.Start(); err != nil {
		t.Errorf("Start: %s", err)
		return
	}

	backup, err := runningBackup(server)
	if err != nil {
		t.Errorf("stoppedBackup: %s", err)
		return
	}

	if err = server.Stop(); err != nil {
		t.Errorf("Stop: %s", err)
		return
	}

	for server.GetState() != Stopped {}

	if err = server.Restore(backup); err != nil {
		t.Errorf("Restore: %s", err)
		return
	}
}
