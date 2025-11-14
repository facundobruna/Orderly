// src/pages/ConfirmOrderPage.tsx
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { createOrder } from "../api/ordersApi";
import { useAuth } from "../context/AuthContext";
import AppHeader from "../components/AppHeader";

type CartItem = {
    id: string;
    nombre: string;
    cantidad: number;
    precio_unitario: number;
};

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
        try {
            const usuarioID = user.id.toString();

            const payload = {
                negocio_id: negocioId!,
                sucursal_id: sucursalId ?? "1",
                usuario_id: usuarioID,
                mesa: "online",
                observaciones: "",
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

            const successPath =
                sucursalId != null
                    ? `/negocio/${negocioId}/${sucursalId}/confirmado`
                    : `/negocio/${negocioId}/confirmado`;

            navigate(successPath, {
                state: {
                    orderId,
                    items,
                    total,
                },
            });
        } catch (e: any) {
            alert(e?.message ?? "Error creando orden");
        }
    };

    return (
        <div className="app-page">
            <AppHeader />
            <h1>Confirmá tu pedido</h1>

            <h2>Resumen</h2>
            <div className="card" style={{ marginTop: "1rem" }}>
                <ul>
                    {items.map((it) => (
                        <li key={it.id}>
                            {it.cantidad} x {it.nombre} — $
                            {it.precio_unitario.toFixed(2)} c/u
                        </li>
                    ))}
                </ul>

                <p style={{ marginTop: "1rem", fontSize: 18 }}>
                    <b>Total: ${total.toFixed(2)}</b>
                </p>
            </div>

            <div className="cart-footer" style={{ marginTop: "1.5rem" }}>
                <button className="btn-secondary" onClick={() => navigate(backUrl)}>
                    Volver y editar
                </button>

                <button className="btn-primary" onClick={handleConfirm}>
                    Confirmar pedido
                </button>
            </div>
        </div>
    );
}
