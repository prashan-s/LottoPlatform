"use client";

import { useEffect } from "react";

const RELOAD_GUARD_KEY = "lotto:chunk-reload-attempt";
const RELOAD_GUARD_WINDOW_MS = 30_000;

function shouldAttemptReload(): boolean {
  try {
    const raw = sessionStorage.getItem(RELOAD_GUARD_KEY);
    if (!raw) {
      return true;
    }

    const lastAttemptAt = Number(raw);
    if (Number.isNaN(lastAttemptAt)) {
      return true;
    }

    return Date.now() - lastAttemptAt > RELOAD_GUARD_WINDOW_MS;
  } catch {
    return true;
  }
}

function markReloadAttempt(): void {
  try {
    sessionStorage.setItem(RELOAD_GUARD_KEY, String(Date.now()));
  } catch {
    // Ignore storage failures and still try a reload.
  }
}

function isChunkLoadError(value: unknown): boolean {
  const message =
    value instanceof Error
      ? value.message
      : typeof value === "string"
        ? value
        : "";

  if (!message) {
    return false;
  }

  return [
    "ChunkLoadError",
    "Loading chunk",
    "Failed to fetch dynamically imported module",
    "Importing a module script failed",
  ].some((signal) => message.includes(signal));
}

export default function ChunkErrorRecovery() {
  useEffect(() => {
    const tryRecover = (value: unknown) => {
      if (!isChunkLoadError(value) || !shouldAttemptReload()) {
        return;
      }

      markReloadAttempt();
      window.location.reload();
    };

    const onWindowError = (event: ErrorEvent) => {
      tryRecover(event.error ?? event.message);
    };

    const onUnhandledRejection = (event: PromiseRejectionEvent) => {
      tryRecover(event.reason);
    };

    window.addEventListener("error", onWindowError);
    window.addEventListener("unhandledrejection", onUnhandledRejection);

    return () => {
      window.removeEventListener("error", onWindowError);
      window.removeEventListener("unhandledrejection", onUnhandledRejection);
    };
  }, []);

  return null;
}
