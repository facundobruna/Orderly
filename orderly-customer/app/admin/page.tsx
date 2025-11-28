"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { negociosApi, ordersApi } from "@/lib/api";
import { Orden } from "@/types";
import { Store, Package, ShoppingBag, DollarSign, TrendingUp, TrendingDown, Clock } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { useApiError } from "@/lib/hooks/useApiError";

interface DashboardStats {
  totalNegocios: number;
  totalOrdenes: number;
  ordenesHoy: number;
  ingresosMes: number;
  crecimiento: number;
}

function getRelativeTime(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `Hace ${days} ${days === 1 ? 'día' : 'días'}`;
  if (hours > 0) return `Hace ${hours} ${hours === 1 ? 'hora' : 'horas'}`;
  if (minutes > 0) return `Hace ${minutes} ${minutes === 1 ? 'minuto' : 'minutos'}`;
  return 'Hace un momento';
}

export default function AdminDashboard() {
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats>({
    totalNegocios: 0,
    totalOrdenes: 0,
    ordenesHoy: 0,
    ingresosMes: 0,
    crecimiento: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [ordenesRecientes, setOrdenesRecientes] = useState<Orden[]>([]);
  const { handleError } = useApiError({ context: "AdminDashboard" });

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setIsLoading(true);

      // Obtener negocios del administrador
      const negocios = await negociosApi.getMy();

      // Crear un Set con los IDs de los negocios del admin convertidos a string para comparación
      const negociosIds = new Set(negocios.map(n => String(n.id_negocio)));

      // Obtener todas las órdenes
      const ordenesData = await ordersApi.getOrders({});
      const todasLasOrdenes = Array.isArray(ordenesData) ? ordenesData : [];

      // Filtrar todas las órdenes de los negocios del administrador
      // Convertir ambos a string para comparación segura
      const todasOrdenesNegocio = todasLasOrdenes.filter(o => {
        return negociosIds.has(String(o.negocio_id));
      });

      // Filtrar solo las órdenes entregadas para las estadísticas
      const ordenesEntregadas = todasOrdenesNegocio.filter(o => o.estado === "entregado");

      // Calcular órdenes de hoy
      const ahora = new Date();
      const hoy = ahora.toISOString().split('T')[0];

      const ordenesHoy = ordenesEntregadas.filter(o => {
        if (!o.created_at) return false;
        const fechaStr = typeof o.created_at === 'string' ? o.created_at.split('T')[0] : '';
        return fechaStr === hoy;
      }).length;

      // Calcular ingresos del mes actual
      const mesActual = ahora.getMonth();
      const anoActual = ahora.getFullYear();

      const ingresosMes = ordenesEntregadas
        .filter(o => {
          if (!o.created_at) return false;
          const fechaOrden = new Date(o.created_at);
          return fechaOrden.getMonth() === mesActual && fechaOrden.getFullYear() === anoActual;
        })
        .reduce((sum, o) => sum + (o.total || 0), 0);

      // Calcular ingresos del mes anterior para comparar
      const fechaMesAnterior = new Date(anoActual, mesActual - 1, 1);
      const mesAnterior = fechaMesAnterior.getMonth();
      const anoAnterior = fechaMesAnterior.getFullYear();

      const ingresosMesAnterior = ordenesEntregadas
        .filter(o => {
          if (!o.created_at) return false;
          const fechaOrden = new Date(o.created_at);
          return fechaOrden.getMonth() === mesAnterior && fechaOrden.getFullYear() === anoAnterior;
        })
        .reduce((sum, o) => sum + (o.total || 0), 0);

      // Calcular porcentaje de crecimiento
      let crecimiento = 0;
      if (ingresosMesAnterior > 0) {
        crecimiento = ((ingresosMes - ingresosMesAnterior) / ingresosMesAnterior) * 100;
      } else if (ingresosMes > 0) {
        // Si no hay ingresos el mes anterior pero sí este mes, es crecimiento del 100%
        crecimiento = 100;
      }

      setStats({
        totalNegocios: negocios.length,
        totalOrdenes: ordenesEntregadas.length,
        ordenesHoy,
        ingresosMes,
        crecimiento: Number(crecimiento.toFixed(1)),
      });

      // Obtener últimas 5 órdenes para actividad reciente (todas, no solo entregadas)
      const ordenesRecientesData = todasOrdenesNegocio
        .sort((a, b) => {
          const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
          const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
          return dateB - dateA;
        })
        .slice(0, 5);
      setOrdenesRecientes(ordenesRecientesData);
    } catch (error) {
      console.error("❌ Error loading dashboard data:", error);
      handleError(error, "No se pudieron cargar los datos del dashboard. Por favor, intenta nuevamente.");
    } finally {
      setIsLoading(false);
    }
  };

  const statsCards = [
    {
      title: "Mis Negocios",
      value: stats.totalNegocios,
      icon: Store,
      color: "text-burgundy-600",
      bgColor: "bg-burgundy-100",
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
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-gray-200 border-t-burgundy-600 mx-auto" />
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
                  {stat.title === "Ingresos del Mes" && stats.crecimiento !== 0 && (
                    <p className={`mt-1 flex items-center text-xs ${
                      stats.crecimiento >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {stats.crecimiento >= 0 ? (
                        <TrendingUp className="mr-1 h-3 w-3" />
                      ) : (
                        <TrendingDown className="mr-1 h-3 w-3" />
                      )}
                      {stats.crecimiento >= 0 ? '+' : ''}{stats.crecimiento}% vs mes anterior
                    </p>
                  )}
                  {stat.title === "Ingresos del Mes" && stats.crecimiento === 0 && stats.ingresosMes > 0 && (
                    <p className="mt-1 flex items-center text-xs text-gray-500">
                      Sin datos del mes anterior
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
            <Card
              className="cursor-pointer hover:border-burgundy-500 transition-colors"
              onClick={() => router.push('/admin/negocios/nuevo')}
            >
              <CardContent className="p-6">
                <Store className="h-8 w-8 text-burgundy-600 mb-3" />
                <h3 className="font-semibold text-gray-900">Crear Negocio</h3>
                <p className="text-sm text-gray-600 mt-1">
                  Añade un nuevo restaurante o local
                </p>
              </CardContent>
            </Card>

            <Card
              className="cursor-pointer hover:border-green-500 transition-colors"
              onClick={() => router.push('/admin/negocios')}
            >
              <CardContent className="p-6">
                <Package className="h-8 w-8 text-green-600 mb-3" />
                <h3 className="font-semibold text-gray-900">Gestionar Negocios</h3>
                <p className="text-sm text-gray-600 mt-1">
                  Ver y administrar tus negocios
                </p>
              </CardContent>
            </Card>

            <Card
              className="cursor-pointer hover:border-purple-500 transition-colors"
              onClick={() => router.push('/admin/ordenes')}
            >
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
            {ordenesRecientes.length > 0 ? (
              <div className="space-y-4">
                {ordenesRecientes.map((orden) => {
                  const fecha = orden.created_at ? new Date(orden.created_at) : new Date();
                  const fechaRelativa = getRelativeTime(fecha);

                  return (
                    <div
                      key={orden.id}
                      className="flex items-center justify-between border-b pb-3 last:border-0"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`flex h-10 w-10 items-center justify-center rounded-full ${
                          orden.estado === 'completado' ? 'bg-green-100' :
                          orden.estado === 'pendiente' ? 'bg-yellow-100' :
                          orden.estado === 'en_preparacion' ? 'bg-burgundy-100' :
                          'bg-gray-100'
                        }`}>
                          <ShoppingBag className={`h-5 w-5 ${
                            orden.estado === 'completado' ? 'text-green-600' :
                            orden.estado === 'pendiente' ? 'text-yellow-600' :
                            orden.estado === 'en_preparacion' ? 'text-burgundy-600' :
                            'text-gray-600'
                          }`} />
                        </div>
                        <div>
                          <p className="font-medium">Orden #{orden.id}</p>
                          <p className="text-sm text-muted-foreground">
                            {fechaRelativa} · {orden.items?.length || 0} items
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">{formatCurrency(orden.total)}</p>
                        <p className={`text-xs ${
                          orden.estado === 'completado' ? 'text-green-600' :
                          orden.estado === 'pendiente' ? 'text-yellow-600' :
                          orden.estado === 'en_preparacion' ? 'text-burgundy-600' :
                          'text-gray-600'
                        }`}>
                          {orden.estado === 'completado' ? 'Completado' :
                           orden.estado === 'pendiente' ? 'Pendiente' :
                           orden.estado === 'en_preparacion' ? 'En preparación' :
                           orden.estado}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Clock className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                <p>No hay actividad reciente</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
