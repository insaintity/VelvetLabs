"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

export function emitToast(message: string, tone: "success" | "error" | "neutral" = "neutral") {
  window.dispatchEvent(new CustomEvent("velvet:toast", { detail: { message, tone } }));
}

export function ToastHost() {
  const [toasts, setToasts] = useState<Array<{ id: number; message: string; tone: string }>>([]);
  useEffect(() => {
    const listener = (event: Event) => {
      const detail = (event as CustomEvent<{ message: string; tone: string }>).detail;
      const id = Date.now();
      setToasts((current) => [...current.slice(-2), { id, ...detail }]);
      window.setTimeout(() => setToasts((current) => current.filter((toast) => toast.id !== id)), 3200);
    };
    window.addEventListener("velvet:toast", listener);
    return () => window.removeEventListener("velvet:toast", listener);
  }, []);
  return (
    <div className="pointer-events-none fixed right-5 top-20 z-[80] grid w-[320px] gap-2">
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div key={toast.id} initial={{ opacity: 0, x: 20, scale: 0.98 }} animate={{ opacity: 1, x: 0, scale: 1 }} exit={{ opacity: 0, x: 12 }} className={`panel rounded-lg px-4 py-3 text-sm shadow-2xl ${toast.tone === "error" ? "border-[rgba(219,99,114,.38)]" : toast.tone === "success" ? "border-[rgba(88,182,168,.35)]" : ""}`}>
            {toast.message}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
