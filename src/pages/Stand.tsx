import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Globe, Phone, Mail, MessageCircle, Facebook, Clock, ArrowLeft,
  ShoppingCart, MapPin, Truck, Search, X, ChevronLeft, ChevronRight,
  Shield, Package, CheckCircle, Building2, Flame, Coins, Wallet,
  ArrowRightLeft, RefreshCw, Info, AlertTriangle, Tag
} from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import logo from "@/assets/logo-moisson.png";

const CURRENCIES = [
  { code: "XOF", label: "FCFA (XOF)", symbol: "FCFA" },
  { code: "USD", label: "Dollar US (USD)", symbol: "$" },
  { code: "EUR", label: "Euro (EUR)", symbol: "€" },
  { code: "GBP", label: "Livre (GBP)", symbol: "£" },
  { code: "NGN", label: "Naira (NGN)", symbol: "₦" },
  { code: "GHS", label: "Cedi (GHS)", symbol: "₵" },
  { code: "MAD", label: "Dirham (MAD)", symbol: "MAD" },
  { code: "CAD", label: "Dollar CA", symbol: "CA$" },
  { code: "CHF", label: "Franc CH", symbol: "CHF" },
];

const StandPage = () => {
  const { user } = useAuth();
  const [partners, setPartners] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [packs, setPacks] = useState<any[]>([]);
  const [selectedPartner, setSelectedPartner] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [buyItem, setBuyItem] = useState<any>(null); // product or pack
  const [buyItemType, setBuyItemType] = useState<"product" | "pack">("product");
  const [paymentMode, setPaymentMode] = useState<"wallet" | "msn" | "cod">("wallet");
  const [deliveryForm, setDeliveryForm] = useState({ address: "", city: "", country: "", phone: "", street: "" });
  const [submitting, setSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [purchaseDone, setPurchaseDone] = useState(false);

  // MSN / exchange rate state
  const [msnCoins, setMsnCoins] = useState(0);
  const [coinUsdRate, setCoinUsdRate] = useState<number>(1);
  const [exchangeRates, setExchangeRates] = useState<Record<string, number>>({});
  const [ratesLoading, setRatesLoading] = useState(false);
  const [displayCurrency, setDisplayCurrency] = useState("XOF");

  useEffect(() => { loadData(); fetchRates(); }, []);

  const loadData = async () => {
    const [partnersRes, productsRes, packsRes] = await Promise.all([
      supabase.from("partner_companies").select("*").eq("is_active", true).order("created_at"),
      supabase.from("partner_products").select("*").eq("is_active", true),
      supabase.from("packs").select("*, partner_companies(id, name)").eq("is_active", true),
    ]);
    setPartners(partnersRes.data || []);
    setProducts(productsRes.data || []);
    setPacks(packsRes.data || []);

    if (user) {
      const [profileRes, coinsRes, msnCfgRes] = await Promise.all([
        supabase.from("profiles").select("*").eq("user_id", user.id).single(),
        supabase.from("msn_coins").select("coins").eq("user_id", user.id).eq("is_converted", false),
        supabase.from("msn_config").select("*"),
      ]);
      const p = profileRes.data;
      setProfile(p);
      if (p) setDeliveryForm({ address: p.address || "", city: p.city || "", country: p.country || "", phone: p.phone || "", street: p.street || "" });
      const total = (coinsRes.data || []).reduce((s: number, c: any) => s + c.coins, 0);
      setMsnCoins(total);
      const cfgMap: Record<string, any> = {};
      (msnCfgRes.data || []).forEach((r: any) => { cfgMap[r.key] = r.value; });
      setCoinUsdRate(Number(cfgMap.coin_usd_rate) || 1);
    }
  };

  const fetchRates = async () => {
    setRatesLoading(true);
    try {
      const res = await fetch("https://api.exchangerate-api.com/v4/latest/USD");
      const data = await res.json();
      setExchangeRates(data.rates || {});
    } catch {
      setExchangeRates({ XOF: 620, XAF: 620, EUR: 0.93, GBP: 0.79, NGN: 1550, GHS: 12.5, MAD: 10.1, CAD: 1.37, CHF: 0.90 });
    }
    setRatesLoading(false);
  };

  // --- MSN coin calculations ---
  const coinValueXOF = coinUsdRate * (exchangeRates["XOF"] || 620);
  const priceInCurrency = (priceXOF: number, currency: string): number => {
    if (currency === "XOF") return priceXOF;
    const usdVal = priceXOF / (exchangeRates["XOF"] || 620);
    if (currency === "USD") return usdVal;
    return usdVal * (exchangeRates[currency] || 1);
  };
  const coinsNeededFor = (priceXOF: number): number => {
    if (coinValueXOF <= 0) return Infinity;
    return Math.ceil(priceXOF / coinValueXOF);
  };
  const formatAmt = (n: number, currency: string) => {
    if (currency === "BTC") return n.toFixed(8);
    if (["USD", "EUR", "GBP", "CAD", "CHF"].includes(currency))
      return n.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    return Math.round(n).toLocaleString("fr-FR");
  };
  const sym = (code: string) => CURRENCIES.find(c => c.code === code)?.symbol || code;

  const getPartnerDuration = (since: string) => {
    const months = Math.floor((Date.now() - new Date(since).getTime()) / (1000 * 60 * 60 * 24 * 30));
    if (months < 1) return "Nouveau partenaire";
    if (months < 12) return `Partenaire depuis ${months} mois`;
    return `Partenaire depuis ${Math.floor(months / 12)} an(s)`;
  };

  const partnerProducts = (partnerId: string) => products.filter(p => p.partner_company_id === partnerId);
  const partnerPacks = (partnerId: string) => packs.filter(p => p.partner_companies?.id === partnerId);

  const filteredPartners = partners.filter(p => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return p.name.toLowerCase().includes(q) || (p.description || "").toLowerCase().includes(q);
  });

  const openBuy = (item: any, type: "product" | "pack") => {
    setBuyItem(item);
    setBuyItemType(type);
    setPurchaseDone(false);
    const itemPrice = Number(item.price);
    const walletBal = Number(profile?.wallet_balance || 0);
    const coins = coinsNeededFor(itemPrice);
    if (walletBal >= itemPrice) {
      setPaymentMode("wallet");
    } else if (msnCoins >= coins) {
      setPaymentMode("msn");
    } else if (type === "product" && item.allow_cod) {
      setPaymentMode("cod");
    } else {
      setPaymentMode("wallet");
    }
  };

  const deductMSNCoins = async (coinsToUse: number) => {
    let toDeduct = coinsToUse;
    const { data: userCoins } = await supabase.from("msn_coins")
      .select("id, coins").eq("user_id", user!.id).eq("is_converted", false)
      .order("created_at", { ascending: true });
    if (userCoins) {
      for (const c of userCoins) {
        if (toDeduct <= 0) break;
        if (c.coins <= toDeduct) {
          await supabase.from("msn_coins").update({ is_converted: true } as any).eq("id", c.id);
          toDeduct -= c.coins;
        } else {
          await supabase.from("msn_coins").update({ coins: c.coins - toDeduct } as any).eq("id", c.id);
          toDeduct = 0;
        }
      }
    }
  };

  const handleBuy = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!buyItem || !profile || !user) return;
    const price = Number(buyItem.price);
    const coins = coinsNeededFor(price);

    if (paymentMode === "wallet" && profile.wallet_balance < price) { toast.error("Solde insuffisant !"); return; }
    if (paymentMode === "msn" && msnCoins < coins) { toast.error(`Il faut ${coins} coins. Vous en avez ${msnCoins}.`); return; }

    setSubmitting(true);
    try {
      if (buyItemType === "pack") {
        // Full pack purchase flow
        const { data: orderData, error: orderErr } = await supabase.from("pack_orders").insert({
          user_id: user.id,
          pack_id: buyItem.id,
          amount_paid: price,
          delivery_city: deliveryForm.city,
          delivery_country: deliveryForm.country,
          delivery_street: deliveryForm.street,
          delivery_phone: deliveryForm.phone,
          delivery_address: deliveryForm.address,
        }).select("id").single();
        if (orderErr) throw new Error(orderErr.message);

        const profileUpdate: any = { is_mlm_active: buyItem.is_mlm_pack ? true : undefined };
        if (paymentMode === "wallet") {
          profileUpdate.wallet_balance = profile.wallet_balance - price;
        }
        await supabase.from("profiles").update(profileUpdate).eq("user_id", user.id);

        if (paymentMode === "msn") {
          await deductMSNCoins(coins);
          await supabase.from("transactions").insert({
            user_id: user.id, amount: price, type: "pack_purchase" as const, status: "approved" as const,
            description: `Achat pack "${buyItem.name}" avec ${coins} MSN Coins`,
            metadata: { pack_id: buyItem.id, coins_used: coins },
            processed_at: new Date().toISOString(),
          });
        } else {
          await supabase.from("transactions").insert({
            user_id: user.id, amount: price, type: "pack_purchase" as const, status: "approved" as const,
            description: `Achat pack: ${buyItem.name}`,
            processed_at: new Date().toISOString(),
          });
        }
        if (buyItem.is_mlm_pack) {
          await supabase.rpc("distribute_commissions", {
            _buyer_user_id: user.id, _pack_id: buyItem.id,
            _pack_price: price, _pack_name: buyItem.name,
          }).catch(console.error);
          if (paymentMode === "wallet" && orderData?.id) {
            await supabase.rpc("award_msn_coins", { _buyer_user_id: user.id, _order_id: orderData.id }).catch(console.error);
          }
        }
      } else {
        // Product purchase
        if (paymentMode === "wallet") {
          await supabase.from("profiles").update({ wallet_balance: profile.wallet_balance - price }).eq("user_id", user.id);
          await supabase.from("transactions").insert({
            user_id: user.id, amount: price, type: "product_purchase" as const, status: "approved" as const,
            description: `Achat produit: ${buyItem.name}`,
            processed_at: new Date().toISOString(),
          });
        } else if (paymentMode === "msn") {
          await deductMSNCoins(coins);
          await supabase.from("transactions").insert({
            user_id: user.id, amount: price, type: "product_purchase" as const, status: "approved" as const,
            description: `Achat produit "${buyItem.name}" avec ${coins} MSN Coins`,
            metadata: { coins_used: coins },
            processed_at: new Date().toISOString(),
          });
        } else {
          // COD
          await supabase.from("transactions").insert({
            user_id: user.id, amount: price, type: "product_purchase" as const, status: "pending" as const,
            description: `Produit COD: ${buyItem.name}`,
          });
        }
      }
      setPurchaseDone(true);
      await loadData();
    } catch (err: any) {
      toast.error(err.message || "Erreur lors de l'achat");
    } finally {
      setSubmitting(false);
    }
  };

  const openPartner = (partner: any) => {
    setSelectedPartner(partner);
    setActiveImageIndex(0);
    setPurchaseDone(false);
    setBuyItem(null);
  };
  const partnerImages = (p: any) => [p.image1_url, p.image2_url].filter(Boolean);
  const itemCoins = buyItem ? coinsNeededFor(Number(buyItem.price)) : 0;
  const canPayMSN = buyItem ? msnCoins >= itemCoins : false;
  const canPayWallet = buyItem ? (profile?.wallet_balance || 0) >= Number(buyItem.price) : false;
  const canCOD = buyItemType === "product" && buyItem?.allow_cod;

  return (
    <div className="min-h-screen bg-background">
      {/* HEADER */}
      <header className="border-b border-border bg-card/80 backdrop-blur-md sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={logo} alt="Institut Moisson" className="w-8 h-8" width={32} height={32} />
            <div>
              <span className="font-heading text-lg font-bold text-foreground block leading-tight">Stand Partenaires</span>
              <span className="text-[10px] text-muted-foreground font-body uppercase tracking-wider">Institut Moisson</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {user && profile && (
              <div className="hidden sm:flex items-center gap-3 text-xs font-body">
                <div className="flex items-center gap-1.5 bg-secondary px-3 py-1.5 rounded-full">
                  <Wallet className="w-3.5 h-3.5 text-primary" />
                  <span className="font-bold text-foreground">{Number(profile.wallet_balance).toLocaleString("fr-FR")} FCFA</span>
                </div>
                <div className="flex items-center gap-1.5 bg-gradient-to-r from-primary/10 to-gold/10 px-3 py-1.5 rounded-full border border-gold/20">
                  <Flame className="w-3.5 h-3.5 text-gold" />
                  <span className="font-bold text-gold">{msnCoins} coins</span>
                </div>
              </div>
            )}
            <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground font-body transition-colors">
              <ArrowLeft className="w-4 h-4" /> Accueil
            </Link>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-10">
        {/* HERO */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary font-body text-sm font-semibold mb-4">
            <Building2 className="w-4 h-4" />
            {partners.length} entreprise{partners.length !== 1 ? "s" : ""} partenaire{partners.length !== 1 ? "s" : ""}
          </div>
          <h1 className="text-4xl md:text-5xl font-heading font-bold text-foreground mb-4 leading-tight">
            Notre <span className="text-gradient-gold">Stand</span> Partenaires
          </h1>
          <p className="text-muted-foreground font-body text-lg max-w-2xl mx-auto mb-4">
            Découvrez les entreprises de confiance qui propulsent le réseau Institut Moisson.
            Payez avec votre portefeuille <span className="text-primary font-semibold">FCFA</span> ou vos{" "}
            <span className="text-gold font-semibold">MSN Coins 🔥</span>.
          </p>
          {/* Currency + rate display */}
          <div className="flex items-center justify-center gap-3 flex-wrap">
            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-primary/5 to-gold/5 border border-gold/20 rounded-full px-4 py-2 text-sm font-body">
              <Flame className="w-4 h-4 text-gold" />
              <span className="text-muted-foreground">1 MSN Coin =</span>
              <span className="font-bold text-gold">{coinUsdRate} $</span>
              <span className="text-muted-foreground">≈</span>
              <span className="font-bold text-primary">{Math.round(coinValueXOF).toLocaleString("fr-FR")} FCFA</span>
              <button onClick={fetchRates} className="ml-1 hover:text-primary transition-colors">
                <RefreshCw className={`w-3.5 h-3.5 text-muted-foreground ${ratesLoading ? "animate-spin" : ""}`} />
              </button>
            </div>
            <select
              value={displayCurrency}
              onChange={e => setDisplayCurrency(e.target.value)}
              className="px-3 py-2 rounded-full border border-input bg-card text-foreground font-body text-xs"
            >
              {CURRENCIES.map(c => <option key={c.code} value={c.code}>{c.label}</option>)}
            </select>
          </div>
        </div>

        {/* SEARCH */}
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

        {/* PARTNER GRID */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPartners.map(partner => {
            const prods = partnerProducts(partner.id);
            const pkgs = partnerPacks(partner.id);
            const totalItems = prods.length + pkgs.length;
            return (
              <div
                key={partner.id}
                onClick={() => openPartner(partner)}
                className="group cursor-pointer rounded-2xl border border-border bg-card overflow-hidden hover:shadow-xl hover:border-primary/30 transition-all duration-300 hover:-translate-y-1"
              >
                {/* Banner */}
                <div className="relative h-40 bg-gradient-to-br from-primary/10 to-gold/10 overflow-hidden">
                  {partner.image1_url ? (
                    <img src={partner.image1_url} alt={partner.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center"><Building2 className="w-12 h-12 text-primary/30" /></div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-card via-transparent to-transparent" />
                  {totalItems > 0 && (
                    <div className="absolute top-3 right-3 bg-card/90 backdrop-blur-sm rounded-full px-2.5 py-1 flex items-center gap-1.5 border border-border/50">
                      <Package className="w-3 h-3 text-primary" />
                      <span className="text-[11px] font-bold text-foreground font-body">{totalItems} article{totalItems > 1 ? "s" : ""}</span>
                    </div>
                  )}
                </div>

                <div className="p-5">
                  <div className="flex items-center gap-3 mb-3 -mt-10 relative z-10">
                    <div className="w-16 h-16 rounded-xl border-2 border-card shadow-lg overflow-hidden bg-card flex-shrink-0">
                      {partner.logo_url ? (
                        <img src={partner.logo_url} alt={partner.name} className="w-full h-full object-cover" loading="lazy" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-primary/10">
                          <span className="text-2xl font-bold text-primary font-heading">{partner.name.charAt(0)}</span>
                        </div>
                      )}
                    </div>
                    <div>
                      <h3 className="font-heading font-bold text-foreground text-base leading-tight">{partner.name}</h3>
                      <p className="text-xs text-muted-foreground font-body flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {getPartnerDuration(partner.partner_since)}
                      </p>
                    </div>
                  </div>

                  {partner.description && <p className="text-sm text-muted-foreground font-body mb-4 line-clamp-2">{partner.description}</p>}

                  {/* Item previews */}
                  {(prods.length > 0 || pkgs.length > 0) && (
                    <div className="border-t border-border/50 pt-3">
                      {pkgs.length > 0 && (
                        <div className="flex items-center gap-1.5 mb-2">
                          <Tag className="w-3 h-3 text-primary" />
                          <span className="text-[11px] text-primary font-semibold font-body">{pkgs.length} pack{pkgs.length > 1 ? "s" : ""} MLM disponible{pkgs.length > 1 ? "s" : ""}</span>
                        </div>
                      )}
                      <div className="flex gap-2 overflow-x-auto pb-1">
                        {[...prods.slice(0, 3), ...pkgs.slice(0, 2)].map((item, i) => (
                          <div key={i} className="flex-shrink-0 w-12 h-12 rounded-lg overflow-hidden bg-secondary border border-border">
                            {(item.images || item.image1_url) ? (
                              <img src={(item.images?.[0] || item.image1_url)} alt="" className="w-full h-full object-cover" loading="lazy" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <Package className="w-4 h-4 text-muted-foreground" />
                              </div>
                            )}
                          </div>
                        ))}
                        {totalItems > 5 && (
                          <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-secondary border border-border flex items-center justify-center">
                            <span className="text-xs text-muted-foreground font-bold">+{totalItems - 5}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="mt-3 flex items-center justify-between">
                    <span className="text-xs text-muted-foreground font-body">Voir le stand</span>
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
          style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(8px)" }}
          onClick={() => setSelectedPartner(null)}
        >
          <div
            className="bg-card w-full md:max-w-3xl max-h-[95vh] md:rounded-3xl rounded-t-3xl overflow-hidden flex flex-col shadow-2xl border border-border"
            onClick={e => e.stopPropagation()}
          >
            {/* Stand header with banner */}
            <div className="relative">
              <div className="relative h-52 bg-gradient-to-br from-primary/20 to-gold/20 overflow-hidden">
                {partnerImages(selectedPartner).length > 0 ? (
                  <>
                    <img src={partnerImages(selectedPartner)[activeImageIndex]} alt={selectedPartner.name} className="w-full h-full object-cover" />
                    {partnerImages(selectedPartner).length > 1 && (
                      <>
                        <button onClick={() => setActiveImageIndex(i => (i - 1 + partnerImages(selectedPartner).length) % partnerImages(selectedPartner).length)}
                          className="absolute left-3 top-1/2 -translate-y-1/2 p-2 bg-black/40 text-white rounded-full hover:bg-black/60">
                          <ChevronLeft className="w-4 h-4" />
                        </button>
                        <button onClick={() => setActiveImageIndex(i => (i + 1) % partnerImages(selectedPartner).length)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 p-2 bg-black/40 text-white rounded-full hover:bg-black/60">
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </>
                    )}
                  </>
                ) : <div className="w-full h-full flex items-center justify-center"><Building2 className="w-16 h-16 text-primary/20" /></div>}
                <div className="absolute inset-0 bg-gradient-to-t from-card/80 to-transparent" />
              </div>
              <button onClick={() => setSelectedPartner(null)}
                className="absolute top-4 right-4 w-9 h-9 bg-black/50 text-white rounded-full flex items-center justify-center hover:bg-black/70 z-10">
                <X className="w-4 h-4" />
              </button>

              {/* Identity */}
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
                <div className="flex-1 mb-1">
                  <h2 className="text-2xl font-heading font-bold text-foreground">{selectedPartner.name}</h2>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-muted-foreground font-body flex items-center gap-1"><Clock className="w-3 h-3" /> {getPartnerDuration(selectedPartner.partner_since)}</span>
                    <span className="w-1 h-1 rounded-full bg-border" />
                    <span className="text-xs font-semibold text-primary font-body flex items-center gap-1"><Shield className="w-3 h-3" /> Certifié</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto">
              <div className="px-6 pb-8 space-y-6">

                {selectedPartner.description && (
                  <p className="text-sm text-muted-foreground font-body leading-relaxed">{selectedPartner.description}</p>
                )}

                {/* Contacts */}
                <div className="grid grid-cols-2 gap-2">
                  {selectedPartner.whatsapp && (
                    <a href={`https://wa.me/${selectedPartner.whatsapp}`} target="_blank" rel="noopener"
                      className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-harvest-green/10 border border-harvest-green/20 text-harvest-green text-sm font-semibold hover:bg-harvest-green/20 transition-colors">
                      <MessageCircle className="w-4 h-4" /> WhatsApp
                    </a>
                  )}
                  {selectedPartner.phone && (
                    <a href={`tel:${selectedPartner.phone}`}
                      className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-primary/10 border border-primary/20 text-primary text-sm font-semibold hover:bg-primary/20 transition-colors">
                      <Phone className="w-4 h-4" /> Appeler
                    </a>
                  )}
                  {selectedPartner.email && (
                    <a href={`mailto:${selectedPartner.email}`}
                      className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-accent/10 border border-accent/20 text-accent-foreground text-sm font-semibold hover:bg-accent/20 transition-colors">
                      <Mail className="w-4 h-4" /> Email
                    </a>
                  )}
                  {selectedPartner.website && (
                    <a href={selectedPartner.website.startsWith("http") ? selectedPartner.website : `https://${selectedPartner.website}`} target="_blank" rel="noopener"
                      className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-secondary border border-border text-foreground text-sm font-semibold hover:bg-muted transition-colors">
                      <Globe className="w-4 h-4" /> Site web
                    </a>
                  )}
                </div>

                {/* ── PACKS SECTION ── */}
                {partnerPacks(selectedPartner.id).length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-4">
                      <div className="w-8 h-8 rounded-lg bg-gold/10 flex items-center justify-center"><Tag className="w-4 h-4 text-gold" /></div>
                      <div>
                        <h3 className="text-lg font-heading font-bold text-foreground">Packs MLM ({partnerPacks(selectedPartner.id).length})</h3>
                        <p className="text-xs text-muted-foreground font-body">Activez votre MLM avec ces packs partenaires</p>
                      </div>
                    </div>
                    <div className="space-y-3">
                      {partnerPacks(selectedPartner.id).map(pack => {
                        const packCoins = coinsNeededFor(Number(pack.price));
                        const packInCurrency = priceInCurrency(Number(pack.price), displayCurrency);
                        const canWallet = (profile?.wallet_balance || 0) >= Number(pack.price);
                        const canCoin = msnCoins >= packCoins;
                        return (
                          <div key={pack.id} className="rounded-2xl border border-gold/20 bg-gradient-to-r from-gold/5 to-primary/5 overflow-hidden">
                            <div className="flex gap-4 p-4">
                              <div className="w-20 h-20 rounded-xl overflow-hidden bg-secondary flex-shrink-0 border border-border">
                                {pack.images?.[0] ? (
                                  <img src={pack.images[0]} alt={pack.name} className="w-full h-full object-cover" loading="lazy" />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center"><Package className="w-8 h-8 text-muted-foreground" /></div>
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between gap-2">
                                  <div>
                                    <h4 className="font-heading font-bold text-foreground text-base">{pack.name}</h4>
                                    {pack.is_mlm_pack && (
                                      <span className="text-[10px] bg-harvest-green/20 text-harvest-green px-2 py-0.5 rounded-full font-semibold">✓ Pack MLM</span>
                                    )}
                                  </div>
                                </div>
                                {pack.description && <p className="text-xs text-muted-foreground font-body line-clamp-2 mt-1">{pack.description}</p>}
                                <div className="flex items-center gap-3 mt-2 flex-wrap">
                                  <div>
                                    <span className="text-xl font-heading font-bold text-primary">{Number(pack.price).toLocaleString("fr-FR")} FCFA</span>
                                    {displayCurrency !== "XOF" && (
                                      <span className="block text-xs text-muted-foreground font-body">≈ {formatAmt(packInCurrency, displayCurrency)} {sym(displayCurrency)}</span>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-1 text-xs font-body text-gold">
                                    <Flame className="w-3 h-3" />
                                    <span>{packCoins} coins</span>
                                    {canCoin && <span className="text-harvest-green">✓</span>}
                                  </div>
                                </div>
                                {user ? (
                                  <button
                                    onClick={() => openBuy(pack, "pack")}
                                    disabled={!canWallet && !canCoin}
                                    className="mt-2 flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-primary to-primary/80 text-primary-foreground text-sm font-semibold font-body hover:opacity-90 transition-all disabled:opacity-40"
                                  >
                                    <ShoppingCart className="w-4 h-4" />
                                    {!canWallet && !canCoin ? "Solde insuffisant" : "Acheter ce pack"}
                                  </button>
                                ) : (
                                  <Link to="/connexion" className="mt-2 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-secondary border border-border text-foreground text-sm font-semibold font-body">
                                    Se connecter
                                  </Link>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* ── PRODUCTS SECTION ── */}
                {partnerProducts(selectedPartner.id).length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-4">
                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center"><Package className="w-4 h-4 text-primary" /></div>
                      <h3 className="text-lg font-heading font-bold text-foreground">Produits ({partnerProducts(selectedPartner.id).length})</h3>
                    </div>
                    <div className="space-y-3">
                      {partnerProducts(selectedPartner.id).map(prod => {
                        const prodCoins = coinsNeededFor(Number(prod.price));
                        const prodInCurrency = priceInCurrency(Number(prod.price), displayCurrency);
                        const canWallet = (profile?.wallet_balance || 0) >= Number(prod.price);
                        const canCoin = msnCoins >= prodCoins;
                        return (
                          <div key={prod.id} className="rounded-2xl border border-border bg-secondary/30 overflow-hidden hover:border-primary/30 transition-colors">
                            <div className="flex gap-4 p-4">
                              <div className="w-20 h-20 rounded-xl overflow-hidden bg-secondary flex-shrink-0 border border-border">
                                {prod.images?.[0] ? (
                                  <img src={prod.images[0]} alt={prod.name} className="w-full h-full object-cover" loading="lazy" />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center"><Package className="w-8 h-8 text-muted-foreground" /></div>
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <h4 className="font-heading font-bold text-foreground text-base mb-1">{prod.name}</h4>
                                {prod.description && <p className="text-xs text-muted-foreground font-body line-clamp-2 mb-2">{prod.description}</p>}
                                <div className="flex items-center gap-3 flex-wrap">
                                  <div>
                                    <span className="text-xl font-heading font-bold text-primary">{Number(prod.price).toLocaleString("fr-FR")} FCFA</span>
                                    {displayCurrency !== "XOF" && (
                                      <span className="block text-xs text-muted-foreground font-body">≈ {formatAmt(prodInCurrency, displayCurrency)} {sym(displayCurrency)}</span>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-2 text-xs font-body">
                                    <span className="flex items-center gap-1 text-gold">
                                      <Flame className="w-3 h-3" />{prodCoins} coins{canCoin && <span className="text-harvest-green">✓</span>}
                                    </span>
                                    {prod.allow_cod && (
                                      <span className="flex items-center gap-1 text-harvest-green bg-harvest-green/10 px-1.5 py-0.5 rounded-full">
                                        <Truck className="w-2.5 h-2.5" /> COD
                                      </span>
                                    )}
                                  </div>
                                </div>
                                {user ? (
                                  <button
                                    onClick={() => openBuy(prod, "product")}
                                    disabled={!canWallet && !canCoin && !prod.allow_cod}
                                    className="mt-2 flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold font-body hover:bg-primary/90 transition-colors disabled:opacity-40"
                                  >
                                    <ShoppingCart className="w-4 h-4" /> Acheter
                                  </button>
                                ) : (
                                  <Link to="/connexion" className="mt-2 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-secondary border border-border text-foreground text-sm font-semibold font-body">
                                    Se connecter
                                  </Link>
                                )}
                              </div>
                            </div>
                            {prod.images?.length > 1 && (
                              <div className="px-4 pb-3 flex gap-2 overflow-x-auto">
                                {prod.images.slice(1, 5).map((img: string, i: number) => (
                                  <img key={i} src={img} alt="" className="w-12 h-12 rounded-lg object-cover flex-shrink-0 border border-border" loading="lazy" />
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {partnerProducts(selectedPartner.id).length === 0 && partnerPacks(selectedPartner.id).length === 0 && (
                  <div className="text-center py-8 bg-secondary/30 rounded-2xl border border-dashed border-border">
                    <Package className="w-10 h-10 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground font-body">Aucun article disponible actuellement</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══ BUY MODAL ══ */}
      {buyItem && profile && (
        <div className="fixed inset-0 bg-foreground/60 flex items-end md:items-center justify-center z-[60] p-0 md:p-4 backdrop-blur-sm"
          onClick={() => { setBuyItem(null); setPurchaseDone(false); }}>
          <div
            className="bg-card w-full md:max-w-md md:rounded-3xl rounded-t-3xl overflow-hidden shadow-2xl border border-border"
            onClick={e => e.stopPropagation()}
          >
            {purchaseDone ? (
              <div className="p-8 text-center">
                <div className="w-20 h-20 rounded-full bg-harvest-green/10 flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-10 h-10 text-harvest-green" />
                </div>
                <h3 className="text-2xl font-heading font-bold text-foreground mb-2">
                  {paymentMode === "cod" ? "Commande enregistrée !" : "Achat réussi ! 🌾"}
                </h3>
                <p className="text-sm text-muted-foreground font-body mb-6">
                  {paymentMode === "cod"
                    ? "Votre commande est enregistrée. Vous paierez à la livraison."
                    : paymentMode === "msn"
                    ? `${itemCoins} MSN Coins utilisés pour cet achat.`
                    : `${Number(buyItem.price).toLocaleString("fr-FR")} FCFA déduits de votre portefeuille.`
                  }
                </p>
                {paymentMode !== "cod" && (
                  <p className="text-xs text-muted-foreground font-body mb-4">
                    Nouveau solde :{" "}
                    <span className="font-bold text-primary">
                      {paymentMode === "wallet"
                        ? (profile.wallet_balance - Number(buyItem.price)).toLocaleString("fr-FR")
                        : Number(profile.wallet_balance).toLocaleString("fr-FR")
                      } FCFA
                    </span>
                    {paymentMode === "msn" && (
                      <> | <span className="font-bold text-gold">{msnCoins - itemCoins} coins restants</span></>
                    )}
                  </p>
                )}
                <button onClick={() => { setBuyItem(null); setPurchaseDone(false); }} className="w-full btn-gold !text-sm !py-3">
                  Continuer les achats
                </button>
              </div>
            ) : (
              <>
                {/* Header */}
                <div className="p-6 border-b border-border">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-heading font-bold text-foreground">
                      {buyItemType === "pack" ? "🌾 Acheter le pack" : "🛒 Passer commande"}
                    </h3>
                    <button onClick={() => setBuyItem(null)} className="p-1.5 rounded-lg hover:bg-secondary transition-colors">
                      <X className="w-4 h-4 text-muted-foreground" />
                    </button>
                  </div>

                  {/* Item summary */}
                  <div className="flex items-center gap-3 bg-secondary/50 rounded-xl p-3">
                    <div className="w-14 h-14 rounded-xl overflow-hidden bg-secondary flex-shrink-0 border border-border">
                      {buyItem.images?.[0] ? (
                        <img src={buyItem.images[0]} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center"><Package className="w-6 h-6 text-muted-foreground" /></div>
                      )}
                    </div>
                    <div>
                      <p className="font-heading font-bold text-foreground">{buyItem.name}</p>
                      <p className="text-xl font-bold text-primary">{Number(buyItem.price).toLocaleString("fr-FR")} FCFA</p>
                      {displayCurrency !== "XOF" && (
                        <p className="text-xs text-muted-foreground font-body">≈ {formatAmt(priceInCurrency(Number(buyItem.price), displayCurrency), displayCurrency)} {sym(displayCurrency)}</p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="p-6 space-y-4 max-h-[65vh] overflow-y-auto">
                  {/* Balances */}
                  <div className="grid grid-cols-2 gap-2">
                    <div className={`p-3 rounded-xl border text-sm font-body text-center ${canPayWallet ? "border-primary/30 bg-primary/5" : "border-border bg-secondary/30"}`}>
                      <Wallet className={`w-4 h-4 mx-auto mb-1 ${canPayWallet ? "text-primary" : "text-muted-foreground"}`} />
                      <p className={`font-bold text-xs ${canPayWallet ? "text-primary" : "text-muted-foreground"}`}>{Number(profile.wallet_balance).toLocaleString("fr-FR")} FCFA</p>
                      <p className="text-[10px] text-muted-foreground">{canPayWallet ? "✓ Suffisant" : "Insuffisant"}</p>
                    </div>
                    <div className={`p-3 rounded-xl border text-sm font-body text-center ${canPayMSN ? "border-gold/30 bg-gold/5" : "border-border bg-secondary/30"}`}>
                      <Flame className={`w-4 h-4 mx-auto mb-1 ${canPayMSN ? "text-gold" : "text-muted-foreground"}`} />
                      <p className={`font-bold text-xs ${canPayMSN ? "text-gold" : "text-muted-foreground"}`}>{msnCoins} coins</p>
                      <p className="text-[10px] text-muted-foreground">{canPayMSN ? `✓ ${itemCoins} requis` : `${itemCoins} requis`}</p>
                    </div>
                  </div>

                  {/* Payment mode selection */}
                  <div>
                    <p className="text-sm font-medium text-foreground mb-2 font-body">Mode de paiement</p>
                    <div className="grid gap-2">
                      {/* Wallet */}
                      <button
                        type="button"
                        onClick={() => setPaymentMode("wallet")}
                        disabled={!canPayWallet}
                        className={`flex items-center gap-3 p-3 rounded-xl border-2 text-sm font-body text-left transition-all disabled:opacity-40 ${
                          paymentMode === "wallet" ? "border-primary bg-primary/10" : "border-border hover:border-primary/30"
                        }`}
                      >
                        <Wallet className={`w-5 h-5 flex-shrink-0 ${paymentMode === "wallet" ? "text-primary" : "text-muted-foreground"}`} />
                        <div>
                          <p className="font-semibold text-foreground">Portefeuille FCFA</p>
                          <p className="text-xs text-muted-foreground">{Number(profile.wallet_balance).toLocaleString("fr-FR")} FCFA disponibles</p>
                        </div>
                        {paymentMode === "wallet" && <div className="ml-auto w-4 h-4 rounded-full bg-primary" />}
                      </button>

                      {/* MSN Coins */}
                      <button
                        type="button"
                        onClick={() => setPaymentMode("msn")}
                        disabled={!canPayMSN}
                        className={`flex items-center gap-3 p-3 rounded-xl border-2 text-sm font-body text-left transition-all disabled:opacity-40 ${
                          paymentMode === "msn" ? "border-gold bg-gold/10" : "border-border hover:border-gold/30"
                        }`}
                      >
                        <div className={`w-5 h-5 flex-shrink-0 rounded-full flex items-center justify-center ${paymentMode === "msn" ? "bg-gold" : "bg-muted"}`}>
                          <Flame className="w-3 h-3 text-white" />
                        </div>
                        <div>
                          <p className="font-semibold text-foreground">MSN Coins 🔥</p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span>{itemCoins} coins requis (= {Number(buyItem.price).toLocaleString("fr-FR")} FCFA)</span>
                          </div>
                          <p className="text-[11px] text-gold">{msnCoins} coins disponibles</p>
                        </div>
                        {paymentMode === "msn" && <div className="ml-auto w-4 h-4 rounded-full bg-gold" />}
                      </button>

                      {/* COD */}
                      {canCOD && (
                        <button
                          type="button"
                          onClick={() => setPaymentMode("cod")}
                          className={`flex items-center gap-3 p-3 rounded-xl border-2 text-sm font-body text-left transition-all ${
                            paymentMode === "cod" ? "border-harvest-green bg-harvest-green/10" : "border-border hover:border-harvest-green/30"
                          }`}
                        >
                          <Truck className={`w-5 h-5 flex-shrink-0 ${paymentMode === "cod" ? "text-harvest-green" : "text-muted-foreground"}`} />
                          <div>
                            <p className="font-semibold text-foreground">Paiement à la livraison</p>
                            <p className="text-xs text-muted-foreground">Payez quand vous recevez le produit</p>
                          </div>
                          {paymentMode === "cod" && <div className="ml-auto w-4 h-4 rounded-full bg-harvest-green" />}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* MSN coin breakdown */}
                  {paymentMode === "msn" && (
                    <div className="bg-gold/5 border border-gold/20 rounded-xl p-3 text-xs font-body space-y-1">
                      <div className="flex justify-between"><span className="text-muted-foreground">Prix :</span><span className="font-bold">{Number(buyItem.price).toLocaleString("fr-FR")} FCFA</span></div>
                      <div className="flex justify-between"><span className="text-muted-foreground">Taux 1 coin :</span><span className="font-bold text-gold">{coinUsdRate} $ ≈ {Math.round(coinValueXOF).toLocaleString("fr-FR")} FCFA</span></div>
                      <div className="flex justify-between border-t border-gold/20 pt-1"><span className="text-muted-foreground">Coins utilisés :</span><span className="font-bold text-gold">{itemCoins} 🔥</span></div>
                      <div className="flex justify-between"><span className="text-muted-foreground">Coins restants :</span><span className={`font-bold ${msnCoins - itemCoins >= 0 ? "text-foreground" : "text-destructive"}`}>{msnCoins - itemCoins}</span></div>
                    </div>
                  )}

                  {/* Delivery form */}
                  <form onSubmit={handleBuy} className="space-y-3">
                    <p className="text-sm font-medium text-foreground font-body flex items-center gap-1.5">
                      <MapPin className="w-4 h-4 text-primary" /> Adresse de livraison
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      <input placeholder="Pays" value={deliveryForm.country} onChange={e => setDeliveryForm({...deliveryForm, country: e.target.value})}
                        className="px-4 py-3 rounded-xl border border-input bg-background text-foreground font-body text-sm col-span-2" />
                      <input placeholder="Ville" value={deliveryForm.city} onChange={e => setDeliveryForm({...deliveryForm, city: e.target.value})}
                        className="px-4 py-3 rounded-xl border border-input bg-background text-foreground font-body text-sm" />
                      <input placeholder="Quartier / Rue" value={deliveryForm.street} onChange={e => setDeliveryForm({...deliveryForm, street: e.target.value})}
                        className="px-4 py-3 rounded-xl border border-input bg-background text-foreground font-body text-sm" />
                    </div>
                    <input placeholder="Contact téléphone *" required value={deliveryForm.phone} onChange={e => setDeliveryForm({...deliveryForm, phone: e.target.value})}
                      className="w-full px-4 py-3 rounded-xl border border-input bg-background text-foreground font-body text-sm" />

                    {!canPayWallet && !canPayMSN && !canCOD && (
                      <div className="flex items-center gap-2 text-destructive text-xs font-body bg-destructive/5 border border-destructive/20 rounded-xl p-3">
                        <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                        Solde FCFA et MSN Coins insuffisants. Rechargez votre portefeuille.
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={submitting || (!canPayWallet && !canPayMSN && !canCOD) ||
                        (paymentMode === "wallet" && !canPayWallet) ||
                        (paymentMode === "msn" && !canPayMSN) }
                      className="w-full btn-gold !text-sm !py-3 disabled:opacity-50"
                    >
                      {submitting ? (
                        <span className="flex items-center justify-center gap-2">
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          Traitement...
                        </span>
                      ) : paymentMode === "cod" ? (
                        <span className="flex items-center justify-center gap-2"><Truck className="w-4 h-4" /> Commander — Payer à la livraison</span>
                      ) : paymentMode === "msn" ? (
                        <span className="flex items-center justify-center gap-2"><Flame className="w-4 h-4" /> Payer {itemCoins} MSN Coins</span>
                      ) : (
                        <span className="flex items-center justify-center gap-2"><Wallet className="w-4 h-4" /> Payer {Number(buyItem.price).toLocaleString("fr-FR")} FCFA</span>
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
