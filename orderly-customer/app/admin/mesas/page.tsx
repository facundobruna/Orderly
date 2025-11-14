"use client";

import { useEffect, useState } from "react";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { mesasApi, negociosApi } from "@/lib/api";
import { Mesa, Negocio, CreateMesaRequest } from "@/types";
import { Plus, Table2, Trash2, QrCode, Download } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";

export default function MesasPage() {
  const [mesas, setMesas] = useState<Mesa[]>([]);
  const [negocios, setNegocios] = useState<Negocio[]>([]);
  const [selectedNegocio, setSelectedNegocio] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newMesa, setNewMesa] = useState<CreateMesaRequest>({ numero: "", sucursal_id: "" });

  useEffect(() => {
    loadNegocios();
  }, []);

  useEffect(() => {
    if (selectedNegocio) {
      loadMesas();
    }
  }, [selectedNegocio]);

  const loadNegocios = async () => {
    try {
      const data = await negociosApi.getMy();
      setNegocios(data);
      if (data.length > 0) {
        setSelectedNegocio(data[0].id_negocio);
      }
    } catch (error) {
      console.error("Error loading negocios:", error);
    }
  };

  const loadMesas = async () => {
    if (!selectedNegocio) return;

    try {
      setIsLoading(true);
      const data = await mesasApi.getByNegocio(selectedNegocio);
      setMesas(data);
    } catch (error) {
      console.error("Error loading mesas:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedNegocio) return;

    const negocio = negocios.find(n => n.id_negocio === selectedNegocio);
    if (!negocio) return;

    try {
      const created = await mesasApi.create(selectedNegocio, {
        ...newMesa,
        sucursal_id: negocio.sucursal,
      });
      setMesas([...mesas, created]);
      setNewMesa({ numero: "", sucursal_id: "" });
      setShowCreateForm(false);
    } catch (error) {
      console.error("Error creating mesa:", error);
      alert("Error al crear la mesa");
    }
  };

  const handleDelete = async (mesaId: number) => {
    if (!selectedNegocio || !confirm("¿Eliminar esta mesa?")) return;

    try {
      await mesasApi.delete(selectedNegocio, mesaId);
      setMesas(mesas.filter(m => m.id_mesa !== mesaId));
    } catch (error) {
      console.error("Error deleting mesa:", error);
      alert("Error al eliminar la mesa");
    }
  };

  return (
    <div>
      <AdminHeader title="Mesas" subtitle="Gestiona las mesas de tus negocios" />

      <div className="p-8">
        <div className="flex flex-col gap-4 mb-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <label className="text-sm font-medium text-gray-700">Negocio:</label>
            <select
              value={selectedNegocio || ""}
              onChange={(e) => setSelectedNegocio(Number(e.target.value))}
              className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              {negocios.map((negocio) => (
                <option key={negocio.id_negocio} value={negocio.id_negocio}>
                  {negocio.nombre}
                </option>
              ))}
            </select>
          </div>

          <Button onClick={() => setShowCreateForm(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Crear Mesa
          </Button>
        </div>

        {showCreateForm && (
          <Card className="mb-6">
            <CardContent className="p-6">
              <form onSubmit={handleCreate} className="flex gap-4">
                <Input
                  placeholder="Número de mesa (ej: 1, A1, VIP-1)"
                  value={newMesa.numero}
                  onChange={(e) => setNewMesa({ ...newMesa, numero: e.target.value })}
                  required
                />
                <Button type="submit">Crear</Button>
                <Button type="button" variant="outline" onClick={() => setShowCreateForm(false)}>
                  Cancelar
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-gray-200 border-t-blue-600" />
          </div>
        ) : mesas.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16">
              <Table2 className="h-16 w-16 text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No hay mesas</h3>
              <p className="text-gray-600 text-center mb-6">Crea mesas para que los clientes puedan hacer pedidos.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {mesas.map((mesa) => (
              <Card key={mesa.id_mesa} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-purple-100">
                        <Table2 className="h-6 w-6 text-purple-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">Mesa {mesa.numero}</h3>
                        <span className={`text-xs px-2 py-1 rounded ${mesa.activo ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"}`}>
                          {mesa.activo ? "Activa" : "Inactiva"}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="mb-4 p-3 bg-white border rounded flex flex-col items-center">
                    <QRCodeSVG
                      id={`qr-${mesa.id_mesa}`}
                      value={mesa.qr_code}
                      size={120}
                      level="H"
                      includeMargin={true}
                    />
                    <p className="text-xs text-gray-500 mt-2 text-center break-all">
                      {mesa.qr_code.slice(0, 20)}...
                    </p>
                  </div>

                  <div className="text-xs text-gray-600 mb-4">
                    <div>ID: {mesa.id_mesa}</div>
                    <div>Sucursal: {mesa.sucursal_id}</div>
                  </div>

                  <div className="space-y-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={() => {
                        const canvas = document.createElement('canvas');
                        const svg = document.querySelector(`#qr-${mesa.id_mesa}`);
                        if (!svg) return;

                        const svgData = new XMLSerializer().serializeToString(svg);
                        const img = new Image();
                        img.onload = () => {
                          canvas.width = img.width;
                          canvas.height = img.height;
                          const ctx = canvas.getContext('2d');
                          ctx?.drawImage(img, 0, 0);
                          const pngFile = canvas.toDataURL('image/png');
                          const downloadLink = document.createElement('a');
                          downloadLink.download = `mesa-${mesa.numero}-qr.png`;
                          downloadLink.href = pngFile;
                          downloadLink.click();
                        };
                        img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
                      }}
                    >
                      <Download className="mr-2 h-4 w-4" />
                      Descargar QR
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full text-red-600 hover:bg-red-50"
                      onClick={() => handleDelete(mesa.id_mesa)}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Eliminar
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
