"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { ShoppingBag } from "lucide-react";
import { Header } from "@/components/shared/Header";
import { CartItem } from "@/components/cart/CartItem";
import { CartSummary } from "@/components/cart/CartSummary";
import { Button } from "@/components/ui/button";
import { useCartStore } from "@/lib/store/cartStore";

export default function CartPage() {
  const router = useRouter();
  const {
    items,
    updateQuantity,
    removeItem,
    getSubtotal,
    getImpuestos,
    getTotal,
    negocio_id,
  } = useCartStore();

  const handleCheckout = () => {
    router.push("/checkout");
  };

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="container mx-auto px-4 py-12">
          <div className="max-w-md mx-auto text-center">
            <div className="bg-white rounded-lg p-12 shadow-sm">
              <ShoppingBag className="h-24 w-24 mx-auto text-muted-foreground mb-4" />
              <h2 className="text-2xl font-bold mb-2">Tu carrito está vacío</h2>
              <p className="text-muted-foreground mb-6">
                Agrega productos para empezar tu pedido
              </p>
              <Link href="/">
                <Button size="lg">Ver Negocios</Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <div className="container mx-auto px-4 py-6">
        <h1 className="text-3xl font-bold mb-6">Tu Carrito</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            {items.map((item) => (
              <CartItem
                key={item.id}
                item={item}
                onUpdateQuantity={updateQuantity}
                onRemove={removeItem}
              />
            ))}
          </div>

          {/* Cart Summary */}
          <div className="lg:col-span-1">
            <CartSummary
              subtotal={getSubtotal()}
              impuestos={getImpuestos()}
              total={getTotal()}
              onCheckout={handleCheckout}
            />

            <div className="mt-4">
              <Link href={`/negocio/${negocio_id}`}>
                <Button variant="outline" className="w-full">
                  Seguir Comprando
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
