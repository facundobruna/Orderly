"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";

interface CartSummaryProps {
  subtotal: number;
  impuestos: number;
  total: number;
  onCheckout: () => void;
  disabled?: boolean;
}

export function CartSummary({
  subtotal,
  impuestos,
  total,
  onCheckout,
  disabled = false,
}: CartSummaryProps) {
  return (
    <Card className="sticky top-20">
      <CardHeader>
        <CardTitle>Resumen del Pedido</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Subtotal</span>
            <span>{formatCurrency(subtotal)}</span>
          </div>
          {impuestos > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Impuestos</span>
              <span>{formatCurrency(impuestos)}</span>
            </div>
          )}
          <div className="border-t pt-2 mt-2">
            <div className="flex justify-between text-lg font-bold">
              <span>Total</span>
              <span className="text-primary">{formatCurrency(total)}</span>
            </div>
          </div>
        </div>

        <Button
          className="w-full"
          size="lg"
          onClick={onCheckout}
          disabled={disabled}
        >
          Proceder al Pago
        </Button>
      </CardContent>
    </Card>
  );
}
