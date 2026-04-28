/**
 * usePWA — Hook PWA persistant
 * La bannière reste visible TANT QUE l'app n'est pas installée.
 * Aucun cooldown, aucune suppression automatique.
 */

import { useState, useEffect, useCallback } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

// Capture globale dès le chargement du script
let _deferredPrompt: BeforeInstallPromptEvent | null = null;
let _promptListeners: Array<(e: BeforeInstallPromptEvent) => void> = [];

if (typeof window !== "undefined") {
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    _deferredPrompt = e as BeforeInstallPromptEvent;
    _promptListeners.forEach((fn) => fn(_deferredPrompt!));
  });
}

const INSTALLED_KEY = "pwa-installed";

function isAlreadyInstalled(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as any).standalone === true ||
    localStorage.getItem(INSTALLED_KEY) === "true"
  );
}

export function usePWA() {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(_deferredPrompt);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  // La bannière est TOUJOURS visible si non installé
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    if (isAlreadyInstalled()) {
      setIsInstalled(true);
      setShowBanner(false);
      return;
    }

    const ua = navigator.userAgent;
    const ios = /iPad|iPhone|iPod/.test(ua) && !(window as any).MSStream;
    setIsIOS(ios);

    // Afficher immédiatement (pas de délai)
    setShowBanner(true);

    if (_deferredPrompt) {
      setDeferredPrompt(_deferredPrompt);
    }

    const listener = (e: BeforeInstallPromptEvent) => {
      setDeferredPrompt(e);
      setShowBanner(true);
    };
    _promptListeners.push(listener);

    const onInstalled = () => {
      setIsInstalled(true);
      setShowBanner(false);
      localStorage.setItem(INSTALLED_KEY, "true");
    };
    window.addEventListener("appinstalled", onInstalled);

    // Vérification périodique du mode standalone (utile sur iOS)
    const checkInstalled = setInterval(() => {
      if (isAlreadyInstalled()) {
        setIsInstalled(true);
        setShowBanner(false);
        clearInterval(checkInstalled);
      }
    }, 2000);

    return () => {
      _promptListeners = _promptListeners.filter((fn) => fn !== listener);
      window.removeEventListener("appinstalled", onInstalled);
      clearInterval(checkInstalled);
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
    return false;
  }, [deferredPrompt]);

  // dismiss() ne fait RIEN — la bannière reste visible
  const dismiss = useCallback(() => {
    // Intentionnellement vide : on ne cache pas la bannière
  }, []);

  const canInstall = !isInstalled && (!!deferredPrompt || isIOS);

  return {
    showBanner,
    isInstalled,
    isIOS,
    deferredPrompt,
    canInstall,
    install,
    dismiss,
    setShowBanner,
  };
}
