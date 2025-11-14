// src/pages/HomePage.tsx

import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { listProducts, searchProductsSolr } from "../api/productsApi";
import { getNegocioById } from "../api/negociosApi";
import type { Producto, Variante, Modificador } from "../types/products";
import type { Negocio } from "../api/negociosApi";
import type { CartItem } from "../types/cart";
import AppHeader from "../components/AppHeader";
import ProductModal from "../components/ProductModal";

export default function HomePage() {
    const { negocioId, sucursalId } = useParams<{
        negocioId: string;
        sucursalId?: string;
    }>();

    const navigate = useNavigate();

    const [products, setProducts] = useState<Producto[]>([]);
    const [negocio, setNegocio] = useState<Negocio | null>(null);
    const [cartItems, setCartItems] = useState<CartItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Modal state
    const [selectedProduct, setSelectedProduct] = useState<Producto | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    // 🔎 estados de búsqueda
    const [searchInput, setSearchInput] = useState("");
    const [searchFilter, setSearchFilter] = useState("");

    // Cargar negocio + productos
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

                const dataNegocio = await getNegocioById(negocioId!);
                setNegocio(dataNegocio);

                if (searchFilter.trim() !== "") {
                    const resultados = await searchProductsSolr({
                        q: searchFilter,
                        negocio_id: negocioId!,
                    });
                    setProducts(resultados);
                } else {
                    const dataProducts = await listProducts({
                        negocio_id: negocioId!,
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

    const handleOpenModal = (product: Producto) => {
        setSelectedProduct(product);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setSelectedProduct(null);
    };

    const handleAddToCart = (
        product: Producto,
        quantity: number,
        selectedVariants: Variante[],
        selectedModifiers: Modificador[]
    ) => {
        // Calcular precio total con variantes y modificadores
        let precioTotal = product.precio_base;

        selectedVariants.forEach((v) => {
            precioTotal += v.precio_adicional;
        });

        selectedModifiers.forEach((m) => {
            precioTotal += m.precio_adicional;
        });

        const newItem: CartItem = {
            id: product.id,
            nombre: product.nombre,
            precio_base: product.precio_base,
            cantidad: quantity,
            variantes: selectedVariants,
            modificadores: selectedModifiers,
            precio_total: precioTotal,
        };

        setCartItems((prev) => [...prev, newItem]);
    };

    const handleRemoveFromCart = (index: number) => {
        setCartItems((prev) => prev.filter((_, i) => i !== index));
    };

    const total = cartItems.reduce((acc, item) => acc + item.precio_total * item.cantidad, 0);

    const handleGoToConfirm = () => {
        if (cartItems.length === 0) {
            alert("No seleccionaste ningún producto");
            return;
        }

        navigate("confirmar", {
            state: {
                items: cartItems,
                total,
            },
        });
    };

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

            {/* Barra de búsqueda */}
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
                    {searchFilter ? ` "${searchFilter}"` : ""}.
                </p>
            )}

            {/* GRID de productos */}
            <div className="menu-grid">
                {products.map((p) => (
                    <div className="product-card" key={p.id}>
                        {p.imagen_url && (
                            <img
                                src={p.imagen_url}
                                alt={p.nombre}
                                style={{
                                    width: "100%",
                                    borderRadius: "14px",
                                    objectFit: "cover",
                                    maxHeight: "150px",
                                }}
                            />
                        )}

                        <h3 className="product-title">{p.nombre}</h3>
                        <p className="product-description">{p.descripcion}</p>

                        <p className="product-price">
                            <b>${p.precio_base.toFixed(2)}</b>
                        </p>

                        {(p.variantes?.length || p.modificadores?.length) && (
                            <p style={{ fontSize: "0.75rem", color: "#666", marginTop: "0.25rem" }}>
                                Personalizable
                            </p>
                        )}

                        <button
                            className="btn-primary"
                            style={{ width: "100%", marginTop: "0.5rem" }}
                            onClick={() => handleOpenModal(p)}
                            disabled={!p.disponible}
                        >
                            {p.disponible ? "Agregar" : "No disponible"}
                        </button>
                    </div>
                ))}
            </div>

            {/* Carrito */}
            {cartItems.length > 0 && (
                <div className="card" style={{ marginTop: "1.5rem" }}>
                    <h3>Carrito ({cartItems.length} items)</h3>
                    <ul style={{ listStyle: "none", padding: 0 }}>
                        {cartItems.map((item, idx) => (
                            <li
                                key={idx}
                                style={{
                                    padding: "0.75rem",
                                    borderBottom: "1px solid #eee",
                                    display: "flex",
                                    justifyContent: "space-between",
                                    alignItems: "flex-start",
                                }}
                            >
                                <div style={{ flex: 1 }}>
                                    <b>
                                        {item.cantidad} x {item.nombre}
                                    </b>
                                    {item.variantes.length > 0 && (
                                        <p style={{ margin: "0.25rem 0", fontSize: "0.85rem", color: "#666" }}>
                                            Variantes: {item.variantes.map((v) => v.nombre).join(", ")}
                                        </p>
                                    )}
                                    {item.modificadores.length > 0 && (
                                        <p style={{ margin: "0.25rem 0", fontSize: "0.85rem", color: "#666" }}>
                                            Modificadores:{" "}
                                            {item.modificadores.map((m) => m.nombre).join(", ")}
                                        </p>
                                    )}
                                    <p style={{ margin: "0.25rem 0", fontSize: "0.9rem" }}>
                                        ${item.precio_total.toFixed(2)} c/u
                                    </p>
                                </div>
                                <button
                                    className="btn-secondary"
                                    onClick={() => handleRemoveFromCart(idx)}
                                    style={{ padding: "0.25rem 0.75rem", fontSize: "0.85rem" }}
                                >
                                    Eliminar
                                </button>
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            {/* FOOTER */}
            <div className="cart-footer">
                <div className="cart-total">
                    <b>Total:</b> ${total.toFixed(2)}
                </div>

                <button
                    disabled={total === 0}
                    className="btn-primary"
                    onClick={handleGoToConfirm}
                    style={{ opacity: total === 0 ? 0.5 : 1 }}
                >
                    Confirmar pedido
                </button>
            </div>

            {/* Modal */}
            {selectedProduct && (
                <ProductModal
                    product={selectedProduct}
                    isOpen={isModalOpen}
                    onClose={handleCloseModal}
                    onAddToCart={handleAddToCart}
                />
            )}
        </div>
    );
}