/**
 * InstallPWA — Bouton flottant d'installation.
 * - Capture l'événement `beforeinstallprompt` (Chrome/Edge/Android/Samsung).
 * - Tente automatiquement le prompt natif au 1er geste utilisateur.
 * - Si l'auto-prompt échoue ou n'est pas capté, un bouton flottant
 *   « 📱 Installer l'app » reste visible — un clic = prompt natif.
 * - Sur iOS Safari (pas de beforeinstallprompt), affiche un mini-tip
 *   minimaliste (1 ligne) sans bannière intrusive.
 */
import { useEffect, useState } from "react";
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

const InstallPWA = () => {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState<boolean>(isStandalone());
  const [iosTip, setIosTip] = useState(false);

  useEffect(() => {
    if (installed) return;

    const onPrompt = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
    };
    const onInstalled = () => { setInstalled(true); setDeferred(null); };

    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);

    // iOS — pas de beforeinstallprompt, on signale en discret
    if (isIOS() && !isStandalone()) setIosTip(true);

    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, [installed]);

  const handleInstall = async () => {
    if (!deferred) return;
    try {
      await deferred.prompt();
      const choice = await deferred.userChoice;
      if (choice.outcome === "accepted") setInstalled(true);
    } catch { /* ignore */ }
    setDeferred(null);
  };

  if (installed) return null;

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

  if (iosTip) {
    return (
      <div className="fixed bottom-4 right-4 left-4 sm:left-auto z-50 max-w-sm mx-auto sm:mx-0 bg-card border border-border shadow-xl rounded-xl px-4 py-3 text-sm font-body flex items-center justify-between gap-3 animate-in slide-in-from-bottom-4">
        <span>📱 Pour installer : appuyez sur <strong>Partager</strong> puis <strong>Sur l'écran d'accueil</strong>.</span>
        <button onClick={() => setIosTip(false)} className="text-muted-foreground hover:text-foreground" aria-label="Fermer">×</button>
      </div>
    );
  }

  return null;
};

export default InstallPWA;
