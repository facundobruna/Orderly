"use client";

import { PaymentMethod } from "@/types";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { DollarSign, CreditCard, Smartphone } from "lucide-react";

interface PaymentSelectorProps {
  selectedMethod: PaymentMethod;
  onSelectMethod: (method: PaymentMethod) => void;
}

export function PaymentSelector({
  selectedMethod,
  onSelectMethod,
}: PaymentSelectorProps) {
  const paymentMethods = [
    {
      id: "efectivo" as PaymentMethod,
      name: "Efectivo",
      description: "Paga en efectivo al recibir tu pedido",
      icon: DollarSign,
    },
    {
      id: "transferencia" as PaymentMethod,
      name: "Transferencia",
      description: "Realiza una transferencia bancaria",
      icon: CreditCard,
    },
    {
      id: "mercadopago" as PaymentMethod,
      name: "Mercado Pago",
      description: "Paga con tarjeta de crédito o débito",
      icon: Smartphone,
    },
  ];

  return (
    <div className="space-y-3">
      <Label className="text-base font-semibold">Método de Pago</Label>
      <div className="grid gap-3">
        {paymentMethods.map((method) => {
          const Icon = method.icon;
          return (
            <Card
              key={method.id}
              className={`p-4 cursor-pointer transition-colors ${
                selectedMethod === method.id
                  ? "border-primary bg-primary/10"
                  : "hover:border-primary/50"
              }`}
              onClick={() => onSelectMethod(method.id)}
            >
              <div className="flex items-start gap-3">
                <div
                  className={`p-2 rounded-lg ${
                    selectedMethod === method.id
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted"
                  }`}
                >
                  <Icon className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <input
                      type="radio"
                      checked={selectedMethod === method.id}
                      onChange={() => {}}
                      className="mt-0.5"
                    />
                    <span className="font-semibold">{method.name}</span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    {method.description}
                  </p>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
