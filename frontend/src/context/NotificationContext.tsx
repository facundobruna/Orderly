// src/context/NotificationContext.tsx
import { createContext, useContext, useState, ReactNode } from "react";
import Toast, { ToastType } from "../components/Toast";

interface Notification {
    id: string;
    message: string;
    type: ToastType;
    duration?: number;
}

interface NotificationContextType {
    showNotification: (message: string, type: ToastType, duration?: number) => void;
    showSuccess: (message: string, duration?: number) => void;
    showError: (message: string, duration?: number) => void;
    showInfo: (message: string, duration?: number) => void;
    showWarning: (message: string, duration?: number) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: ReactNode }) {
    const [notifications, setNotifications] = useState<Notification[]>([]);

    const showNotification = (message: string, type: ToastType, duration = 5000) => {
        const id = `${Date.now()}-${Math.random()}`;
        const notification: Notification = { id, message, type, duration };

        setNotifications((prev) => [...prev, notification]);
    };

    const removeNotification = (id: string) => {
        setNotifications((prev) => prev.filter((n) => n.id !== id));
    };

    const showSuccess = (message: string, duration?: number) => {
        showNotification(message, "success", duration);
    };

    const showError = (message: string, duration?: number) => {
        showNotification(message, "error", duration);
    };

    const showInfo = (message: string, duration?: number) => {
        showNotification(message, "info", duration);
    };

    const showWarning = (message: string, duration?: number) => {
        showNotification(message, "warning", duration);
    };

    return (
        <NotificationContext.Provider
            value={{ showNotification, showSuccess, showError, showInfo, showWarning }}
        >
            {children}
            <div className="toast-container">
                {notifications.map((notification) => (
                    <Toast
                        key={notification.id}
                        id={notification.id}
                        message={notification.message}
                        type={notification.type}
                        duration={notification.duration}
                        onClose={removeNotification}
                    />
                ))}
            </div>
        </NotificationContext.Provider>
    );
}

export function useNotification() {
    const context = useContext(NotificationContext);
    if (!context) {
        throw new Error("useNotification must be used within NotificationProvider");
    }
    return context;
}