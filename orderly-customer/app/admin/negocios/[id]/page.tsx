"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { negociosApi } from "@/lib/api";
import { UpdateNegocioRequest, Negocio } from "@/types";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useToast } from "@/lib/contexts/ToastContext";

export default function EditarNegocioPage() {
  const router = useRouter();
  const params = useParams();
  const { success, error: showError } = useToast();
  const negocioId = Number(params.id);

  const [negocio, setNegocio] = useState<Negocio | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState<UpdateNegocioRequest>({
    nombre: "",
    descripcion: "",
    direccion: "",
    telefono: "",
    sucursal: "",
    activo: true,
  });

  useEffect(() => {
    loadNegocio();
  }, [negocioId]);

  const loadNegocio = async () => {
    try {
      setIsLoading(true);
      const data = await negociosApi.getById(negocioId);
      setNegocio(data);
      setFormData({
        nombre: data.nombre,
        descripcion: data.descripcion,
        direccion: data.direccion,
        telefono: data.telefono,
        sucursal: data.sucursal,
        activo: data.activo,
      });
    } catch (err) {
      console.error("Error loading negocio:", err);
      setError("Error al cargar el negocio");
      showError("No se pudo cargar el negocio", "Error de carga");
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;
    setFormData({
      ...formData,
      [name]: type === "checkbox" ? (e.target as HTMLInputElement).checked : value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    try {
      setIsSaving(true);
      await negociosApi.update(negocioId, formData);
      success(`Negocio "${formData.nombre}" actualizado exitosamente`, "Cambios guardados");
      router.push("/admin/negocios");
    } catch (err: any) {
      console.error("Error updating negocio:", err);
      setError(err.response?.data?.message || "Error al actualizar el negocio");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-gray-200 border-t-blue-600 mx-auto" />
          <p className="mt-4 text-gray-600">Cargando negocio...</p>
        </div>
      </div>
    );
  }

  if (!negocio) {
    return (
      <div>
        <AdminHeader title="Error" subtitle="No se pudo cargar el negocio" />
        <div className="p-8">
          <Card>
            <CardContent className="p-6 text-center">
              <p className="text-red-600">{error || "Negocio no encontrado"}</p>
              <Link href="/admin/negocios" className="mt-4 inline-block">
                <Button>Volver a Negocios</Button>
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
        title="Editar Negocio"
        subtitle={`Modificar información de ${negocio.nombre}`}
      />

      <div className="p-8">
        <div className="mb-6">
          <Link href="/admin/negocios">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver a Negocios
            </Button>
          </Link>
        </div>

        <Card className="max-w-2xl">
          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="rounded-lg bg-red-50 p-4 text-sm text-red-600">
                  {error}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="nombre">Nombre del Negocio</Label>
                <Input
                  id="nombre"
                  name="nombre"
                  value={formData.nombre}
                  onChange={handleChange}
                  placeholder="Ej: La Pizzería de Carlitos"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="descripcion">Descripción</Label>
                <Textarea
                  id="descripcion"
                  name="descripcion"
                  value={formData.descripcion}
                  onChange={handleChange}
                  placeholder="Describe tu negocio..."
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="direccion">Dirección</Label>
                <Input
                  id="direccion"
                  name="direccion"
                  value={formData.direccion}
                  onChange={handleChange}
                  placeholder="Calle Principal 123"
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="telefono">Teléfono</Label>
                  <Input
                    id="telefono"
                    name="telefono"
                    value={formData.telefono}
                    onChange={handleChange}
                    placeholder="+54 11 1234-5678"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="sucursal">Sucursal</Label>
                  <Input
                    id="sucursal"
                    name="sucursal"
                    value={formData.sucursal}
                    onChange={handleChange}
                    placeholder="Ej: Centro, Palermo, etc."
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="activo"
                  name="activo"
                  checked={formData.activo}
                  onChange={handleChange}
                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <Label htmlFor="activo" className="cursor-pointer">
                  Negocio activo
                </Label>
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  type="submit"
                  disabled={isSaving}
                  className="flex-1"
                >
                  {isSaving ? (
                    <>
                      <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      Guardando...
                    </>
                  ) : (
                    "Guardar Cambios"
                  )}
                </Button>
                <Link href="/admin/negocios">
                  <Button type="button" variant="outline" disabled={isSaving}>
                    Cancelar
                  </Button>
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
