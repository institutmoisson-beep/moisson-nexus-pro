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
