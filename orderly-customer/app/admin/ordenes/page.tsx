"use client";

import { useEffect, useState } from "react";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ordersApi, negociosApi } from "@/lib/api";
import { Orden, Negocio } from "@/types";
import { Clock, CheckCircle, XCircle, RefreshCw } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { useToast } from "@/lib/contexts/ToastContext";

const ESTADO_COLORS = {
  pendiente: "bg-yellow-100 text-yellow-800",
  aceptado: "bg-purple-100 text-purple-800",
  en_preparacion: "bg-blue-100 text-blue-800",
  listo: "bg-green-100 text-green-800",
  entregado: "bg-gray-100 text-gray-800",
  cancelado: "bg-red-100 text-red-800",
};

const ESTADO_LABELS = {
  pendiente: "Pendiente",
  aceptado: "Aceptado",
  en_preparacion: "En Preparación",
  listo: "Listo",
  entregado: "Entregado",
  cancelado: "Cancelado",
};

export default function OrdenesPage() {
  const { success, error: showError } = useToast();
  const [ordenes, setOrdenes] = useState<Orden[]>([]);
  const [negocios, setNegocios] = useState<Negocio[]>([]);
  const [selectedNegocio, setSelectedNegocio] = useState<number | null>(null);
  const [filter, setFilter] = useState<string>("activas"); // activas, todas
  const [isLoading, setIsLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    loadNegocios();
  }, []);

  useEffect(() => {
    if (selectedNegocio) {
      loadOrdenes();
    }
  }, [selectedNegocio, filter]);

  const loadNegocios = async () => {
    try {
      console.log("[OrdenesPage] Cargando negocios...");
      const negocios = await negociosApi.getMy();
      console.log("[OrdenesPage] Negocios cargados:", negocios);
      setNegocios(negocios);
      if (negocios.length > 0) {
        setSelectedNegocio(negocios[0].id_negocio);
        console.log("[OrdenesPage] Negocio seleccionado por defecto:", negocios[0].id_negocio);
      }
    } catch (error) {
      console.error("[OrdenesPage] Error loading negocios:", error);
      showError("Error al cargar los negocios", "Error de carga");
    }
  };

  const loadOrdenes = async () => {
    if (!selectedNegocio) {
      console.log("[OrdenesPage] No hay negocio seleccionado");
      return;
    }

    try {
      setIsLoading(true);
      console.log("[OrdenesPage] Cargando órdenes para negocio:", selectedNegocio, "filtro:", filter);
      // API returns Orden[] directly, not paginated
      const ordenesData = await ordersApi.getOrders({ negocio_id: String(selectedNegocio) });
      console.log("[OrdenesPage] Órdenes recibidas:", ordenesData);
      let orders = Array.isArray(ordenesData) ? ordenesData : [];

      // Filter based on selection
      if (filter === "activas") {
        orders = orders.filter(o => !["entregado", "cancelado"].includes(o.estado));
        console.log("[OrdenesPage] Órdenes activas filtradas:", orders.length);
      }

      // Sort by date, newest first
      orders.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      console.log("[OrdenesPage] Órdenes finales:", orders.length, "órdenes");
      setOrdenes(orders);
    } catch (error) {
      console.error("[OrdenesPage] Error loading ordenes:", error);
      showError("Error al cargar las órdenes", "Error de carga");
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateStatus = async (ordenId: string, nuevoEstado: string) => {
    try {
      setUpdatingId(ordenId);
      console.log("[OrdenesPage] Actualizando estado de orden:", ordenId, "a:", nuevoEstado);
      await ordersApi.updateOrderStatus(ordenId, { nuevo_estado: nuevoEstado });
      console.log("[OrdenesPage] Estado actualizado exitosamente");
      setOrdenes(ordenes.map(o => o.id === ordenId ? { ...o, estado: nuevoEstado } : o));
      success(`Estado actualizado a "${ESTADO_LABELS[nuevoEstado as keyof typeof ESTADO_LABELS]}"`, "Estado actualizado");
    } catch (error) {
      console.error("[OrdenesPage] Error updating order status:", error);
      showError("Error al actualizar el estado de la orden", "Error");
    } finally {
      setUpdatingId(null);
    }
  };

  const getNextStatus = (currentStatus: string): string | null => {
    const statusFlow: Record<string, string> = {
      pendiente: "aceptado",
      aceptado: "en_preparacion",
      en_preparacion: "listo",
      listo: "entregado",
    };
    return statusFlow[currentStatus] || null;
  };

  return (
    <div>
      <AdminHeader
        title="Órdenes"
        subtitle="Gestiona los pedidos de tus clientes"
      />

      <div className="p-8">
        <div className="flex flex-col gap-4 mb-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <label className="text-sm font-medium text-gray-700">Negocio:</label>
            <select
              value={selectedNegocio || ""}
              onChange={(e) => setSelectedNegocio(Number(e.target.value))}
              className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              {negocios.map((negocio) => (
                <option key={negocio.id_negocio} value={negocio.id_negocio}>
                  {negocio.nombre}
                </option>
              ))}
            </select>

            <div className="flex gap-2 ml-4">
              <Button
                variant={filter === "activas" ? "default" : "outline"}
                size="sm"
                onClick={() => setFilter("activas")}
              >
                Activas
              </Button>
              <Button
                variant={filter === "todas" ? "default" : "outline"}
                size="sm"
                onClick={() => setFilter("todas")}
              >
                Todas
              </Button>
            </div>
          </div>

          <Button onClick={loadOrdenes} variant="outline">
            <RefreshCw className="mr-2 h-4 w-4" />
            Actualizar
          </Button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <div className="text-center">
              <div className="h-12 w-12 animate-spin rounded-full border-4 border-gray-200 border-t-blue-600 mx-auto" />
              <p className="mt-4 text-gray-600">Cargando órdenes...</p>
            </div>
          </div>
        ) : ordenes.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16">
              <Clock className="h-16 w-16 text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                No hay órdenes {filter === "activas" ? "activas" : ""}
              </h3>
              <p className="text-gray-600 text-center">
                Las órdenes aparecerán aquí cuando los clientes hagan pedidos.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 lg:grid-cols-2">
            {ordenes.map((orden) => {
              const nextStatus = getNextStatus(orden.estado);
              const isUpdating = updatingId === orden.id;

              return (
                <Card key={orden.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">Orden #{orden.id.slice(0, 8)}</CardTitle>
                        <p className="text-sm text-gray-600 mt-1">
                          {orden.mesa && `Mesa ${orden.mesa} • `}
                          {new Date(orden.created_at).toLocaleString()}
                        </p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${ESTADO_COLORS[orden.estado as keyof typeof ESTADO_COLORS]}`}>
                        {ESTADO_LABELS[orden.estado as keyof typeof ESTADO_LABELS]}
                      </span>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    {/* Items */}
                    <div className="space-y-2">
                      {orden.items.map((item, idx) => (
                        <div key={idx} className="flex justify-between text-sm">
                          <div>
                            <span className="font-medium">{item.cantidad}x {item.nombre_producto}</span>
                            {item.variante_seleccionada && (
                              <span className="text-gray-600 ml-2">({item.variante_seleccionada.nombre})</span>
                            )}
                            {item.modificadores_seleccionados && item.modificadores_seleccionados.length > 0 && (
                              <div className="text-xs text-gray-500 ml-4">
                                + {item.modificadores_seleccionados.map(m => m.nombre).join(", ")}
                              </div>
                            )}
                          </div>
                          <span className="text-gray-600">{formatCurrency(item.subtotal)}</span>
                        </div>
                      ))}
                    </div>

                    {orden.observaciones && (
                      <div className="bg-yellow-50 p-3 rounded text-sm">
                        <span className="font-medium">Nota:</span> {orden.observaciones}
                      </div>
                    )}

                    {/* Total */}
                    <div className="border-t pt-3 flex justify-between items-center">
                      <span className="font-semibold">Total:</span>
                      <span className="text-xl font-bold text-blue-600">{formatCurrency(orden.total)}</span>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 pt-2">
                      {nextStatus && (
                        <Button
                          className="flex-1"
                          onClick={() => handleUpdateStatus(orden.id, nextStatus)}
                          disabled={isUpdating}
                        >
                          {isUpdating ? (
                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                          ) : (
                            <>
                              <CheckCircle className="mr-2 h-4 w-4" />
                              Marcar como {ESTADO_LABELS[nextStatus as keyof typeof ESTADO_LABELS]}
                            </>
                          )}
                        </Button>
                      )}
                      {!["cancelado", "entregado"].includes(orden.estado) && (
                        <Button
                          variant="outline"
                          className="text-red-600 hover:bg-red-50"
                          onClick={() => handleUpdateStatus(orden.id, "cancelado")}
                          disabled={isUpdating}
                        >
                          <XCircle className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
