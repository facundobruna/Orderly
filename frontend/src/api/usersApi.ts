// src/api/usersApi.ts
import type {
    RegisterRequest,
    LoginRequest,
    AuthResponse,
    User,
} from "../types/auth";

const USERS_API_URL =
    import.meta.env.VITE_USERS_API_URL ?? "http://localhost:8080";

async function handleJson(res: Response): Promise<any> {
    if (!res.ok) {
        const text = await res.text();
        throw new Error(`Error ${res.status}: ${text}`);
    }
    return res.json();
}

function normalizeAuthResponse(data: any): AuthResponse {
    const token: string =
        data.token ?? data.access_token ?? data.Token ?? data.jwt ?? "";

    const user: User =
        data.user ??
        data.usuario ??
        data.data ??
        data.User ?? {
            id: "",
            nombre: "",
            apellido: "",
            email: "",
            username: "",
            rol: "cliente",
        };

    if (!token) {
        throw new Error("La respuesta de autenticación no incluye token");
    }

    return {
        token,
        user,
    };
}

export async function registerUser(req: RegisterRequest): Promise<AuthResponse> {
    const res = await fetch(`${USERS_API_URL}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(req),
    });

    const data = await handleJson(res);
    return normalizeAuthResponse(data);
}

export async function loginUser(req: LoginRequest): Promise<AuthResponse> {
    const res = await fetch(`${USERS_API_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(req),
    });

    const data = await handleJson(res);
    return normalizeAuthResponse(data);
}

// Opcional: si tu back tiene /users/me con token
export async function getMe(token: string): Promise<User> {
    const res = await fetch(`${USERS_API_URL}/users/me`, {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });

    const data = await handleJson(res);
    return (data.user ?? data.usuario ?? data) as User;
}
