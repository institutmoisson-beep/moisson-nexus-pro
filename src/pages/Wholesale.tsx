import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Package, ShoppingCart, Plus, X, ChevronRight, ChevronLeft,
  Upload, Search, Filter, Star, Truck, Wallet, Send,
  CheckCircle, Clock, AlertCircle, RefreshCw, Tag,
  Building2, Users, TrendingUp, Award
} from "lucide-react";
import { toast } from "sonner";
import DashboardLayout from "@/components/DashboardLayout";

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  pending:   { label: "En attente",  color: "bg-gold/20 text-gold" },
  confirmed: { label: "Confirmé",    color: "bg-primary/20 text-primary" },
  shipped:   { label: "Expédié",     color: "bg-blue-500/20 text-blue-600" },
  delivered: { label: "Livré ✓",     color: "bg-harvest-green/20 text-harvest-green" },
  cancelled: { label: "Annulé",      color: "bg-destructive/20 text-destructive" },
};

const WholesalePage = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<"catalogue" | "my_orders" | "propose" | "agent">("catalogue");
  const [products, setProducts] = useState<any[]>([]);
  const [myOrders, setMyOrders] = useState<any[]>([]);
  const [myProposals, setMyProposals] = useState<any[]>([]);
  const [agentOrders, setAgentOrders] = useState<any[]>([]);
  const [profile, setProfile] = useState<any>(null);
  const [search, setSearch] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [imgIdx, setImgIdx] = useState(0);
  const [showBuyModal, setShowBuyModal] = useState(false);
  const [buyForm, setBuyForm] = useState({
    quantity: 1,
    delivery_city: "",
    delivery_address: "",
    delivery_phone: "",
    notes: "",
    for_client: false,
    client_name: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [showProposeModal, setShowProposeModal] = useState(false);
  const [proposeForm, setProposeForm] = useState({
    product_name: "",
    description: "",
    price_fcfa: "",
    min_quantity: "1",
    unit: "unité",
    contact_phone: "",
    images: [] as string[],
  });
  const [uploadingImages, setUploadingImages] = useState(false);
  const [stats, setStats] = useState({ totalOrders: 0, totalCommissions: 0, pendingCommissions: 0 });

  useEffect(() => { if (!loading && !user) navigate("/connexion"); }, [user, loading]);
  useEffect(() => { if (user) loadAll(); }, [user]);

  const loadAll = async () => {
    const [prodRes, profileRes, ordersRes, proposalsRes, agentRes] = await Promise.all([
      (supabase as any).from("wholesale_products").select("*, partner_companies(name)").eq("is_active", true).order("created_at", { ascending: false }),
      supabase.from("profiles").select("*").eq("user_id", user!.id).single(),
      (supabase as any).from("wholesale_orders").select("*, wholesale_products(name, images, unit)").eq("buyer_id", user!.id).order("created_at", { ascending: false }),
      (supabase as any).from("wholesale_proposals").select("*").eq("proposer_id", user!.id).order("created_at", { ascending: false }),
      (supabase as any).from("wholesale_orders").select("*, wholesale_products(name, price_fcfa, commission_pct)").eq("agent_id", user!.id).order("created_at", { ascending: false }),
    ]);
    setProducts(prodRes.data || []);
    setProfile(profileRes.data);
    setMyOrders(ordersRes.data || []);
    setMyProposals(proposalsRes.data || []);
    setAgentOrders(agentRes.data || []);

    const ao = agentRes.data || [];
    setStats({
      totalOrders: ao.length,
      totalCommissions: ao.filter((o: any) => o.commission_paid).reduce((s: number, o: any) => s + Number(o.commission_amount || 0), 0),
      pendingCommissions: ao.filter((o: any) => !o.commission_paid && o.status !== "cancelled").reduce((s: number, o: any) => s + Math.round(Number(o.total_amount) * (o.wholesale_products?.commission_pct || 5) / 100), 0),
    });
  };

  const handleBuy = async () => {
    if (!selectedProduct || !profile) return;
    const totalAmount = Number(selectedProduct.price_fcfa) * buyForm.quantity;
    if (Number(profile.wallet_balance) < totalAmount) {
      toast.error(`Solde insuffisant. Nécessaire : ${totalAmount.toLocaleString("fr-FR")} FCFA`);
      return;
    }
    if (!buyForm.delivery_city || !buyForm.delivery_phone) {
      toast.error("Ville et téléphone de livraison obligatoires");
      return;
    }
    setSubmitting(true);
    try {
      const { data: order, error } = await (supabase as any).from("wholesale_orders").insert({
        buyer_id: user!.id,
        product_id: selectedProduct.id,
        quantity: buyForm.quantity,
        unit_price: selectedProduct.price_fcfa,
        total_amount: totalAmount,
        payment_method: "wallet",
        delivery_city: buyForm.delivery_city,
        delivery_address: buyForm.delivery_address,
        delivery_phone: buyForm.delivery_phone,
        notes: buyForm.notes,
        agent_id: buyForm.for_client ? user!.id : null,
      }).select("id").single();

      if (error) throw error;

      // Débiter le portefeuille
      await supabase.from("profiles").update({
        wallet_balance: Number(profile.wallet_balance) - totalAmount
      }).eq("user_id", user!.id);

      await supabase.from("transactions").insert({
        user_id: user!.id,
        amount: totalAmount,
        type: "pack_purchase",
        status: "approved",
        description: `Achat Gros — ${selectedProduct.name} × ${buyForm.quantity``buyForm.quantity} ${selectedProduct.unit}`,
      });

      toast.success(`✅ Commande passée ! ${totalAmount.toLocaleString("fr-FR")} FCFA débités.`);
      setShowBuyModal(false);
      setSelectedProduct(null);
      setBuyForm({ quantity: 1, delivery_city: "", delivery_address: "", delivery_phone: "", notes: "", for_client: false, client_name: "" });
      loadAll();
    } catch (err: any) {
      toast.error(err.message || "Erreur lors de la commande");
    } finally {
      setSubmitting(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []).slice(0, 4);
    if (!files.length) return;
    setUploadingImages(true);
    const urls: string[] = [];
    for (const file of files) {
      const path = `wholesale_proposals/${user!.id}/${Date.now(``)}-${file.name.replace(/[^a-zA-Z0-9.]/g, "_")}`;
      const { error } = await supabase.storage.from("images").upload(path, file);
      if (!error) {
        const { data } = supabase.storage.from("images").getPublicUrl(path);
        urls.push(data.publicUrl);
      }
    }
    setProposeForm(f => ({ ...f, images: [...f.images, ...urls] }));
    setUploadingImages(false);
  };

  const handlePropose = async () => {
    if (!proposeForm.product_name || !proposeForm.price_fcfa) {
      toast.error("Nom et prix obligatoires");
      return;
    }
    setSubmitting(true);
    const { error } = await (supabase as any).from("wholesale_proposals").insert({
      proposer_id: user!.id,
      product_name: proposeForm.product_name,
      description: proposeForm.description,
      price_fcfa: Number(proposeForm.price_fcfa),
      min_quantity: Number(proposeForm.min_quantity),
      unit: proposeForm.unit,
      images: proposeForm.images,
      contact_phone: proposeForm.contact_phone,
    });
    setSubmitting(false);
    if (error) { toast.error(error.message); return; }
    toast.success("✅ Proposition soumise ! L'admin la validera bientôt.");
    setShowProposeModal(false);
    setProposeForm({ product_name: "", description: "", price_fcfa: "", min_quantity: "1", unit: "unité", contact_phone: "", images: [] });
    loadAll();
  };

  const filteredProducts = products.filter(p => {
    const q = search.toLowerCase();
    return !q || p.name.toLowerCase().includes(q) || (p.description || "").toLowerCase().includes(q);
  });

  if (loading || !profile) return (
    <DashboardLayout>
      <div className="flex items-center justify-center py-24">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    </DashboardLayout>
  );

  return (
    <DashboardLayout>
      {/* HERO */}
      <div className="relative overflow-hidden rounded-2xl mb-6 p-6 bg-gradient-to-br from-harvest-green via-harvest-green/80 to-primary border border-harvest-green/30">
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "radial-gradient(circle at 80% 20%, #fff 0%, transparent 50%)" }} />
        <div className="relative z-10 flex items-start justify-between flex-wrap gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Package className="w-6 h-6 text-white" />
              <span className="text-white/80 text-sm font-body font-semibold uppercase tracking-widest">Vente en Gros</span>
            </div>
            <h1 className="text-3xl font-heading font-bold text-white mb-1">Produits en Gros 📦</h1>
            <p className="text-white/75 font-body text-sm max-w-lg">
              Achetez directement des produits en grandes quantités à prix réduits.
              Proposez vos produits ou agissez comme agent et <span className="font-bold text-white">gagnez des commissions</span>.
            </p>
          </div>
          <div className="flex gap-3">
            <div className="bg-white/15 backdrop-blur-sm rounded-xl p-4 border border-white/20 text-center min-w-[100px]">
              <p className="text-white/70 text-xs font-body">Solde</p>
              <p className="text-xl font-heading font-bold text-white">{Number(profile.wallet_balance).toLocaleString("fr-FR")}</p>
              <p className="text-white/60 text-[10px]">FCFA</p>
            </div>
            <div className="bg-white/15 backdrop-blur-sm rounded-xl p-4 border border-white/20 text-center min-w-[100px]">
              <p className="text-white/70 text-xs font-body">Commissions</p>
              <p className="text-xl font-heading font-bold text-gold">{stats.totalCommissions.toLocaleString("fr-FR")}</p>
              <p className="text-white/60 text-[10px]">FCFA gagnés</p>
            </div>
          </div>
        </div>
      </div>

      {/* TABS */}
      <div className="flex gap-1 bg-secondary p-1 rounded-xl mb-6 flex-wrap">
        {[
          { key: "catalogue",  label: 🏪 Catalogue (`${products.length}`) },
          { key: "my_orders",  label: 📦 Mes Commandes (`${myOrders.length}`) },
          { key: "agent",      label: 💼 Espace Agent (`${agentOrders.length}`) },
          { key: "propose",    label: ➕ Proposer un produit },
        ].map(tab => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key as any)}
            className={`px-4 py-2.5 rounded-lg text-sm font-body font-semibold transition-all ${activeTab === tab.key ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* ══ CATALOGUE ══ */}
      {activeTab === "catalogue" && (
        <div>
          <div className="flex gap-3 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input placeholder="Rechercher un produit en gros…" value={search} onChange={e => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-input bg-background text-foreground font-body text-sm" />
            </div>
            <button onClick={() => setShowProposeModal(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-harvest-green text-white font-body text-sm font-semibold hover:opacity-90 transition-all">
              <Plus className="w-4 h-4" /> Proposer
            </button>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredProducts.map(product => {
              const canBuy = Number(profile.wallet_balance) >= Number(product.price_fcfa) * product.min_quantity;
              return (
                <div key={product.id} onClick={() => { setSelectedProduct(product); setImgIdx(0); }}
                  className="group cursor-pointer card-elevated hover:shadow-xl hover:border-harvest-green/30 transition-all hover:-translate-y-1">
                  <div className="relative rounded-xl overflow-hidden aspect-video mb-4 bg-secondary">
                    {product.images?.[0]
                      ? <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      : <div className="w-full h-full flex items-center justify-center"><Package className="w-12 h-12 text-muted-foreground/40" /></div>
                    }
                    <div className="absolute top-2 left-2 bg-harvest-green text-white text-xs px-2.5 py-1 rounded-full font-semibold">
                      {product.commission_pct}% commission
                    </div>
                    {product.stock !== null && product.stock <= 10 && (
                      <div className="absolute top-2 right-2 bg-destructive text-white text-xs px-2 py-1 rounded-full">
                        Stock: {product.stock}
                      </div>
                    )}
                  </div>
                  <h3 className="font-heading font-bold text-foreground text-lg mb-1">{product.name}</h3>
                  {product.partner_companies?.name && (
                    <p className="text-xs text-muted-foreground font-body mb-2 flex items-center gap-1">
                      <Building2 className="w-3 h-3" /> {product.partner_companies.name}
                    </p>
                  )}
                  {product.description && <p className="text-xs text-muted-foreground font-body mb-3 line-clamp-2">{product.description}</p>}
                  <div className="flex items-end justify-between">
                    <div>
                      <p className="text-xl font-heading font-bold text-harvest-green">
                        {Number(product.price_fcfa).toLocaleString("fr-FR")} FCFA
                      </p>
                      <p className="text-xs text-muted-foreground font-body">
                        Min. {product.min_quantity} {product.unit}
                        {product.min_quantity > 1 && <span className="ml-1 text-primary font-semibold">= {(Number(product.price_fcfa) * product.min_quantity).toLocaleString("fr-FR")} FCFA</span>}
                      </p>
                    </div>
                    <span className="text-sm text-harvest-green font-semibold font-body">Voir →</span>
                  </div>
                </div>
              );
            })}
            {filteredProducts.length === 0 && (
              <div className="col-span-3 text-center py-16 card-elevated">
                <Package className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground font-body">Aucun produit en gros disponible</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ══ MES COMMANDES ══ */}
      {activeTab === "my_orders" && (
        <div className="space-y-3">
          {myOrders.length === 0 ? (
            <div className="card-elevated text-center py-16">
              <ShoppingCart className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
              <p className="font-heading font-semibold text-foreground mb-1">Aucune commande en gros</p>
              <button onClick={() => setActiveTab("catalogue")} className="mt-3 btn-hero !text-sm !py-2.5 !px-6">
                Voir le catalogue
              </button>
            </div>
          ) : myOrders.map(order => {
            const cfg = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending;
            return (
              <div key={order.id} className="card-elevated">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-14 h-14 rounded-xl overflow-hidden bg-secondary flex-shrink-0">
                      {order.wholesale_products?.images?.[0]
                        ? <img src={order.wholesale_products.images[0]} alt="" className="w-full h-full object-cover" />
                        : <div className="w-full h-full flex items-center justify-center"><Package className="w-6 h-6 text-muted-foreground" /></div>
                      }
                    </div>
                    <div>
                      <h3 className="font-heading font-semibold text-foreground">{order.wholesale_products?.name}</h3>
                      <p className="text-xs text-muted-foreground font-body">
                        {order.quantity} {order.wholesale_products?.unit} × {Number(order.unit_price).toLocaleString("fr-FR")} FCFA
                      </p>
                    </div>
                  </div>
                  <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${cfg.color}`}>{cfg.label}</span>
                </div>
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div className="bg-secondary rounded-lg p-2">
                    <p className="text-[10px] text-muted-foreground font-body">Total</p>
                    <p className="text-sm font-bold text-primary">{Number(order.total_amount).toLocaleString("fr-FR")} F</p>
                  </div>
                  <div className="bg-secondary rounded-lg p-2">
                    <p className="text-[10px] text-muted-foreground font-body">Ville</p>
                    <p className="text-sm font-bold text-foreground">{order.delivery_city || "—"}</p>
                  </div>
                  <div className="bg-secondary rounded-lg p-2">
                    <p className="text-[10px] text-muted-foreground font-body">Date</p>
                    <p className="text-sm font-bold text-foreground">{new Date(order.created_at).toLocaleDateString("fr-FR")}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ══ ESPACE AGENT ══ */}
      {activeTab === "agent" && (
        <div className="space-y-6">
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: "Commandes agent", value: stats.totalOrders, color: "text-foreground" },
              { label: "Commissions reçues", value: `${stats.totalCommissions.toLocaleString("fr-FR")} F`, color: "text-harvest-green" },
              { label: "En attente", value: `~${stats.pendingCommissions.toLocaleString("fr-FR")} F`, color: "text-gold" },
            ].map((s, i) => (
              <div key={i} className="card-elevated text-center p-4">
                <p className="text-xs text-muted-foreground font-body mb-1">{s.label}</p>
                <p className={`text-xl font-heading font-bold ${s.color}`}>{s.value}</p>
              </div>
            ))}
          </div>

          <div className="card-elevated border-harvest-green/20 bg-harvest-green/5">
            <h2 className="font-heading font-bold text-foreground mb-3 flex items-center gap-2">
              <Award className="w-5 h-5 text-harvest-green" /> Comment gagner des commissions
            </h2>
            <div className="grid sm:grid-cols-3 gap-3">
              {[
                { n: "1", t: "Trouvez un client", d: "Identifiez quelqu'un qui a besoin d'un produit en gros" },
                { n: "2", t: "Passez la commande", d: "Commandez en cochant « Pour un client » — vous êtes l'agent" },
                { n: "3", t: "Commission auto", d: "Dès la livraison, votre % est crédité automatiquement" },
              ].map(s => (
                <div key={s.n} className="flex items-start gap-3 p-3 bg-card rounded-xl border border-border">
                  <div className="w-7 h-7 rounded-full bg-harvest-green text-white text-xs font-bold flex items-center justify-center flex-shrink-0">{s.n}</div>
                  <div>
                    <p className="text-sm font-semibold text-foreground font-body">{s.t}</p>
                    <p className="text-xs text-muted-foreground font-body mt-0.5">{s.d}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {agentOrders.length > 0 && (
            <div>
              <h2 className="font-heading font-semibold text-foreground mb-3">Mes commandes agent</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm font-body">
                  <thead><tr className="border-b border-border text-muted-foreground">
                    <th className="text-left py-2 px-3">Produit</th>
                    <th className="text-right py-2 px-3">Montant</th>
                    <th className="text-right py-2 px-3">Commission</th>
                    <th className="text-center py-2 px-3">Statut</th>
                  </tr></thead>
                  <tbody>
                    {agentOrders.map((o: any) => {
                      const cfg = STATUS_CONFIG[o.status] || STATUS_CONFIG.pending;
                      const estComm = Math.round(Number(o.total_amount) * (o.wholesale_products?.commission_pct || 5) / 100);
                      return (
                        <tr key={o.id} className="border-b border-border/50 hover:bg-secondary/20">
                          <td className="py-2.5 px-3 font-medium">{o.wholesale_products?.name}</td>
                          <td className="py-2.5 px-3 text-right font-bold text-primary">{Number(o.total_amount).toLocaleString("fr-FR")} F</td>
                          <td className="py-2.5 px-3 text-right">
                            {o.commission_paid
                              ? <span className="font-bold text-harvest-green">+{Number(o.commission_amount).toLocaleString("fr-FR")} F ✓</span>
                              : <span className="text-muted-foreground">~{estComm.toLocaleString("fr-FR")} F</span>
                            }
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${cfg.color}`}>{cfg.label}</span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ══ PROPOSER UN PRODUIT ══ */}
      {activeTab === "propose" && (
        <div className="max-w-2xl space-y-6">
          <div className="card-elevated border-primary/20 bg-primary/5">
            <h2 className="font-heading font-bold text-foreground mb-2">📦 Proposer un produit en gros</h2>
            <p className="text-sm text-muted-foreground font-body">
              Vous avez accès à un produit en gros ? Soumettez-le ici. L'admin le validera et il sera visible dans le catalogue. Vous serez l'agent référent.
            </p>
          </div>

          <div className="card-elevated space-y-4">
            <div>
              <label className="text-sm font-medium text-foreground font-body block mb-1.5">Nom du produit *</label>
              <input placeholder="Ex: Riz importé 50kg" value={proposeForm.product_name}
                onChange={e => setProposeForm(f => ({ ...f, product_name: e.target.value }))}
                className="w-full px-4 py-3 rounded-lg border border-input bg-background text-foreground font-body text-sm" />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground font-body block mb-1.5">Description</label>
              <textarea rows={3} placeholder="Qualité, origine, conditionnement…" value={proposeForm.description}
                onChange={e => setProposeForm(f => ({ ...f, description: e.target.value }))}
                className="w-full px-4 py-3 rounded-lg border border-input bg-background text-foreground font-body text-sm" />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-sm font-medium text-foreground font-body block mb-1.5">Prix (FCFA) *</label>
                <input type="number" placeholder="Ex: 25000" value={proposeForm.price_fcfa}
                  onChange={e => setProposeForm(f => ({ ...f, price_fcfa: e.target.value }))}
                  className="w-full px-3 py-2.5 rounded-lg border border-input bg-background text-foreground font-body text-sm" />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground font-body block mb-1.5">Qté min.</label>
                <input type="number" min="1" value={proposeForm.min_quantity}
                  onChange={e => setProposeForm(f => ({ ...f, min_quantity: e.target.value }))}
                  className="w-full px-3 py-2.5 rounded-lg border border-input bg-background text-foreground font-body text-sm" />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground font-body block mb-1.5">Unité</label>
                <select value={proposeForm.unit} onChange={e => setProposeForm(f => ({ ...f, unit: e.target.value }))}
                  className="w-full px-3 py-2.5 rounded-lg border border-input bg-background text-foreground font-body text-sm">
                  {["unité","kg","litre","carton","sac","tonne","caisse","palette"].map(u => <option key={u}>{u}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-foreground font-body block mb-1.5">Votre contact</label>
              <input placeholder="+225 XX XX XX XX" value={proposeForm.contact_phone}
                onChange={e => setProposeForm(f => ({ ...f, contact_phone: e.target.value }))}
                className="w-full px-4 py-3 rounded-lg border border-input bg-background text-foreground font-body text-sm" />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground font-body block mb-1.5">Photos (max 4)</label>
              <label className="flex items-center gap-3 px-4 py-3 rounded-lg border-2 border-dashed border-input cursor-pointer hover:border-primary transition-colors">
                <Upload className="w-5 h-5 text-muted-foreground" />
                <span className="text-sm text-muted-foreground font-body">
                  {uploadingImages ? "Upload en cours…" : Choisir des images (`${proposeForm.images.length}/4`)}
                </span>
                <input type="file" multiple accept="image/*" className="hidden" onChange={handleImageUpload} disabled={uploadingImages || proposeForm.images.length >= 4} />
              </label>
              {proposeForm.images.length > 0 && (
                <div className="flex gap-2 mt-2">
                  {proposeForm.images.map((url, i) => (
                    <div key={i} className="relative w-16 h-16 rounded-lg overflow-hidden">
                      <img src={url} alt="" className="w-full h-full object-cover" />
                      <button onClick={() => setProposeForm(f => ({ ...f, images: f.images.filter((_, j) => j !== i) }))}
                        className="absolute top-0.5 right-0.5 w-5 h-5 bg-destructive text-white rounded-full flex items-center justify-center text-xs">×</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <button onClick={handlePropose} disabled={submitting}
              className="w-full btn-gold !text-sm !py-3 disabled:opacity-50">
              {submitting ? "Envoi en cours…" : "📤 Soumettre ma proposition"}
            </button>
          </div>

          {myProposals.length > 0 && (
            <div className="card-elevated">
              <h3 className="font-heading font-semibold text-foreground mb-3">Mes propositions ({myProposals.length})</h3>
              {myProposals.map(p => (
                <div key={p.id} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
                  <div>
                    <p className="font-body font-semibold text-foreground text-sm">{p.product_name}</p>
                    <p className="text-xs text-muted-foreground">{Number(p.price_fcfa).toLocaleString("fr-FR")} FCFA / {p.unit}</p>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                    p.status === "approved" ? "bg-harvest-green/20 text-harvest-green" :
                    p.status === "rejected" ? "bg-destructive/20 text-destructive" :
                    "bg-gold/20 text-gold"
                  }`}>
                    {p.status === "approved" ? "✓ Approuvé" : p.status === "rejected" ? "✗ Refusé" : "⏳ En attente"}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ══ PRODUCT DETAIL MODAL ══ */}
      {selectedProduct && !showBuyModal && (
        <div className="fixed inset-0 bg-foreground/60 flex items-end md:items-center justify-center z-50 p-0 md:p-4 backdrop-blur-sm"
          onClick={() => setSelectedProduct(null)}>
          <div className="bg-card w-full md:max-w-2xl max-h-[95vh] md:rounded-3xl rounded-t-3xl overflow-hidden flex flex-col shadow-2xl border border-border"
            onClick={e => e.stopPropagation()}>
            <div className="relative h-56 bg-secondary flex-shrink-0">
              {selectedProduct.images?.length > 0
                ? <img src={selectedProduct.images[imgIdx]} alt="" className="w-full h-full object-cover" />
                : <div className="w-full h-full flex items-center justify-center"><Package className="w-16 h-16 text-muted-foreground/30" /></div>
              }
              {selectedProduct.images?.length > 1 && (
                <>
                  <button onClick={() => setImgIdx(i => (i - 1 + selectedProduct.images.length) % selectedProduct.images.length)}
                    className="absolute left-3 top-1/2 -translate-y-1/2 p-2 bg-black/50 text-white rounded-full"><ChevronLeft className="w-4 h-4" /></button>
                  <button onClick={() => setImgIdx(i => (i + 1) % selectedProduct.images.length)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-2 bg-black/50 text-white rounded-full"><ChevronRight className="w-4 h-4" /></button>
                </>
              )}
              <button onClick={() => setSelectedProduct(null)} className="absolute top-3 right-3 w-9 h-9 bg-black/50 text-white rounded-full flex items-center justify-center"><X className="w-4 h-4" /></button>
              <div className="absolute top-3 left-3 bg-harvest-green text-white text-xs px-2.5 py-1 rounded-full font-semibold">
                {selectedProduct.commission_pct}% de commission agent
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              <div>
                <h2 className="text-2xl font-heading font-bold text-foreground">{selectedProduct.name}</h2>
                {selectedProduct.partner_companies?.name && (
                  <p className="text-sm text-muted-foreground font-body flex items-center gap-1 mt-1">
                    <Building2 className="w-4 h-4" /> {selectedProduct.partner_companies.name}
                  </p>
                )}
              </div>
              {selectedProduct.description && <p className="text-sm text-muted-foreground font-body">{selectedProduct.description}</p>}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-harvest-green/5 border border-harvest-green/20 rounded-xl p-4 text-center">
                  <p className="text-xs text-muted-foreground font-body">Prix unitaire</p>
                  <p className="text-2xl font-heading font-bold text-harvest-green">{Number(selectedProduct.price_fcfa).toLocaleString("fr-FR")}</p>
                  <p className="text-xs text-muted-foreground">FCFA / {selectedProduct.unit}</p>
                </div>
                <div className="bg-secondary rounded-xl p-4 text-center">
                  <p className="text-xs text-muted-foreground font-body">Quantité minimum</p>
                  <p className="text-2xl font-heading font-bold text-foreground">{selectedProduct.min_quantity}</p>
                  <p className="text-xs text-muted-foreground">{selectedProduct.unit}(s)</p>
                </div>
              </div>
              <div className="bg-gold/5 border border-gold/20 rounded-xl p-4">
                <p className="text-sm font-semibold text-foreground mb-1">💼 Opportunité agent</p>
                <p className="text-xs text-muted-foreground font-body">
                  Proposez ce produit à un client et gagnez automatiquement{" "}
                  <strong className="text-gold">{selectedProduct.commission_pct}%</strong> = {" "}
                  <strong>{Math.round(Number(selectedProduct.price_fcfa) * selectedProduct.min_quantity * selectedProduct.commission_pct / 100).toLocaleString("fr-FR")} FCFA minimum</strong>
                </p>
              </div>
            </div>
            <div className="p-4 border-t border-border">
              <button onClick={() => setShowBuyModal(true)}
                disabled={Number(profile.wallet_balance) < Number(selectedProduct.price_fcfa) * selectedProduct.min_quantity}
                className="w-full btn-gold !text-sm !py-3 disabled:opacity-50">
                <ShoppingCart className="w-5 h-5 mr-2" />
                {Number(profile.wallet_balance) < Number(selectedProduct.price_fcfa) * selectedProduct.min_quantity
                  ? "Solde insuffisant" : "Commander ce produit"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══ BUY MODAL ══ */}
      {selectedProduct && showBuyModal && (
        <div className="fixed inset-0 bg-foreground/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-card w-full max-w-md rounded-2xl shadow-2xl border border-border overflow-hidden">
            <div className="p-5 border-b border-border flex items-center justify-between">
              <h3 className="font-heading font-bold text-foreground">Commander — {selectedProduct.name}</h3>
              <button onClick={() => setShowBuyModal(false)} className="p-1.5 rounded-lg hover:bg-secondary"><X className="w-4 h-4 text-muted-foreground" /></button>
            </div>
            <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
              <div>
                <label className="text-sm font-medium text-foreground font-body block mb-1.5">
                  Quantité * (min. {selectedProduct.min_quantity} {selectedProduct.unit})
                </label>
                <input type="number" min={selectedProduct.min_quantity}
                  value={buyForm.quantity} onChange={e => setBuyForm(f => ({ ...f, quantity: Math.max(selectedProduct.min_quantity, Number(e.target.value)) }))}
                  className="w-full px-4 py-2.5 rounded-lg border border-input bg-background text-foreground font-body text-sm" />
                <div className="mt-2 bg-harvest-green/10 rounded-lg p-3 flex justify-between text-sm font-body">
                  <span className="text-muted-foreground">Total :</span>
                  <span className="font-bold text-harvest-green">{(Number(selectedProduct.price_fcfa) * buyForm.quantity).toLocaleString("fr-FR")} FCFA</span>
                </div>
              </div>
              <label className="flex items-center gap-3 cursor-pointer">
                <div className={`w-10 h-6 rounded-full transition-colors ${buyForm.for_client ? "bg-harvest-green" : "bg-muted"} relative`}
                  onClick={() => setBuyForm(f => ({ ...f, for_client: !f.for_client }))}>
                  <div className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all ${buyForm.for_client ? "left-5" : "left-1"}`} />
                </div>
                <span className="text-sm font-body text-foreground">Je commande pour un client (mode agent)</span>
              </label>
              {buyForm.for_client && (
                <input placeholder="Nom du client" value={buyForm.client_name}
                  onChange={e => setBuyForm(f => ({ ...f, client_name: e.target.value }))}
                  className="w-full px-4 py-2.5 rounded-lg border border-input bg-background text-foreground font-body text-sm" />
              )}
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="text-xs font-medium text-foreground font-body block mb-1">Ville de livraison *</label>
                  <input placeholder="Ex: Abidjan" value={buyForm.delivery_city}
                    onChange={e => setBuyForm(f => ({ ...f, delivery_city: e.target.value }))}
                    className="w-full px-3 py-2.5 rounded-lg border border-input bg-background text-foreground font-body text-sm" />
                </div>
                <div className="col-span-2">
                  <label className="text-xs font-medium text-foreground font-body block mb-1">Adresse complète</label>
                  <input placeholder="Quartier, rue…" value={buyForm.delivery_address}
                    onChange={e => setBuyForm(f => ({ ...f, delivery_address: e.target.value }))}
                    className="w-full px-3 py-2.5 rounded-lg border border-input bg-background text-foreground font-body text-sm" />
                </div>
                <div className="col-span-2">
                  <label className="text-xs font-medium text-foreground font-body block mb-1">Téléphone *</label>
                  <input placeholder="+225 XX XX XX XX" value={buyForm.delivery_phone}
                    onChange={e => setBuyForm(f => ({ ...f, delivery_phone: e.target.value }))}
                    className="w-full px-3 py-2.5 rounded-lg border border-input bg-background text-foreground font-body text-sm" />
                </div>
              </div>
              <div className="flex gap-3">
                <button onClick={handleBuy} disabled={submitting}
                  className="flex-1 btn-gold !text-sm !py-2.5 disabled:opacity-50">
                  {submitting ? "En cours…" : "✅ Confirmer la commande"}
                </button>
                <button onClick={() => setShowBuyModal(false)}
                  className="px-4 py-2.5 rounded-lg border border-input text-muted-foreground font-body text-sm hover:bg-secondary">
                  Annuler
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default WholesalePage;
