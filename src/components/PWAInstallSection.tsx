/**
 * PWAInstallSection — Bloc d'installation PWA pour le Dashboard
 * Utilise usePWA() pour rester en sync avec InstallPWA (même état)
 */
import { useState } from "react";
import { Download, Share2, CheckCircle, Smartphone } from "lucide-react";
import { usePWA } from "@/hooks/usePWA";

const PWAInstallSection = () => {
  const { isInstalled, isIOS, deferredPrompt, canInstall, install } = usePWA();
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const [installSuccess, setInstallSuccess] = useState(false);

  // Ne rien afficher si déjà installé et pas de succès récent
  if (isInstalled && !installSuccess) return null;
  // Ne rien afficher si pas de moyen d'installer
  if (!canInstall && !isInstalled) return null;

  const handleInstall = async () => {
    if (isIOS) { setShowIOSGuide(true); return; }
    const ok = await install();
    if (ok) setInstallSuccess(true);
  };

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

  return (
    <>
      <div className="card-elevated border-primary/20 bg-gradient-to-br from-primary/5 to-gold/5">
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shadow-md shrink-0">
            <Smartphone className="w-7 h-7 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="font-heading font-bold text-foreground text-lg mb-1">
              📲 Installer l'application Moisson
            </h3>
            <p className="text-sm text-muted-foreground font-body mb-4">
              Accédez à votre espace directement depuis votre écran d'accueil — sans navigateur, plus rapide, même hors connexion.
            </p>

            <div className="grid grid-cols-3 gap-3 mb-4">
              {[
                { icon: "⚡", label: "Accès rapide", desc: "Depuis l'écran d'accueil" },
                { icon: "📵", label: "Hors-ligne",   desc: "Fonctionne sans réseau" },
                { icon: "🔔", label: "Notifications", desc: "Restez informé" },
              ].map((f) => (
                <div key={f.label} className="text-center p-3 bg-card rounded-xl border border-border">
                  <div className="text-xl mb-1">{f.icon}</div>
                  <p className="text-xs font-semibold text-foreground font-body">{f.label}</p>
                  <p className="text-[10px] text-muted-foreground font-body">{f.desc}</p>
                </div>
              ))}
            </div>

            {isIOS ? (
              <button
                onClick={() => setShowIOSGuide(true)}
                className="btn-gold !text-sm !py-2.5 flex items-center gap-2"
              >
                <Share2 className="w-4 h-4" /> Instructions d'installation (iPhone/iPad)
              </button>
            ) : deferredPrompt ? (
              <button onClick={handleInstall} className="btn-gold !text-sm !py-2.5 flex items-center gap-2">
                <Download className="w-4 h-4" /> Installer maintenant
              </button>
            ) : (
              <div className="bg-secondary rounded-lg p-3">
                <p className="text-xs font-body text-muted-foreground">
                  💡 Dans votre navigateur, cherchez l'option <strong>"Installer"</strong> ou{" "}
                  <strong>"Ajouter à l'écran d'accueil"</strong> dans le menu (⋮ ou partager ⬆️).
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Guide iOS */}
      {showIOSGuide && (
        <div
          className="fixed inset-0 bg-foreground/60 flex items-end justify-center z-50 p-4 backdrop-blur-sm"
          onClick={() => setShowIOSGuide(false)}
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
            <ol className="space-y-3 mb-5">
              {[
                <>Appuyez sur le bouton Partager <strong>⬆️</strong> en bas de Safari</>,
                <>Sélectionnez <strong>"Sur l'écran d'accueil"</strong></>,
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
              onClick={() => setShowIOSGuide(false)}
              className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-body font-semibold text-sm"
            >
              Compris !
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default PWAInstallSection;
