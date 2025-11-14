// src/components/ProductModal.tsx
import { useState } from "react";
import type { Producto, Variante, Modificador } from "../types/products";

interface ProductModalProps {
    product: Producto;
    isOpen: boolean;
    onClose: () => void;
    onAddToCart: (product: Producto, quantity: number, selectedVariants: Variante[], selectedModifiers: Modificador[]) => void;
}

export default function ProductModal({ product, isOpen, onClose, onAddToCart }: ProductModalProps) {
    const [quantity, setQuantity] = useState(1);
    const [selectedVariants, setSelectedVariants] = useState<Variante[]>([]);
    const [selectedModifiers, setSelectedModifiers] = useState<Modificador[]>([]);

    if (!isOpen) return null;

    const handleVariantToggle = (variante: Variante) => {
        setSelectedVariants((prev) => {
            const exists = prev.find((v) => v.nombre === variante.nombre);
            if (exists) {
                return prev.filter((v) => v.nombre !== variante.nombre);
            }
            return [...prev, variante];
        });
    };

    const handleModifierToggle = (modificador: Modificador) => {
        setSelectedModifiers((prev) => {
            const exists = prev.find((m) => m.nombre === modificador.nombre);
            if (exists) {
                return prev.filter((m) => m.nombre !== modificador.nombre);
            }
            return [...prev, modificador];
        });
    };

    const calculateTotal = () => {
        let total = product.precio_base;

        selectedVariants.forEach((v) => {
            total += v.precio_adicional;
        });

        selectedModifiers.forEach((m) => {
            total += m.precio_adicional;
        });

        return total * quantity;
    };

    const handleAddToCart = () => {
        // Validar modificadores obligatorios
        const missingRequired = product.modificadores?.filter(
            (mod) => mod.es_obligatorio && !selectedModifiers.find((sm) => sm.nombre === mod.nombre)
        );

        if (missingRequired && missingRequired.length > 0) {
            alert(`Por favor selecciona: ${missingRequired.map((m) => m.nombre).join(", ")}`);
            return;
        }

        onAddToCart(product, quantity, selectedVariants, selectedModifiers);
        handleClose();
    };

    const handleClose = () => {
        setQuantity(1);
        setSelectedVariants([]);
        setSelectedModifiers([]);
        onClose();
    };

    const hasVariants = product.variantes && product.variantes.length > 0;
    const hasModifiers = product.modificadores && product.modificadores.length > 0;

    return (
        <div className="modal-overlay" onClick={handleClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <button className="modal-close" onClick={handleClose}>
                    ✕
                </button>

                {product.imagen_url && (
                    <img
                        src={product.imagen_url}
                        alt={product.nombre}
                        className="modal-product-image"
                    />
                )}

                <h2 className="modal-title">{product.nombre}</h2>
                <p className="modal-description">{product.descripcion}</p>
                <p className="modal-base-price">
                    Precio base: <b>${product.precio_base.toFixed(2)}</b>
                </p>

                {/* Variantes */}
                {hasVariants && (
                    <div className="modal-section">
                        <h3>Variantes</h3>
                        <div className="options-list">
                            {product.variantes!.map((variante, idx) => (
                                <label key={idx} className="option-item">
                                    <input
                                        type="checkbox"
                                        checked={selectedVariants.some((v) => v.nombre === variante.nombre)}
                                        onChange={() => handleVariantToggle(variante)}
                                    />
                                    <span>{variante.nombre}</span>
                                    {variante.precio_adicional > 0 && (
                                        <span className="option-price">
                                            +${variante.precio_adicional.toFixed(2)}
                                        </span>
                                    )}
                                </label>
                            ))}
                        </div>
                    </div>
                )}

                {/* Modificadores */}
                {hasModifiers && (
                    <div className="modal-section">
                        <h3>Modificadores</h3>
                        <div className="options-list">
                            {product.modificadores!.map((modificador, idx) => (
                                <label key={idx} className="option-item">
                                    <input
                                        type="checkbox"
                                        checked={selectedModifiers.some((m) => m.nombre === modificador.nombre)}
                                        onChange={() => handleModifierToggle(modificador)}
                                    />
                                    <span>
                                        {modificador.nombre}
                                        {modificador.es_obligatorio && (
                                            <span className="required-badge">*Obligatorio</span>
                                        )}
                                    </span>
                                    {modificador.precio_adicional > 0 && (
                                        <span className="option-price">
                                            +${modificador.precio_adicional.toFixed(2)}
                                        </span>
                                    )}
                                </label>
                            ))}
                        </div>
                    </div>
                )}

                {/* Cantidad */}
                <div className="modal-section">
                    <h3>Cantidad</h3>
                    <div className="quantity-selector">
                        <button
                            className="qty-btn"
                            onClick={() => setQuantity(Math.max(1, quantity - 1))}
                        >
                            −
                        </button>
                        <input
                            type="number"
                            min={1}
                            value={quantity}
                            onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                            className="qty-input-modal"
                        />
                        <button className="qty-btn" onClick={() => setQuantity(quantity + 1)}>
                            +
                        </button>
                    </div>
                </div>

                {/* Total y botón */}
                <div className="modal-footer">
                    <div className="modal-total">
                        <b>Total: ${calculateTotal().toFixed(2)}</b>
                    </div>
                    <button className="btn-primary" onClick={handleAddToCart}>
                        Agregar al carrito
                    </button>
                </div>
            </div>
        </div>
    );
}