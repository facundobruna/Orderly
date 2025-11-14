// src/pages/HomePage.tsx

import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { listProducts, searchProductsSolr } from "../api/productsApi";
import { getNegocioById } from "../api/negociosApi";
import type { Producto } from "../types/products";
import type { Negocio } from "../api/negociosApi";
import AppHeader from "../components/AppHeader";

type QuantityById = Record<string, number>;

export default function HomePage() {
    const { negocioId, sucursalId } = useParams<{
        negocioId: string;
        sucursalId?: string;
    }>();

    const navigate = useNavigate();

    const [products, setProducts] = useState<Producto[]>([]);
    const [negocio, setNegocio] = useState<Negocio | null>(null);
    const [qtyById, setQtyById] = useState<QuantityById>({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // 🔎 estados de búsqueda
    const [searchInput, setSearchInput] = useState("");
    const [searchFilter, setSearchFilter] = useState("");

    // ============================
    // 🔹 Cargar negocio + productos
    // ============================
    useEffect(() => {
        if (!negocioId) {
            setError("No se indicó el negocio en la URL");
            setLoading(false);
            return;
        }

        async function load() {
            try {
                setLoading(true);
                setError(null);

                // 1) Negocio (SQL)
                const dataNegocio = await getNegocioById(negocioId!);
                setNegocio(dataNegocio);

                // 2) Productos
                if (searchFilter.trim() !== "") {
                    // 👉 cuando hay búsqueda, usar Solr
                    const resultados = await searchProductsSolr({
                        q: searchFilter,
                        negocio_id: negocioId!,
                        // si querés filtrar por sucursal en Solr y lo tenés indexado como ID:
                        // sucursal_id: sucursalId,
                    });
                    setProducts(resultados);
                } else {
                    // 👉 sin búsqueda: usar Mongo paginado normal
                    const dataProducts = await listProducts({
                        negocio_id: negocioId!,
                        // sucursal_id: sucursalId,
                        page: 1,
                        limit: 50,
                    });
                    setProducts(dataProducts.results);
                }
            } catch (e: any) {
                setError(e?.message ?? "Error cargando datos");
            } finally {
                setLoading(false);
            }
        }

        load();
    }, [negocioId, sucursalId, searchFilter]);

    const handleChangeQty = (productId: string, value: string) => {
        const n = Number(value);
        if (Number.isNaN(n) || n < 0) return;

        setQtyById((prev) => ({
            ...prev,
            [productId]: n,
        }));
    };

    const total = products.reduce((acc, p) => {
        const qty = qtyById[p.id] ?? 0;
        return acc + qty * p.precio_base;
    }, 0);

    const handleGoToConfirm = () => {
        const seleccionados = products
            .map((p) => ({
                id: p.id,
                nombre: p.nombre,
                precio_unitario: p.precio_base,
                cantidad: qtyById[p.id] ?? 0,
            }))
            .filter((x) => x.cantidad > 0);

        if (seleccionados.length === 0) {
            alert("No seleccionaste ningún producto");
            return;
        }

        navigate("confirmar", {
            state: {
                items: seleccionados,
                total,
            },
        });
    };

    // enviar búsqueda
    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setSearchFilter(searchInput.trim());
    };

    const handleClearSearch = () => {
        setSearchInput("");
        setSearchFilter("");
    };

    if (loading)
        return (
            <div className="app-page">
                <AppHeader />
                <p>Cargando...</p>
            </div>
        );

    if (error)
        return (
            <div className="app-page">
                <AppHeader />
                <p className="text-error">{error}</p>
            </div>
        );

    return (
        <div className="app-page">
            <AppHeader />

            {negocio && (
                <div style={{ marginBottom: "0.5rem" }}>
                    <h1 style={{ marginBottom: 4 }}>
                        {negocio.nombre}
                        {negocio.sucursal ? ` – ${negocio.sucursal}` : ""}
                    </h1>
                    <p style={{ margin: 0, color: "#777", fontSize: 14 }}>
                        Estás haciendo un pedido en este local
                    </p>
                </div>
            )}

            {/* 🔎 Barra de búsqueda (usa Solr) */}
            <form className="search-bar" onSubmit={handleSearchSubmit}>
                <input
                    className="search-input"
                    type="text"
                    placeholder="Buscar en el menú (ej: pizza, hamburguesa, café)..."
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                />
                <button type="submit" className="search-button">
                    Buscar
                </button>
                {searchFilter && (
                    <button
                        type="button"
                        className="search-clear"
                        onClick={handleClearSearch}
                    >
                        Limpiar
                    </button>
                )}
            </form>

            <h2 style={{ marginTop: "0.5rem" }}>Menú</h2>

            {products.length === 0 && (
                <p>
                    No hay productos que coincidan con la búsqueda
                    {searchFilter ? ` “${searchFilter}”` : ""}.
                </p>
            )}

            {/* GRID */}
            <div className="product-grid">
                {products.map((p) => (
                    <div className="product-card" key={p.id}>
                        {p.imagen_url && (
                            <img
                                src={p.imagen_url}
                                alt={p.nombre}
                                className="product-image"
                            />
                        )}

                        <h3>{p.nombre}</h3>
                        <p className="product-description">{p.descripcion}</p>

                        <p className="product-price">
                            <b>${p.precio_base.toFixed(2)}</b>
                        </p>

                        <div className="qty-selector">
                            <label>
                                Cantidad:{" "}
                                <input
                                    type="number"
                                    min={0}
                                    value={qtyById[p.id] ?? 0}
                                    onChange={(e) => handleChangeQty(p.id, e.target.value)}
                                    className="qty-input"
                                />
                            </label>
                        </div>
                    </div>
                ))}
            </div>

            {/* FOOTER */}
            <div className="cart-footer">
                <div className="cart-total">
                    <b>Total:</b> ${total.toFixed(2)}
                </div>

                <button
                    disabled={total === 0}
                    className={`btn-primary ${total === 0 ? "btn-disabled" : ""}`}
                    onClick={handleGoToConfirm}
                >
                    Confirmar pedido
                </button>
            </div>
        </div>
    );
}
