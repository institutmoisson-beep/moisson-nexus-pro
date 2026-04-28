/**
 * InstallPWA — Bannière d'installation persistante
 *
 * Reste TOUJOURS visible tant que l'app n'est pas installée.
 * Affichée en bas de l'écran, fixe, non-dismissable.
 * Propose les instructions selon le navigateur/OS détecté.
 */
import { useState, useEffect } from "react";
import { Download, Smartphone, X, ChevronUp, ChevronDown } from "lucide-react";
import { usePWA } from "@/hooks/usePWA";

type BrowserType = "chrome" | "samsung" | "firefox" | "safari" | "edge" | "other";

function detectBrowser(): BrowserType {
  const ua = navigator.userAgent;
  if (/SamsungBrowser/i.test(ua)) return "samsung";
  if (/Edg\//i.test(ua)) return "edge";
  if (/Firefox/i.test(ua)) return "firefox";
  if (/iPad|iPhone|iPod/.test(ua)) return "safari";
  if (/Chrome/i.test(ua)) return "chrome";
  return "other";
}

const INSTRUCTIONS: Record<BrowserType, { icon: string; name: string; steps: string[] }> = {
  chrome: {
    icon: "🟢",
    name: "Chrome",
    steps: [
      "Appuyez sur ⋮ (3 points) en haut à droite",
      'Sélectionnez "Ajouter à l\'écran d\'accueil" ou "Installer l\'application"',
      'Confirmez en appuyant sur "Installer"',
    ],
  },
  samsung: {
    icon: "🔵",
    name: "Samsung Browser",
    steps: [
      "Appuyez sur ≡ (3 lignes) en bas",
      'Sélectionnez "Ajouter page à" → "Écran d\'accueil"',
      'Confirmez en appuyant sur "Ajouter"',
    ],
  },
  edge: {
    icon: "🔷",
    name: "Edge",
    steps: [
      "Appuyez sur … (3 points) en bas",
      'Sélectionnez "Ajouter à l\'écran d\'accueil"',
      'Confirmez en appuyant sur "Ajouter"',
    ],
  },
  firefox: {
    icon: "🦊",
    name: "Firefox",
    steps: [
      "Appuyez sur ⋮ (3 points) en haut à droite",
      'Sélectionnez "Installer"',
      'Confirmez en appuyant sur "Ajouter"',
    ],
  },
  safari: {
    icon: "🧭",
    name: "Safari iOS",
    steps: [
      "Appuyez sur le bouton Partager ⬆ en bas de Safari",
      'Faites défiler et appuyez sur "Sur l\'écran d\'accueil"',
      'Appuyez sur "Ajouter" en haut à droite',
    ],
  },
  other: {
    icon: "📱",
    name: "votre navigateur",
    steps: [
      "Ouvrez le menu de votre navigateur (⋮ ou …)",
      'Cherchez "Installer l\'application" ou "Ajouter à l\'écran d\'accueil"',
      "Confirmez l'installation",
    ],
  },
};

const InstallPWA = () => {
  const { showBanner, isInstalled, isIOS, deferredPrompt, install } = usePWA();
  const [browser, setBrowser] = useState<BrowserType>("other");
  const [expanded, setExpanded] = useState(false);
  const [installing, setInstalling] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    setBrowser(detectBrowser());
  }, []);

  // Ne pas afficher si déjà installé
  if (isInstalled || !showBanner) return null;

  const info = INSTRUCTIONS[browser];

  const handleInstall = async () => {
    if (isIOS) {
      setExpanded(true);
      return;
    }
    if (deferredPrompt) {
      setInstalling(true);
      const ok = await install();
      setInstalling(false);
      if (ok) setSuccess(true);
    } else {
      // Pas de prompt natif → afficher les instructions manuelles
      setExpanded(!expanded);
    }
  };

  if (success) {
    return (
      <div
        style={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 9999,
          background: "#16a34a",
          color: "#fff",
          padding: "12px 16px",
          textAlign: "center",
          fontFamily: "var(--font-body, sans-serif)",
          fontSize: "14px",
          fontWeight: 600,
        }}
      >
        ✅ Application installée ! Retrouvez-la sur votre écran d'accueil.
      </div>
    );
  }

  return (
    <div
      style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 9999,
        boxShadow: "0 -4px 20px rgba(0,0,0,0.15)",
      }}
    >
      {/* Instructions dépliables */}
      {expanded && (
        <div
          style={{
            background: "#1e1b4b",
            color: "#e0e7ff",
            padding: "16px",
            borderTop: "1px solid rgba(255,255,255,0.1)",
          }}
        >
          <p
            style={{
              fontSize: "11px",
              textTransform: "uppercase",
              letterSpacing: "1px",
              color: "#a5b4fc",
              marginBottom: "10px",
              fontWeight: 600,
            }}
          >
            {info.icon} Installer sur {info.name}
          </p>
          <ol style={{ paddingLeft: 0, listStyle: "none", margin: 0 }}>
            {info.steps.map((step, i) => (
              <li
                key={i}
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "10px",
                  marginBottom: "8px",
                  fontSize: "13px",
                  lineHeight: 1.5,
                }}
              >
                <span
                  style={{
                    minWidth: "22px",
                    height: "22px",
                    borderRadius: "50%",
                    background: "#4f46e5",
                    color: "#fff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "11px",
                    fontWeight: 700,
                    flexShrink: 0,
                    marginTop: "1px",
                  }}
                >
                  {i + 1}
                </span>
                <span>{step}</span>
              </li>
            ))}
          </ol>

          {/* Autres navigateurs */}
          <div style={{ marginTop: "12px", display: "flex", gap: "6px", flexWrap: "wrap" }}>
            {(Object.keys(INSTRUCTIONS) as BrowserType[])
              .filter((k) => k !== browser && k !== "other")
              .map((k) => (
                <button
                  key={k}
                  onClick={() => setBrowser(k)}
                  style={{
                    background: "rgba(255,255,255,0.1)",
                    border: "none",
                    borderRadius: "20px",
                    color: "#c7d2fe",
                    fontSize: "11px",
                    padding: "4px 10px",
                    cursor: "pointer",
                  }}
                >
                  {INSTRUCTIONS[k].icon} {INSTRUCTIONS[k].name}
                </button>
              ))}
          </div>
        </div>
      )}

      {/* Bannière principale — TOUJOURS VISIBLE */}
      <div
        style={{
          background: "linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)",
          padding: "12px 16px",
          display: "flex",
          alignItems: "center",
          gap: "12px",
        }}
      >
        {/* Icône */}
        <div
          style={{
            width: "40px",
            height: "40px",
            borderRadius: "10px",
            background: "rgba(255,255,255,0.2)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <Smartphone style={{ width: "20px", height: "20px", color: "#fff" }} />
        </div>

        {/* Texte */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <p
            style={{
              margin: 0,
              fontSize: "13px",
              fontWeight: 700,
              color: "#fff",
              lineHeight: 1.3,
            }}
          >
            Installer l'app Moisson
          </p>
          <p
            style={{
              margin: "2px 0 0",
              fontSize: "11px",
              color: "rgba(255,255,255,0.75)",
              lineHeight: 1.3,
            }}
          >
            Accès rapide • Hors-ligne • Notifications
          </p>
        </div>

        {/* Bouton principal */}
        {deferredPrompt && !isIOS ? (
          <button
            onClick={handleInstall}
            disabled={installing}
            style={{
              background: "#d4a017",
              border: "none",
              borderRadius: "8px",
              color: "#1a0a00",
              fontSize: "12px",
              fontWeight: 700,
              padding: "8px 14px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "5px",
              flexShrink: 0,
              opacity: installing ? 0.7 : 1,
            }}
          >
            <Download style={{ width: "14px", height: "14px" }} />
            {installing ? "..." : "Installer"}
          </button>
        ) : (
          <button
            onClick={handleInstall}
            style={{
              background: "rgba(255,255,255,0.2)",
              border: "1px solid rgba(255,255,255,0.4)",
              borderRadius: "8px",
              color: "#fff",
              fontSize: "12px",
              fontWeight: 600,
              padding: "8px 12px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "5px",
              flexShrink: 0,
            }}
          >
            {expanded ? (
              <ChevronDown style={{ width: "14px", height: "14px" }} />
            ) : (
              <ChevronUp style={{ width: "14px", height: "14px" }} />
            )}
            {expanded ? "Fermer" : "Comment installer"}
          </button>
        )}
      </div>

      {/* Barre de progression colorée en bas — indicateur visuel d'importance */}
      <div
        style={{
          height: "3px",
          background: "linear-gradient(90deg, #d4a017, #f59e0b, #d4a017)",
          backgroundSize: "200% 100%",
          animation: "shimmer 2s infinite linear",
        }}
      />

      <style>{`
        @keyframes shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>
    </div>
  );
};

export default InstallPWA;
