"use client";

import Image from "next/image";
import { Producto } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";

interface ProductCardProps {
  producto: Producto;
  onClick?: () => void;
}

export function ProductCard({ producto, onClick }: ProductCardProps) {
  return (
    <Card
      className="cursor-pointer hover:shadow-lg transition-shadow"
      onClick={onClick}
    >
      <div className="relative w-full h-48">
        <Image
          src={producto.imagen_url || "/placeholder-product.jpg"}
          alt={producto.nombre}
          fill
          className="object-cover rounded-t-lg"
        />
        {!producto.disponible && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <Badge variant="destructive">No Disponible</Badge>
          </div>
        )}
      </div>
      <CardContent className="p-4">
        <div className="flex justify-between items-start mb-2">
          <h3 className="font-semibold text-lg line-clamp-1">
            {producto.nombre}
          </h3>
          <span className="font-bold text-primary">
            {formatCurrency(producto.precio_base)}
          </span>
        </div>
        <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
          {producto.descripcion}
        </p>
        <div className="flex gap-1 flex-wrap">
          {producto.tags?.slice(0, 3).map((tag, index) => (
            <Badge key={index} variant="secondary" className="text-xs">
              {tag}
            </Badge>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
