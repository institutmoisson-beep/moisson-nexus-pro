import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import DashboardLayout from "@/components/DashboardLayout";
import { getWholesaleProducts, createWholesaleProduct, updateWholesaleProduct, deleteWholesaleProduct, type WholesaleProduct } from "@/lib/demo-data";
import { Plus, Trash2, Edit2, Save, X } from "lucide-react";
import { toast } from "sonner";

const AdminWholesale = () => {
  const { user, getUserProfile } = useAuth();
  const navigate = useNavigate();
  const [products, setProducts] = useState<WholesaleProduct[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<WholesaleProduct | null>(null);
  const [form, setForm] = useState({
    name: "", description: "", min_quantity: 1, unit_price: 0, bulk_price: 0,
    stock: 0, category: "", partner_name: "", is_active: true,
  });

  useEffect(() => {
    const profile = getUserProfile();
    if (!profile || profile.role !== "admin") {
      toast.error("Accès réservé aux administrateurs");
      navigate("#/dashboard");
    }
  }, [user, navigate, getUserProfile]);

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = () => setProducts(getWholesaleProducts());

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editing) {
      updateWholesaleProduct(editing.id, form);
      toast.success("Produit mis à jour");
    } else {
      createWholesaleProduct({ ...form, images: [], partner_id: null });
      toast.success("Produit créé");
    }
    resetForm();
    loadProducts();
  };

  const resetForm = () => {
    setForm({ name: "", description: "", min_quantity: 1, unit_price: 0, bulk_price: 0, stock: 0, category: "", partner_name: "", is_active: true });
    setEditing(null);
    setShowForm(false);
  };

  const startEdit = (p: WholesaleProduct) => {
    setForm({
      name: p.name, description: p.description, min_quantity: p.min_quantity,
      unit_price: p.unit_price, bulk_price: p.bulk_price, stock: p.stock,
      category: p.category, partner_name: p.partner_name || "", is_active: p.is_active,
    });
    setEditing(p);
    setShowForm(true);
  };

  const handleDelete = (id: string) => {
    if (!confirm("Supprimer ce produit ?")) return;
    deleteWholesaleProduct(id);
    toast.success("Produit supprimé");
    loadProducts();
  };

  return (
    <DashboardLayout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-heading font-bold text-foreground">📦 Gestion Produits en Gros</h1>
          <p className="text-muted-foreground font-body mt-1">Ajoutez et gérez les produits en gros</p>
        </div>
        {!showForm && (
          <button onClick={() => setShowForm(true)} className="btn-hero !text-sm !py-2.5 flex items-center gap-2">
            <Plus className="w-4 h-4" /> Ajouter
          </button>
        )}
      </div>

      {showForm && (
        <div className="card-elevated mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-heading font-bold text-lg">{editing ? "Modifier" : "Nouveau produit"}</h2>
            <button onClick={resetForm} className="p-2 rounded-lg hover:bg-secondary"><X className="w-5 h-5" /></button>
          </div>
          <form onSubmit={handleSubmit} className="grid md:grid-cols-2 gap-4">
            <input required placeholder="Nom" value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="px-4 py-3 rounded-lg border border-input bg-background text-foreground font-body focus:ring-2 focus:ring-ring outline-none" />
            <input required placeholder="Catégorie" value={form.category} onChange={e => setForm({...form, category: e.target.value})} className="px-4 py-3 rounded-lg border border-input bg-background text-foreground font-body focus:ring-2 focus:ring-ring outline-none" />
            <input required placeholder="Partenaire" value={form.partner_name} onChange={e => setForm({...form, partner_name: e.target.value})} className="px-4 py-3 rounded-lg border border-input bg-background text-foreground font-body focus:ring-2 focus:ring-ring outline-none" />
            <input required type="number" placeholder="Qté min." value={form.min_quantity} onChange={e => setForm({...form, min_quantity: Number(e.target.value)})} className="px-4 py-3 rounded-lg border border-input bg-background text-foreground font-body focus:ring-2 focus:ring-ring outline-none" />
            <input required type="number" placeholder="Prix unitaire" value={form.unit_price} onChange={e => setForm({...form, unit_price: Number(e.target.value)})} className="px-4 py-3 rounded-lg border border-input bg-background text-foreground font-body focus:ring-2 focus:ring-ring outline-none" />
            <input required type="number" placeholder="Prix gros" value={form.bulk_price} onChange={e => setForm({...form, bulk_price: Number(e.target.value)})} className="px-4 py-3 rounded-lg border border-input bg-background text-foreground font-body focus:ring-2 focus:ring-ring outline-none" />
            <input required type="number" placeholder="Stock" value={form.stock} onChange={e => setForm({...form, stock: Number(e.target.value)})} className="px-4 py-3 rounded-lg border border-input bg-background text-foreground font-body focus:ring-2 focus:ring-ring outline-none" />
            <textarea placeholder="Description" value={form.description} onChange={e => setForm({...form, description: e.target.value})} className="px-4 py-3 rounded-lg border border-input bg-background text-foreground font-body focus:ring-2 focus:ring-ring outline-none resize-none md:col-span-2" rows={2} />
            <div className="md:col-span-2 flex gap-3">
              <button type="submit" className="btn-gold flex items-center gap-2"><Save className="w-4 h-4" /> {editing ? "Mettre à jour" : "Créer"}</button>
              <button type="button" onClick={resetForm} className="px-6 py-3 rounded-lg border border-input text-muted-foreground hover:bg-secondary font-body">Annuler</button>
            </div>
          </form>
        </div>
      )}

      <div className="space-y-4">
        {products.map(p => (
          <div key={p.id} className="card-elevated flex items-center justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-1">
                <h3 className="font-heading font-bold text-foreground">{p.name}</h3>
                {!p.is_active && <span className="text-xs bg-muted px-2 py-0.5 rounded-full text-muted-foreground">Inactif</span>}
              </div>
              <p className="text-sm text-muted-foreground font-body">{p.description}</p>
              <div className="flex gap-4 mt-2 text-sm">
                <span className="text-muted-foreground">Min: <strong className="text-foreground">{p.min_quantity}</strong></span>
                <span className="text-muted-foreground">Unité: <strong className="text-foreground">{p.unit_price.toLocaleString()} F</strong></span>
                <span className="text-muted-foreground">Gros: <strong className="text-harvest-green">{p.bulk_price.toLocaleString()} F</strong></span>
                <span className="text-muted-foreground">Stock: <strong className="text-foreground">{p.stock}</strong></span>
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => startEdit(p)} className="p-2.5 rounded-lg border hover:bg-secondary"><Edit2 className="w-4 h-4" /></button>
              <button onClick={() => handleDelete(p.id)} className="p-2.5 rounded-lg border border-destructive/30 hover:bg-destructive/10 text-destructive"><Trash2 className="w-4 h-4" /></button>
            </div>
          </div>
        ))}
      </div>
    </DashboardLayout>
  );
};

export default AdminWholesale;
