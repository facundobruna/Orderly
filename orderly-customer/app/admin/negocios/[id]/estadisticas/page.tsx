"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { negociosApi, ordersApi, productsApi } from "@/lib/api";
import { Negocio, Orden, Producto } from "@/types";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  ShoppingBag,
  Clock,
  Star,
  ArrowLeft,
  Calendar,
  Package,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface ProductoVendido {
  producto_id: string;
  nombre: string;
  cantidad: number;
  ingresos: number;
}

interface VentasPorDia {
  fecha: string;
  cantidad: number;
  ingresos: number;
}

interface EstadisticasNegocio {
  ventasHoy: number;
  ingresosHoy: number;
  ventasSemana: number;
  ingresosSemana: number;
  ventasMes: number;
  ingresosMes: number;
  ticketPromedio: number;
  productosVendidos: ProductoVendido[];
  ventasPorDia: VentasPorDia[];
  horasPico: { hora: number; cantidad: number }[];
  crecimientoSemanal: number;
}

export default function EstadisticasNegocioPage() {
  const params = useParams();
  const router = useRouter();
  const negocioId = params.id as string;

  const [negocio, setNegocio] = useState<Negocio | null>(null);
  const [stats, setStats] = useState<EstadisticasNegocio | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [periodo, setPeriodo] = useState<"semana" | "mes" | "ano">("mes");

  useEffect(() => {
    loadData();
  }, [negocioId, periodo]);

  const loadData = async () => {
    try {
      setIsLoading(true);

      // Cargar negocio
      const negocioData = await negociosApi.getById(Number(negocioId));
      setNegocio(negocioData);

      // Cargar todas las órdenes del negocio
      const ordenesData = await ordersApi.getOrders({
        negocio_id: negocioId,
      });
      // Filtrar solo las órdenes entregadas para las estadísticas
      const ordenes = Array.isArray(ordenesData)
        ? ordenesData.filter(o => o.estado === "entregado")
        : [];

      // Calcular estadísticas
      const ahora = new Date();
      const hoy = ahora.toISOString().split('T')[0];

      // Ventas de hoy
      const ordenesHoy = ordenes.filter(o => {
        if (!o.created_at) return false;
        return o.created_at.startsWith(hoy);
      });
      const ventasHoy = ordenesHoy.length;
      const ingresosHoy = ordenesHoy.reduce((sum, o) => sum + o.total, 0);

      // Ventas de la semana (últimos 7 días)
      const hace7Dias = new Date(ahora);
      hace7Dias.setDate(hace7Dias.getDate() - 7);
      const ordenesSemana = ordenes.filter(o => {
        if (!o.created_at) return false;
        return new Date(o.created_at) >= hace7Dias;
      });
      const ventasSemana = ordenesSemana.length;
      const ingresosSemana = ordenesSemana.reduce((sum, o) => sum + o.total, 0);

      // Ventas del mes
      const mesActual = ahora.getMonth();
      const anoActual = ahora.getFullYear();
      const ordenesMes = ordenes.filter(o => {
        if (!o.created_at) return false;
        const fecha = new Date(o.created_at);
        return fecha.getMonth() === mesActual && fecha.getFullYear() === anoActual;
      });
      const ventasMes = ordenesMes.length;
      const ingresosMes = ordenesMes.reduce((sum, o) => sum + o.total, 0);

      // Ticket promedio
      const ticketPromedio = ordenesMes.length > 0 ? ingresosMes / ordenesMes.length : 0;

      // Productos más vendidos
      const productosMap = new Map<string, ProductoVendido>();
      ordenesMes.forEach(orden => {
        orden.items?.forEach(item => {
          const key = item.producto_id;
          if (productosMap.has(key)) {
            const prod = productosMap.get(key)!;
            prod.cantidad += item.cantidad;
            prod.ingresos += item.subtotal;
          } else {
            productosMap.set(key, {
              producto_id: item.producto_id,
              nombre: item.nombre_producto,
              cantidad: item.cantidad,
              ingresos: item.subtotal,
            });
          }
        });
      });
      const productosVendidos = Array.from(productosMap.values())
        .sort((a, b) => b.cantidad - a.cantidad)
        .slice(0, 10);

      // Ventas por día (últimos 30 días)
      const ventasPorDiaMap = new Map<string, VentasPorDia>();
      for (let i = 29; i >= 0; i--) {
        const fecha = new Date(ahora);
        fecha.setDate(fecha.getDate() - i);
        const fechaStr = fecha.toISOString().split('T')[0];
        ventasPorDiaMap.set(fechaStr, {
          fecha: fechaStr,
          cantidad: 0,
          ingresos: 0,
        });
      }

      ordenes.forEach(orden => {
        if (!orden.created_at) return;
        const fechaStr = orden.created_at.split('T')[0];
        if (ventasPorDiaMap.has(fechaStr)) {
          const dia = ventasPorDiaMap.get(fechaStr)!;
          dia.cantidad += 1;
          dia.ingresos += orden.total;
        }
      });

      const ventasPorDia = Array.from(ventasPorDiaMap.values());

      // Horas pico (análisis de horas con más ventas)
      const horasPicoMap = new Map<number, number>();
      for (let i = 0; i < 24; i++) {
        horasPicoMap.set(i, 0);
      }

      ordenesSemana.forEach(orden => {
        if (!orden.created_at) return;
        const fecha = new Date(orden.created_at);
        const hora = fecha.getHours();
        horasPicoMap.set(hora, (horasPicoMap.get(hora) || 0) + 1);
      });

      const horasPico = Array.from(horasPicoMap.entries())
        .map(([hora, cantidad]) => ({ hora, cantidad }))
        .sort((a, b) => b.cantidad - a.cantidad)
        .slice(0, 5);

      // Crecimiento semanal
      const hace14Dias = new Date(ahora);
      hace14Dias.setDate(hace14Dias.getDate() - 14);
      const ordenesSemanaAnterior = ordenes.filter(o => {
        if (!o.created_at) return false;
        const fecha = new Date(o.created_at);
        return fecha >= hace14Dias && fecha < hace7Dias;
      });
      const ingresosSemanaAnterior = ordenesSemanaAnterior.reduce((sum, o) => sum + o.total, 0);
      const crecimientoSemanal = ingresosSemanaAnterior > 0
        ? ((ingresosSemana - ingresosSemanaAnterior) / ingresosSemanaAnterior) * 100
        : ingresosSemana > 0 ? 100 : 0;

      setStats({
        ventasHoy,
        ingresosHoy,
        ventasSemana,
        ingresosSemana,
        ventasMes,
        ingresosMes,
        ticketPromedio,
        productosVendidos,
        ventasPorDia,
        horasPico,
        crecimientoSemanal,
      });
    } catch (error) {
      console.error("Error loading statistics:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-gray-200 border-t-burgundy-600 mx-auto" />
          <p className="mt-4 text-gray-600">Cargando estadísticas...</p>
        </div>
      </div>
    );
  }

  if (!negocio || !stats) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">No se pudo cargar la información</p>
          <Button onClick={() => router.push("/admin")} className="mt-4">
            Volver al Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <AdminHeader
        title={`Estadísticas - ${negocio.nombre}`}
        subtitle="Análisis detallado de ventas y rendimiento"
      />

      <div className="p-8">
        {/* Back Button */}
        <Button
          variant="outline"
          onClick={() => router.push("/admin")}
          className="mb-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Volver al Dashboard
        </Button>

        {/* Métricas principales */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Ventas Hoy
              </CardTitle>
              <ShoppingBag className="h-5 w-5 text-burgundy-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.ventasHoy}</div>
              <p className="text-xs text-muted-foreground">
                {formatCurrency(stats.ingresosHoy)}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Ventas esta Semana
              </CardTitle>
              <Calendar className="h-5 w-5 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.ventasSemana}</div>
              <p className="text-xs text-muted-foreground">
                {formatCurrency(stats.ingresosSemana)}
              </p>
              {stats.crecimientoSemanal !== 0 && (
                <p className={`text-xs flex items-center mt-1 ${
                  stats.crecimientoSemanal >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {stats.crecimientoSemanal >= 0 ? (
                    <TrendingUp className="mr-1 h-3 w-3" />
                  ) : (
                    <TrendingDown className="mr-1 h-3 w-3" />
                  )}
                  {stats.crecimientoSemanal >= 0 ? '+' : ''}{stats.crecimientoSemanal.toFixed(1)}%
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Ventas este Mes
              </CardTitle>
              <DollarSign className="h-5 w-5 text-emerald-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.ventasMes}</div>
              <p className="text-xs text-muted-foreground">
                {formatCurrency(stats.ingresosMes)}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Ticket Promedio
              </CardTitle>
              <Star className="h-5 w-5 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(stats.ticketPromedio)}
              </div>
              <p className="text-xs text-muted-foreground">Por orden</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Productos más vendidos */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Package className="mr-2 h-5 w-5 text-burgundy-600" />
                Top 10 Productos Más Vendidos
              </CardTitle>
            </CardHeader>
            <CardContent>
              {stats.productosVendidos.length > 0 ? (
                <div className="space-y-4">
                  {stats.productosVendidos.map((producto, index) => (
                    <div
                      key={producto.producto_id}
                      className="flex items-center justify-between border-b pb-3 last:border-0"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-burgundy-100 text-sm font-bold text-burgundy-600">
                          {index + 1}
                        </div>
                        <div>
                          <p className="font-medium">{producto.nombre}</p>
                          <p className="text-sm text-muted-foreground">
                            {producto.cantidad} unidades
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-green-600">
                          {formatCurrency(producto.ingresos)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">
                  No hay datos de productos vendidos este mes
                </p>
              )}
            </CardContent>
          </Card>

          {/* Horas pico */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Clock className="mr-2 h-5 w-5 text-purple-600" />
                Horarios con Más Ventas
              </CardTitle>
            </CardHeader>
            <CardContent>
              {stats.horasPico.length > 0 && stats.horasPico.some(h => h.cantidad > 0) ? (
                <div className="space-y-4">
                  {stats.horasPico.filter(h => h.cantidad > 0).map((horario) => {
                    const maxVentas = Math.max(...stats.horasPico.map(h => h.cantidad));
                    const porcentaje = (horario.cantidad / maxVentas) * 100;

                    return (
                      <div key={horario.hora}>
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium">
                            {horario.hora.toString().padStart(2, '0')}:00 - {(horario.hora + 1).toString().padStart(2, '0')}:00
                          </span>
                          <span className="text-sm text-muted-foreground">
                            {horario.cantidad} ventas
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-purple-600 h-2 rounded-full transition-all"
                            style={{ width: `${porcentaje}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">
                  No hay suficientes datos de ventas esta semana
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Gráfico de ventas por día */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center">
              <TrendingUp className="mr-2 h-5 w-5 text-green-600" />
              Ventas de los Últimos 30 Días
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {stats.ventasPorDia.slice(-14).map((dia) => {
                const maxVentas = Math.max(...stats.ventasPorDia.map(d => d.cantidad));
                const porcentaje = maxVentas > 0 ? (dia.cantidad / maxVentas) * 100 : 0;
                const fecha = new Date(dia.fecha);
                const fechaFormateada = fecha.toLocaleDateString('es', {
                  day: '2-digit',
                  month: 'short'
                });

                return (
                  <div key={dia.fecha} className="flex items-center gap-4">
                    <div className="w-20 text-sm text-muted-foreground">
                      {fechaFormateada}
                    </div>
                    <div className="flex-1">
                      <div className="w-full bg-gray-200 rounded-full h-6 relative">
                        <div
                          className="bg-green-600 h-6 rounded-full transition-all flex items-center justify-end pr-2"
                          style={{ width: `${Math.max(porcentaje, 5)}%` }}
                        >
                          {dia.cantidad > 0 && (
                            <span className="text-xs text-white font-medium">
                              {dia.cantidad}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="w-24 text-sm font-medium text-right">
                      {formatCurrency(dia.ingresos)}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}