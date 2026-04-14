import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Wallet, Users, TrendingUp, Package, Smartphone, Download, Share2, CheckCircle, Flame, Coins } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const Dashboard = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<any>(null);
  const [stats, setStats] = useState({ network: 0, commissions: 0, orders: 0, msnCoins: 0 });

  // PWA install state
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const [installSuccess, setInstallSuccess] = useState(false);

  useEffect(() => {
    if (!loading && !user) navigate("/connexion");
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user) {
      supabase.from("profiles").select("*").eq("user_id", user.id).single().then(({ data }) => setProfile(data));
      supabase.from("profiles").select("id", { count: "exact", head: true }).then(({ count }) =>
        setStats(s => ({ ...s, network: (count || 1) - 1 }))
      );
      supabase.from("transactions").select("amount").eq("user_id", user.id).eq("type", "commission").eq("status", "approved").then(({ data }) =>
        setStats(s => ({ ...s, commissions: (data || []).reduce((sum, t) => sum + Number(t.amount), 0) }))
      );
      supabase.from("pack_orders").select("id", { count: "exact", head: true }).eq("user_id", user.id).then(({ count }) =>
        setStats(s => ({ ...s, orders: count || 0 }))
      );
      supabase.from("msn_coins").select("coins").eq("user_id", user.id).eq("is_converted", false).then(({ data }) =>
        setStats(s => ({ ...s, msnCoins: (data || []).reduce((sum, c) => sum + c.coins, 0) }))
      );
    }
  }, [user]);

  // PWA detection
  useEffect(() => {
    const standalone = window.matchMedia("(display-mode: standalone)").matches || (navigator as any).standalone === true;
    if (standalone) { setIsInstalled(true); return; }

    const ua = navigator.userAgent;
    const ios = /iPad|iPhone|iPod/.test(ua) && !(window as any).MSStream;
    setIsIOS(ios);

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", handler);

    const installedHandler = () => {
      setIsInstalled(true);
      setInstallSuccess(true);
    };
    window.addEventListener("appinstalled", installedHandler);

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
      window.removeEventListener("appinstalled", installedHandler);
    };
  }, []);

  const handleInstallPWA = async () => {
    if (isIOS) { setShowIOSGuide(true); return; }
    if (!deferredPrompt) return;
    try {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") {
        setInstallSuccess(true);
        setIsInstalled(true);
      }
      setDeferredPrompt(null);
    } catch { /* silent */ }
  };

  if (loading || !profile) {
    return <div className="min-h-screen flex items-center justify-center bg-background"><div className="animate-pulse text-muted-foreground font-body">Chargement...</div></div>;
  }

  return (
    <DashboardLayout>
      <h1 className="text-3xl font-heading font-bold text-foreground mb-2">
        Bonjour, {profile.first_name} 🌾
      </h1>
      <p className="text-muted-foreground font-body mb-8">
        Profil de carrière : <span className="text-primary font-semibold capitalize">{profile.career_level.replace(/_/g, " ")}</span>
        {!profile.is_mlm_active && (
          <span className="ml-2 text-xs bg-accent/20 text-accent-foreground px-2 py-1 rounded-full">
            MLM non activé — <button onClick={() => navigate("/packs")} className="underline">Achetez un pack</button>
          </span>
        )}
      </p>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="card-elevated">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center"><Wallet className="w-4 h-4 text-primary" /></div>
            <span className="text-xs text-muted-foreground font-body">Portefeuille</span>
          </div>
          <p className="text-xl font-heading font-bold text-foreground">{Number(profile.wallet_balance).toLocaleString("fr-FR")} FCFA</p>
        </div>
        <div className="card-elevated">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-9 h-9 rounded-lg bg-harvest-green/10 flex items-center justify-center"><Users className="w-4 h-4 text-harvest-green" /></div>
            <span className="text-xs text-muted-foreground font-body">Mon réseau</span>
          </div>
          <p className="text-xl font-heading font-bold text-foreground">{stats.network}</p>
        </div>
        <div className="card-elevated">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-9 h-9 rounded-lg bg-gold/10 flex items-center justify-center"><TrendingUp className="w-4 h-4 text-gold" /></div>
            <span className="text-xs text-muted-foreground font-body">Commissions</span>
          </div>
          <p className="text-xl font-heading font-bold text-foreground">{stats.commissions.toLocaleString("fr-FR")} FCFA</p>
        </div>
        <div className="card-elevated cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate("/msn-wallet")}>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-primary/20 to-gold/20 flex items-center justify-center"><Flame className="w-4 h-4 text-gold" /></div>
            <span className="text-xs text-muted-foreground font-body">MSN Coins</span>
          </div>
          <div className="flex items-center gap-1">
            <p className="text-xl font-heading font-bold text-foreground">{stats.msnCoins}</p>
            <Coins className="w-4 h-4 text-gold" />
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid md:grid-cols-3 gap-4 mb-6">
        <button onClick={() => navigate("/portefeuille")} className="card-elevated text-left hover:shadow-lg transition-shadow">
          <h3 className="font-heading font-semibold text-foreground mb-1">💰 Portefeuille</h3>
          <p className="text-xs text-muted-foreground font-body">Recharger, retirer, historique</p>
        </button>
        <button onClick={() => navigate("/packs")} className="card-elevated text-left hover:shadow-lg transition-shadow">
          <h3 className="font-heading font-semibold text-foreground mb-1">📦 Acheter un Pack</h3>
          <p className="text-xs text-muted-foreground font-body">Activer votre MLM</p>
        </button>
        <button onClick={() => navigate("/msn-wallet")} className="card-elevated text-left hover:shadow-lg transition-shadow border-primary/20">
          <h3 className="font-heading font-semibold text-foreground mb-1">🔥 MSN Coins</h3>
          <p className="text-xs text-muted-foreground font-body">Convertir, transférer, historique</p>
        </button>
      </div>

      {/* ── PWA INSTALL SECTION ── */}
      {!isInstalled && (
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
                  { icon: "📵", label: "Hors-ligne", desc: "Fonctionne sans réseau" },
                  { icon: "🔔", label: "Notifications", desc: "Restez informé" },
                ].map(f => (
                  <div key={f.label} className="text-center p-3 bg-card rounded-xl border border-border">
                    <div className="text-xl mb-1">{f.icon}</div>
                    <p className="text-xs font-semibold text-foreground font-body">{f.label}</p>
                    <p className="text-[10px] text-muted-foreground font-body">{f.desc}</p>
                  </div>
                ))}
              </div>

              {isIOS ? (
                <div className="space-y-3">
                  <button
                    onClick={() => setShowIOSGuide(!showIOSGuide)}
                    className="btn-gold !text-sm !py-2.5 flex items-center gap-2"
                  >
                    <Share2 className="w-4 h-4" /> Instructions d'installation (iPhone/iPad)
                  </button>
                  {showIOSGuide && (
                    <div className="bg-card rounded-xl border border-border p-4 space-y-3">
                      <p className="text-sm font-heading font-semibold text-foreground">Installation sur iPhone :</p>
                      <ol className="space-y-2">
                        {[
                          { n: 1, text: 'Appuyez sur le bouton Partager ⬆️ en bas de Safari' },
                          { n: 2, text: 'Faites défiler et sélectionnez "Sur l\'écran d\'accueil"' },
                          { n: 3, text: 'Appuyez sur "Ajouter" en haut à droite' },
                        ].map(step => (
                          <li key={step.n} className="flex items-start gap-3">
                            <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">{step.n}</span>
                            <p className="text-sm font-body text-foreground">{step.text}</p>
                          </li>
                        ))}
                      </ol>
                    </div>
                  )}
                </div>
              ) : deferredPrompt ? (
                <button
                  onClick={handleInstallPWA}
                  className="btn-gold !text-sm !py-2.5 flex items-center gap-2"
                >
                  <Download className="w-4 h-4" /> Installer maintenant
                </button>
              ) : (
                <div className="bg-secondary rounded-lg p-3">
                  <p className="text-xs font-body text-muted-foreground">
                    💡 Pour installer l'application : dans votre navigateur, cherchez l'option <strong>"Installer"</strong> ou <strong>"Ajouter à l'écran d'accueil"</strong> dans le menu (⋮ ou partager ⬆️).
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Installed success */}
      {isInstalled && installSuccess && (
        <div className="card-elevated border-harvest-green/20 bg-harvest-green/5">
          <div className="flex items-center gap-3">
            <CheckCircle className="w-8 h-8 text-harvest-green" />
            <div>
              <p className="font-heading font-bold text-foreground">Application installée avec succès !</p>
              <p className="text-sm text-muted-foreground font-body">L'app Moisson est maintenant sur votre écran d'accueil.</p>
            </div>
          </div>
        </div>
      )}

      {/* iOS Guide Modal */}
      {showIOSGuide && isIOS && (
        <div className="fixed inset-0 bg-foreground/60 flex items-end justify-center z-50 p-4 backdrop-blur-sm" onClick={() => setShowIOSGuide(false)}>
          <div className="bg-card rounded-2xl border border-border p-6 w-full max-w-sm mb-4" onClick={e => e.stopPropagation()}>
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
                { n: 1, text: 'Appuyez sur le bouton Partager ⬆️ en bas de Safari' },
                { n: 2, text: 'Sélectionnez "Sur l\'écran d\'accueil"' },
                { n: 3, text: 'Appuyez sur "Ajouter" en haut à droite' },
              ].map(step => (
                <li key={step.n} className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">{step.n}</span>
                  <p className="text-sm font-body text-foreground">{step.text}</p>
                </li>
              ))}
            </ol>
            <button onClick={() => setShowIOSGuide(false)}
              className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-body font-semibold text-sm">
              Compris !
            </button>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default Dashboard;
