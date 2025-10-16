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
	// TODO: wiring: solr client, memcached, rabbit consumer, GET /search/products
	log.Println("search-api listening on :8080")
	log.Fatal(http.ListenAndServe(":8080", mux))
}
