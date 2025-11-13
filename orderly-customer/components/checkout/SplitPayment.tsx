"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Plus, Minus, Users, Check, Clock, Share2 } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface SplitPaymentProps {
  total: number;
  onSplitChange: (numPersonas: number, enabled: boolean) => void;
}

export function SplitPayment({ total, onSplitChange }: SplitPaymentProps) {
  const [enabled, setEnabled] = useState(false);
  const [numPersonas, setNumPersonas] = useState(2);

  const montoPorPersona = enabled ? total / numPersonas : total;

  const handleToggle = () => {
    const newEnabled = !enabled;
    setEnabled(newEnabled);
    onSplitChange(numPersonas, newEnabled);
  };

  const handleNumPersonasChange = (newNum: number) => {
    setNumPersonas(newNum);
    if (enabled) {
      onSplitChange(newNum, enabled);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            <CardTitle className="text-lg">Dividir Cuenta</CardTitle>
          </div>
          <Button
            variant={enabled ? "default" : "outline"}
            size="sm"
            onClick={handleToggle}
          >
            {enabled ? "Activado" : "Desactivado"}
          </Button>
        </div>
      </CardHeader>
      {enabled && (
        <CardContent className="space-y-4">
          {/* Control de número de personas */}
          <div className="space-y-2">
            <Label>Dividir entre</Label>
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                size="icon"
                onClick={() =>
                  handleNumPersonasChange(Math.max(2, numPersonas - 1))
                }
                disabled={numPersonas <= 2}
              >
                <Minus className="h-4 w-4" />
              </Button>
              <div className="text-center">
                <div className="text-3xl font-bold">{numPersonas}</div>
                <div className="text-sm text-muted-foreground">personas</div>
              </div>
              <Button
                variant="outline"
                size="icon"
                onClick={() =>
                  handleNumPersonasChange(Math.min(10, numPersonas + 1))
                }
                disabled={numPersonas >= 10}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Resumen de división */}
          <div className="bg-muted rounded-lg p-4 space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">
                Total a pagar:
              </span>
              <span className="font-semibold">{formatCurrency(total)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">
                Por persona:
              </span>
              <span className="text-xl font-bold text-primary">
                {formatCurrency(montoPorPersona)}
              </span>
            </div>
          </div>

          {/* Vista de personas */}
          <div className="space-y-2">
            <Label>Estado de pagos</Label>
            <div className="space-y-2">
              {Array.from({ length: numPersonas }).map((_, index) => (
                <Card key={index} className="p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center font-semibold text-sm">
                        {index + 1}
                      </div>
                      <div>
                        <div className="font-medium">
                          {index === 0 ? "Tú" : `Persona ${index + 1}`}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {formatCurrency(montoPorPersona)}
                        </div>
                      </div>
                    </div>
                    <Badge
                      variant={index === 0 ? "success" : "secondary"}
                      className="flex items-center gap-1"
                    >
                      {index === 0 ? (
                        <>
                          <Check className="h-3 w-3" />
                          Listo
                        </>
                      ) : (
                        <>
                          <Clock className="h-3 w-3" />
                          Esperando
                        </>
                      )}
                    </Badge>
                  </div>
                </Card>
              ))}
            </div>
          </div>

          {/* Botón para compartir */}
          {numPersonas > 1 && (
            <Button variant="outline" className="w-full" size="lg">
              <Share2 className="h-4 w-4 mr-2" />
              Compartir links de pago
            </Button>
          )}

          {/* Información adicional */}
          <div className="text-xs text-muted-foreground bg-blue-50 dark:bg-blue-950 p-3 rounded-lg">
            <p>
              💡 Cada persona recibirá un link único para pagar su parte. El
              pedido se confirmará cuando todos hayan completado su pago.
            </p>
          </div>
        </CardContent>
      )}
    </Card>
  );
}
