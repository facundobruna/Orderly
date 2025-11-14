interface ImportMetaEnv {
    readonly VITE_ORDERS_API_URL: string;
    readonly VITE_PRODUCTS_API_URL: string;
    readonly VITE_USERS_API_URL: string;
    [key: string]: string | undefined;
}

interface ImportMeta {
    readonly env: ImportMetaEnv;
}
