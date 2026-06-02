import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Truck, ShoppingCart, Package, X, ChevronLeft, ChevronRight,
  Search, CheckCircle, Clock, Star, Wallet, ArrowLeft, LogOut
} from "lucide-react";
import { toast } from "sonner";
import logo from "@/assets/logo-moisson.png";

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  pending:   { label: "En attente",  color: "bg-gold/20 text-gold" },
  confirmed: { label: "Confirmé",    color: "bg-primary/20 text-primary" },
  shipped:   { label: "Expédié",     color: "bg-blue-500/20 text-blue-600" },
  delivered: { label: "Livré ✓",     color: "bg-harvest-green/20 text-harvest-green" },
  cancelled: { label: "Annulé",      color: "bg-destructive/20 text-destructive" },
};

const DistributionPage = () => {
  const { user, signOut, loading } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<"catalogue" | "my_orders">("catalogue");
  const [products, setProducts] = useState<any[]>([]);
  const [myOrders, setMyOrders] = useState<any[]>([]);
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
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => { if (!loading && !user) navigate("/connexion"); }, [user, loading]);
  useEffect(() => { if (user) loadAll(); }, [user]);

  const loadAll = async () => {
    const [prodRes, profileRes, ordersRes] = await Promise.all([
      (supabase as any).from("distribution_products").select("*").eq("is_active", true).order("created_at", { ascending: false }),
      supabase.from("profiles").select("*").eq("user_id", user!.id).single(),
      (supabase as any).from("distribution_orders").select("*, distribution_products(name, images)").eq("buyer_id", user!.id).order("created_at", { ascending: false }),
    ]);
    setProducts(prodRes.data || []);
    setProfile(profileRes.data);
    setMyOrders(ordersRes.data || []);
  };

  const handleBuy = async () => {
    if (!selectedProduct || !profile) return;
    const total = Number(selectedProduct.price_fcfa) * buyForm.quantity;
    if (Number(profile.wallet_balance) < total) {
      toast.error(`Solde insuffisant. Nécessaire : ${total.toLocaleString("fr-FR")} FCFA`);
      return;
    }
    if (!buyForm.delivery_city || !buyForm.delivery_phone) {
      toast.error("Ville et téléphone obligatoires");
      return;
    }
    setSubmitting(true);
    try {
      const commissionAmount = Math.round(total * (selectedProduct.commission_pct || 8) / 100);
      await (supabase as any).from("distribution_orders").insert({
        buyer_id: user!.id,
        product_id: selectedProduct.id,
        quantity: buyForm.quantity,
        unit_price: selectedProduct.price_fcfa,
        total_amount: total,
        payment_method: "wallet",
        delivery_city: buyForm.delivery_city,
        delivery_address: buyForm.delivery_address,
        delivery_phone: buyForm.delivery_phone,
        commission_amount: commissionAmount,
      });
      await supabase.from("profiles").update({
        wallet_balance: Number(profile.wallet_balance) - total,
      }).eq("user_id", user!.id);
      await supabase.from("transactions").insert({
        user_id: user!.id,
        amount: total,
        type: "pack_purchase",
        status: "approved",
        description: `Distribution — ${selectedProduct.name} × ${buyForm.quantity`},
      });
      toast.success(`✅ Commande confirmée ! ${total.toLocaleString("fr-FR")} FCFA débités.`);
      setShowBuyModal(false);
      setSelectedProduct(null);
      setBuyForm({ quantity: 1, delivery_city: "", delivery_address: "", delivery_phone: "" });
      loadAll();
    } catch (err: any) {
      toast.error(err.message || "Erreur");
    } finally {
      setSubmitting(false);
    }
  };

  const filtered = products.filter(p => {
    const q = search.toLowerCase();
    return !q || p.name.toLowerCase().includes(q) || (p.description || "").toLowerCase().includes(q);
  });

  if (loading || !profile) return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      {/* HEADER */}
      <header className="border-b border-border bg-card sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={logo} alt="Institut Moisson" className="w-8 h-8" />
            <div>
              <span className="font-heading text-lg font-bold text-foreground block leading-tight">Distribution</span>
              <span className="text-xs text-muted-foreground font-body">Institut Moisson</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-2 bg-secondary px-3 py-1.5 rounded-full text-sm font-body">
              <Wallet className="w-4 h-4 text-primary" />
              <span className="font-bold text-foreground">{Number(profile.wallet_balance).toLocaleString("fr-FR")} FCFA</span>
            </div>
            <button onClick={() => navigate("/dashboard")}
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground font-body transition-colors">
              <ArrowLeft className="w-4 h-4" /> Dashboard
            </button>
            <button onClick={async () => { await signOut(); navigate("/"); }}
              className="text-muted-foreground hover:text-foreground transition-colors">
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* HERO */}
        <div className="relative overflow-hidden rounded-2xl mb-8 p-6 bg-gradient-to-br from-primary via-primary/80 to-harvest-green border border-primary/20">
          <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "radial-gradient(circle at 70% 30%, #fff 0%, transparent 60%)" }} />
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-2">
              <Truck className="w-6 h-6 text-white" />
              <span className="text-white/80 text-sm font-body font-semibold uppercase tracking-widest">Canal de Distribution</span>
            </div>
            <h1 className="text-3xl font-heading font-bold text-white mb-2">Espace Distribution 🚚</h1>
            <p className="text-white/75 font-body text-sm max-w-xl">
              Achetez des produits sélectionnés directement livrés chez vous.
              Payez avec votre portefeuille Institut Moisson et recevez vos commandes rapidement.
            </p>
          </div>
        </div>

        {/* TABS */}
        <div className="flex gap-1 bg-secondary p-1 rounded-xl mb-6 w-fit">
          {[
            { key: "catalogue", label: 🏪 Catalogue (`${products.length}`) },
            { key: "my_orders", label: 📦 Mes Commandes (`${myOrders.length}`) },
          ].map(tab => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key as any)}
              className={`px-5 py-2.5 rounded-lg text-sm font-body font-semibold transition-all ${activeTab === tab.key ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>
              {tab.label}
            </button>
          ))}
        </div>

        {/* ══ CATALOGUE ══ */}
        {activeTab === "catalogue" && (
          <div>
            <div className="relative mb-6">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input placeholder="Rechercher un produit…" value={search} onChange={e => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-input bg-background text-foreground font-body text-sm" />
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {filtered.map(product => (
                <div key={product.id} onClick={() => { setSelectedProduct(product); setImgIdx(0); setShowBuyModal(false); }}
                  className="group cursor-pointer card-elevated hover:shadow-xl hover:border-primary/30 transition-all hover:-translate-y-1">
                  <div className="relative rounded-xl overflow-hidden aspect-square mb-3 bg-secondary">
                    {product.images?.[0]
                      ? <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      : <div className="w-full h-full flex items-center justify-center"><Package className="w-10 h-10 text-muted-foreground/30" /></div>
                    }
                    {product.category && (
                      <div className="absolute bottom-2 left-2 bg-card/90 backdrop-blur-sm text-foreground text-[10px] px-2 py-0.5 rounded-full font-semibold border border-border/50">
                        {product.category}
                      </div>
                    )}
                    {product.stock !== null && product.stock <= 5 && (
                      <div className="absolute top-2 right-2 bg-destructive text-white text-[10px] px-2 py-0.5 rounded-full font-bold">
                        {product.stock > 0 ? Stock: ${product.stock} : "Rupture"}
                      </div>
                    )}
                  </div>
                  <h3 className="font-heading font-bold text-foreground mb-1 line-clamp-1">{product.name}</h3>
                  {product.description && <p className="text-xs text-muted-foreground font-body mb-2 line-clamp-2">{product.description}</p>}
                  <div className="flex items-center justify-between">
                    <p className="text-lg font-heading font-bold text-primary">{Number(product.price_fcfa).toLocaleString("fr-FR")} <span className="text-xs font-body">FCFA</span></p>
                    <span className="text-xs text-primary font-semibold font-body">Voir →</span>
                  </div>
                </div>
              ))}
              {filtered.length === 0 && (
                <div className="col-span-4 text-center py-16 card-elevated">
                  <Truck className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground font-body">Aucun produit disponible pour le moment</p>
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
                <Truck className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                <p className="font-heading font-semibold text-foreground mb-1">Aucune commande distribution</p>
                <button onClick={() => setActiveTab("catalogue")} className="mt-3 btn-hero !text-sm !py-2.5 !px-6">
                  Voir le catalogue
                </button>
              </div>
            ) : myOrders.map(order => {
              const cfg = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending;
              return (
                <div key={order.id} className="card-elevated">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-14 h-14 rounded-xl overflow-hidden bg-secondary flex-shrink-0 border border-border">
                        {order.distribution_products?.images?.[0]
                          ? <img src={order.distribution_products.images[0]} alt="" className="w-full h-full object-cover" />
                          : <div className="w-full h-full flex items-center justify-center"><Package className="w-6 h-6 text-muted-foreground" /></div>
                        }
                      </div>
                      <div>
                        <h3 className="font-heading font-semibold text-foreground">{order.distribution_products?.name}</h3>
                        <p className="text-xs text-muted-foreground font-body">
                          Qté : {order.quantity} · {new Date(order.created_at).toLocaleDateString("fr-FR")}
                        </p>
                        {order.delivery_city && <p className="text-xs text-muted-foreground font-body">📍 {order.delivery_city}</p>}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-heading font-bold text-primary">{Number(order.total_amount).toLocaleString("fr-FR")} F</p>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${cfg.color}`}>{cfg.label}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* ══ PRODUCT DETAIL MODAL ══ */}
      {selectedProduct && !showBuyModal && (
        <div className="fixed inset-0 bg-foreground/60 flex items-end md:items-center justify-center z-50 p-0 md:p-4 backdrop-blur-sm"
          onClick={() => setSelectedProduct(null)}>
          <div className="bg-card w-full md:max-w-lg max-h-[95vh] md:rounded-3xl rounded-t-3xl overflow-hidden flex flex-col shadow-2xl border border-border"
            onClick={e => e.stopPropagation()}>
            <div className="relative h-64 bg-secondary flex-shrink-0">
              {selectedProduct.images?.length > 0
                ? <img src={selectedProduct.images[imgIdx]} alt="" className="w-full h-full object-cover" />
                : <div className="w-full h-full flex items-center justify-center"><Package className="w-20 h-20 text-muted-foreground/30" /></div>
              }
              {selectedProduct.images?.length > 1 && (
                <>
                  <button onClick={() => setImgIdx(i => (i - 1 + selectedProduct.images.length) % selectedProduct.images.length)}
                    className="absolute left-3 top-1/2 -translate-y-1/2 p-2 bg-black/50 text-white rounded-full"><ChevronLeft className="w-4 h-4" /></button>
                  <button onClick={() => setImgIdx(i => (i + 1) % selectedProduct.images.length)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-2 bg-black/50 text-white rounded-full"><ChevronRight className="w-4 h-4" /></button>
                  <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                    {selectedProduct.images.map((_: any, i: number) => (
                      <button key={i} onClick={() => setImgIdx(i)}
                        className={`w-2 h-2 rounded-full transition-all ${i === imgIdx ? "bg-white w-5" : "bg-white/50"}`} />
                    ))}
                  </div>
                </>
              )}
              <button onClick={() => setSelectedProduct(null)} className="absolute top-3 right-3 w-9 h-9 bg-black/50 text-white rounded-full flex items-center justify-center"><X className="w-4 h-4" /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              <div>
                <h2 className="text-2xl font-heading font-bold text-foreground">{selectedProduct.name}</h2>
                {selectedProduct.category && <span className="text-xs bg-secondary text-muted-foreground px-2 py-0.5 rounded-full">{selectedProduct.category}</span>}
              </div>
              {selectedProduct.description && <p className="text-sm text-muted-foreground font-body leading-relaxed">{selectedProduct.description}</p>}
              <div className="flex items-center justify-between bg-primary/5 border border-primary/20 rounded-xl p-4">
                <div>
                  <p className="text-xs text-muted-foreground font-body">Prix unitaire</p>
                  <p className="text-3xl font-heading font-bold text-primary">{Number(selectedProduct.price_fcfa).toLocaleString("fr-FR")}</p>
                  <p className="text-xs text-muted-foreground">FCFA</p>
                </div>
                {selectedProduct.stock !== null && (
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground font-body">Stock</p>
                    <p className={`text-lg font-bold ${selectedProduct.stock > 5 ? "text-harvest-green" : "text-destructive"}`}>
                      {selectedProduct.stock > 0 ? selectedProduct.stock : "Rupture"}
                    </p>
                  </div>
                )}
              </div>
            </div>
            <div className="p-4 border-t border-border">
              <button onClick={() => setShowBuyModal(true)}
                disabled={selectedProduct.stock === 0}
                className="w-full btn-gold !text-sm !py-3 disabled:opacity-50">
                <ShoppingCart className="w-5 h-5 mr-2" />
                {selectedProduct.stock === 0 ? "Rupture de stock" : "Commander maintenant"}
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
            <div className="p-5 space-y-4">
              <div>
                <label className="text-sm font-medium text-foreground font-body block mb-1.5">Quantité</label>
                <input type="number" min="1" max={selectedProduct.stock || 999}
                  value={buyForm.quantity} onChange={e => setBuyForm(f => ({ ...f, quantity: Math.max(1, Number(e.target.value)) }))}
                  className="w-full px-4 py-2.5 rounded-lg border border-input bg-background text-foreground font-body text-sm" />
                <div className="mt-2 bg-primary/10 rounded-lg p-3 flex justify-between text-sm font-body">
                  <span>Total :</span>
                  <span className="font-bold text-primary">{(Number(selectedProduct.price_fcfa) * buyForm.quantity).toLocaleString("fr-FR")} FCFA</span>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-foreground font-body block mb-1.5">Ville *</label>
                <input placeholder="Ex: Abidjan" value={buyForm.delivery_city}
                  onChange={e => setBuyForm(f => ({ ...f, delivery_city: e.target.value }))}
                  className="w-full px-4 py-2.5 rounded-lg border border-input bg-background text-foreground font-body text-sm" />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground font-body block mb-1.5">Adresse</label>
                <input placeholder="Quartier, rue…" value={buyForm.delivery_address}
                  onChange={e => setBuyForm(f => ({ ...f, delivery_address: e.target.value }))}
                  className="w-full px-4 py-2.5 rounded-lg border border-input bg-background text-foreground font-body text-sm" />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground font-body block mb-1.5">Téléphone *</label>
                <input placeholder="+225 XX XX XX" value={buyForm.delivery_phone}
                  onChange={e => setBuyForm(f => ({ ...f, delivery_phone: e.target.value }))}
                  className="w-full px-4 py-2.5 rounded-lg border border-input bg-background text-foreground font-body text-sm" />
              </div>
              <div className="flex gap-3">
                <button onClick={handleBuy} disabled={submitting}
                  className="flex-1 btn-gold !text-sm !py-2.5 disabled:opacity-50">
                  {submitting ? "En cours…" : "✅ Confirmer"}
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
    </div>
  );
};

export default DistributionPage;
