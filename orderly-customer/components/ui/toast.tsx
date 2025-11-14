"use client";

import { X, CheckCircle, XCircle, AlertCircle, Info } from "lucide-react";
import { cn } from "@/lib/utils";

export type ToastType = "success" | "error" | "warning" | "info";

export interface Toast {
  id: string;
  type: ToastType;
  title?: string;
  message: string;
  duration?: number;
}

interface ToastItemProps {
  toast: Toast;
  onClose: (id: string) => void;
}

const icons = {
  success: CheckCircle,
  error: XCircle,
  warning: AlertCircle,
  info: Info,
};

const styles = {
  success: "bg-green-50 border-green-200 text-green-800",
  error: "bg-red-50 border-red-200 text-red-800",
  warning: "bg-yellow-50 border-yellow-200 text-yellow-800",
  info: "bg-blue-50 border-blue-200 text-blue-800",
};

const iconStyles = {
  success: "text-green-600",
  error: "text-red-600",
  warning: "text-yellow-600",
  info: "text-blue-600",
};

export function ToastItem({ toast, onClose }: ToastItemProps) {
  const Icon = icons[toast.type];

  return (
    <div
      className={cn(
        "pointer-events-auto flex w-full max-w-md overflow-hidden rounded-lg border shadow-lg mb-4 animate-in slide-in-from-top-5",
        styles[toast.type]
      )}
    >
      <div className="flex w-0 flex-1 items-start p-4">
        <Icon className={cn("h-5 w-5 flex-shrink-0 mt-0.5", iconStyles[toast.type])} />
        <div className="ml-3 flex-1">
          {toast.title && (
            <p className="text-sm font-semibold">{toast.title}</p>
          )}
          <p className={cn("text-sm", toast.title && "mt-1")}>{toast.message}</p>
        </div>
      </div>
      <div className="flex border-l border-gray-200">
        <button
          onClick={() => onClose(toast.id)}
          className="flex w-full items-center justify-center p-4 text-sm font-medium hover:opacity-75 focus:outline-none"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

interface ToastContainerProps {
  toasts: Toast[];
  onClose: (id: string) => void;
}

export function ToastContainer({ toasts, onClose }: ToastContainerProps) {
  return (
    <div className="pointer-events-none fixed top-0 right-0 z-50 flex max-h-screen w-full flex-col-reverse p-4 sm:top-4 sm:right-4 sm:max-w-md sm:flex-col">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onClose={onClose} />
      ))}
    </div>
  );
}
