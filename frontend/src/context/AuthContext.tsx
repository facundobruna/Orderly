// src/context/AuthContext.tsx
import {
    createContext,
    useContext,
    useEffect,
    useState,
    type ReactNode,
} from "react";
import type { User, LoginRequest, RegisterRequest } from "../types/auth";
import { loginUser, registerUser } from "../api/usersApi";

interface AuthContextValue {
    user: User | null;
    token: string | null;
    loading: boolean;
    login: (req: LoginRequest) => Promise<void>;
    register: (req: RegisterRequest) => Promise<void>;
    logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const STORAGE_KEY = "arqsw2_auth";

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    // Cargar autenticación guardada al inicio
    useEffect(() => {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) {
            try {
                const parsed = JSON.parse(raw) as { token: string; user: User };
                setToken(parsed.token);
                setUser(parsed.user);
            } catch {
                localStorage.removeItem(STORAGE_KEY);
            }
        }
        setLoading(false);
    }, []);

    // Guardar cuando cambien user/token
    useEffect(() => {
        if (token && user) {
            localStorage.setItem(STORAGE_KEY, JSON.stringify({ token, user }));
        } else {
            localStorage.removeItem(STORAGE_KEY);
        }
    }, [token, user]);

    const login = async (req: LoginRequest) => {
        setLoading(true);
        try {
            const resp = await loginUser(req);
            setToken(resp.token);
            setUser(resp.user);
        } finally {
            setLoading(false);
        }
    };

    const register = async (req: RegisterRequest) => {
        setLoading(true);
        try {
            const resp = await registerUser(req);
            setToken(resp.token);
            setUser(resp.user);
        } finally {
            setLoading(false);
        }
    };

    const logout = () => {
        setToken(null);
        setUser(null);
    };

    return (
        <AuthContext.Provider
            value={{ user, token, loading, login, register, logout }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth(): AuthContextValue {
    const ctx = useContext(AuthContext);
    if (!ctx) {
        throw new Error("useAuth debe usarse dentro de un AuthProvider");
    }
    return ctx;
}
