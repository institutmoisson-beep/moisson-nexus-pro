import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { useEffect, useState, memo, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Wallet, Users, TrendingUp, Package, Flame, Coins } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import PWAInstallSection from "@/components/PWAInstallSection";

// ── Stat card mémorisé ──────────────────────────────────
interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  onClick?: () => void;
}
const StatCard = memo(({ icon, label, value, onClick }: StatCardProps) => (
  <div
    className={`card-elevated ${onClick ? "cursor-pointer hover:shadow-md transition-shadow" : ""}`}
    onClick={onClick}
  >
    <div className="flex items-center gap-2 mb-2">
      <div className="w-9 h-9 rounded-lg bg-secondary flex items-center justify-center">{icon}</div>
      <span className="text-xs text-muted-foreground font-body">{label}</span>
    </div>
    <p className="text-xl font-heading font-bold text-foreground">{value}</p>
  </div>
));
StatCard.displayName = "StatCard";

// ── Quick action mémorisé ──────────────────────────────
interface QuickActionProps {
  emoji: string;
  label: string;
  desc: string;
  onClick: () => void;
}
const QuickAction = memo(({ emoji, label, desc, onClick }: QuickActionProps) => (
  <button
    onClick={onClick}
    className="card-elevated text-left hover:shadow-lg transition-shadow"
  >
    <h3 className="font-heading font-semibold text-foreground mb-1">
      {emoji} {label}
    </h3>
    <p className="text-xs text-muted-foreground font-body">{desc}</p>
  </button>
));
QuickAction.displayName = "QuickAction";

// ── Page principale ─────────────────────────────────────
const Dashboard = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<any>(null);
  const [stats, setStats] = useState({
    network: 0,
    commissions: 0,
    orders: 0,
    msnCoins: 0,
  });

  useEffect(() => {
    if (!loading && !user) navigate("/connexion");
  }, [user, loading, navigate]);

  useEffect(() => {
    if (!user) return;

    // Requêtes parallèles — une seule fois
    const load = async () => {
      const [profileRes, networkRes, commRes, ordersRes, coinsRes] = await Promise.all([
        supabase.from("profiles").select("*").eq("user_id", user.id).single(),
        supabase.from("profiles").select("id", { count: "exact", head: true }),
        supabase
          .from("transactions")
          .select("amount")
          .eq("user_id", user.id)
          .eq("type", "commission")
          .eq("status", "approved"),
        supabase
          .from("pack_orders")
          .select("id", { count: "exact", head: true })
          .eq("user_id", user.id),
        supabase
          .from("msn_coins")
          .select("coins")
          .eq("user_id", user.id)
          .eq("is_converted", false),
      ]);

      setProfile(profileRes.data);
      setStats({
        network: Math.max(0, (networkRes.count ?? 1) - 1),
        commissions: (commRes.data ?? []).reduce(
          (s, t) => s + Number(t.amount),
          0
        ),
        orders: ordersRes.count ?? 0,
        msnCoins: (coinsRes.data ?? []).reduce((s, c) => s + c.coins, 0),
      });
    };

    load();
  }, [user]);

  const goTo = useCallback((path: string) => () => navigate(path), [navigate]);

  if (loading || !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground font-body">Chargement...</div>
      </div>
    );
  }

  return (
    <DashboardLayout>
      <h1 className="text-3xl font-heading font-bold text-foreground mb-2">
        Bonjour, {profile.first_name} 🌾
      </h1>
      <p className="text-muted-foreground font-body mb-8">
        Profil de carrière :{" "}
        <span className="text-primary font-semibold capitalize">
          {profile.career_level.replace(/_/g, " ")}
        </span>
        {!profile.is_mlm_active && (
          <span className="ml-2 text-xs bg-accent/20 text-accent-foreground px-2 py-1 rounded-full">
            MLM non activé —{" "}
            <button onClick={goTo("/packs")} className="underline">
              Achetez un pack
            </button>
          </span>
        )}
      </p>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <StatCard
          icon={<Wallet className="w-4 h-4 text-primary" />}
          label="Portefeuille"
          value={`${Number(profile.wallet_balance).toLocaleString("fr-FR")} FCFA`}
        />
        <StatCard
          icon={<Users className="w-4 h-4 text-harvest-green" />}
          label="Mon réseau"
          value={String(stats.network)}
        />
        <StatCard
          icon={<TrendingUp className="w-4 h-4 text-gold" />}
          label="Commissions"
          value={`${stats.commissions.toLocaleString("fr-FR")} FCFA`}
        />
        <StatCard
          icon={<Flame className="w-4 h-4 text-gold" />}
          label="MSN Coins"
          value={String(stats.msnCoins)}
          onClick={goTo("/msn-wallet")}
        />
      </div>

      {/* Quick Actions */}
      <div className="grid md:grid-cols-3 gap-4 mb-6">
        <QuickAction emoji="💰" label="Portefeuille"    desc="Recharger, retirer, historique" onClick={goTo("/portefeuille")} />
        <QuickAction emoji="📦" label="Acheter un Pack" desc="Activer votre MLM"             onClick={goTo("/packs")} />
        <QuickAction emoji="🔥" label="MSN Coins"       desc="Convertir, transférer, historique" onClick={goTo("/msn-wallet")} />
      </div>

      {/* PWA Installation — composant dédié */}
      <PWAInstallSection />
    </DashboardLayout>
  );
};

export default Dashboard;
