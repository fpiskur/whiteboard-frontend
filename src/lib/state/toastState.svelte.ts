export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
    id: number;
    message: string;
    type: ToastType;
    duration: number;  // ms
}

let toasts = $state<Toast[]>([]);
let nextId = 0;

function addToast(message: string, type: ToastType = 'info', duration: number = 4000): void {
    const id = nextId++;
    const toast: Toast = { id, message, type, duration };

    toasts.push(toast);

    // Auto-remove after duration
    if (duration > 0) {
        setTimeout(() => {
            removeToast(id);
        }, duration);
    }
}

function removeToast(id: number): void {
    toasts = toasts.filter(t => t.id !== id);
}

// Cenvenience methods
function showSuccess(message: string, duration?: number): void {
    addToast(message, 'success', duration);
}

function showError(message: string, duration?: number): void {
    addToast(message, 'error', duration);
}

function showWarning(message: string, duration?: number): void {
    addToast(message, 'warning', duration);
}

function showInfo(message: string, duration?: number): void {
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
