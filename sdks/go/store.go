package nexora

import (
	"encoding/json"
)

type Store struct {
	client *Client
}

func (c *Client) Store() *Store {
	return &Store{client: c}
}

func (s *Store) Set(key string, value interface{}, ttlMs int64) error {
	req := map[string]interface{}{
		"key":    key,
		"value":  value,
	}
	if ttlMs > 0 {
		req["ttl_ms"] = ttlMs
	}
	data, _ := json.Marshal(req)
	_, err := s.client.roundTrip(CmdSet, data)
	return err
}

func (s *Store) Get(key string) (interface{}, error) {
	req := map[string]string{"key": key}
	data, _ := json.Marshal(req)
	res, err := s.client.roundTrip(CmdGet, data)
	if err != nil {
		return nil, err
	}
	var out map[string]interface{}
	json.Unmarshal(res, &out)
	return out["value"], nil
}

func (s *Store) Delete(key string) (bool, error) {
	req := map[string]string{"key": key}
	data, _ := json.Marshal(req)
	res, err := s.client.roundTrip(CmdDel, data)
	if err != nil {
		return false, err
	}
	var out map[string]interface{}
	json.Unmarshal(res, &out)
	return out["deleted"] == true, nil
}
