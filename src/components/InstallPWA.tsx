/**
 * InstallPWA — Déclencheur automatique silencieux.
 * Quand le navigateur rend disponible `beforeinstallprompt`, on déclenche
 * automatiquement la fenêtre d'installation native du navigateur. Aucune
 * bannière, aucune consigne, aucune UI personnalisée.
 *
 * NOTE : les navigateurs n'autorisent PAS l'installation 100% automatique
 * sans interaction utilisateur — `prompt()` doit être appelé suite à un
 * geste utilisateur. On déclenche donc le prompt à la première interaction
 * (clic / touche) après son arrivée. C'est le maximum permis par la spec.
 */
import { useEffect } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const InstallPWA = () => {
  useEffect(() => {
    if (typeof window === "undefined") return;

    // Déjà installé : ne rien faire
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (navigator as any).standalone === true;
    if (standalone) return;

    let deferred: BeforeInstallPromptEvent | null = null;
    let promptShown = false;

    const tryPrompt = async () => {
      if (!deferred || promptShown) return;
      promptShown = true;
      try {
        await deferred.prompt();
        await deferred.userChoice;
      } catch {
        /* silencieux */
      } finally {
        deferred = null;
      }
    };

    const onPrompt = (e: Event) => {
      e.preventDefault();
      deferred = e as BeforeInstallPromptEvent;
      // Tenter immédiatement (ignoré si pas de geste précédent)
      tryPrompt();
    };

    const onInteract = () => {
      tryPrompt();
    };

    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("pointerdown", onInteract, { once: false });
    window.addEventListener("keydown", onInteract, { once: false });

    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("pointerdown", onInteract);
      window.removeEventListener("keydown", onInteract);
    };
  }, []);

  return null;
};

export default InstallPWA;
