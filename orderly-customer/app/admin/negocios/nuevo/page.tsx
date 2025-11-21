"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { AddressAutocomplete } from "@/components/shared/AddressAutocomplete";
import { negociosApi } from "@/lib/api";
import { CreateNegocioRequest } from "@/types";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useToast } from "@/lib/contexts/ToastContext";

export default function NuevoNegocioPage() {
  const router = useRouter();
  const { success } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState<CreateNegocioRequest>({
    nombre: "",
    descripcion: "",
    direccion: "",
    telefono: "",
    sucursal: "",
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Validar campos requeridos
    if (!formData.nombre || !formData.descripcion || !formData.direccion || !formData.telefono || !formData.sucursal) {
      setError("Por favor completa todos los campos requeridos");
      return;
    }

    try {
      setIsLoading(true);
      await negociosApi.create(formData);
      success(`Negocio "${formData.nombre}" creado exitosamente`, "Negocio creado");
      router.push("/admin/negocios");
    } catch (err: any) {
      console.error("Error creating negocio:", err);
      setError(err.response?.data?.message || "Error al crear el negocio");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <AdminHeader
        title="Crear Negocio"
        subtitle="Añade un nuevo restaurante o local"
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
                <Label htmlFor="nombre">
                  Nombre del Negocio <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="nombre"
                  name="nombre"
                  value={formData.nombre}
                  onChange={handleChange}
                  placeholder="Ej: La Pizzería de Carlitos"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="descripcion">
                  Descripción <span className="text-red-500">*</span>
                </Label>
                <Textarea
                  id="descripcion"
                  name="descripcion"
                  value={formData.descripcion}
                  onChange={handleChange}
                  placeholder="Describe tu negocio..."
                  rows={3}
                  required
                />
              </div>

              <AddressAutocomplete
                value={formData.direccion}
                onChange={(address) => setFormData({ ...formData, direccion: address })}
                label="Dirección"
                placeholder="Ej: Av. Colón 1234, Córdoba"
                required
              />

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="telefono">
                    Teléfono <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="telefono"
                    name="telefono"
                    value={formData.telefono}
                    onChange={handleChange}
                    placeholder="+54 11 1234-5678"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="sucursal">
                    Sucursal <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="sucursal"
                    name="sucursal"
                    value={formData.sucursal}
                    onChange={handleChange}
                    placeholder="Ej: Centro, Palermo, etc."
                    required
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1"
                >
                  {isLoading ? (
                    <>
                      <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      Creando...
                    </>
                  ) : (
                    "Crear Negocio"
                  )}
                </Button>
                <Link href="/admin/negocios">
                  <Button type="button" variant="outline" disabled={isLoading}>
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
