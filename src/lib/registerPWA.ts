/**
 * Service worker registration — guarded for Lovable preview / iframe / dev.
 * Only registers on the published origin in production.
 */
import { registerSW } from "virtual:pwa-register";

const SW_PATH = "/sw.js";

const isPreviewOrDevHost = () => {
  if (typeof window === "undefined") return true;
  const h = window.location.hostname;
  return (
    h.startsWith("id-preview--") ||
    h.startsWith("preview--") ||
    h === "lovableproject.com" ||
    h.endsWith(".lovableproject.com") ||
    h === "lovableproject-dev.com" ||
    h.endsWith(".lovableproject-dev.com") ||
    h === "beta.lovable.dev" ||
    h.endsWith(".beta.lovable.dev")
  );
};

const isInIframe = () => {
  try {
    return window.self !== window.top;
  } catch {
    return true;
  }
};

const isKillSwitch = () => {
  try {
    return new URL(window.location.href).searchParams.get("sw") === "off";
  } catch {
    return false;
  }
};

const unregisterMatchingSW = async () => {
  if (!("serviceWorker" in navigator)) return;
  try {
    const regs = await navigator.serviceWorker.getRegistrations();
    await Promise.all(
      regs
        .filter((r) => {
          const url = r.active?.scriptURL || r.installing?.scriptURL || r.waiting?.scriptURL || "";
          return url.endsWith(SW_PATH) || url.endsWith("/service-worker.js");
        })
        .map((r) => r.unregister())
    );
  } catch {
    /* noop */
  }
};

export function setupPWA() {
  if (typeof window === "undefined") return;
  if (!("serviceWorker" in navigator)) return;

  const refuse =
    !import.meta.env.PROD ||
    isInIframe() ||
    isPreviewOrDevHost() ||
    isKillSwitch();

  if (refuse) {
    void unregisterMatchingSW();
    return;
  }

  registerSW({
    immediate: true,
    onRegisteredSW(_swUrl, reg) {
      if (!reg) return;
      // Vérifie les MAJ toutes les heures
      setInterval(() => {
        reg.update().catch(() => {});
      }, 60 * 60 * 1000);
    },
    onOfflineReady() {
      // Optionnel — pourrait déclencher un toast.
    },
  });
}
