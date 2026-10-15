package nexora

import (
	"encoding/json"
)

type Queue struct {
	client *Client
	name   string
}

func (c *Client) Queue(name string) *Queue {
	if name == "" {
		name = "default"
	}
	return &Queue{client: c, name: name}
}

func (q *Queue) Add(name string, payload interface{}, priority int) (map[string]interface{}, error) {
	req := map[string]interface{}{
		"queue":    q.name,
		"name":     name,
		"payload":  payload,
		"priority": priority,
	}
	data, _ := json.Marshal(req)
	res, err := q.client.roundTrip(CmdQueueAdd, data)
	if err != nil {
		return nil, err
	}
	var out map[string]interface{}
	json.Unmarshal(res, &out)
	return out["job"].(map[string]interface{}), nil
}
