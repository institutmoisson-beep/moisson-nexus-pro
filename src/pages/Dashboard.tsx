import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { useEffect, useState, memo, useCallback } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Wallet, Users, TrendingUp, Flame } from "lucide-react";
import { getCommissions, type UserProfile } from "@/lib/demo-data";

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  onClick?: () => void;
}
const StatCard = memo(({ icon, label, value, onClick }: StatCardProps) => (
  <div className={`card-elevated ${onClick ? "cursor-pointer hover:shadow-md transition-shadow" : ""}`} onClick={onClick}>
    <div className="flex items-center gap-2 mb-2">
      <div className="w-9 h-9 rounded-lg bg-secondary flex items-center justify-center">{icon}</div>
      <span className="text-xs text-muted-foreground font-body">{label}</span>
    </div>
    <p className="text-xl font-heading font-bold text-foreground">{value}</p>
  </div>
));
StatCard.displayName = "StatCard";

interface QuickActionProps {
  emoji: string;
  label: string;
  desc: string;
  onClick: () => void;
}
const QuickAction = memo(({ emoji, label, desc, onClick }: QuickActionProps) => (
  <button onClick={onClick} className="card-elevated text-left hover:shadow-lg transition-shadow">
    <h3 className="font-heading font-semibold text-foreground mb-1">{emoji} {label}</h3>
    <p className="text-xs text-muted-foreground font-body">{desc}</p>
  </button>
));
QuickAction.displayName = "QuickAction";

const Dashboard = () => {
  const { user, loading, getUserProfile } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    if (!loading && !user) navigate("/connexion");
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user) setProfile(getUserProfile());
  }, [user, getUserProfile]);

  const goTo = useCallback((path: string) => () => navigate(path), [navigate]);

  const commissions = profile ? getCommissions().filter(c => c.user_id === profile.id && c.status === "paid") : [];
  const totalCommissions = commissions.reduce((s, c) => s + c.amount, 0);

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
        Profil :{" "}
        <span className="text-primary font-semibold capitalize">{profile.career_level.replace(/_/g, " ")}</span>
        {!profile.is_mlm_active && (
          <span className="ml-2 text-xs bg-accent/20 text-accent-foreground px-2 py-1 rounded-full">
            MLM non activé — <button onClick={goTo("/packs")} className="underline">Achetez un pack</button>
          </span>
        )}
      </p>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <StatCard icon={<Wallet className="w-4 h-4 text-primary" />} label="Portefeuille" value={`${profile.wallet_balance.toLocaleString("fr-FR")} FCFA`} onClick={goTo("/portefeuille")} />
        <StatCard icon={<Users className="w-4 h-4 text-harvest-green" />} label="Mon réseau" value="0" onClick={goTo("/reseau")} />
        <StatCard icon={<TrendingUp className="w-4 h-4 text-gold" />} label="Commissions" value={`${totalCommissions.toLocaleString("fr-FR")} FCFA`} onClick={goTo("/portefeuille")} />
        <StatCard icon={<Flame className="w-4 h-4 text-gold" />} label="MSN Coins" value="0" onClick={goTo("/msn-wallet")} />
      </div>

      <div className="grid md:grid-cols-3 gap-4 mb-6">
        <QuickAction emoji="💰" label="Portefeuille" desc="Recharger, retirer, historique" onClick={goTo("/portefeuille")} />
        <QuickAction emoji="📦" label="Acheter un Pack" desc="Activer votre MLM" onClick={goTo("/packs")} />
        <QuickAction emoji="🏬" label="Vente par Mandat" desc="Commissions automatiques" onClick={goTo("/vente-mandat")} />
      </div>

      <div className="grid md:grid-cols-3 gap-4 mb-6">
        <QuickAction emoji="📦" label="Produits en Gros" desc="Achetez à prix réduit" onClick={goTo("/produits-en-gros")} />
        <QuickAction emoji="🚚" label="Distribution" desc="Produits avec commissions" onClick={goTo("/distribution")} />
        <QuickAction emoji="👥" label="Mon Réseau" desc="Voir l'arbre de parrainage" onClick={goTo("/reseau")} />
      </div>

      <button onClick={goTo("/cas-urgents")} className="w-full mb-4 p-4 rounded-xl bg-linear-to-r from-red-500 to-red-600 text-white shadow-lg hover:shadow-xl hover:scale-[1.01] transition-all flex items-center gap-4">
        <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center text-2xl shrink-0 animate-pulse">🚨</div>
        <div className="text-left flex-1">
          <h3 className="font-heading font-bold text-lg">Cas Urgent</h3>
          <p className="text-xs text-white/90 font-body">Signalez une urgence — alerte communautaire immédiate</p>
        </div>
      </button>

      <button onClick={goTo("/fond-communautaire")} className="w-full p-4 rounded-xl bg-linear-to-r from-harvest-green to-emerald-600 text-white shadow-lg hover:shadow-xl hover:scale-[1.01] transition-all flex items-center gap-4">
        <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center text-2xl shrink-0">🏦</div>
        <div className="text-left flex-1">
          <h3 className="font-heading font-bold text-lg">Fond Communautaire</h3>
          <p className="text-xs text-white/90 font-body">Contribuer au fond de solidarité</p>
        </div>
      </button>
    </DashboardLayout>
  );
};

export default Dashboard;
