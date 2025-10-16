package main

import (
	"log"
	"net/http"
)

func main() {
	mux := http.NewServeMux()
	mux.HandleFunc("/healthz", func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
		w.Write([]byte("ok"))
	})
	// TODO: wiring: config, db (GORM), handlers auth/login, users/{id}
	log.Println("users-api listening on :8080")
	log.Fatal(http.ListenAndServe(":8080", mux))
}
