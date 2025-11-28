"use client";

import { useState, useMemo } from "react";
import Image from "next/image";
import { X, Plus, Minus } from "lucide-react";
import { Producto, Variante, Modificador } from "@/types";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { formatCurrency } from "@/lib/utils";

interface ProductDetailProps {
  producto: Producto;
  onClose: () => void;
  onAddToCart: (
    producto: Producto,
    cantidad: number,
    varianteSeleccionada?: Variante,
    modificadoresSeleccionados?: Modificador[],
    observaciones?: string
  ) => void;
}

export function ProductDetail({
  producto,
  onClose,
  onAddToCart,
}: ProductDetailProps) {
  const [cantidad, setCantidad] = useState(1);
  const [varianteSeleccionada, setVarianteSeleccionada] =
    useState<Variante | null>(null);
  const [modificadoresSeleccionados, setModificadoresSeleccionados] = useState<
    Modificador[]
  >([]);
  const [observaciones, setObservaciones] = useState("");

  const precioTotal = useMemo(() => {
    let total = producto.precio_base;
    if (varianteSeleccionada) {
      total += varianteSeleccionada.precio_adicional;
    }
    modificadoresSeleccionados.forEach((mod) => {
      total += mod.precio_adicional;
    });
    return total * cantidad;
  }, [
    producto.precio_base,
    varianteSeleccionada,
    modificadoresSeleccionados,
    cantidad,
  ]);

  const handleModificadorToggle = (modificador: Modificador) => {
    setModificadoresSeleccionados((prev) => {
      const existe = prev.find((m) => m.nombre === modificador.nombre);
      if (existe) {
        return prev.filter((m) => m.nombre !== modificador.nombre);
      } else {
        return [...prev, modificador];
      }
    });
  };

  const handleAddToCart = () => {
    onAddToCart(
      producto,
      cantidad,
      varianteSeleccionada || undefined,
      modificadoresSeleccionados,
      observaciones
    );
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="max-w-2xl w-full max-h-[90vh] overflow-y-auto bg-white">
        <div className="sticky top-0 bg-white border-b p-4 flex justify-between items-center z-10">
          <h2 className="text-xl font-bold">{producto.nombre}</h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        <div className="p-6 space-y-6">
          {/* Imagen */}
          <div className="relative w-full h-64">
            <Image
              src={producto.imagen_url || "/placeholder-product.jpg"}
              alt={producto.nombre}
              fill
              className="object-cover rounded-lg"
            />
          </div>

          {/* Descripción */}
          <div>
            <p className="text-muted-foreground">{producto.descripcion}</p>
            <p className="text-2xl font-bold mt-2">
              {formatCurrency(producto.precio_base)}
            </p>
          </div>

          {/* Variantes */}
          {producto.variantes && producto.variantes.length > 0 && (
            <div className="space-y-3">
              <Label className="text-base font-semibold">
                Selecciona un tamaño
              </Label>
              <div className="space-y-2">
                {producto.variantes.map((variante, index) => {
                  const isSelected = varianteSeleccionada?.nombre === variante.nombre;
                  return (
                    <div
                      key={index}
                      className={`border rounded-lg p-3 cursor-pointer transition-colors ${
                        isSelected
                          ? "border-primary bg-primary/10"
                          : "hover:border-primary/50"
                      }`}
                      onClick={() => setVarianteSeleccionada(variante)}
                    >
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <input
                            type="radio"
                            name="variante"
                            checked={isSelected}
                            onChange={() => {}}
                            className="rounded-full"
                          />
                          <span className="font-medium">{variante.nombre}</span>
                        </div>
                        <span className="text-sm">
                          {variante.precio_adicional > 0
                            ? `+${formatCurrency(variante.precio_adicional)}`
                            : "Incluido"}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Modificadores */}
          {producto.modificadores && producto.modificadores.length > 0 && (
            <div className="space-y-3">
              <Label className="text-base font-semibold">
                Modificadores opcionales
              </Label>
              <div className="space-y-2">
                {producto.modificadores.map((modificador, index) => {
                  const isSelected = modificadoresSeleccionados.some(
                    (m) => m.nombre === modificador.nombre
                  );
                  return (
                    <div
                      key={index}
                      className={`border rounded-lg p-3 cursor-pointer transition-colors ${
                        isSelected
                          ? "border-primary bg-primary/10"
                          : "hover:border-primary/50"
                      }`}
                      onClick={() => handleModificadorToggle(modificador)}
                    >
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => {}}
                            className="rounded"
                          />
                          <span className="font-medium">
                            {modificador.nombre}
                          </span>
                          {modificador.es_obligatorio && (
                            <Badge variant="destructive" className="text-xs">
                              Obligatorio
                            </Badge>
                          )}
                        </div>
                        <span className="text-sm">
                          {modificador.precio_adicional > 0
                            ? `+${formatCurrency(modificador.precio_adicional)}`
                            : "Gratis"}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Observaciones */}
          <div className="space-y-2">
            <Label htmlFor="observaciones">
              Observaciones (opcional)
            </Label>
            <Textarea
              id="observaciones"
              placeholder="Ej: Sin cebolla, cocción media, etc."
              value={observaciones}
              onChange={(e) => setObservaciones(e.target.value)}
              rows={3}
            />
          </div>

          {/* Cantidad */}
          <div className="space-y-2">
            <Label>Cantidad</Label>
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setCantidad(Math.max(1, cantidad - 1))}
                disabled={cantidad <= 1}
              >
                <Minus className="h-4 w-4" />
              </Button>
              <span className="text-2xl font-bold w-12 text-center">
                {cantidad}
              </span>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setCantidad(cantidad + 1)}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Footer con precio total y botón */}
        <div className="sticky bottom-0 bg-white border-t p-4">
          <div className="flex justify-between items-center mb-3">
            <span className="text-lg font-semibold">Total:</span>
            <span className="text-2xl font-bold text-primary">
              {formatCurrency(precioTotal)}
            </span>
          </div>
          <Button
            className="w-full"
            size="lg"
            onClick={handleAddToCart}
            disabled={!producto.disponible}
          >
            Agregar al Pedido
          </Button>
        </div>
      </Card>
    </div>
  );
}
