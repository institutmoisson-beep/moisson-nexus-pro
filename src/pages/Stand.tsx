import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Globe, Phone, Mail, MessageCircle, Facebook, Clock, ArrowLeft,
  ShoppingCart, MapPin, Truck, Search, X, ChevronLeft, ChevronRight,
  Star, Shield, Award, Zap, Package, CheckCircle, Building2
} from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import logo from "@/assets/logo-moisson.png";

const StandPage = () => {
  const { user } = useAuth();
  const [partners, setPartners] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [selectedPartner, setSelectedPartner] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [buyProduct, setBuyProduct] = useState<any>(null);
  const [paymentMode, setPaymentMode] = useState<"wallet" | "cod">("wallet");
  const [deliveryForm, setDeliveryForm] = useState({ address: "", city: "", country: "", phone: "", street: "" });
  const [submitting, setSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [purchaseDone, setPurchaseDone] = useState(false);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    const [partnersRes, productsRes] = await Promise.all([
      supabase.from("partner_companies").select("*").eq("is_active", true).order("created_at"),
      supabase.from("partner_products").select("*").eq("is_active", true),
    ]);
    setPartners(partnersRes.data || []);
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

  const partnerProducts = (partnerId: string) => products.filter(p => p.partner_company_id === partnerId);

  const filteredPartners = partners.filter(p => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return p.name.toLowerCase().includes(q) || (p.description || "").toLowerCase().includes(q);
  });

  const handleBuyProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!buyProduct || !profile || !user) return;
    if (paymentMode === "wallet" && Number(profile.wallet_balance) < Number(buyProduct.price)) {
      toast.error("Solde insuffisant !"); return;
    }
    setSubmitting(true);
    await supabase.from("transactions").insert({
      user_id: user.id, amount: buyProduct.price, type: "pack_purchase" as const,
      status: paymentMode === "cod" ? "pending" as const : "approved" as const,
      description: `Achat produit: ${buyProduct.name}${paymentMode === "cod" ? " (paiement à la livraison)" : ""}`,
    });
    if (paymentMode === "wallet") {
      await supabase.from("profiles").update({
        wallet_balance: Number(profile.wallet_balance) - Number(buyProduct.price),
        address: deliveryForm.address, city: deliveryForm.city, street: deliveryForm.street,
      }).eq("user_id", user.id);
    }
    setSubmitting(false);
    setPurchaseDone(true);
    loadData();
  };

  const openPartner = (partner: any) => {
    setSelectedPartner(partner);
    setActiveImageIndex(0);
    setPurchaseDone(false);
    setBuyProduct(null);
  };

  const partnerImages = (p: any) => [p.image1_url, p.image2_url].filter(Boolean);

  return (
    <div className="min-h-screen" style={{ background: "hsl(var(--background))" }}>
      {/* ── HEADER ── */}
      <header className="border-b border-border bg-card/80 backdrop-blur-md sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={logo} alt="Institut Moisson" className="w-8 h-8" width={32} height={32} />
            <div>
              <span className="font-heading text-lg font-bold text-foreground block leading-tight">Stand Partenaires</span>
              <span className="text-[10px] text-muted-foreground font-body uppercase tracking-wider">Institut Moisson</span>
            </div>
          </div>
          <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground font-body transition-colors">
            <ArrowLeft className="w-4 h-4" /> Accueil
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-6 py-10">
        {/* ── HERO ── */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary font-body text-sm font-semibold mb-4">
            <Building2 className="w-4 h-4" />
            {partners.length} entreprise{partners.length !== 1 ? "s" : ""} partenaire{partners.length !== 1 ? "s" : ""}
          </div>
          <h1 className="text-4xl md:text-5xl font-heading font-bold text-foreground mb-4 leading-tight">
            Notre <span className="text-gradient-gold">Stand</span> Partenaires
          </h1>
          <p className="text-muted-foreground font-body text-lg max-w-2xl mx-auto">
            Découvrez les entreprises de confiance qui propulsent le réseau Institut Moisson.
            Achetez directement avec votre portefeuille ou à la livraison.
          </p>
        </div>

        {/* ── SEARCH ── */}
        <div className="max-w-xl mx-auto mb-10">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <input
              placeholder="Rechercher une entreprise ou un produit..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-4 rounded-2xl border border-input bg-card text-foreground font-body shadow-sm focus:ring-2 focus:ring-primary/30 outline-none transition-all text-sm"
            />
          </div>
        </div>

        {/* ── PARTNER CARDS GRID ── */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPartners.map(partner => {
            const prods = partnerProducts(partner.id);
            return (
              <div
                key={partner.id}
                onClick={() => openPartner(partner)}
                className="group cursor-pointer rounded-2xl border border-border bg-card overflow-hidden hover:shadow-xl hover:border-primary/30 transition-all duration-300 hover:-translate-y-1"
              >
                {/* Banner Image */}
                <div className="relative h-40 bg-gradient-to-br from-primary/10 to-gold/10 overflow-hidden">
                  {partner.image1_url ? (
                    <img
                      src={partner.image1_url}
                      alt={partner.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Building2 className="w-12 h-12 text-primary/30" />
                    </div>
                  )}
                  {/* Overlay gradient */}
                  <div className="absolute inset-0 bg-gradient-to-t from-card via-transparent to-transparent" />

                  {/* Product count badge */}
                  {prods.length > 0 && (
                    <div className="absolute top-3 right-3 bg-card/90 backdrop-blur-sm rounded-full px-2.5 py-1 flex items-center gap-1.5 border border-border/50">
                      <Package className="w-3 h-3 text-primary" />
                      <span className="text-[11px] font-bold text-foreground font-body">{prods.length} produit{prods.length > 1 ? "s" : ""}</span>
                    </div>
                  )}
                </div>

                <div className="p-5">
                  {/* Logo + Name */}
                  <div className="flex items-center gap-3 mb-3 -mt-10 relative z-10">
                    <div className="w-16 h-16 rounded-xl border-2 border-card shadow-lg overflow-hidden bg-card flex items-center justify-center flex-shrink-0">
                      {partner.logo_url ? (
                        <img src={partner.logo_url} alt={partner.name} className="w-full h-full object-cover" loading="lazy" />
                      ) : (
                        <span className="text-2xl font-bold text-primary font-heading">{partner.name.charAt(0)}</span>
                      )}
                    </div>
                    <div>
                      <h3 className="font-heading font-bold text-foreground text-base leading-tight">{partner.name}</h3>
                      <p className="text-xs text-muted-foreground font-body flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {getPartnerDuration(partner.partner_since)}
                      </p>
                    </div>
                  </div>

                  {partner.description && (
                    <p className="text-sm text-muted-foreground font-body mb-4 line-clamp-2 leading-relaxed">
                      {partner.description}
                    </p>
                  )}

                  {/* Contact chips */}
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {partner.whatsapp && (
                      <a href={`https://wa.me/${partner.whatsapp}`} target="_blank" rel="noopener" onClick={e => e.stopPropagation()}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-harvest-green/10 text-harvest-green text-[11px] font-semibold hover:bg-harvest-green/20 transition-colors">
                        <MessageCircle className="w-3 h-3" /> WhatsApp
                      </a>
                    )}
                    {partner.website && (
                      <a href={partner.website.startsWith("http") ? partner.website : `https://${partner.website}`} target="_blank" rel="noopener" onClick={e => e.stopPropagation()}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-primary/10 text-primary text-[11px] font-semibold hover:bg-primary/20 transition-colors">
                        <Globe className="w-3 h-3" /> Site web
                      </a>
                    )}
                    {partner.email && (
                      <a href={`mailto:${partner.email}`} onClick={e => e.stopPropagation()}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-accent/10 text-accent-foreground text-[11px] font-semibold hover:bg-accent/20 transition-colors">
                        <Mail className="w-3 h-3" /> Email
                      </a>
                    )}
                  </div>

                  {/* Product preview */}
                  {prods.length > 0 && (
                    <div className="border-t border-border/50 pt-3">
                      <div className="flex gap-2 overflow-x-auto pb-1">
                        {prods.slice(0, 4).map(prod => (
                          <div key={prod.id} className="flex-shrink-0 text-center">
                            <div className="w-12 h-12 rounded-lg overflow-hidden bg-secondary border border-border">
                              {prod.images?.[0] ? (
                                <img src={prod.images[0]} alt="" className="w-full h-full object-cover" loading="lazy" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <Package className="w-4 h-4 text-muted-foreground" />
                                </div>
                              )}
                            </div>
                            <p className="text-[9px] text-muted-foreground font-body mt-1 w-12 truncate">{prod.name}</p>
                          </div>
                        ))}
                        {prods.length > 4 && (
                          <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-secondary border border-border flex items-center justify-center">
                            <span className="text-xs text-muted-foreground font-bold">+{prods.length - 4}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="mt-3 flex items-center justify-between">
                    <span className="text-xs text-muted-foreground font-body">Cliquer pour voir le stand</span>
                    <ChevronRight className="w-4 h-4 text-primary" />
                  </div>
                </div>
              </div>
            );
          })}
          {filteredPartners.length === 0 && (
            <div className="col-span-3 text-center py-20">
              <Building2 className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground font-body">Aucun partenaire trouvé</p>
            </div>
          )}
        </div>
      </main>

      {/* ══ PARTNER STAND MODAL ══ */}
      {selectedPartner && (
        <div
          className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-0 md:p-4"
          style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)" }}
          onClick={() => setSelectedPartner(null)}
        >
          <div
            className="bg-card w-full md:max-w-3xl max-h-[95vh] md:rounded-3xl rounded-t-3xl overflow-hidden flex flex-col shadow-2xl border border-border"
            onClick={e => e.stopPropagation()}
          >
            {/* ── STAND HEADER ── */}
            <div className="relative">
              {/* Banner slider */}
              <div className="relative h-52 bg-gradient-to-br from-primary/20 to-gold/20 overflow-hidden">
                {partnerImages(selectedPartner).length > 0 ? (
                  <>
                    <img
                      src={partnerImages(selectedPartner)[activeImageIndex]}
                      alt={selectedPartner.name}
                      className="w-full h-full object-cover"
                    />
                    {partnerImages(selectedPartner).length > 1 && (
                      <>
                        <button
                          onClick={() => setActiveImageIndex(i => (i - 1 + partnerImages(selectedPartner).length) % partnerImages(selectedPartner).length)}
                          className="absolute left-3 top-1/2 -translate-y-1/2 p-2 bg-black/40 text-white rounded-full hover:bg-black/60 transition-colors"
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setActiveImageIndex(i => (i + 1) % partnerImages(selectedPartner).length)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 p-2 bg-black/40 text-white rounded-full hover:bg-black/60 transition-colors"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>
                        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
                          {partnerImages(selectedPartner).map((_: any, i: number) => (
                            <button
                              key={i}
                              onClick={() => setActiveImageIndex(i)}
                              className={`w-1.5 h-1.5 rounded-full transition-all ${i === activeImageIndex ? "bg-white w-4" : "bg-white/50"}`}
                            />
                          ))}
                        </div>
                      </>
                    )}
                  </>
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Building2 className="w-16 h-16 text-primary/20" />
                  </div>
                )}
                {/* Gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-card/80 to-transparent" />
              </div>

              {/* Close button */}
              <button
                onClick={() => setSelectedPartner(null)}
                className="absolute top-4 right-4 w-9 h-9 bg-black/50 text-white rounded-full flex items-center justify-center hover:bg-black/70 transition-colors z-10"
              >
                <X className="w-4 h-4" />
              </button>

              {/* Company identity bar */}
              <div className="px-6 pb-4 -mt-8 relative z-10 flex items-end gap-4">
                <div className="w-20 h-20 rounded-2xl border-4 border-card shadow-xl overflow-hidden bg-card flex-shrink-0">
                  {selectedPartner.logo_url ? (
                    <img src={selectedPartner.logo_url} alt={selectedPartner.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-primary/10">
                      <span className="text-3xl font-bold text-primary font-heading">{selectedPartner.name.charAt(0)}</span>
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0 mb-1">
                  <h2 className="text-2xl font-heading font-bold text-foreground leading-tight">{selectedPartner.name}</h2>
                  <div className="flex items-center gap-2 flex-wrap mt-1">
                    <span className="text-xs text-muted-foreground font-body flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {getPartnerDuration(selectedPartner.partner_since)}
                    </span>
                    <span className="w-1 h-1 rounded-full bg-border" />
                    <span className="text-xs font-semibold text-primary font-body flex items-center gap-1">
                      <Shield className="w-3 h-3" /> Partenaire certifié
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* ── STAND BODY ── */}
            <div className="flex-1 overflow-y-auto">
              <div className="px-6 pb-8 space-y-6">

                {/* Description */}
                {selectedPartner.description && (
                  <div>
                    <p className="text-sm text-muted-foreground font-body leading-relaxed">{selectedPartner.description}</p>
                  </div>
                )}

                {/* Contact actions */}
                <div className="grid grid-cols-2 gap-2">
                  {selectedPartner.whatsapp && (
                    <a href={`https://wa.me/${selectedPartner.whatsapp}`} target="_blank" rel="noopener"
                      className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-harvest-green/10 border border-harvest-green/20 text-harvest-green text-sm font-semibold font-body hover:bg-harvest-green/20 transition-colors">
                      <MessageCircle className="w-4 h-4" /> WhatsApp
                    </a>
                  )}
                  {selectedPartner.phone && (
                    <a href={`tel:${selectedPartner.phone}`}
                      className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-primary/10 border border-primary/20 text-primary text-sm font-semibold font-body hover:bg-primary/20 transition-colors">
                      <Phone className="w-4 h-4" /> Appeler
                    </a>
                  )}
                  {selectedPartner.email && (
                    <a href={`mailto:${selectedPartner.email}`}
                      className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-accent/10 border border-accent/20 text-accent-foreground text-sm font-semibold font-body hover:bg-accent/20 transition-colors">
                      <Mail className="w-4 h-4" /> Email
                    </a>
                  )}
                  {selectedPartner.website && (
                    <a href={selectedPartner.website.startsWith("http") ? selectedPartner.website : `https://${selectedPartner.website}`} target="_blank" rel="noopener"
                      className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-secondary border border-border text-foreground text-sm font-semibold font-body hover:bg-muted transition-colors">
                      <Globe className="w-4 h-4" /> Site web
                    </a>
                  )}
                  {selectedPartner.facebook && (
                    <a href={selectedPartner.facebook.startsWith("http") ? selectedPartner.facebook : `https://facebook.com/${selectedPartner.facebook}`} target="_blank" rel="noopener"
                      className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-600 text-sm font-semibold font-body hover:bg-blue-500/20 transition-colors">
                      <Facebook className="w-4 h-4" /> Facebook
                    </a>
                  )}
                </div>

                {/* Products section */}
                {partnerProducts(selectedPartner.id).length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-4">
                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Package className="w-4 h-4 text-primary" />
                      </div>
                      <h3 className="text-lg font-heading font-bold text-foreground">
                        Nos Produits ({partnerProducts(selectedPartner.id).length})
                      </h3>
                    </div>

                    <div className="space-y-3">
                      {partnerProducts(selectedPartner.id).map(prod => (
                        <div
                          key={prod.id}
                          className="rounded-2xl border border-border bg-secondary/30 overflow-hidden hover:border-primary/30 transition-colors"
                        >
                          <div className="flex gap-4 p-4">
                            {/* Product image */}
                            <div className="w-20 h-20 rounded-xl overflow-hidden bg-secondary flex-shrink-0 border border-border">
                              {prod.images?.[0] ? (
                                <img src={prod.images[0]} alt={prod.name} className="w-full h-full object-cover" loading="lazy" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <Package className="w-8 h-8 text-muted-foreground" />
                                </div>
                              )}
                            </div>

                            <div className="flex-1 min-w-0">
                              <h4 className="font-heading font-bold text-foreground text-base mb-1">{prod.name}</h4>
                              {prod.description && (
                                <p className="text-xs text-muted-foreground font-body line-clamp-2 mb-2">{prod.description}</p>
                              )}
                              <div className="flex items-center justify-between flex-wrap gap-2">
                                <div>
                                  <span className="text-xl font-heading font-bold text-primary">
                                    {Number(prod.price).toLocaleString("fr-FR")} FCFA
                                  </span>
                                  {prod.allow_cod && (
                                    <span className="ml-2 text-[10px] text-harvest-green font-body font-semibold bg-harvest-green/10 px-1.5 py-0.5 rounded-full inline-flex items-center gap-0.5">
                                      <Truck className="w-2.5 h-2.5" /> COD
                                    </span>
                                  )}
                                </div>
                                {user ? (
                                  <button
                                    onClick={() => { setBuyProduct(prod); setPaymentMode(prod.allow_cod ? "cod" : "wallet"); setPurchaseDone(false); }}
                                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold font-body hover:bg-primary/90 transition-colors"
                                  >
                                    <ShoppingCart className="w-4 h-4" /> Acheter
                                  </button>
                                ) : (
                                  <Link to="/connexion"
                                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-secondary border border-border text-foreground text-sm font-semibold font-body hover:bg-muted transition-colors">
                                    Se connecter
                                  </Link>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Additional product images */}
                          {prod.images?.length > 1 && (
                            <div className="px-4 pb-3 flex gap-2 overflow-x-auto">
                              {prod.images.slice(1, 5).map((img: string, i: number) => (
                                <img key={i} src={img} alt="" className="w-12 h-12 rounded-lg object-cover flex-shrink-0 border border-border" loading="lazy" />
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {partnerProducts(selectedPartner.id).length === 0 && (
                  <div className="text-center py-8 bg-secondary/30 rounded-2xl border border-dashed border-border">
                    <Package className="w-10 h-10 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground font-body">Aucun produit disponible actuellement</p>
                    <p className="text-xs text-muted-foreground font-body mt-1">Contactez ce partenaire directement</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══ BUY PRODUCT MODAL ══ */}
      {buyProduct && profile && (
        <div className="fixed inset-0 bg-foreground/60 flex items-end md:items-center justify-center z-[60] p-0 md:p-4 backdrop-blur-sm"
          onClick={() => { setBuyProduct(null); setPurchaseDone(false); }}>
          <div
            className="bg-card w-full md:max-w-md md:rounded-3xl rounded-t-3xl overflow-hidden shadow-2xl border border-border"
            onClick={e => e.stopPropagation()}
          >
            {purchaseDone ? (
              /* Success screen */
              <div className="p-8 text-center">
                <div className="w-20 h-20 rounded-full bg-harvest-green/10 flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-10 h-10 text-harvest-green" />
                </div>
                <h3 className="text-2xl font-heading font-bold text-foreground mb-2">Commande confirmée !</h3>
                <p className="text-sm text-muted-foreground font-body mb-2">
                  {paymentMode === "cod"
                    ? "Votre commande a été enregistrée. Vous paierez à la livraison."
                    : `${Number(buyProduct.price).toLocaleString("fr-FR")} FCFA ont été déduits de votre portefeuille.`
                  }
                </p>
                <p className="text-xs text-muted-foreground font-body mb-6">
                  Nouveau solde : <span className="font-bold text-primary">
                    {paymentMode === "wallet"
                      ? (Number(profile.wallet_balance) - Number(buyProduct.price)).toLocaleString("fr-FR")
                      : Number(profile.wallet_balance).toLocaleString("fr-FR")
                    } FCFA
                  </span>
                </p>
                <button
                  onClick={() => { setBuyProduct(null); setPurchaseDone(false); }}
                  className="w-full btn-gold !text-sm !py-3"
                >
                  Continuer les achats
                </button>
              </div>
            ) : (
              <>
                {/* Header */}
                <div className="p-6 border-b border-border">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-heading font-bold text-foreground">Passer commande</h3>
                    <button onClick={() => setBuyProduct(null)} className="p-1.5 rounded-lg hover:bg-secondary transition-colors">
                      <X className="w-4 h-4 text-muted-foreground" />
                    </button>
                  </div>

                  {/* Product summary */}
                  <div className="flex items-center gap-3 bg-secondary/50 rounded-xl p-3">
                    <div className="w-14 h-14 rounded-xl overflow-hidden bg-secondary flex-shrink-0 border border-border">
                      {buyProduct.images?.[0] ? (
                        <img src={buyProduct.images[0]} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Package className="w-6 h-6 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                    <div>
                      <p className="font-heading font-bold text-foreground">{buyProduct.name}</p>
                      <p className="text-xl font-bold text-primary">{Number(buyProduct.price).toLocaleString("fr-FR")} FCFA</p>
                    </div>
                  </div>
                </div>

                <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                  {/* Wallet balance */}
                  <div className="flex justify-between items-center text-sm font-body bg-secondary rounded-xl p-3">
                    <span className="text-muted-foreground">Votre solde :</span>
                    <span className={`font-bold ${Number(profile.wallet_balance) >= Number(buyProduct.price) ? "text-primary" : "text-destructive"}`}>
                      {Number(profile.wallet_balance).toLocaleString("fr-FR")} FCFA
                    </span>
                  </div>

                  {/* Payment mode */}
                  {buyProduct.allow_cod && (
                    <div>
                      <p className="text-sm font-medium text-foreground mb-2 font-body">Mode de paiement</p>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={() => setPaymentMode("wallet")}
                          className={`flex items-center justify-center gap-2 py-3 rounded-xl border-2 text-sm font-semibold font-body transition-all ${
                            paymentMode === "wallet"
                              ? "border-primary bg-primary/10 text-primary"
                              : "border-border text-muted-foreground hover:border-primary/30"
                          }`}
                        >
                          💳 Portefeuille
                        </button>
                        <button
                          onClick={() => setPaymentMode("cod")}
                          className={`flex items-center justify-center gap-2 py-3 rounded-xl border-2 text-sm font-semibold font-body transition-all ${
                            paymentMode === "cod"
                              ? "border-harvest-green bg-harvest-green/10 text-harvest-green"
                              : "border-border text-muted-foreground hover:border-harvest-green/30"
                          }`}
                        >
                          <Truck className="w-4 h-4" /> Livraison
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Delivery form */}
                  <form onSubmit={handleBuyProduct} className="space-y-3">
                    <div>
                      <p className="text-sm font-medium text-foreground mb-2 font-body flex items-center gap-1.5">
                        <MapPin className="w-4 h-4 text-primary" /> Adresse de livraison
                      </p>
                      <div className="space-y-2">
                        <input
                          placeholder="Pays"
                          value={deliveryForm.country}
                          onChange={e => setDeliveryForm({...deliveryForm, country: e.target.value})}
                          className="w-full px-4 py-3 rounded-xl border border-input bg-background text-foreground font-body text-sm"
                        />
                        <input
                          placeholder="Ville"
                          value={deliveryForm.city}
                          onChange={e => setDeliveryForm({...deliveryForm, city: e.target.value})}
                          className="w-full px-4 py-3 rounded-xl border border-input bg-background text-foreground font-body text-sm"
                        />
                        <input
                          placeholder="Quartier / Rue"
                          value={deliveryForm.street}
                          onChange={e => setDeliveryForm({...deliveryForm, street: e.target.value})}
                          className="w-full px-4 py-3 rounded-xl border border-input bg-background text-foreground font-body text-sm"
                        />
                        <input
                          placeholder="Numéro de contact *"
                          required
                          value={deliveryForm.phone}
                          onChange={e => setDeliveryForm({...deliveryForm, phone: e.target.value})}
                          className="w-full px-4 py-3 rounded-xl border border-input bg-background text-foreground font-body text-sm"
                        />
                      </div>
                    </div>

                    {paymentMode === "wallet" && Number(profile.wallet_balance) < Number(buyProduct.price) && (
                      <div className="flex items-center gap-2 text-destructive text-xs font-body bg-destructive/5 border border-destructive/20 rounded-xl p-3">
                        <Zap className="w-4 h-4 flex-shrink-0" />
                        Solde insuffisant. Il vous manque {(Number(buyProduct.price) - Number(profile.wallet_balance)).toLocaleString("fr-FR")} FCFA.
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={submitting || (paymentMode === "wallet" && Number(profile.wallet_balance) < Number(buyProduct.price))}
                      className="w-full btn-gold !text-sm !py-3 disabled:opacity-50"
                    >
                      {submitting ? (
                        <span className="flex items-center justify-center gap-2">
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          Traitement...
                        </span>
                      ) : paymentMode === "cod" ? (
                        <span className="flex items-center justify-center gap-2">
                          <Truck className="w-4 h-4" /> Commander — Payer à la livraison
                        </span>
                      ) : (
                        <span className="flex items-center justify-center gap-2">
                          <ShoppingCart className="w-4 h-4" /> Payer {Number(buyProduct.price).toLocaleString("fr-FR")} FCFA
                        </span>
                      )}
                    </button>
                  </form>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default StandPage;
