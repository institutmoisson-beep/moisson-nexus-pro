import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Wallet, Users, TrendingUp, Copy, Share2, LogOut } from "lucide-react";
import { toast } from "sonner";
import logo from "@/assets/logo-moisson.png";

const Dashboard = () => {
  const { user, signOut, loading } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/connexion");
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user) {
      supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user.id)
        .single()
        .then(({ data }) => setProfile(data));
    }
  }, [user]);

  if (loading || !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground font-body">Chargement...</div>
      </div>
    );
  }

  const referralLink = `${window.location.origin}/inscription?ref=${profile.referral_code}`;

  const copyCode = () => {
    navigator.clipboard.writeText(profile.referral_code);
    toast.success("Code copié !");
  };

  const copyLink = () => {
    navigator.clipboard.writeText(referralLink);
    toast.success("Lien copié !");
  };

  const shareWhatsApp = () => {
    window.open(`https://wa.me/?text=${encodeURIComponent(`Rejoins Institut Moisson avec mon code : ${profile.referral_code}\n${referralLink}`)}`, "_blank");
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={logo} alt="Institut Moisson" className="w-8 h-8" width={32} height={32} />
            <span className="font-heading text-lg font-bold text-foreground">Institut Moisson</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground font-body">
              {profile.first_name} {profile.last_name}
            </span>
            <button onClick={handleSignOut} className="text-muted-foreground hover:text-foreground transition-colors">
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8">
        <h1 className="text-3xl font-heading font-bold text-foreground mb-2">
          Bonjour, {profile.first_name} 🌾
        </h1>
        <p className="text-muted-foreground font-body mb-8">
          Profil de carrière : <span className="text-primary font-semibold capitalize">{profile.career_level.replace(/_/g, " ")}</span>
          {!profile.is_mlm_active && (
            <span className="ml-2 text-xs bg-accent/20 text-accent-foreground px-2 py-1 rounded-full">
              MLM non activé — Achetez un pack
            </span>
          )}
        </p>

        {/* Stats Grid */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <div className="card-elevated">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Wallet className="w-5 h-5 text-primary" />
              </div>
              <span className="text-sm text-muted-foreground font-body">Portefeuille</span>
            </div>
            <p className="text-2xl font-heading font-bold text-foreground">
              {Number(profile.wallet_balance).toLocaleString("fr-FR")} FCFA
            </p>
          </div>

          <div className="card-elevated">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-harvest-green/10 flex items-center justify-center">
                <Users className="w-5 h-5 text-harvest-green" />
              </div>
              <span className="text-sm text-muted-foreground font-body">Mon réseau</span>
            </div>
            <p className="text-2xl font-heading font-bold text-foreground">—</p>
          </div>

          <div className="card-elevated">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-gold/10 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-gold" />
              </div>
              <span className="text-sm text-muted-foreground font-body">Commissions totales</span>
            </div>
            <p className="text-2xl font-heading font-bold text-foreground">0 FCFA</p>
          </div>
        </div>

        {/* Referral Card */}
        <div className="card-elevated mb-8">
          <h2 className="text-xl font-heading font-semibold text-foreground mb-4">🌱 Votre Code Moissonneur</h2>
          <div className="flex items-center gap-3 mb-4">
            <div className="flex-1 px-4 py-3 rounded-lg bg-secondary font-mono text-lg text-foreground font-bold tracking-wider">
              {profile.referral_code}
            </div>
            <button onClick={copyCode} className="p-3 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors">
              <Copy className="w-5 h-5" />
            </button>
          </div>
          <div className="flex gap-3">
            <button onClick={copyLink} className="flex-1 btn-hero !text-sm !py-2.5 !px-4">
              <Copy className="w-4 h-4 mr-2" /> Copier le lien
            </button>
            <button onClick={shareWhatsApp} className="flex-1 inline-flex items-center justify-center rounded-lg px-4 py-2.5 text-sm font-semibold transition-all bg-harvest-green text-harvest-green-foreground hover:opacity-90">
              <Share2 className="w-4 h-4 mr-2" /> WhatsApp
            </button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
