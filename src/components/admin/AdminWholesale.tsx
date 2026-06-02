import { useEffect, useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, X, Upload, Box, Package } from "lucide-react";

interface WP {
  id: string;
  name: string;
  description: string | null;
  unit_price: number;
  bulk_price: number;
  min_quantity: number;
  stock: number;
  images: any;
  category: string | null;
  partner_name: string | null;
  commission_percent: number;
  is_active: boolean;
}

const empty = {
  name: "", description: "", unit_price: 0, bulk_price: 0, min_quantity: 10,
  stock: 0, category: "Général", partner_name: "", commission_percent: 5,
  is_active: true, images: [] as string[],
};

const AdminWholesale = () => {
  const [products, setProducts] = useState<WP[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [tab, setTab] = useState<"products" | "orders">("products");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<WP | null>(null);
  const [form, setForm] = useState<typeof empty>(empty);
  const [uploading, setUploading] = useState(false);

  const load = async () => {
    const [p, o] = await Promise.all([
      supabase.from("wholesale_products" as any).select("*").order("created_at", { ascending: false }),
      supabase.from("wholesale_orders" as any).select("*").order("created_at", { ascending: false }),
    ]);
    setProducts((p.data as any) || []);
    setOrders((o.data as any) || []);
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => { setEditing(null); setForm(empty); setShowForm(true); };
  const openEdit = (p: WP) => {
    setEditing(p);
    setForm({
      name: p.name, description: p.description || "", unit_price: Number(p.unit_price),
      bulk_price: Number(p.bulk_price), min_quantity: p.min_quantity, stock: p.stock,
      category: p.category || "Général", partner_name: p.partner_name || "",
      commission_percent: Number(p.commission_percent), is_active: p.is_active,
      images: Array.isArray(p.images) ? p.images : [],
    });
    setShowForm(true);
  };

  const uploadImages = async (files: FileList | null) => {
    if (!files?.length) return;
    setUploading(true);
    const urls: string[] = [];
    for (const f of Array.from(files)) {
      const path = `wholesale/${Date.now()}-${f.name.replace(/[^a-z0-9.]/gi, "_")}`;
      const { error } = await supabase.storage.from("images").upload(path, f, { upsert: true });
      if (error) { toast.error(error.message); continue; }
      const { data } = supabase.storage.from("images").getPublicUrl(path);
      urls.push(data.publicUrl);
    }
    setForm(f => ({ ...f, images: [...f.images, ...urls] }));
    setUploading(false);
  };

  const save = async () => {
    if (!form.name || form.unit_price <= 0) { toast.error("Nom et prix unitaire requis"); return; }
    const payload = { ...form };
    const res = editing
      ? await supabase.from("wholesale_products" as any).update(payload).eq("id", editing.id)
      : await supabase.from("wholesale_products" as any).insert(payload);
    if (res.error) { toast.error(res.error.message); return; }
    toast.success(editing ? "Produit modifié" : "Produit ajouté");
    setShowForm(false); load();
  };

  const remove = async (id: string) => {
    if (!confirm("Supprimer ce produit ?")) return;
    const { error } = await supabase.from("wholesale_products" as any).delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("Supprimé"); load();
  };

  const setStatus = async (id: string, status: string) => {
    const { error } = await supabase.from("wholesale_orders" as any).update({ status }).eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success(`Statut mis à jour : ${status}`); load();
  };

  return (
    <DashboardLayout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-heading font-bold text-foreground">📦 Produits en Gros</h1>
          <p className="text-muted-foreground font-body text-sm">Gérez le catalogue et les commandes</p>
        </div>
        {tab === "products" && (
          <button onClick={openCreate} className="btn-hero !text-sm !py-2 !px-4 flex items-center gap-2">
            <Plus className="w-4 h-4" /> Nouveau
          </button>
        )}
      </div>

      <div className="flex gap-2 mb-6 border-b border-border">
        {[{ k: "products", l: "Produits" }, { k: "orders", l: "Commandes" }].map(t => (
          <button key={t.k} onClick={() => setTab(t.k as any)}
            className={`px-4 py-2 font-body text-sm ${tab === t.k ? "border-b-2 border-primary text-primary font-semibold" : "text-muted-foreground"}`}>
            {t.l}
          </button>
        ))}
      </div>

      {tab === "products" && (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {products.map(p => (
            <div key={p.id} className="card-elevated">
              {p.images?.[0] && <img src={p.images[0]} alt={p.name} className="w-full h-32 object-cover rounded-lg mb-3" />}
              <div className="flex items-start justify-between gap-2 mb-2">
                <h3 className="font-heading font-bold text-foreground">{p.name}</h3>
                <span className={`text-xs px-2 py-1 rounded-full ${p.is_active ? "bg-harvest-green/20 text-harvest-green" : "bg-destructive/20 text-destructive"}`}>
                  {p.is_active ? "Actif" : "Inactif"}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mb-2">{p.category} • {p.partner_name || "—"}</p>
              <div className="text-sm font-body space-y-1 mb-3">
                <p>Prix unitaire : <strong>{Number(p.unit_price).toLocaleString("fr-FR")} F</strong></p>
                <p>Prix en gros : <strong>{Number(p.bulk_price).toLocaleString("fr-FR")} F</strong> (min {p.min_quantity})</p>
                <p>Stock : {p.stock} • Commission : {p.commission_percent}%</p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => openEdit(p)} className="flex-1 text-xs py-2 rounded-lg bg-primary/10 text-primary flex items-center justify-center gap-1">
                  <Pencil className="w-3 h-3" /> Modifier
                </button>
                <button onClick={() => remove(p.id)} className="px-3 py-2 rounded-lg bg-destructive/10 text-destructive">
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            </div>
          ))}
          {products.length === 0 && <p className="text-muted-foreground font-body col-span-full text-center py-8">Aucun produit. Cliquez sur "Nouveau".</p>}
        </div>
      )}

      {tab === "orders" && (
        <div className="card-elevated overflow-x-auto">
          <table className="w-full text-sm font-body">
            <thead className="text-left text-muted-foreground border-b border-border">
              <tr><th className="p-2">Date</th><th className="p-2">Qté</th><th className="p-2">Total</th><th className="p-2">Statut</th><th className="p-2">Action</th></tr>
            </thead>
            <tbody>
              {orders.map(o => (
                <tr key={o.id} className="border-b border-border/50">
                  <td className="p-2">{new Date(o.created_at).toLocaleDateString("fr-FR")}</td>
                  <td className="p-2">{o.quantity}</td>
                  <td className="p-2">{Number(o.total_amount).toLocaleString("fr-FR")} F</td>
                  <td className="p-2">{o.status}</td>
                  <td className="p-2">
                    <select value={o.status} onChange={e => setStatus(o.id, e.target.value)} className="bg-background border border-border rounded px-2 py-1 text-xs">
                      {["pending", "confirmed", "shipped", "delivered", "cancelled"].map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </td>
                </tr>
              ))}
              {orders.length === 0 && <tr><td colSpan={5} className="p-6 text-center text-muted-foreground">Aucune commande</td></tr>}
            </tbody>
          </table>
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 overflow-auto">
          <div className="bg-card rounded-2xl max-w-2xl w-full p-6 my-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-heading text-xl font-bold">{editing ? "Modifier" : "Nouveau"} produit</h2>
              <button onClick={() => setShowForm(false)}><X className="w-5 h-5" /></button>
            </div>
            <div className="grid sm:grid-cols-2 gap-3 font-body text-sm">
              <input className="input-field sm:col-span-2" placeholder="Nom du produit" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
              <textarea className="input-field sm:col-span-2" rows={3} placeholder="Description" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
              <input className="input-field" placeholder="Catégorie" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} />
              <input className="input-field" placeholder="Partenaire" value={form.partner_name} onChange={e => setForm({ ...form, partner_name: e.target.value })} />
              <label className="text-xs">Prix unitaire (F)
                <input type="number" className="input-field" value={form.unit_price} onChange={e => setForm({ ...form, unit_price: +e.target.value })} />
              </label>
              <label className="text-xs">Prix en gros (F)
                <input type="number" className="input-field" value={form.bulk_price} onChange={e => setForm({ ...form, bulk_price: +e.target.value })} />
              </label>
              <label className="text-xs">Quantité minimale
                <input type="number" className="input-field" value={form.min_quantity} onChange={e => setForm({ ...form, min_quantity: +e.target.value })} />
              </label>
              <label className="text-xs">Stock
                <input type="number" className="input-field" value={form.stock} onChange={e => setForm({ ...form, stock: +e.target.value })} />
              </label>
              <label className="text-xs sm:col-span-2">Commission (%)
                <input type="number" className="input-field" value={form.commission_percent} onChange={e => setForm({ ...form, commission_percent: +e.target.value })} />
              </label>
              <label className="sm:col-span-2 flex items-center gap-2">
                <input type="checkbox" checked={form.is_active} onChange={e => setForm({ ...form, is_active: e.target.checked })} />
                Actif
              </label>
              <div className="sm:col-span-2">
                <label className="block text-xs mb-1">Images</label>
                <label className="flex items-center gap-2 px-3 py-2 rounded-lg bg-secondary cursor-pointer w-fit">
                  <Upload className="w-4 h-4" /> {uploading ? "Upload..." : "Ajouter"}
                  <input type="file" accept="image/*" multiple hidden onChange={e => uploadImages(e.target.files)} />
                </label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {form.images.map((u, i) => (
                    <div key={i} className="relative">
                      <img src={u} className="w-16 h-16 object-cover rounded-lg" alt="" />
                      <button onClick={() => setForm(f => ({ ...f, images: f.images.filter((_, idx) => idx !== i) }))}
                        className="absolute -top-1 -right-1 bg-destructive text-white rounded-full w-5 h-5 text-xs">×</button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex gap-2 mt-6">
              <button onClick={() => setShowForm(false)} className="flex-1 py-2 rounded-lg bg-secondary text-sm">Annuler</button>
              <button onClick={save} className="flex-1 btn-hero !text-sm !py-2">Enregistrer</button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default AdminWholesale;
