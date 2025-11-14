// src/pages/ConfirmOrderPage.tsx
import { useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { createOrder } from "../api/ordersApi";
import { useAuth } from "../context/AuthContext";
import { useNotification } from "../context/NotificationContext";
import AppHeader from "../components/AppHeader";
import type { CartItem } from "../types/cart";

type LocationState = {
    items: CartItem[];
    total: number;
};

export default function ConfirmOrderPage() {
    const { negocioId, sucursalId } = useParams<{
        negocioId: string;
        sucursalId?: string;
    }>();

    const navigate = useNavigate();
    const location = useLocation();
    const { user } = useAuth();
    const { showSuccess, showError } = useNotification();

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [observaciones, setObservaciones] = useState("");

    const state = location.state as LocationState | null;

    // Si no hay carrito → volver al menú
    if (!state || !state.items?.length) {
        const backUrl =
            sucursalId != null
                ? `/negocio/${negocioId}/${sucursalId}`
                : `/negocio/${negocioId}`;

        return (
            <div className="app-page">
                <AppHeader />
                <h1>Confirmar pedido</h1>
                <p>No hay productos en el carrito.</p>
                <button className="btn-secondary" onClick={() => navigate(backUrl)}>
                    Volver al menú
                </button>
            </div>
        );
    }

    const { items, total } = state;

    // Si NO hay usuario → forzar login
    if (!user) {
        return (
            <div className="app-page">
                <AppHeader />
                <h1>Necesitas iniciar sesión</h1>
                <p>Inicia sesión para confirmar tu pedido.</p>

                <button className="btn-primary" onClick={() => navigate("/login")}>
                    Ir a iniciar sesión
                </button>
            </div>
        );
    }

    const backUrl =
        sucursalId != null
            ? `/negocio/${negocioId}/${sucursalId}`
            : `/negocio/${negocioId}`;

    const handleConfirm = async () => {
        setError(null);
        setLoading(true);

        try {
            const usuarioID = user.id.toString();

            const payload = {
                negocio_id: negocioId!,
                sucursal_id: sucursalId ?? "1",
                usuario_id: usuarioID,
                mesa: "online",
                observaciones: observaciones.trim(),
                items: items.map((it) => ({
                    producto_id: it.id,
                    cantidad: it.cantidad,
                })),
            };

            const created = await createOrder(payload);

            const orderId =
                created?.orden?.id ??
                created?.orden?._id ??
                created?.id ??
                "";

            showSuccess("Pedido creado exitosamente!");

            const successPath =
                sucursalId != null
                    ? `/negocio/${negocioId}/${sucursalId}/confirmado`
                    : `/negocio/${negocioId}/confirmado`;

            setTimeout(() => {
                navigate(successPath, {
                    state: {
                        orderId,
                        items,
                        total,
                    },
                });
            }, 500);
        } catch (e: any) {
            const errorMsg = e?.message ?? "Error creando orden";
            setError(errorMsg);
            showError(errorMsg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="app-page">
            <AppHeader />
            <h1>Confirmá tu pedido</h1>

            <h2>Resumen</h2>
            <div className="card" style={{ marginTop: "1rem" }}>
                <ul style={{ listStyle: "none", padding: 0 }}>
                    {items.map((it, idx) => (
                        <li
                            key={idx}
                            style={{
                                padding: "0.75rem 0",
                                borderBottom: idx < items.length - 1 ? "1px solid #eee" : "none",
                            }}
                        >
                            <div>
                                <b>
                                    {it.cantidad} x {it.nombre}
                                </b>
                            </div>
                            {it.variantes && it.variantes.length > 0 && (
                                <div style={{ fontSize: "0.85rem", color: "#666", marginTop: "0.25rem" }}>
                                    Variantes: {it.variantes.map((v) => v.nombre).join(", ")}
                                </div>
                            )}
                            {it.modificadores && it.modificadores.length > 0 && (
                                <div style={{ fontSize: "0.85rem", color: "#666", marginTop: "0.25rem" }}>
                                    Modificadores: {it.modificadores.map((m) => m.nombre).join(", ")}
                                </div>
                            )}
                            <div style={{ marginTop: "0.25rem", fontSize: "0.9rem" }}>
                                ${it.precio_total.toFixed(2)} c/u ={" "}
                                <b>${(it.precio_total * it.cantidad).toFixed(2)}</b>
                            </div>
                        </li>
                    ))}
                </ul>

                <p style={{ marginTop: "1rem", fontSize: 18 }}>
                    <b>Total: ${total.toFixed(2)}</b>
                </p>
            </div>

            {/* Campo de observaciones */}
            <div style={{ marginTop: "1.5rem" }}>
                <h3>Observaciones (opcional)</h3>
                <textarea
                    value={observaciones}
                    onChange={(e) => setObservaciones(e.target.value)}
                    placeholder="Ej: Sin cebolla, extra queso, etc..."
                    rows={3}
                    style={{
                        width: "100%",
                        padding: "0.75rem",
                        borderRadius: "12px",
                        border: "1px solid #d9d6ff",
                        fontSize: "0.95rem",
                        fontFamily: "inherit",
                        resize: "vertical",
                    }}
                    disabled={loading}
                />
            </div>

            {error && (
                <p className="text-error" style={{ marginTop: "1rem" }}>
                    {error}
                </p>
            )}

            <div className="cart-footer" style={{ marginTop: "1.5rem" }}>
                <button
                    className="btn-secondary"
                    onClick={() => navigate(backUrl)}
                    disabled={loading}
                >
                    Volver y editar
                </button>

                <button
                    className="btn-primary"
                    onClick={handleConfirm}
                    disabled={loading}
                >
                    {loading ? "Creando pedido..." : "Confirmar pedido"}
                </button>
            </div>
        </div>
    );
}
