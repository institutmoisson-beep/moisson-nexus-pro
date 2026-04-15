import { useAuth } from "@/contexts/AuthContext";
import { useNavigate, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ShoppingCart, MapPin, Download, ChevronLeft, ChevronRight, ArrowLeft, Building2, X, TrendingUp, CheckCircle, FileText, Flame, Coins, Wallet } from "lucide-react";
import { toast } from "sonner";
import DashboardLayout from "@/components/DashboardLayout";
import { generatePurchaseReceiptHTML } from "@/lib/generatePDF";

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
  const [purchaseStep, setPurchaseStep] = useState<"form" | "processing" | "done">("form");
  const [completedOrderId, setCompletedOrderId] = useState<string>("");

  // Payment method: "wallet" or "msn"
  const [paymentMethod, setPaymentMethod] = useState<"wallet" | "msn">("wallet");
  const [msnCoins, setMsnCoins] = useState(0);
  const [coinUsdRate, setCoinUsdRate] = useState<number>(1);
  const [exchangeRates, setExchangeRates] = useState<Record<string, number>>({});

  useEffect(() => { if (!loading && !user) navigate("/connexion"); }, [user, loading]);
  useEffect(() => { if (user && id) loadData(); }, [user, id]);

  const loadData = async () => {
    const [packRes, profileRes, commRes, coinsRes, msnCfgRes] = await Promise.all([
      supabase.from("packs").select("*, partner_companies(*)").eq("id", id!).single(),
      supabase.from("profiles").select("*").eq("user_id", user!.id).single(),
      supabase.from("pack_commissions").select("*").eq("pack_id", id!).order("level_number"),
      supabase.from("msn_coins").select("coins").eq("user_id", user!.id).eq("is_converted", false),
      supabase.from("msn_config").select("*"),
    ]);
    setPack(packRes.data);
    setProfile(profileRes.data);
    setCommissions(commRes.data || []);

    const totalCoins = (coinsRes.data || []).reduce((s: number, c: any) => s + c.coins, 0);
    setMsnCoins(totalCoins);

    const cfgMap: Record<string, any> = {};
    (msnCfgRes.data || []).forEach((r: any) => { cfgMap[r.key] = r.value; });
    const rate = Number(cfgMap.coin_usd_rate) || 1;
    setCoinUsdRate(rate);

    if (profileRes.data) {
      setDeliveryForm({
        address: profileRes.data.address || "",
        city: profileRes.data.city || "",
        country: profileRes.data.country || "",
        phone: profileRes.data.phone || "",
        street: profileRes.data.street || "",
      });
    }

    // Fetch exchange rates for coin → FCFA conversion
    try {
      const res = await fetch("https://api.exchangerate-api.com/v4/latest/USD");
      const data = await res.json();
      setExchangeRates(data.rates || {});
    } catch {
      setExchangeRates({ XOF: 620 });
    }
  };

  // How many coins are needed to pay for this pack
  const coinValueInXOF = (coins: number) => {
    const usdValue = coins * coinUsdRate;
    const xofRate = exchangeRates["XOF"] || 620;
    return usdValue * xofRate;
  };

  const coinsNeeded = pack ? Math.ceil(Number(pack.price) / (coinUsdRate * (exchangeRates["XOF"] || 620))) : 0;
  const canPayWithMSN = msnCoins >= coinsNeeded && coinsNeeded > 0;

  const handleDownloadReceipt = (orderId: string) => {
    if (!profile || !pack) return;
    generatePurchaseReceiptHTML({
      memberName: `${profile.first_name} ${profile.last_name}`,
      memberEmail: profile.email,
      memberPhone: profile.phone,
      memberCity: profile.city,
      memberCountry: profile.country,
      referralCode: profile.referral_code,
      packName: pack.name,
      packPrice: Number(pack.price),
      orderId: orderId,
      deliveryCity: deliveryForm.city,
      deliveryCountry: deliveryForm.country,
      deliveryPhone: deliveryForm.phone,
      deliveryStreet: deliveryForm.street,
      commissions: commissions.map(c => ({ level: c.level_number, percentage: Number(c.percentage) })),
    });
  };

  const deductMSNCoins = async (coinsToUse: number) => {
    let toDeduct = coinsToUse;
    const { data: userCoins } = await supabase.from("msn_coins")
      .select("id, coins")
      .eq("user_id", user!.id)
      .eq("is_converted", false)
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

  const handlePurchase = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pack || !profile) return;

    // Validate payment method
    if (paymentMethod === "wallet") {
      if (Number(profile.wallet_balance) < Number(pack.price)) {
        toast.error("Solde insuffisant ! Rechargez votre portefeuille.");
        return;
      }
    } else {
      if (!canPayWithMSN) {
        toast.error(`Coins insuffisants ! Il faut ${coinsNeeded} coins, vous en avez ${msnCoins}.`);
        return;
      }
    }

    setSubmitting(true);
    setPurchaseStep("processing");

    try {
      // Create order
      const { data: orderData, error: orderError } = await supabase
        .from("pack_orders")
        .insert({
          user_id: user!.id,
          pack_id: pack.id,
          amount_paid: pack.price,
          delivery_address: deliveryForm.address,
          delivery_city: deliveryForm.city,
          delivery_country: deliveryForm.country,
          delivery_phone: deliveryForm.phone,
          delivery_street: deliveryForm.street,
        })
        .select("id")
        .single();

      if (orderError) throw new Error("Erreur commande: " + orderError.message);

      // Update profile (MLM activation + delivery address)
      const profileUpdate: any = {};
      if (deliveryForm.address) profileUpdate.address = deliveryForm.address;
      if (deliveryForm.city) profileUpdate.city = deliveryForm.city;
      if (deliveryForm.street) profileUpdate.street = deliveryForm.street;
      if (deliveryForm.country) profileUpdate.country = deliveryForm.country;
      if (deliveryForm.phone) profileUpdate.phone = deliveryForm.phone;
      if (pack.is_mlm_pack) profileUpdate.is_mlm_active = true;

      if (paymentMethod === "wallet") {
        profileUpdate.wallet_balance = Number(profile.wallet_balance) - Number(pack.price);
      }

      const { error: profileError } = await supabase
        .from("profiles")
        .update(profileUpdate)
        .eq("user_id", user!.id);

      if (profileError) throw new Error("Erreur portefeuille: " + profileError.message);

      // Deduct MSN coins if paid with coins
      if (paymentMethod === "msn") {
        await deductMSNCoins(coinsNeeded);
        // Record the conversion as a bonus transaction
        await supabase.from("transactions").insert({
          user_id: user!.id,
          amount: pack.price,
          type: "pack_purchase" as const,
          status: "approved" as const,
          description: `Achat pack "${pack.name}" avec ${coinsNeeded} MSN Coins`,
          metadata: { pack_id: pack.id, pack_name: pack.name, order_id: orderData?.id, payment_method: "msn_coins", coins_used: coinsNeeded },
          processed_at: new Date().toISOString(),
        });
      } else {
        // Record wallet transaction
        const { error: txError } = await supabase.from("transactions").insert({
          user_id: user!.id,
          amount: pack.price,
          type: "pack_purchase" as const,
          status: "approved" as const,
          description: `Achat ${pack.is_mlm_pack ? "pack MLM" : "produit"}: ${pack.name}`,
          metadata: { pack_id: pack.id, pack_name: pack.name, order_id: orderData?.id },
          processed_at: new Date().toISOString(),
        });
        if (txError) throw new Error("Erreur transaction: " + txError.message);
      }

      // Distribute commissions automatically
      if (pack.is_mlm_pack) {
        const { error: commError } = await supabase.rpc("distribute_commissions", {
          _buyer_user_id: user!.id,
          _pack_id: pack.id,
          _pack_price: Number(pack.price),
          _pack_name: pack.name,
        });
        if (commError) {
          console.error("Commission distribution error:", commError);
          toast.warning("Achat réussi. Erreur partielle de distribution des commissions — l'admin sera notifié.");
        }
      }

      // Award MSN coins for the purchase (only if paid with wallet)
      if (paymentMethod === "wallet" && orderData?.id) {
        const { error: coinError } = await supabase.rpc("award_msn_coins", {
          _buyer_user_id: user!.id,
          _order_id: orderData.id,
        });
        if (coinError) console.error("MSN coins award error:", coinError);
      }

      setCompletedOrderId(orderData?.id || "");
      setPurchaseStep("done");
      toast.success("🌾 Achat effectué ! Téléchargez votre reçu ci-dessous.");

      setTimeout(() => {
        if (orderData?.id) handleDownloadReceipt(orderData.id);
        loadData();
      }, 800);

    } catch (error: any) {
      toast.error(error.message || "Une erreur est survenue");
      setPurchaseStep("form");
      setSubmitting(false);
    }
  };

  if (loading || !pack || !profile) {
    return (
      <DashboardLayout>
        <div className="animate-pulse text-muted-foreground font-body text-center py-12">Chargement...</div>
      </DashboardLayout>
    );
  }

  const images: string[] = pack.images || [];
  const totalCommission = commissions.reduce((sum: number, c: any) => sum + c.percentage, 0);
  const xofRate = exchangeRates["XOF"] || 620;

  return (
    <DashboardLayout>
      <button
        onClick={() => navigate("/packs")}
        className="flex items-center gap-2 text-muted-foreground hover:text-foreground font-body text-sm mb-4 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Retour aux packs
      </button>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Images */}
        <div>
          {images.length > 0 ? (
            <div
              className="relative rounded-xl overflow-hidden bg-secondary aspect-square mb-3 cursor-pointer"
              onClick={() => setLightboxOpen(true)}
            >
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
            <div className="flex gap-2 overflow-x-auto pb-1">
              {images.map((img, i) => (
                <img key={i} src={img} alt="" onClick={() => setImgIndex(i)}
                  className={`w-16 h-16 rounded-lg object-cover cursor-pointer border-2 shrink-0 ${i === imgIndex ? "border-primary" : "border-transparent hover:border-border"}`} />
              ))}
            </div>
          )}
        </div>

        {/* Details */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <h1 className="text-3xl font-heading font-bold text-foreground">{pack.name}</h1>
            {!pack.is_mlm_pack && (
              <span className="text-xs bg-accent/20 text-accent-foreground px-2 py-0.5 rounded-full">Produit</span>
            )}
          </div>

          {pack.partner_companies?.name && (
            <p className="flex items-center gap-2 text-muted-foreground font-body text-sm mb-4">
              <Building2 className="w-4 h-4" /> par {pack.partner_companies.name}
            </p>
          )}

          <p className="text-4xl font-heading font-bold text-primary mb-4">
            {Number(pack.price).toLocaleString("fr-FR")} FCFA
          </p>

          {pack.description && (
            <div className="mb-4">
              <h3 className="font-heading font-semibold text-foreground mb-2">Description</h3>
              <p className="text-sm text-muted-foreground font-body whitespace-pre-line">{pack.description}</p>
            </div>
          )}

          {pack.physical_prizes && (
            <div className="bg-gold/5 border border-gold/20 rounded-xl p-4 mb-4">
              <h3 className="font-heading font-semibold text-foreground mb-2">🎁 Inclus dans ce pack</h3>
              <p className="text-sm text-muted-foreground font-body">{pack.physical_prizes}</p>
            </div>
          )}

          {commissions.length > 0 && pack.is_mlm_pack && (
            <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 mb-4">
              <h3 className="font-heading font-semibold text-foreground mb-3 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-primary" /> Commissions de parrainage
              </h3>
              <div className="grid grid-cols-2 gap-1 max-h-40 overflow-y-auto pr-1">
                {commissions.map(c => (
                  <div key={c.id} className="flex justify-between text-xs font-body py-1 border-b border-border/30">
                    <span className="text-muted-foreground">Niveau {c.level_number}</span>
                    <span className="font-semibold text-primary">{c.percentage}%
                      <span className="text-muted-foreground font-normal ml-1">
                        ({Math.round(Number(pack.price) * c.percentage / 100).toLocaleString("fr-FR")} F)
                      </span>
                    </span>
                  </div>
                ))}
              </div>
              {commissions.length > 0 && (
                <p className="text-xs text-muted-foreground font-body mt-2 pt-2 border-t border-border/30">
                  Total redistribué : <strong className="text-primary">
                    {totalCommission.toFixed(2)}% = {Math.round(Number(pack.price) * totalCommission / 100).toLocaleString("fr-FR")} FCFA
                  </strong>
                </p>
              )}
            </div>
          )}

          {/* Payment options summary */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="p-3 bg-secondary rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                <Wallet className="w-4 h-4 text-primary" />
                <span className="text-xs text-muted-foreground font-body">Portefeuille</span>
              </div>
              <p className={`font-bold text-sm ${Number(profile.wallet_balance) >= Number(pack.price) ? "text-harvest-green" : "text-destructive"}`}>
                {Number(profile.wallet_balance).toLocaleString("fr-FR")} FCFA
              </p>
              {Number(profile.wallet_balance) < Number(pack.price) && (
                <p className="text-[10px] text-destructive font-body">Insuffisant</p>
              )}
            </div>
            <div className="p-3 bg-gradient-to-br from-primary/5 to-gold/5 rounded-lg border border-gold/20">
              <div className="flex items-center gap-2 mb-1">
                <Flame className="w-4 h-4 text-gold" />
                <span className="text-xs text-muted-foreground font-body">MSN Coins</span>
              </div>
              <p className={`font-bold text-sm ${canPayWithMSN ? "text-harvest-green" : "text-muted-foreground"}`}>
                {msnCoins} coins
              </p>
              <p className="text-[10px] text-muted-foreground font-body">
                {coinsNeeded > 0 ? `Besoin: ${coinsNeeded} coins` : ""}
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <button
              onClick={() => setShowPurchase(true)}
              disabled={Number(profile.wallet_balance) < Number(pack.price) && !canPayWithMSN}
              className="btn-gold w-full !py-3 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ShoppingCart className="w-5 h-5 mr-2" />
              {Number(profile.wallet_balance) < Number(pack.price) && !canPayWithMSN
                ? "Solde insuffisant (portefeuille et coins)"
                : "Acheter ce pack"}
            </button>
          </div>
        </div>
      </div>

      {/* Lightbox */}
      {lightboxOpen && images.length > 0 && (
        <div className="fixed inset-0 bg-foreground/95 flex items-center justify-center z-50" onClick={() => setLightboxOpen(false)}>
          <button className="absolute top-4 right-4 p-2 text-background z-50" onClick={() => setLightboxOpen(false)}>
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
        <div className="fixed inset-0 bg-foreground/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-card rounded-2xl border border-border p-6 w-full max-w-md max-h-[90vh] overflow-y-auto shadow-2xl">

            {purchaseStep === "done" ? (
              <div className="text-center py-6">
                <div className="w-20 h-20 rounded-full bg-harvest-green/10 flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-10 h-10 text-harvest-green" />
                </div>
                <h2 className="text-2xl font-heading font-bold text-foreground mb-2">Achat réussi ! 🌾</h2>
                <p className="text-sm text-muted-foreground font-body mb-2">
                  Votre commande a été enregistrée. Un reçu PDF s'ouvre automatiquement.
                </p>
                <p className="text-xs text-muted-foreground font-body mb-6">
                  Référence : <span className="font-mono font-bold">{completedOrderId.slice(0, 16).toUpperCase()}</span>
                </p>
                <div className="space-y-3">
                  <button
                    onClick={() => handleDownloadReceipt(completedOrderId)}
                    className="w-full btn-hero !text-sm !py-3 flex items-center justify-center gap-2"
                  >
                    <FileText className="w-4 h-4" /> Télécharger le reçu + Contrat PDF
                  </button>
                  <button
                    onClick={() => { setShowPurchase(false); setPurchaseStep("form"); setSubmitting(false); }}
                    className="w-full px-4 py-2.5 rounded-lg border border-input text-muted-foreground font-body text-sm hover:bg-secondary"
                  >
                    Fermer
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-heading font-bold text-foreground">🛒 Confirmer l'achat</h2>
                  <button onClick={() => { setShowPurchase(false); setPurchaseStep("form"); }}
                    className="p-1.5 rounded-lg hover:bg-secondary transition-colors">
                    <X className="w-4 h-4 text-muted-foreground" />
                  </button>
                </div>

                {/* Pack summary */}
                <div className="bg-secondary rounded-xl p-4 mb-4">
                  <p className="font-heading font-semibold text-foreground">{pack.name}</p>
                  <p className="text-2xl font-bold text-primary">{Number(pack.price).toLocaleString("fr-FR")} FCFA</p>
                  {pack.is_mlm_pack && commissions.length > 0 && (
                    <p className="text-xs text-harvest-green font-body mt-1">
                      ✓ {commissions.length} niveau(x) de parrainage — commissions distribuées automatiquement
                    </p>
                  )}
                </div>

                {/* Payment method selector */}
                <div className="mb-4">
                  <p className="text-sm font-medium text-foreground mb-2 font-body">Mode de paiement</p>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setPaymentMethod("wallet")}
                      disabled={Number(profile.wallet_balance) < Number(pack.price)}
                      className={`flex flex-col items-center gap-1 p-3 rounded-xl border-2 transition-all text-sm font-body disabled:opacity-40 ${
                        paymentMethod === "wallet"
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border text-muted-foreground hover:border-primary/50"
                      }`}
                    >
                      <Wallet className="w-5 h-5" />
                      <span className="font-semibold">Portefeuille</span>
                      <span className="text-xs">{Number(profile.wallet_balance).toLocaleString("fr-FR")} FCFA</span>
                      {Number(profile.wallet_balance) < Number(pack.price) && (
                        <span className="text-[10px] text-destructive">Insuffisant</span>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => setPaymentMethod("msn")}
                      disabled={!canPayWithMSN}
                      className={`flex flex-col items-center gap-1 p-3 rounded-xl border-2 transition-all text-sm font-body disabled:opacity-40 ${
                        paymentMethod === "msn"
                          ? "border-gold bg-gold/10 text-gold"
                          : "border-border text-muted-foreground hover:border-gold/50"
                      }`}
                    >
                      <Flame className="w-5 h-5 text-gold" />
                      <span className="font-semibold">MSN Coins</span>
                      <span className="text-xs">{msnCoins} coins dispo</span>
                      {coinsNeeded > 0 && (
                        <span className="text-[10px] text-muted-foreground">
                          {canPayWithMSN ? `Utilise ${coinsNeeded} coins` : `Besoin: ${coinsNeeded}`}
                        </span>
                      )}
                    </button>
                  </div>
                </div>

                {/* Selected payment summary */}
                {paymentMethod === "wallet" && (
                  <div className="bg-primary/5 rounded-lg p-3 mb-4 text-xs font-body">
                    <p className="text-muted-foreground">Solde après achat :
                      <span className="font-bold text-primary ml-1">
                        {(Number(profile.wallet_balance) - Number(pack.price)).toLocaleString("fr-FR")} FCFA
                      </span>
                    </p>
                  </div>
                )}
                {paymentMethod === "msn" && (
                  <div className="bg-gold/5 rounded-lg p-3 mb-4 text-xs font-body border border-gold/20">
                    <p className="text-muted-foreground">
                      Paiement avec <span className="font-bold text-gold">{coinsNeeded} MSN Coins</span>
                      {" "}(≈ {Math.round(coinValueInXOF(coinsNeeded)).toLocaleString("fr-FR")} FCFA)
                    </p>
                    <p className="text-muted-foreground mt-1">Coins restants : <span className="font-bold text-foreground">{msnCoins - coinsNeeded}</span></p>
                    <p className="text-amber-600 mt-1">⚠️ Aucun MSN Coin ne sera attribué pour un achat avec coins</p>
                  </div>
                )}

                <div className="bg-primary/5 border border-primary/20 rounded-lg p-3 mb-4 flex items-start gap-2">
                  <FileText className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                  <p className="text-xs font-body text-muted-foreground">
                    Un <strong className="text-foreground">reçu d'achat + contrat de garantie PDF</strong> sera généré automatiquement.
                  </p>
                </div>

                <form onSubmit={handlePurchase} className="space-y-3">
                  <h3 className="font-heading font-semibold text-foreground flex items-center gap-2 text-sm">
                    <MapPin className="w-4 h-4" /> Adresse de livraison
                  </h3>
                  <input placeholder="Pays *" required value={deliveryForm.country}
                    onChange={e => setDeliveryForm({ ...deliveryForm, country: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-lg border border-input bg-background text-foreground font-body text-sm" />
                  <input placeholder="Ville *" required value={deliveryForm.city}
                    onChange={e => setDeliveryForm({ ...deliveryForm, city: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-lg border border-input bg-background text-foreground font-body text-sm" />
                  <input placeholder="Quartier / Rue" value={deliveryForm.street}
                    onChange={e => setDeliveryForm({ ...deliveryForm, street: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-lg border border-input bg-background text-foreground font-body text-sm" />
                  <input placeholder="Adresse complète" value={deliveryForm.address}
                    onChange={e => setDeliveryForm({ ...deliveryForm, address: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-lg border border-input bg-background text-foreground font-body text-sm" />
                  <input placeholder="Contact téléphone *" required value={deliveryForm.phone}
                    onChange={e => setDeliveryForm({ ...deliveryForm, phone: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-lg border border-input bg-background text-foreground font-body text-sm" />

                  <div className="flex gap-3 pt-2">
                    <button type="submit" disabled={submitting || (paymentMethod === "wallet" && Number(profile.wallet_balance) < Number(pack.price)) || (paymentMethod === "msn" && !canPayWithMSN)}
                      className="flex-1 btn-gold !text-sm !py-2.5 disabled:opacity-50">
                      {submitting ? (
                        <span className="flex items-center gap-2">
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          Traitement...
                        </span>
                      ) : paymentMethod === "msn"
                        ? `🔥 Payer avec ${coinsNeeded} coins`
                        : "Confirmer l'achat"
                      }
                    </button>
                    <button type="button" onClick={() => { setShowPurchase(false); setPurchaseStep("form"); }}
                      className="px-4 py-2.5 rounded-lg border border-input text-muted-foreground font-body text-sm hover:bg-secondary">
                      Annuler
                    </button>
                  </div>
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default PackDetailPage;
