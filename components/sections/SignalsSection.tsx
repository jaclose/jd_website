"use client";

import { useEffect, useRef, useState } from "react";
import { useInView } from "framer-motion";
import SignalBoard from "@/components/signal/SignalBoard";
import { createNativeStates, type NativeProvider, type NativeState, type SignalResponse } from "@/components/signal/types";
import { nativeSignals, signalDesign } from "@/data/signals";
import { unlockVisitor } from "@/lib/visitor";

/** an error whose message is safe to show visitors (sanitized by the relay) */
class RelayError extends Error {}

export default function SignalsSection() {
  const section = useRef<HTMLElement>(null);
  const requested = useRef(false);
  const inView = useInView(section, { once: true, margin: "-25% 0px -25% 0px" });
  const [nativeStates, setNativeStates] = useState<Record<NativeProvider, NativeState>>(() => createNativeStates());

  useEffect(() => {
    if (inView) unlockVisitor("tuned-in");
  }, [inView]);

  useEffect(() => {
    if (!inView || requested.current) return;
    requested.current = true;
    const ctrl = new AbortController();

    nativeSignals.forEach((signal) => {
      setNativeStates((prev) => ({
        ...prev,
        [signal.id]: { ...prev[signal.id], loading: true, error: null },
      }));

      fetch(signal.endpoint, { signal: ctrl.signal })
        .then(async (response) => {
          // a platform error page (HTML) must never leak into the board as text
          const payload = (await response.json().catch(() => null)) as SignalResponse | { message?: string } | null;
          if (!response.ok || !payload) {
            const message =
              payload && typeof payload === "object" && "message" in payload && payload.message
                ? String(payload.message)
                : signal.offlineCopy;
            throw new RelayError(message);
          }

          setNativeStates((prev) => ({
            ...prev,
            [signal.id]: { loading: false, data: payload as SignalResponse, error: null },
          }));
        })
        .catch((error) => {
          if (error instanceof Error && error.name === "AbortError") return;
          setNativeStates((prev) => ({
            ...prev,
            [signal.id]: {
              loading: false,
              data: null,
              // network failures ("Failed to fetch") fall back to the calm offline copy
              error: error instanceof RelayError && error.message ? error.message : signal.offlineCopy,
            },
          }));
        });
    });

    return () => ctrl.abort();
  }, [inView]);

  return (
    <section
      ref={section}
      id="signals"
      className="biome-signals relative flex min-h-svh flex-col justify-center overflow-hidden px-6 py-20 md:px-12"
    >
      <div aria-hidden className="pointer-events-none absolute inset-0 opacity-60">
        <div className="absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-comet/25 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 h-px bg-linear-to-r from-transparent via-starlight/20 to-transparent" />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(232,230,225,0.018)_1px,transparent_1px),linear-gradient(180deg,rgba(232,230,225,0.012)_1px,transparent_1px)] bg-[size:72px_72px]" />
      </div>
      <SignalBoard states={nativeStates} design={signalDesign} />
    </section>
  );
}
