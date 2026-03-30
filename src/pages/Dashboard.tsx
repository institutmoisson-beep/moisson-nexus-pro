import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Wallet, Users, TrendingUp, Package } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";

const Dashboard = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<any>(null);
  const [stats, setStats] = useState({ network: 0, commissions: 0, orders: 0 });

  useEffect(() => {
    if (!loading && !user) navigate("/connexion");
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user) {
      supabase.from("profiles").select("*").eq("user_id", user.id).single().then(({ data }) => setProfile(data));
      // Network count
      supabase.from("profiles").select("id", { count: "exact", head: true }).then(({ count }) =>
        setStats(s => ({ ...s, network: (count || 1) - 1 }))
      );
      // Commission total
      supabase.from("transactions").select("amount").eq("user_id", user.id).eq("type", "commission").eq("status", "approved").then(({ data }) =>
        setStats(s => ({ ...s, commissions: (data || []).reduce((sum, t) => sum + Number(t.amount), 0) }))
      );
      // Orders
      supabase.from("pack_orders").select("id", { count: "exact", head: true }).eq("user_id", user.id).then(({ count }) =>
        setStats(s => ({ ...s, orders: count || 0 }))
      );
    }
  }, [user]);

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
        <div className="card-elevated">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center"><Package className="w-4 h-4 text-primary" /></div>
            <span className="text-xs text-muted-foreground font-body">Commandes</span>
          </div>
          <p className="text-xl font-heading font-bold text-foreground">{stats.orders}</p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid md:grid-cols-3 gap-4">
        <button onClick={() => navigate("/portefeuille")} className="card-elevated text-left hover:shadow-lg transition-shadow">
          <h3 className="font-heading font-semibold text-foreground mb-1">💰 Portefeuille</h3>
          <p className="text-xs text-muted-foreground font-body">Recharger, retirer, historique</p>
        </button>
        <button onClick={() => navigate("/packs")} className="card-elevated text-left hover:shadow-lg transition-shadow">
          <h3 className="font-heading font-semibold text-foreground mb-1">📦 Acheter un Pack</h3>
          <p className="text-xs text-muted-foreground font-body">Activer votre MLM</p>
        </button>
        <button onClick={() => navigate("/reseau")} className="card-elevated text-left hover:shadow-lg transition-shadow">
          <h3 className="font-heading font-semibold text-foreground mb-1">🌳 Mon Réseau</h3>
          <p className="text-xs text-muted-foreground font-body">Arbre généalogique</p>
        </button>
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
