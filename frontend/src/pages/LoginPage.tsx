import { FormEvent, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useNotification } from "../context/NotificationContext";
import AppHeader from "../components/AppHeader";

export default function LoginPage() {
    const { login, loading, user } = useAuth();
    const { showSuccess, showError } = useNotification();
    const navigate = useNavigate();
    const location = useLocation() as any;

    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState<string | null>(null);

    const from = location.state?.from ?? "/negocio/1/1";

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setError(null);

        try {
            await login({ username, password });
            showSuccess(`Bienvenido de nuevo!`);
            setTimeout(() => {
                navigate(from, { replace: true });
            }, 800);
        } catch (err: any) {
            const errorMsg = err?.message ?? "Error iniciando sesión";
            setError(errorMsg);
            showError(errorMsg);
        }
    };

    return (
        <div className="app-page">
            <AppHeader />

            <div style={{ width: "100%", display: "flex", justifyContent: "center" }}>
                <h1 style={{ textAlign: "center" }}>Iniciar sesión</h1>
            </div>



            <div className="form-card">
                <form onSubmit={handleSubmit}>
                    <div className="form-field">
                        <label>Usuario</label>
                        <input
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            required
                        />
                    </div>

                    <div className="form-field">
                        <label>Contraseña</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>

                    {error && <p className="text-error">{error}</p>}

                    <button
                        type="submit"
                        className="btn-primary"
                        disabled={loading}
                        style={{ width: "100%", marginTop: "0.5rem" }}
                    >
                        {loading ? "Ingresando..." : "Ingresar"}
                    </button>
                </form>

                <p className="text-muted" style={{ marginTop: "1rem" }}>
                    ¿No tenés cuenta?{" "}
                    <button
                        type="button"
                        onClick={() => navigate("/register")}
                        style={{
                            border: "none",
                            background: "none",
                            color: "#f30202",
                            cursor: "pointer",
                            padding: 0,
                            fontWeight: 600,
                        }}
                    >
                        Registrate
                    </button>
                </p>
            </div>
        </div>
    );
}
