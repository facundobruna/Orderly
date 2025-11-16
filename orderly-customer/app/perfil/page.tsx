"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/shared/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useAuthStore } from "@/lib/store/authStore";
import { authApi } from "@/lib/api";
import { User, Shield, LogOut, Mail, UserCircle } from "lucide-react";

export default function PerfilPage() {
  const router = useRouter();
  const { user, clearAuth } = useAuthStore();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [formData, setFormData] = useState({
    nombre: "",
    apellido: "",
    email: "",
  });

  useEffect(() => {
    if (!user) {
      router.push("/login");
      return;
    }

    setFormData({
      nombre: user.nombre,
      apellido: user.apellido,
      email: user.email,
    });
  }, [user, router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    try {
      setIsSaving(true);
      // TODO: Implementar endpoint de actualización de perfil en el backend
      // await authApi.updateProfile(formData);
      setSuccess("Perfil actualizado correctamente");
      setIsEditing(false);
    } catch (err: any) {
      setError(err.response?.data?.error || "Error al actualizar el perfil");
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = () => {
    if (confirm("¿Estás seguro de que deseas cerrar sesión?")) {
      clearAuth();
      router.push("/");
    }
  };

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-3xl font-bold mb-8">Mi Perfil</h1>

          <div className="grid gap-6">
            {/* Información de la Cuenta */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Información de la Cuenta</CardTitle>
                  {!isEditing && (
                    <Button variant="outline" onClick={() => setIsEditing(true)}>
                      Editar
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md mb-4 text-sm">
                    {error}
                  </div>
                )}
                {success && (
                  <div className="bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded-md mb-4 text-sm">
                    {success}
                  </div>
                )}

                {isEditing ? (
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="nombre">Nombre</Label>
                        <Input
                          id="nombre"
                          name="nombre"
                          value={formData.nombre}
                          onChange={handleChange}
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="apellido">Apellido</Label>
                        <Input
                          id="apellido"
                          name="apellido"
                          value={formData.apellido}
                          onChange={handleChange}
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        value={formData.email}
                        onChange={handleChange}
                        required
                      />
                    </div>

                    <div className="flex gap-3">
                      <Button type="submit" disabled={isSaving}>
                        {isSaving ? "Guardando..." : "Guardar Cambios"}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setIsEditing(false);
                          setFormData({
                            nombre: user.nombre,
                            apellido: user.apellido,
                            email: user.email,
                          });
                        }}
                        disabled={isSaving}
                      >
                        Cancelar
                      </Button>
                    </div>
                  </form>
                ) : (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground flex items-center gap-2">
                          <UserCircle className="h-4 w-4" />
                          Nombre
                        </p>
                        <p className="font-semibold">{user.nombre}</p>
                      </div>

                      <div>
                        <p className="text-sm text-muted-foreground flex items-center gap-2">
                          <UserCircle className="h-4 w-4" />
                          Apellido
                        </p>
                        <p className="font-semibold">{user.apellido}</p>
                      </div>
                    </div>

                    <div>
                      <p className="text-sm text-muted-foreground flex items-center gap-2">
                        <Mail className="h-4 w-4" />
                        Email
                      </p>
                      <p className="font-semibold">{user.email}</p>
                    </div>

                    <div>
                      <p className="text-sm text-muted-foreground flex items-center gap-2">
                        <User className="h-4 w-4" />
                        Usuario
                      </p>
                      <p className="font-semibold">{user.username}</p>
                    </div>

                    <div>
                      <p className="text-sm text-muted-foreground flex items-center gap-2">
                        <Shield className="h-4 w-4" />
                        Rol
                      </p>
                      <Badge variant={user.rol === "dueno" ? "default" : "secondary"}>
                        {user.rol === "dueno" ? "Dueño de Negocio" : "Cliente"}
                      </Badge>
                    </div>

                    <div>
                      <p className="text-sm text-muted-foreground">Estado</p>
                      <Badge variant={user.activo ? "success" : "destructive"}>
                        {user.activo ? "Activo" : "Inactivo"}
                      </Badge>
                    </div>

                    <div>
                      <p className="text-sm text-muted-foreground">Miembro desde</p>
                      <p className="font-semibold">
                        {new Date(user.creado_en).toLocaleDateString("es-AR", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Accesos Rápidos */}
            <Card>
              <CardHeader>
                <CardTitle>Accesos Rápidos</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {user.rol === "dueno" && (
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => router.push("/admin")}
                  >
                    <Shield className="mr-2 h-4 w-4" />
                    Panel de Administración
                  </Button>
                )}

                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => router.push("/cart")}
                >
                  <User className="mr-2 h-4 w-4" />
                  Mi Carrito
                </Button>
              </CardContent>
            </Card>

            {/* Cerrar Sesión */}
            <Card>
              <CardHeader>
                <CardTitle>Sesión</CardTitle>
              </CardHeader>
              <CardContent>
                <Button
                  variant="destructive"
                  className="w-full"
                  onClick={handleLogout}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Cerrar Sesión
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
