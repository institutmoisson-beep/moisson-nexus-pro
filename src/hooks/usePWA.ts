/**
 * usePWA — Hook centralisé pour la gestion de l'installation PWA
 *
 * Stratégie :
 * - Capture beforeinstallprompt AVANT le montage du composant (écoute globale au plus tôt)
 * - Persiste l'événement dans un module-level variable pour ne pas le perdre entre rendus
 * - Gère iOS séparément (Safari ne supporte pas beforeinstallprompt)
 * - Respecte le choix de l'utilisateur (ne re-propose pas avant 7 jours)
 */

import { useState, useEffect, useCallback } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

// ── Module-level : capture dès que le script charge, avant tout React ──
let _deferredPrompt: BeforeInstallPromptEvent | null = null;
let _promptListeners: Array<(e: BeforeInstallPromptEvent) => void> = [];

if (typeof window !== "undefined") {
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    _deferredPrompt = e as BeforeInstallPromptEvent;
    _promptListeners.forEach((fn) => fn(_deferredPrompt!));
  });
}

// ── Constantes ──
const DISMISSED_KEY = "pwa-dismissed-at";
const INSTALLED_KEY = "pwa-installed";
const DISMISS_COOLDOWN_DAYS = 7;

function isAlreadyInstalled(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as any).standalone === true ||
    localStorage.getItem(INSTALLED_KEY) === "true"
  );
}

function wasDismissedRecently(): boolean {
  const raw = localStorage.getItem(DISMISSED_KEY);
  if (!raw) return false;
  const daysSince = (Date.now() - new Date(raw).getTime()) / 86_400_000;
  return daysSince < DISMISS_COOLDOWN_DAYS;
}

export function usePWA() {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(_deferredPrompt);
  const [showBanner, setShowBanner] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Déjà installé ?
    if (isAlreadyInstalled()) {
      setIsInstalled(true);
      return;
    }

    // iOS detection
    const ua = navigator.userAgent;
    const ios = /iPad|iPhone|iPod/.test(ua) && !(window as any).MSStream;
    setIsIOS(ios);

    // Déjà refusé récemment ?
    if (wasDismissedRecently()) return;

    // Si l'event était déjà capturé avant le montage
    if (_deferredPrompt) {
      setDeferredPrompt(_deferredPrompt);
      // Délai 4s pour ne pas agresser l'utilisateur dès l'arrivée
      const t = setTimeout(() => setShowBanner(true), 4000);
      return () => clearTimeout(t);
    }

    if (ios) {
      const t = setTimeout(() => setShowBanner(true), 4000);
      return () => clearTimeout(t);
    }

    // Abonnement pour recevoir l'event si pas encore déclenché
    const listener = (e: BeforeInstallPromptEvent) => {
      setDeferredPrompt(e);
      const t = setTimeout(() => setShowBanner(true), 4000);
      // Pas de cleanup ici car le listener est global
    };
    _promptListeners.push(listener);

    // Appinstalled
    const onInstalled = () => {
      setIsInstalled(true);
      setShowBanner(false);
      localStorage.setItem(INSTALLED_KEY, "true");
    };
    window.addEventListener("appinstalled", onInstalled);

    return () => {
      _promptListeners = _promptListeners.filter((fn) => fn !== listener);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  const install = useCallback(async () => {
    if (!deferredPrompt) return false;
    try {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") {
        setIsInstalled(true);
        setShowBanner(false);
        localStorage.setItem(INSTALLED_KEY, "true");
        _deferredPrompt = null;
        return true;
      }
    } catch {
      // silencieux
    }
    dismiss();
    return false;
  }, [deferredPrompt]);

  const dismiss = useCallback(() => {
    setShowBanner(false);
    localStorage.setItem(DISMISSED_KEY, new Date().toISOString());
  }, []);

  const canInstall =
    !isInstalled && !wasDismissedRecently() && (!!deferredPrompt || isIOS);

  return { showBanner, isInstalled, isIOS, deferredPrompt, canInstall, install, dismiss, setShowBanner };
}
