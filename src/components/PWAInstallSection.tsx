/**
 * PWAInstallSection — Bloc d'installation PWA pour le Dashboard
 * Stratégie robuste : affiche TOUJOURS les instructions manuelles
 * car beforeinstallprompt ne se déclenche pas sur tous les navigateurs/appareils.
 */
import { useState, useEffect } from "react";
import { Download, Share2, CheckCircle, Smartphone, ChevronDown, ChevronUp, ExternalLink } from "lucide-react";
import { usePWA } from "@/hooks/usePWA";

// Détection navigateur
const getBrowser = (): "chrome" | "samsung" | "firefox" | "safari" | "edge" | "other" => {
  const ua = navigator.userAgent;
  if (/SamsungBrowser/i.test(ua)) return "samsung";
  if (/Edg\//i.test(ua)) return "edge";
  if (/Firefox/i.test(ua)) return "firefox";
  if (/iPad|iPhone|iPod/.test(ua)) return "safari";
  if (/Chrome/i.test(ua)) return "chrome";
  return "other";
};

const BROWSER_INSTRUCTIONS: Record<string, { icon: string; name: string; steps: string[] }> = {
  chrome: {
    icon: "🟢",
    name: "Chrome",
    steps: [
      "Appuyez sur les 3 points ⋮ en haut à droite",
      'Sélectionnez "Ajouter à l\'écran d\'accueil" ou "Installer l\'application"',
      'Confirmez en appuyant sur "Installer"',
    ],
  },
  samsung: {
    icon: "🔵",
    name: "Samsung Browser",
    steps: [
      "Appuyez sur les 3 lignes ≡ en bas",
      'Sélectionnez "Ajouter page à" puis "Écran d\'accueil"',
      'Confirmez en appuyant sur "Ajouter"',
    ],
  },
  edge: {
    icon: "🔷",
    name: "Edge",
    steps: [
      "Appuyez sur les 3 points … en bas",
      'Sélectionnez "Ajouter à l\'écran d\'accueil"',
      'Confirmez en appuyant sur "Ajouter"',
    ],
  },
  firefox: {
    icon: "🦊",
    name: "Firefox",
    steps: [
      "Appuyez sur les 3 points ⋮ en haut à droite",
      'Sélectionnez "Installer"',
      'Confirmez en appuyant sur "Ajouter"',
    ],
  },
  safari: {
    icon: "🧭",
    name: "Safari (iPhone/iPad)",
    steps: [
      'Appuyez sur le bouton Partager ⬆️ en bas de Safari',
      'Faites défiler et sélectionnez "Sur l\'écran d\'accueil"',
      'Appuyez sur "Ajouter" en haut à droite',
    ],
  },
  other: {
    icon: "📱",
    name: "Votre navigateur",
    steps: [
      "Ouvrez le menu de votre navigateur (⋮ ou …)",
      'Cherchez "Installer l\'application" ou "Ajouter à l\'écran d\'accueil"',
      "Confirmez l'installation",
    ],
  },
};

const PWAInstallSection = () => {
  const { isInstalled, isIOS, deferredPrompt, canInstall, install } = usePWA();
  const [showManual, setShowManual] = useState(false);
  const [installSuccess, setInstallSuccess] = useState(false);
  const [browser, setBrowser] = useState<string>("other");

  useEffect(() => {
    setBrowser(getBrowser());
  }, []);

  // Déjà installé
  if (isInstalled && !installSuccess) return null;

  if (installSuccess) {
    return (
      <div className="card-elevated border-harvest-green/20 bg-harvest-green/5">
        <div className="flex items-center gap-3">
          <CheckCircle className="w-8 h-8 text-harvest-green" />
          <div>
            <p className="font-heading font-bold text-foreground">Application installée avec succès !</p>
            <p className="text-sm text-muted-foreground font-body">L'app Moisson est maintenant sur votre écran d'accueil.</p>
          </div>
        </div>
      </div>
    );
  }

  const instructions = BROWSER_INSTRUCTIONS[browser] || BROWSER_INSTRUCTIONS.other;

  const handleAutoInstall = async () => {
    const ok = await install();
    if (ok) setInstallSuccess(true);
  };

  return (
    <div className="card-elevated border-primary/20 bg-gradient-to-br from-primary/5 to-gold/5">
      <div className="flex items-start gap-4">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shadow-md shrink-0">
          <Smartphone className="w-7 h-7 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-heading font-bold text-foreground text-lg mb-1">
            📲 Installer l'application Moisson
          </h3>
          <p className="text-sm text-muted-foreground font-body mb-4">
            Accédez à votre espace directement depuis votre écran d'accueil — sans navigateur, plus rapide.
          </p>

          <div className="grid grid-cols-3 gap-3 mb-4">
            {[
              { icon: "⚡", label: "Accès rapide", desc: "Depuis l'écran d'accueil" },
              { icon: "📵", label: "Hors-ligne", desc: "Fonctionne sans réseau" },
              { icon: "🔔", label: "Notifications", desc: "Restez informé" },
            ].map((f) => (
              <div key={f.label} className="text-center p-3 bg-card rounded-xl border border-border">
                <div className="text-xl mb-1">{f.icon}</div>
                <p className="text-xs font-semibold text-foreground font-body">{f.label}</p>
                <p className="text-[10px] text-muted-foreground font-body">{f.desc}</p>
              </div>
            ))}
          </div>

          {/* Bouton d'installation automatique si disponible */}
          {deferredPrompt && !isIOS && (
            <button
              onClick={handleAutoInstall}
              className="btn-gold !text-sm !py-2.5 flex items-center gap-2 mb-3"
            >
              <Download className="w-4 h-4" /> Installer maintenant (1 clic)
            </button>
          )}

          {/* Instructions manuelles — toujours disponibles */}
          <button
            onClick={() => setShowManual(!showManual)}
            className="w-full flex items-center justify-between px-4 py-3 rounded-xl bg-card border border-border hover:border-primary/30 transition-colors text-sm font-body font-semibold text-foreground"
          >
            <span className="flex items-center gap-2">
              {instructions.icon} Instructions pour {instructions.name}
            </span>
            {showManual ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
          </button>

          {showManual && (
            <div className="mt-3 bg-card rounded-xl border border-border p-4 space-y-3">
              <p className="text-xs text-muted-foreground font-body font-semibold uppercase tracking-wide">
                Comment installer sur {instructions.name} :
              </p>
              <ol className="space-y-2">
                {instructions.steps.map((step, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                      {i + 1}
                    </span>
                    <p className="text-sm font-body text-foreground leading-relaxed">{step}</p>
                  </li>
                ))}
              </ol>

              {/* Instructions pour les autres navigateurs */}
              <div className="border-t border-border pt-3">
                <p className="text-xs text-muted-foreground font-body mb-2">Autre navigateur ?</p>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(BROWSER_INSTRUCTIONS)
                    .filter(([key]) => key !== browser && key !== "other")
                    .map(([key, info]) => (
                      <button
                        key={key}
                        onClick={() => setBrowser(key)}
                        className="text-xs px-2.5 py-1 rounded-full bg-secondary hover:bg-muted transition-colors font-body text-muted-foreground hover:text-foreground"
                      >
                        {info.icon} {info.name}
                      </button>
                    ))}
                </div>
              </div>
            </div>
          )}

          {/* Conseil si le bouton auto n'est pas dispo */}
          {!deferredPrompt && !isIOS && (
            <p className="text-xs text-muted-foreground font-body mt-3 bg-secondary/50 rounded-lg p-3">
              💡 <strong className="text-foreground">Conseil :</strong> Pour activer l'installation en 1 clic, ouvrez cette page dans <strong className="text-foreground">Chrome</strong> ou <strong className="text-foreground">Edge</strong> sur Android.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default PWAInstallSection;
