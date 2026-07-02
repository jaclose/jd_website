"use client";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect } from "react";
import { useProgress, type ProgressToast } from "./lib/progress";

/**
 * Achievement / discovery toasts — a quiet card that rises top-centre when the
 * world acknowledges you, then leaves on its own. Secrets get the gold accent.
 */
function Toast({ toast }: { toast: ProgressToast }) {
  const dismiss = useProgress((s) => s.dismissToast);
  useEffect(() => {
    const id = setTimeout(() => dismiss(toast.key), 4600);
    return () => clearTimeout(id);
  }, [toast.key, dismiss]);
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -14, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -8, scale: 0.98 }}
      transition={{ duration: 0.32 }}
      className={`pointer-events-auto flex items-center gap-3 border px-4 py-2.5 shadow-[0_18px_60px_rgba(0,0,0,0.5)] backdrop-blur-md ${
        toast.secret ? "border-starlight/40 bg-[rgba(20,15,5,0.82)]" : "border-leaf/40 bg-[rgba(5,12,7,0.82)]"
      }`}
    >
      <span aria-hidden className={`text-lg ${toast.secret ? "text-starlight" : "text-leaf"}`}>
        ✦
      </span>
      <div>
        <p className={`label text-[7px]! tracking-[0.24em]! ${toast.secret ? "text-starlight/80" : "text-leaf/75"}`}>{toast.kicker}</p>
        <p className="mt-0.5 font-display text-base font-light leading-none text-ink">{toast.title}</p>
      </div>
    </motion.div>
  );
}

export default function SanctumToasts() {
  const toasts = useProgress((s) => s.toasts);
  return (
    <div className="pointer-events-none absolute left-1/2 top-20 z-40 flex -translate-x-1/2 flex-col items-center gap-2">
      <AnimatePresence mode="popLayout">
        {toasts.slice(0, 3).map((t) => (
          <Toast key={t.key} toast={t} />
        ))}
      </AnimatePresence>
    </div>
  );
}
