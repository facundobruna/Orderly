"use client";

import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { Search, MapPin, Phone, Store, Navigation, AlertCircle } from "lucide-react";
import { Header } from "@/components/shared/Header";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { negociosApi } from "@/lib/api/negocios";
import { Negocio } from "@/types/business";
import { useApiError } from "@/lib/hooks/useApiError";

interface NegocioConDistancia extends Negocio {
  distancia?: number; // en kilómetros
}

interface Coordenadas {
  latitude: number;
  longitude: number;
}

// Función para calcular distancia usando la fórmula de Haversine
function calcularDistancia(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Radio de la Tierra en km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Ya no necesitamos geocodificar en el frontend - las coordenadas vienen del backend

export default function ExplorarPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [ubicacionUsuario, setUbicacionUsuario] = useState<Coordenadas | null>(null);
  const [errorUbicacion, setErrorUbicacion] = useState<string | null>(null);
  const [cargandoUbicacion, setCargandoUbicacion] = useState(true);
  const { handleError } = useApiError({ context: "ExplorarPage" });

  // Solicitar ubicación del usuario
  useEffect(() => {
    if ("geolocation" in navigator) {
      console.log("[ExplorarPage] Solicitando ubicación del usuario");
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const coords = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          };
          console.log("[ExplorarPage] Ubicación obtenida:", coords);
          setUbicacionUsuario(coords);
          setCargandoUbicacion(false);
        },
        (error) => {
          console.error("[ExplorarPage] Error al obtener ubicación:", error);
          setErrorUbicacion(
            "No pudimos acceder a tu ubicación. Mostrando todos los negocios."
          );
          setCargandoUbicacion(false);
        }
      );
    } else {
      console.warn("[ExplorarPage] Geolocalización no disponible");
      setErrorUbicacion("Tu navegador no soporta geolocalización");
      setCargandoUbicacion(false);
    }
  }, []);

  // Fetch all negocios
  const { data: negocios, isLoading: isLoadingNegocios, error: negociosError } = useQuery({
    queryKey: ["negocios-publicos"],
    queryFn: async () => {
      console.log("[ExplorarPage] Obteniendo lista de negocios públicos");
      try {
        const result = await negociosApi.getAll();
        console.log("[ExplorarPage] Negocios obtenidos:", result.length);
        return result;
      } catch (err) {
        console.error("[ExplorarPage] Error al obtener negocios:", err);
        handleError(err, "No se pudieron cargar los negocios. Por favor, intenta nuevamente.");
        throw err;
      }
    },
  });

  // Calcular distancias y ordenar negocios
  const [negociosConDistancia, setNegociosConDistancia] = useState<
    NegocioConDistancia[]
  >([]);

  useEffect(() => {
    if (!negocios || negocios.length === 0) return;

    const calcularDistancias = () => {
      const negociosActivos = negocios.filter((n) => n.activo);

      if (!ubicacionUsuario) {
        // Si no hay ubicación, mostrar todos sin distancia
        setNegociosConDistancia(negociosActivos);
        return;
      }

      console.log("[ExplorarPage] Calculando distancias para", negociosActivos.length, "negocios");

      // Calcular distancias usando las coordenadas del backend
      const negociosConDist = negociosActivos.map((negocio) => {
        // Solo calcular distancia si el negocio tiene coordenadas
        if (negocio.latitud != null && negocio.longitud != null && ubicacionUsuario) {
          const distancia = calcularDistancia(
            ubicacionUsuario.latitude,
            ubicacionUsuario.longitude,
            negocio.latitud,
            negocio.longitud
          );
          return { ...negocio, distancia };
        }
        return negocio;
      });

      // Ordenar por distancia (más cercanos primero)
      // Los negocios sin coordenadas van al final
      negociosConDist.sort((a, b) => {
        if (a.distancia === undefined) return 1;
        if (b.distancia === undefined) return -1;
        return a.distancia - b.distancia;
      });

      console.log("[ExplorarPage] Negocios ordenados por distancia");
      setNegociosConDistancia(negociosConDist);
    };

    calcularDistancias();
  }, [negocios, ubicacionUsuario]);

  // Filter by search query
  const filteredNegocios = negociosConDistancia.filter((negocio) => {
    const searchLower = searchQuery.toLowerCase();
    return (
      searchQuery === "" ||
      negocio.nombre.toLowerCase().includes(searchLower) ||
      negocio.descripcion.toLowerCase().includes(searchLower) ||
      negocio.direccion.toLowerCase().includes(searchLower) ||
      negocio.sucursal?.toLowerCase().includes(searchLower)
    );
  });

  const handleNegocioClick = (negocio: Negocio) => {
    console.log("[ExplorarPage] Navegando a negocio:", negocio.nombre, negocio.id_negocio);
    router.push(`/negocio/${negocio.id_negocio}`);
  };

  const solicitarUbicacion = () => {
    setCargandoUbicacion(true);
    setErrorUbicacion(null);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const coords = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        };
        setUbicacionUsuario(coords);
        setCargandoUbicacion(false);
      },
      (error) => {
        setErrorUbicacion("No pudimos acceder a tu ubicación");
        setCargandoUbicacion(false);
      }
    );
  };

  const isLoading = isLoadingNegocios || cargandoUbicacion;

  return (
    <div className="min-h-screen bg-gray-50">
      <Header showSearch={false} />

      <div className="container mx-auto px-4 py-6 max-w-6xl">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Explorar Negocios</h1>
          <p className="text-muted-foreground text-lg">
            Descubre restaurantes y negocios cerca de ti
          </p>
        </div>

        {/* Location Status */}
        {errorUbicacion && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6 flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm text-yellow-800">{errorUbicacion}</p>
              <Button
                variant="link"
                size="sm"
                className="p-0 h-auto text-yellow-700 hover:text-yellow-900"
                onClick={solicitarUbicacion}
              >
                Intentar de nuevo
              </Button>
            </div>
          </div>
        )}

        {ubicacionUsuario && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-6 flex items-center gap-2">
            <Navigation className="h-4 w-4 text-green-600" />
            <p className="text-sm text-green-800">
              Mostrando negocios ordenados por cercanía a tu ubicación
            </p>
          </div>
        )}

        {/* Search Bar */}
        <div className="bg-white rounded-lg p-4 mb-6 shadow-sm">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Buscar por nombre, dirección o sucursal..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 text-base"
            />
          </div>
        </div>

        {/* Results Count */}
        {!isLoading && (
          <div className="mb-4">
            <p className="text-sm text-muted-foreground">
              {filteredNegocios.length}{" "}
              {filteredNegocios.length === 1 ? "negocio encontrado" : "negocios encontrados"}
            </p>
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="text-center py-12">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]" />
            <p className="mt-4 text-muted-foreground">
              {cargandoUbicacion ? "Obteniendo tu ubicación..." : "Cargando negocios..."}
            </p>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && filteredNegocios.length === 0 && (
          <div className="text-center py-12 bg-white rounded-lg">
            <Store className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-lg font-semibold mb-2">No se encontraron negocios</p>
            <p className="text-sm text-muted-foreground">
              {searchQuery
                ? "Intenta con otros términos de búsqueda"
                : "No hay negocios disponibles en este momento"}
            </p>
          </div>
        )}

        {/* Negocios Grid */}
        {!isLoading && filteredNegocios.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredNegocios.map((negocio) => (
              <Card
                key={negocio.id_negocio}
                className="cursor-pointer hover:shadow-lg transition-shadow duration-200"
                onClick={() => handleNegocioClick(negocio)}
              >
                <CardHeader>
                  <div className="flex justify-between items-start mb-2">
                    <CardTitle className="text-xl">{negocio.nombre}</CardTitle>
                    <div className="flex gap-2 ml-2">
                      {negocio.activo && (
                        <Badge variant="success">
                          Abierto
                        </Badge>
                      )}
                    </div>
                  </div>
                  {negocio.distancia !== undefined && (
                    <Badge variant="outline" className="w-fit mb-2">
                      📍 {negocio.distancia.toFixed(1)} km
                    </Badge>
                  )}
                  <CardDescription className="line-clamp-2">
                    {negocio.descripcion}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <MapPin className="h-4 w-4 flex-shrink-0" />
                      <span className="line-clamp-1">{negocio.direccion}</span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Phone className="h-4 w-4 flex-shrink-0" />
                      <span>{negocio.telefono}</span>
                    </div>
                    {negocio.sucursal && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Store className="h-4 w-4 flex-shrink-0" />
                        <span>{negocio.sucursal}</span>
                      </div>
                    )}
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