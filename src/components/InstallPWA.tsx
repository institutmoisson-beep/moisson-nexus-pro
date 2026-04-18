import { useState } from "react";
import { Download, X, Smartphone } from "lucide-react";
import { usePWA } from "@/hooks/usePWA";

const InstallPWA = () => {
  const { showBanner, isIOS, deferredPrompt, install, dismiss } = usePWA();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  const handleInstall = async () => {
    if (isIOS) {
      setShowIOSGuide(true);
      return;
    }
    await install();
  };

  if (!showBanner) return null;

  return (
    <>
      {/* ── Bannière flottante ── */}
      <div className="fixed bottom-4 left-4 right-4 z-50 md:left-auto md:right-6 md:max-w-sm"
        style={{ animation: "slideUpPWA 0.35s ease-out" }}>
        <div className="bg-card border border-border rounded-2xl p-4 shadow-2xl flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shrink-0 shadow-md">
            <Smartphone className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-heading font-bold text-foreground">Installer l'app Moisson</p>
            <p className="text-xs text-muted-foreground font-body">Accès rapide, hors-ligne & notifications</p>
          </div>
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

      {/* ── Guide iOS ── */}
      {showIOSGuide && (
        <div
          className="fixed inset-0 bg-foreground/60 flex items-end justify-center z-50 p-4 backdrop-blur-sm"
          onClick={() => { setShowIOSGuide(false); dismiss(); }}
        >
          <div
            className="bg-card rounded-2xl border border-border p-6 w-full max-w-sm mb-4"
            onClick={(e) => e.stopPropagation()}
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
              {[
                <>Appuyez sur le bouton <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-secondary rounded text-xs font-mono">⬆️ Partager</span> en bas de Safari</>,
                <>Faites défiler et sélectionnez <strong>"Sur l'écran d'accueil"</strong></>,
                <>Appuyez sur <strong>"Ajouter"</strong> en haut à droite</>,
              ].map((text, i) => (
                <li key={i} className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                    {i + 1}
                  </span>
                  <p className="text-sm font-body text-foreground">{text}</p>
                </li>
              ))}
            </ol>
            <button
              onClick={() => { setShowIOSGuide(false); dismiss(); }}
              className="w-full mt-5 py-3 rounded-xl bg-primary text-primary-foreground font-body font-semibold text-sm hover:bg-primary/90 transition-colors"
            >
              Compris !
            </button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes slideUpPWA {
          from { transform: translateY(100px); opacity: 0; }
          to   { transform: translateY(0);    opacity: 1; }
        }
      `}</style>
    </>
  );
};

export default InstallPWA;
