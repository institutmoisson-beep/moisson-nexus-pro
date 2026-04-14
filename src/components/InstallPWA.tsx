import { useState, useEffect } from "react";
import { Download, X } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const InstallPWA = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showBanner, setShowBanner] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showIOSGuide, setShowIOSGuide] = useState(false);
import { useState, useEffect, useRef } from "react";
import { Download, X, Smartphone } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const InstallPWA = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showBanner, setShowBanner] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const [installState, setInstallState] = useState<"idle" | "prompted" | "accepted" | "dismissed">("idle");
  const autoPromptTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    // Don't show if already installed (standalone mode)
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (navigator as any).standalone === true;
    if (isStandalone) return;

    // Don't show if user dismissed recently (within 3 days)
    const dismissedAt = localStorage.getItem("pwa-dismissed-at");
    if (dismissedAt) {
      const dismissedDate = new Date(dismissedAt);
      const daysSince = (Date.now() - dismissedDate.getTime()) / (1000 * 60 * 60 * 24);
      if (daysSince < 3) return;
    }

    const ua = navigator.userAgent;
    const ios = /iPad|iPhone|iPod/.test(ua) && !(window as any).MSStream;
    setIsIOS(ios);

    if (ios) {
      // Show iOS banner after 3 seconds
      autoPromptTimer.current = setTimeout(() => {
        setShowBanner(true);
      }, 3000);
      return;
    }

    // For Android/Desktop: capture the beforeinstallprompt event
    const handler = (e: Event) => {
      e.preventDefault();
      const promptEvent = e as BeforeInstallPromptEvent;
      setDeferredPrompt(promptEvent);

      // Auto-show banner after 4 seconds of browsing
      autoPromptTimer.current = setTimeout(() => {
        setShowBanner(true);
        setInstallState("prompted");
      }, 4000);
    };

    window.addEventListener("beforeinstallprompt", handler);

    // Also listen for appinstalled event
    const installedHandler = () => {
      setShowBanner(false);
      setDeferredPrompt(null);
      localStorage.setItem("pwa-installed", "true");
    };
    window.addEventListener("appinstalled", installedHandler);

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
      window.removeEventListener("appinstalled", installedHandler);
      if (autoPromptTimer.current) clearTimeout(autoPromptTimer.current);
    };
  }, []);

  const handleInstall = async () => {
    if (isIOS) {
      setShowIOSGuide(true);
      return;
    }
    if (!deferredPrompt) return;

    try {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") {
        setInstallState("accepted");
        setShowBanner(false);
        localStorage.setItem("pwa-installed", "true");
      } else {
        setInstallState("dismissed");
        dismiss();
      }
    } catch {
      // Prompt failed, hide banner
      setShowBanner(false);
    }
    setDeferredPrompt(null);
  };

  const dismiss = () => {
    setShowBanner(false);
    setShowIOSGuide(false);
    localStorage.setItem("pwa-dismissed-at", new Date().toISOString());
    if (autoPromptTimer.current) clearTimeout(autoPromptTimer.current);
  };

  if (!showBanner) return null;

  return (
    <>
      {/* Install Banner */}
      <div
        className="fixed bottom-4 left-4 right-4 z-50 md:left-auto md:right-6 md:max-w-sm animate-in slide-in-from-bottom-4 duration-300"
        style={{ animation: "slideUp 0.3s ease-out" }}
      >
        <div className="bg-card border border-border rounded-2xl p-4 shadow-xl flex items-center gap-3">
          {/* App icon */}
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shrink-0 shadow-md">
            <Smartphone className="w-6 h-6 text-white" />
          </div>

          {/* Text */}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-heading font-bold text-foreground">Installer l'app Moisson</p>
            <p className="text-xs text-muted-foreground font-body">Accès rapide, hors-ligne & notifications</p>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleInstall}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-semibold font-body hover:bg-primary/90 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              Installer
            </button>
            <button
              onClick={dismiss}
              className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
              aria-label="Fermer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* iOS Guide Modal */}
      {showIOSGuide && (
        <div
          className="fixed inset-0 bg-foreground/60 flex items-end justify-center z-50 p-4 backdrop-blur-sm"
          onClick={dismiss}
        >
          <div
            className="bg-card rounded-2xl border border-border p-6 w-full max-w-sm mb-4"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Download className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="font-heading font-bold text-foreground">Installer sur iPhone</h3>
                <p className="text-xs text-muted-foreground font-body">Quelques étapes simples</p>
              </div>
            </div>
            <ol className="space-y-3">
              <li className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">1</span>
                <p className="text-sm font-body text-foreground">
                  Appuyez sur le bouton <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-secondary rounded text-xs font-mono">⬆️ Partager</span> en bas de Safari
                </p>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">2</span>
                <p className="text-sm font-body text-foreground">
                  Faites défiler et sélectionnez <strong>"Sur l'écran d'accueil"</strong>
                </p>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">3</span>
                <p className="text-sm font-body text-foreground">
                  Appuyez sur <strong>"Ajouter"</strong> en haut à droite
                </p>
              </li>
            </ol>
            <button
              onClick={dismiss}
              className="w-full mt-5 py-3 rounded-xl bg-primary text-primary-foreground font-body font-semibold text-sm hover:bg-primary/90 transition-colors"
            >
              Compris !
            </button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes slideUp {
          from { transform: translateY(100px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}</style>
    </>
  );
};

export default InstallPWA;

  useEffect(() => {
    const isStandalone = window.matchMedia("(display-mode: standalone)").matches || (navigator as any).standalone;
    if (isStandalone) return;

    const ua = navigator.userAgent;
    const ios = /iPad|iPhone|iPod/.test(ua) && !(window as any).MSStream;
    setIsIOS(ios);

    if (ios) {
      const dismissed = localStorage.getItem("pwa-ios-dismissed");
      if (!dismissed) setShowBanner(true);
      return;
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowBanner(true);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (isIOS) { setShowIOSGuide(true); return; }
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") setShowBanner(false);
    setDeferredPrompt(null);
  };

  const dismiss = () => {
    setShowBanner(false);
    setShowIOSGuide(false);
    if (isIOS) localStorage.setItem("pwa-ios-dismissed", "1");
  };

  if (!showBanner) return null;

  return (
    <>
      <div className="fixed bottom-4 left-4 right-4 z-50 bg-card border border-border rounded-xl p-4 shadow-lg flex items-center gap-3 md:left-auto md:right-6 md:max-w-sm">
        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
          <Download className="w-5 h-5 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-heading font-semibold text-foreground">Installer l'application</p>
          <p className="text-xs text-muted-foreground font-body">Accédez rapidement depuis votre écran d'accueil</p>
        </div>
        <button onClick={handleInstall} className="btn-gold !text-xs !py-1.5 !px-3 shrink-0">Installer</button>
        <button onClick={dismiss} className="p-1 text-muted-foreground hover:text-foreground"><X className="w-4 h-4" /></button>
      </div>

      {showIOSGuide && (
        <div className="fixed inset-0 bg-foreground/50 flex items-end justify-center z-50 p-4" onClick={dismiss}>
          <div className="bg-card rounded-xl border border-border p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
            <h3 className="font-heading font-bold text-foreground text-lg mb-3">📱 Installer sur iPhone/iPad</h3>
            <ol className="space-y-3 text-sm font-body text-foreground">
              <li className="flex items-start gap-2"><span className="font-bold text-primary">1.</span> Appuyez sur le bouton de partage <span className="inline-block px-1.5 py-0.5 bg-secondary rounded text-xs">⬆️</span></li>
              <li className="flex items-start gap-2"><span className="font-bold text-primary">2.</span> Faites défiler et appuyez sur <strong>"Sur l'écran d'accueil"</strong></li>
              <li className="flex items-start gap-2"><span className="font-bold text-primary">3.</span> Appuyez sur <strong>"Ajouter"</strong></li>
            </ol>
            <button onClick={dismiss} className="w-full mt-4 py-2.5 rounded-lg border border-input text-muted-foreground font-body text-sm hover:bg-secondary">Compris</button>
          </div>
        </div>
      )}
    </>
  );
};

export default InstallPWA;
