import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Briefcase, CheckCircle, Clock, Truck, Package, X,
  RefreshCw, Search, Settings, Save, TrendingUp, Users,
  Coins, Eye, ChevronDown
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const STATUS_CONFIG: Record<string, { label: string; color: string; next?: string; nextLabel?: string }> = {
  pending:    { label: "En attente",    color: "bg-gold/20 text-gold",               next: "processing", nextLabel: "Prendre en charge" },
  processing: { label: "En traitement", color: "bg-primary/20 text-primary",         next: "delivering",  nextLabel: "Mettre en livraison" },
  delivering: { label: "En livraison",  color: "bg-blue-500/20 text-blue-500",       next: "completed",   nextLabel: "Marquer livré ✓" },
  completed:  { label: "Livré ✓",       color: "bg-harvest-green/20 text-harvest-green" },
  cancelled:  { label: "Annulé",        color: "bg-destructive/20 text-destructive" },
};

const AdminPorteurAffaires = () => {
  const { user } = useAuth();
  const [orders, setOrders] = useState<any[]>([]);
  const [profiles, setProfiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("");
  const [search, setSearch] = useState("");
  const [processing, setProcessing] = useState<string | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<"orders" | "config">("orders");

  // Config
  const [bonusPercent, setBonusPercent] = useState("3");
  const [savingConfig, setSavingConfig] = useState(false);
  const [currentBonus, setCurrentBonus] = useState(3);

  // Stats
  const [stats, setStats] = useState({ total: 0, pending: 0, delivering: 0, completed: 0, totalBonusPaid: 0, totalRevenue: 0 });

  useEffect(() => { loadAll(); }, []);

  const loadAll = async () => {
    setLoading(true);
    const [ordersRes, profilesRes, cfgRes] = await Promise.all([
      (supabase as any).from("business_orders").select("*").order("created_at", { ascending: false }),
      supabase.from("profiles").select("user_id, first_name, last_name, email, wallet_balance"),
      supabase.from("mlm_config").select("*").eq("key", "business_bonus_percent").single(),
    ]);
    const ords = ordersRes.data || [];
    setOrders(ords);
    setProfiles(profilesRes.data || []);
    const rate = Number((cfgRes.data as any)?.value) || 3;
    setCurrentBonus(rate);
    setBonusPercent(String(rate));

    setStats({
      total: ords.length,
      pending: ords.filter((o: any) => o.status === "pending").length,
      delivering: ords.filter((o: any) => o.status === "delivering").length,
      completed: ords.filter((o: any) => o.status === "completed").length,
      totalBonusPaid: ords.filter((o: any) => o.bonus_paid).reduce((s: number, o: any) => s + Number(o.bonus_amount || 0), 0),
      totalRevenue: ords.filter((o: any) => o.status === "completed").reduce((s: number, o: any) => s + Number(o.total_amount || 0), 0),
    });
    setLoading(false);
  };

  const getUserName = (userId: string) => {
    const p = profiles.find(pr => pr.user_id === userId);
    return p ? `${p.first_name} ${p.last_name}` : userId.slice(0, 8) + "…";
  };

  const getUserEmail = (userId: string) => profiles.find(p => p.user_id === userId)?.email || "—";

  const handleAdvanceStatus = async (order: any) => {
    const cfg = STATUS_CONFIG[order.status];
    if (!cfg.next) return;

    setProcessing(order.id);

    const nextStatus = cfg.next;
    const isCompleting = nextStatus === "completed";

    const bonusAmount = isCompleting
      ? Math.round(Number(order.total_amount) * (order.bonus_percent || currentBonus) / 100)
      : 0;

    // Update order status
    const { error } = await (supabase as any)
      .from("business_orders")
      .update({
        status: nextStatus,
        ...(isCompleting ? {
          bonus_amount: bonusAmount,
          bonus_paid: true,
          completed_at: new Date().toISOString(),
          processed_by: user!.id,
        } : {}),
      })
      .eq("id", order.id);

    if (error) { toast.error("Erreur: " + error.message); setProcessing(null); return; }

    // If completing, credit the agent's wallet
    if (isCompleting && bonusAmount > 0) {
      const agentProfile = profiles.find(p => p.user_id === order.user_id);
      if (agentProfile) {
        const newBalance = Number(agentProfile.wallet_balance) + bonusAmount;
        await supabase.from("profiles").update({ wallet_balance: newBalance }).eq("user_id", order.user_id);
        await supabase.from("transactions").insert({
          user_id: order.user_id,
          amount: bonusAmount,
          type: "commission" as const,
          status: "approved" as const,
          description: `Bonus Porteur d'Affaires — Commande #${order.id.slice(0, 8).toUpperCase()} (${order.product_description?.slice(0, 30)})`,
          processed_at: new Date().toISOString(),
          processed_by: user!.id,
          metadata: { order_id: order.id, bonus_percent: order.bonus_percent || currentBonus, total_amount: order.total_amount },
        });
      }
      toast.success(`✅ Livraison confirmée ! +${bonusAmount.toLocaleString("fr-FR")} FCFA versé à ${getUserName(order.user_id)}`);
    } else {
      toast.success(`Statut mis à jour : ${STATUS_CONFIG[nextStatus].label}`);
    }

    setProcessing(null);
    await loadAll();
    if (selectedOrder?.id === order.id) {
      setSelectedOrder({ ...order, status: nextStatus, bonus_amount: bonusAmount, bonus_paid: isCompleting });
    }
  };

  const handleCancel = async (orderId: string) => {
    if (!confirm("Annuler cette commande ?")) return;
    await (supabase as any).from("business_orders").update({ status: "cancelled" }).eq("id", orderId);
    toast.success("Commande annulée");
    loadAll();
  };

  const saveConfig = async () => {
    const val = Number(bonusPercent);
    if (!val || val <= 0 || val > 50) { toast.error("Taux invalide (1–50%)"); return; }
    setSavingConfig(true);
    const { data: existing } = await supabase.from("mlm_config").select("id").eq("key", "business_bonus_percent").single();
    if (existing) {
      await supabase.from("mlm_config").update({ value: val as any }).eq("key", "business_bonus_percent");
    } else {
      await supabase.from("mlm_config").insert({ key: "business_bonus_percent", value: val as any });
    }
    setCurrentBonus(val);
    setSavingConfig(false);
    toast.success(`✅ Taux de bonus mis à jour : ${val}%`);
  };

  const filtered = orders.filter(o => {
    const matchStatus = !filterStatus || o.status === filterStatus;
    const q = search.toLowerCase();
    const matchSearch = !q || `${o.customer_name} ${o.product_description} ${getUserName(o.user_id)}`.toLowerCase().includes(q);
    return matchStatus && matchSearch;
  });

  if (loading) return <div className="animate-pulse text-muted-foreground font-body">Chargement…</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-2">
        <div>
          <h1 className="text-2xl font-heading font-bold text-foreground flex items-center gap-2">
            <Briefcase className="w-6 h-6 text-primary" /> Porteurs d'Affaires
          </h1>
          <p className="text-sm text-muted-foreground font-body mt-0.5">
            Gérez les commandes soumises par les agents de terrain
          </p>
        </div>
        <button onClick={loadAll} className="p-2 rounded-lg bg-secondary hover:bg-muted transition-colors">
          <RefreshCw className="w-4 h-4 text-muted-foreground" />
        </button>
      </div>

      {/* STATS */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { label: "Total",           value: stats.total,                                  color: "text-foreground" },
          { label: "En attente",      value: stats.pending,                                color: "text-gold" },
          { label: "En livraison",    value: stats.delivering,                             color: "text-blue-500" },
          { label: "Livrées",         value: stats.completed,                              color: "text-harvest-green" },
          { label: "Bonus versés",    value: `${stats.totalBonusPaid.toLocaleString("fr-FR")} F`, color: "text-gold" },
          { label: "CA livré",        value: `${stats.totalRevenue.toLocaleString("fr-FR")} F`,   color: "text-primary" },
        ].map((s, i) => (
          <div key={i} className="card-elevated p-3 text-center">
            <p className={`text-lg font-heading font-bold ${s.color}`}>{s.value}</p>
            <p className="text-[10px] text-muted-foreground font-body">{s.label}</p>
          </div>
        ))}
      </div>

      {/* TABS */}
      <div className="flex gap-1 bg-secondary p-1 rounded-xl w-fit">
        <button onClick={() => setActiveTab("orders")}
          className={`px-4 py-2 rounded-lg text-sm font-body font-semibold transition-all ${activeTab === "orders" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"}`}>
          📦 Commandes ({orders.length})
        </button>
        <button onClick={() => setActiveTab("config")}
          className={`px-4 py-2 rounded-lg text-sm font-body font-semibold transition-all ${activeTab === "config" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"}`}>
          ⚙️ Configuration
        </button>
      </div>

      {/* ── ORDERS TAB ── */}
      {activeTab === "orders" && (
        <>
          {/* FILTERS */}
          <div className="flex flex-wrap gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input placeholder="Client, produit, agent…" value={search} onChange={e => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-lg border border-input bg-background text-foreground font-body text-sm" />
            </div>
            <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
              className="px-3 py-2 rounded-lg border border-input bg-background text-foreground font-body text-sm">
              <option value="">Tous les statuts</option>
              {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
                <option key={key} value={key}>{cfg.label}</option>
              ))}
            </select>
            <span className="text-xs text-muted-foreground font-body self-center">{filtered.length} commande(s)</span>
          </div>

          {/* TABLE */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm font-body">
              <thead>
                <tr className="border-b border-border text-muted-foreground">
                  <th className="text-left py-2 px-3">Date</th>
                  <th className="text-left py-2 px-3">Agent</th>
                  <th className="text-left py-2 px-3">Client</th>
                  <th className="text-left py-2 px-3">Produit</th>
                  <th className="text-right py-2 px-3">Montant</th>
                  <th className="text-right py-2 px-3">Bonus agent</th>
                  <th className="text-center py-2 px-3">Statut</th>
                  <th className="text-right py-2 px-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(order => {
                  const cfg = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending;
                  const bonus = order.status === "completed"
                    ? Number(order.bonus_amount || 0)
                    : Math.round(Number(order.total_amount) * (order.bonus_percent || currentBonus) / 100);
                  return (
                    <tr key={order.id} className="border-b border-border/50 hover:bg-secondary/20 transition-colors">
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <span className="text-xs">{new Date(order.created_at).toLocaleDateString("fr-FR")}</span>
                        <span className="block text-[10px] text-muted-foreground">
                          {new Date(order.created_at).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 font-medium">{getUserName(order.user_id)}</td>
                      <td className="py-2.5 px-3">
                        <span className="font-medium">{order.customer_name}</span>
                        <span className="block text-[10px] text-muted-foreground">{order.customer_phone}</span>
                      </td>
                      <td className="py-2.5 px-3 max-w-[160px]">
                        <span className="text-xs truncate block">{order.product_description}</span>
                        <span className="text-[10px] text-muted-foreground">Qté: {order.quantity}</span>
                      </td>
                      <td className="py-2.5 px-3 text-right font-semibold text-primary whitespace-nowrap">
                        {Number(order.total_amount).toLocaleString("fr-FR")} F
                      </td>
                      <td className="py-2.5 px-3 text-right whitespace-nowrap">
                        <span className={order.bonus_paid ? "font-bold text-gold" : "text-muted-foreground"}>
                          {order.bonus_paid ? "+" : "~"}{bonus.toLocaleString("fr-FR")} F
                        </span>
                        {order.bonus_paid && <span className="block text-[10px] text-harvest-green">versé ✓</span>}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${cfg.color}`}>{cfg.label}</span>
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={() => setSelectedOrder(order)}
                            className="p-1.5 rounded-md hover:bg-secondary transition-colors" title="Détails">
                            <Eye className="w-4 h-4 text-primary" />
                          </button>
                          {cfg.next && (
                            <button
                              onClick={() => handleAdvanceStatus(order)}
                              disabled={processing === order.id}
                              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold font-body transition-colors disabled:opacity-50 ${
                                cfg.next === "completed"
                                  ? "bg-harvest-green/10 text-harvest-green hover:bg-harvest-green/20"
                                  : "bg-primary/10 text-primary hover:bg-primary/20"
                              }`}
                            >
                              {processing === order.id
                                ? <div className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin" />
                                : cfg.next === "completed" ? <CheckCircle className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />
                              }
                              {cfg.nextLabel}
                            </button>
                          )}
                          {order.status !== "completed" && order.status !== "cancelled" && (
                            <button onClick={() => handleCancel(order.id)}
                              className="p-1.5 rounded-md hover:bg-destructive/10 transition-colors" title="Annuler">
                              <X className="w-4 h-4 text-destructive" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-muted-foreground font-body">
                      Aucune commande trouvée
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* ── CONFIG TAB ── */}
      {activeTab === "config" && (
        <div className="max-w-md space-y-6">
          <div className="card-elevated border-primary/20">
            <h2 className="font-heading font-bold text-foreground flex items-center gap-2 mb-4">
              <Settings className="w-5 h-5 text-primary" /> Taux de Bonus Agent
            </h2>
            <p className="text-sm text-muted-foreground font-body mb-4">
              Ce pourcentage est automatiquement versé dans le portefeuille de l'agent
              lorsqu'une commande est marquée <strong className="text-foreground">"Livré"</strong>.
            </p>
            <div className="bg-secondary/50 rounded-xl p-4 mb-4">
              <p className="text-xs text-muted-foreground font-body mb-1">Taux actuel</p>
              <p className="text-3xl font-heading font-bold text-primary">{currentBonus}%</p>
              <p className="text-xs text-muted-foreground font-body mt-1">
                Ex : commande 100 000 FCFA → bonus de {(100000 * currentBonus / 100).toLocaleString("fr-FR")} FCFA
              </p>
            </div>
            <div className="flex items-end gap-3">
              <div className="flex-1">
                <label className="text-xs font-body text-muted-foreground block mb-1.5">Nouveau taux (%)</label>
                <input type="number" min="0.5" max="50" step="0.5" value={bonusPercent}
                  onChange={e => setBonusPercent(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-lg border border-input bg-background text-foreground font-body text-sm"
                  placeholder="Ex: 3" />
              </div>
              <button onClick={saveConfig} disabled={savingConfig}
                className="btn-gold !text-sm !py-2.5 !px-4 flex items-center gap-2 disabled:opacity-50">
                <Save className="w-4 h-4" /> {savingConfig ? "…" : "Sauver"}
              </button>
            </div>
          </div>

          <div className="card-elevated">
            <h2 className="font-heading font-bold text-foreground mb-3 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-harvest-green" /> Simulation de bonus
            </h2>
            <div className="space-y-2">
              {[10000, 50000, 100000, 500000, 1000000].map(amount => (
                <div key={amount} className="flex justify-between items-center py-2 border-b border-border/50 text-sm font-body">
                  <span className="text-muted-foreground">{amount.toLocaleString("fr-FR")} FCFA</span>
                  <span className="font-bold text-gold">+{Math.round(amount * Number(bonusPercent) / 100).toLocaleString("fr-FR")} FCFA</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── ORDER DETAIL MODAL ── */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-foreground/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
          onClick={() => setSelectedOrder(null)}>
          <div className="bg-card rounded-2xl border border-border w-full max-w-md shadow-2xl"
            onClick={e => e.stopPropagation()}>
            <div className="p-5 border-b border-border flex items-center justify-between">
              <h3 className="font-heading font-bold text-foreground">Détails de la commande</h3>
              <button onClick={() => setSelectedOrder(null)} className="p-1.5 rounded-lg hover:bg-secondary">
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm font-body">
                <div className="bg-secondary rounded-lg p-3">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1">Agent</p>
                  <p className="font-semibold text-foreground">{getUserName(selectedOrder.user_id)}</p>
                  <p className="text-xs text-muted-foreground">{getUserEmail(selectedOrder.user_id)}</p>
                </div>
                <div className="bg-secondary rounded-lg p-3">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1">Statut</p>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${STATUS_CONFIG[selectedOrder.status]?.color}`}>
                    {STATUS_CONFIG[selectedOrder.status]?.label}
                  </span>
                </div>
                <div className="bg-secondary rounded-lg p-3">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1">Client</p>
                  <p className="font-semibold text-foreground">{selectedOrder.customer_name}</p>
                  <p className="text-xs text-muted-foreground">{selectedOrder.customer_phone}</p>
                </div>
                <div className="bg-secondary rounded-lg p-3">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1">Quantité</p>
                  <p className="font-bold text-foreground text-xl">{selectedOrder.quantity}</p>
                </div>
              </div>
              <div className="bg-secondary rounded-lg p-3 text-sm font-body">
                <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1">Produit</p>
                <p className="font-semibold text-foreground">{selectedOrder.product_description}</p>
              </div>
              <div className="bg-secondary rounded-lg p-3 text-sm font-body">
                <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1">Livraison</p>
                <p className="text-foreground">{selectedOrder.delivery_address}</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-primary/10 border border-primary/20 rounded-lg p-3 text-center">
                  <p className="text-xs text-muted-foreground font-body">Montant</p>
                  <p className="text-xl font-heading font-bold text-primary">{Number(selectedOrder.total_amount).toLocaleString("fr-FR")} F</p>
                </div>
                <div className={`border rounded-lg p-3 text-center ${selectedOrder.bonus_paid ? "bg-gold/10 border-gold/20" : "bg-secondary border-border"}`}>
                  <p className="text-xs text-muted-foreground font-body">Bonus agent</p>
                  <p className={`text-xl font-heading font-bold ${selectedOrder.bonus_paid ? "text-gold" : "text-muted-foreground"}`}>
                    {selectedOrder.bonus_paid
                      ? `+${Number(selectedOrder.bonus_amount).toLocaleString("fr-FR")} F`
                      : `~${Math.round(Number(selectedOrder.total_amount) * (selectedOrder.bonus_percent || currentBonus) / 100).toLocaleString("fr-FR")} F`
                    }
                  </p>
                  {selectedOrder.bonus_paid && <p className="text-[10px] text-harvest-green">versé ✓</p>}
                </div>
              </div>
              {selectedOrder.notes && (
                <div className="bg-secondary rounded-lg p-3 text-sm font-body">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1">Notes</p>
                  <p className="text-foreground">{selectedOrder.notes}</p>
                </div>
              )}
              {STATUS_CONFIG[selectedOrder.status]?.next && (
                <button
                  onClick={() => { handleAdvanceStatus(selectedOrder); setSelectedOrder(null); }}
                  disabled={processing === selectedOrder.id}
                  className={`w-full py-3 rounded-xl text-sm font-body font-semibold transition-colors ${
                    STATUS_CONFIG[selectedOrder.status].next === "completed"
                      ? "bg-harvest-green/10 text-harvest-green hover:bg-harvest-green/20 border border-harvest-green/30"
                      : "bg-primary/10 text-primary hover:bg-primary/20 border border-primary/30"
                  }`}
                >
                  {STATUS_CONFIG[selectedOrder.status].nextLabel}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPorteurAffaires;
