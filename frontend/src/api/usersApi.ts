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
        let errorMessage: string;

        // Intentar parsear el JSON de error
        try {
            const errorData = JSON.parse(text);
            errorMessage = getErrorMessage(errorData);
        } catch (parseError) {
            // Si no es JSON válido, usar el texto directamente
            errorMessage = text || `Error ${res.status}`;
        }

        throw new Error(errorMessage);
    }
    return res.json();
}

function getErrorMessage(errorData: any): string {
    // Si hay un mensaje de error personalizado del backend
    if (errorData.details) {
        const details = errorData.details;

        // Traducir errores comunes de validación de Gin
        if (details.includes("'Email' Error:Field validation for 'Email' failed on the 'email' tag")) {
            return "El formato del email no es válido";
        }
        if (details.includes("'Username' Error:Field validation for 'Username' failed on the 'min' tag")) {
            return "El username debe tener al menos 3 caracteres";
        }
        if (details.includes("'Password' Error:Field validation for 'Password' failed on the 'min' tag")) {
            return "La contraseña debe tener al menos 8 caracteres";
        }
        if (details.includes("'Nombre' Error:Field validation for 'Nombre' failed on the 'required' tag")) {
            return "El nombre es obligatorio";
        }
        if (details.includes("'Apellido' Error:Field validation for 'Apellido' failed on the 'required' tag")) {
            return "El apellido es obligatorio";
        }

        // Errores de negocio del backend
        if (details.includes("username ya está en uso")) {
            return "Este nombre de usuario ya está en uso";
        }
        if (details.includes("email ya está registrado")) {
            return "Este email ya está registrado";
        }
        if (details.includes("Credenciales incorrectas")) {
            return "Usuario o contraseña incorrectos";
        }

        // Si no coincide con ninguno, devolver el mensaje original
        return details;
    }

    // Si hay un error genérico
    if (errorData.error) {
        return errorData.error;
    }

    // Fallback
    return "Ha ocurrido un error";
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
