import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Plus, Trash2, Package, Edit } from "lucide-react";
import ImageUploader from "./ImageUploader";

const AdminPartners = () => {
  const [partners, setPartners] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editPartner, setEditPartner] = useState<any>(null);
  const [showProductForm, setShowProductForm] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", description: "", website: "", whatsapp: "", facebook: "", email: "", phone: "" });
  const [logoImages, setLogoImages] = useState<string[]>([]);
  const [bannerImages, setBannerImages] = useState<string[]>([]);
  const [productForm, setProductForm] = useState({ name: "", description: "", price: "", allow_cod: false });
  const [productImages, setProductImages] = useState<string[]>([]);
  const [products, setProducts] = useState<any[]>([]);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    const [partnersRes, productsRes] = await Promise.all([
      supabase.from("partner_companies").select("*").order("created_at", { ascending: false }),
      supabase.from("partner_products").select("*").order("created_at", { ascending: false }),
    ]);
    setPartners(partnersRes.data || []);
    setProducts(productsRes.data || []);
  };

  const resetForm = () => {
    setForm({ name: "", description: "", website: "", whatsapp: "", facebook: "", email: "", phone: "" });
    setLogoImages([]); setBannerImages([]); setEditPartner(null);
  };

  const startEdit = (p: any) => {
    setEditPartner(p);
    setForm({
      name: p.name, description: p.description || "", website: p.website || "",
      whatsapp: p.whatsapp || "", facebook: p.facebook || "", email: p.email || "", phone: p.phone || "",
    });
    setLogoImages(p.logo_url ? [p.logo_url] : []);
    setBannerImages([p.image1_url, p.image2_url].filter(Boolean));
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.name) { toast.error("Nom requis"); return; }
    const data = {
      ...form,
      logo_url: logoImages[0] || null,
      image1_url: bannerImages[0] || null,
      image2_url: bannerImages[1] || null,
    };
    if (editPartner) {
      const { error } = await supabase.from("partner_companies").update(data).eq("id", editPartner.id);
      if (error) { toast.error("Erreur"); return; }
      toast.success("Partenaire modifié !");
    } else {
      const { error } = await supabase.from("partner_companies").insert(data);
      if (error) { toast.error("Erreur"); return; }
      toast.success("Partenaire ajouté !");
    }
    setShowForm(false); resetForm(); loadData();
  };

  const handleCreateProduct = async () => {
    if (!productForm.name || !productForm.price || !showProductForm) { toast.error("Nom et prix requis"); return; }
    const { error } = await supabase.from("partner_products").insert({
      partner_company_id: showProductForm, name: productForm.name,
      description: productForm.description, price: Number(productForm.price),
      allow_cod: productForm.allow_cod, images: productImages,
    });
    if (error) { toast.error("Erreur: " + error.message); return; }
    toast.success("Produit ajouté !");
    setShowProductForm(null);
    setProductForm({ name: "", description: "", price: "", allow_cod: false });
    setProductImages([]); loadData();
  };

  const deletePartner = async (id: string) => {
    await supabase.from("partner_companies").update({ is_active: false }).eq("id", id);
    toast.success("Partenaire désactivé"); loadData();
  };

  const getPartnerProducts = (partnerId: string) => products.filter(p => p.partner_company_id === partnerId);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-heading font-bold text-foreground">Entreprises partenaires</h1>
        <button onClick={() => { resetForm(); setShowForm(!showForm); }} className="btn-hero !text-sm !py-2 !px-4">
          <Plus className="w-4 h-4 mr-1" /> Ajouter
        </button>
      </div>

      {showForm && (
        <div className="card-elevated mb-6 space-y-3">
          <h3 className="font-heading font-semibold text-foreground">{editPartner ? "Modifier le partenaire" : "Nouveau partenaire"}</h3>
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
          <ImageUploader folder="partners/logos" images={logoImages} onChange={setLogoImages} max={1} label="Logo" />
          <ImageUploader folder="partners/banners" images={bannerImages} onChange={setBannerImages} max={2} label="Images de présentation" />
          <div className="flex gap-3">
            <button onClick={handleSave} className="btn-gold !text-sm !py-2">{editPartner ? "Enregistrer" : "Ajouter"}</button>
            {editPartner && <button onClick={() => { setShowForm(false); resetForm(); }} className="px-4 py-2 rounded-lg border border-input text-muted-foreground font-body text-sm">Annuler</button>}
          </div>
        </div>
      )}

      <div className="space-y-4">
        {partners.map((p: any) => (
          <div key={p.id} className={`card-elevated ${!p.is_active ? "opacity-50" : ""}`}>
            <div className="flex justify-between items-start mb-3">
              <div className="flex items-center gap-3">
                {p.logo_url ? (
                  <img src={p.logo_url} alt={p.name} className="w-12 h-12 rounded-xl object-cover border border-border" />
                ) : (
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                    <span className="text-lg font-bold text-primary">{p.name.charAt(0)}</span>
                  </div>
                )}
                <div>
                  <h3 className="font-heading font-semibold text-foreground">{p.name}</h3>
                  {p.description && <p className="text-xs text-muted-foreground font-body line-clamp-1">{p.description}</p>}
                </div>
              </div>
              <div className="flex gap-1">
                <button onClick={() => startEdit(p)} className="p-1.5 text-primary hover:bg-primary/10 rounded" title="Modifier">
                  <Edit className="w-4 h-4" />
                </button>
                <button onClick={() => setShowProductForm(showProductForm === p.id ? null : p.id)}
                  className="p-1.5 text-primary hover:bg-primary/10 rounded" title="Ajouter un produit">
                  <Package className="w-4 h-4" />
                </button>
                <button onClick={() => deletePartner(p.id)} className="p-1.5 text-destructive hover:bg-destructive/10 rounded">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {showProductForm === p.id && (
              <div className="border border-border rounded-lg p-3 mb-3 space-y-2 bg-secondary/30">
                <p className="text-xs font-semibold text-foreground font-body">Ajouter un produit</p>
                <input placeholder="Nom du produit" value={productForm.name} onChange={e => setProductForm({...productForm, name: e.target.value})}
                  className="w-full px-3 py-2 rounded-lg border border-input bg-background text-foreground font-body text-sm" />
                <input placeholder="Prix (FCFA)" type="number" value={productForm.price} onChange={e => setProductForm({...productForm, price: e.target.value})}
                  className="w-full px-3 py-2 rounded-lg border border-input bg-background text-foreground font-body text-sm" />
                <textarea placeholder="Description" value={productForm.description} onChange={e => setProductForm({...productForm, description: e.target.value})}
                  className="w-full px-3 py-2 rounded-lg border border-input bg-background text-foreground font-body text-sm" rows={2} />
                <label className="flex items-center gap-2 text-sm font-body text-foreground">
                  <input type="checkbox" checked={productForm.allow_cod} onChange={e => setProductForm({...productForm, allow_cod: e.target.checked})} />
                  Paiement à la livraison autorisé
                </label>
                <ImageUploader folder="products" images={productImages} onChange={setProductImages} max={4} label="Images du produit" />
                <button onClick={handleCreateProduct} className="btn-gold !text-xs !py-1.5">Ajouter le produit</button>
              </div>
            )}

            {getPartnerProducts(p.id).length > 0 && (
              <div className="border-t border-border pt-2">
                <p className="text-xs font-semibold text-foreground font-body mb-1">Produits ({getPartnerProducts(p.id).length})</p>
                {getPartnerProducts(p.id).map(prod => (
                  <div key={prod.id} className="flex items-center gap-2 text-xs font-body py-1">
                    {prod.images?.[0] && <img src={prod.images[0]} alt="" className="w-8 h-8 rounded object-cover" />}
                    <span className="text-foreground flex-1">{prod.name}</span>
                    <span className="text-primary font-semibold">{Number(prod.price).toLocaleString("fr-FR")} FCFA</span>
                    {prod.allow_cod && <span className="text-xs bg-harvest-green/20 text-harvest-green px-1.5 py-0.5 rounded">COD</span>}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
        {partners.length === 0 && <p className="text-muted-foreground font-body text-center py-8">Aucun partenaire</p>}
      </div>
    </div>
  );
};

export default AdminPartners;
