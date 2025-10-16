CREATE DATABASE IF NOT EXISTS users_db;
USE users_db;


CREATE TABLE IF NOT EXISTS users (
                                     id BIGINT PRIMARY KEY AUTO_INCREMENT,
                                     email VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    role ENUM('normal','admin') NOT NULL DEFAULT 'normal',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    );


INSERT INTO users (email, username, password_hash, role)
VALUES ('admin@example.com','admin','$2y$10$5g6q3KXb3o3Vf3hH1xC9pO2WwqjR6pSP7o7qk6Gm5l8q9nT0oZ3e2','admin');