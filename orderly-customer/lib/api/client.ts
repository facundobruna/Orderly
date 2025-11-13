import axios from "axios";
import { useAuthStore } from "@/lib/store/authStore";

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
const addErrorInterceptor = (client: typeof axios) => {
  client.interceptors.response.use(
    (response) => response,
    (error) => {
      if (error.response?.status === 401) {
        // Clear auth on unauthorized
        useAuthStore.getState().clearAuth();
        if (typeof window !== "undefined") {
          window.location.href = "/login";
        }
      }
      return Promise.reject(error);
    }
  );
};

addErrorInterceptor(usersClient);
addErrorInterceptor(productsClient);
addErrorInterceptor(ordersClient);
addErrorInterceptor(paymentsClient);
