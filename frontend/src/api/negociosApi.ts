// src/api/negociosApi.ts
export interface Negocio {
    id: number;
    nombre: string;
    descripcion: string;
    direccion: string;
    telefono: string;
    sucursal: string;
    id_usuario: number;
    activo: boolean;
}

const USERS_API_URL =
    import.meta.env.VITE_USERS_API_URL ?? "http://localhost:8080";

export async function getNegocioById(id: string | number): Promise<Negocio> {
    const res = await fetch(`${USERS_API_URL}/negocios/${id}`);
    if (!res.ok) {
        throw new Error(`Error obteniendo negocio: ${res.status}`);
    }
    const data = await res.json();

    // algunos back devuelven { negocio: {...} }
    return data.negocio ?? data;
}
