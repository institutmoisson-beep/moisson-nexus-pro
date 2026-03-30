import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import logo from "@/assets/logo-moisson.png";
import {
  Users, Package, Building2, CreditCard, TrendingUp, Award,
  Settings, LogOut, ArrowLeft, Eye, Ban, CheckCircle, Wallet,
  Plus, Trash2, Edit
} from "lucide-react";

type AdminTab = "overview" | "users" | "packs" | "partners" | "transactions" | "payments" | "commissions" | "bonuses";

const AdminDashboard = () => {
  const { user, signOut, loading } = useAuth();
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);
  const [checkingRole, setCheckingRole] = useState(true);
  const [activeTab, setActiveTab] = useState<AdminTab>("overview");

  // Data states
  const [users, setUsers] = useState<any[]>([]);
  const [packs, setPacks] = useState<any[]>([]);
  const [partners, setPartners] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<any[]>([]);
  const [commissionLevels, setCommissionLevels] = useState<any[]>([]);
  const [careerBonuses, setCareerBonuses] = useState<any[]>([]);
  const [stats, setStats] = useState({ totalUsers: 0, totalDeposits: 0, totalWithdrawals: 0, pendingTransactions: 0 });

  useEffect(() => {
    if (!loading && !user) {
      navigate("/connexion");
      return;
    }
    if (user) {
      supabase.rpc("has_role", { _user_id: user.id, _role: "admin" }).then(({ data }) => {
        if (!data) {
          toast.error("Accès refusé");
          navigate("/dashboard");
        } else {
          setIsAdmin(true);
        }
        setCheckingRole(false);
      });
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (isAdmin) loadData();
  }, [isAdmin, activeTab]);

  const loadData = async () => {
    if (activeTab === "overview" || activeTab === "users") {
      const { data } = await supabase.from("profiles").select("*").order("created_at", { ascending: false });
      setUsers(data || []);
      const { count: tc } = await supabase.from("transactions").select("*", { count: "exact", head: true }).eq("status", "pending");
      setStats(s => ({ ...s, totalUsers: data?.length || 0, pendingTransactions: tc || 0 }));
    }
    if (activeTab === "overview" || activeTab === "packs") {
      const { data } = await supabase.from("packs").select("*, partner_companies(name)").order("created_at", { ascending: false });
      setPacks(data || []);
    }
    if (activeTab === "overview" || activeTab === "partners") {
      const { data } = await supabase.from("partner_companies").select("*").order("created_at", { ascending: false });
      setPartners(data || []);
    }
    if (activeTab === "overview" || activeTab === "transactions") {
      const { data } = await supabase.from("transactions").select("*").order("created_at", { ascending: false }).limit(100);
      setTransactions(data || []);
    }
    if (activeTab === "payments") {
      const { data } = await supabase.from("payment_methods").select("*").order("created_at", { ascending: false });
      setPaymentMethods(data || []);
    }
    if (activeTab === "commissions") {
      const { data } = await supabase.from("commission_levels").select("*").order("level_number");
      setCommissionLevels(data || []);
    }
    if (activeTab === "bonuses") {
      const { data } = await supabase.from("career_bonuses").select("*");
      setCareerBonuses(data || []);
    }
  };

  const toggleSuspend = async (profileId: string, currentStatus: boolean) => {
    await supabase.from("profiles").update({ is_suspended: !currentStatus }).eq("id", profileId);
    toast.success(currentStatus ? "Compte réactivé" : "Compte suspendu");
    loadData();
  };

  const handleTransaction = async (txId: string, action: "approved" | "rejected") => {
    const tx = transactions.find(t => t.id === txId);
    if (!tx) return;

    const { error } = await supabase.from("transactions").update({
      status: action,
      processed_at: new Date().toISOString(),
      processed_by: user!.id,
    }).eq("id", txId);

    if (error) { toast.error("Erreur"); return; }

    if (action === "approved") {
      const profile = users.find(u => u.user_id === tx.user_id);
      if (profile) {
        const newBalance = tx.type === "deposit"
          ? Number(profile.wallet_balance) + Number(tx.amount)
          : tx.type === "withdrawal"
            ? Number(profile.wallet_balance) - Number(tx.amount)
            : Number(profile.wallet_balance);
        await supabase.from("profiles").update({ wallet_balance: newBalance }).eq("user_id", tx.user_id);
      }
    }
    toast.success(action === "approved" ? "Transaction approuvée" : "Transaction rejetée");
    loadData();
  };

  const creditDebitUser = async (profileUserId: string, amount: number, type: "admin_credit" | "admin_debit", motif: string) => {
    const profile = users.find(u => u.user_id === profileUserId);
    if (!profile) return;
    const newBalance = type === "admin_credit"
      ? Number(profile.wallet_balance) + amount
      : Number(profile.wallet_balance) - amount;

    await supabase.from("profiles").update({ wallet_balance: newBalance }).eq("user_id", profileUserId);
    await supabase.from("transactions").insert({
      user_id: profileUserId,
      amount,
      type,
      status: "approved",
      description: motif,
      processed_at: new Date().toISOString(),
      processed_by: user!.id,
    });
    toast.success(type === "admin_credit" ? "Portefeuille crédité" : "Portefeuille débité");
    loadData();
  };

  if (loading || checkingRole || !isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground font-body">Vérification des droits...</div>
      </div>
    );
  }

  const tabs: { key: AdminTab; label: string; icon: React.ReactNode }[] = [
    { key: "overview", label: "Vue d'ensemble", icon: <TrendingUp className="w-4 h-4" /> },
    { key: "users", label: "Utilisateurs", icon: <Users className="w-4 h-4" /> },
    { key: "packs", label: "Packs", icon: <Package className="w-4 h-4" /> },
    { key: "partners", label: "Partenaires", icon: <Building2 className="w-4 h-4" /> },
    { key: "transactions", label: "Transactions", icon: <CreditCard className="w-4 h-4" /> },
    { key: "payments", label: "Moyens de paiement", icon: <Wallet className="w-4 h-4" /> },
    { key: "commissions", label: "Commissions", icon: <TrendingUp className="w-4 h-4" /> },
    { key: "bonuses", label: "Bonus carrière", icon: <Award className="w-4 h-4" /> },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card sticky top-0 z-50">
        <div className="container mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={logo} alt="Institut Moisson" className="w-8 h-8" width={32} height={32} />
            <span className="font-heading text-lg font-bold text-foreground">Admin Panel</span>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => navigate("/dashboard")} className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors font-body">
              <ArrowLeft className="w-4 h-4" /> Tableau de bord
            </button>
            <button onClick={async () => { await signOut(); navigate("/"); }} className="text-muted-foreground hover:text-foreground transition-colors">
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className="w-64 min-h-[calc(100vh-57px)] border-r border-border bg-card p-4 hidden md:block">
          <nav className="space-y-1">
            {tabs.map(tab => (
              <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-body transition-all ${
                  activeTab === tab.key ? "bg-primary text-primary-foreground font-semibold" : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                }`}>
                {tab.icon} {tab.label}
              </button>
            ))}
          </nav>
        </aside>

        {/* Mobile tabs */}
        <div className="md:hidden w-full overflow-x-auto border-b border-border bg-card">
          <div className="flex p-2 gap-1">
            {tabs.map(tab => (
              <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-body whitespace-nowrap transition-all ${
                  activeTab === tab.key ? "bg-primary text-primary-foreground font-semibold" : "text-muted-foreground hover:bg-secondary"
                }`}>
                {tab.icon} {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <main className="flex-1 p-6 md:p-8 overflow-auto">
          {activeTab === "overview" && <OverviewTab stats={stats} users={users} transactions={transactions} />}
          {activeTab === "users" && <UsersTab users={users} toggleSuspend={toggleSuspend} creditDebitUser={creditDebitUser} />}
          {activeTab === "transactions" && <TransactionsTab transactions={transactions} users={users} handleTransaction={handleTransaction} />}
          {activeTab === "packs" && <PacksTab packs={packs} partners={partners} reload={loadData} />}
          {activeTab === "partners" && <PartnersTab partners={partners} reload={loadData} />}
          {activeTab === "payments" && <PaymentMethodsTab methods={paymentMethods} reload={loadData} />}
          {activeTab === "commissions" && <CommissionsTab levels={commissionLevels} reload={loadData} />}
          {activeTab === "bonuses" && <BonusesTab bonuses={careerBonuses} reload={loadData} />}
        </main>
      </div>
    </div>
  );
};

/* ─── Overview ─── */
const OverviewTab = ({ stats, users, transactions }: any) => (
  <div>
    <h1 className="text-2xl font-heading font-bold text-foreground mb-6">Vue d'ensemble</h1>
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
      {[
        { label: "Utilisateurs", value: stats.totalUsers, icon: <Users className="w-5 h-5 text-primary" /> },
        { label: "En attente", value: stats.pendingTransactions, icon: <CreditCard className="w-5 h-5 text-gold" /> },
        { label: "Packs vendus", value: "—", icon: <Package className="w-5 h-5 text-harvest-green" /> },
        { label: "Commissions", value: "—", icon: <TrendingUp className="w-5 h-5 text-primary" /> },
      ].map((s, i) => (
        <div key={i} className="card-elevated">
          <div className="flex items-center gap-2 mb-2">{s.icon}<span className="text-xs text-muted-foreground font-body">{s.label}</span></div>
          <p className="text-xl font-heading font-bold text-foreground">{s.value}</p>
        </div>
      ))}
    </div>
    <h2 className="text-lg font-heading font-semibold text-foreground mb-3">Dernières transactions</h2>
    <div className="overflow-x-auto">
      <table className="w-full text-sm font-body">
        <thead><tr className="border-b border-border text-muted-foreground">
          <th className="text-left py-2 px-3">Date</th><th className="text-left py-2 px-3">Type</th>
          <th className="text-right py-2 px-3">Montant</th><th className="text-left py-2 px-3">Statut</th>
        </tr></thead>
        <tbody>
          {transactions.slice(0, 10).map((tx: any) => (
            <tr key={tx.id} className="border-b border-border/50">
              <td className="py-2 px-3">{new Date(tx.created_at).toLocaleDateString("fr-FR")}</td>
              <td className="py-2 px-3 capitalize">{tx.type.replace(/_/g, " ")}</td>
              <td className="py-2 px-3 text-right font-semibold">{Number(tx.amount).toLocaleString("fr-FR")} FCFA</td>
              <td className="py-2 px-3">
                <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                  tx.status === "approved" ? "bg-harvest-green/20 text-harvest-green" :
                  tx.status === "rejected" ? "bg-destructive/20 text-destructive" : "bg-gold/20 text-gold"
                }`}>{tx.status}</span>
              </td>
            </tr>
          ))}
          {transactions.length === 0 && <tr><td colSpan={4} className="py-8 text-center text-muted-foreground">Aucune transaction</td></tr>}
        </tbody>
      </table>
    </div>
  </div>
);

/* ─── Users ─── */
const UsersTab = ({ users, toggleSuspend, creditDebitUser }: any) => {
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [creditAmount, setCreditAmount] = useState("");
  const [creditMotif, setCreditMotif] = useState("");
  const [creditType, setCreditType] = useState<"admin_credit" | "admin_debit">("admin_credit");

  return (
    <div>
      <h1 className="text-2xl font-heading font-bold text-foreground mb-6">Gestion des utilisateurs</h1>
      <div className="overflow-x-auto">
        <table className="w-full text-sm font-body">
          <thead><tr className="border-b border-border text-muted-foreground">
            <th className="text-left py-2 px-3">Nom</th><th className="text-left py-2 px-3">Email</th>
            <th className="text-left py-2 px-3">Code</th><th className="text-right py-2 px-3">Solde</th>
            <th className="text-left py-2 px-3">Statut</th><th className="text-right py-2 px-3">Actions</th>
          </tr></thead>
          <tbody>
            {users.map((u: any) => (
              <tr key={u.id} className="border-b border-border/50">
                <td className="py-2 px-3 font-medium">{u.first_name} {u.last_name}</td>
                <td className="py-2 px-3">{u.email}</td>
                <td className="py-2 px-3 font-mono text-xs">{u.referral_code}</td>
                <td className="py-2 px-3 text-right font-semibold">{Number(u.wallet_balance).toLocaleString("fr-FR")} FCFA</td>
                <td className="py-2 px-3">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${u.is_suspended ? "bg-destructive/20 text-destructive" : "bg-harvest-green/20 text-harvest-green"}`}>
                    {u.is_suspended ? "Suspendu" : "Actif"}
                  </span>
                </td>
                <td className="py-2 px-3 text-right">
                  <div className="flex items-center justify-end gap-1">
                    <button onClick={() => setSelectedUser(selectedUser?.id === u.id ? null : u)} className="p-1.5 rounded-md hover:bg-secondary transition-colors" title="Détails">
                      <Eye className="w-4 h-4 text-muted-foreground" />
                    </button>
                    <button onClick={() => toggleSuspend(u.id, u.is_suspended)} className="p-1.5 rounded-md hover:bg-secondary transition-colors" title={u.is_suspended ? "Réactiver" : "Suspendre"}>
                      {u.is_suspended ? <CheckCircle className="w-4 h-4 text-harvest-green" /> : <Ban className="w-4 h-4 text-destructive" />}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selectedUser && (
        <div className="mt-6 card-elevated">
          <h3 className="font-heading font-semibold text-foreground mb-4">
            Détails — {selectedUser.first_name} {selectedUser.last_name}
          </h3>
          <div className="grid md:grid-cols-2 gap-4 text-sm font-body mb-6">
            <div><span className="text-muted-foreground">Email:</span> <span className="font-medium">{selectedUser.email}</span></div>
            <div><span className="text-muted-foreground">Téléphone:</span> <span className="font-medium">{selectedUser.phone || "—"}</span></div>
            <div><span className="text-muted-foreground">Pays:</span> <span className="font-medium">{selectedUser.country || "—"}</span></div>
            <div><span className="text-muted-foreground">Code parrainage:</span> <span className="font-mono font-medium">{selectedUser.referral_code}</span></div>
            <div><span className="text-muted-foreground">Niveau de carrière:</span> <span className="font-medium capitalize">{selectedUser.career_level.replace(/_/g, " ")}</span></div>
            <div><span className="text-muted-foreground">MLM actif:</span> <span className="font-medium">{selectedUser.is_mlm_active ? "Oui" : "Non"}</span></div>
            <div><span className="text-muted-foreground">Solde:</span> <span className="font-bold text-primary">{Number(selectedUser.wallet_balance).toLocaleString("fr-FR")} FCFA</span></div>
            <div><span className="text-muted-foreground">Inscrit le:</span> <span className="font-medium">{new Date(selectedUser.created_at).toLocaleDateString("fr-FR")}</span></div>
          </div>

          <div className="border-t border-border pt-4">
            <h4 className="font-heading font-semibold text-foreground mb-3">Créditer / Débiter le portefeuille</h4>
            <div className="flex flex-wrap gap-3 items-end">
              <select value={creditType} onChange={e => setCreditType(e.target.value as any)}
                className="px-3 py-2 rounded-lg border border-input bg-background text-foreground font-body text-sm">
                <option value="admin_credit">Créditer</option>
                <option value="admin_debit">Débiter</option>
              </select>
              <input type="number" placeholder="Montant" value={creditAmount} onChange={e => setCreditAmount(e.target.value)}
                className="px-3 py-2 rounded-lg border border-input bg-background text-foreground font-body text-sm w-32" />
              <input type="text" placeholder="Motif" value={creditMotif} onChange={e => setCreditMotif(e.target.value)}
                className="px-3 py-2 rounded-lg border border-input bg-background text-foreground font-body text-sm flex-1 min-w-[150px]" />
              <button onClick={() => {
                if (!creditAmount || !creditMotif) { toast.error("Remplissez tous les champs"); return; }
                creditDebitUser(selectedUser.user_id, Number(creditAmount), creditType, creditMotif);
                setCreditAmount(""); setCreditMotif("");
              }} className="btn-hero !text-sm !py-2 !px-4">
                Valider
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

/* ─── Transactions ─── */
const TransactionsTab = ({ transactions, users, handleTransaction }: any) => {
  const getUserName = (userId: string) => {
    const u = users.find((p: any) => p.user_id === userId);
    return u ? `${u.first_name} ${u.last_name}` : userId.slice(0, 8);
  };

  return (
    <div>
      <h1 className="text-2xl font-heading font-bold text-foreground mb-6">Transactions</h1>
      <div className="overflow-x-auto">
        <table className="w-full text-sm font-body">
          <thead><tr className="border-b border-border text-muted-foreground">
            <th className="text-left py-2 px-3">Date</th><th className="text-left py-2 px-3">Utilisateur</th>
            <th className="text-left py-2 px-3">Type</th><th className="text-right py-2 px-3">Montant</th>
            <th className="text-left py-2 px-3">Contact</th><th className="text-left py-2 px-3">Statut</th>
            <th className="text-right py-2 px-3">Actions</th>
          </tr></thead>
          <tbody>
            {transactions.map((tx: any) => (
              <tr key={tx.id} className="border-b border-border/50">
                <td className="py-2 px-3">{new Date(tx.created_at).toLocaleDateString("fr-FR")}</td>
                <td className="py-2 px-3">{getUserName(tx.user_id)}</td>
                <td className="py-2 px-3 capitalize">{tx.type.replace(/_/g, " ")}</td>
                <td className="py-2 px-3 text-right font-semibold">{Number(tx.amount).toLocaleString("fr-FR")} FCFA</td>
                <td className="py-2 px-3 text-xs">{tx.transaction_contact || "—"}</td>
                <td className="py-2 px-3">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                    tx.status === "approved" ? "bg-harvest-green/20 text-harvest-green" :
                    tx.status === "rejected" ? "bg-destructive/20 text-destructive" : "bg-gold/20 text-gold"
                  }`}>{tx.status}</span>
                </td>
                <td className="py-2 px-3 text-right">
                  {tx.status === "pending" && (
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => handleTransaction(tx.id, "approved")} className="p-1.5 rounded-md bg-harvest-green/10 hover:bg-harvest-green/20 transition-colors" title="Approuver">
                        <CheckCircle className="w-4 h-4 text-harvest-green" />
                      </button>
                      <button onClick={() => handleTransaction(tx.id, "rejected")} className="p-1.5 rounded-md bg-destructive/10 hover:bg-destructive/20 transition-colors" title="Rejeter">
                        <Ban className="w-4 h-4 text-destructive" />
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
            {transactions.length === 0 && <tr><td colSpan={7} className="py-8 text-center text-muted-foreground">Aucune transaction</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
};

/* ─── Packs ─── */
const PacksTab = ({ packs, partners, reload }: any) => {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", price: "", commission_percentage: "10", description: "", physical_prizes: "", partner_company_id: "" });

  const handleCreate = async () => {
    const { error } = await supabase.from("packs").insert({
      name: form.name,
      price: Number(form.price),
      commission_percentage: Number(form.commission_percentage),
      description: form.description,
      physical_prizes: form.physical_prizes,
      partner_company_id: form.partner_company_id || null,
    });
    if (error) { toast.error("Erreur: " + error.message); return; }
    toast.success("Pack créé !");
    setShowForm(false);
    setForm({ name: "", price: "", commission_percentage: "10", description: "", physical_prizes: "", partner_company_id: "" });
    reload();
  };

  const deletePack = async (id: string) => {
    await supabase.from("packs").update({ is_active: false }).eq("id", id);
    toast.success("Pack désactivé");
    reload();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-heading font-bold text-foreground">Packs d'activation</h1>
        <button onClick={() => setShowForm(!showForm)} className="btn-hero !text-sm !py-2 !px-4">
          <Plus className="w-4 h-4 mr-1" /> Ajouter
        </button>
      </div>

      {showForm && (
        <div className="card-elevated mb-6 space-y-3">
          <input placeholder="Nom du pack" value={form.name} onChange={e => setForm({...form, name: e.target.value})}
            className="w-full px-3 py-2 rounded-lg border border-input bg-background text-foreground font-body text-sm" />
          <div className="grid grid-cols-2 gap-3">
            <input placeholder="Prix (FCFA)" type="number" value={form.price} onChange={e => setForm({...form, price: e.target.value})}
              className="px-3 py-2 rounded-lg border border-input bg-background text-foreground font-body text-sm" />
            <input placeholder="Commission %" type="number" value={form.commission_percentage} onChange={e => setForm({...form, commission_percentage: e.target.value})}
              className="px-3 py-2 rounded-lg border border-input bg-background text-foreground font-body text-sm" />
          </div>
          <textarea placeholder="Description" value={form.description} onChange={e => setForm({...form, description: e.target.value})}
            className="w-full px-3 py-2 rounded-lg border border-input bg-background text-foreground font-body text-sm" rows={2} />
          <input placeholder="Prix physiques" value={form.physical_prizes} onChange={e => setForm({...form, physical_prizes: e.target.value})}
            className="w-full px-3 py-2 rounded-lg border border-input bg-background text-foreground font-body text-sm" />
          <select value={form.partner_company_id} onChange={e => setForm({...form, partner_company_id: e.target.value})}
            className="w-full px-3 py-2 rounded-lg border border-input bg-background text-foreground font-body text-sm">
            <option value="">Entreprise partenaire (optionnel)</option>
            {partners.map((p: any) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          <button onClick={handleCreate} className="btn-gold !text-sm !py-2">Créer le pack</button>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-4">
        {packs.map((p: any) => (
          <div key={p.id} className={`card-elevated ${!p.is_active ? "opacity-50" : ""}`}>
            <div className="flex justify-between items-start mb-2">
              <h3 className="font-heading font-semibold text-foreground">{p.name}</h3>
              <button onClick={() => deletePack(p.id)} className="p-1 text-destructive hover:bg-destructive/10 rounded"><Trash2 className="w-4 h-4" /></button>
            </div>
            <p className="text-xl font-bold text-primary mb-1">{Number(p.price).toLocaleString("fr-FR")} FCFA</p>
            <p className="text-xs text-muted-foreground font-body">Commission: {p.commission_percentage}%</p>
            {p.description && <p className="text-sm text-muted-foreground font-body mt-2">{p.description}</p>}
            {p.partner_companies?.name && <p className="text-xs text-muted-foreground font-body mt-1">Partenaire: {p.partner_companies.name}</p>}
          </div>
        ))}
        {packs.length === 0 && <p className="text-muted-foreground font-body col-span-2 text-center py-8">Aucun pack créé</p>}
      </div>
    </div>
  );
};

/* ─── Partners ─── */
const PartnersTab = ({ partners, reload }: any) => {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", description: "", website: "", whatsapp: "", facebook: "", email: "", phone: "" });

  const handleCreate = async () => {
    const { error } = await supabase.from("partner_companies").insert(form);
    if (error) { toast.error("Erreur"); return; }
    toast.success("Partenaire ajouté !");
    setShowForm(false);
    setForm({ name: "", description: "", website: "", whatsapp: "", facebook: "", email: "", phone: "" });
    reload();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-heading font-bold text-foreground">Entreprises partenaires</h1>
        <button onClick={() => setShowForm(!showForm)} className="btn-hero !text-sm !py-2 !px-4">
          <Plus className="w-4 h-4 mr-1" /> Ajouter
        </button>
      </div>

      {showForm && (
        <div className="card-elevated mb-6 space-y-3">
          <input placeholder="Nom de l'entreprise" value={form.name} onChange={e => setForm({...form, name: e.target.value})}
            className="w-full px-3 py-2 rounded-lg border border-input bg-background text-foreground font-body text-sm" />
          <textarea placeholder="Description" value={form.description} onChange={e => setForm({...form, description: e.target.value})}
            className="w-full px-3 py-2 rounded-lg border border-input bg-background text-foreground font-body text-sm" rows={2} />
          <div className="grid grid-cols-2 gap-3">
            <input placeholder="Site web" value={form.website} onChange={e => setForm({...form, website: e.target.value})}
              className="px-3 py-2 rounded-lg border border-input bg-background text-foreground font-body text-sm" />
            <input placeholder="WhatsApp" value={form.whatsapp} onChange={e => setForm({...form, whatsapp: e.target.value})}
              className="px-3 py-2 rounded-lg border border-input bg-background text-foreground font-body text-sm" />
            <input placeholder="Facebook" value={form.facebook} onChange={e => setForm({...form, facebook: e.target.value})}
              className="px-3 py-2 rounded-lg border border-input bg-background text-foreground font-body text-sm" />
            <input placeholder="Email" value={form.email} onChange={e => setForm({...form, email: e.target.value})}
              className="px-3 py-2 rounded-lg border border-input bg-background text-foreground font-body text-sm" />
            <input placeholder="Téléphone" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})}
              className="px-3 py-2 rounded-lg border border-input bg-background text-foreground font-body text-sm" />
          </div>
          <button onClick={handleCreate} className="btn-gold !text-sm !py-2">Ajouter l'entreprise</button>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-4">
        {partners.map((p: any) => (
          <div key={p.id} className={`card-elevated ${!p.is_active ? "opacity-50" : ""}`}>
            <h3 className="font-heading font-semibold text-foreground mb-1">{p.name}</h3>
            {p.description && <p className="text-sm text-muted-foreground font-body mb-2">{p.description}</p>}
            <div className="text-xs text-muted-foreground font-body space-y-0.5">
              {p.website && <p>🌐 {p.website}</p>}
              {p.whatsapp && <p>💬 {p.whatsapp}</p>}
              {p.email && <p>📧 {p.email}</p>}
            </div>
          </div>
        ))}
        {partners.length === 0 && <p className="text-muted-foreground font-body col-span-2 text-center py-8">Aucun partenaire</p>}
      </div>
    </div>
  );
};

/* ─── Payment Methods ─── */
const PaymentMethodsTab = ({ methods, reload }: any) => {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", type: "mobile_money", details: "" });

  const handleCreate = async () => {
    let parsedDetails = {};
    try { parsedDetails = JSON.parse(form.details || "{}"); } catch { parsedDetails = { info: form.details }; }
    const { error } = await supabase.from("payment_methods").insert({
      name: form.name, type: form.type, details: parsedDetails,
    });
    if (error) { toast.error("Erreur"); return; }
    toast.success("Moyen de paiement ajouté !");
    setShowForm(false);
    setForm({ name: "", type: "mobile_money", details: "" });
    reload();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-heading font-bold text-foreground">Moyens de paiement</h1>
        <button onClick={() => setShowForm(!showForm)} className="btn-hero !text-sm !py-2 !px-4">
          <Plus className="w-4 h-4 mr-1" /> Ajouter
        </button>
      </div>

      {showForm && (
        <div className="card-elevated mb-6 space-y-3">
          <input placeholder="Nom (ex: Orange Money CI)" value={form.name} onChange={e => setForm({...form, name: e.target.value})}
            className="w-full px-3 py-2 rounded-lg border border-input bg-background text-foreground font-body text-sm" />
          <select value={form.type} onChange={e => setForm({...form, type: e.target.value})}
            className="w-full px-3 py-2 rounded-lg border border-input bg-background text-foreground font-body text-sm">
            <option value="mobile_money">Mobile Money</option>
            <option value="crypto">Cryptomonnaie</option>
            <option value="paypal">PayPal</option>
            <option value="bank">Virement bancaire</option>
            <option value="other">Autre</option>
          </select>
          <textarea placeholder='Détails (contact, adresse crypto, email PayPal, lien...)' value={form.details} onChange={e => setForm({...form, details: e.target.value})}
            className="w-full px-3 py-2 rounded-lg border border-input bg-background text-foreground font-body text-sm" rows={3} />
          <button onClick={handleCreate} className="btn-gold !text-sm !py-2">Ajouter</button>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-4">
        {methods.map((m: any) => (
          <div key={m.id} className={`card-elevated ${!m.is_active ? "opacity-50" : ""}`}>
            <h3 className="font-heading font-semibold text-foreground mb-1">{m.name}</h3>
            <p className="text-xs text-muted-foreground font-body capitalize mb-2">{m.type.replace(/_/g, " ")}</p>
            <pre className="text-xs bg-secondary rounded p-2 overflow-auto">{JSON.stringify(m.details, null, 2)}</pre>
          </div>
        ))}
        {methods.length === 0 && <p className="text-muted-foreground font-body col-span-2 text-center py-8">Aucun moyen configuré</p>}
      </div>
    </div>
  );
};

/* ─── Commissions ─── */
const CommissionsTab = ({ levels, reload }: any) => {
  const [form, setForm] = useState({ level_number: "", percentage: "", description: "" });

  const handleCreate = async () => {
    const { error } = await supabase.from("commission_levels").insert({
      level_number: Number(form.level_number),
      percentage: Number(form.percentage),
      description: form.description,
    });
    if (error) { toast.error("Erreur: " + error.message); return; }
    toast.success("Niveau de commission ajouté !");
    setForm({ level_number: "", percentage: "", description: "" });
    reload();
  };

  return (
    <div>
      <h1 className="text-2xl font-heading font-bold text-foreground mb-6">Niveaux de commission</h1>
      <div className="card-elevated mb-6 space-y-3">
        <div className="grid grid-cols-3 gap-3">
          <input placeholder="Niveau" type="number" value={form.level_number} onChange={e => setForm({...form, level_number: e.target.value})}
            className="px-3 py-2 rounded-lg border border-input bg-background text-foreground font-body text-sm" />
          <input placeholder="Pourcentage" type="number" step="0.1" value={form.percentage} onChange={e => setForm({...form, percentage: e.target.value})}
            className="px-3 py-2 rounded-lg border border-input bg-background text-foreground font-body text-sm" />
          <input placeholder="Description" value={form.description} onChange={e => setForm({...form, description: e.target.value})}
            className="px-3 py-2 rounded-lg border border-input bg-background text-foreground font-body text-sm" />
        </div>
        <button onClick={handleCreate} className="btn-gold !text-sm !py-2">Ajouter</button>
      </div>
      <table className="w-full text-sm font-body">
        <thead><tr className="border-b border-border text-muted-foreground">
          <th className="text-left py-2 px-3">Niveau</th><th className="text-right py-2 px-3">Pourcentage</th><th className="text-left py-2 px-3">Description</th>
        </tr></thead>
        <tbody>
          {levels.map((l: any) => (
            <tr key={l.id} className="border-b border-border/50">
              <td className="py-2 px-3 font-bold">Niveau {l.level_number}</td>
              <td className="py-2 px-3 text-right font-semibold text-primary">{l.percentage}%</td>
              <td className="py-2 px-3">{l.description || "—"}</td>
            </tr>
          ))}
          {levels.length === 0 && <tr><td colSpan={3} className="py-8 text-center text-muted-foreground">Aucun niveau configuré</td></tr>}
        </tbody>
      </table>
    </div>
  );
};

/* ─── Career Bonuses ─── */
const BonusesTab = ({ bonuses, reload }: any) => (
  <div>
    <h1 className="text-2xl font-heading font-bold text-foreground mb-6">Bonus de carrière</h1>
    <table className="w-full text-sm font-body">
      <thead><tr className="border-b border-border text-muted-foreground">
        <th className="text-left py-2 px-3">Profil</th><th className="text-right py-2 px-3">Bonus</th>
        <th className="text-right py-2 px-3">Mensuel</th><th className="text-left py-2 px-3">Conditions</th>
      </tr></thead>
      <tbody>
        {bonuses.map((b: any) => (
          <tr key={b.id} className="border-b border-border/50">
            <td className="py-2 px-3 font-semibold capitalize">{b.career_level.replace(/_/g, " ")}</td>
            <td className="py-2 px-3 text-right font-bold text-primary">{Number(b.bonus_amount).toLocaleString("fr-FR")} FCFA</td>
            <td className="py-2 px-3 text-right">{Number(b.monthly_bonus).toLocaleString("fr-FR")} FCFA</td>
            <td className="py-2 px-3 text-xs">{b.requirements || "—"}</td>
          </tr>
        ))}
        {bonuses.length === 0 && <tr><td colSpan={4} className="py-8 text-center text-muted-foreground">Aucun bonus configuré</td></tr>}
      </tbody>
    </table>
  </div>
);

export default AdminDashboard;
