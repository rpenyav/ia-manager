import { createContext, useContext, useEffect, useMemo, useState } from 'react';

type ToastVariant = 'info' | 'error';

type ToastItem = {
  id: string;
  message: string;
  variant: ToastVariant;
};

const TOAST_EVENT = 'pm-toast';

type ToastEventDetail = {
  message: string;
  variant?: ToastVariant;
};

export function emitToast(message: string, variant: ToastVariant = 'info') {
  if (typeof window === 'undefined') {
    return;
  }
  window.dispatchEvent(
    new CustomEvent<ToastEventDetail>(TOAST_EVENT, { detail: { message, variant } })
  );
}

type ToastContextValue = {
  notify: (message: string, variant?: ToastVariant) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  useEffect(() => {
    const handler = (event: Event) => {
      const detail = (event as CustomEvent<ToastEventDetail>).detail;
      if (!detail?.message) {
        return;
      }
      const toast: ToastItem = {
        id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
        message: detail.message,
        variant: detail.variant ?? 'info'
      };
      setToasts((prev) => [...prev, toast]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((item) => item.id !== toast.id));
      }, 4000);
    };

    window.addEventListener(TOAST_EVENT, handler as EventListener);
    return () => window.removeEventListener(TOAST_EVENT, handler as EventListener);
  }, []);

  const value = useMemo(
    () => ({
      notify: (message: string, variant: ToastVariant = 'info') =>
        emitToast(message, variant)
    }),
    []
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="toast-stack">
        {toasts.map((toast) => (
          <div key={toast.id} className={`toast ${toast.variant}`}>
            {toast.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return context;
}
