"use client";

import { useEffect, useState } from "react";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { productsApi, negociosApi } from "@/lib/api";
import { Producto, Negocio } from "@/types";
import { Plus, Package, Edit, Trash2, Eye, EyeOff } from "lucide-react";
import Link from "next/link";
import { formatCurrency } from "@/lib/utils";

export default function ProductosPage() {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [negocios, setNegocios] = useState<Negocio[]>([]);
  const [selectedNegocio, setSelectedNegocio] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    loadNegocios();
  }, []);

  useEffect(() => {
    if (selectedNegocio) {
      loadProductos();
    }
  }, [selectedNegocio]);

  const loadNegocios = async () => {
    try {
      const negocios = await negociosApi.getMy();
      setNegocios(negocios);
      if (negocios.length > 0) {
        setSelectedNegocio(negocios[0].id_negocio);
      }
    } catch (error) {
      console.error("Error loading negocios:", error);
    }
  };

  const loadProductos = async () => {
    if (!selectedNegocio) return;

    try {
      setIsLoading(true);
      const data = await productsApi.getProducts({ negocio_id: String(selectedNegocio) });
      const productosArray = Array.isArray(data) ? data : [];
      setProductos(productosArray);
    } catch (error) {
      console.error("Error loading productos:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("¿Estás seguro de que deseas eliminar este producto?")) {
      return;
    }

    try {
      setDeletingId(id);
      await productsApi.deleteProduct(id);
      setProductos(productos.filter((p) => p.id !== id));
    } catch (error) {
      console.error("Error deleting producto:", error);
      alert("Error al eliminar el producto");
    } finally {
      setDeletingId(null);
    }
  };

  if (negocios.length === 0 && !isLoading) {
    return (
      <div>
        <AdminHeader
          title="Productos"
          subtitle="Gestiona el menú de tus negocios"
        />
        <div className="p-8">
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16">
              <Package className="h-16 w-16 text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Primero crea un negocio
              </h3>
              <p className="text-gray-600 text-center mb-6 max-w-md">
                Necesitas tener al menos un negocio creado para poder agregar productos.
              </p>
              <Link href="/admin/negocios/nuevo">
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Crear Negocio
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div>
      <AdminHeader
        title="Productos"
        subtitle="Gestiona el menú de tus negocios"
      />

      <div className="p-8">
        <div className="flex flex-col gap-4 mb-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <label className="text-sm font-medium text-gray-700">
              Negocio:
            </label>
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
            <span className="text-sm text-gray-600">
              {productos.length} {productos.length === 1 ? "producto" : "productos"}
            </span>
          </div>

          <Link href="/admin/productos/nuevo">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Agregar Producto
            </Button>
          </Link>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <div className="text-center">
              <div className="h-12 w-12 animate-spin rounded-full border-4 border-gray-200 border-t-blue-600 mx-auto" />
              <p className="mt-4 text-gray-600">Cargando productos...</p>
            </div>
          </div>
        ) : productos.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16">
              <Package className="h-16 w-16 text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                No hay productos todavía
              </h3>
              <p className="text-gray-600 text-center mb-6 max-w-md">
                Comienza a agregar productos a tu menú para que los clientes puedan hacer pedidos.
              </p>
              <Link href="/admin/productos/nuevo">
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Agregar Primer Producto
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {productos.map((producto) => (
              <Card key={producto.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                <div className="relative h-48 bg-gray-200">
                  {producto.imagen_url ? (
                    <img
                      src={producto.imagen_url}
                      alt={producto.nombre}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center">
                      <Package className="h-16 w-16 text-gray-400" />
                    </div>
                  )}
                  <div className="absolute top-2 right-2 flex gap-2">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-medium ${
                        producto.disponible
                          ? "bg-green-500 text-white"
                          : "bg-gray-500 text-white"
                      }`}
                    >
                      {producto.disponible ? (
                        <><Eye className="inline h-3 w-3 mr-1" />Disponible</>
                      ) : (
                        <><EyeOff className="inline h-3 w-3 mr-1" />No disponible</>
                      )}
                    </span>
                  </div>
                </div>

                <CardContent className="p-4">
                  <div className="mb-3">
                    <h3 className="font-semibold text-gray-900 line-clamp-1">
                      {producto.nombre}
                    </h3>
                    <p className="text-sm text-gray-600 line-clamp-2 mt-1">
                      {producto.descripcion}
                    </p>
                  </div>

                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xl font-bold text-blue-600">
                      {formatCurrency(producto.precio_base)}
                    </span>
                    <span className="text-xs text-gray-500 px-2 py-1 bg-gray-100 rounded">
                      {producto.categoria}
                    </span>
                  </div>

                  {((producto.variantes && producto.variantes.length > 0) || (producto.modificadores && producto.modificadores.length > 0)) && (
                    <div className="text-xs text-gray-600 mb-4 space-y-1">
                      {producto.variantes && producto.variantes.length > 0 && (
                        <div>• {producto.variantes.length} variantes</div>
                      )}
                      {producto.modificadores && producto.modificadores.length > 0 && (
                        <div>• {producto.modificadores.length} modificadores</div>
                      )}
                    </div>
                  )}

                  <div className="flex gap-2">
                    <Link href={`/admin/productos/${producto.id}`} className="flex-1">
                      <Button variant="outline" className="w-full" size="sm">
                        <Edit className="mr-2 h-4 w-4" />
                        Editar
                      </Button>
                    </Link>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-red-600 hover:bg-red-50 hover:text-red-700"
                      onClick={() => handleDelete(producto.id)}
                      disabled={deletingId === producto.id}
                    >
                      {deletingId === producto.id ? (
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
