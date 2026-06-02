import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/DashboardLayout";
import { Users, TrendingUp, Wallet, Award, Copy } from "lucide-react";
import { toast } from "sonner";

const MLMDashboard = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<any>(null);
  const [commissions, setCommissions] = useState<any[]>([]);
  const [network, setNetwork] = useState<any[]>([]);
  const [node, setNode] = useState<any>(null);

  useEffect(() => { if (!loading && !user) navigate("/connexion"); }, [user, loading, navigate]);
  useEffect(() => { if (user) load(); }, [user]);

  const load = async () => {
    const { data: prof } = await supabase.from("profiles").select("*").eq("user_id", user!.id).single();
    setProfile(prof);
    if (!prof) return;
    const [c, n, mn] = await Promise.all([
      supabase.from("commissions" as any).select("*").eq("user_id", user!.id).order("created_at", { ascending: false }).limit(50),
      supabase.from("profiles").select("id, first_name, last_name, career_level, is_mlm_active").eq("referred_by", prof.id),
      supabase.from("mlm_nodes" as any).select("*").eq("profile_id", prof.id).maybeSingle(),
    ]);
    setCommissions((c.data as any) || []);
    setNetwork((n.data as any) || []);
    setNode((mn.data as any) || null);
  };

  const referralLink = profile?.referral_code
    ? `${window.location.origin}/#/inscription?ref=${profile.referral_code}`
    : "";

  const copyLink = () => {
    navigator.clipboard.writeText(referralLink);
    toast.success("Lien copié !");
  };

  const totalEarned = commissions.filter(c => c.status === "paid").reduce((s, c) => s + Number(c.amount), 0);
  const pending = commissions.filter(c => c.status === "pending").reduce((s, c) => s + Number(c.amount), 0);

  const pvLeft = Number(node?.accumulated_pv_left || 0);
  const pvRight = Number(node?.accumulated_pv_right || 0);
  const pvMax = Math.max(pvLeft, pvRight, 100);

  return (
    <DashboardLayout>
      <h1 className="text-3xl font-heading font-bold text-foreground mb-2">📈 Réseau MLM</h1>
      <p className="text-muted-foreground font-body mb-6 text-sm">Performances et commissions du réseau</p>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="card-elevated text-center">
          <Wallet className="w-5 h-5 mx-auto mb-2 text-primary" />
          <p className="text-2xl font-heading font-bold text-foreground">{Number(profile?.wallet_balance || 0).toLocaleString("fr-FR")} F</p>
          <p className="text-xs text-muted-foreground">Solde</p>
        </div>
        <div className="card-elevated text-center">
          <TrendingUp className="w-5 h-5 mx-auto mb-2 text-harvest-green" />
          <p className="text-2xl font-heading font-bold text-foreground">{totalEarned.toLocaleString("fr-FR")} F</p>
          <p className="text-xs text-muted-foreground">Gagné</p>
        </div>
        <div className="card-elevated text-center">
          <Award className="w-5 h-5 mx-auto mb-2 text-gold" />
          <p className="text-2xl font-heading font-bold text-foreground">{pending.toLocaleString("fr-FR")} F</p>
          <p className="text-xs text-muted-foreground">En attente</p>
        </div>
        <div className="card-elevated text-center">
          <Users className="w-5 h-5 mx-auto mb-2 text-primary" />
          <p className="text-2xl font-heading font-bold text-foreground">{network.length}</p>
          <p className="text-xs text-muted-foreground">Filleuls directs</p>
        </div>
      </div>

      <div className="card-elevated mb-6">
        <h2 className="font-heading font-bold text-foreground mb-3">🔗 Lien de parrainage</h2>
        <div className="flex gap-2">
          <input readOnly value={referralLink} className="input-field flex-1 text-xs" />
          <button onClick={copyLink} className="px-4 py-2 rounded-lg bg-primary text-primary-foreground flex items-center gap-1 text-sm">
            <Copy className="w-4 h-4" /> Copier
          </button>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4 mb-6">
        <div className="card-elevated">
          <h3 className="font-heading font-bold text-foreground mb-3">⚖️ Volume Binaire</h3>
          <div className="space-y-2 font-body text-sm">
            <div>
              <div className="flex justify-between mb-1"><span>Gauche</span><strong>{pvLeft} PV</strong></div>
              <div className="h-2 bg-secondary rounded-full overflow-hidden">
                <div className="h-full bg-primary" style={{ width: `${(pvLeft / pvMax) * 100}%` }} />
              </div>
            </div>
            <div>
              <div className="flex justify-between mb-1"><span>Droite</span><strong>{pvRight} PV</strong></div>
              <div className="h-2 bg-secondary rounded-full overflow-hidden">
                <div className="h-full bg-harvest-green" style={{ width: `${(pvRight / pvMax) * 100}%` }} />
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-2">Rang actuel : <strong>{node?.current_rank || profile?.career_level || "semeur"}</strong></p>
          </div>
        </div>

        <div className="card-elevated">
          <h3 className="font-heading font-bold text-foreground mb-3">👥 Mes filleuls directs</h3>
          {network.length === 0 ? (
            <p className="text-sm text-muted-foreground">Aucun filleul pour l'instant.</p>
          ) : (
            <ul className="space-y-2 text-sm font-body max-h-64 overflow-auto">
              {network.map(u => (
                <li key={u.id} className="flex items-center justify-between p-2 rounded-lg bg-secondary/30">
                  <span>{u.first_name} {u.last_name}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${u.is_mlm_active ? "bg-harvest-green/20 text-harvest-green" : "bg-muted text-muted-foreground"}`}>
                    {u.career_level}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="card-elevated">
        <h3 className="font-heading font-bold text-foreground mb-3">💰 Historique des commissions</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm font-body">
            <thead><tr className="text-left text-muted-foreground border-b border-border">
              <th className="p-2">Date</th><th className="p-2">Type</th><th className="p-2">Niveau</th><th className="p-2">Montant</th><th className="p-2">Statut</th>
            </tr></thead>
            <tbody>
              {commissions.map(c => (
                <tr key={c.id} className="border-b border-border/50">
                  <td className="p-2">{new Date(c.created_at).toLocaleDateString("fr-FR")}</td>
                  <td className="p-2">{c.type}</td>
                  <td className="p-2">{c.level}</td>
                  <td className="p-2 text-harvest-green font-semibold">{Number(c.amount).toLocaleString("fr-FR")} F</td>
                  <td className="p-2">{c.status}</td>
                </tr>
              ))}
              {commissions.length === 0 && <tr><td colSpan={5} className="p-6 text-center text-muted-foreground">Aucune commission</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default MLMDashboard;
