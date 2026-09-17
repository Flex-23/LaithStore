"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import { CheckIcon, CloseIcon } from "@/components/icons";

type ToastType = "success" | "error" | "info";
type Toast = { id: number; message: string; type: ToastType };

type ToastContextValue = {
  toast: (message: string, type?: ToastType) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within <ToastProvider>");
  return ctx;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback(
    (message: string, type: ToastType = "success") => {
      const id = Date.now() + Math.random();
      setToasts((prev) => [...prev, { id, message, type }]);
      setTimeout(() => dismiss(id), 2800);
    },
    [dismiss],
  );

  const value = useMemo(() => ({ toast }), [toast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 top-4 z-[100] flex flex-col items-center gap-2 px-4 sm:items-end sm:pe-6">
        {toasts.map((t) => (
          <div
            key={t.id}
            role="status"
            className="animate-scale-in pointer-events-auto flex w-full max-w-sm items-center gap-3 rounded-2xl border border-border bg-surface px-4 py-3 shadow-[0_20px_50px_-20px_rgba(0,0,0,0.45)]"
          >
            <span
              className={`grid h-8 w-8 shrink-0 place-items-center rounded-full text-white ${
                t.type === "error"
                  ? "bg-danger"
                  : t.type === "info"
                    ? "bg-brand"
                    : "bg-success"
              }`}
            >
              <CheckIcon width={16} height={16} />
            </span>
            <p className="flex-1 text-sm font-medium text-foreground">
              {t.message}
            </p>
            <button
              onClick={() => dismiss(t.id)}
              className="text-muted transition-colors hover:text-foreground"
              aria-label="إغلاق"
            >
              <CloseIcon width={16} height={16} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
