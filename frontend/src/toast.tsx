import { createContext, useContext, useMemo } from "react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

type ToastVariant = "info" | "error";

export function emitToast(message: string, variant: ToastVariant = "info") {
  if (typeof window === "undefined") {
    return;
  }
  if (variant === "error") {
    toast.error(message);
    return;
  }
  toast.info(message);
}

type ToastContextValue = {
  notify: (message: string, variant?: ToastVariant) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const value = useMemo(
    () => ({
      notify: (message: string, variant: ToastVariant = "info") =>
        emitToast(message, variant),
    }),
    [],
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastContainer
        position="bottom-right"
        autoClose={4000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        pauseOnFocusLoss
        pauseOnHover
        draggable
      />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within ToastProvider");
  }
  return context;
}
