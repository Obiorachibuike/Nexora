package main

import (
	"fmt"
	"log"

	"github.com/Obiorachibuike/Nexora/sdks/go"
)

func main() {
	client, err := nexora.NewClient(nexora.Config{
		Host: "127.0.0.1",
		Port: 6380,
	})
	if err != nil {
		log.Fatalf("Failed to connect: %v", err)
	}
	defer client.Close()

	fmt.Println("Connected to Nexora from Go Example!")
	store := client.Store()
	store.Set("server:status", "online", 60000)
	val, _ := store.Get("server:status")
	fmt.Printf("Key retrieved: %v\n", val)
}
