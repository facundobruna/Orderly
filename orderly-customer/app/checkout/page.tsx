"use client";

import { useState, useEffect } from "react";
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
  const [orderCreated, setOrderCreated] = useState<{ id: string; numero: string } | null>(null);

  // Redirect to cart if empty - use useEffect to avoid updating Router during render
  useEffect(() => {
    if (items.length === 0 && !orderCreated) {
      router.push("/cart");
    }
  }, [items.length, router, orderCreated]);

  // Redirect to order page after showing success message
  useEffect(() => {
    if (orderCreated) {
      console.log("[CheckoutPage] Pedido creado exitosamente, redirigiendo en 3 segundos...");
      const timer = setTimeout(() => {
        console.log("[CheckoutPage] Redirigiendo a orden:", orderCreated.id);
        router.push(`/orden/${orderCreated.id}?success=true`);
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [orderCreated, router]);

  // Don't render if cart is empty
  if (items.length === 0) {
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
      console.log("[CheckoutPage] Iniciando creación de orden...");
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

      console.log("[CheckoutPage] Datos de orden:", ordenData);
      const orden = await ordersApi.createOrder(ordenData);
      console.log("[CheckoutPage] Orden creada:", orden);

      // Si es división de cuenta, crear orden grupal
      if (splitEnabled && numPersonas > 1) {
        console.log("[CheckoutPage] Creando orden grupal para", numPersonas, "personas");
        await ordersApi.createGroupOrder({
          orden_id: orden.id,
          divisiones: numPersonas,
        });
      }

      // Si es Mercado Pago, redirigir al checkout
      if (paymentMethod === "mercadopago") {
        console.log("[CheckoutPage] Método de pago: Mercado Pago");
        // TODO: Integrar con payments-api para obtener preference_id
        // y renderizar el checkout de MP
        alert("Integración con Mercado Pago en proceso...");
      }

      // Limpiar carrito
      console.log("[CheckoutPage] Limpiando carrito...");
      clearCart();

      // Mostrar mensaje de éxito y preparar redirección
      console.log("[CheckoutPage] Mostrando confirmación de pedido exitoso");
      setOrderCreated({
        id: orden.id,
        numero: orden.id.slice(-8),
      });
    } catch (err: any) {
      console.error("[CheckoutPage] Error al crear orden:", err);
      console.error("[CheckoutPage] Error response:", err.response?.data);
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

  // Show success message after order is created
  if (orderCreated) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="container mx-auto px-4 py-12">
          <Card className="max-w-2xl mx-auto">
            <CardContent className="pt-12 pb-12 text-center">
              <div className="mb-6">
                <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-green-100 mb-4">
                  <svg
                    className="w-12 h-12 text-green-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
              </div>
              <h1 className="text-3xl font-bold text-green-600 mb-4">
                ¡Pedido Realizado con Éxito!
              </h1>
              <p className="text-xl text-gray-700 mb-2">
                Tu pedido #{orderCreated.numero} ha sido confirmado
              </p>
              <p className="text-gray-600 mb-8">
                Serás redirigido automáticamente a la página de seguimiento en unos segundos...
              </p>
              <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                <span>Redirigiendo...</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

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
                  {impuestos > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Impuestos</span>
                      <span>{formatCurrency(impuestos)}</span>
                    </div>
                  )}
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
