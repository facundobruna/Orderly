"use client";

import { useEffect, useState } from "react";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { negociosApi } from "@/lib/api";
import { Negocio } from "@/types";
import { Plus, Store, MapPin, Phone, Edit, Trash2, BarChart3 } from "lucide-react";
import Link from "next/link";
import { useToast } from "@/lib/contexts/ToastContext";

export default function NegociosPage() {
  const { success, error: showError } = useToast();
  const [negocios, setNegocios] = useState<Negocio[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    loadNegocios();
  }, []);

  const loadNegocios = async () => {
    try {
      setIsLoading(true);
      setError("");
      console.log("[NegociosPage] Cargando negocios...");
      const negocios = await negociosApi.getMy();
      console.log("[NegociosPage] Negocios cargados:", negocios);
      setNegocios(negocios);
    } catch (err: any) {
      console.error("[NegociosPage] Error loading negocios:", err);
      console.error("[NegociosPage] Error response:", err.response?.data);
      setError(err.response?.data?.error || "Error al cargar los negocios");
      setNegocios([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("¿Estás seguro de que deseas eliminar este negocio?")) {
      return;
    }

    try {
      setDeletingId(id);
      console.log("[NegociosPage] Eliminando negocio:", id);
      const negocioNombre = negocios.find(n => n.id_negocio === id)?.nombre;
      await negociosApi.delete(id);
      console.log("[NegociosPage] Negocio eliminado exitosamente");
      setNegocios(negocios.filter((n) => n.id_negocio !== id));
      success(`Negocio "${negocioNombre}" eliminado exitosamente`, "Negocio eliminado");
    } catch (err) {
      console.error("[NegociosPage] Error deleting negocio:", err);
      showError("Error al eliminar el negocio", "Error");
    } finally {
      setDeletingId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-gray-200 border-t-blue-600 mx-auto" />
          <p className="mt-4 text-gray-600">Cargando negocios...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <AdminHeader
        title="Mis Negocios"
        subtitle="Gestiona tus restaurantes y locales"
      />

      <div className="p-8">
        {error && (
          <div className="mb-6 rounded-lg bg-red-50 p-4 text-sm text-red-600">
            {error}
          </div>
        )}

        <div className="flex justify-between items-center mb-6">
          <div>
            <p className="text-sm text-gray-600">
              {negocios.length} {negocios.length === 1 ? "negocio" : "negocios"} registrado{negocios.length !== 1 ? "s" : ""}
            </p>
          </div>
          <Link href="/admin/negocios/nuevo">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Crear Negocio
            </Button>
          </Link>
        </div>

        {negocios.length === 0 && !error ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16">
              <Store className="h-16 w-16 text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                No tienes negocios todavía
              </h3>
              <p className="text-gray-600 text-center mb-6 max-w-md">
                Crea tu primer negocio para comenzar a gestionar productos, mesas y órdenes.
              </p>
              <Link href="/admin/negocios/nuevo">
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Crear Mi Primer Negocio
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {negocios.map((negocio) => (
              <Card key={negocio.id_negocio} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100">
                        <Store className="h-6 w-6 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">
                          {negocio.nombre}
                        </h3>
                        <span
                          className={`inline-block text-xs px-2 py-1 rounded ${
                            negocio.activo
                              ? "bg-green-100 text-green-700"
                              : "bg-gray-100 text-gray-700"
                          }`}
                        >
                          {negocio.activo ? "Activo" : "Inactivo"}
                        </span>
                      </div>
                    </div>
                  </div>

                  <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                    {negocio.descripcion}
                  </p>

                  <div className="space-y-2 mb-4">
                    <div className="flex items-center text-sm text-gray-600">
                      <MapPin className="mr-2 h-4 w-4 flex-shrink-0" />
                      <span className="truncate">{negocio.direccion}</span>
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <Phone className="mr-2 h-4 w-4 flex-shrink-0" />
                      <span>{negocio.telefono}</span>
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <Store className="mr-2 h-4 w-4 flex-shrink-0" />
                      <span>Sucursal: {negocio.sucursal}</span>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Link href={`/admin/negocios/${negocio.id_negocio}/estadisticas`} className="flex-1">
                      <Button variant="default" className="w-full">
                        <BarChart3 className="mr-2 h-4 w-4" />
                        Estadísticas
                      </Button>
                    </Link>
                    <Link href={`/admin/negocios/${negocio.id_negocio}`}>
                      <Button variant="outline">
                        <Edit className="h-4 w-4" />
                      </Button>
                    </Link>
                    <Button
                      variant="outline"
                      className="text-red-600 hover:bg-red-50 hover:text-red-700"
                      onClick={() => handleDelete(negocio.id_negocio)}
                      disabled={deletingId === negocio.id_negocio}
                    >
                      {deletingId === negocio.id_negocio ? (
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-red-600" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
