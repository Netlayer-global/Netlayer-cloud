package provider

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"time"
)

// Client is a thin wrapper over the NetLayer REST API. It is shared by all
// resources and data sources so we only authenticate / retry / log in one
// place.
type Client struct {
	apiURL string
	apiKey string
	http   *http.Client
}

func NewClient(apiURL, apiKey string) *Client {
	return &Client{
		apiURL: apiURL,
		apiKey: apiKey,
		http:   &http.Client{Timeout: 30 * time.Second},
	}
}

// Do performs an HTTP request against the NetLayer API. `out` is decoded from
// the `data` field on success; pass nil to ignore the body.
func (c *Client) Do(method, path string, body any, out any) error {
	var buf io.Reader
	if body != nil {
		b, err := json.Marshal(body)
		if err != nil {
			return fmt.Errorf("encode body: %w", err)
		}
		buf = bytes.NewReader(b)
	}

	req, err := http.NewRequest(method, c.apiURL+path, buf)
	if err != nil {
		return err
	}
	req.Header.Set("Authorization", "Bearer "+c.apiKey)
	req.Header.Set("Content-Type", "application/json")

	res, err := c.http.Do(req)
	if err != nil {
		return err
	}
	defer res.Body.Close()

	if res.StatusCode >= 400 {
		var errBody struct {
			Error string `json:"error"`
			Code  string `json:"code"`
		}
		_ = json.NewDecoder(res.Body).Decode(&errBody)
		if errBody.Error != "" {
			return fmt.Errorf("%s %s: %s [%s]", method, path, errBody.Error, errBody.Code)
		}
		return fmt.Errorf("%s %s: HTTP %d", method, path, res.StatusCode)
	}

	if out == nil {
		return nil
	}
	wrapper := struct {
		Data json.RawMessage `json:"data"`
	}{}
	if err := json.NewDecoder(res.Body).Decode(&wrapper); err != nil {
		return fmt.Errorf("decode response: %w", err)
	}
	return json.Unmarshal(wrapper.Data, out)
}
