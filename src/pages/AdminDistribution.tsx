import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Plus, Trash2, Edit, Truck, X, RefreshCw, Upload } from "lucide-react";

const STATUS_COLORS: Record<string, string> = {
  pending:   "bg-gold/20 text-gold",
  confirmed: "bg-primary/20 text-primary",
  shipped:   "bg-blue-500/20 text-blue-600",
  delivered: "bg-harvest-green/20 text-harvest-green",
  cancelled: "bg-destructive/20 text-destructive",
};

const AdminDistribution = () => {
  const [activeTab, setActiveTab] = useState<"products" | "orders">("products");
  const [products, setProducts] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editProduct, setEditProduct] = useState<any>(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: "", description: "", price_fcfa: "", stock: "",
    category: "", commission_pct: "8", images: [] as string[],
  });

  useEffect(() => { loadAll(); }, []);

  const loadAll = async () => {
    const [prodRes, ordersRes] = await Promise.all([
      (supabase as any).from("distribution_products").select("*").order("created_at", { ascending: false }),
      (supabase as any).from("distribution_orders")
        .select("*, distribution_products(name,images), buyer:profiles!buyer_id(first_name,last_name)")
        .order("created_at", { ascending: false }).limit(100),
    ]);
    setProducts(prodRes.data || []);
    setOrders(ordersRes.data || []);
  };

  const resetForm = () => {
    setForm({ name: "", description: "", price_fcfa: "", stock: "", category: "", commission_pct: "8", images: [] });
    setEditProduct(null);
    setShowForm(false);
  };

  const startEdit = (p: any) => {
    setEditProduct(p);
    setForm({
      name: p.name, description: p.description || "", price_fcfa: String(p.price_fcfa),
      stock: p.stock != null ? String(p.stock) : "", category: p.category || "",
      commission_pct: String(p.commission_pct), images: p.images || [],
    });
    setShowForm(true);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []).slice(0, 5 - form.images.length);
    if (!files.length) return;
    setUploading(true);
    const urls: string[] = [];
    for (const file of files) {
      const path = distribution_products/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.]/g, "_")};
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
    if (!form.name || !form.price_fcfa) { toast.error("Nom et prix requis"); return; }
    setSaving(true);
    const payload = {
      name: form.name, description: form.description || null,
      price_fcfa: Number(form.price_fcfa),
      stock: form.stock ? Number(form.stock) : null,
      category: form.category || null,
      commission_pct: Number(form.commission_pct) || 8,
      images: form.images, is_active: true,
    };
    const { error } = editProduct
      ? await (supabase as any).from("distribution_products").update(payload).eq("id", editProduct.id)
      : await (supabase as any).from("distribution_products").insert(payload);
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success(editProduct ? "Produit modifié !" : "Produit ajouté !");
    resetForm();
    loadAll();
  };

  const handleUpdateStatus = async (orderId: string, status: string) => {
    await (supabase as any).from("distribution_orders")
      .update({ status, updated_at: new Date().toISOString() }).eq("id", orderId);
    if (status === "delivered") {
      // Créditer la commission si applicable
      const order = orders.find(o => o.id === orderId);
      if (order?.commission_amount > 0) {
        await supabase.from("profiles")
          .update({ wallet_balance: supabase.rpc("increment" as any, { x: order.commission_amount }) })
          .eq("user_id", order.buyer_id);
        await (supabase as any).from("distribution_orders")
          .update({ commission_paid: true }).eq("id", orderId);
      }
      toast.success("✅ Livraison confirmée !");
    } else {
      toast.success(Statut → ${status});
    }
    loadAll();
  };

  const totalRevenue = orders.filter(o => o.status === "delivered")
    .reduce((s: number, o: any) => s + Number(o.total_amount), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-heading font-bold text-foreground flex items-center gap-2">
          <Truck className="w-6 h-6 text-primary" /> Distribution
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
          { label: "Produits actifs", value: products.filter(p => p.is_active).length, color: "text-primary" },
          { label: "Commandes", value: orders.length, color: "text-foreground" },
          { label: "Livrées", value: orders.filter(o => o.status === "delivered").length, color: "text-harvest-green" },
          { label: "CA livré", value: ${totalRevenue.toLocaleString("fr-FR")} F, color: "text-gold" },
        ].map((s, i) => (
          <div key={i} className="card-elevated text-center p-4">
            <p className={text-xl font-heading font-bold ${s.color}}>{s.value}</p>
            <p className="text-xs text-muted-foreground font-body">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-secondary p-1 rounded-xl w-fit">
        {[
          { key: "products", label: 📦 Produits (${products.length}) },
          { key: "orders",   label: 🛒 Commandes (${orders.length}) },
        ].map(tab => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key as any)}
            className={px-4 py-2 rounded-lg text-sm font-body font-semibold transition-all ${activeTab === tab.key ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"}}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── FORM ── */}
      {showForm && (
        <div className="card-elevated space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-heading font-semibold text-foreground">{editProduct ? "Modifier" : "Nouveau produit distribution"}</h3>
            <button onClick={resetForm} className="p-1.5 rounded-lg hover:bg-secondary"><X className="w-4 h-4 text-muted-foreground" /></button>
          </div>
          <div className="grid md:grid-cols-2 gap-3">
            <input placeholder="Nom *" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              className="px-3 py-2 rounded-lg border border-input bg-background text-foreground font-body text-sm" />
            <input placeholder="Catégorie" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
              className="px-3 py-2 rounded-lg border border-input bg-background text-foreground font-body text-sm" />
            <textarea placeholder="Description" rows={2} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              className="px-3 py-2 rounded-lg border border-input bg-background text-foreground font-body text-sm md:col-span-2" />
            <div>
              <label className="text-xs text-muted-foreground font-body block mb-1">Prix (FCFA) *</label>
              <input type="number" value={form.price_fcfa} onChange={e => setForm(f => ({ ...f, price_fcfa: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg border border-input bg-background text-foreground font-body text-sm" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground font-body block mb-1">Stock (vide = illimité)</label>
              <input type="number" placeholder="Illimité" value={form.stock} onChange={e => setForm(f => ({ ...f, stock: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg border border-input bg-background text-foreground font-body text-sm" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground font-body block mb-1">Commission (%)</label>
              <input type="number" step="0.5" value={form.commission_pct} onChange={e => setForm(f => ({ ...f, commission_pct: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg border border-input bg-background text-foreground font-body text-sm" />
            </div>
          </div>
          {/* Images */}
          <div>
            <label className="text-xs text-muted-foreground font-body block mb-2">Images ({form.images.length}/5)</label>
            <div className="flex flex-wrap gap-2 mb-2">
              {form.images.map((url, i) => (
                <div key={i} className="relative w-16 h-16 rounded-lg overflow-hidden border border-border group">
                  <img src={url} alt="" className="w-full h-full object-cover" />
                  <button onClick={() => setForm(f => ({ ...f, images: f.images.filter((_, j) => j !== i) }))}
                    className="absolute inset-0 bg-black/50 text-white opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                    <X className="w-3 h-3" />
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
              {saving ? "…" : editProduct ? "Modifier" : "Ajouter"}
            </button>
            <button onClick={resetForm} className="px-4 py-2 rounded-lg border border-input text-muted-foreground font-body text-sm hover:bg-secondary">Annuler</button>
          </div>
        </div>
      )}

      {/* ── PRODUITS ── */}
      {activeTab === "products" && (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {products.map(p => (
            <div key={p.id} className={card-elevated ${!p.is_active ? "opacity-50" : ""}}>
              {p.images?.[0] && (
                <div className="rounded-xl overflow-hidden aspect-square mb-3 bg-secondary">
                  <img src={p.images[0]} alt={p.name} className="w-full h-full object-cover" />
                </div>
              )}
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h3 className="font-heading font-semibold text-foreground">{p.name}</h3>
                  {p.category && <span className="text-[10px] bg-secondary text-muted-foreground px-1.5 py-0.5 rounded-full">{p.category}</span>}
                </div>
                <div className="flex gap-1">
                  <button onClick={() => startEdit(p)} className="p-1.5 rounded-md hover:bg-secondary">
                    <Edit className="w-4 h-4 text-primary" />
                  </button>
                  <button onClick={async () => {
                    await (supabase as any).from("distribution_products").update({ is_active: !p.is_active }).eq("id", p.id);
                    loadAll();
                  }} className="p-1.5 rounded-md hover:bg-secondary">
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </button>
                </div>
              </div>
              <p className="text-xl font-heading font-bold text-primary">{Number(p.price_fcfa).toLocaleString("fr-FR")} F</p>
              <div className="flex items-center justify-between text-xs font-body text-muted-foreground mt-1">
                <span>Commission : <strong className="text-harvest-green">{p.commission_pct}%</strong></span>
                <span>{p.stock !== null ? Stock: ${p.stock} : "Illimité"}</span>
              </div>
            </div>
          ))}
          {products.length === 0 && (
            <div className="col-span-3 text-center py-12 text-muted-foreground font-body">Aucun produit distribution</div>
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
              <th className="text-left py-2 px-3">Ville</th>
              <th className="text-center py-2 px-3">Statut</th>
              <th className="text-right py-2 px-3">Action</th>
            </tr></thead>
            <tbody>
              {orders.map(o => (
                <tr key={o.id} className="border-b border-border/50 hover:bg-secondary/20 transition-colors">
                  <td className="py-2.5 px-3 text-xs text-muted-foreground whitespace-nowrap">{new Date(o.created_at).toLocaleDateString("fr-FR")}</td>
                  <td className="py-2.5 px-3 font-medium">{o.buyer ? ${o.buyer.first_name} ${o.buyer.last_name} : "—"}</td>
                  <td className="py-2.5 px-3 text-xs">{o.distribution_products?.name}</td>
                  <td className="py-2.5 px-3 text-center font-bold">{o.quantity}</td>
                  <td className="py-2.5 px-3 text-right font-bold text-primary">{Number(o.total_amount).toLocaleString("fr-FR")} F</td>
                  <td className="py-2.5 px-3 text-xs text-muted-foreground">{o.delivery_city || "—"}</td>
                  <td className="py-2.5 px-3 text-center">
                    <span className={text-xs px-2 py-0.5 rounded-full font-semibold ${STATUS_COLORS[o.status] || "bg-muted text-muted-foreground"}}>{o.status}</span>
                  </td>
                  <td className="py-2.5 px-3 text-right">
                    {o.status !== "delivered" && o.status !== "cancelled" && (
                      <select value={o.status} onChange={e => handleUpdateStatus(o.id, e.target.value)}
                        className="px-2 py-1 rounded border border-input bg-background text-foreground font-body text-xs">
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
                <tr><td colSpan={8} className="py-8 text-center text-muted-foreground">Aucune commande distribution</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AdminDistribution;
