"use client";

import { useEffect, useState } from "react";

export function useCountdown(closesAt: string | undefined): string {
  const [msLeft, setMsLeft] = useState(() =>
    closesAt ? new Date(closesAt).getTime() - Date.now() : 0
  );

  useEffect(() => {
    if (!closesAt) return;
    const id = setInterval(() => {
      setMsLeft(new Date(closesAt).getTime() - Date.now());
    }, 1000);
    return () => clearInterval(id);
  }, [closesAt]);

  if (!closesAt || msLeft <= 0) return "Closed";
  const totalSec = Math.floor(msLeft / 1000);
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  if (m >= 60) {
    const h = Math.floor(m / 60);
    return `${h}h ${m % 60}m`;
  }
  return `${m}:${String(s).padStart(2, "0")}`;
}
