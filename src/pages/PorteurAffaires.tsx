import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Briefcase, Plus, X, CheckCircle, Clock, Truck, Package,
  Trophy, TrendingUp, Coins, Star, RefreshCw, ChevronDown,
  MapPin, Phone, User, Search, AlertCircle, Flame
} from "lucide-react";
import { toast } from "sonner";
import DashboardLayout from "@/components/DashboardLayout";

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  pending:    { label: "En attente",      color: "bg-gold/20 text-gold",               icon: <Clock className="w-3 h-3" /> },
  processing: { label: "En traitement",   color: "bg-primary/20 text-primary",         icon: <Package className="w-3 h-3" /> },
  delivering: { label: "En livraison",    color: "bg-blue-500/20 text-blue-500",       icon: <Truck className="w-3 h-3" /> },
  completed:  { label: "Livré ✓",         color: "bg-harvest-green/20 text-harvest-green", icon: <CheckCircle className="w-3 h-3" /> },
  cancelled:  { label: "Annulé",          color: "bg-destructive/20 text-destructive", icon: <X className="w-3 h-3" /> },
};

const MEDAL_COLORS = ["text-gold", "text-slate-400", "text-amber-600", "text-foreground", "text-foreground"];
const MEDAL_EMOJIS = ["🥇", "🥈", "🥉", "4.", "5."];

const PorteurAffairesPage = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<"submit" | "my_orders" | "leaderboard">("submit");
  const [profile, setProfile] = useState<any>(null);
  const [packs, setPacks]   = useState<any[]>([]);
  const [myOrders, setMyOrders] = useState<any[]>([]);
  const [stats, setStats] = useState({ totalOrders: 0, completedOrders: 0, totalBonus: 0, pendingBonus: 0 });
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [bonusPercent, setBonusPercent] = useState(3);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    customer_name: "", customer_phone: "", delivery_address: "",
    product_description: "", pack_id: "", quantity: "1", total_amount: "",
    notes: "",
  });

  useEffect(() => { if (!loading && !user) navigate("/connexion"); }, [user, loading]);
  useEffect(() => { if (user) loadAll(); }, [user]);

  const loadAll = async () => {
    const [profileRes, packsRes, partnerProdRes, ordersRes, cfgRes] = await Promise.all([
      supabase.from("profiles").select("*").eq("user_id", user!.id).single(),
      supabase.from("packs").select("id, name, price").eq("is_active", true),
      supabase.from("partner_products").select("id, name, price, partner_company_id").eq("is_active", true),
      (supabase as any).from("business_orders").select("*").eq("user_id", user!.id).order("created_at", { ascending: false }),
      supabase.from("mlm_config").select("*").eq("key", "business_bonus_percent").single(),
    ]);
    setProfile(profileRes.data);
    const partnerProducts = (partnerProdRes.data || []).map((pp: any) => ({
      id: `pp:${pp.id}`, name: `🛍️ ${pp.name}`, price: pp.price,
    }));
    setPacks([...(packsRes.data || []), ...partnerProducts]);
    const orders = ordersRes.data || [];
    setMyOrders(orders);
    setBonusPercent(Number((cfgRes.data as any)?.value) || 3);

    const completed = orders.filter((o: any) => o.status === "completed");
    setStats({
      totalOrders: orders.length,
      completedOrders: completed.length,
      totalBonus: completed.reduce((s: number, o: any) => s + Number(o.bonus_amount || 0), 0),
      pendingBonus: orders.filter((o: any) => ["pending", "processing", "delivering"].includes(o.status))
        .reduce((s: number, o: any) => s + Math.round(Number(o.total_amount || 0) * bonusPercent / 100), 0),
    });

    // Leaderboard: top agents
    const { data: lb } = await (supabase as any)
      .from("business_orders")
      .select("user_id, bonus_amount, status")
      .eq("status", "completed");
    if (lb) {
      const grouped: Record<string, number> = {};
      lb.forEach((o: any) => {
        grouped[o.user_id] = (grouped[o.user_id] || 0) + Number(o.bonus_amount || 0);
      });
      const sorted = Object.entries(grouped)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 10);

      const profileIds = sorted.map(([uid]) => uid);
      if (profileIds.length > 0) {
        const { data: profiles } = await supabase.from("profiles")
          .select("user_id, first_name, last_name, career_level")
          .in("user_id", profileIds);

        setLeaderboard(sorted.map(([uid, total], idx) => {
          const p = profiles?.find(x => x.user_id === uid);
          return { rank: idx + 1, uid, total, name: p ? `${p.first_name} ${p.last_name}` : "Moissonneur", level: p?.career_level };
        }));
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.customer_name || !form.customer_phone || !form.delivery_address || !form.total_amount) {
      toast.error("Remplissez tous les champs obligatoires");
      return;
    }
    setSubmitting(true);
    const packName = packs.find(p => p.id === form.pack_id)?.name || form.product_description;
    const isPartnerProduct = form.pack_id.startsWith("pp:");
    const { error } = await (supabase as any).from("business_orders").insert({
      user_id: user!.id,
      customer_name: form.customer_name,
      customer_phone: form.customer_phone,
      delivery_address: form.delivery_address,
      product_description: packName || form.product_description,
      pack_id: isPartnerProduct || !form.pack_id ? null : form.pack_id,
      quantity: Number(form.quantity) || 1,
      total_amount: Number(form.total_amount),
      status: "pending",
      bonus_percent: bonusPercent,
      bonus_amount: 0,
      bonus_paid: false,
      notes: (isPartnerProduct ? `[Produit partenaire id=${form.pack_id.slice(3)}] ` : "") + (form.notes || ""),
    });
    setSubmitting(false);
    if (error) { toast.error("Erreur: " + error.message); return; }
    toast.success("✅ Commande soumise ! L'équipe Moisson la traite bientôt.");
    setForm({ customer_name: "", customer_phone: "", delivery_address: "", product_description: "", pack_id: "", quantity: "1", total_amount: "", notes: "" });
    setShowForm(false);
    setActiveTab("my_orders");
    loadAll();
  };

  const estimatedBonus = form.total_amount ? Math.round(Number(form.total_amount) * bonusPercent / 100) : 0;

  if (loading || !profile) {
    return (
      <DashboardLayout>
        <div className="animate-pulse text-muted-foreground font-body text-center py-12">Chargement...</div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      {/* ── HERO ── */}
      <div className="relative overflow-hidden rounded-2xl mb-6 p-6 bg-gradient-to-br from-primary via-primary/80 to-gold/60 border border-primary/30">
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "radial-gradient(circle at 70% 50%, #d4a017 0%, transparent 60%)" }} />
        <div className="relative z-10 flex items-start justify-between flex-wrap gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Briefcase className="w-6 h-6 text-white" />
              <span className="text-white/80 text-sm font-body font-semibold uppercase tracking-widest">Module Porteur d'Affaires</span>
            </div>
            <h1 className="text-3xl font-heading font-bold text-white mb-1">Moissonneur de Quartier 🌾</h1>
            <p className="text-white/75 font-body text-sm max-w-md">
              Identifiez des clients autour de vous, soumettez leurs commandes.
              À chaque livraison réussie, recevez <span className="font-bold text-gold">{bonusPercent}% de commission</span> automatiquement.
            </p>
          </div>
          <div className="bg-white/15 backdrop-blur-sm rounded-xl p-4 border border-white/20 text-center min-w-[140px]">
            <p className="text-white/70 text-xs font-body">Taux de bonus</p>
            <p className="text-4xl font-heading font-bold text-gold">{bonusPercent}%</p>
            <p className="text-white/60 text-xs font-body">par commande livrée</p>
          </div>
        </div>
      </div>

      {/* ── STATS ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { icon: <Package className="w-4 h-4 text-primary" />, label: "Commandes soumises", value: stats.totalOrders, color: "text-foreground" },
          { icon: <CheckCircle className="w-4 h-4 text-harvest-green" />, label: "Livrées avec succès", value: stats.completedOrders, color: "text-harvest-green" },
          { icon: <Coins className="w-4 h-4 text-gold" />, label: "Bonus reçus", value: `${stats.totalBonus.toLocaleString("fr-FR")} F`, color: "text-gold" },
          { icon: <Clock className="w-4 h-4 text-primary" />, label: "Bonus en attente", value: `~${stats.pendingBonus.toLocaleString("fr-FR")} F`, color: "text-primary" },
        ].map((s, i) => (
          <div key={i} className="card-elevated p-4">
            <div className="flex items-center gap-2 mb-2">{s.icon}<span className="text-xs text-muted-foreground font-body">{s.label}</span></div>
            <p className={`text-xl font-heading font-bold ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* ── TABS ── */}
      <div className="flex gap-1 bg-secondary p-1 rounded-xl mb-6 w-fit flex-wrap">
        {[
          { key: "submit",      label: "📝 Soumettre une commande" },
          { key: "my_orders",   label: `📦 Mes Commandes (${stats.totalOrders})` },
          { key: "leaderboard", label: "🏆 Classement" },
        ].map(tab => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key as any)}
            className={`px-4 py-2.5 rounded-lg text-sm font-body font-semibold transition-all ${
              activeTab === tab.key ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
            }`}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* ══ TAB: SUBMIT ══ */}
      {activeTab === "submit" && (
        <div className="max-w-2xl space-y-6">
          {/* HOW IT WORKS */}
          <div className="card-elevated border-primary/20 bg-primary/5">
            <h2 className="font-heading font-bold text-foreground mb-4 flex items-center gap-2">
              <Flame className="w-5 h-5 text-gold" /> Comment ça fonctionne ?
            </h2>
            <div className="grid sm:grid-cols-3 gap-4">
              {[
                { n: "1", t: "Prospectez", d: "Trouvez un client dans votre quartier (boutique, voisin, épicier…)", icon: "🔍" },
                { n: "2", t: "Soumettez", d: "Renseignez les détails de la commande dans l'application", icon: "📱" },
                { n: "3", t: "Encaissez", d: `${bonusPercent}% du montant crédité automatiquement à la livraison`, icon: "💰" },
              ].map(s => (
                <div key={s.n} className="flex items-start gap-3 p-3 bg-card rounded-xl border border-border">
                  <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm font-bold flex items-center justify-center flex-shrink-0">{s.n}</div>
                  <div>
                    <p className="font-semibold text-foreground text-sm font-body">{s.icon} {s.t}</p>
                    <p className="text-xs text-muted-foreground font-body mt-0.5">{s.d}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* FORM */}
          <div className="card-elevated">
            <h2 className="font-heading font-semibold text-foreground mb-6 flex items-center gap-2">
              <Plus className="w-5 h-5 text-primary" /> Nouvelle commande client
            </h2>

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Customer info */}
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest font-body mb-3">👤 Informations client</p>
                <div className="grid sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-foreground font-body block mb-1.5">Nom complet *</label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <input required placeholder="Ex: Mariam Konaté" value={form.customer_name}
                        onChange={e => setForm({ ...form, customer_name: e.target.value })}
                        className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-input bg-background text-foreground font-body text-sm" />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-foreground font-body block mb-1.5">Téléphone *</label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <input required placeholder="+225 XX XX XX XX XX" value={form.customer_phone}
                        onChange={e => setForm({ ...form, customer_phone: e.target.value })}
                        className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-input bg-background text-foreground font-body text-sm" />
                    </div>
                  </div>
                </div>
                <div className="mt-3">
                  <label className="text-xs font-medium text-foreground font-body block mb-1.5">Adresse de livraison *</label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                    <textarea required placeholder="Quartier, rue, description précise du lieu…" value={form.delivery_address}
                      onChange={e => setForm({ ...form, delivery_address: e.target.value })} rows={2}
                      className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-input bg-background text-foreground font-body text-sm" />
                  </div>
                </div>
              </div>

              {/* Product */}
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest font-body mb-3">📦 Commande</p>
                <div className="grid sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-foreground font-body block mb-1.5">Pack / Produit catalogue (optionnel)</label>
                    <select value={form.pack_id} onChange={e => {
                      const pack = packs.find(p => p.id === e.target.value);
                      setForm({ ...form, pack_id: e.target.value, total_amount: pack ? String(pack.price) : form.total_amount, product_description: pack ? pack.name : form.product_description });
                    }} className="w-full px-3 py-2.5 rounded-lg border border-input bg-background text-foreground font-body text-sm">
                      <option value="">— Saisie libre —</option>
                      {packs.map(p => <option key={p.id} value={p.id}>{p.name} — {Number(p.price).toLocaleString("fr-FR")} F</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-foreground font-body block mb-1.5">Quantité</label>
                    <input type="number" min="1" value={form.quantity}
                      onChange={e => setForm({ ...form, quantity: e.target.value })}
                      className="w-full px-3 py-2.5 rounded-lg border border-input bg-background text-foreground font-body text-sm" />
                  </div>
                </div>
                {!form.pack_id && (
                  <div className="mt-3">
                    <label className="text-xs font-medium text-foreground font-body block mb-1.5">Description du produit *</label>
                    <input placeholder="Ex: 5 cartons d'huile végétale 5L, 1 tonne de ciment…" value={form.product_description}
                      onChange={e => setForm({ ...form, product_description: e.target.value })}
                      className="w-full px-3 py-2.5 rounded-lg border border-input bg-background text-foreground font-body text-sm" />
                  </div>
                )}
                <div className="mt-3">
                  <label className="text-xs font-medium text-foreground font-body block mb-1.5">Montant total estimé (FCFA) *</label>
                  <input required type="number" min="500" placeholder="Ex: 85000" value={form.total_amount}
                    onChange={e => setForm({ ...form, total_amount: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-lg border border-input bg-background text-foreground font-body text-sm" />
                </div>
              </div>

              {/* Bonus preview */}
              {estimatedBonus > 0 && (
                <div className="bg-gradient-to-r from-gold/10 to-harvest-green/10 border border-gold/30 rounded-xl p-4 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-foreground font-body">🎯 Votre bonus estimé</p>
                    <p className="text-xs text-muted-foreground font-body">{bonusPercent}% de {Number(form.total_amount).toLocaleString("fr-FR")} FCFA</p>
                  </div>
                  <p className="text-2xl font-heading font-bold text-gold">+{estimatedBonus.toLocaleString("fr-FR")} FCFA</p>
                </div>
              )}

              {/* Notes */}
              <div>
                <label className="text-xs font-medium text-foreground font-body block mb-1.5">Notes complémentaires</label>
                <textarea placeholder="Instructions de livraison, horaires, particularités…" value={form.notes}
                  onChange={e => setForm({ ...form, notes: e.target.value })} rows={2}
                  className="w-full px-3 py-2.5 rounded-lg border border-input bg-background text-foreground font-body text-sm" />
              </div>

              <button type="submit" disabled={submitting} className="w-full btn-gold !text-sm !py-3 disabled:opacity-50">
                {submitting ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Soumission en cours…
                  </span>
                ) : "📤 Soumettre la commande"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ══ TAB: MY ORDERS ══ */}
      {activeTab === "my_orders" && (
        <div className="space-y-4">
          {myOrders.length === 0 ? (
            <div className="text-center py-16 card-elevated">
              <Briefcase className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
              <p className="font-heading font-semibold text-foreground mb-1">Aucune commande soumise</p>
              <p className="text-sm text-muted-foreground font-body mb-4">Commencez à prospecter et soumettez votre première commande !</p>
              <button onClick={() => setActiveTab("submit")} className="btn-gold !text-sm !py-2.5 !px-6">
                Soumettre une commande
              </button>
            </div>
          ) : (
            myOrders.map(order => {
              const cfg = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending;
              const estimBon = Math.round(Number(order.total_amount) * (order.bonus_percent || bonusPercent) / 100);
              return (
                <div key={order.id} className="card-elevated">
                  <div className="flex items-start justify-between mb-3 flex-wrap gap-2">
                    <div>
                      <p className="font-heading font-semibold text-foreground">{order.product_description}</p>
                      <p className="text-xs text-muted-foreground font-body mt-0.5">
                        Client : {order.customer_name} • {order.customer_phone}
                      </p>
                    </div>
                    <span className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-semibold ${cfg.color}`}>
                      {cfg.icon} {cfg.label}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-3 text-center mb-3">
                    <div className="bg-secondary rounded-lg p-2.5">
                      <p className="text-[10px] text-muted-foreground font-body">Quantité</p>
                      <p className="text-sm font-bold text-foreground">{order.quantity}</p>
                    </div>
                    <div className="bg-secondary rounded-lg p-2.5">
                      <p className="text-[10px] text-muted-foreground font-body">Montant</p>
                      <p className="text-sm font-bold text-primary">{Number(order.total_amount).toLocaleString("fr-FR")} F</p>
                    </div>
                    <div className={`rounded-lg p-2.5 ${order.status === "completed" ? "bg-gold/10" : "bg-secondary"}`}>
                      <p className="text-[10px] text-muted-foreground font-body">Bonus</p>
                      <p className={`text-sm font-bold ${order.status === "completed" ? "text-gold" : "text-muted-foreground"}`}>
                        {order.status === "completed" ? `+${Number(order.bonus_amount).toLocaleString("fr-FR")} F` : `~${estimBon.toLocaleString("fr-FR")} F`}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs text-muted-foreground font-body">
                    <span>📍 {order.delivery_address?.substring(0, 40)}{(order.delivery_address?.length || 0) > 40 ? "…" : ""}</span>
                    <span>{new Date(order.created_at).toLocaleDateString("fr-FR")}</span>
                  </div>

                  {order.notes && (
                    <p className="text-xs text-muted-foreground font-body mt-2 bg-secondary/50 rounded-lg px-3 py-2">
                      📋 {order.notes}
                    </p>
                  )}

                  {order.status === "completed" && order.bonus_paid && (
                    <div className="mt-2 flex items-center gap-2 text-xs text-harvest-green font-body bg-harvest-green/10 rounded-lg px-3 py-2">
                      <CheckCircle className="w-3.5 h-3.5" />
                      Bonus de {Number(order.bonus_amount).toLocaleString("fr-FR")} FCFA crédité sur votre portefeuille !
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

      {/* ══ TAB: LEADERBOARD ══ */}
      {activeTab === "leaderboard" && (
        <div className="space-y-4 max-w-2xl">
          <div className="card-elevated border-gold/20 bg-gradient-to-br from-gold/5 to-primary/5">
            <h2 className="font-heading font-bold text-foreground mb-1 flex items-center gap-2">
              <Trophy className="w-5 h-5 text-gold" /> Classement des Moissonneurs de Terrain
            </h2>
            <p className="text-xs text-muted-foreground font-body mb-6">
              Top agents par bonus cumulés sur commandes livrées
            </p>

            {leaderboard.length === 0 ? (
              <div className="text-center py-8">
                <Trophy className="w-10 h-10 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground font-body">Aucune commande livrée pour le moment. Soyez le premier !</p>
              </div>
            ) : (
              <div className="space-y-3">
                {leaderboard.map((agent, i) => (
                  <div key={agent.uid}
                    className={`flex items-center gap-4 p-4 rounded-xl border transition-all ${
                      i === 0 ? "border-gold/30 bg-gold/10 shadow-md" :
                      i === 1 ? "border-slate-400/30 bg-slate-400/5" :
                      i === 2 ? "border-amber-600/30 bg-amber-600/5" :
                      "border-border bg-secondary/30"
                    }`}
                  >
                    <div className={`text-2xl font-heading font-bold w-10 text-center ${MEDAL_COLORS[i] || "text-foreground"}`}>
                      {i < 3 ? MEDAL_EMOJIS[i] : `${i + 1}.`}
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-foreground font-body">
                        {agent.uid === user!.id ? <span className="text-primary">👤 {agent.name} (vous)</span> : agent.name}
                      </p>
                      <p className="text-xs text-muted-foreground font-body capitalize">{agent.level?.replace(/_/g, " ")}</p>
                    </div>
                    <div className="text-right">
                      <p className={`font-heading font-bold text-lg ${i === 0 ? "text-gold" : "text-foreground"}`}>
                        {agent.total.toLocaleString("fr-FR")} F
                      </p>
                      <p className="text-xs text-muted-foreground font-body">en bonus</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="card-elevated text-center">
            <TrendingUp className="w-8 h-8 text-primary mx-auto mb-2" />
            <p className="text-sm font-body text-muted-foreground">
              Chaque commande livrée vous rapporte <strong className="text-primary">{bonusPercent}%</strong> du montant.
              Multipliez les ventes pour grimper dans le classement !
            </p>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default PorteurAffairesPage;
