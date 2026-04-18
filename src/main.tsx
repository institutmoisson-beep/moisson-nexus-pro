import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// ── Service Worker registration ──────────────────────────────
// On enregistre le SW après le premier paint pour ne pas bloquer le rendu
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/sw.js", { scope: "/" })
      .then((reg) => {
        // Vérifier les mises à jour toutes les 60 minutes (sans recharger la page)
        setInterval(() => reg.update().catch(() => {}), 60 * 60 * 1000);
      })
      .catch((err) => {
        // Silencieux en prod — le SW est un bonus, pas un prérequis
        if (import.meta.env.DEV) console.warn("SW registration failed:", err);
      });
  });
}

createRoot(document.getElementById("root")!).render(<App />);
