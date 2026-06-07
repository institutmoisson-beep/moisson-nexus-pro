/**
 * InstallPWA — Modern, friction-less install experience.
 *
 * - Capture `beforeinstallprompt` on Android/Chrome/Edge → native dialog.
 * - iOS Safari → animated, illustrated bottom sheet with Share→Add steps.
 * - Already installed (standalone) → renders nothing.
 * - Inside Lovable preview/iframe → button redirects to the published origin
 *   where install actually works.
 * - Polished floating CTA + animated bottom sheet built with shadcn primitives.
 */
import { useEffect, useMemo, useRef, useState } from "react";
import { Download, Share, Plus, X, Smartphone, Sparkles, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

const PUBLISHED_ORIGIN = "https://moisson-nexus-pro.lovable.app";
const DISMISS_KEY = "im_install_dismissed_at";
const DISMISS_TTL_MS = 1000 * 60 * 60 * 24 * 3; // 3 jours

const isStandalone = () =>
  typeof window !== "undefined" &&
  (window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as any).standalone === true ||
    document.referrer.startsWith("android-app://"));

const isIOS = () =>
  typeof navigator !== "undefined" &&
  /iPad|iPhone|iPod/.test(navigator.userAgent) &&
  !(window as any).MSStream;

const isSafari = () =>
  typeof navigator !== "undefined" &&
  /^((?!chrome|android|crios|fxios|edgios).)*safari/i.test(navigator.userAgent);

const isAndroid = () =>
  typeof navigator !== "undefined" && /android/i.test(navigator.userAgent);

const isPreviewHost = () => {
  if (typeof window === "undefined") return false;
  const h = window.location.hostname;
  return (
    h.startsWith("id-preview--") ||
    h.startsWith("preview--") ||
    h.endsWith(".lovableproject.com") ||
    h.endsWith(".lovableproject-dev.com")
  );
};

const wasRecentlyDismissed = () => {
  try {
    const v = localStorage.getItem(DISMISS_KEY);
    if (!v) return false;
    return Date.now() - parseInt(v, 10) < DISMISS_TTL_MS;
  } catch {
    return false;
  }
};

const markDismissed = () => {
  try {
    localStorage.setItem(DISMISS_KEY, String(Date.now()));
  } catch {
    /* noop */
  }
};

const InstallPWA = () => {
  const deferredRef = useRef<BeforeInstallPromptEvent | null>(null);
  const [, force] = useState(0);
  const rerender = () => force((n) => n + 1);

  const [installed, setInstalled] = useState<boolean>(() => isStandalone());
  const [sheetOpen, setSheetOpen] = useState(false);
  const [autoOffered, setAutoOffered] = useState(false);
  const preview = useMemo(isPreviewHost, []);
  const ios = useMemo(isIOS, []);
  const iosSafari = useMemo(() => isIOS() && isSafari(), []);
  const android = useMemo(isAndroid, []);

  const publishedUrl = useMemo(() => {
    if (typeof window === "undefined") return PUBLISHED_ORIGIN;
    return `${PUBLISHED_ORIGIN}${window.location.pathname}${window.location.search}${window.location.hash}`;
  }, []);

  useEffect(() => {
    if (installed) return;

    const onPrompt = (e: Event) => {
      e.preventDefault();
      deferredRef.current = e as BeforeInstallPromptEvent;
      rerender();
      // Première visite : propose automatiquement après 4s si non rejeté récemment
      if (!autoOffered && !wasRecentlyDismissed()) {
        setAutoOffered(true);
        setTimeout(() => setSheetOpen(true), 4000);
      }
    };
    const onInstalled = () => {
      setInstalled(true);
      setSheetOpen(false);
      deferredRef.current = null;
    };
    const onDisplay = () => setInstalled(isStandalone());

    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    const mq = window.matchMedia("(display-mode: standalone)");
    mq.addEventListener?.("change", onDisplay);

    // iOS Safari : pas d'événement → propose une fois après 6s
    if (iosSafari && !wasRecentlyDismissed() && !autoOffered) {
      setAutoOffered(true);
      const t = setTimeout(() => setSheetOpen(true), 6000);
      return () => clearTimeout(t);
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
      mq.removeEventListener?.("change", onDisplay);
    };
  }, [installed, autoOffered, iosSafari]);

  const triggerNativePrompt = async () => {
    const evt = deferredRef.current;
    if (!evt) return false;
    try {
      await evt.prompt();
      const choice = await evt.userChoice;
      deferredRef.current = null;
      rerender();
      if (choice.outcome === "accepted") {
        setInstalled(true);
        setSheetOpen(false);
        return true;
      }
      markDismissed();
      return false;
    } catch {
      return false;
    }
  };

  const handleCtaClick = async () => {
    if (preview) {
      window.location.href = publishedUrl;
      return;
    }
    if (deferredRef.current) {
      const ok = await triggerNativePrompt();
      if (!ok) setSheetOpen(true);
      return;
    }
    setSheetOpen(true);
  };

  const handleDismiss = () => {
    markDismissed();
    setSheetOpen(false);
  };

  if (installed) return null;

  return (
    <>
      {/* Floating CTA */}
      <button
        type="button"
        onClick={handleCtaClick}
        aria-label="Installer l'application Institut Moisson"
        className={cn(
          "fixed z-50 bottom-5 right-5 group",
          "flex items-center gap-2 pl-4 pr-5 py-3 rounded-full",
          "bg-gradient-to-r from-primary via-primary to-accent text-primary-foreground",
          "shadow-[0_10px_30px_-8px_hsl(var(--primary)/0.55)]",
          "hover:shadow-[0_14px_40px_-10px_hsl(var(--primary)/0.7)]",
          "transition-all duration-300 hover:-translate-y-0.5",
          "font-body font-semibold text-sm",
          "ring-1 ring-primary-foreground/20",
          "animate-in fade-in slide-in-from-bottom-6"
        )}
      >
        <span className="relative flex items-center justify-center w-7 h-7 rounded-full bg-primary-foreground/15">
          <Download className="w-4 h-4" />
          <span className="absolute inset-0 rounded-full bg-primary-foreground/20 animate-ping opacity-60" />
        </span>
        <span className="hidden sm:inline">Installer l'app</span>
        <span className="sm:hidden">Installer</span>
      </button>

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent
          side="bottom"
          className="rounded-t-3xl border-0 p-0 max-h-[90vh] overflow-y-auto"
        >
          <div className="relative bg-gradient-to-br from-primary/10 via-background to-accent/10 px-6 pt-8 pb-6">
            <button
              onClick={handleDismiss}
              aria-label="Fermer"
              className="absolute top-4 right-4 p-2 rounded-full hover:bg-muted transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center justify-center mb-4">
              <div className="relative">
                <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-primary to-accent shadow-2xl flex items-center justify-center">
                  <img src="/icon-192.png" alt="" className="w-14 h-14 rounded-2xl" onError={(e) => { (e.currentTarget.style.display = "none"); }} />
                </div>
                <span className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-accent text-accent-foreground flex items-center justify-center shadow-lg">
                  <Sparkles className="w-3 h-3" />
                </span>
              </div>
            </div>

            <SheetHeader className="text-center space-y-1">
              <SheetTitle className="font-heading text-2xl">
                Installer Institut Moisson
              </SheetTitle>
              <SheetDescription className="text-sm">
                Accédez à votre tableau de bord en un seul tap, comme une vraie application.
              </SheetDescription>
            </SheetHeader>

            <div className="grid grid-cols-3 gap-2 mt-5">
              {[
                { icon: Smartphone, label: "Plein écran" },
                { icon: Sparkles, label: "Plus rapide" },
                { icon: Check, label: "Hors-ligne" },
              ].map(({ icon: Icon, label }) => (
                <div
                  key={label}
                  className="flex flex-col items-center gap-1 p-2 rounded-xl bg-background/60 backdrop-blur border border-border/40"
                >
                  <Icon className="w-4 h-4 text-primary" />
                  <span className="text-[11px] font-medium text-muted-foreground">{label}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="px-6 py-5 space-y-4">
            {preview && (
              <div className="rounded-xl bg-muted/60 border border-border p-3 text-xs text-muted-foreground">
                Vous êtes dans l'aperçu Lovable. Ouvrez la version publiée pour installer.
              </div>
            )}

            {preview ? (
              <Button onClick={() => (window.location.href = publishedUrl)} className="w-full h-12 text-base" size="lg">
                <Download className="w-4 h-4 mr-2" />
                Ouvrir la version installable
              </Button>
            ) : deferredRef.current && !ios ? (
              <Button onClick={triggerNativePrompt} className="w-full h-12 text-base" size="lg">
                <Download className="w-4 h-4 mr-2" />
                Installer maintenant
              </Button>
            ) : iosSafari ? (
              <IOSSteps />
            ) : ios ? (
              <div className="rounded-xl bg-muted/60 border border-border p-4 text-sm text-muted-foreground">
                Ouvrez cette page dans <strong>Safari</strong> pour pouvoir l'ajouter à l'écran d'accueil.
              </div>
            ) : android ? (
              <AndroidSteps />
            ) : (
              <DesktopSteps />
            )}

            <button
              onClick={handleDismiss}
              className="w-full text-xs text-muted-foreground hover:text-foreground py-2 transition"
            >
              Plus tard
            </button>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
};

const Step = ({ n, icon: Icon, title, desc }: { n: number; icon: any; title: string; desc: string }) => (
  <div className="flex items-start gap-3 p-3 rounded-xl bg-muted/40 border border-border/50">
    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm">
      {n}
    </div>
    <div className="flex-1 min-w-0">
      <div className="flex items-center gap-2 font-semibold text-sm">
        <Icon className="w-4 h-4 text-primary" />
        {title}
      </div>
      <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
    </div>
  </div>
);

const IOSSteps = () => (
  <div className="space-y-2">
    <Step n={1} icon={Share} title="Touchez « Partager »" desc="L'icône carré avec flèche ↑ en bas de Safari." />
    <Step n={2} icon={Plus} title="« Sur l'écran d'accueil »" desc="Faites défiler les options puis sélectionnez-la." />
    <Step n={3} icon={Check} title="« Ajouter »" desc="L'icône apparaît sur votre écran d'accueil." />
  </div>
);

const AndroidSteps = () => (
  <div className="space-y-2">
    <Step n={1} icon={Smartphone} title="Menu ⋮ du navigateur" desc="En haut à droite de Chrome ou Edge." />
    <Step n={2} icon={Download} title="« Installer l'application »" desc="Ou « Ajouter à l'écran d'accueil »." />
    <Step n={3} icon={Check} title="Confirmer" desc="L'application s'ajoute à votre lanceur." />
  </div>
);

const DesktopSteps = () => (
  <div className="space-y-2">
    <Step n={1} icon={Download} title="Icône d'installation" desc="Dans la barre d'adresse, à droite de l'URL." />
    <Step n={2} icon={Check} title="Installer" desc="Confirmez dans la boîte de dialogue du navigateur." />
  </div>
);

export default InstallPWA;
