"use client";

import { Bell, Search } from "lucide-react";
import { Input } from "@/components/ui/input";

interface AdminHeaderProps {
  title: string;
  subtitle?: string;
}

export function AdminHeader({ title, subtitle }: AdminHeaderProps) {
  return (
    <div className="border-b border-gray-200 bg-white px-8 py-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
          {subtitle && (
            <p className="mt-1 text-sm text-gray-500">{subtitle}</p>
          )}
        </div>

        <div className="flex items-center space-x-4">
          {/* Search */}
          <div className="relative hidden md:block">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              type="search"
              placeholder="Buscar..."
              className="w-64 pl-10"
            />
          </div>

          {/* Notifications */}
          <button className="relative rounded-full p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600">
            <Bell className="h-5 w-5" />
            <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-red-500" />
          </button>
        </div>
      </div>
    </div>
  );
}
