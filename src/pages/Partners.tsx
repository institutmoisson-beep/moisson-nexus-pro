import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Globe, Phone, Mail, MessageCircle, Facebook, Clock, ArrowLeft, ShoppingCart, MapPin, Truck } from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import logo from "@/assets/logo-moisson.png";

const PartnersPage = () => {
  const { user } = useAuth();
  const [partners, setPartners] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [selectedPartner, setSelectedPartner] = useState<any>(null);
  const [packs, setPacks] = useState<any[]>([]);
  const [profile, setProfile] = useState<any>(null);
  const [buyProduct, setBuyProduct] = useState<any>(null);
  const [paymentMode, setPaymentMode] = useState<"wallet" | "cod">("wallet");
  const [deliveryForm, setDeliveryForm] = useState({ address: "", city: "", country: "", phone: "", street: "" });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    const [partnersRes, packsRes, productsRes] = await Promise.all([
      supabase.from("partner_companies").select("*").eq("is_active", true).order("created_at"),
      supabase.from("packs").select("*").eq("is_active", true),
      supabase.from("partner_products").select("*").eq("is_active", true),
    ]);
    setPartners(partnersRes.data || []);
    setPacks(packsRes.data || []);
    setProducts(productsRes.data || []);

    if (user) {
      const { data } = await supabase.from("profiles").select("*").eq("user_id", user.id).single();
      setProfile(data);
      if (data) {
        setDeliveryForm({
          address: data.address || "", city: data.city || "",
          country: data.country || "", phone: data.phone || "", street: data.street || "",
        });
      }
    }
  };

  const getPartnerDuration = (since: string) => {
    const months = Math.floor((Date.now() - new Date(since).getTime()) / (1000 * 60 * 60 * 24 * 30));
    if (months < 1) return "Nouveau partenaire";
    if (months < 12) return `Partenaire depuis ${months} mois`;
    return `Partenaire depuis ${Math.floor(months / 12)} an(s)`;
  };

  const partnerPacks = (partnerId: string) => packs.filter(p => p.partner_company_id === partnerId);
  const partnerProducts = (partnerId: string) => products.filter(p => p.partner_company_id === partnerId);

  const handleBuyProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!buyProduct || !profile || !user) return;

    if (paymentMode === "wallet") {
      if (Number(profile.wallet_balance) < Number(buyProduct.price)) {
        toast.error("Solde insuffisant !");
        return;
      }
    }

    setSubmitting(true);

    // Create transaction
    await supabase.from("transactions").insert({
      user_id: user.id,
      amount: buyProduct.price,
      type: "pack_purchase" as const,
      status: paymentMode === "cod" ? "pending" as const : "approved" as const,
      description: `Achat produit: ${buyProduct.name}${paymentMode === "cod" ? " (paiement à la livraison)" : ""}`,
    });

    if (paymentMode === "wallet") {
      await supabase.from("profiles").update({
        wallet_balance: Number(profile.wallet_balance) - Number(buyProduct.price),
        address: deliveryForm.address, city: deliveryForm.city, street: deliveryForm.street,
      }).eq("user_id", user.id);
    }

    toast.success(paymentMode === "cod" ? "Commande enregistrée ! Paiement à la livraison." : "Produit acheté avec succès !");
    setBuyProduct(null);
    setSubmitting(false);
    loadData();
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={logo} alt="Institut Moisson" className="w-8 h-8" width={32} height={32} />
            <span className="font-heading text-lg font-bold text-foreground">Annuaire Partenaires</span>
          </div>
          <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground font-body">
            <ArrowLeft className="w-4 h-4" /> Accueil
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8">
        <h1 className="text-3xl font-heading font-bold text-foreground mb-2">🏢 Nos Entreprises Partenaires</h1>
        <p className="text-muted-foreground font-body mb-8">Découvrez les entreprises qui font confiance à Institut Moisson</p>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {partners.map(partner => (
            <div key={partner.id} className="card-elevated hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setSelectedPartner(partner)}>
              {/* Banner */}
              {partner.image1_url && (
                <div className="relative -mx-4 -mt-4 mb-4 rounded-t-xl overflow-hidden">
                  <img src={partner.image1_url} alt="" className="w-full h-32 object-cover" />
                </div>
              )}

              <div className="flex items-center gap-3 mb-4">
                {partner.logo_url ? (
                  <img src={partner.logo_url} alt={partner.name} className="w-14 h-14 rounded-xl object-cover border border-border" />
                ) : (
                  <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center">
                    <span className="text-xl font-bold text-primary">{partner.name.charAt(0)}</span>
                  </div>
                )}
                <div>
                  <h3 className="font-heading font-bold text-foreground">{partner.name}</h3>
                  <p className="text-xs text-muted-foreground font-body flex items-center gap-1">
                    <Clock className="w-3 h-3" /> {getPartnerDuration(partner.partner_since)}
                  </p>
                </div>
              </div>

              {partner.description && <p className="text-sm text-muted-foreground font-body mb-4 line-clamp-3">{partner.description}</p>}

              <div className="flex flex-wrap gap-2 mb-3">
                {partner.whatsapp && (
                  <a href={`https://wa.me/${partner.whatsapp}`} target="_blank" rel="noopener" onClick={e => e.stopPropagation()}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-harvest-green/10 text-harvest-green text-xs font-semibold hover:bg-harvest-green/20 transition-colors">
                    <MessageCircle className="w-3.5 h-3.5" /> WhatsApp
                  </a>
                )}
                {partner.website && (
                  <a href={partner.website.startsWith("http") ? partner.website : `https://${partner.website}`} target="_blank" rel="noopener" onClick={e => e.stopPropagation()}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-primary/10 text-primary text-xs font-semibold hover:bg-primary/20 transition-colors">
                    <Globe className="w-3.5 h-3.5" /> Site web
                  </a>
                )}
                {partner.facebook && (
                  <a href={partner.facebook.startsWith("http") ? partner.facebook : `https://facebook.com/${partner.facebook}`} target="_blank" rel="noopener" onClick={e => e.stopPropagation()}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-blue-500/10 text-blue-600 text-xs font-semibold hover:bg-blue-500/20 transition-colors">
                    <Facebook className="w-3.5 h-3.5" /> Facebook
                  </a>
                )}
              </div>

              {/* Products */}
              {partnerProducts(partner.id).length > 0 && (
                <div className="border-t border-border pt-3 mt-2">
                  <p className="text-xs font-semibold text-foreground mb-2 font-body">Produits ({partnerProducts(partner.id).length})</p>
                  {partnerProducts(partner.id).slice(0, 3).map(prod => (
                    <div key={prod.id} className="flex items-center gap-2 text-xs font-body py-1">
                      {prod.images?.[0] && <img src={prod.images[0]} alt="" className="w-8 h-8 rounded object-cover" />}
                      <span className="text-muted-foreground flex-1">{prod.name}</span>
                      <span className="font-semibold text-primary">{Number(prod.price).toLocaleString("fr-FR")} F</span>
                    </div>
                  ))}
                </div>
              )}

              {partnerPacks(partner.id).length > 0 && (
                <div className="border-t border-border pt-3 mt-2">
                  <p className="text-xs font-semibold text-foreground mb-2 font-body">Packs disponibles:</p>
                  {partnerPacks(partner.id).map(pack => (
                    <div key={pack.id} className="flex justify-between text-xs font-body mb-1">
                      <span className="text-muted-foreground">{pack.name}</span>
                      <span className="font-semibold text-primary">{Number(pack.price).toLocaleString("fr-FR")} F</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
          {partners.length === 0 && <p className="text-muted-foreground font-body col-span-3 text-center py-12">Aucun partenaire pour le moment</p>}
        </div>

        {/* Partner Detail Modal */}
        {selectedPartner && (
          <div className="fixed inset-0 bg-foreground/50 flex items-center justify-center z-50 p-4" onClick={() => setSelectedPartner(null)}>
            <div className="bg-card rounded-xl border border-border p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
              {selectedPartner.image1_url && (
                <img src={selectedPartner.image1_url} alt="" className="w-full h-40 rounded-lg object-cover mb-4" />
              )}
              <div className="flex items-center gap-4 mb-4">
                {selectedPartner.logo_url ? (
                  <img src={selectedPartner.logo_url} alt={selectedPartner.name} className="w-16 h-16 rounded-xl object-cover border border-border" />
                ) : (
                  <div className="w-16 h-16 rounded-xl bg-primary/10 flex items-center justify-center">
                    <span className="text-2xl font-bold text-primary">{selectedPartner.name.charAt(0)}</span>
                  </div>
                )}
                <div>
                  <h2 className="text-xl font-heading font-bold text-foreground">{selectedPartner.name}</h2>
                  <p className="text-sm text-muted-foreground font-body">{getPartnerDuration(selectedPartner.partner_since)}</p>
                </div>
              </div>

              {selectedPartner.description && <p className="text-sm text-foreground font-body mb-4">{selectedPartner.description}</p>}

              {selectedPartner.image2_url && (
                <img src={selectedPartner.image2_url} alt="" className="w-full h-32 rounded-lg object-cover mb-4" />
              )}

              <div className="space-y-2 mb-4">
                {selectedPartner.phone && <p className="text-sm font-body flex items-center gap-2"><Phone className="w-4 h-4 text-muted-foreground" /> {selectedPartner.phone}</p>}
                {selectedPartner.email && <p className="text-sm font-body flex items-center gap-2"><Mail className="w-4 h-4 text-muted-foreground" /> {selectedPartner.email}</p>}
                {selectedPartner.whatsapp && <a href={`https://wa.me/${selectedPartner.whatsapp}`} target="_blank" className="text-sm font-body flex items-center gap-2 text-harvest-green"><MessageCircle className="w-4 h-4" /> {selectedPartner.whatsapp}</a>}
                {selectedPartner.website && <a href={selectedPartner.website.startsWith("http") ? selectedPartner.website : `https://${selectedPartner.website}`} target="_blank" className="text-sm font-body flex items-center gap-2 text-primary"><Globe className="w-4 h-4" /> {selectedPartner.website}</a>}
              </div>

              {/* Products for purchase */}
              {partnerProducts(selectedPartner.id).length > 0 && (
                <div className="border-t border-border pt-4 mb-4">
                  <h3 className="font-heading font-semibold text-foreground mb-3">🛍️ Produits</h3>
                  <div className="space-y-3">
                    {partnerProducts(selectedPartner.id).map(prod => (
                      <div key={prod.id} className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50">
                        {prod.images?.[0] && <img src={prod.images[0]} alt="" className="w-16 h-16 rounded-lg object-cover" />}
                        <div className="flex-1">
                          <p className="font-body font-semibold text-foreground text-sm">{prod.name}</p>
                          {prod.description && <p className="text-xs text-muted-foreground font-body line-clamp-2">{prod.description}</p>}
                          <p className="text-sm font-bold text-primary mt-1">{Number(prod.price).toLocaleString("fr-FR")} FCFA</p>
                          {prod.allow_cod && <p className="text-xs text-harvest-green font-body flex items-center gap-1"><Truck className="w-3 h-3" /> Paiement à la livraison</p>}
                        </div>
                        {user && (
                          <button onClick={() => { setBuyProduct(prod); setPaymentMode(prod.allow_cod ? "cod" : "wallet"); }}
                            className="p-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors">
                            <ShoppingCart className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <button onClick={() => setSelectedPartner(null)} className="w-full py-2.5 rounded-lg border border-input text-muted-foreground font-body text-sm hover:bg-secondary">
                Fermer
              </button>
            </div>
          </div>
        )}

        {/* Buy Product Modal */}
        {buyProduct && profile && (
          <div className="fixed inset-0 bg-foreground/50 flex items-center justify-center z-50 p-4" onClick={() => setBuyProduct(null)}>
            <div className="bg-card rounded-xl border border-border p-6 w-full max-w-md max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
              <h2 className="text-xl font-heading font-bold text-foreground mb-4">🛒 Acheter {buyProduct.name}</h2>
              <div className="bg-secondary rounded-lg p-4 mb-4">
                <p className="text-2xl font-bold text-primary">{Number(buyProduct.price).toLocaleString("fr-FR")} FCFA</p>
                <p className="text-xs text-muted-foreground font-body">Solde: {Number(profile.wallet_balance).toLocaleString("fr-FR")} FCFA</p>
              </div>

              {buyProduct.allow_cod && (
                <div className="flex gap-2 mb-4">
                  <button onClick={() => setPaymentMode("wallet")}
                    className={`flex-1 py-2 rounded-lg text-sm font-body ${paymentMode === "wallet" ? "bg-primary text-primary-foreground" : "border border-input text-muted-foreground"}`}>
                    💳 Portefeuille
                  </button>
                  <button onClick={() => setPaymentMode("cod")}
                    className={`flex-1 py-2 rounded-lg text-sm font-body ${paymentMode === "cod" ? "bg-primary text-primary-foreground" : "border border-input text-muted-foreground"}`}>
                    🚚 À la livraison
                  </button>
                </div>
              )}

              <form onSubmit={handleBuyProduct} className="space-y-3">
                <h3 className="font-heading font-semibold text-foreground flex items-center gap-2 text-sm"><MapPin className="w-4 h-4" /> Livraison</h3>
                <input placeholder="Pays" value={deliveryForm.country} onChange={e => setDeliveryForm({...deliveryForm, country: e.target.value})}
                  className="w-full px-3 py-2 rounded-lg border border-input bg-background text-foreground font-body text-sm" />
                <input placeholder="Ville" value={deliveryForm.city} onChange={e => setDeliveryForm({...deliveryForm, city: e.target.value})}
                  className="w-full px-3 py-2 rounded-lg border border-input bg-background text-foreground font-body text-sm" />
                <input placeholder="Quartier / Rue" value={deliveryForm.street} onChange={e => setDeliveryForm({...deliveryForm, street: e.target.value})}
                  className="w-full px-3 py-2 rounded-lg border border-input bg-background text-foreground font-body text-sm" />
                <input placeholder="Contact" value={deliveryForm.phone} onChange={e => setDeliveryForm({...deliveryForm, phone: e.target.value})}
                  className="w-full px-3 py-2 rounded-lg border border-input bg-background text-foreground font-body text-sm" />

                <div className="flex gap-3 pt-2">
                  <button type="submit" disabled={submitting || (paymentMode === "wallet" && Number(profile.wallet_balance) < Number(buyProduct.price))}
                    className="flex-1 btn-gold !text-sm !py-2.5 disabled:opacity-50">
                    {submitting ? "..." : paymentMode === "cod" ? "Commander (COD)" : "Payer avec portefeuille"}
                  </button>
                  <button type="button" onClick={() => setBuyProduct(null)}
                    className="px-4 py-2.5 rounded-lg border border-input text-muted-foreground font-body text-sm hover:bg-secondary">
                    Annuler
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default PartnersPage;
