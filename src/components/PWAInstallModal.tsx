/**
 * PWAInstallModal — Modale forçant l'installation au 1er login.
 * Apparaît une seule fois par session jusqu'à dismiss explicite ou installation.
 */
import { useEffect, useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, Smartphone, Share2, X } from "lucide-react";
import { usePWA } from "@/hooks/usePWA";

const SHOWN_KEY = "pwa-modal-shown";

const getBrowser = () => {
  if (typeof navigator === "undefined") return "other";
  const ua = navigator.userAgent;
  if (/SamsungBrowser/i.test(ua)) return "samsung";
  if (/Edg\//i.test(ua)) return "edge";
  if (/Firefox/i.test(ua)) return "firefox";
  if (/iPad|iPhone|iPod/.test(ua) && !(window as any).MSStream) return "safari";
  if (/Chrome/i.test(ua)) return "chrome";
  return "other";
};

const STEPS: Record<string, string[]> = {
  chrome: ["Appuyez sur ⋮ en haut à droite", 'Sélectionnez "Installer l\'application"', "Confirmez avec Installer"],
  samsung: ["Appuyez sur ≡", '"Ajouter page à" → "Écran d\'accueil"', "Confirmez avec Ajouter"],
  edge: ["Appuyez sur …", '"Ajouter à l\'écran d\'accueil"', "Confirmez"],
  firefox: ["Appuyez sur ⋮", '"Installer"', "Confirmez avec Ajouter"],
  safari: ["Appuyez sur ⬆️ Partager en bas", '"Sur l\'écran d\'accueil"', "Appuyez sur Ajouter"],
  other: ["Ouvrez le menu (⋮ ou …)", '"Installer l\'application"', "Confirmez l'installation"],
};

export default function PWAInstallModal() {
  const { isInstalled, deferredPrompt, install } = usePWA();
  const [open, setOpen] = useState(false);
  const [browser, setBrowser] = useState("other");
  const [showSteps, setShowSteps] = useState(false);
  const [installing, setInstalling] = useState(false);

  useEffect(() => {
    if (isInstalled) return;
    const shown = sessionStorage.getItem(SHOWN_KEY);
    if (shown) return;
    setBrowser(getBrowser());
    // Délai pour laisser l'app se charger
    const t = setTimeout(() => {
      setOpen(true);
      sessionStorage.setItem(SHOWN_KEY, "1");
    }, 1500);
    return () => clearTimeout(t);
  }, [isInstalled]);

  if (isInstalled) return null;

  const isSafari = browser === "safari";
  const steps = STEPS[browser] || STEPS.other;

  const handleInstall = async () => {
    if (deferredPrompt) {
      setInstalling(true);
      const ok = await install();
      setInstalling(false);
      if (ok) setOpen(false);
      else setShowSteps(true);
    } else {
      setShowSteps(true);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-md">
        <div className="flex flex-col items-center text-center space-y-4 py-2">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shadow-lg">
            <Smartphone className="w-9 h-9 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-heading font-bold text-foreground">
              Installez l'app Moisson
            </h2>
            <p className="text-sm text-muted-foreground font-body mt-1">
              Pour une expérience optimale, installez Moisson sur votre appareil. Accès rapide, hors-ligne, notifications.
            </p>
          </div>

          {!showSteps ? (
            <>
              <Button
                onClick={handleInstall}
                disabled={installing}
                className="w-full bg-primary hover:bg-primary/90"
                size="lg"
              >
                {isSafari ? (
                  <><Share2 className="w-5 h-5 mr-2" /> Voir les étapes (iPhone/iPad)</>
                ) : installing ? (
                  "Installation…"
                ) : (
                  <><Download className="w-5 h-5 mr-2" /> Installer maintenant</>
                )}
              </Button>
              <button
                onClick={() => setOpen(false)}
                className="text-xs text-muted-foreground hover:text-foreground underline"
              >
                Plus tard
              </button>
            </>
          ) : (
            <div className="w-full bg-secondary/50 rounded-xl p-4 text-left space-y-3">
              <p className="text-xs font-semibold text-foreground">
                Étapes pour {browser === "safari" ? "Safari (iOS)" : browser} :
              </p>
              <ol className="space-y-2">
                {steps.map((s, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm font-body">
                    <span className="w-5 h-5 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                      {i + 1}
                    </span>
                    <span>{s}</span>
                  </li>
                ))}
              </ol>
              <Button variant="outline" size="sm" className="w-full" onClick={() => setOpen(false)}>
                <X className="w-4 h-4 mr-1" /> Fermer
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
