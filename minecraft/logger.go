package minecraft

import (
	"bytes"
	"errors"
	"sync"
)

const historyCapacity = 1024 * 1014 // 1 megabyte

type Logger struct {
	buffer      bytes.Buffer
	mutex       sync.Mutex
	subscribers map[int]chan string
	nextId      int
	history     [historyCapacity]byte
	historySize int
}

func NewLogger() *Logger {
	return &Logger{
		subscribers: make(map[int]chan string),
	}
}

func (l *Logger) Write(p []byte) (n int, err error) {
	l.mutex.Lock()
	l.buffer.Write(p)

	if l.historySize+len(p) >= historyCapacity {
		if len(p) > historyCapacity {
			return 0, errors.New("out of capacity")
		}
		// Remove aprox. the first half of the history buffer
		// We need to cut at the start of a line, and make enough room for the new data
		newStart := max(len(p), historyCapacity/2)
		for newStart < l.historySize && l.history[newStart] != '\n' {
			newStart++
		}
		if newStart < l.historySize {
			newStart++ // Skip newline
		}
		if newStart > l.historySize {
			newStart = l.historySize
		}
		l.historySize = copy(l.history[:], l.history[newStart:l.historySize])
	}
	l.historySize += copy(l.history[l.historySize:], p)

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

func (l *Logger) SendHistory(id int) {
	l.mutex.Lock()
	defer l.mutex.Unlock()

	if ch, ok := l.subscribers[id]; ok {
		select {
		case ch <- string(l.history[:l.historySize]):
		default:
			// Drop if subscriber isn't keeping up
		}
	}
}
