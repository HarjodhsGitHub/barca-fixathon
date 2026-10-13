"use client";
// A number that glides to its new value (ease-out-quart) and briefly tints
// by direction: green when it went down, amber when it went up. With `from`
// it counts up once on mount, e.g. the recommended price on the compare step.
import { useEffect, useRef, useState } from "react";

const reduced = () => typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

export function AnimatedNumber({
  value,
  format,
  className,
  duration = 520,
  from,
  delay = 0,
}: {
  value: number;
  format: (n: number) => string;
  className?: string;
  duration?: number;
  /** Count from this value on mount. */
  from?: number;
  /** Wait before the mount count starts (ms). */
  delay?: number;
}) {
  const [shown, setShown] = useState(from ?? value);
  const [tick, setTick] = useState<{ n: number; dir: "up" | "down" } | null>(null);
  const last = useRef(from ?? value);
  const frame = useRef<number | null>(null);
  const current = useRef(from ?? value);

  useEffect(() => {
    if (last.current === value) return;
    const start = last.current;
    const dir = value < start ? "down" : "up";
    last.current = value;
    if (reduced()) {
      frame.current = requestAnimationFrame(() => setShown(value));
      return () => {
        if (frame.current) cancelAnimationFrame(frame.current);
      };
    }
    let t0 = 0;
    let finished = false;
    const tickFn = (t: number) => {
      if (!t0) t0 = t;
      const k = Math.min(1, (t - t0) / duration);
      const eased = 1 - Math.pow(1 - k, 4);
      current.current = start + (value - start) * eased;
      setShown(current.current);
      if (k < 1) frame.current = requestAnimationFrame(tickFn);
      else {
        finished = true;
        setTick((x) => ({ n: (x?.n ?? 0) + 1, dir }));
      }
    };
    const timer = setTimeout(() => {
      frame.current = requestAnimationFrame(tickFn);
    }, from !== undefined && start === from ? delay : 0);
    return () => {
      clearTimeout(timer);
      if (frame.current) cancelAnimationFrame(frame.current);
      // Interrupted by a newer value, or React re-running the effect: continue from where the number is.
      if (!finished) last.current = current.current;
    };
  }, [value, duration, from, delay]);

  return (
    <span key={tick?.n ?? 0} data-dir={tick?.dir} className={`${tick ? "wq-tick" : ""} tabular ${className ?? ""}`}>
      {format(shown)}
    </span>
  );
}
