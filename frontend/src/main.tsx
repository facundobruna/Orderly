// src/main.tsx
import "./index.css";

import React from "react";
import ReactDOM from "react-dom/client";
import { RouterProvider } from "react-router-dom";

import { CartProvider } from "./context/CartContext";
import { AuthProvider } from "./context/AuthContext";
import { NotificationProvider } from "./context/NotificationContext";
import { router } from "./router";

const root = document.getElementById("root");

if (!root) {
    throw new Error("Root element not found");
}

ReactDOM.createRoot(root).render(
    <React.StrictMode>
        <NotificationProvider>
            <AuthProvider>
                <CartProvider>
                    <RouterProvider router={router} />
                </CartProvider>
            </AuthProvider>
        </NotificationProvider>
    </React.StrictMode>
);
