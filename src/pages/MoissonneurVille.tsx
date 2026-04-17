import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  MapPin, Users, Search, Ban, CheckCircle, Eye, X,
  ArrowLeft, LogOut, History, RefreshCw,
  UserCheck, UserX, TrendingUp, Network
} from "lucide-react";
import { toast } from "sonner";
import logo from "@/assets/logo-moisson.png";

const TYPE_LABELS: Record<string, string> = {
  deposit: "Dépôt", withdrawal: "Retrait", pack_purchase: "Achat pack",
  commission: "Commission", bonus: "Bonus", admin_credit: "Crédit admin",
  admin_debit: "Débit admin", transfer: "Transfert", product_purchase: "Achat produit",
};

const MoissonneurVille = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [myProfile, setMyProfile] = useState<any>(null);
  const [assignedCity, setAssignedCity] = useState<string>("");
  const [members, setMembers] = useState<any[]>([]);
  const [filteredMembers, setFilteredMembers] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [selectedMember, setSelectedMember] = useState<any>(null);
  const [memberTransactions, setMemberTransactions] = useState<any[]>([]);
  const [memberOrders, setMemberOrders] = useState<any[]>([]);
  const [memberFilleuls, setMemberFilleuls] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<"overview" | "transactions" | "filleuls" | "commandes">("overview");
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const [stats, setStats] = useState({ total: 0, active: 0, suspended: 0, mlmActive: 0 });
  const [actionLogs, setActionLogs] = useState<any[]>([]);
  const [showLogs, setShowLogs] = useState(false);

  useEffect(() => { if (user) loadAll(); }, [user]);

  useEffect(() => {
    let result = members;
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(m =>
        `${m.first_name} ${m.last_name} ${m.email} ${m.referral_code}`.toLowerCase().includes(q)
      );
    }
    if (filterStatus === "active") result = result.filter(m => !m.is_suspended);
    if (filterStatus === "suspended") result = result.filter(m => m.is_suspended);
    if (filterStatus === "mlm") result = result.filter(m => m.is_mlm_active);
    setFilteredMembers(result);
  }, [search, filterStatus, members]);

  const loadAll = async () => {
    setLoading(true);
    const { data: profile } = await supabase.from("profiles").select("*").eq("user_id", user!.id).single();
    setMyProfile(profile);

    const { data: roleData } = await supabase
      .from("staff_roles")
      .select("*")
      .eq("user_id", user!.id)
      .eq("role", "moissonneur_ville")
      .single();

    // Case-insensitive city matching via ilike
    const city = (roleData as any)?.assigned_city || profile?.city || "";
    setAssignedCity(city);

    if (city) {
      const { data: membersData } = await supabase
        .from("profiles")
        .select("*")
        .ilike("city", city)
        .neq("user_id", user!.id)
        .order("created_at", { ascending: false });

      const list = membersData || [];
      setMembers(list);
      setStats({
        total: list.length,
        active: list.filter(m => !m.is_suspended).length,
        suspended: list.filter(m => m.is_suspended).length,
        mlmActive: list.filter(m => m.is_mlm_active).length,
      });
    }

    // Load action logs
    const { data: logs } = await (supabase as any)
      .from("regional_moderation_log")
      .select("*")
      .eq("moderator_id", user!.id)
      .order("created_at", { ascending: false })
      .limit(50);
    setActionLogs(logs || []);

    setLoading(false);
  };

  const loadMemberDetails = async (member: any) => {
    setSelectedMember(member);
    setActiveTab("overview");
    const [txRes, ordersRes, filleulsRes] = await Promise.all([
      supabase.from("transactions").select("*").eq("user_id", member.user_id).order("created_at", { ascending: false }).limit(30),
      supabase.from("pack_orders").select("*").eq("user_id", member.user_id).order("created_at", { ascending: false }).limit(20),
      supabase.from("profiles").select("first_name, last_name, email, career_level, is_mlm_active, city, country, created_at").eq("referred_by", member.id),
    ]);
    setMemberTransactions(txRes.data || []);
    setMemberOrders(ordersRes.data || []);
    setMemberFilleuls(filleulsRes.data || []);
  };

  const handleToggleSuspend = async (member: any) => {
    const action = member.is_suspended ? "réactivé" : "suspendu";
    const motif = window.prompt(`Motif pour ${action} ${member.first_name} ${member.last_name} :`);
    if (motif === null) return;

    setProcessing(member.user_id);
    await supabase.from("profiles").update({ is_suspended: !member.is_suspended }).eq("user_id", member.user_id);

    await (supabase as any).from("regional_moderation_log").insert({
      moderator_id: user!.id,
      target_user_id: member.user_id,
      action: member.is_suspended ? "reactivate" : "suspend",
      motif,
      scope: "city",
      scope_value: assignedCity,
    });

    toast.success(`Membre ${action} avec succès`);
    setProcessing(null);
    await loadAll();
    if (selectedMember?.user_id === member.user_id) {
      setSelectedMember({ ...selectedMember, is_suspended: !member.is_suspended });
    }
  };

  const totalCommissions = (txList: any[]) =>
    txList.filter(tx => tx.type === "commission" && tx.status === "approved")
          .reduce((s, tx) => s + Number(tx.amount), 0);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground font-body">Chargement du tableau de bord...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* HEADER */}
      <header className="border-b border-border bg-card sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={logo} alt="Institut Moisson" className="w-8 h-8" width={32} height={32} />
            <div>
              <span className="font-heading text-base font-bold text-foreground block leading-tight">
                📍 Moissonneur Ville
              </span>
              <span className="text-xs text-primary font-body font-semibold">{assignedCity || "Ville non assignée"}</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowLogs(!showLogs)}
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground font-body"
            >
              <History className="w-4 h-4" /> Journal
            </button>
            <button onClick={() => navigate("/dashboard")} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground font-body">
              <ArrowLeft className="w-4 h-4" /> Dashboard
            </button>
            <button onClick={async () => { await signOut(); navigate("/"); }} className="text-muted-foreground hover:text-foreground">
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        {!assignedCity ? (
          <div className="text-center py-20">
            <MapPin className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-heading font-bold text-foreground mb-2">Aucune ville assignée</h2>
            <p className="text-muted-foreground font-body">L'administrateur doit vous assigner une ville pour activer votre rôle.</p>
          </div>
        ) : (
          <>
            {/* STATS */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              {[
                { label: "Total membres", value: stats.total, icon: <Users className="w-5 h-5 text-primary" />, color: "bg-primary/10" },
                { label: "Actifs", value: stats.active, icon: <CheckCircle className="w-5 h-5 text-harvest-green" />, color: "bg-harvest-green/10" },
                { label: "Suspendus", value: stats.suspended, icon: <Ban className="w-5 h-5 text-destructive" />, color: "bg-destructive/10" },
                { label: "MLM actifs", value: stats.mlmActive, icon: <TrendingUp className="w-5 h-5 text-gold" />, color: "bg-gold/10" },
              ].map((s, i) => (
                <div key={i} className="card-elevated flex items-center gap-3 p-4">
                  <div className={`w-10 h-10 rounded-xl ${s.color} flex items-center justify-center`}>{s.icon}</div>
                  <div>
                    <p className="text-xs text-muted-foreground font-body">{s.label}</p>
                    <p className="text-xl font-heading font-bold text-foreground">{s.value}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* SEARCH & FILTER */}
            <div className="flex flex-wrap gap-3 mb-6">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  placeholder="Rechercher un membre..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-input bg-background text-foreground font-body text-sm"
                />
              </div>
              <select
                value={filterStatus}
                onChange={e => setFilterStatus(e.target.value)}
                className="px-3 py-2.5 rounded-lg border border-input bg-background text-foreground font-body text-sm"
              >
                <option value="">Tous les statuts</option>
                <option value="active">Actifs</option>
                <option value="suspended">Suspendus</option>
                <option value="mlm">MLM actifs</option>
              </select>
              <button onClick={loadAll} className="p-2.5 rounded-lg bg-secondary hover:bg-muted transition-colors">
                <RefreshCw className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>

            {/* MEMBERS TABLE */}
            <div className="card-elevated overflow-hidden">
              <div className="p-4 border-b border-border">
                <h2 className="font-heading font-bold text-foreground">
                  Membres de {assignedCity} ({filteredMembers.length})
                </h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm font-body">
                  <thead>
                    <tr className="border-b border-border text-muted-foreground bg-secondary/30">
                      <th className="text-left py-3 px-4">Membre</th>
                      <th className="text-left py-3 px-4">Email</th>
                      <th className="text-right py-3 px-4">Solde</th>
                      <th className="text-center py-3 px-4">MLM</th>
                      <th className="text-center py-3 px-4">Statut</th>
                      <th className="text-right py-3 px-4">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredMembers.map(member => (
                      <tr key={member.id} className={`border-b border-border/50 hover:bg-secondary/20 transition-colors ${member.is_suspended ? "opacity-60" : ""}`}>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                              {member.first_name.charAt(0)}{member.last_name.charAt(0)}
                            </div>
                            <div>
                              <p className="font-semibold text-foreground">{member.first_name} {member.last_name}</p>
                              <p className="text-[10px] text-muted-foreground font-mono">{member.referral_code}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-muted-foreground">{member.email}</td>
                        <td className="py-3 px-4 text-right font-semibold text-primary">
                          {Number(member.wallet_balance).toLocaleString("fr-FR")} F
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${member.is_mlm_active ? "bg-harvest-green/20 text-harvest-green" : "bg-muted text-muted-foreground"}`}>
                            {member.is_mlm_active ? "Actif" : "Inactif"}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${member.is_suspended ? "bg-destructive/20 text-destructive" : "bg-harvest-green/20 text-harvest-green"}`}>
                            {member.is_suspended ? "Suspendu" : "Actif"}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => loadMemberDetails(member)}
                              className="p-1.5 rounded-md hover:bg-secondary transition-colors"
                              title="Voir détails"
                            >
                              <Eye className="w-4 h-4 text-primary" />
                            </button>
                            <button
                              onClick={() => handleToggleSuspend(member)}
                              disabled={processing === member.user_id}
                              className="p-1.5 rounded-md hover:bg-secondary transition-colors disabled:opacity-50"
                              title={member.is_suspended ? "Réactiver" : "Suspendre"}
                            >
                              {member.is_suspended
                                ? <UserCheck className="w-4 h-4 text-harvest-green" />
                                : <UserX className="w-4 h-4 text-destructive" />
                              }
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {filteredMembers.length === 0 && (
                      <tr>
                        <td colSpan={6} className="py-12 text-center text-muted-foreground font-body">
                          {search ? "Aucun résultat" : `Aucun membre à ${assignedCity}`}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {/* ACTION LOGS PANEL */}
        {showLogs && (
          <div className="fixed inset-0 bg-foreground/60 z-50 flex items-end md:items-center justify-center p-4 backdrop-blur-sm"
            onClick={() => setShowLogs(false)}>
            <div className="bg-card rounded-2xl border border-border w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col"
              onClick={e => e.stopPropagation()}>
              <div className="p-5 border-b border-border flex items-center justify-between">
                <h3 className="font-heading font-bold text-foreground flex items-center gap-2">
                  <History className="w-5 h-5 text-primary" /> Journal de mes actions
                </h3>
                <button onClick={() => setShowLogs(false)} className="p-1.5 rounded-lg hover:bg-secondary">
                  <X className="w-4 h-4 text-muted-foreground" />
                </button>
              </div>
              <div className="overflow-y-auto flex-1 p-4">
                {actionLogs.length === 0 ? (
                  <p className="text-center text-muted-foreground font-body py-8">Aucune action enregistrée</p>
                ) : (
                  <div className="space-y-2">
                    {actionLogs.map((log: any) => (
                      <div key={log.id} className="flex items-start gap-3 p-3 rounded-lg bg-secondary/30 border border-border/50">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${log.action === "suspend" ? "bg-destructive/10" : "bg-harvest-green/10"}`}>
                          {log.action === "suspend"
                            ? <Ban className="w-4 h-4 text-destructive" />
                            : <CheckCircle className="w-4 h-4 text-harvest-green" />
                          }
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-foreground font-body">
                            {log.action === "suspend" ? "Suspension" : "Réactivation"}
                            <span className="text-muted-foreground font-normal ml-1">({log.scope_value})</span>
                          </p>
                          <p className="text-xs text-muted-foreground font-body mt-0.5">Motif : {log.motif || "—"}</p>
                        </div>
                        <span className="text-xs text-muted-foreground font-body whitespace-nowrap">
                          {new Date(log.created_at).toLocaleDateString("fr-FR")}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* MEMBER DETAIL MODAL */}
        {selectedMember && (
          <div className="fixed inset-0 bg-foreground/60 z-50 flex items-end md:items-center justify-center p-0 md:p-4 backdrop-blur-sm"
            onClick={() => setSelectedMember(null)}>
            <div className="bg-card w-full md:max-w-3xl max-h-[90vh] md:rounded-2xl rounded-t-2xl overflow-hidden flex flex-col border border-border shadow-2xl"
              onClick={e => e.stopPropagation()}>
              <div className="p-5 border-b border-border flex items-center justify-between flex-shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary font-heading text-lg">
                    {selectedMember.first_name.charAt(0)}{selectedMember.last_name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-heading font-bold text-foreground text-lg">
                      {selectedMember.first_name} {selectedMember.last_name}
                    </h3>
                    <p className="text-xs text-muted-foreground font-body">
                      {selectedMember.email} • {selectedMember.referral_code}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleToggleSuspend(selectedMember)}
                    disabled={processing === selectedMember.user_id}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-body font-semibold transition-colors ${
                      selectedMember.is_suspended
                        ? "bg-harvest-green/10 text-harvest-green hover:bg-harvest-green/20"
                        : "bg-destructive/10 text-destructive hover:bg-destructive/20"
                    }`}
                  >
                    {selectedMember.is_suspended
                      ? <><UserCheck className="w-4 h-4" /> Réactiver</>
                      : <><UserX className="w-4 h-4" /> Suspendre</>
                    }
                  </button>
                  <button onClick={() => setSelectedMember(null)} className="p-1.5 rounded-lg hover:bg-secondary">
                    <X className="w-4 h-4 text-muted-foreground" />
                  </button>
                </div>
              </div>

              {/* Tabs */}
              <div className="flex gap-1 bg-secondary p-1 mx-5 mt-4 rounded-xl flex-shrink-0">
                {[
                  { key: "overview", label: "📊 Vue d'ensemble" },
                  { key: "transactions", label: "💰 Transactions" },
                  { key: "filleuls", label: `👥 Filleuls (${memberFilleuls.length})` },
                  { key: "commandes", label: "📦 Commandes" },
                ].map(tab => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key as any)}
                    className={`flex-1 px-2 py-2 rounded-lg text-xs font-body font-semibold transition-all ${
                      activeTab === tab.key ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              <div className="flex-1 overflow-y-auto p-5">
                {activeTab === "overview" && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {[
                        { label: "Solde", value: `${Number(selectedMember.wallet_balance).toLocaleString("fr-FR")} F`, color: "text-primary" },
                        { label: "Statut", value: selectedMember.is_suspended ? "Suspendu" : "Actif", color: selectedMember.is_suspended ? "text-destructive" : "text-harvest-green" },
                        { label: "Filleuls directs", value: memberFilleuls.length, color: "text-gold" },
                        { label: "Commissions", value: `${totalCommissions(memberTransactions).toLocaleString("fr-FR")} F`, color: "text-harvest-green" },
                      ].map((item, i) => (
                        <div key={i} className="bg-secondary rounded-xl p-3 text-center">
                          <p className="text-xs text-muted-foreground font-body mb-1">{item.label}</p>
                          <p className={`text-sm font-bold font-heading capitalize ${item.color}`}>{item.value}</p>
                        </div>
                      ))}
                    </div>
                    <div className="grid md:grid-cols-2 gap-3 text-sm font-body">
                      <div className="bg-secondary/50 rounded-lg p-3 space-y-1.5">
                        <p><span className="text-muted-foreground">Ville :</span> <span className="font-semibold ml-1">{selectedMember.city || "—"}</span></p>
                        <p><span className="text-muted-foreground">Pays :</span> <span className="font-semibold ml-1">{selectedMember.country || "—"}</span></p>
                        <p><span className="text-muted-foreground">Téléphone :</span> <span className="font-semibold ml-1">{selectedMember.phone || "—"}</span></p>
                      </div>
                      <div className="bg-secondary/50 rounded-lg p-3 space-y-1.5">
                        <p><span className="text-muted-foreground">Carrière :</span> <span className="font-semibold ml-1 capitalize">{selectedMember.career_level?.replace(/_/g, " ")}</span></p>
                        <p><span className="text-muted-foreground">MLM :</span> <span className={`font-semibold ml-1 ${selectedMember.is_mlm_active ? "text-harvest-green" : "text-muted-foreground"}`}>{selectedMember.is_mlm_active ? "Actif ✓" : "Inactif"}</span></p>
                        <p><span className="text-muted-foreground">Inscription :</span> <span className="font-semibold ml-1">{new Date(selectedMember.created_at).toLocaleDateString("fr-FR")}</span></p>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === "transactions" && (
                  <div>
                    <p className="text-sm text-muted-foreground font-body mb-3">{memberTransactions.length} transaction(s)</p>
                    <div className="space-y-2">
                      {memberTransactions.map(tx => (
                        <div key={tx.id} className="flex items-center justify-between p-3 rounded-lg bg-secondary/30 border border-border/50">
                          <div>
                            <p className="text-sm font-semibold text-foreground font-body">{TYPE_LABELS[tx.type] || tx.type}</p>
                            <p className="text-xs text-muted-foreground">{new Date(tx.created_at).toLocaleDateString("fr-FR")} • {tx.description?.slice(0, 40) || "—"}</p>
                          </div>
                          <div className="text-right">
                            <p className={`text-sm font-bold ${["deposit","commission","bonus","admin_credit"].includes(tx.type) ? "text-harvest-green" : "text-destructive"}`}>
                              {["deposit","commission","bonus","admin_credit"].includes(tx.type) ? "+" : "-"}{Number(tx.amount).toLocaleString("fr-FR")} F
                            </p>
                            <span className={`text-xs px-1.5 py-0.5 rounded-full ${tx.status === "approved" ? "bg-harvest-green/20 text-harvest-green" : tx.status === "rejected" ? "bg-destructive/20 text-destructive" : "bg-gold/20 text-gold"}`}>
                              {tx.status === "approved" ? "✓" : tx.status === "rejected" ? "✗" : "⏳"}
                            </span>
                          </div>
                        </div>
                      ))}
                      {memberTransactions.length === 0 && <p className="text-center text-muted-foreground font-body py-8">Aucune transaction</p>}
                    </div>
                  </div>
                )}

                {activeTab === "filleuls" && (
                  <div>
                    <p className="text-sm text-muted-foreground font-body mb-3">{memberFilleuls.length} filleul(s) direct(s)</p>
                    <div className="space-y-2">
                      {memberFilleuls.map((f, i) => (
                        <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-secondary/30 border border-border/50">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                              {f.first_name.charAt(0)}{f.last_name.charAt(0)}
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-foreground font-body">{f.first_name} {f.last_name}</p>
                              <p className="text-xs text-muted-foreground">{f.city || "—"}, {f.country || "—"}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${f.is_mlm_active ? "bg-harvest-green/20 text-harvest-green" : "bg-muted text-muted-foreground"}`}>
                              {f.is_mlm_active ? "MLM actif" : "MLM inactif"}
                            </span>
                            <p className="text-xs text-muted-foreground mt-1">{new Date(f.created_at).toLocaleDateString("fr-FR")}</p>
                          </div>
                        </div>
                      ))}
                      {memberFilleuls.length === 0 && <p className="text-center text-muted-foreground font-body py-8">Aucun filleul direct</p>}
                    </div>
                  </div>
                )}

                {activeTab === "commandes" && (
                  <div>
                    <p className="text-sm text-muted-foreground font-body mb-3">{memberOrders.length} commande(s)</p>
                    <div className="space-y-2">
                      {memberOrders.map(order => (
                        <div key={order.id} className="flex items-center justify-between p-3 rounded-lg bg-secondary/30 border border-border/50">
                          <div>
                            <p className="text-sm font-semibold text-foreground font-body">Commande pack</p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(order.created_at).toLocaleDateString("fr-FR")}
                              {order.delivery_city && ` • ${order.delivery_city}`}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-bold text-primary">{Number(order.amount_paid).toLocaleString("fr-FR")} F</p>
                            <span className="text-xs px-1.5 py-0.5 rounded-full bg-secondary text-muted-foreground">{order.status}</span>
                          </div>
                        </div>
                      ))}
                      {memberOrders.length === 0 && <p className="text-center text-muted-foreground font-body py-8">Aucune commande</p>}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MoissonneurVille;
