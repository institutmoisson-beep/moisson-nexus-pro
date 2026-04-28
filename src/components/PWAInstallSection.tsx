/**
 * PWAInstallSection — Installation de l'app Moisson
 * Bouton de téléchargement toujours visible + instructions manuelles par navigateur
 */
import { useState, useEffect } from "react";
import { Download, Smartphone, ChevronDown, ChevronUp, CheckCircle, Share2 } from "lucide-react";
import { usePWA } from "@/hooks/usePWA";

const getBrowser = (): "chrome" | "samsung" | "firefox" | "safari" | "edge" | "other" => {
  if (typeof navigator === "undefined") return "other";
  const ua = navigator.userAgent;
  if (/SamsungBrowser/i.test(ua)) return "samsung";
  if (/Edg\//i.test(ua)) return "edge";
  if (/Firefox/i.test(ua)) return "firefox";
  if (/iPad|iPhone|iPod/.test(ua) && !(window as any).MSStream) return "safari";
  if (/Chrome/i.test(ua)) return "chrome";
  return "other";
};

const STEPS: Record<string, { name: string; icon: string; steps: string[] }> = {
  chrome: {
    name: "Chrome (Android)",
    icon: "🟢",
    steps: [
      "Appuyez sur ⋮ en haut à droite",
      'Sélectionnez "Ajouter à l\'écran d\'accueil"',
      'Appuyez sur "Installer" pour confirmer',
    ],
  },
  samsung: {
    name: "Samsung Browser",
    icon: "🔵",
    steps: [
      "Appuyez sur ≡ en bas de l'écran",
      'Sélectionnez "Ajouter page à" → "Écran d\'accueil"',
      'Confirmez avec "Ajouter"',
    ],
  },
  edge: {
    name: "Edge",
    icon: "🔷",
    steps: [
      "Appuyez sur … en bas",
      'Sélectionnez "Ajouter à l\'écran d\'accueil"',
      'Confirmez avec "Ajouter"',
    ],
  },
  firefox: {
    name: "Firefox",
    icon: "🦊",
    steps: [
      "Appuyez sur ⋮ en haut à droite",
      'Sélectionnez "Installer"',
      'Confirmez avec "Ajouter"',
    ],
  },
  safari: {
    name: "Safari (iPhone / iPad)",
    icon: "🧭",
    steps: [
      "Appuyez sur ⬆️ Partager en bas de l'écran",
      'Faites défiler et appuyez sur "Sur l\'écran d\'accueil"',
      'Appuyez sur "Ajouter" en haut à droite',
    ],
  },
  other: {
    name: "Votre navigateur",
    icon: "📱",
    steps: [
      "Ouvrez le menu du navigateur (⋮ ou …)",
      '"Installer l\'application" ou "Ajouter à l\'écran d\'accueil"',
      "Confirmez l'installation",
    ],
  },
};

const PWAInstallSection = () => {
  const { isInstalled, deferredPrompt, install } = usePWA();
  const [browser, setBrowser] = useState<string>("other");
  const [showSteps, setShowSteps] = useState(false);
  const [installing, setInstalling] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    setBrowser(getBrowser());
  }, []);

  // Déjà installé
  if (isInstalled && !success) return null;

  if (success) {
    return (
      <div className="card-elevated border-harvest-green/20 bg-harvest-green/5">
        <div className="flex items-center gap-3">
          <CheckCircle className="w-8 h-8 text-harvest-green shrink-0" />
          <div>
            <p className="font-heading font-bold text-foreground">Application installée !</p>
            <p className="text-sm text-muted-foreground font-body">
              L'app Moisson est sur votre écran d'accueil.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const isSafari = browser === "safari";
  const info = STEPS[browser] || STEPS.other;

  const handleInstall = async () => {
    // API native disponible (Chrome / Edge Android) → installation 1 clic
    if (deferredPrompt) {
      setInstalling(true);
      const ok = await install();
      setInstalling(false);
      if (ok) { setSuccess(true); return; }
    }
    // Pas d'API → afficher les instructions manuelles
    setShowSteps(true);
  };

  return (
    <div className="card-elevated border-primary/20 bg-gradient-to-br from-primary/5 to-gold/5">

      {/* En-tête */}
      <div className="flex items-center gap-4 mb-4">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shadow-md shrink-0">
          <Smartphone className="w-7 h-7 text-white" />
        </div>
        <div>
          <h3 className="font-heading font-bold text-foreground text-lg">
            Installer l'app Moisson
          </h3>
          <p className="text-xs text-muted-foreground font-body">
            Accès rapide · fonctionne hors-ligne · notifications
          </p>
        </div>
      </div>

      {/* Avantages */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        {[
          { icon: "⚡", label: "Accès rapide" },
          { icon: "📵", label: "Hors-ligne" },
          { icon: "🔔", label: "Notifications" },
        ].map((f) => (
          <div key={f.label} className="text-center p-2 bg-card rounded-xl border border-border">
            <div className="text-base mb-0.5">{f.icon}</div>
            <p className="text-xs font-semibold text-foreground font-body">{f.label}</p>
          </div>
        ))}
      </div>

      {/* ── BOUTON PRINCIPAL ── toujours visible */}
      {isSafari ? (
        <button
          onClick={() => setShowSteps(!showSteps)}
          className="w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl bg-primary text-primary-foreground font-body font-semibold text-sm hover:bg-primary/90 transition-colors mb-3"
        >
          <Share2 className="w-4 h-4" />
          Installer sur iPhone / iPad
        </button>
      ) : (
        <button
          onClick={handleInstall}
          disabled={installing}
          className="w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl bg-primary text-primary-foreground font-body font-semibold text-sm hover:bg-primary/90 active:scale-[.98] transition-all disabled:opacity-60 mb-3"
        >
          {installing ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Installation en cours…
            </>
          ) : (
            <>
              <Download className="w-4 h-4" />
              Télécharger l'application
            </>
          )}
        </button>
      )}

      {/* ── Instructions manuelles (accordéon) ── */}
      <button
        onClick={() => setShowSteps(!showSteps)}
        className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl bg-card border border-border hover:border-primary/30 transition-colors text-sm font-body text-muted-foreground"
      >
        <span className="flex items-center gap-2">
          {info.icon}
          <span>Instructions pas à pas — {info.name}</span>
        </span>
        {showSteps
          ? <ChevronUp className="w-4 h-4" />
          : <ChevronDown className="w-4 h-4" />}
      </button>

      {showSteps && (
        <div className="mt-3 bg-card rounded-xl border border-border p-4 space-y-3">
          <ol className="space-y-3">
            {info.steps.map((step, i) => (
              <li key={i} className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                  {i + 1}
                </span>
                <p className="text-sm font-body text-foreground leading-relaxed">{step}</p>
              </li>
            ))}
          </ol>

          {/* Switcher navigateur */}
          <div className="border-t border-border pt-3">
            <p className="text-xs text-muted-foreground font-body mb-2">Autre navigateur ?</p>
            <div className="flex flex-wrap gap-2">
              {Object.entries(STEPS)
                .filter(([k]) => k !== browser && k !== "other")
                .map(([k, v]) => (
                  <button
                    key={k}
                    onClick={() => setBrowser(k)}
                    className="text-xs px-2.5 py-1 rounded-full bg-secondary hover:bg-muted transition-colors font-body text-muted-foreground hover:text-foreground"
                  >
                    {v.icon} {v.name}
                  </button>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* Conseil si API non dispo et non-Safari */}
      {!deferredPrompt && !isSafari && (
        <p className="text-xs text-muted-foreground font-body mt-3 bg-secondary/50 rounded-lg p-3 leading-relaxed">
          💡 Pour une installation en 1 clic, ouvrez cette page dans{" "}
          <strong className="text-foreground">Chrome</strong> ou{" "}
          <strong className="text-foreground">Edge</strong> sur Android.
        </p>
      )}
    </div>
  );
};

export default PWAInstallSection;
