import { useAuth } from "@/contexts/AuthContext";
import { useNavigate, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ShoppingCart, MapPin, Download, ChevronLeft, ChevronRight, ArrowLeft, Building2, X } from "lucide-react";
import { toast } from "sonner";
import DashboardLayout from "@/components/DashboardLayout";
import { generateGuaranteeContract } from "@/lib/generateContract";

const PackDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [pack, setPack] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [imgIndex, setImgIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [showPurchase, setShowPurchase] = useState(false);
  const [deliveryForm, setDeliveryForm] = useState({ address: "", city: "", country: "", phone: "", street: "" });
  const [submitting, setSubmitting] = useState(false);
  const [commissions, setCommissions] = useState<any[]>([]);

  useEffect(() => { if (!loading && !user) navigate("/connexion"); }, [user, loading]);
  useEffect(() => { if (user && id) loadData(); }, [user, id]);

  const loadData = async () => {
    const [packRes, profileRes, commRes] = await Promise.all([
      supabase.from("packs").select("*, partner_companies(*)").eq("id", id!).single(),
      supabase.from("profiles").select("*").eq("user_id", user!.id).single(),
      supabase.from("pack_commissions").select("*").eq("pack_id", id!).order("level_number"),
    ]);
    setPack(packRes.data);
    setProfile(profileRes.data);
    setCommissions(commRes.data || []);
    if (profileRes.data) {
      setDeliveryForm({
        address: profileRes.data.address || "", city: profileRes.data.city || "",
        country: profileRes.data.country || "", phone: profileRes.data.phone || "",
        street: profileRes.data.street || "",
      });
    }
  };

  const handlePurchase = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pack || !profile) return;
    if (Number(profile.wallet_balance) < Number(pack.price)) {
      toast.error("Solde insuffisant ! Rechargez votre portefeuille."); return;
    }
    // For MLM packs, check if already active
    if (pack.is_mlm_pack && !profile.is_mlm_active) {
      // First MLM pack purchase - activate MLM
    }
    setSubmitting(true);

    const { data: orderData, error: orderError } = await supabase.from("pack_orders").insert({
      user_id: user!.id, pack_id: pack.id, amount_paid: pack.price,
      delivery_address: deliveryForm.address, delivery_city: deliveryForm.city,
      delivery_country: deliveryForm.country, delivery_phone: deliveryForm.phone,
      delivery_street: deliveryForm.street,
    }).select("id").single();
    if (orderError) { toast.error("Erreur: " + orderError.message); setSubmitting(false); return; }

    const newBalance = Number(profile.wallet_balance) - Number(pack.price);
    const updateData: any = {
      wallet_balance: newBalance,
      address: deliveryForm.address, city: deliveryForm.city, street: deliveryForm.street,
    };
    if (pack.is_mlm_pack) updateData.is_mlm_active = true;
    await supabase.from("profiles").update(updateData).eq("user_id", user!.id);

    // Record transaction
    await supabase.from("transactions").insert({
      user_id: user!.id, amount: pack.price, type: "pack_purchase" as const,
      status: "approved" as const, description: `Achat ${pack.is_mlm_pack ? "pack MLM" : "produit"}: ${pack.name}`,
    });

    // Distribute commissions if MLM pack
    if (pack.is_mlm_pack) {
      await distributeCommissions(user!.id, Number(pack.price), pack.id);
    }

    // Award MSN coins to upline
    await supabase.rpc("award_msn_coins", { _buyer_user_id: user!.id, _order_id: orderData?.id || "" });

    toast.success("Achat effectué avec succès ! 🌾");
    setShowPurchase(false);
    setSubmitting(false);
    loadData();
  };

  const distributeCommissions = async (buyerId: string, packPrice: number, packId: string) => {
    await supabase.rpc("distribute_commissions", {
      _buyer_user_id: buyerId,
      _pack_id: packId,
      _pack_name: pack?.name || "",
      _pack_price: packPrice,
    });
  };

  if (loading || !pack || !profile) {
    return <DashboardLayout><div className="animate-pulse text-muted-foreground font-body text-center py-12">Chargement...</div></DashboardLayout>;
  }

  const images: string[] = pack.images || [];

  return (
    <DashboardLayout>
      <button onClick={() => navigate("/packs")} className="flex items-center gap-2 text-muted-foreground hover:text-foreground font-body text-sm mb-4 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Retour aux packs
      </button>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Images */}
        <div>
          {images.length > 0 ? (
            <div className="relative rounded-xl overflow-hidden bg-secondary aspect-square mb-3 cursor-pointer" onClick={() => setLightboxOpen(true)}>
              <img src={images[imgIndex]} alt={pack.name} className="w-full h-full object-cover" />
              {images.length > 1 && (
                <>
                  <button onClick={e => { e.stopPropagation(); setImgIndex((imgIndex - 1 + images.length) % images.length); }}
                    className="absolute left-2 top-1/2 -translate-y-1/2 p-2 bg-foreground/50 text-background rounded-full">
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button onClick={e => { e.stopPropagation(); setImgIndex((imgIndex + 1) % images.length); }}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-foreground/50 text-background rounded-full">
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </>
              )}
              <p className="absolute bottom-2 right-2 text-xs bg-foreground/50 text-background px-2 py-1 rounded font-body">Cliquer pour agrandir</p>
            </div>
          ) : (
            <div className="rounded-xl bg-secondary aspect-square flex items-center justify-center text-muted-foreground text-4xl">📦</div>
          )}
          {images.length > 1 && (
            <div className="flex gap-2 overflow-x-auto">
              {images.map((img, i) => (
                <img key={i} src={img} alt="" onClick={() => setImgIndex(i)}
                  className={`w-16 h-16 rounded-lg object-cover cursor-pointer border-2 shrink-0 ${i === imgIndex ? "border-primary" : "border-transparent"}`} />
              ))}
            </div>
          )}
        </div>

        {/* Details */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <h1 className="text-3xl font-heading font-bold text-foreground">{pack.name}</h1>
            {!pack.is_mlm_pack && <span className="text-xs bg-accent/20 text-accent-foreground px-2 py-0.5 rounded">Produit</span>}
          </div>
          {pack.partner_companies?.name && (
            <p className="flex items-center gap-2 text-muted-foreground font-body text-sm mb-4">
              <Building2 className="w-4 h-4" /> par {pack.partner_companies.name}
            </p>
          )}
          <p className="text-4xl font-heading font-bold text-primary mb-4">{Number(pack.price).toLocaleString("fr-FR")} FCFA</p>
          
          {pack.description && (
            <div className="mb-4">
              <h3 className="font-heading font-semibold text-foreground mb-2">Description</h3>
              <p className="text-sm text-muted-foreground font-body whitespace-pre-line">{pack.description}</p>
            </div>
          )}

          {pack.physical_prizes && (
            <div className="bg-secondary rounded-lg p-4 mb-4">
              <h3 className="font-heading font-semibold text-foreground mb-2">🎁 Prix physiques inclus</h3>
              <p className="text-sm text-muted-foreground font-body">{pack.physical_prizes}</p>
            </div>
          )}

          {commissions.length > 0 && pack.is_mlm_pack && (
            <div className="bg-secondary rounded-lg p-4 mb-4">
              <h3 className="font-heading font-semibold text-foreground mb-2">💰 Commissions de parrainage</h3>
              <div className="space-y-1">
                {commissions.map(c => (
                  <div key={c.id} className="flex justify-between text-sm font-body">
                    <span className="text-muted-foreground">Niveau {c.level_number}</span>
                    <span className="font-semibold text-primary">{c.percentage}%</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <p className="text-sm text-muted-foreground font-body mb-6">
            Solde: <span className="font-bold text-primary">{Number(profile.wallet_balance).toLocaleString("fr-FR")} FCFA</span>
          </p>

          <div className="space-y-3">
            <button onClick={() => setShowPurchase(true)} className="btn-gold w-full !py-3">
              <ShoppingCart className="w-5 h-5 mr-2" /> Acheter
            </button>
            <button onClick={() => generateGuaranteeContract(`${profile.first_name} ${profile.last_name}`, pack.name, Number(pack.price))}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-lg border border-input text-sm font-body text-muted-foreground hover:bg-secondary transition-colors">
              <Download className="w-4 h-4" /> Contrat de garantie
            </button>
          </div>
        </div>
      </div>

      {/* Image Lightbox */}
      {lightboxOpen && images.length > 0 && (
        <div className="fixed inset-0 bg-foreground/90 flex items-center justify-center z-50" onClick={() => setLightboxOpen(false)}>
          <button className="absolute top-4 right-4 p-2 text-background hover:text-primary-foreground z-50" onClick={() => setLightboxOpen(false)}>
            <X className="w-8 h-8" />
          </button>
          <img src={images[imgIndex]} alt={pack.name} className="max-w-[90vw] max-h-[90vh] object-contain" onClick={e => e.stopPropagation()} />
          {images.length > 1 && (
            <>
              <button onClick={e => { e.stopPropagation(); setImgIndex((imgIndex - 1 + images.length) % images.length); }}
                className="absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-foreground/50 text-background rounded-full">
                <ChevronLeft className="w-6 h-6" />
              </button>
              <button onClick={e => { e.stopPropagation(); setImgIndex((imgIndex + 1) % images.length); }}
                className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-foreground/50 text-background rounded-full">
                <ChevronRight className="w-6 h-6" />
              </button>
            </>
          )}
        </div>
      )}

      {/* Purchase Modal */}
      {showPurchase && (
        <div className="fixed inset-0 bg-foreground/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-xl border border-border p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-heading font-bold text-foreground mb-4">🛒 Confirmer l'achat</h2>
            <div className="bg-secondary rounded-lg p-4 mb-4">
              <p className="font-heading font-semibold text-foreground">{pack.name}</p>
              <p className="text-2xl font-bold text-primary">{Number(pack.price).toLocaleString("fr-FR")} FCFA</p>
              <p className="text-xs text-muted-foreground font-body mt-1">Solde après achat: {(Number(profile.wallet_balance) - Number(pack.price)).toLocaleString("fr-FR")} FCFA</p>
            </div>
            <form onSubmit={handlePurchase} className="space-y-3">
              <h3 className="font-heading font-semibold text-foreground flex items-center gap-2"><MapPin className="w-4 h-4" /> Adresse de livraison</h3>
              <input placeholder="Pays" value={deliveryForm.country} onChange={e => setDeliveryForm({...deliveryForm, country: e.target.value})}
                className="w-full px-3 py-2.5 rounded-lg border border-input bg-background text-foreground font-body text-sm" />
              <input placeholder="Ville" value={deliveryForm.city} onChange={e => setDeliveryForm({...deliveryForm, city: e.target.value})}
                className="w-full px-3 py-2.5 rounded-lg border border-input bg-background text-foreground font-body text-sm" />
              <input placeholder="Quartier / Rue" value={deliveryForm.street} onChange={e => setDeliveryForm({...deliveryForm, street: e.target.value})}
                className="w-full px-3 py-2.5 rounded-lg border border-input bg-background text-foreground font-body text-sm" />
              <input placeholder="Adresse complète" value={deliveryForm.address} onChange={e => setDeliveryForm({...deliveryForm, address: e.target.value})}
                className="w-full px-3 py-2.5 rounded-lg border border-input bg-background text-foreground font-body text-sm" />
              <input placeholder="Contact" value={deliveryForm.phone} onChange={e => setDeliveryForm({...deliveryForm, phone: e.target.value})}
                className="w-full px-3 py-2.5 rounded-lg border border-input bg-background text-foreground font-body text-sm" />
              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={submitting || Number(profile.wallet_balance) < Number(pack.price)}
                  className="flex-1 btn-gold !text-sm !py-2.5 disabled:opacity-50">
                  {submitting ? "Achat en cours..." : "Confirmer l'achat"}
                </button>
                <button type="button" onClick={() => setShowPurchase(false)}
                  className="px-4 py-2.5 rounded-lg border border-input text-muted-foreground font-body text-sm hover:bg-secondary">Annuler</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default PackDetailPage;
