"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { productsApi, negociosApi } from "@/lib/api";
import { Producto, UpdateProductoRequest, Variante, Modificador, Negocio } from "@/types";
import { ArrowLeft, Plus, X } from "lucide-react";
import Link from "next/link";
import { useToast } from "@/lib/contexts/ToastContext";

export default function EditarProductoPage() {
  const router = useRouter();
  const params = useParams();
  const { success, error: showError } = useToast();
  const productoId = params.id as string;

  const [producto, setProducto] = useState<Producto | null>(null);
  const [negocios, setNegocios] = useState<Negocio[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState<UpdateProductoRequest>({
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
  const [newTag, setNewTag] = useState("");

  useEffect(() => {
    loadData();
  }, [productoId]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [productoData, negociosData] = await Promise.all([
        productsApi.getProductById(productoId),
        negociosApi.getMy(),
      ]);

      setProducto(productoData);
      setNegocios(negociosData);

      setFormData({
        nombre: productoData.nombre,
        descripcion: productoData.descripcion,
        precio_base: productoData.precio_base,
        categoria: productoData.categoria,
        imagen_url: productoData.imagen_url || "",
        disponible: productoData.disponible,
        variantes: productoData.variantes || [],
        modificadores: productoData.modificadores || [],
        tags: productoData.tags || [],
      });
    } catch (err) {
      console.error("Error loading producto:", err);
      setError("Error al cargar el producto");
      showError("No se pudo cargar el producto", "Error de carga");
    } finally {
      setIsLoading(false);
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

  const addTag = () => {
    if (newTag && !formData.tags?.includes(newTag)) {
      setFormData({
        ...formData,
        tags: [...(formData.tags || []), newTag],
      });
      setNewTag("");
    }
  };

  const removeTag = (tag: string) => {
    setFormData({
      ...formData,
      tags: formData.tags?.filter((t) => t !== tag),
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
      setIsSaving(true);
      await productsApi.updateProduct(productoId, formData);
      success(`Producto "${formData.nombre}" actualizado exitosamente`, "Cambios guardados");
      router.push("/admin/productos");
    } catch (err: any) {
      console.error("Error updating producto:", err);
      setError(err.response?.data?.message || "Error al actualizar el producto");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-gray-200 border-t-blue-600 mx-auto" />
          <p className="mt-4 text-gray-600">Cargando producto...</p>
        </div>
      </div>
    );
  }

  if (!producto) {
    return (
      <div>
        <AdminHeader title="Error" subtitle="No se pudo cargar el producto" />
        <div className="p-8">
          <Card>
            <CardContent className="p-6 text-center">
              <p className="text-red-600">{error || "Producto no encontrado"}</p>
              <Link href="/admin/productos" className="mt-4 inline-block">
                <Button>Volver a Productos</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div>
      <AdminHeader title="Editar Producto" subtitle={`Modificar información de ${producto.nombre}`} />

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
                  <Label htmlFor="negocio">Negocio</Label>
                  <p className="text-sm text-gray-600">
                    {negocios.find(n => n.id_negocio === producto.negocio_id)?.nombre || "N/A"}
                  </p>
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

          <Card>
            <CardHeader>
              <CardTitle>Tags</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  placeholder="Agregar tag (ej: vegetariano, picante)"
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                />
                <Button type="button" onClick={addTag}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              {formData.tags && formData.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {formData.tags.map((tag, index) => (
                    <div key={index} className="flex items-center gap-1 bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
                      <span>{tag}</span>
                      <button type="button" onClick={() => removeTag(tag)} className="hover:bg-blue-200 rounded-full p-0.5">
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <div className="flex gap-3">
            <Button type="submit" disabled={isSaving} className="flex-1">
              {isSaving ? (
                <>
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Guardando...
                </>
              ) : (
                "Guardar Cambios"
              )}
            </Button>
            <Link href="/admin/productos">
              <Button type="button" variant="outline" disabled={isSaving}>
                Cancelar
              </Button>
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
