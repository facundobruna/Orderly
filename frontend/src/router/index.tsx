// src/router/index.tsx
import { createBrowserRouter } from "react-router-dom";
import HomePage from "../pages/HomePage";
import ConfirmOrderPage from "../pages/ConfirmOrderPage";
import OrderSuccessPage from "../pages/OrderSuccessPage";
import LoginPage from "../pages/LoginPage";
import RegisterPage from "../pages/RegisterPage";

export const router = createBrowserRouter([
    {
        path: "/negocio/:negocioId/:sucursalId?",
        element: <HomePage />,
    },
    {
        path: "/negocio/:negocioId/:sucursalId?/confirmar",
        element: <ConfirmOrderPage />,
    },
    {
        path: "/negocio/:negocioId/:sucursalId?/confirmado",
        element: <OrderSuccessPage />,
    },
    {
        path: "/login",
        element: <LoginPage />,
    },
    {
        path: "/register",
        element: <RegisterPage />,
    },
    {
        path: "*",
        element: (
            <div style={{ padding: "2rem" }}>
                <h1>404</h1>
                <p>Ruta no encontrada</p>
            </div>
        ),
    },
]);
