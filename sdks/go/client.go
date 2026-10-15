package nexora

import (
	"encoding/json"
	"fmt"
	"io"
	"net"
	"sync"
	"sync/atomic"
	"time"
)

type Config struct {
	Host    string
	Port    int
	APIKey  string
	Timeout time.Duration
}

type Client struct {
	cfg     Config
	conn    net.Conn
	mu      sync.Mutex
	corrID  uint64
	closed  bool
}

func NewClient(cfg Config) (*Client, error) {
	if cfg.Host == "" {
		cfg.Host = "127.0.0.1"
	}
	if cfg.Port == 0 {
		cfg.Port = 6380
	}
	if cfg.Timeout == 0 {
		cfg.Timeout = 5 * time.Second
	}

	addr := fmt.Sprintf("%s:%d", cfg.Host, cfg.Port)
	conn, err := net.DialTimeout("tcp", addr, cfg.Timeout)
	if err != nil {
		return nil, fmt.Errorf("failed to connect to Nexora: %w", err)
	}

	c := &Client{
		cfg:  cfg,
		conn: conn,
	}

	if cfg.APIKey != "" {
		if err := c.authenticate(cfg.APIKey); err != nil {
			conn.Close()
			return nil, err
		}
	}

	return c, nil
}

func (c *Client) authenticate(apiKey string) error {
	payload, _ := json.Marshal(map[string]string{"api_key": apiKey})
	_, err := c.roundTrip(CmdAuth, payload)
	return err
}

func (c *Client) Ping() (bool, error) {
	res, err := c.roundTrip(CmdPing, []byte("{}"))
	if err != nil {
		return false, err
	}
	var out map[string]interface{}
	json.Unmarshal(res, &out)
	return out["pong"] == true, nil
}

func (c *Client) roundTrip(cmd uint16, payload []byte) ([]byte, error) {
	c.mu.Lock()
	defer c.mu.Unlock()

	cid := atomic.AddUint64(&c.corrID, 1)
	frame := EncodeFrame(MsgRequest, cmd, cid, payload)

	c.conn.SetDeadline(time.Now().Add(c.cfg.Timeout))
	if _, err := c.conn.Write(frame); err != nil {
		return nil, fmt.Errorf("write error: %w", err)
	}

	headerBuf := make([]byte, HeaderLen)
	if _, err := io.ReadFull(c.conn, headerBuf); err != nil {
		return nil, fmt.Errorf("read header error: %w", err)
	}

	_, status, payloadLen, err := DecodeHeader(headerBuf)
	if err != nil {
		return nil, err
	}

	payloadBuf := make([]byte, payloadLen)
	if payloadLen > 0 {
		if _, err := io.ReadFull(c.conn, payloadBuf); err != nil {
			return nil, fmt.Errorf("read payload error: %w", err)
		}
	}

	if status != StatusOk && status != StatusCreated {
		return nil, fmt.Errorf("nexora error (status %d): %s", status, string(payloadBuf))
	}

	return payloadBuf, nil
}

func (c *Client) Close() error {
	c.mu.Lock()
	defer c.mu.Unlock()
	c.closed = true
	if c.conn != nil {
		return c.conn.Close()
	}
	return nil
}
