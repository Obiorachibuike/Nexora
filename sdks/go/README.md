# Nexora Go SDK

Official Go SDK for the Nexora independent infrastructure engine.

## Installation

```bash
go get github.com/Obiorachibuike/Nexora/sdks/go
```

## Quick Start

```go
package main

import (
	"fmt"
	"log"

	"github.com/Obiorachibuike/Nexora/sdks/go"
)

func main() {
	client, err := nexora.NewClient(nexora.Config{
		Host:   "127.0.0.1",
		Port:   6380,
		APIKey: "my-api-key",
	})
	if err != nil {
		log.Fatal(err)
	}
	defer client.Close()

	store := client.Store()
	store.Set("user:101", map[string]string{"name": "Grace Hopper"}, 60000)

	val, err := store.Get("user:101")
	fmt.Println("Retrieved:", val)
}
```
