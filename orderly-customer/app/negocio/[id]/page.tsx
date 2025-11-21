"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Search, Filter } from "lucide-react";
import { Header } from "@/components/shared/Header";
import { ProductCard } from "@/components/producto/ProductCard";
import { ProductDetail } from "@/components/producto/ProductDetail";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { authApi, productsApi } from "@/lib/api";
import { useCartStore } from "@/lib/store/cartStore";
import { Producto, Variante, Modificador } from "@/types";
import { useToast } from "@/lib/contexts/ToastContext";

export default function NegocioPage() {
  const params = useParams();
  const negocioId = parseInt(params.id as string);

  console.log("[NegocioPage] Cargando página de negocio:", negocioId);

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategoria, setSelectedCategoria] = useState<string>("");
  const [selectedProducto, setSelectedProducto] = useState<Producto | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  const { addItem, mesa } = useCartStore();
  const { success } = useToast();

  // Fetch negocio info
  const { data: negocio } = useQuery({
    queryKey: ["negocio", negocioId],
    queryFn: async () => {
      console.log("[NegocioPage] Obteniendo información del negocio:", negocioId);
      try {
        const result = await authApi.getNegocioById(negocioId);
        console.log("[NegocioPage] Negocio obtenido:", result.nombre);
        return result;
      } catch (err) {
        console.error("[NegocioPage] Error al obtener negocio:", err);
        throw err;
      }
    },
  });

  // Fetch productos
  const { data: productos, isLoading, error } = useQuery({
    queryKey: ["productos", negocioId, selectedCategoria],
    queryFn: async () => {
      console.log("[NegocioPage] Obteniendo productos para negocio:", negocioId, "categoría:", selectedCategoria || "todas");
      try {
        const result = await productsApi.getProducts({
          negocio_id: negocioId,
          categoria: selectedCategoria || undefined,
          disponible: true,
        });
        console.log("[NegocioPage] Productos obtenidos:", Array.isArray(result) ? result.length : 0, "productos");
        return result;
      } catch (err) {
        console.error("[NegocioPage] Error al obtener productos:", err);
        throw err;
      }
    },
  });

  // Ensure productos is always an array
  const productosArray = Array.isArray(productos) ? productos : [];

  // Get unique categories
  const categorias = Array.from(
    new Set(productosArray.map((p) => p.categoria))
  ).filter(Boolean);

  // Filter products by search query
  const filteredProductos = productosArray.filter((producto) => {
    const matchesSearch =
      searchQuery === "" ||
      producto.nombre.toLowerCase().includes(searchQuery.toLowerCase()) ||
      producto.descripcion.toLowerCase().includes(searchQuery.toLowerCase()) ||
      producto.tags?.some((tag) =>
        tag.toLowerCase().includes(searchQuery.toLowerCase())
      );
    return matchesSearch;
  });

  console.log("[NegocioPage] Productos filtrados:", filteredProductos.length, "de", productosArray.length, "total");
  if (searchQuery) {
    console.log("[NegocioPage] Búsqueda activa:", searchQuery);
  }
  if (selectedCategoria) {
    console.log("[NegocioPage] Categoría seleccionada:", selectedCategoria);
  }

  const handleAddToCart = (
    producto: Producto,
    cantidad: number,
    variante?: Variante,
    modificadores?: Modificador[],
    observaciones?: string
  ) => {
    console.log("[NegocioPage] Agregando al carrito:", {
      producto: producto.nombre,
      cantidad,
      variante: variante?.nombre,
      modificadores: modificadores?.map(m => m.nombre),
      observaciones,
    });
    addItem(producto, cantidad, variante, modificadores, observaciones);
    console.log("[NegocioPage] Producto agregado al carrito exitosamente");
    success(
      `${cantidad}x ${producto.nombre} agregado al carrito`,
      "Producto agregado"
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header
        negocioNombre={negocio?.nombre}
        showSearch
        onSearchClick={() => document.getElementById("search-input")?.focus()}
      />

      <div className="container mx-auto px-4 py-6">
        {/* Negocio Header */}
        {negocio && (
          <div className="bg-white rounded-lg p-6 mb-6 shadow-sm">
            <h1 className="text-3xl font-bold mb-2">{negocio.nombre}</h1>
            <p className="text-muted-foreground mb-2">{negocio.descripcion}</p>
            <div className="flex gap-4 text-sm text-muted-foreground">
              <span>📍 {negocio.direccion}</span>
              <span>📞 {negocio.telefono}</span>
            </div>
            {mesa && (
              <div className="mt-3">
                <Badge variant="success" className="text-base px-4 py-1">
                  Mesa {mesa}
                </Badge>
              </div>
            )}
          </div>
        )}

        {/* Search and Filters */}
        <div className="bg-white rounded-lg p-4 mb-6 shadow-sm">
          <div className="flex gap-3 mb-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="search-input"
                type="text"
                placeholder="Buscar productos..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className="h-4 w-4" />
            </Button>
          </div>

          {/* Categories Filter */}
          {showFilters && categorias.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-semibold">Categorías</p>
              <div className="flex flex-wrap gap-2">
                <Badge
                  variant={selectedCategoria === "" ? "default" : "outline"}
                  className="cursor-pointer"
                  onClick={() => setSelectedCategoria("")}
                >
                  Todas
                </Badge>
                {categorias.map((categoria) => (
                  <Badge
                    key={categoria}
                    variant={selectedCategoria === categoria ? "default" : "outline"}
                    className="cursor-pointer"
                    onClick={() => setSelectedCategoria(categoria)}
                  >
                    {categoria}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Error State */}
        {error && (
          <div className="text-center py-12 bg-white rounded-lg">
            <p className="text-red-500 mb-2">Error al cargar productos</p>
            <p className="text-sm text-muted-foreground">
              {error instanceof Error ? error.message : "Por favor, intenta de nuevo"}
            </p>
          </div>
        )}

        {/* Products Grid */}
        {!error && isLoading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Cargando productos...</p>
          </div>
        ) : !error && filteredProductos.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg">
            <p className="text-muted-foreground">
              No se encontraron productos
            </p>
          </div>
        ) : !error && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredProductos.map((producto) => (
              <ProductCard
                key={producto.id}
                producto={producto}
                onClick={() => setSelectedProducto(producto)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Product Detail Modal */}
      {selectedProducto && (
        <ProductDetail
          producto={selectedProducto}
          onClose={() => setSelectedProducto(null)}
          onAddToCart={handleAddToCart}
        />
      )}
    </div>
  );
}
