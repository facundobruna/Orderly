"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { Clock, CheckCircle2, XCircle, ChefHat, Package, Receipt } from "lucide-react";
import { Header } from "@/components/shared/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ordersApi } from "@/lib/api";
import { useAuthStore } from "@/lib/store/authStore";
import { formatCurrency, formatDate } from "@/lib/utils";
import { OrderStatus, Orden } from "@/types";
import { useApiError } from "@/lib/hooks/useApiError";

const statusConfig: Record<
  OrderStatus,
  { label: string; icon: any; variant: any; color: string }
> = {
  pendiente: {
    label: "Pendiente",
    icon: Clock,
    variant: "secondary",
    color: "text-gray-600",
  },
  aceptado: {
    label: "Aceptado",
    icon: CheckCircle2,
    variant: "default",
    color: "text-burgundy-600",
  },
  en_preparacion: {
    label: "En Preparación",
    icon: ChefHat,
    variant: "warning",
    color: "text-orange-600",
  },
  listo: {
    label: "Listo",
    icon: Package,
    variant: "success",
    color: "text-green-600",
  },
  entregado: {
    label: "Entregado",
    icon: CheckCircle2,
    variant: "success",
    color: "text-green-600",
  },
  cancelado: {
    label: "Cancelado",
    icon: XCircle,
    variant: "destructive",
    color: "text-red-600",
  },
};

function OrderCard({ orden }: { orden: Orden }) {
  const statusInfo = statusConfig[orden.estado];
  const StatusIcon = statusInfo.icon;

  return (
    <Link href={`/orden/${orden.id}`}>
      <Card className="hover:shadow-md transition-shadow cursor-pointer">
        <CardContent className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className={`${statusInfo.color}`}>
                <StatusIcon className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">
                  Pedido #{orden.id.slice(-8)}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {formatDate(orden.created_at)}
                </p>
              </div>
            </div>
            <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
          </div>

          <div className="space-y-2 mb-4">
            <div className="text-sm">
              <span className="text-muted-foreground">Items: </span>
              <span className="font-medium">
                {orden.items?.reduce((sum, item) => sum + item.cantidad, 0) || 0} productos
              </span>
            </div>
            {orden.mesa && (
              <div className="text-sm">
                <span className="text-muted-foreground">Mesa: </span>
                <span className="font-medium">#{orden.mesa}</span>
              </div>
            )}
            {orden.pago && (
              <div className="text-sm">
                <span className="text-muted-foreground">Pago: </span>
                <Badge variant={orden.pago.pagado ? "success" : "secondary"} className="text-xs">
                  {orden.pago.pagado ? "Pagado" : "Pendiente"}
                </Badge>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between pt-4 border-t">
            <span className="text-2xl font-bold text-primary">
              {formatCurrency(orden.total)}
            </span>
            <Button variant="ghost" size="sm">
              Ver Detalles →
            </Button>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

export default function MisOrdenesPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();
  const [mounted, setMounted] = useState(false);
  const { handleError } = useApiError({ context: "MisOrdenesPage" });

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && !isAuthenticated()) {
      router.push("/login");
    }
  }, [mounted, isAuthenticated, router]);

  const {
    data: ordenes = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ["user-orders", user?.id_usuario],
    queryFn: async () => {
      if (!user?.id_usuario) {
        console.log("[MisOrdenes] No user ID found");
        return [];
      }
      console.log("[MisOrdenes] Fetching orders for user:", user.id_usuario);
      const orders = await ordersApi.getUserOrders(String(user.id_usuario));
      console.log("[MisOrdenes] Orders received:", orders);
      return orders;
    },
    enabled: !!user?.id_usuario,
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  // Separate active and delivered orders
  const ordenesActivas = ordenes.filter(
    (orden) =>
      orden.estado !== "entregado" && orden.estado !== "cancelado"
  );
  const ordenesCompletadas = ordenes.filter(
    (orden) =>
      orden.estado === "entregado" || orden.estado === "cancelado"
  );

  // Don't render anything until mounted to avoid hydration mismatch
  if (!mounted) {
    return null;
  }

  if (!isAuthenticated()) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="container mx-auto px-4 py-12">
          <div className="text-center">
            <p className="text-muted-foreground">Cargando tus pedidos...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    handleError(error, "No se pudieron cargar tus pedidos. Por favor, intenta nuevamente.");
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="container mx-auto px-4 py-12">
          <Card className="max-w-md mx-auto">
            <CardContent className="pt-6 text-center">
              <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h2 className="text-xl font-bold mb-2">Error al cargar pedidos</h2>
              <p className="text-muted-foreground mb-4">
                No pudimos cargar tus pedidos. Por favor intenta nuevamente.
              </p>
              <Button onClick={() => window.location.reload()}>
                Reintentar
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Page Header */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <Receipt className="h-8 w-8 text-primary" />
              <h1 className="text-3xl font-bold">Mis Pedidos</h1>
            </div>
            <p className="text-muted-foreground">
              Historial completo de tus pedidos
            </p>
          </div>

          {ordenes.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center py-12">
                <Receipt className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h2 className="text-xl font-bold mb-2">No tienes pedidos aún</h2>
                <p className="text-muted-foreground mb-6">
                  Comienza explorando nuestros restaurantes
                </p>
                <Link href="/">
                  <Button>Explorar Negocios</Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <Tabs defaultValue="activas" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="activas" className="relative">
                  Activas
                  {ordenesActivas.length > 0 && (
                    <Badge
                      variant="destructive"
                      className="ml-2 h-5 w-5 flex items-center justify-center p-0 text-xs"
                    >
                      {ordenesActivas.length}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="completadas">
                  Completadas ({ordenesCompletadas.length})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="activas" className="space-y-4">
                {ordenesActivas.length === 0 ? (
                  <Card>
                    <CardContent className="pt-6 text-center py-8">
                      <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">
                        No tienes pedidos activos en este momento
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  ordenesActivas.map((orden) => (
                    <OrderCard key={orden.id} orden={orden} />
                  ))
                )}
              </TabsContent>

              <TabsContent value="completadas" className="space-y-4">
                {ordenesCompletadas.length === 0 ? (
                  <Card>
                    <CardContent className="pt-6 text-center py-8">
                      <CheckCircle2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">
                        No tienes pedidos completados aún
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  ordenesCompletadas.map((orden) => (
                    <OrderCard key={orden.id} orden={orden} />
                  ))
                )}
              </TabsContent>
            </Tabs>
          )}
        </div>
      </div>
    </div>
  );
}