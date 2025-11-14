import { useLocation, useNavigate, useParams } from "react-router-dom";

export default function OrderSuccessPage() {
    const navigate = useNavigate();
    const location = useLocation();
    const { negocioId, sucursalId } = useParams();

    const { orderId, items, total } = (location.state as any) || {};

    const backUrl =
        sucursalId != null
            ? `/negocio/${negocioId}/${sucursalId}`
            : `/negocio/${negocioId}`;

    return (
        <div className="order-success-container">
            <div className="success-icon">✔</div>

            <h1 className="order-success-title">¡Pedido confirmado!</h1>

            <p className="order-success-text">
                Tu orden fue recibida correctamente. Estamos preparando tu pedido 🍽️
            </p>

            <div className="order-success-details">
                <p><b>ID de la orden:</b> {orderId}</p>
                <p><b>Total:</b> ${total?.toFixed(2)}</p>

                <hr style={{ margin: "1rem 0" }} />

                <b>Productos:</b>
                <ul>
                    {items?.map((it: any) => (
                        <li key={it.id}>
                            {it.cantidad} × {it.nombre}
                        </li>
                    ))}
                </ul>
            </div>

            <button className="order-success-back" onClick={() => navigate(backUrl)}>
                Volver al menú
            </button>
        </div>
    );
}
