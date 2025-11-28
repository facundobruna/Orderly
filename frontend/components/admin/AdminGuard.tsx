"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/store/authStore";
import { isAdmin } from "@/lib/auth-utils";

interface AdminGuardProps {
  children: React.ReactNode;
}

export function AdminGuard({ children }: AdminGuardProps) {
  const router = useRouter();
  const { user, isAuthenticated, _hasHydrated } = useAuthStore();

  useEffect(() => {
    // Solo redirigir después de que el estado se haya hidratado
    if (!_hasHydrated) return;

    if (!isAuthenticated()) {
      router.push("/login?redirect=/admin");
      return;
    }

    if (!isAdmin(user)) {
      router.push("/");
      return;
    }
  }, [user, isAuthenticated, router, _hasHydrated]);

  // Esperar a que se hidrate el estado
  if (!_hasHydrated) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-burgundy-600 mx-auto" />
          <p className="mt-4 text-gray-600">Cargando...</p>
        </div>
      </div>
    );
  }

  // Show loading while checking auth after hydration
  if (!isAuthenticated() || !isAdmin(user)) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-burgundy-600 mx-auto" />
          <p className="mt-4 text-gray-600">Verificando permisos...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
