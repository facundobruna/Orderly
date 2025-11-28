"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { QrCode } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useCartStore } from "@/lib/store/cartStore";
import { useApiError } from "@/lib/hooks/useApiError";

interface MesaQRData {
  negocio_id: number;
  mesa: string;
  sucursal_id: string;
}

export default function MesaQRPage() {
  const params = useParams();
  const router = useRouter();
  const { setMesa } = useCartStore();
  const { handleError } = useApiError({ context: "MesaQRPage" });

  useEffect(() => {
    try {
      // Decodificar QR code (base64)
      const qrCode = params.qr as string;
      const decoded = atob(qrCode);
      const data: MesaQRData = JSON.parse(decoded);

      // Guardar mesa en el store
      setMesa(data.mesa);

      // Redirigir al menú del negocio
      setTimeout(() => {
        router.push(`/negocio/${data.negocio_id}`);
      }, 1500);
    } catch (error) {
      console.error("Error al decodificar QR:", error);
      handleError(error, "El código QR es inválido. Redirigiendo al inicio...");
      // Si hay error, redirigir al inicio
      setTimeout(() => {
        router.push("/");
      }, 2000);
    }
  }, [params.qr, router, setMesa, handleError]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-burgundy-50 to-white px-4">
      <Card className="w-full max-w-md">
        <CardContent className="pt-12 pb-12 text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-burgundy-100 mb-6 animate-pulse">
            <QrCode className="h-10 w-10 text-burgundy-600" />
          </div>
          <h2 className="text-2xl font-bold mb-2">Código QR Detectado</h2>
          <p className="text-muted-foreground mb-4">
            Redirigiendo al menú...
          </p>
          <div className="flex justify-center gap-2">
            <div className="w-2 h-2 rounded-full bg-burgundy-600 animate-bounce" />
            <div className="w-2 h-2 rounded-full bg-burgundy-600 animate-bounce delay-75" />
            <div className="w-2 h-2 rounded-full bg-burgundy-600 animate-bounce delay-150" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
