package minecraft

import (
	"bytes"
	"sync"
)

type Logger struct {
	buffer      bytes.Buffer
	mutex       sync.Mutex
	subscribers map[int]chan string
	nextId      int
}

func NewLogger() *Logger {
	return &Logger{
		subscribers: make(map[int]chan string),
	}
}

func (l *Logger) Write(p []byte) (n int, err error) {
	l.mutex.Lock()
	l.buffer.Write(p)

	var lines []string
	for {
		line, err := l.buffer.ReadString('\n')
		if err != nil {
			break
		}
		lines = append(lines, line)
	}

	// Make a snapshot of subscribers
	subs := make([]chan string, 0, len(l.subscribers))
	for _, sub := range l.subscribers {
		subs = append(subs, sub)
	}
	l.mutex.Unlock()

	// Now broadcast (no lock held)
	for _, line := range lines {
		for _, sub := range subs {
			select {
			case sub <- line:
			default:
				// Drop if subscriber isn't keeping up
			}
		}
	}

	return len(p), nil
}

func (l *Logger) Subscribe() (int, <-chan string) {
	l.mutex.Lock()
	defer l.mutex.Unlock()

	id := l.nextId
	l.nextId++

	ch := make(chan string, 100)
	l.subscribers[id] = ch
	return id, ch
}

func (l *Logger) Unsubscribe(id int) {
	l.mutex.Lock()
	defer l.mutex.Unlock()

	if ch, ok := l.subscribers[id]; ok {
		close(ch)
		delete(l.subscribers, id)
	}
}
