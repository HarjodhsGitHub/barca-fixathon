"use client";
// A number that glides to its new value (about 450 ms, ease-out) and flashes
// once, so a price change reads as a change instead of a flicker.
import { useEffect, useRef, useState } from "react";

const reduced = () => typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

export function AnimatedNumber({
  value,
  format,
  className,
  duration = 450,
}: {
  value: number;
  format: (n: number) => string;
  className?: string;
  duration?: number;
}) {
  const [shown, setShown] = useState(value);
  const [flashKey, setFlashKey] = useState(0);
  const from = useRef(value);
  const frame = useRef<number | null>(null);

  useEffect(() => {
    if (from.current === value) return;
    const start = from.current;
    from.current = value;
    if (reduced()) {
      frame.current = requestAnimationFrame(() => setShown(value));
      return () => {
        if (frame.current) cancelAnimationFrame(frame.current);
      };
    }
    const t0 = performance.now();
    const tick = (t: number) => {
      const k = Math.min(1, (t - t0) / duration);
      const eased = 1 - Math.pow(1 - k, 3);
      setShown(start + (value - start) * eased);
      if (k < 1) frame.current = requestAnimationFrame(tick);
      else setFlashKey((x) => x + 1);
    };
    frame.current = requestAnimationFrame(tick);
    return () => {
      if (frame.current) cancelAnimationFrame(frame.current);
    };
  }, [value, duration]);

  return (
    <span key={flashKey} className={`${flashKey ? "wq-flash" : ""} tabular ${className ?? ""}`}>
      {format(shown)}
    </span>
  );
}
