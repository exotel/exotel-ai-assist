import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";

export type ToastType = "success" | "error";

interface ToastItem {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextValue {
  success: (message: string) => void;
  error: (message: string) => void;
}

const MAX_VISIBLE_TOASTS = 5;
const AUTO_DISMISS_MS = 3000;

const ToastContext = createContext<ToastContextValue | null>(null);

// ---------------------------------------------------------------------------
// Individual toast — animates in on mount, calls onDismiss when clicked.
// ---------------------------------------------------------------------------
function ToastMessage({ item, onDismiss }: { item: ToastItem; onDismiss: (id: string) => void }) {
  const isSuccess = item.type === "success";

  return (
    <div
      className="oa-toast"
      data-type={item.type}
      role="status"
      aria-live="polite"
      onClick={() => onDismiss(item.id)}
      style={{
        display: "flex",
        alignItems: "center",
        gap: "8px",
        padding: "8px 14px",
        borderRadius: "8px",
        fontSize: "13px",
        fontWeight: 500,
        whiteSpace: "nowrap",
        cursor: "pointer",
        pointerEvents: "auto",
        boxShadow: "0 4px 12px rgba(0,0,0,0.12)",
        background: isSuccess ? "#ecfdf5" : "#fef2f2",
        color: isSuccess ? "#065f46" : "#991b1b",
        border: `1px solid ${isSuccess ? "#a7f3d0" : "#fecaca"}`,
        animation: "oa-toast-in 0.22s ease-out",
      }}
    >
      <span style={{ fontSize: "14px", lineHeight: 1 }}>{isSuccess ? "✓" : "✕"}</span>
      <span>{item.message}</span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Provider — renders children + the scoped toast stack.
// position:absolute positions it inside the nearest position:relative ancestor
// (oa-theme-root), so it never bleeds outside the widget boundary.
// ---------------------------------------------------------------------------
export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const timers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
    const timer = timers.current.get(id);
    if (timer !== undefined) {
      clearTimeout(timer);
      timers.current.delete(id);
    }
  }, []);

  const show = useCallback(
    (message: string, type: ToastType) => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;

      setToasts((prev) => {
        const next = [...prev, { id, message, type }];
        // Drop oldest entries when the stack exceeds the visible limit.
        if (next.length > MAX_VISIBLE_TOASTS) {
          const dropped = next.splice(0, next.length - MAX_VISIBLE_TOASTS);
          dropped.forEach((t) => {
            const timer = timers.current.get(t.id);
            if (timer !== undefined) {
              clearTimeout(timer);
              timers.current.delete(t.id);
            }
          });
        }
        return next;
      });

      timers.current.set(
        id,
        setTimeout(() => dismiss(id), AUTO_DISMISS_MS),
      );
    },
    [dismiss],
  );

  const success = useCallback((message: string) => show(message, "success"), [show]);
  const error = useCallback((message: string) => show(message, "error"), [show]);

  // Clean up all pending timers on unmount.
  useEffect(() => {
    return () => {
      timers.current.forEach(clearTimeout);
    };
  }, []);

  return (
    <ToastContext.Provider value={{ success, error }}>
      {children}
      {toasts.length > 0 && (
        <div
          style={{
            position: "absolute",
            bottom: "16px",
            left: "50%",
            transform: "translateX(-50%)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "6px",
            zIndex: 50,
            pointerEvents: "none",
          }}
        >
          {toasts.map((item) => (
            <ToastMessage key={item.id} item={item} onDismiss={dismiss} />
          ))}
        </div>
      )}
    </ToastContext.Provider>
  );
}

// ---------------------------------------------------------------------------
// Hook — consumed by any child that wants to fire a toast.
// ---------------------------------------------------------------------------
export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used inside <ToastProvider>");
  return ctx;
}
