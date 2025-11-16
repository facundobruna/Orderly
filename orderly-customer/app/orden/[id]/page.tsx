"use client";

import { useParams, useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Clock, CheckCircle2, XCircle, ChefHat, Package } from "lucide-react";
import { Header } from "@/components/shared/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ordersApi } from "@/lib/api";
import { formatCurrency, formatDate } from "@/lib/utils";
import { OrderStatus } from "@/types";

const statusConfig: Record<
  OrderStatus,
  { label: string; icon: any; variant: any; description: string }
> = {
  pendiente: {
    label: "Pendiente",
    icon: Clock,
    variant: "secondary",
    description: "Tu pedido está siendo revisado",
  },
  aceptado: {
    label: "Aceptado",
    icon: CheckCircle2,
    variant: "default",
    description: "Tu pedido ha sido aceptado",
  },
  en_preparacion: {
    label: "En Preparación",
    icon: ChefHat,
    variant: "warning",
    description: "El chef está preparando tu pedido",
  },
  listo: {
    label: "Listo",
    icon: Package,
    variant: "success",
    description: "Tu pedido está listo",
  },
  entregado: {
    label: "Entregado",
    icon: CheckCircle2,
    variant: "success",
    description: "Pedido entregado. ¡Buen provecho!",
  },
  cancelado: {
    label: "Cancelado",
    icon: XCircle,
    variant: "destructive",
    description: "Este pedido fue cancelado",
  },
};

export default function OrdenPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const ordenId = params.id as string;
  const isNewOrder = searchParams.get("success") === "true";

  const [showSuccessBanner, setShowSuccessBanner] = useState(isNewOrder);

  console.log("[OrdenPage] Renderizando página de orden:", ordenId);
  if (isNewOrder) {
    console.log("[OrdenPage] Orden recién creada, mostrando banner de bienvenida");
  }

  // Auto-hide success banner after 10 seconds
  useEffect(() => {
    if (showSuccessBanner) {
      const timer = setTimeout(() => {
        setShowSuccessBanner(false);
      }, 10000);
      return () => clearTimeout(timer);
    }
  }, [showSuccessBanner]);

  const {
    data: orden,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["orden", ordenId],
    queryFn: async () => {
      console.log("[OrdenPage] Obteniendo datos de orden:", ordenId);
      try {
        const result = await ordersApi.getOrderById(ordenId);
        console.log("[OrdenPage] Orden obtenida exitosamente:", {
          id: result.id,
          estado: result.estado,
          total: result.total,
          items: result.items.length,
        });
        return result;
      } catch (err) {
        console.error("[OrdenPage] Error al obtener orden:", err);
        throw err;
      }
    },
    refetchInterval: 10000, // Refetch every 10 seconds
    onSuccess: (data) => {
      console.log("[OrdenPage] Orden actualizada - Estado:", data.estado);
    },
  });

  if (isLoading) {
    console.log("[OrdenPage] Cargando orden...");
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="container mx-auto px-4 py-12">
          <div className="text-center">
            <p className="text-muted-foreground">Cargando pedido...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !orden) {
    console.error("[OrdenPage] Error al cargar orden:", error);
    console.log("[OrdenPage] Orden no encontrada o error en la carga");
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="container mx-auto px-4 py-12">
          <Card className="max-w-md mx-auto">
            <CardContent className="pt-6 text-center">
              <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h2 className="text-xl font-bold mb-2">Pedido no encontrado</h2>
              <p className="text-muted-foreground mb-4">
                No pudimos encontrar este pedido
              </p>
              <Link href="/">
                <Button>Volver al Inicio</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const statusInfo = statusConfig[orden.estado];
  const StatusIcon = statusInfo.icon;

  console.log("[OrdenPage] Mostrando orden:", {
    id: orden.id,
    estado: orden.estado,
    statusLabel: statusInfo.label,
    total: orden.total,
    mesa: orden.mesa,
    pagado: orden.pago.pagado,
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <div className="container mx-auto px-4 py-6">
        <div className="max-w-3xl mx-auto">
          {/* Success Banner for New Orders */}
          {showSuccessBanner && (
            <div className="mb-6 bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-lg p-6 shadow-sm">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                    <CheckCircle2 className="w-6 h-6 text-green-600" />
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-green-900 mb-2">
                    ¡Tu pedido está en camino!
                  </h3>
                  <p className="text-green-800 mb-3">
                    Tu pedido ha sido recibido y enviado a la cocina. Puedes hacer seguimiento del estado en tiempo real desde esta página.
                  </p>
                  <div className="flex items-center gap-2 text-sm text-green-700">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="font-medium">Esta página se actualiza automáticamente cada 10 segundos</span>
                  </div>
                </div>
                <button
                  onClick={() => setShowSuccessBanner(false)}
                  className="flex-shrink-0 text-green-600 hover:text-green-800"
                >
                  <XCircle className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}

          {/* Order Header */}
          <Card className="mb-6">
            <CardContent className="pt-6">
              <div className="text-center mb-6">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary/10 mb-4">
                  <StatusIcon className="h-10 w-10 text-primary" />
                </div>
                <h1 className="text-3xl font-bold mb-2">
                  Pedido #{orden.id.slice(-8)}
                </h1>
                <Badge variant={statusInfo.variant} className="text-lg px-4 py-1">
                  {statusInfo.label}
                </Badge>
                <p className="text-muted-foreground mt-2">
                  {statusInfo.description}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Fecha</p>
                  <p className="font-semibold">{formatDate(orden.created_at)}</p>
                </div>
                {orden.mesa && (
                  <div>
                    <p className="text-muted-foreground">Mesa</p>
                    <p className="font-semibold">#{orden.mesa}</p>
                  </div>
                )}
                <div>
                  <p className="text-muted-foreground">Método de Pago</p>
                  <p className="font-semibold capitalize">{orden.pago.metodo}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Estado de Pago</p>
                  <Badge variant={orden.pago.pagado ? "success" : "secondary"}>
                    {orden.pago.pagado ? "Pagado" : "Pendiente"}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Order Items */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Detalle del Pedido</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {orden.items.map((item, index) => (
                <div
                  key={index}
                  className="flex justify-between items-start border-b last:border-0 pb-4 last:pb-0"
                >
                  <div className="flex-1">
                    <p className="font-semibold">
                      {item.cantidad}x {item.nombre_producto}
                    </p>
                    {item.variante_seleccionada && (
                      <p className="text-sm text-muted-foreground">
                        • {item.variante_seleccionada.nombre}
                      </p>
                    )}
                    {item.modificadores_seleccionados.length > 0 && (
                      <div className="text-sm text-muted-foreground">
                        {item.modificadores_seleccionados.map((mod, i) => (
                          <p key={i}>• {mod.nombre}</p>
                        ))}
                      </div>
                    )}
                    {item.observaciones && (
                      <p className="text-sm text-muted-foreground italic">
                        Nota: {item.observaciones}
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">{formatCurrency(item.subtotal)}</p>
                    <p className="text-sm text-muted-foreground">
                      {formatCurrency(item.subtotal / item.cantidad)} c/u
                    </p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Order Summary */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Resumen</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>{formatCurrency(orden.subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Impuestos</span>
                  <span>{formatCurrency(orden.impuestos)}</span>
                </div>
                <div className="border-t pt-2 mt-2">
                  <div className="flex justify-between text-lg font-bold">
                    <span>Total</span>
                    <span className="text-primary">
                      {formatCurrency(orden.total)}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Observaciones */}
          {orden.observaciones && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Observaciones</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">{orden.observaciones}</p>
              </CardContent>
            </Card>
          )}

          {/* Actions */}
          <div className="flex gap-4">
            <Link href={`/negocio/${orden.negocio_id}`} className="flex-1">
              <Button variant="outline" className="w-full">
                Hacer Otro Pedido
              </Button>
            </Link>
            <Link href="/" className="flex-1">
              <Button className="w-full">Volver al Inicio</Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
