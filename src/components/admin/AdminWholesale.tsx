import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Plus, Trash2, Edit, Package, CheckCircle, X,
  RefreshCw, Search, Eye, Upload, Building2
} from "lucide-react";

const STATUS_COLORS: Record<string, string> = {
  pending:   "bg-gold/20 text-gold",
  confirmed: "bg-primary/20 text-primary",
  shipped:   "bg-blue-500/20 text-blue-600",
  delivered: "bg-harvest-green/20 text-harvest-green",
  cancelled: "bg-destructive/20 text-destructive",
};

const AdminWholesale = () => {
  const [activeTab, setActiveTab] = useState<"products" | "orders" | "proposals">("products");
  const [products, setProducts] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [proposals, setProposals] = useState<any[]>([]);
  const [partners, setPartners] = useState<any[]>([]);
  const [profiles, setProfiles] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editProduct, setEditProduct] = useState<any>(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: "", description: "", price_fcfa: "", min_quantity: "1",
    unit: "unité", stock: "", commission_pct: "5",
    category: "", partner_company_id: "", images: [] as string[],
  });

  useEffect(() => { loadAll(); }, []);

  const loadAll = async () => {
    const [prodRes, ordersRes, propsRes, partnersRes, profilesRes] = await Promise.all([
      (supabase as any).from("wholesale_products").select("*, partner_companies(name)").order("created_at", { ascending: false }),
      (supabase as any).from("wholesale_orders").select("*, wholesale_products(name), buyer:profiles!buyer_id(first_name,last_name), agent:profiles!agent_id(first_name,last_name)").order("created_at", { ascending: false }).limit(100),
      (supabase as any).from("wholesale_proposals").select("*, proposer:profiles!proposer_id(first_name,last_name,email)").order("created_at", { ascending: false }),
      supabase.from("partner_companies").select("id, name").eq("is_active", true),
      supabase.from("profiles").select("user_id, first_name, last_name").order("first_name"),
    ]);
    setProducts(prodRes.data || []);
    setOrders(ordersRes.data || []);
    setProposals(propsRes.data || []);
    setPartners(partnersRes.data || []);
    setProfiles(profilesRes.data || []);
  };

  const resetForm = () => {
    setForm({ name: "", description: "", price_fcfa: "", min_quantity: "1", unit: "unité", stock: "", commission_pct: "5", category: "", partner_company_id: "", images: [] });
    setEditProduct(null);
    setShowForm(false);
  };

  const startEdit = (p: any) => {
    setEditProduct(p);
    setForm({
      name: p.name, description: p.description || "", price_fcfa: String(p.price_fcfa),
      min_quantity: String(p.min_quantity), unit: p.unit, stock: p.stock != null ? String(p.stock) : "",
      commission_pct: String(p.commission_pct), category: p.category || "",
      partner_company_id: p.partner_company_id || "", images: p.images || [],
    });
    setShowForm(true);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []).slice(0, 5 - form.images.length);
    if (!files.length) return;
    setUploading(true);
    const urls: string[] = [];
    for (const file of files) {
      const path = `wholesale_products/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.`]/g, "_")};
      const { error } = await supabase.storage.from("images").upload(path, file);
      if (!error) {
        const { data } = supabase.storage.from("images").getPublicUrl(path);
        urls.push(data.publicUrl);
      }
    }
    setForm(f => ({ ...f, images: [...f.images, ...urls] }));
    setUploading(false);
  };

  const handleSave = async () => {
    if (!form.name || !form.price_fcfa) { toast.error("Nom et prix obligatoires"); return; }
    setSaving(true);
    const payload = {
      name: form.name, description: form.description || null,
      price_fcfa: Number(form.price_fcfa), min_quantity: Number(form.min_quantity) || 1,
      unit: form.unit, stock: form.stock ? Number(form.stock) : null,
      commission_pct: Number(form.commission_pct) || 5,
      category: form.category || null, images: form.images,
      partner_company_id: form.partner_company_id || null,
      is_active: true,
    };
    const { error } = editProduct
      ? await (supabase as any).from("wholesale_products").update(payload).eq("id", editProduct.id)
      : await (supabase as any).from("wholesale_products").insert(payload);
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success(editProduct ? "Produit modifié !" : "Produit ajouté !");
    resetForm();
    loadAll();
  };

  const handleDeleteProduct = async (id: string) => {
    if (!confirm("Désactiver ce produit ?")) return;
    await (supabase as any).from("wholesale_products").update({ is_active: false }).eq("id", id);
    toast.success("Produit désactivé");
    loadAll();
  };

  const handleUpdateOrderStatus = async (orderId: string, status: string) => {
    await (supabase as any).from("wholesale_orders").update({ status, updated_at: new Date().toISOString() }).eq("id", orderId);
    if (status === "delivered") {
      // Déclencher le versement de commission
      await (supabase as any).rpc("pay_wholesale_commission", { _order_id: orderId });
      toast.success("✅ Livraison confirmée + commission versée !");
    } else {
      toast.success(Statut mis à jour : `${status}`);
    }
    loadAll();
  };

  const handleProposalDecision = async (id: string, decision: "approved" | "rejected", note?: string) => {
    await (supabase as any).from("wholesale_proposals").update({ status: decision, admin_note: note || null }).eq("id", id);
    if (decision === "approved") {
      // Convertir la proposition en produit
      const prop = proposals.find(p => p.id === id);
      if (prop) {
        await (supabase as any).from("wholesale_products").insert({
          name: prop.product_name, description: prop.description,
          price_fcfa: prop.price_fcfa, min_quantity: prop.min_quantity,
          unit: prop.unit, images: prop.images || [],
          commission_pct: 5, is_active: true,
        });
        toast.success("✅ Proposition approuvée et produit créé !");
      }
    } else {
      toast.success("Proposition refusée");
    }
    loadAll();
  };

  const getName = (profile: any) => profile ? `${profile.first_name} ${profile.last_name`} : "—";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-heading font-bold text-foreground flex items-center gap-2">
          <Package className="w-6 h-6 text-harvest-green" /> Vente en Gros
        </h1>
        <div className="flex gap-2">
          <button onClick={loadAll} className="p-2 rounded-lg bg-secondary hover:bg-muted transition-colors">
            <RefreshCw className="w-4 h-4 text-muted-foreground" />
          </button>
          <button onClick={() => { resetForm(); setShowForm(true); }}
            className="btn-gold !text-sm !py-2 flex items-center gap-2">
            <Plus className="w-4 h-4" /> Nouveau produit
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Produits actifs", value: products.filter(p => p.is_active).length, color: "text-harvest-green" },
          { label: "Commandes totales", value: orders.length, color: "text-foreground" },
          { label: "Livrées", value: orders.filter(o => o.status === "delivered").length, color: "text-harvest-green" },
          { label: "Propositions", value: proposals.filter(p => p.status === "pending").length, color: "text-gold" },
        ].map((s, i) => (
          <div key={i} className="card-elevated text-center p-4">
            <p className={`text-2xl font-heading font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-muted-foreground font-body">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-secondary p-1 rounded-xl w-fit">
        {[
          { key: "products",  label: 📦 Produits (`${products.length}`) },
          { key: "orders",    label: 🛒 Commandes (`${orders.length}`) },
          { key: "proposals", label: 📝 Propositions (`${proposals.filter(p => p.status === "pending").length}`) },
        ].map(tab => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key as any)}
            className={`px-4 py-2 rounded-lg text-sm font-body font-semibold transition-all ${activeTab === tab.key ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── FORM PRODUIT ── */}
      {showForm && (
        <div className="card-elevated space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-heading font-semibold text-foreground">{editProduct ? "Modifier le produit" : "Nouveau produit en gros"}</h3>
            <button onClick={resetForm} className="p-1.5 rounded-lg hover:bg-secondary"><X className="w-4 h-4 text-muted-foreground" /></button>
          </div>
          <div className="grid md:grid-cols-2 gap-3">
            <input placeholder="Nom du produit *" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              className="px-3 py-2 rounded-lg border border-input bg-background text-foreground font-body text-sm" />
            <input placeholder="Catégorie" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
              className="px-3 py-2 rounded-lg border border-input bg-background text-foreground font-body text-sm" />
            <textarea placeholder="Description" rows={2} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              className="px-3 py-2 rounded-lg border border-input bg-background text-foreground font-body text-sm md:col-span-2" />
            <div>
              <label className="text-xs text-muted-foreground font-body block mb-1">Prix (FCFA) *</label>
              <input type="number" placeholder="Ex: 15000" value={form.price_fcfa} onChange={e => setForm(f => ({ ...f, price_fcfa: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg border border-input bg-background text-foreground font-body text-sm" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground font-body block mb-1">Qté minimum</label>
              <input type="number" min="1" value={form.min_quantity} onChange={e => setForm(f => ({ ...f, min_quantity: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg border border-input bg-background text-foreground font-body text-sm" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground font-body block mb-1">Unité</label>
              <select value={form.unit} onChange={e => setForm(f => ({ ...f, unit: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg border border-input bg-background text-foreground font-body text-sm">
                {["unité","kg","litre","carton","sac","tonne","caisse","palette","boîte"].map(u => <option key={u}>{u}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground font-body block mb-1">Stock (vide = illimité)</label>
              <input type="number" placeholder="Illimité" value={form.stock} onChange={e => setForm(f => ({ ...f, stock: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg border border-input bg-background text-foreground font-body text-sm" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground font-body block mb-1">Commission agent (%)</label>
              <input type="number" step="0.5" value={form.commission_pct} onChange={e => setForm(f => ({ ...f, commission_pct: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg border border-input bg-background text-foreground font-body text-sm" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground font-body block mb-1">Partenaire (optionnel)</label>
              <select value={form.partner_company_id} onChange={e => setForm(f => ({ ...f, partner_company_id: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg border border-input bg-background text-foreground font-body text-sm">
                <option value="">— Aucun partenaire —</option>
                {partners.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
          </div>
          {/* Upload images */}
          <div>
            <label className="text-xs text-muted-foreground font-body block mb-2">Images ({form.images.length}/5)</label>
            <div className="flex flex-wrap gap-2 mb-2">
              {form.images.map((url, i) => (
                <div key={i} className="relative w-16 h-16 rounded-lg overflow-hidden border border-border group">
                  <img src={url} alt="" className="w-full h-full object-cover" />
                  <button onClick={() => setForm(f => ({ ...f, images: f.images.filter((_, j) => j !== i) }))}
                    className="absolute inset-0 bg-black/50 text-white opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
              {form.images.length < 5 && (
                <label className="w-16 h-16 rounded-lg border-2 border-dashed border-input flex items-center justify-center cursor-pointer hover:border-primary transition-colors">
                  {uploading ? <RefreshCw className="w-4 h-4 animate-spin text-muted-foreground" /> : <Upload className="w-4 h-4 text-muted-foreground" />}
                  <input type="file" accept="image/*" multiple className="hidden" onChange={handleImageUpload} disabled={uploading} />
                </label>
              )}
            </div>
          </div>
          <div className="flex gap-3">
            <button onClick={handleSave} disabled={saving} className="btn-gold !text-sm !py-2 disabled:opacity-50">
              {saving ? "Enregistrement…" : editProduct ? "Modifier" : "Ajouter le produit"}
            </button>
            <button onClick={resetForm} className="px-4 py-2 rounded-lg border border-input text-muted-foreground font-body text-sm hover:bg-secondary">Annuler</button>
          </div>
        </div>
      )}

      {/* ── PRODUITS ── */}
      {activeTab === "products" && (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {products.map(p => (
            <div key={p.id} className={`card-elevated ${!p.is_active ? "opacity-50" : ""}`}>
              {p.images?.[0] && (
                <div className="rounded-xl overflow-hidden aspect-video mb-3 bg-secondary">
                  <img src={p.images[0]} alt={p.name} className="w-full h-full object-cover" />
                </div>
              )}
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h3 className="font-heading font-semibold text-foreground">{p.name}</h3>
                  {p.partner_companies?.name && <p className="text-xs text-muted-foreground font-body">{p.partner_companies.name}</p>}
                </div>
                <div className="flex gap-1">
                  <button onClick={() => startEdit(p)} className="p-1.5 rounded-md hover:bg-secondary" title="Modifier">
                    <Edit className="w-4 h-4 text-primary" />
                  </button>
                  <button onClick={() => handleDeleteProduct(p.id)} className="p-1.5 rounded-md hover:bg-secondary" title="Désactiver">
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center text-xs font-body">
                <div className="bg-secondary rounded-lg p-2">
                  <p className="text-muted-foreground">Prix</p>
                  <p className="font-bold text-harvest-green">{Number(p.price_fcfa).toLocaleString("fr-FR")} F</p>
                </div>
                <div className="bg-secondary rounded-lg p-2">
                  <p className="text-muted-foreground">Min.</p>
                  <p className="font-bold text-foreground">{p.min_quantity} {p.unit}</p>
                </div>
                <div className="bg-secondary rounded-lg p-2">
                  <p className="text-muted-foreground">Commission</p>
                  <p className="font-bold text-primary">{p.commission_pct}%</p>
                </div>
              </div>
              {p.stock !== null && (
                <p className="text-xs text-muted-foreground font-body mt-2">Stock : {p.stock} {p.unit}(s)</p>
              )}
            </div>
          ))}
          {products.length === 0 && (
            <div className="col-span-3 text-center py-12 text-muted-foreground font-body">Aucun produit en gros créé</div>
          )}
        </div>
      )}

      {/* ── COMMANDES ── */}
      {activeTab === "orders" && (
        <div className="overflow-x-auto">
          <table className="w-full text-sm font-body">
            <thead><tr className="border-b border-border text-muted-foreground">
              <th className="text-left py-2 px-3">Date</th>
              <th className="text-left py-2 px-3">Acheteur</th>
              <th className="text-left py-2 px-3">Produit</th>
              <th className="text-center py-2 px-3">Qté</th>
              <th className="text-right py-2 px-3">Total</th>
              <th className="text-left py-2 px-3">Agent</th>
              <th className="text-center py-2 px-3">Statut</th>
              <th className="text-right py-2 px-3">Action</th>
            </tr></thead>
            <tbody>
              {orders.map(o => (
                <tr key={o.id} className="border-b border-border/50 hover:bg-secondary/20 transition-colors">
                  <td className="py-2.5 px-3 text-xs text-muted-foreground whitespace-nowrap">
                    {new Date(o.created_at).toLocaleDateString("fr-FR")}
                  </td>
                  <td className="py-2.5 px-3 font-medium">{getName(o.buyer)}</td>
                  <td className="py-2.5 px-3 text-xs">{o.wholesale_products?.name}</td>
                  <td className="py-2.5 px-3 text-center font-bold">{o.quantity}</td>
                  <td className="py-2.5 px-3 text-right font-bold text-harvest-green">{Number(o.total_amount).toLocaleString("fr-FR")} F</td>
                  <td className="py-2.5 px-3 text-xs text-muted-foreground">{getName(o.agent) || "Direct"}</td>
                  <td className="py-2.5 px-3 text-center">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${STATUS_COLORS[o.status] || "bg-muted text-muted-foreground"}`}>
                      {o.status}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-right">
                    {o.status !== "delivered" && o.status !== "cancelled" && (
                      <select
                        value={o.status}
                        onChange={e => handleUpdateOrderStatus(o.id, e.target.value)}
                        className="px-2 py-1 rounded border border-input bg-background text-foreground font-body text-xs"
                      >
                        <option value="pending">En attente</option>
                        <option value="confirmed">Confirmé</option>
                        <option value="shipped">Expédié</option>
                        <option value="delivered">Livré ✓</option>
                        <option value="cancelled">Annulé</option>
                      </select>
                    )}
                  </td>
                </tr>
              ))}
              {orders.length === 0 && (
                <tr><td colSpan={8} className="py-8 text-center text-muted-foreground">Aucune commande</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* ── PROPOSITIONS ── */}
      {activeTab === "proposals" && (
        <div className="space-y-3">
          {proposals.map(p => (
            <div key={p.id} className="card-elevated">
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-start gap-3">
                  {p.images?.[0] && (
                    <img src={p.images[0]} alt="" className="w-14 h-14 rounded-lg object-cover flex-shrink-0 border border-border" />
                  )}
                  <div>
                    <h3 className="font-heading font-semibold text-foreground">{p.product_name}</h3>
                    <p className="text-xs text-muted-foreground font-body">
                      Par {getName(p.proposer)} · {Number(p.price_fcfa).toLocaleString("fr-FR")} FCFA / {p.unit}
                      · Min. {p.min_quantity}
                    </p>
                    {p.description && <p className="text-xs text-muted-foreground font-body mt-1">{p.description}</p>}
                    {p.contact_phone && <p className="text-xs text-primary font-body mt-1">📞 {p.contact_phone}</p>}
                  </div>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full font-semibold flex-shrink-0 ${
                  p.status === "approved" ? "bg-harvest-green/20 text-harvest-green" :
                  p.status === "rejected" ? "bg-destructive/20 text-destructive" :
                  "bg-gold/20 text-gold"
                }`}>
                  {p.status === "approved" ? "✓ Approuvé" : p.status === "rejected" ? "✗ Refusé" : "⏳ En attente"}
                </span>
              </div>
              {p.status === "pending" && (
                <div className="flex gap-2">
                  <button
                    onClick={() => handleProposalDecision(p.id, "approved")}
                    className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg bg-harvest-green/10 text-harvest-green font-body text-sm font-semibold hover:bg-harvest-green/20 transition-colors"
                  >
                    <CheckCircle className="w-4 h-4" /> Approuver & créer le produit
                  </button>
                  <button
                    onClick={() => {
                      const note = window.prompt("Motif du refus (optionnel) :");
                      handleProposalDecision(p.id, "rejected", note || undefined);
                    }}
                    className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg bg-destructive/10 text-destructive font-body text-sm font-semibold hover:bg-destructive/20 transition-colors"
                  >
                    <X className="w-4 h-4" /> Refuser
                  </button>
                </div>
              )}
              {p.admin_note && (
                <p className="text-xs text-muted-foreground font-body mt-2 italic">Note admin : {p.admin_note}</p>
              )}
            </div>
          ))}
          {proposals.length === 0 && (
            <div className="text-center py-12 text-muted-foreground font-body">Aucune proposition</div>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminWholesale;
