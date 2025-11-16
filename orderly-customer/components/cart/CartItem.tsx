"use client";

import Image from "next/image";
import { Trash2, Plus, Minus } from "lucide-react";
import { CartItem as CartItemType } from "@/types";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";

interface CartItemProps {
  item: CartItemType;
  onUpdateQuantity: (itemId: string, newQuantity: number) => void;
  onRemove: (itemId: string) => void;
}

export function CartItem({
  item,
  onUpdateQuantity,
  onRemove,
}: CartItemProps) {
  return (
    <Card className="p-4">
      <div className="flex gap-4">
        {/* Imagen */}
        <div className="relative w-24 h-24 flex-shrink-0">
          <Image
            src={item.producto.imagen_url || "/placeholder-product.jpg"}
            alt={item.producto.nombre}
            fill
            className="object-cover rounded-md"
          />
        </div>

        {/* Información del producto */}
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-lg mb-1">
            {item.producto.nombre}
          </h3>

          {/* Variante seleccionada */}
          {item.variante_seleccionada && (
            <p className="text-sm text-muted-foreground">
              • {item.variante_seleccionada.nombre}
              {item.variante_seleccionada.precio_adicional > 0 &&
                ` (+${formatCurrency(
                  item.variante_seleccionada.precio_adicional
                )})`}
            </p>
          )}

          {/* Modificadores */}
          {item.modificadores_seleccionados.length > 0 && (
            <div className="text-sm text-muted-foreground">
              {item.modificadores_seleccionados.map((mod, index) => (
                <p key={index}>
                  • {mod.nombre}
                  {mod.precio_adicional > 0 &&
                    ` (+${formatCurrency(mod.precio_adicional)})`}
                </p>
              ))}
            </div>
          )}

          {/* Observaciones */}
          {item.observaciones && (
            <p className="text-sm text-muted-foreground italic mt-1">
              Nota: {item.observaciones}
            </p>
          )}

          {/* Controles de cantidad y precio */}
          <div className="flex items-center justify-between mt-3">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() =>
                  onUpdateQuantity(item.id, Math.max(1, item.cantidad - 1))
                }
                disabled={item.cantidad <= 1}
              >
                <Minus className="h-3 w-3" />
              </Button>
              <span className="font-semibold w-8 text-center">
                {item.cantidad}
              </span>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => onUpdateQuantity(item.id, item.cantidad + 1)}
              >
                <Plus className="h-3 w-3" />
              </Button>
            </div>

            <div className="flex items-center gap-3">
              <span className="font-bold text-lg">
                {formatCurrency(item.subtotal)}
              </span>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-destructive hover:text-destructive"
                onClick={() => onRemove(item.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
