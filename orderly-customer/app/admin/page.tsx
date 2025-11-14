"use client";

import { useEffect, useState } from "react";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { negociosApi, ordersApi } from "@/lib/api";
import { Store, Package, ShoppingBag, DollarSign, TrendingUp, Clock } from "lucide-react";

interface DashboardStats {
  totalNegocios: number;
  totalOrdenes: number;
  ordenesHoy: number;
  ingresosMes: number;
  crecimiento: number;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalNegocios: 0,
    totalOrdenes: 0,
    ordenesHoy: 0,
    ingresosMes: 0,
    crecimiento: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setIsLoading(true);

      // Obtener negocios
      const negocios = await negociosApi.getMy();

      // Obtener órdenes
      const ordersResponse = await ordersApi.getOrders({});
      const ordenes = ordersResponse.results || [];

      // Calcular órdenes de hoy
      const hoy = new Date().toISOString().split('T')[0];
      const ordenesHoy = ordenes.filter(o =>
        o.creado_en.startsWith(hoy)
      ).length;

      // Calcular ingresos del mes
      const mesActual = new Date().getMonth();
      const ingresosMes = ordenes
        .filter(o => new Date(o.creado_en).getMonth() === mesActual)
        .reduce((sum, o) => sum + (o.total || 0), 0);

      setStats({
        totalNegocios: negocios.length,
        totalOrdenes: ordenes.length,
        ordenesHoy,
        ingresosMes,
        crecimiento: 12.5, // Mock - en producción calcular real
      });
    } catch (error) {
      console.error("Error loading dashboard data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const statsCards = [
    {
      title: "Mis Negocios",
      value: stats.totalNegocios,
      icon: Store,
      color: "text-blue-600",
      bgColor: "bg-blue-100",
    },
    {
      title: "Órdenes Totales",
      value: stats.totalOrdenes,
      icon: ShoppingBag,
      color: "text-green-600",
      bgColor: "bg-green-100",
    },
    {
      title: "Órdenes Hoy",
      value: stats.ordenesHoy,
      icon: Clock,
      color: "text-purple-600",
      bgColor: "bg-purple-100",
    },
    {
      title: "Ingresos del Mes",
      value: `$${stats.ingresosMes.toFixed(2)}`,
      icon: DollarSign,
      color: "text-emerald-600",
      bgColor: "bg-emerald-100",
    },
  ];

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-gray-200 border-t-blue-600 mx-auto" />
          <p className="mt-4 text-gray-600">Cargando dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <AdminHeader
        title="Dashboard"
        subtitle="Bienvenido a tu panel de administración"
      />

      <div className="p-8">
        {/* Stats Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {statsCards.map((stat) => {
            const Icon = stat.icon;
            return (
              <Card key={stat.title}>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">
                    {stat.title}
                  </CardTitle>
                  <div className={`rounded-lg p-2 ${stat.bgColor}`}>
                    <Icon className={`h-5 w-5 ${stat.color}`} />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stat.value}</div>
                  {stat.title === "Ingresos del Mes" && (
                    <p className="mt-1 flex items-center text-xs text-green-600">
                      <TrendingUp className="mr-1 h-3 w-3" />
                      +{stats.crecimiento}% vs mes anterior
                    </p>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Quick Actions */}
        <div className="mt-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Acciones Rápidas</h2>
          <div className="grid gap-4 md:grid-cols-3">
            <Card className="cursor-pointer hover:border-blue-500 transition-colors">
              <CardContent className="p-6">
                <Store className="h-8 w-8 text-blue-600 mb-3" />
                <h3 className="font-semibold text-gray-900">Crear Negocio</h3>
                <p className="text-sm text-gray-600 mt-1">
                  Añade un nuevo restaurante o local
                </p>
              </CardContent>
            </Card>

            <Card className="cursor-pointer hover:border-green-500 transition-colors">
              <CardContent className="p-6">
                <Package className="h-8 w-8 text-green-600 mb-3" />
                <h3 className="font-semibold text-gray-900">Agregar Producto</h3>
                <p className="text-sm text-gray-600 mt-1">
                  Añade items a tu menú
                </p>
              </CardContent>
            </Card>

            <Card className="cursor-pointer hover:border-purple-500 transition-colors">
              <CardContent className="p-6">
                <ShoppingBag className="h-8 w-8 text-purple-600 mb-3" />
                <h3 className="font-semibold text-gray-900">Ver Órdenes</h3>
                <p className="text-sm text-gray-600 mt-1">
                  Gestiona pedidos activos
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Recent Activity */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Actividad Reciente</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-gray-500">
              <Clock className="h-12 w-12 mx-auto mb-3 text-gray-400" />
              <p>No hay actividad reciente</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
