/**
 * InstallPWA — Bouton flottant d'installation.
 * - Capture l'événement `beforeinstallprompt` (Chrome/Edge/Android/Samsung).
 * - Tente automatiquement le prompt natif au 1er geste utilisateur.
 * - Si l'auto-prompt échoue ou n'est pas capté, un bouton flottant
 *   « 📱 Installer l'app » reste visible — un clic = prompt natif.
 * - Sur iOS Safari (pas de beforeinstallprompt), affiche un mini-tip
 *   minimaliste (1 ligne) sans bannière intrusive.
 */
import { useEffect, useMemo, useRef, useState } from "react";
import { Download } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const isStandalone = () =>
  typeof window !== "undefined" &&
  (window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as any).standalone === true);

const isIOS = () =>
  typeof navigator !== "undefined" &&
  /iPad|iPhone|iPod/.test(navigator.userAgent) &&
  !(window as any).MSStream;

const isPreviewHost = () =>
  typeof window !== "undefined" &&
  (window.location.hostname.includes("id-preview--") ||
    window.location.hostname.includes("lovableproject.com"));

const PUBLISHED_ORIGIN = "https://moisson-nexus-pro.lovable.app";

const InstallPWA = () => {
  const deferredRef = useRef<BeforeInstallPromptEvent | null>(null);
  const hasInteractedRef = useRef(false);
  const promptStartedRef = useRef(false);

  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState<boolean>(isStandalone());
  const [isPreview, setIsPreview] = useState(false);

  const publishedUrl = useMemo(() => {
    if (typeof window === "undefined") return PUBLISHED_ORIGIN;
    return `${PUBLISHED_ORIGIN}${window.location.pathname}${window.location.hash}`;
  }, []);

  useEffect(() => {
    if (installed) return;

    setIsPreview(isPreviewHost());

    const promptInstall = async (event?: BeforeInstallPromptEvent) => {
      const target = event || deferredRef.current;
      if (!target || promptStartedRef.current || isPreviewHost()) return;

      promptStartedRef.current = true;

      try {
        await target.prompt();
        const choice = await target.userChoice;
        if (choice.outcome === "accepted") {
          setInstalled(true);
        }
      } catch {
        // ignore
      } finally {
        deferredRef.current = null;
        setDeferred(null);
        promptStartedRef.current = false;
      }
    };

    const onPrompt = (e: Event) => {
      e.preventDefault();
      const promptEvent = e as BeforeInstallPromptEvent;
      deferredRef.current = promptEvent;
      setDeferred(promptEvent);
      if (hasInteractedRef.current) void promptInstall(promptEvent);
    };
    const onInstalled = () => { setInstalled(true); setDeferred(null); };
    const onInteraction = () => {
      hasInteractedRef.current = true;
      if (deferredRef.current) void promptInstall(deferredRef.current);
    };

    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    window.addEventListener("pointerdown", onInteraction, { passive: true });
    window.addEventListener("keydown", onInteraction);

    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
      window.removeEventListener("pointerdown", onInteraction);
      window.removeEventListener("keydown", onInteraction);
    };
  }, [installed]);

  const handleInstall = async () => {
    if (isPreview) {
      window.location.href = publishedUrl;
      return;
    }

    const current = deferredRef.current || deferred;
    if (!current) return;

    try {
      await current.prompt();
      const choice = await current.userChoice;
      if (choice.outcome === "accepted") setInstalled(true);
    } catch {
      // ignore
    }

    deferredRef.current = null;
    setDeferred(null);
  };

  if (installed) return null;

  if (isPreview) {
    return (
      <button
        onClick={handleInstall}
        className="fixed bottom-4 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-full bg-primary text-primary-foreground shadow-2xl hover:bg-primary/90 transition-all font-body font-semibold animate-in slide-in-from-bottom-4"
      >
        <Download className="w-5 h-5" />
        Ouvrir la version installable
      </button>
    );
  }

  if (deferred) {
    return (
      <button
        onClick={handleInstall}
        className="fixed bottom-4 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-full bg-primary text-primary-foreground shadow-2xl hover:bg-primary/90 transition-all font-body font-semibold animate-in slide-in-from-bottom-4"
      >
        <Download className="w-5 h-5" />
        Installer l'app
      </button>
    );
  }

  if (isIOS() && !isStandalone()) return null;

  return null;
};

export default InstallPWA;
