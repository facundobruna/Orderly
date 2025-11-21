"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { productsApi, negociosApi } from "@/lib/api";
import { CreateProductoRequest, Variante, Modificador, Negocio } from "@/types";
import { ArrowLeft, Plus, X } from "lucide-react";
import Link from "next/link";
import { useToast } from "@/lib/contexts/ToastContext";

export default function NuevoProductoPage() {
  const router = useRouter();
  const { success, error: showError } = useToast();
  const [negocios, setNegocios] = useState<Negocio[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState<CreateProductoRequest>({
    negocio_id: "",
    sucursal_id: "",
    nombre: "",
    descripcion: "",
    precio_base: 0,
    categoria: "",
    imagen_url: "",
    disponible: true,
    variantes: [],
    modificadores: [],
    tags: [],
  });

  const [newVariante, setNewVariante] = useState<Variante>({ nombre: "", precio_adicional: 0 });
  const [newModificador, setNewModificador] = useState<Modificador>({ nombre: "", precio_adicional: 0, es_obligatorio: false });

  useEffect(() => {
    loadNegocios();
  }, []);

  const loadNegocios = async () => {
    try {
      const data = await negociosApi.getMy();
      setNegocios(data);
      if (data.length > 0) {
        setFormData(prev => ({
          ...prev,
          negocio_id: String(data[0].id_negocio),
          sucursal_id: data[0].sucursal,
        }));
      }
    } catch (err) {
      console.error("Error loading negocios:", err);
      showError("Error al cargar los negocios", "Error de carga");
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData({
      ...formData,
      [name]: type === "number" ? parseFloat(value) : type === "checkbox" ? (e.target as HTMLInputElement).checked : value,
    });
  };

  const addVariante = () => {
    if (newVariante.nombre) {
      setFormData({
        ...formData,
        variantes: [...(formData.variantes || []), newVariante],
      });
      setNewVariante({ nombre: "", precio_adicional: 0 });
    }
  };

  const removeVariante = (index: number) => {
    setFormData({
      ...formData,
      variantes: formData.variantes?.filter((_, i) => i !== index),
    });
  };

  const addModificador = () => {
    if (newModificador.nombre) {
      setFormData({
        ...formData,
        modificadores: [...(formData.modificadores || []), newModificador],
      });
      setNewModificador({ nombre: "", precio_adicional: 0, es_obligatorio: false });
    }
  };

  const removeModificador = (index: number) => {
    setFormData({
      ...formData,
      modificadores: formData.modificadores?.filter((_, i) => i !== index),
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!formData.nombre || !formData.categoria || formData.precio_base <= 0) {
      setError("Por favor completa todos los campos requeridos");
      return;
    }

    try {
      setIsLoading(true);
      await productsApi.createProduct(formData);
      success(`Producto "${formData.nombre}" creado exitosamente`, "Producto creado");
      router.push("/admin/productos");
    } catch (err: any) {
      console.error("Error creating producto:", err);
      setError(err.response?.data?.message || "Error al crear el producto");
    } finally {
      setIsLoading(false);
    }
  };

  if (negocios.length === 0) {
    return (
      <div>
        <AdminHeader title="Crear Producto" subtitle="Primero debes crear un negocio" />
        <div className="p-8">
          <Card>
            <CardContent className="p-6 text-center">
              <p className="text-gray-600 mb-4">No tienes negocios creados.</p>
              <Link href="/admin/negocios/nuevo">
                <Button>Crear Negocio</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div>
      <AdminHeader title="Crear Producto" subtitle="Añade un nuevo producto a tu menú" />

      <div className="p-8">
        <div className="mb-6">
          <Link href="/admin/productos">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver a Productos
            </Button>
          </Link>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 max-w-4xl">
          {error && (
            <div className="rounded-lg bg-red-50 p-4 text-sm text-red-600">
              {error}
            </div>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Información Básica</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="negocio_id">Negocio <span className="text-red-500">*</span></Label>
                  <select
                    id="negocio_id"
                    name="negocio_id"
                    value={formData.negocio_id}
                    onChange={(e) => {
                      const negocio = negocios.find(n => String(n.id_negocio) === e.target.value);
                      setFormData({
                        ...formData,
                        negocio_id: e.target.value,
                        sucursal_id: negocio?.sucursal || "",
                      });
                    }}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    {negocios.map((negocio) => (
                      <option key={negocio.id_negocio} value={negocio.id_negocio}>
                        {negocio.nombre}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="categoria">Categoría <span className="text-red-500">*</span></Label>
                  <Input
                    id="categoria"
                    name="categoria"
                    value={formData.categoria}
                    onChange={handleChange}
                    placeholder="Ej: Pizzas, Bebidas, Postres"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="nombre">Nombre <span className="text-red-500">*</span></Label>
                <Input
                  id="nombre"
                  name="nombre"
                  value={formData.nombre}
                  onChange={handleChange}
                  placeholder="Ej: Pizza Margarita"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="descripcion">Descripción</Label>
                <Textarea
                  id="descripcion"
                  name="descripcion"
                  value={formData.descripcion}
                  onChange={handleChange}
                  placeholder="Describe el producto..."
                  rows={3}
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="precio_base">Precio Base <span className="text-red-500">*</span></Label>
                  <Input
                    id="precio_base"
                    name="precio_base"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.precio_base}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="imagen_url">URL de Imagen</Label>
                  <Input
                    id="imagen_url"
                    name="imagen_url"
                    value={formData.imagen_url}
                    onChange={handleChange}
                    placeholder="https://..."
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="disponible"
                  name="disponible"
                  checked={formData.disponible}
                  onChange={handleChange}
                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <Label htmlFor="disponible" className="cursor-pointer">Producto disponible</Label>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Variantes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  placeholder="Nombre (ej: Grande)"
                  value={newVariante.nombre}
                  onChange={(e) => setNewVariante({ ...newVariante, nombre: e.target.value })}
                />
                <Input
                  type="number"
                  step="0.01"
                  placeholder="Precio"
                  value={newVariante.precio_adicional || ""}
                  onChange={(e) => setNewVariante({ ...newVariante, precio_adicional: parseFloat(e.target.value) || 0 })}
                  className="w-32"
                />
                <Button type="button" onClick={addVariante}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              {formData.variantes && formData.variantes.length > 0 && (
                <div className="space-y-2">
                  {formData.variantes.map((variante, index) => (
                    <div key={index} className="flex items-center justify-between bg-gray-50 p-3 rounded">
                      <span>{variante.nombre} (+${variante.precio_adicional.toFixed(2)})</span>
                      <Button type="button" variant="ghost" size="sm" onClick={() => removeVariante(index)}>
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Modificadores</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  placeholder="Nombre (ej: Extra queso)"
                  value={newModificador.nombre}
                  onChange={(e) => setNewModificador({ ...newModificador, nombre: e.target.value })}
                />
                <Input
                  type="number"
                  step="0.01"
                  placeholder="Precio"
                  value={newModificador.precio_adicional || ""}
                  onChange={(e) => setNewModificador({ ...newModificador, precio_adicional: parseFloat(e.target.value) || 0 })}
                  className="w-32"
                />
                <Button type="button" onClick={addModificador}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              {formData.modificadores && formData.modificadores.length > 0 && (
                <div className="space-y-2">
                  {formData.modificadores.map((modificador, index) => (
                    <div key={index} className="flex items-center justify-between bg-gray-50 p-3 rounded">
                      <span>{modificador.nombre} (+${modificador.precio_adicional.toFixed(2)})</span>
                      <Button type="button" variant="ghost" size="sm" onClick={() => removeModificador(index)}>
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <div className="flex gap-3">
            <Button type="submit" disabled={isLoading} className="flex-1">
              {isLoading ? "Creando..." : "Crear Producto"}
            </Button>
            <Link href="/admin/productos">
              <Button type="button" variant="outline" disabled={isLoading}>
                Cancelar
              </Button>
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
