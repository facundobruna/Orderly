"use client";

import Link from "next/link";
import { ShoppingCart, User, Search, Receipt } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useCartStore } from "@/lib/store/cartStore";
import { useAuthStore } from "@/lib/store/authStore";

interface HeaderProps {
  negocioNombre?: string;
  showSearch?: boolean;
  onSearchClick?: () => void;
}

export function Header({
  negocioNombre,
  showSearch = false,
  onSearchClick,
}: HeaderProps) {
  const { items } = useCartStore();
  const { user } = useAuthStore();

  const totalItems = items.reduce((sum, item) => sum + item.cantidad, 0);

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/" className="font-bold text-xl text-primary">
            Orderly
          </Link>
          {negocioNombre && (
            <>
              <span className="text-muted-foreground">/</span>
              <span className="font-semibold">{negocioNombre}</span>
            </>
          )}
        </div>

        <div className="flex items-center gap-2">
          {showSearch && (
            <Button variant="ghost" size="icon" onClick={onSearchClick}>
              <Search className="h-5 w-5" />
            </Button>
          )}

          <Link href="/cart">
            <Button variant="ghost" size="icon" className="relative">
              <ShoppingCart className="h-5 w-5" />
              {totalItems > 0 && (
                <Badge
                  variant="destructive"
                  className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
                >
                  {totalItems}
                </Badge>
              )}
            </Button>
          </Link>

          {user ? (
            <>
              <Link href="/mis-ordenes">
                <Button variant="ghost" size="icon" title="Mis Pedidos">
                  <Receipt className="h-5 w-5" />
                </Button>
              </Link>
              <Link href="/perfil">
                <Button variant="ghost" size="icon" title="Mi Perfil">
                  <User className="h-5 w-5" />
                </Button>
              </Link>
            </>
          ) : (
            <Link href="/login">
              <Button variant="ghost" size="sm">
                Iniciar Sesión
              </Button>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
