// src/context/CartContext.tsx
import { createContext, useContext, useState, ReactNode } from "react";

export interface CartItem {
    productId: string;
    name: string;
    price: number;
    quantity: number;
}

interface CartContextValue {
    items: CartItem[];
    addItem: (item: CartItem) => void;
    updateQuantity: (productId: string, quantity: number) => void;
    clear: () => void;
    total: number;
}

const CartContext = createContext<CartContextValue | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
    const [items, setItems] = useState<CartItem[]>([]);

    const addItem = (item: CartItem) => {
        setItems((prev) => {
            const existing = prev.find((p) => p.productId === item.productId);
            if (!existing) return [...prev, item];

            return prev.map((p) =>
                p.productId === item.productId
                    ? { ...p, quantity: p.quantity + item.quantity }
                    : p
            );
        });
    };

    const updateQuantity = (productId: string, quantity: number) => {
        setItems((prev) =>
            prev
                .map((p) =>
                    p.productId === productId ? { ...p, quantity } : p
                )
                .filter((p) => p.quantity > 0)
        );
    };

    const clear = () => setItems([]);

    const total = items.reduce(
        (acc, item) => acc + item.price * item.quantity,
        0
    );

    return (
        <CartContext.Provider
            value={{ items, addItem, updateQuantity, clear, total }}
        >
            {children}
        </CartContext.Provider>
    );
}

export function useCart() {
    const ctx = useContext(CartContext);
    if (!ctx) {
        throw new Error("useCart debe usarse dentro de un CartProvider");
    }
    return ctx;
}
