import { useState, useCallback, useEffect } from 'react';

export interface ToastItem {
  id: string;
  type: 'low_stock' | 'success' | 'warning' | 'info';
  title: string;
  description: string;
  itemDetails?: {
    itemId: string;
    description: string;
    currentStock: number;
    reorderThreshold: number;
    uom: string;
  };
  duration?: number;
}

type ToastListener = (toasts: ToastItem[]) => void;

let memoryToasts: ToastItem[] = [];
const listeners: Set<ToastListener> = new Set();

const notifyListeners = () => {
  setTimeout(() => {
    listeners.forEach((listener) => listener([...memoryToasts]));
  }, 0);
};

export const toast = (options: Omit<ToastItem, 'id'>) => {
  const id = Math.random().toString(36).substring(2, 9);
  const duration = options.duration !== undefined ? options.duration : 1000;
  const newToast: ToastItem = {
    ...options,
    id,
    duration,
  };

  // Prepend to show newest first, capped strictly at max 3 items
  memoryToasts = [newToast, ...memoryToasts].slice(0, 3);
  notifyListeners();

  // Auto dismiss after duration (1 second)
  if (duration > 0) {
    setTimeout(() => {
      memoryToasts = memoryToasts.filter((t) => t.id !== id);
      notifyListeners();
    }, duration);
  }

  return id;
};

export const dismissToast = (id: string) => {
  memoryToasts = memoryToasts.filter((t) => t.id !== id);
  notifyListeners();
};

export function useToast() {
  const [toasts, setToasts] = useState<ToastItem[]>(memoryToasts);

  useEffect(() => {
    listeners.add(setToasts);
    return () => {
      listeners.delete(setToasts);
    };
  }, []);

  return {
    toasts,
    toast,
    dismissToast
  };
}
