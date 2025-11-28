import axios, { AxiosError } from "axios";
import { useAuthStore } from "@/lib/store/authStore";
import { logError } from "@/lib/errorHandling";

// API Base URLs
export const USERS_API_URL =
  process.env.NEXT_PUBLIC_USERS_API_URL || "http://localhost:8080";
export const PRODUCTS_API_URL =
  process.env.NEXT_PUBLIC_PRODUCTS_API_URL || "http://localhost:8081";
export const ORDERS_API_URL =
  process.env.NEXT_PUBLIC_ORDERS_API_URL || "http://localhost:8082";
export const PAYMENTS_API_URL =
  process.env.NEXT_PUBLIC_PAYMENTS_API_URL || "http://localhost:8083";

// Create axios instances
export const usersClient = axios.create({
  baseURL: USERS_API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

export const productsClient = axios.create({
  baseURL: PRODUCTS_API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

export const ordersClient = axios.create({
  baseURL: ORDERS_API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

export const paymentsClient = axios.create({
  baseURL: PAYMENTS_API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Add auth token interceptor
const addAuthInterceptor = (client: typeof axios) => {
  client.interceptors.request.use((config) => {
    const token = useAuthStore.getState().token;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });
};

// Add interceptors to all clients
addAuthInterceptor(usersClient);
addAuthInterceptor(productsClient);
addAuthInterceptor(ordersClient);
addAuthInterceptor(paymentsClient);

// Add response error interceptor
const addErrorInterceptor = (client: typeof axios, clientName: string) => {
  client.interceptors.response.use(
    (response) => response,
    (error: AxiosError) => {
      // Log all errors for debugging
      logError(error, `API Client - ${clientName}`);

      // Handle authentication errors (401)
      if (error.response?.status === 401) {
        // Clear auth on unauthorized
        useAuthStore.getState().clearAuth();

        // Only redirect if we're in the browser
        if (typeof window !== "undefined") {
          // Avoid redirect loops - don't redirect if already on login page
          if (!window.location.pathname.includes("/login")) {
            window.location.href = "/login";
          }
        }
      }

      // Handle network errors
      if (!error.response && error.code === "ERR_NETWORK") {
        console.error(
          `[${clientName}] Error de red: No se pudo conectar al servidor. Verifica tu conexión a internet.`
        );
      }

      // Handle timeout errors
      if (error.code === "ECONNABORTED" || error.message.includes("timeout")) {
        console.error(
          `[${clientName}] Timeout: La solicitud tardó demasiado tiempo en responder.`
        );
      }

      // Reject the error to allow component-level handling
      return Promise.reject(error);
    }
  );
};

addErrorInterceptor(usersClient, "Users API");
addErrorInterceptor(productsClient, "Products API");
addErrorInterceptor(ordersClient, "Orders API");
addErrorInterceptor(paymentsClient, "Payments API");
