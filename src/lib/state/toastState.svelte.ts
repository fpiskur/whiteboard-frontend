export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
    id: number;
    message: string;
    type: ToastType;
    duration: number;  // ms
    timeoutId?: number;
}

let toasts = $state<Toast[]>([]);
let nextId = 0;

function addToast(message: string, type: ToastType = 'info', duration: number = 4000): void {
    const id = nextId++;
    const toast: Toast = { id, message, type, duration };

    toasts.push(toast);

    // Auto-remove after duration
    if (duration > 0) {
        const timeoutId = setTimeout(() => {
            removeToast(id);
        }, duration) as unknown as number;

        // Store timeout ID so you can cancel it if manually closed
        toast.timeoutId = timeoutId;
    }
}

function removeToast(id: number): void {
    const toast = toasts.find(t => t.id === id);

    // Clear pending timeout if exists
    if (toast?.timeoutId) {
        clearTimeout(toast.timeoutId);
    }

    toasts = toasts.filter(t => t.id !== id);
}

// Convenience methods
function showSuccess(message: string, duration: number = 3000): void {
    addToast(message, 'success', duration);
}

function showError(message: string, duration: number = 6000): void {
    addToast(message, 'error', duration);
}

function showWarning(message: string, duration: number = 5000): void {
    addToast(message, 'warning', duration);
}

function showInfo(message: string, duration: number = 4000): void {
    addToast(message, 'info', duration);
}

export const toastState = {
    get items() { return toasts; },
    addToast,
    removeToast,
    showSuccess,
    showError,
    showWarning,
    showInfo
};
