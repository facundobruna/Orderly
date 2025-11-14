// src/components/AppHeader.tsx
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function AppHeader() {
    const navigate = useNavigate();
    const { user, logout } = useAuth();
    const { negocioId, sucursalId } = useParams<{
        negocioId: string;
        sucursalId?: string;
    }>();

    const goToMenu = () => {
        if (negocioId) {
            const url =
                sucursalId != null
                    ? `/negocio/${negocioId}/${sucursalId}`
                    : `/negocio/${negocioId}`;
            navigate(url);
        } else {
            // fallback a algún negocio por defecto
            navigate("/negocio/1/1");
        }
    };

    const handleLogout = () => {
        logout();
        navigate("/login");
    };

    return (
        <header className="app-header">
            <div
                className="app-title"
                onClick={goToMenu}
                style={{ cursor: "pointer" }}
            >
                ORDERLY APP
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                {user ? (
                    <>
            <span className="text-muted">
              Hola, <b>{user.nombre}</b>
            </span>
                        <button className="btn-secondary" onClick={handleLogout}>
                            Cerrar sesión
                        </button>
                    </>
                ) : (
                    <>
                        <button
                            className="btn-secondary"
                            onClick={() => navigate("/login")}
                        >
                            Iniciar sesión
                        </button>
                        <button
                            className="btn-primary"
                            onClick={() => navigate("/register")}
                        >
                            Registrarme
                        </button>
                    </>
                )}
            </div>
        </header>
    );
}
