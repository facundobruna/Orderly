import { AxiosError } from "axios";

/**
 * Tipos de errores que puede manejar la aplicación
 */
export enum ErrorType {
  VALIDATION = "VALIDATION",
  AUTHENTICATION = "AUTHENTICATION",
  AUTHORIZATION = "AUTHORIZATION",
  NOT_FOUND = "NOT_FOUND",
  NETWORK = "NETWORK",
  SERVER = "SERVER",
  TIMEOUT = "TIMEOUT",
  UNKNOWN = "UNKNOWN",
}

/**
 * Interface para errores estructurados de la aplicación
 */
export interface AppError {
  type: ErrorType;
  message: string;
  details?: string;
  statusCode?: number;
  originalError?: any;
}

/**
 * Mensajes de error por defecto en español para cada tipo
 */
const DEFAULT_ERROR_MESSAGES: Record<ErrorType, string> = {
  [ErrorType.VALIDATION]: "Los datos ingresados no son válidos",
  [ErrorType.AUTHENTICATION]: "Tu sesión ha expirado. Por favor, inicia sesión nuevamente",
  [ErrorType.AUTHORIZATION]: "No tienes permisos para realizar esta acción",
  [ErrorType.NOT_FOUND]: "El recurso solicitado no fue encontrado",
  [ErrorType.NETWORK]: "Error de conexión. Verifica tu conexión a internet",
  [ErrorType.SERVER]: "Error en el servidor. Por favor, intenta nuevamente",
  [ErrorType.TIMEOUT]: "La solicitud tardó demasiado tiempo. Intenta nuevamente",
  [ErrorType.UNKNOWN]: "Ocurrió un error inesperado. Por favor, intenta nuevamente",
};

/**
 * Categoriza un error según su código de estado HTTP
 */
function categorizeErrorByStatus(status?: number): ErrorType {
  if (!status) return ErrorType.UNKNOWN;

  if (status >= 400 && status < 500) {
    switch (status) {
      case 400:
        return ErrorType.VALIDATION;
      case 401:
        return ErrorType.AUTHENTICATION;
      case 403:
        return ErrorType.AUTHORIZATION;
      case 404:
        return ErrorType.NOT_FOUND;
      case 408:
        return ErrorType.TIMEOUT;
      default:
        return ErrorType.VALIDATION;
    }
  }

  if (status >= 500) {
    return ErrorType.SERVER;
  }

  return ErrorType.UNKNOWN;
}

/**
 * Extrae el mensaje de error de diferentes formatos de respuesta
 */
function extractErrorMessage(error: any): string | undefined {
  // Intentar obtener el mensaje del backend
  if (error.response?.data) {
    const data = error.response.data;

    // Formato: { error: "mensaje" }
    if (typeof data.error === "string") {
      return data.error;
    }

    // Formato: { message: "mensaje" }
    if (typeof data.message === "string") {
      return data.message;
    }

    // Formato: { msg: "mensaje" }
    if (typeof data.msg === "string") {
      return data.msg;
    }

    // Formato: { errors: [{msg: "mensaje"}] } (validación express-validator)
    if (Array.isArray(data.errors) && data.errors.length > 0) {
      const messages = data.errors
        .map((err: any) => err.msg || err.message)
        .filter(Boolean);
      if (messages.length > 0) {
        return messages.join(", ");
      }
    }
  }

  return undefined;
}

/**
 * Extrae detalles adicionales del error para debugging
 */
function extractErrorDetails(error: any): string | undefined {
  if (error.response?.data?.details) {
    return String(error.response.data.details);
  }

  if (error.response?.data?.stack && process.env.NODE_ENV === "development") {
    return error.response.data.stack;
  }

  return undefined;
}

/**
 * Convierte un error de Axios u otro error en un AppError estructurado
 */
export function parseError(error: unknown): AppError {
  // Si ya es un AppError, devolverlo
  if (isAppError(error)) {
    return error;
  }

  // Manejar errores de Axios
  if (isAxiosError(error)) {
    const axiosError = error as AxiosError;
    const status = axiosError.response?.status;
    const type = categorizeErrorByStatus(status);
    const extractedMessage = extractErrorMessage(axiosError);
    const details = extractErrorDetails(axiosError);

    // Casos especiales de error de red
    if (axiosError.code === "ECONNABORTED" || axiosError.message.includes("timeout")) {
      return {
        type: ErrorType.TIMEOUT,
        message: extractedMessage || DEFAULT_ERROR_MESSAGES[ErrorType.TIMEOUT],
        details,
        statusCode: status,
        originalError: axiosError,
      };
    }

    if (axiosError.code === "ERR_NETWORK" || !axiosError.response) {
      return {
        type: ErrorType.NETWORK,
        message: extractedMessage || DEFAULT_ERROR_MESSAGES[ErrorType.NETWORK],
        details,
        originalError: axiosError,
      };
    }

    return {
      type,
      message: extractedMessage || DEFAULT_ERROR_MESSAGES[type],
      details,
      statusCode: status,
      originalError: axiosError,
    };
  }

  // Manejar errores estándar de JavaScript
  if (error instanceof Error) {
    return {
      type: ErrorType.UNKNOWN,
      message: error.message || DEFAULT_ERROR_MESSAGES[ErrorType.UNKNOWN],
      details: error.stack,
      originalError: error,
    };
  }

  // Manejar strings u otros tipos
  if (typeof error === "string") {
    return {
      type: ErrorType.UNKNOWN,
      message: error,
      originalError: error,
    };
  }

  // Caso por defecto
  return {
    type: ErrorType.UNKNOWN,
    message: DEFAULT_ERROR_MESSAGES[ErrorType.UNKNOWN],
    originalError: error,
  };
}

/**
 * Type guard para verificar si un error es de Axios
 */
function isAxiosError(error: any): error is AxiosError {
  return error?.isAxiosError === true;
}

/**
 * Type guard para verificar si un error es un AppError
 */
function isAppError(error: any): error is AppError {
  return (
    error &&
    typeof error === "object" &&
    "type" in error &&
    "message" in error &&
    Object.values(ErrorType).includes(error.type)
  );
}

/**
 * Obtiene un mensaje de error amigable para el usuario
 */
export function getUserFriendlyMessage(error: unknown): string {
  const appError = parseError(error);
  return appError.message;
}

/**
 * Obtiene el título del error según su tipo
 */
export function getErrorTitle(error: unknown): string {
  const appError = parseError(error);

  const titles: Record<ErrorType, string> = {
    [ErrorType.VALIDATION]: "Datos Inválidos",
    [ErrorType.AUTHENTICATION]: "Sesión Expirada",
    [ErrorType.AUTHORIZATION]: "Acceso Denegado",
    [ErrorType.NOT_FOUND]: "No Encontrado",
    [ErrorType.NETWORK]: "Error de Conexión",
    [ErrorType.SERVER]: "Error del Servidor",
    [ErrorType.TIMEOUT]: "Tiempo Agotado",
    [ErrorType.UNKNOWN]: "Error",
  };

  return titles[appError.type];
}

/**
 * Registra un error en la consola con formato
 */
export function logError(error: unknown, context?: string): void {
  const appError = parseError(error);

  const prefix = context ? `[${context}]` : "[Error]";

  console.error(`${prefix} ${appError.type}:`, appError.message);

  if (appError.statusCode) {
    console.error(`${prefix} Status Code:`, appError.statusCode);
  }

  if (appError.details && process.env.NODE_ENV === "development") {
    console.error(`${prefix} Details:`, appError.details);
  }

  if (appError.originalError && process.env.NODE_ENV === "development") {
    console.error(`${prefix} Original Error:`, appError.originalError);
  }
}

/**
 * Determina si un error debería redirigir al login
 */
export function shouldRedirectToLogin(error: unknown): boolean {
  const appError = parseError(error);
  return appError.type === ErrorType.AUTHENTICATION;
}

/**
 * Determina si un error puede ser reintentado
 */
export function isRetryableError(error: unknown): boolean {
  const appError = parseError(error);
  return [
    ErrorType.NETWORK,
    ErrorType.TIMEOUT,
    ErrorType.SERVER,
  ].includes(appError.type);
}
