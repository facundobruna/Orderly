// src/pages/RegisterPage.tsx
import { FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useNotification } from "../context/NotificationContext";
import type { Rol } from "../types/auth";
import AppHeader from "../components/AppHeader";

export default function RegisterPage() {
    const { register, loading } = useAuth();
    const { showSuccess, showError } = useNotification();
    const navigate = useNavigate();

    const [form, setForm] = useState({
        nombre: "",
        apellido: "",
        email: "",
        username: "",
        password: "",
        rol: "cliente" as Rol,
    });

    const [error, setError] = useState<string | null>(null);

    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
    ) => {
        const { name, value } = e.target;
        setForm((f) => ({ ...f, [name]: value }));
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setError(null);

        try {
            await register(form);
            showSuccess(`Cuenta creada exitosamente! Bienvenido ${form.nombre}!`);
            setTimeout(() => {
                navigate("/negocio/1/1", { replace: true });
            }, 1000);
        } catch (err: any) {
            const errorMsg = err?.message ?? "Error registrando usuario";
            setError(errorMsg);
            showError(errorMsg);
        }
    };

    return (
        <div className="app-page">
            <AppHeader />

            <div style={{ width: "100%", display: "flex", justifyContent: "center" }}>
                <h1 style={{ textAlign: "center" }}>Registrarme</h1>
            </div>


            <div className="form-card">
                <form onSubmit={handleSubmit}>
                    <div className="form-field">
                        <label>Nombre</label>
                        <input
                            name="nombre"
                            value={form.nombre}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div className="form-field">
                        <label>Apellido</label>
                        <input
                            name="apellido"
                            value={form.apellido}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div className="form-field">
                        <label>Email</label>
                        <input
                            type="email"
                            name="email"
                            value={form.email}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div className="form-field">
                        <label>Usuario</label>
                        <input
                            name="username"
                            value={form.username}
                            onChange={handleChange}
                            required
                            minLength={3}
                        />
                    </div>

                    <div className="form-field">
                        <label>Contraseña</label>
                        <input
                            type="password"
                            name="password"
                            value={form.password}
                            onChange={handleChange}
                            required
                            minLength={8}
                        />
                    </div>

                    {error && <p className="text-error">{error}</p>}

                    <button
                        type="submit"
                        className="btn-primary"
                        disabled={loading}
                        style={{ width: "100%", marginTop: "0.5rem" }}
                    >
                        {loading ? "Creando cuenta..." : "Registrarme"}
                    </button>
                </form>
            </div>
        </div>
    );
}
