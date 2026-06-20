import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}

export function safeUUID(): string {
    if (typeof window !== 'undefined' && typeof window.crypto !== 'undefined' && typeof window.crypto.randomUUID === 'function') {
        return window.crypto.randomUUID();
    }
    // Fallback UUID v4 generator
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        const r = (Math.random() * 16) | 0;
        const v = c === 'x' ? r : (r & 0x3) | 0x8;
        return v.toString(16);
    });
}

export function safeSessionStorageGet(key: string): string | null {
    if (typeof window === 'undefined') return null;
    try {
        return window.sessionStorage.getItem(key);
    } catch (e) {
        console.warn("sessionStorage.getItem failed:", e);
        return null;
    }
}

export function safeSessionStorageSet(key: string, value: string): void {
    if (typeof window === 'undefined') return;
    try {
        window.sessionStorage.setItem(key, value);
    } catch (e) {
        console.warn("sessionStorage.setItem failed:", e);
    }
}
