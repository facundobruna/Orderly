"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Header } from "@/components/shared/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { authApi } from "@/lib/api";
import { Negocio } from "@/types";
import { Store, MapPin, Phone, ChevronRight } from "lucide-react";
import { useAuthStore } from "@/lib/store/authStore";

export default function Home() {
  const { user } = useAuthStore();

  // Fetch all active negocios
  const { data: negocios, isLoading } = useQuery({
    queryKey: ["negocios"],
    queryFn: () => authApi.getNegocios(),
  });

  // Filter active negocios
  const activeNegocios = (negocios || []).filter((n: Negocio) => n.activo);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <div className="container mx-auto px-4 py-8">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-blue-600 mb-4">Orderly</h1>
          <p className="text-xl text-gray-700 mb-6">
            Sistema de Pedidos para Restaurantes
          </p>
          <p className="text-gray-600 max-w-2xl mx-auto mb-8">
            Simplifica la gestión de pedidos de tu negocio. Los clientes pueden
            ordenar escaneando el QR de su mesa o accediendo al menú online.
          </p>

          {!user && (
            <div className="flex gap-4 justify-center flex-wrap">
              <Link href="/login">
                <Button size="lg">Iniciar Sesión</Button>
              </Link>
              <Link href="/register">
                <Button variant="outline" size="lg">
                  Registrarse
                </Button>
              </Link>
            </div>
          )}
        </div>

        {/* Negocios Disponibles */}
        {activeNegocios.length > 0 && (
          <div className="mb-12">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-3xl font-bold">Negocios Disponibles</h2>
              <Badge>{activeNegocios.length} activos</Badge>
            </div>

            {isLoading ? (
              <div className="text-center py-12">
                <div className="h-12 w-12 animate-spin rounded-full border-4 border-gray-200 border-t-blue-600 mx-auto" />
                <p className="mt-4 text-gray-600">Cargando negocios...</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {activeNegocios.map((negocio: Negocio) => (
                  <Card
                    key={negocio.id_negocio}
                    className="hover:shadow-lg transition-shadow cursor-pointer"
                  >
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                            <Store className="h-6 w-6 text-blue-600" />
                          </div>
                          <div>
                            <CardTitle className="text-lg">
                              {negocio.nombre}
                            </CardTitle>
                            <Badge variant="success" className="mt-1">
                              Abierto
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <p className="text-sm text-gray-600">
                        {negocio.descripcion || "Deliciosa comida para todos"}
                      </p>

                      <div className="space-y-2 text-sm text-gray-600">
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4" />
                          <span>{negocio.direccion}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4" />
                          <span>{negocio.telefono}</span>
                        </div>
                      </div>

                      <Link href={`/negocio/${negocio.id_negocio}`}>
                        <Button className="w-full mt-4" variant="default">
                          Ver Menú
                          <ChevronRight className="ml-2 h-4 w-4" />
                        </Button>
                      </Link>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardContent className="p-6 text-center">
              <div className="text-4xl mb-4">📱</div>
              <h3 className="text-xl font-semibold mb-2">Pedidos Rápidos</h3>
              <p className="text-gray-600">
                Los clientes ordenan desde su móvil sin esperar
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 text-center">
              <div className="text-4xl mb-4">💳</div>
              <h3 className="text-xl font-semibold mb-2">Múltiples Pagos</h3>
              <p className="text-gray-600">
                Efectivo, transferencia o Mercado Pago
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 text-center">
              <div className="text-4xl mb-4">🍽️</div>
              <h3 className="text-xl font-semibold mb-2">QR por Mesa</h3>
              <p className="text-gray-600">
                Cada mesa tiene su código QR único
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
