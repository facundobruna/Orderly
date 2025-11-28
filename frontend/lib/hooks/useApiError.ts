import { useCallback } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/lib/contexts/ToastContext";
import { useAuthStore } from "@/lib/store/authStore";
import {
  parseError,
  getUserFriendlyMessage,
  getErrorTitle,
  logError,
  shouldRedirectToLogin,
  isRetryableError,
  AppError,
} from "@/lib/errorHandling";

interface UseApiErrorOptions {
  /**
   * Contexto para el log de errores (ej: "LoginPage", "CreateOrder")
   */
  context?: string;

  /**
   * Si es true, no muestra el toast de error (útil para manejo manual)
   */
  silent?: boolean;

  /**
   * Si es true, no redirige al login en errores 401
   */
  preventRedirect?: boolean;

  /**
   * Callback personalizado para manejar el error
   */
  onError?: (error: AppError) => void;
}

interface UseApiErrorReturn {
  /**
   * Maneja un error mostrando un toast y registrándolo
   */
  handleError: (error: unknown, customMessage?: string) => void;

  /**
   * Parsea un error sin mostrarlo (útil para validación)
   */
  parseApiError: (error: unknown) => AppError;

  /**
   * Verifica si un error puede ser reintentado
   */
  canRetry: (error: unknown) => boolean;
}

/**
 * Hook para manejar errores de API de forma consistente
 *
 * @example
 * ```tsx
 * const { handleError } = useApiError({ context: "LoginPage" });
 *
 * try {
 *   await authApi.login(credentials);
 * } catch (error) {
 *   handleError(error);
 * }
 * ```
 *
 * @example Con mensaje personalizado
 * ```tsx
 * const { handleError } = useApiError({ context: "CreateProduct" });
 *
 * try {
 *   await productsApi.createProduct(data);
 * } catch (error) {
 *   handleError(error, "No se pudo crear el producto. Verifica los datos.");
 * }
 * ```
 */
export function useApiError(options: UseApiErrorOptions = {}): UseApiErrorReturn {
  const { context, silent = false, preventRedirect = false, onError } = options;
  const { error: showErrorToast } = useToast();
  const router = useRouter();
  const { clearAuth } = useAuthStore();

  /**
   * Maneja un error de forma completa
   */
  const handleError = useCallback(
    (error: unknown, customMessage?: string) => {
      // Parsear el error
      const appError = parseError(error);

      // Registrar en consola
      logError(error, context);

      // Ejecutar callback personalizado si existe
      if (onError) {
        onError(appError);
      }

      // Manejar errores de autenticación (401)
      if (shouldRedirectToLogin(error) && !preventRedirect) {
        clearAuth();
        if (!silent) {
          showErrorToast(
            "Tu sesión ha expirado. Por favor, inicia sesión nuevamente.",
            "Sesión Expirada"
          );
        }
        // Dar tiempo para que se muestre el toast antes de redirigir
        setTimeout(() => {
          router.push("/login");
        }, 1000);
        return;
      }

      // Mostrar toast de error si no es silencioso
      if (!silent) {
        const message = customMessage || getUserFriendlyMessage(error);
        const title = getErrorTitle(error);
        showErrorToast(message, title);
      }
    },
    [context, silent, preventRedirect, onError, showErrorToast, router, clearAuth]
  );

  /**
   * Parsea un error sin mostrarlo
   */
  const parseApiError = useCallback((error: unknown): AppError => {
    return parseError(error);
  }, []);

  /**
   * Verifica si un error puede ser reintentado
   */
  const canRetry = useCallback((error: unknown): boolean => {
    return isRetryableError(error);
  }, []);

  return {
    handleError,
    parseApiError,
    canRetry,
  };
}
