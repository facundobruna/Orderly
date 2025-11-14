"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/shared/Header";
import { PaymentSelector } from "@/components/checkout/PaymentSelector";
import { SplitPayment } from "@/components/checkout/SplitPayment";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useCartStore } from "@/lib/store/cartStore";
import { useAuthStore } from "@/lib/store/authStore";
import { ordersApi } from "@/lib/api";
import { PaymentMethod, CreateOrdenRequest } from "@/types";
import { formatCurrency } from "@/lib/utils";

export default function CheckoutPage() {
  const router = useRouter();
  const {
    items,
    negocio_id,
    sucursal_id,
    mesa,
    getSubtotal,
    getImpuestos,
    getTotal,
    clearCart,
  } = useCartStore();
  const { user } = useAuthStore();

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("efectivo");
  const [splitEnabled, setSplitEnabled] = useState(false);
  const [numPersonas, setNumPersonas] = useState(2);
  const [observaciones, setObservaciones] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  if (items.length === 0) {
    router.push("/cart");
    return null;
  }

  const handleSplitChange = (personas: number, enabled: boolean) => {
    setNumPersonas(personas);
    setSplitEnabled(enabled);
  };

  const handleSubmitOrder = async () => {
    setIsLoading(true);
    setError("");

    try {
      // Convertir cart items a formato que espera el backend
      const orderItems = items.map((item) => ({
        producto_id: item.producto.id,
        cantidad: item.cantidad,
        variante_nombre: item.variante_seleccionada?.nombre || "",
        modificadores: item.modificadores_seleccionados.map((m) => m.nombre),
      }));

      // Crear orden - convertir a strings como espera el backend
      const ordenData: CreateOrdenRequest = {
        negocio_id: String(negocio_id!),
        sucursal_id: sucursal_id!,
        usuario_id: user?.id_usuario ? String(user.id_usuario) : "0",
        mesa: mesa || "",
        items: orderItems,
        observaciones,
      };

      const orden = await ordersApi.createOrder(ordenData);

      // Si es división de cuenta, crear orden grupal
      if (splitEnabled && numPersonas > 1) {
        await ordersApi.createGroupOrder({
          orden_id: orden.id,
          divisiones: numPersonas,
        });
      }

      // Si es Mercado Pago, redirigir al checkout
      if (paymentMethod === "mercadopago") {
        // TODO: Integrar con payments-api para obtener preference_id
        // y renderizar el checkout de MP
        alert("Integración con Mercado Pago en proceso...");
      }

      // Limpiar carrito
      clearCart();

      // Redirigir a página de orden
      router.push(`/orden/${orden.id}`);
    } catch (err: any) {
      setError(
        err.response?.data?.error || "Error al crear la orden. Intenta nuevamente."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const subtotal = getSubtotal();
  const impuestos = getImpuestos();
  const total = getTotal();

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <div className="container mx-auto px-4 py-6">
        <h1 className="text-3xl font-bold mb-6">Finalizar Pedido</h1>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md mb-6">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Checkout Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Order Details */}
            <Card>
              <CardHeader>
                <CardTitle>Detalle del Pedido</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {items.map((item) => (
                  <div key={item.id} className="flex justify-between text-sm">
                    <div>
                      <span className="font-medium">
                        {item.cantidad}x {item.producto.nombre}
                      </span>
                      {item.variante_seleccionada && (
                        <span className="text-muted-foreground">
                          {" "}
                          - {item.variante_seleccionada.nombre}
                        </span>
                      )}
                    </div>
                    <span className="font-medium">
                      {formatCurrency(item.subtotal)}
                    </span>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Payment Method */}
            <Card>
              <CardHeader>
                <CardTitle>Método de Pago</CardTitle>
              </CardHeader>
              <CardContent>
                <PaymentSelector
                  selectedMethod={paymentMethod}
                  onSelectMethod={setPaymentMethod}
                />
              </CardContent>
            </Card>

            {/* Split Payment */}
            <SplitPayment total={total} onSplitChange={handleSplitChange} />

            {/* Observaciones */}
            <Card>
              <CardHeader>
                <CardTitle>Observaciones (Opcional)</CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  placeholder="Ej: Sin sal, alérgico a..."
                  value={observaciones}
                  onChange={(e) => setObservaciones(e.target.value)}
                  rows={3}
                />
              </CardContent>
            </Card>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <Card className="sticky top-20">
              <CardHeader>
                <CardTitle>Resumen</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span>{formatCurrency(subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Impuestos (10%)</span>
                    <span>{formatCurrency(impuestos)}</span>
                  </div>
                  {mesa && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Mesa</span>
                      <span className="font-semibold">#{mesa}</span>
                    </div>
                  )}
                  {splitEnabled && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">
                        División de cuenta
                      </span>
                      <span className="font-semibold">{numPersonas} personas</span>
                    </div>
                  )}
                  <div className="border-t pt-2 mt-2">
                    <div className="flex justify-between text-lg font-bold">
                      <span>Total</span>
                      <span className="text-primary">
                        {formatCurrency(total)}
                      </span>
                    </div>
                    {splitEnabled && (
                      <div className="text-sm text-muted-foreground text-right">
                        {formatCurrency(total / numPersonas)} por persona
                      </div>
                    )}
                  </div>
                </div>

                <Button
                  className="w-full"
                  size="lg"
                  onClick={handleSubmitOrder}
                  disabled={isLoading}
                >
                  {isLoading ? "Procesando..." : "Confirmar Pedido"}
                </Button>

                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => router.push("/cart")}
                  disabled={isLoading}
                >
                  Volver al Carrito
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
