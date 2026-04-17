import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  ShoppingCart, ChevronLeft, ChevronRight, Download, FileText,
  Clock, TrendingUp, Wallet, Flame, Coins, CheckCircle, X,
  Package, Shield, Info, RefreshCw, AlertTriangle
} from "lucide-react";
import { toast } from "sonner";
import DashboardLayout from "@/components/DashboardLayout";
import { generateMandateContractPDF } from "@/lib/mandateContract";

const MandateMarketplace = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [packs, setPacks] = useState<any[]>([]);
  const [profile, setProfile] = useState<any>(null);
  const [mySubscriptions, setMySubscriptions] = useState<any[]>([]);
  const [selectedPack, setSelectedPack] = useState<any>(null);
  const [imgIndex, setImgIndex] = useState(0);
  const [activeTab, setActiveTab] = useState<"marketplace" | "my_packs">("marketplace");
  const [showBuyModal, setShowBuyModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"wallet" | "msn">("wallet");
  const [submitting, setSubmitting] = useState(false);
  const [purchaseDone, setPurchaseDone] = useState<any>(null);
  const [msnCoins, setMsnCoins] = useState(0);
  const [coinUsdRate, setCoinUsdRate] = useState(1);
  const [exchangeRates, setExchangeRates] = useState<Record<string, number>>({});

  useEffect(() => { if (!loading && !user) navigate("/connexion"); }, [user, loading]);
  useEffect(() => { if (user) { loadData(); fetchRates(); } }, [user]);

  const loadData = async () => {
    const [packsRes, profileRes, subsRes, coinsRes, msnCfgRes] = await Promise.all([
      (supabase as any).from("mandate_packs").select("*").eq("is_active", true).order("created_at", { ascending: false }),
      supabase.from("profiles").select("*").eq("user_id", user!.id).single(),
      (supabase as any).from("mandate_subscriptions").select("*, mandate_packs(*)").eq("user_id", user!.id).order("created_at", { ascending: false }),
      supabase.from("msn_coins").select("coins").eq("user_id", user!.id).eq("is_converted", false),
      supabase.from("msn_config").select("*"),
    ]);
    setPacks(packsRes.data || []);
    setProfile(profileRes.data);
    setMySubscriptions(subsRes.data || []);
    setMsnCoins((coinsRes.data || []).reduce((s: number, c: any) => s + c.coins, 0));
    const cfgMap: Record<string, any> = {};
    (msnCfgRes.data || []).forEach((r: any) => { cfgMap[r.key] = r.value; });
    setCoinUsdRate(Number(cfgMap.coin_usd_rate) || 1);
  };

  const fetchRates = async () => {
    try {
      const res = await fetch("https://api.exchangerate-api.com/v4/latest/USD");
      const data = await res.json();
      setExchangeRates(data.rates || {});
    } catch { setExchangeRates({ XOF: 620 }); }
  };

  const coinValueXOF = coinUsdRate * (exchangeRates.XOF || 620);
  const coinsNeeded = selectedPack ? Math.ceil(Number(selectedPack.price_fcfa) / coinValueXOF) : 0;
  const canWallet = selectedPack ? Number(profile?.wallet_balance || 0) >= Number(selectedPack.price_fcfa) : false;
  const canMSN = selectedPack ? msnCoins >= coinsNeeded : false;

  const openPack = (pack: any) => {
    setSelectedPack(pack);
    setImgIndex(0);
    setPurchaseDone(null);
    const bal = Number(profile?.wallet_balance || 0);
    setPaymentMethod(bal >= Number(pack.price_fcfa) ? "wallet" : "msn");
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

  const handlePurchase = async () => {
    if (!selectedPack || !profile) return;
    if (paymentMethod === "wallet" && !canWallet) { toast.error("Solde insuffisant"); return; }
    if (paymentMethod === "msn" && !canMSN) { toast.error(`Il faut ${coinsNeeded} coins, vous en avez ${msnCoins}`); return; }

    setSubmitting(true);
    try {
      const price = Number(selectedPack.price_fcfa);
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + (selectedPack.duration_days || 30));

      // Create subscription
      const { data: subData, error: subErr } = await (supabase as any)
        .from("mandate_subscriptions")
        .insert({
          user_id: user!.id,
          mandate_pack_id: selectedPack.id,
          amount_paid: price,
          payment_method: paymentMethod,
          coins_used: paymentMethod === "msn" ? coinsNeeded : null,
          status: "active",
          end_date: endDate.toISOString(),
          next_commission_date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
          total_commissions_paid: 0,
        })
        .select("id")
        .single();

      if (subErr) throw new Error(subErr.message);

      // Deduct payment
      if (paymentMethod === "wallet") {
        await supabase.from("profiles").update({ wallet_balance: Number(profile.wallet_balance) - price }).eq("user_id", user!.id);
        await supabase.from("transactions").insert({
          user_id: user!.id, amount: price,
          type: "pack_purchase" as const, status: "approved" as const,
          description: `Souscription Mandat de Vente — Pack: ${selectedPack.name}`,
          metadata: { mandate_pack_id: selectedPack.id, subscription_id: subData?.id },
          processed_at: new Date().toISOString(),
        });
      } else {
        await deductMSNCoins(coinsNeeded);
        await supabase.from("transactions").insert({
          user_id: user!.id, amount: price,
          type: "pack_purchase" as const, status: "approved" as const,
          description: `Souscription Mandat de Vente avec ${coinsNeeded} MSN Coins — Pack: ${selectedPack.name}`,
          metadata: { mandate_pack_id: selectedPack.id, subscription_id: subData?.id, coins_used: coinsNeeded },
          processed_at: new Date().toISOString(),
        });
      }

      // Generate contract data
      const nextPayDate = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toLocaleDateString("fr-FR");
      const contractData = {
        transactionId: subData?.id || "TMP",
        purchaseDate: new Date().toISOString(),
        userName: `${profile.first_name} ${profile.last_name}`,
        userEmail: profile.email,
        userCity: profile.city,
        userCountry: profile.country,
        packName: selectedPack.name,
        packPrice: price,
        commissionEvery3Days: Number(selectedPack.commission_every_3_days),
        durationDays: selectedPack.duration_days || 30,
        nextPaymentDate: nextPayDate,
        paymentMethod,
        coinsUsed: paymentMethod === "msn" ? coinsNeeded : undefined,
      };

      setPurchaseDone({ contractData, subscriptionId: subData?.id });
      await loadData();

      // Auto-generate contract
      setTimeout(() => generateMandateContractPDF(contractData), 800);
      toast.success("🌾 Souscription réussie ! Votre contrat PDF est généré.");
    } catch (err: any) {
      toast.error(err.message || "Erreur lors de la souscription");
    } finally {
      setSubmitting(false);
    }
  };

  const getDaysLeft = (endDate: string) => {
    const days = Math.ceil((new Date(endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    return Math.max(0, days);
  };

  const getNextCommissionDate = (sub: any) => {
    const d = new Date(sub.next_commission_date || sub.created_at);
    return d.toLocaleDateString("fr-FR");
  };

  const totalExpected = (sub: any) => {
    const pack = sub.mandate_packs;
    if (!pack) return 0;
    return Math.floor((pack.duration_days || 30) / 3) * Number(pack.commission_every_3_days);
  };

  if (loading || !profile) {
    return (
      <DashboardLayout>
        <div className="animate-pulse text-muted-foreground font-body text-center py-12">Chargement...</div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-heading font-bold text-foreground mb-2">🏬 Vente par Mandat</h1>
        <p className="text-muted-foreground font-body">
          Investissez dans un pack, Institut Moisson vend pour vous. Commissions versées automatiquement toutes les 72h.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-secondary p-1 rounded-xl mb-6 w-fit">
        {[
          { key: "marketplace", label: "📦 Marketplace" },
          { key: "my_packs", label: `📋 Mes Mandats (${mySubscriptions.length})` },
        ].map(tab => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key as any)}
            className={`px-5 py-2.5 rounded-lg text-sm font-body font-semibold transition-all ${activeTab === tab.key ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* ═══ MARKETPLACE ═══ */}
      {activeTab === "marketplace" && (
        <div>
          {/* Info banner */}
          <div className="card-elevated border-primary/20 bg-gradient-to-r from-primary/5 to-gold/5 mb-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-gold flex items-center justify-center flex-shrink-0">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="font-heading font-bold text-foreground mb-1">Comment ça marche ?</h2>
                <div className="grid sm:grid-cols-3 gap-3 mt-2">
                  {[
                    { n: "1", t: "Achetez un pack", d: "Choisissez et financez un stock de marchandises" },
                    { n: "2", t: "Institut Moisson vend", d: "On gère tout : stockage, logistique, distribution" },
                    { n: "3", t: "Commissions auto", d: "Recevez vos gains dans votre portefeuille tous les 3 jours" },
                  ].map(s => (
                    <div key={s.n} className="flex items-start gap-2">
                      <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">{s.n}</span>
                      <div>
                        <p className="text-sm font-semibold text-foreground font-body">{s.t}</p>
                        <p className="text-xs text-muted-foreground font-body">{s.d}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Pack grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {packs.map(pack => {
              const totalComm = Math.floor((pack.duration_days || 30) / 3) * Number(pack.commission_every_3_days);
              const roi = (totalComm / Number(pack.price_fcfa) * 100).toFixed(1);
              return (
                <div key={pack.id}
                  onClick={() => { openPack(pack); setShowBuyModal(false); }}
                  className="card-elevated cursor-pointer hover:shadow-xl hover:border-primary/30 transition-all hover:-translate-y-1 group">
                  {pack.images?.[0] ? (
                    <div className="relative rounded-xl overflow-hidden aspect-video mb-4 bg-secondary">
                      <img src={pack.images[0]} alt={pack.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      <div className="absolute top-2 right-2 bg-harvest-green text-white text-xs px-2.5 py-1 rounded-full font-semibold">
                        +{roi}% ROI
                      </div>
                    </div>
                  ) : (
                    <div className="relative rounded-xl aspect-video mb-4 bg-gradient-to-br from-primary/10 to-gold/10 flex items-center justify-center">
                      <Package className="w-12 h-12 text-primary/40" />
                      <div className="absolute top-2 right-2 bg-harvest-green text-white text-xs px-2.5 py-1 rounded-full font-semibold">
                        +{roi}% ROI
                      </div>
                    </div>
                  )}
                  <h3 className="font-heading font-bold text-foreground text-lg mb-1">{pack.name}</h3>
                  {pack.description && <p className="text-sm text-muted-foreground font-body line-clamp-2 mb-3">{pack.description}</p>}
                  <div className="grid grid-cols-3 gap-2 text-center mb-3">
                    <div className="bg-secondary rounded-lg p-2">
                      <p className="text-[10px] text-muted-foreground font-body">Investissement</p>
                      <p className="text-sm font-bold text-primary">{Number(pack.price_fcfa).toLocaleString("fr-FR")} F</p>
                    </div>
                    <div className="bg-harvest-green/10 rounded-lg p-2">
                      <p className="text-[10px] text-muted-foreground font-body">Comm/3j</p>
                      <p className="text-sm font-bold text-harvest-green">{Number(pack.commission_every_3_days).toLocaleString("fr-FR")} F</p>
                    </div>
                    <div className="bg-secondary rounded-lg p-2">
                      <p className="text-[10px] text-muted-foreground font-body">Durée</p>
                      <p className="text-sm font-bold text-foreground">{pack.duration_days}j</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground font-body">
                      Total estimé: <span className="text-harvest-green font-bold">{totalComm.toLocaleString("fr-FR")} FCFA</span>
                    </span>
                    <span className="text-sm text-primary font-semibold font-body">Voir →</span>
                  </div>
                </div>
              );
            })}
            {packs.length === 0 && (
              <div className="col-span-3 text-center py-16">
                <Package className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground font-body">Aucun pack disponible pour le moment</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ═══ MY PACKS ═══ */}
      {activeTab === "my_packs" && (
        <div className="space-y-4">
          {mySubscriptions.map(sub => {
            const pack = sub.mandate_packs;
            if (!pack) return null;
            const daysLeft = getDaysLeft(sub.end_date);
            const isActive = sub.status === "active" && daysLeft > 0;
            const progressPct = Math.min(100, ((pack.duration_days - daysLeft) / pack.duration_days) * 100);
            return (
              <div key={sub.id} className={`card-elevated ${!isActive ? "opacity-70" : ""}`}>
                <div className="flex items-start gap-4 mb-4">
                  {pack.images?.[0] && (
                    <img src={pack.images[0]} alt={pack.name} className="w-16 h-16 rounded-xl object-cover border border-border flex-shrink-0" />
                  )}
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h3 className="font-heading font-semibold text-foreground">{pack.name}</h3>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${isActive ? "bg-harvest-green/20 text-harvest-green" : "bg-muted text-muted-foreground"}`}>
                        {isActive ? `✓ Actif — ${daysLeft}j restants` : "Terminé"}
                      </span>
                    </div>
                    <p className="text-sm text-primary font-bold">{Number(sub.amount_paid).toLocaleString("fr-FR")} FCFA investis</p>
                    <p className="text-xs text-muted-foreground font-body">Souscrit le {new Date(sub.created_at).toLocaleDateString("fr-FR")}</p>
                  </div>
                </div>

                {/* Progress */}
                <div className="mb-4">
                  <div className="flex justify-between text-xs text-muted-foreground font-body mb-1">
                    <span>Progression du mandat</span>
                    <span>{Math.round(progressPct)}%</span>
                  </div>
                  <div className="h-2 bg-secondary rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-primary to-harvest-green rounded-full transition-all" style={{ width: `${progressPct}%` }} />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3 mb-4 text-center">
                  <div className="bg-harvest-green/10 rounded-lg p-3">
                    <p className="text-xs text-muted-foreground font-body">Commissions reçues</p>
                    <p className="text-lg font-bold text-harvest-green">{Number(sub.total_commissions_paid || 0).toLocaleString("fr-FR")} F</p>
                  </div>
                  <div className="bg-secondary rounded-lg p-3">
                    <p className="text-xs text-muted-foreground font-body">Prochaine commission</p>
                    <p className="text-sm font-bold text-primary">{getNextCommissionDate(sub)}</p>
                  </div>
                  <div className="bg-gold/10 rounded-lg p-3">
                    <p className="text-xs text-muted-foreground font-body">Total estimé</p>
                    <p className="text-sm font-bold text-gold">{totalExpected(sub).toLocaleString("fr-FR")} F</p>
                  </div>
                </div>

                <button
                  onClick={() => {
                    const contractData = {
                      transactionId: sub.id,
                      purchaseDate: sub.created_at,
                      userName: `${profile.first_name} ${profile.last_name}`,
                      userEmail: profile.email,
                      userCity: profile.city,
                      userCountry: profile.country,
                      packName: pack.name,
                      packPrice: Number(sub.amount_paid),
                      commissionEvery3Days: Number(pack.commission_every_3_days),
                      durationDays: pack.duration_days || 30,
                      nextPaymentDate: getNextCommissionDate(sub),
                      paymentMethod: sub.payment_method || "wallet",
                      coinsUsed: sub.coins_used,
                    };
                    generateMandateContractPDF(contractData);
                  }}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary/10 text-primary text-sm font-body font-semibold hover:bg-primary/20 transition-colors"
                >
                  <Download className="w-4 h-4" /> Télécharger le contrat PDF
                </button>
              </div>
            );
          })}
          {mySubscriptions.length === 0 && (
            <div className="text-center py-16">
              <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground font-body">Vous n'avez pas encore de mandat actif.</p>
              <button onClick={() => setActiveTab("marketplace")} className="mt-4 btn-hero !text-sm !py-2.5 !px-6">
                Voir les packs disponibles
              </button>
            </div>
          )}
        </div>
      )}

      {/* ═══ PACK DETAIL MODAL ═══ */}
      {selectedPack && !showBuyModal && (
        <div className="fixed inset-0 bg-foreground/60 flex items-end md:items-center justify-center z-50 p-0 md:p-4 backdrop-blur-sm"
          onClick={() => setSelectedPack(null)}>
          <div className="bg-card w-full md:max-w-2xl md:rounded-3xl rounded-t-3xl overflow-hidden shadow-2xl border border-border max-h-[90vh] flex flex-col"
            onClick={e => e.stopPropagation()}>
            
            {/* Images */}
            {selectedPack.images?.length > 0 && (
              <div className="relative h-52 bg-secondary flex-shrink-0 overflow-hidden">
                <img src={selectedPack.images[imgIndex]} alt={selectedPack.name} className="w-full h-full object-cover" />
                {selectedPack.images.length > 1 && (
                  <>
                    <button onClick={() => setImgIndex(i => (i - 1 + selectedPack.images.length) % selectedPack.images.length)}
                      className="absolute left-3 top-1/2 -translate-y-1/2 p-2 bg-black/50 text-white rounded-full">
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button onClick={() => setImgIndex(i => (i + 1) % selectedPack.images.length)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-2 bg-black/50 text-white rounded-full">
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </>
                )}
                <button onClick={() => setSelectedPack(null)}
                  className="absolute top-3 right-3 w-9 h-9 bg-black/50 text-white rounded-full flex items-center justify-center">
                  <X className="w-4 h-4" />
                </button>
                <div className="absolute bottom-3 left-3 bg-harvest-green text-white text-xs px-2.5 py-1 rounded-full font-semibold">
                  +{(Math.floor((selectedPack.duration_days || 30) / 3) * Number(selectedPack.commission_every_3_days) / Number(selectedPack.price_fcfa) * 100).toFixed(1)}% ROI
                </div>
              </div>
            )}

            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              <div>
                <h2 className="text-2xl font-heading font-bold text-foreground">{selectedPack.name}</h2>
                {selectedPack.description && <p className="text-sm text-muted-foreground font-body mt-2">{selectedPack.description}</p>}
              </div>

              {/* Key numbers */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 text-center">
                  <p className="text-xs text-muted-foreground font-body mb-1">Investissement</p>
                  <p className="text-2xl font-heading font-bold text-primary">{Number(selectedPack.price_fcfa).toLocaleString("fr-FR")}</p>
                  <p className="text-xs text-muted-foreground font-body">FCFA</p>
                </div>
                <div className="bg-harvest-green/5 border border-harvest-green/20 rounded-xl p-4 text-center">
                  <p className="text-xs text-muted-foreground font-body mb-1">Commission / 3 jours</p>
                  <p className="text-2xl font-heading font-bold text-harvest-green">{Number(selectedPack.commission_every_3_days).toLocaleString("fr-FR")}</p>
                  <p className="text-xs text-muted-foreground font-body">FCFA automatique</p>
                </div>
                <div className="bg-secondary rounded-xl p-4 text-center">
                  <p className="text-xs text-muted-foreground font-body mb-1">Durée du mandat</p>
                  <p className="text-2xl font-heading font-bold text-foreground">{selectedPack.duration_days}</p>
                  <p className="text-xs text-muted-foreground font-body">jours</p>
                </div>
                <div className="bg-gold/5 border border-gold/20 rounded-xl p-4 text-center">
                  <p className="text-xs text-muted-foreground font-body mb-1">Total estimé</p>
                  <p className="text-2xl font-heading font-bold text-gold">
                    {(Math.floor((selectedPack.duration_days || 30) / 3) * Number(selectedPack.commission_every_3_days)).toLocaleString("fr-FR")}
                  </p>
                  <p className="text-xs text-muted-foreground font-body">FCFA total</p>
                </div>
              </div>

              {/* What you get */}
              <div className="bg-secondary/50 rounded-xl p-4">
                <h3 className="font-heading font-semibold text-foreground mb-3 flex items-center gap-2">
                  <Shield className="w-4 h-4 text-primary" /> Ce que vous obtenez
                </h3>
                <ul className="space-y-2 text-sm font-body text-muted-foreground">
                  <li className="flex items-start gap-2"><span className="text-harvest-green font-bold mt-0.5">✓</span> Contrat juridique PDF signé — votre propriété légale</li>
                  <li className="flex items-start gap-2"><span className="text-harvest-green font-bold mt-0.5">✓</span> Commissions automatiques toutes les 72 heures</li>
                  <li className="flex items-start gap-2"><span className="text-harvest-green font-bold mt-0.5">✓</span> Suivi en temps réel de vos gains</li>
                  <li className="flex items-start gap-2"><span className="text-harvest-green font-bold mt-0.5">✓</span> Gestion complète par Institut Moisson (stockage, vente, distribution)</li>
                </ul>
              </div>
            </div>

            <div className="p-6 border-t border-border flex-shrink-0">
              <button
                onClick={() => setShowBuyModal(true)}
                disabled={!canWallet && !canMSN}
                className="w-full btn-gold !text-base !py-3.5 disabled:opacity-50"
              >
                <ShoppingCart className="w-5 h-5 mr-2" />
                {!canWallet && !canMSN ? "Solde insuffisant" : "Souscrire au mandat"}
              </button>
              {!canWallet && !canMSN && (
                <p className="text-xs text-destructive text-center mt-2 font-body">
                  Il faut {Number(selectedPack.price_fcfa).toLocaleString("fr-FR")} FCFA ou {coinsNeeded} MSN Coins
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ═══ BUY CONFIRMATION MODAL ═══ */}
      {selectedPack && showBuyModal && (
        <div className="fixed inset-0 bg-foreground/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-card w-full max-w-md rounded-3xl overflow-hidden shadow-2xl border border-border"
            onClick={e => e.stopPropagation()}>
            
            {purchaseDone ? (
              <div className="p-8 text-center">
                <div className="w-20 h-20 rounded-full bg-harvest-green/10 flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-10 h-10 text-harvest-green" />
                </div>
                <h3 className="text-2xl font-heading font-bold text-foreground mb-2">Mandat souscrit ! 🌾</h3>
                <p className="text-sm text-muted-foreground font-body mb-6">
                  Votre contrat juridique PDF a été généré automatiquement.
                  Les commissions démarrent dans 3 jours.
                </p>
                <div className="space-y-3">
                  <button
                    onClick={() => generateMandateContractPDF(purchaseDone.contractData)}
                    className="w-full btn-gold !text-sm !py-3 flex items-center justify-center gap-2"
                  >
                    <Download className="w-4 h-4" /> Télécharger le contrat PDF
                  </button>
                  <button
                    onClick={() => { setShowBuyModal(false); setSelectedPack(null); setPurchaseDone(null); setActiveTab("my_packs"); }}
                    className="w-full px-4 py-2.5 rounded-lg border border-input text-muted-foreground font-body text-sm hover:bg-secondary"
                  >
                    Voir mes mandats
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="p-6 border-b border-border">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-heading font-bold text-foreground">Confirmer la souscription</h3>
                    <button onClick={() => setShowBuyModal(false)} className="p-1.5 rounded-lg hover:bg-secondary">
                      <X className="w-4 h-4 text-muted-foreground" />
                    </button>
                  </div>
                  <div className="bg-secondary rounded-xl p-4">
                    <p className="font-heading font-semibold text-foreground">{selectedPack.name}</p>
                    <p className="text-2xl font-bold text-primary mt-1">{Number(selectedPack.price_fcfa).toLocaleString("fr-FR")} FCFA</p>
                    <p className="text-xs text-harvest-green font-body mt-1">
                      +{Number(selectedPack.commission_every_3_days).toLocaleString("fr-FR")} FCFA tous les 3 jours pendant {selectedPack.duration_days} jours
                    </p>
                  </div>
                </div>

                <div className="p-6 space-y-4">
                  {/* Payment method */}
                  <div>
                    <p className="text-sm font-medium text-foreground mb-2 font-body">Mode de paiement</p>
                    <div className="grid grid-cols-2 gap-2">
                      <button type="button" onClick={() => setPaymentMethod("wallet")} disabled={!canWallet}
                        className={`flex flex-col items-center p-3 rounded-xl border-2 transition-all disabled:opacity-40 ${paymentMethod === "wallet" ? "border-primary bg-primary/10" : "border-border"}`}>
                        <Wallet className={`w-5 h-5 mb-1 ${paymentMethod === "wallet" ? "text-primary" : "text-muted-foreground"}`} />
                        <span className="text-xs font-semibold text-foreground font-body">Portefeuille</span>
                        <span className="text-[10px] text-muted-foreground">{Number(profile.wallet_balance).toLocaleString("fr-FR")} F</span>
                        {!canWallet && <span className="text-[10px] text-destructive">Insuffisant</span>}
                      </button>
                      <button type="button" onClick={() => setPaymentMethod("msn")} disabled={!canMSN}
                        className={`flex flex-col items-center p-3 rounded-xl border-2 transition-all disabled:opacity-40 ${paymentMethod === "msn" ? "border-gold bg-gold/10" : "border-border"}`}>
                        <Flame className={`w-5 h-5 mb-1 ${paymentMethod === "msn" ? "text-gold" : "text-muted-foreground"}`} />
                        <span className="text-xs font-semibold text-foreground font-body">MSN Coins</span>
                        <span className="text-[10px] text-muted-foreground">{coinsNeeded} requis / {msnCoins} dispo</span>
                        {!canMSN && <span className="text-[10px] text-destructive">Insuffisant</span>}
                      </button>
                    </div>
                  </div>

                  {/* Legal notice */}
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 flex items-start gap-2">
                    <FileText className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                    <p className="text-xs font-body text-blue-700">
                      Un <strong>contrat juridique PDF</strong> sera généré automatiquement et disponible immédiatement au téléchargement.
                    </p>
                  </div>

                  <button
                    onClick={handlePurchase}
                    disabled={submitting || (!canWallet && !canMSN) || (paymentMethod === "wallet" && !canWallet) || (paymentMethod === "msn" && !canMSN)}
                    className="w-full btn-gold !text-sm !py-3 disabled:opacity-50"
                  >
                    {submitting ? (
                      <span className="flex items-center justify-center gap-2">
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Traitement...
                      </span>
                    ) : "✅ Confirmer & générer le contrat"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default MandateMarketplace;
