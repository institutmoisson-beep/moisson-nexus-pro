import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Flame, Coins, TrendingUp, ArrowRightLeft, History,
  Send, RefreshCw, X, ChevronDown, Check, Search,
  Wallet, ArrowDownCircle, Info
} from "lucide-react";
import { toast } from "sonner";
import DashboardLayout from "@/components/DashboardLayout";

const CURRENCIES = [
  { code: "XOF", label: "FCFA (XOF)", symbol: "FCFA" },
  { code: "USD", label: "Dollar US (USD)", symbol: "$" },
  { code: "EUR", label: "Euro (EUR)", symbol: "€" },
  { code: "GBP", label: "Livre Sterling (GBP)", symbol: "£" },
  { code: "NGN", label: "Naira (NGN)", symbol: "₦" },
  { code: "GHS", label: "Cedi (GHS)", symbol: "₵" },
  { code: "MAD", label: "Dirham (MAD)", symbol: "MAD" },
  { code: "XAF", label: "FCFA (XAF)", symbol: "FCFA" },
  { code: "CAD", label: "Dollar CA (CAD)", symbol: "CA$" },
  { code: "CHF", label: "Franc Suisse (CHF)", symbol: "CHF" },
  { code: "BTC", label: "Bitcoin (BTC)", symbol: "₿" },
];

const MSNWalletPage = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<any>(null);
  const [msnCoins, setMsnCoins] = useState(0);
  const [coinHistory, setCoinHistory] = useState<any[]>([]);
  const [msnConfig, setMsnConfig] = useState<any>({});
  const [exchangeRates, setExchangeRates] = useState<Record<string, number>>({});
  const [displayCurrency, setDisplayCurrency] = useState("XOF");
  const [ratesLoading, setRatesLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"wallet" | "history" | "transfer">("wallet");

  // Transfer state
  const [transferForm, setTransferForm] = useState({ recipient: "", amount: "" });
  const [transferSubmitting, setTransferSubmitting] = useState(false);
  const [recipientFound, setRecipientFound] = useState<any>(null);
  const [searching, setSearching] = useState(false);

  // Convert state
  const [selectedTier, setSelectedTier] = useState<any>(null);
  const [convertCurrency, setConvertCurrency] = useState("XOF");
  const [converting, setConverting] = useState(false);
  const [showConvertModal, setShowConvertModal] = useState(false);

  useEffect(() => {
    if (!loading && !user) navigate("/connexion");
  }, [user, loading]);

  useEffect(() => {
    if (user) { loadData(); fetchRates(); }
  }, [user]);

  const loadData = async () => {
    const [profileRes, coinsRes, historyRes, cfgRes] = await Promise.all([
      supabase.from("profiles").select("*").eq("user_id", user!.id).single(),
      supabase.from("msn_coins").select("coins").eq("user_id", user!.id).eq("is_converted", false),
      supabase.from("msn_coins").select("*").eq("user_id", user!.id).order("created_at", { ascending: false }).limit(50),
      supabase.from("msn_config").select("*"),
    ]);
    setProfile(profileRes.data);
    const total = (coinsRes.data || []).reduce((s: number, c: any) => s + c.coins, 0);
    setMsnCoins(total);
    setCoinHistory(historyRes.data || []);
    const cfgMap: Record<string, any> = {};
    (cfgRes.data || []).forEach((r: any) => { cfgMap[r.key] = r.value; });
    setMsnConfig(cfgMap);
  };

  const fetchRates = async () => {
    setRatesLoading(true);
    try {
      const res = await fetch("https://api.exchangerate-api.com/v4/latest/XOF");
      const data = await res.json();
      setExchangeRates(data.rates || {});
    } catch {
      setExchangeRates({ USD: 0.00162, EUR: 0.00152, GBP: 0.00128, XAF: 1, MAD: 0.0163, GHS: 0.0196, NGN: 2.43, CAD: 0.0022, CHF: 0.00146, BTC: 0.000000025 });
    }
    setRatesLoading(false);
  };

  const convertFromXOF = (amount: number, currency: string): number => {
    if (currency === "XOF" || currency === "XAF") return amount;
    const rate = exchangeRates[currency];
    return rate ? amount * rate : amount;
  };

  const getCurrencySymbol = (code: string) => CURRENCIES.find(c => c.code === code)?.symbol || code;

  const formatAmount = (amount: number, currency: string) => {
    if (currency === "BTC") return amount.toFixed(8);
    if (["USD", "EUR", "GBP", "CAD", "CHF"].includes(currency))
      return amount.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    return Math.round(amount).toLocaleString("fr-FR");
  };

  const getDollarValueInCurrency = (dollars: number, currency: string): number => {
    const usdToXOF = exchangeRates["USD"] ? 1 / exchangeRates["USD"] : 620;
    const fcfa = dollars * usdToXOF;
    return convertFromXOF(fcfa, currency);
  };

  const conversionTiers: { coins: number; dollars: number }[] = msnConfig.conversion_tiers || [
    { coins: 3, dollars: 40 },
    { coins: 6, dollars: 125 },
    { coins: 12, dollars: 250 },
  ];

  // Search recipient
  const searchRecipient = async () => {
    const q = transferForm.recipient.trim();
    if (!q) return;
    setSearching(true);
    const { data } = await supabase.from("profiles")
      .select("id, user_id, first_name, last_name, referral_code, email")
      .or(`email.eq.${q},referral_code.eq.${q.toUpperCase()}`)
      .single();
    setSearching(false);
    if (!data) { toast.error("Utilisateur introuvable"); setRecipientFound(null); return; }
    if (data.user_id === user!.id) { toast.error("Impossible de vous transférer à vous-même"); setRecipientFound(null); return; }
    setRecipientFound(data);
  };

  const handleTransferCoins = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recipientFound || !transferForm.amount) { toast.error("Renseignez destinataire et montant"); return; }
    const amount = parseInt(transferForm.amount);
    if (amount <= 0 || amount > msnCoins) { toast.error(`Vous avez ${msnCoins} coins disponibles`); return; }

    setTransferSubmitting(true);

    // Deduct from sender
    let toDeduct = amount;
    const { data: senderCoins } = await supabase.from("msn_coins")
      .select("id, coins").eq("user_id", user!.id).eq("is_converted", false)
      .order("created_at", { ascending: true });

    if (senderCoins) {
      for (const c of senderCoins) {
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

    // Credit recipient
    await supabase.from("msn_coins").insert({
      user_id: recipientFound.user_id,
      coins: amount,
      source_type: "transfer",
      source_user_id: user!.id,
    } as any);

    toast.success(`🪙 ${amount} MSN Coin${amount > 1 ? "s" : ""} transféré${amount > 1 ? "s" : ""} à ${recipientFound.first_name} !`);
    setTransferForm({ recipient: "", amount: "" });
    setRecipientFound(null);
    setTransferSubmitting(false);
    loadData();
  };

  const handleConvertToWallet = async () => {
    if (!selectedTier) return;
    if (msnCoins < selectedTier.coins) { toast.error("Coins insuffisants"); return; }

    setConverting(true);

    let toConvert = selectedTier.coins;
    const { data: userCoins } = await supabase.from("msn_coins")
      .select("id, coins").eq("user_id", user!.id).eq("is_converted", false)
      .order("created_at", { ascending: true });

    if (userCoins) {
      for (const c of userCoins) {
        if (toConvert <= 0) break;
        if (c.coins <= toConvert) {
          await supabase.from("msn_coins").update({ is_converted: true } as any).eq("id", c.id);
          toConvert -= c.coins;
        } else {
          await supabase.from("msn_coins").update({ coins: c.coins - toConvert } as any).eq("id", c.id);
          toConvert = 0;
        }
      }
    }

    const usdToXOF = exchangeRates["USD"] ? 1 / exchangeRates["USD"] : 620;
    const fcfaAmount = Math.round(selectedTier.dollars * usdToXOF);
    const newBalance = Number(profile.wallet_balance) + fcfaAmount;

    await supabase.from("profiles").update({ wallet_balance: newBalance }).eq("user_id", user!.id);
    await supabase.from("transactions").insert({
      user_id: user!.id, amount: fcfaAmount, type: "bonus" as const, status: "approved" as const,
      description: `Conversion MSN: ${selectedTier.coins} coins → $${selectedTier.dollars} (${fcfaAmount.toLocaleString("fr-FR")} FCFA)`,
      metadata: { coins_used: selectedTier.coins, dollar_value: selectedTier.dollars },
    });
    await supabase.from("msn_conversions").insert({
      user_id: user!.id, coins_used: selectedTier.coins, dollar_amount: selectedTier.dollars,
    } as any);

    const valueInCur = getDollarValueInCurrency(selectedTier.dollars, convertCurrency);
    toast.success(`🔥 ${selectedTier.coins} coins convertis → +${formatAmount(valueInCur, convertCurrency)} ${getCurrencySymbol(convertCurrency)} dans votre portefeuille !`);
    setConverting(false);
    setShowConvertModal(false);
    setSelectedTier(null);
    loadData();
  };

  if (loading || !profile) {
    return (
      <DashboardLayout>
        <div className="animate-pulse text-muted-foreground font-body text-center py-12">Chargement...</div>
      </DashboardLayout>
    );
  }

  const totalCoinValue = msnCoins * 10000; // 1 coin ≈ 10,000 FCFA base

  return (
    <DashboardLayout>
      <h1 className="text-3xl font-heading font-bold text-foreground mb-2">🔥 Portefeuille MSN Coins</h1>
      <p className="text-muted-foreground font-body mb-6">Gérez vos MSN Coins — Convertissez, transférez et suivez votre historique</p>

      {/* ── TABS ── */}
      <div className="flex gap-1 bg-secondary p-1 rounded-xl mb-6 w-fit">
        {[
          { key: "wallet", label: "💰 Mon Portefeuille", icon: Coins },
          { key: "history", label: "📋 Historique", icon: History },
          { key: "transfer", label: "📲 Transférer", icon: Send },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as any)}
            className={`px-4 py-2 rounded-lg text-sm font-body font-semibold transition-all ${
              activeTab === tab.key ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ══ WALLET TAB ══ */}
      {activeTab === "wallet" && (
        <div className="space-y-6">
          {/* Balance Card */}
          <div className="card-elevated bg-gradient-to-br from-primary/5 to-gold/5 border-primary/20">
            <div className="flex items-start justify-between mb-4 flex-wrap gap-3">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-gold flex items-center justify-center shadow-lg">
                  <Flame className="w-8 h-8 text-white" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground font-body mb-1">Solde MSN Coins</p>
                  <div className="flex items-center gap-2">
                    <span className="text-4xl font-heading font-bold text-foreground">{msnCoins}</span>
                    <Coins className="w-7 h-7 text-gold" />
                  </div>
                  <p className="text-xs text-muted-foreground font-body mt-1">
                    Valeur estimée ≈ {totalCoinValue.toLocaleString("fr-FR")} FCFA
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <select
                  value={displayCurrency}
                  onChange={e => setDisplayCurrency(e.target.value)}
                  className="px-3 py-2 rounded-lg border border-input bg-background text-foreground font-body text-sm"
                >
                  {CURRENCIES.map(c => <option key={c.code} value={c.code}>{c.label}</option>)}
                </select>
                <button onClick={fetchRates} className="p-2 rounded-lg bg-secondary hover:bg-muted transition-colors" title="Actualiser">
                  <RefreshCw className={`w-4 h-4 text-muted-foreground ${ratesLoading ? "animate-spin" : ""}`} />
                </button>
              </div>
            </div>

            {/* Value in selected currency */}
            <div className="bg-card rounded-xl p-4 border border-border">
              <p className="text-xs text-muted-foreground font-body mb-1">Valeur actuelle de vos coins en {displayCurrency}</p>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-heading font-bold text-primary">
                  {formatAmount(convertFromXOF(totalCoinValue, displayCurrency), displayCurrency)} {getCurrencySymbol(displayCurrency)}
                </span>
                {displayCurrency !== "XOF" && (
                  <span className="text-xs text-muted-foreground font-body">
                    (basé sur ≈ 10 000 FCFA/coin)
                  </span>
                )}
              </div>
            </div>

            <div className="bg-secondary/50 rounded-lg p-3 mt-3 flex items-start gap-2">
              <Info className="w-4 h-4 text-primary shrink-0 mt-0.5" />
              <p className="text-xs text-muted-foreground font-body">
                Sélectionnez une devise pour <strong>visualiser</strong> la valeur. La conversion réelle s'effectue via les paliers ci-dessous et crédite votre portefeuille principal en FCFA.
              </p>
            </div>
          </div>

          {/* Conversion Tiers */}
          <div className="card-elevated">
            <h2 className="text-lg font-heading font-semibold text-foreground mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" /> Convertir en argent réel
            </h2>

            <div className="flex items-center gap-2 mb-4">
              <span className="text-xs text-muted-foreground font-body">Voir la valeur en :</span>
              <select value={convertCurrency} onChange={e => setConvertCurrency(e.target.value)}
                className="px-3 py-1.5 rounded-lg border border-input bg-background text-foreground font-body text-xs">
                {CURRENCIES.map(c => <option key={c.code} value={c.code}>{c.label}</option>)}
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {conversionTiers.map((tier, i) => {
                const valueInCur = getDollarValueInCurrency(tier.dollars, convertCurrency);
                const canConvert = msnCoins >= tier.coins;
                return (
                  <div
                    key={i}
                    className={`rounded-xl border-2 p-4 text-center transition-all ${
                      canConvert
                        ? "border-primary/40 bg-primary/5 hover:border-primary cursor-pointer hover:shadow-md"
                        : "border-border/40 bg-muted/20 opacity-50 cursor-not-allowed"
                    }`}
                    onClick={() => {
                      if (!canConvert) return;
                      setSelectedTier(tier);
                      setShowConvertModal(true);
                    }}
                  >
                    <div className="text-2xl mb-1">🪙</div>
                    <p className="text-2xl font-heading font-bold text-foreground">{tier.coins}</p>
                    <p className="text-xs text-muted-foreground font-body mb-2">coins</p>
                    <div className="h-px bg-border my-2" />
                    <p className="text-lg font-bold text-gold">${tier.dollars}</p>
                    <p className="text-xs text-primary font-body font-semibold mt-1">
                      ≈ {formatAmount(valueInCur, convertCurrency)} {getCurrencySymbol(convertCurrency)}
                    </p>
                    {!canConvert && (
                      <p className="text-[10px] text-muted-foreground font-body mt-2">
                        Manque {tier.coins - msnCoins} coins
                      </p>
                    )}
                  </div>
                );
              })}
            </div>

            {msnCoins === 0 && (
              <div className="mt-4 bg-secondary rounded-lg p-4 text-center">
                <p className="text-sm font-body text-muted-foreground">
                  🌱 Parrainez des membres et développez votre réseau pour gagner des MSN Coins !
                </p>
              </div>
            )}
          </div>

          {/* Quick transfer to main wallet */}
          <div className="card-elevated">
            <h2 className="text-lg font-heading font-semibold text-foreground mb-2 flex items-center gap-2">
              <Wallet className="w-5 h-5 text-harvest-green" /> Portefeuille principal
            </h2>
            <p className="text-sm text-muted-foreground font-body mb-3">
              Solde actuel : <span className="font-bold text-primary">{Number(profile.wallet_balance).toLocaleString("fr-FR")} FCFA</span>
            </p>
            <button
              onClick={() => navigate("/portefeuille")}
              className="btn-hero !text-sm !py-2.5 !px-5"
            >
              <ArrowDownCircle className="w-4 h-4 mr-2" /> Aller au portefeuille principal
            </button>
          </div>
        </div>
      )}

      {/* ══ HISTORY TAB ══ */}
      {activeTab === "history" && (
        <div className="card-elevated">
          <h2 className="text-lg font-heading font-semibold text-foreground mb-4">📋 Historique MSN Coins</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm font-body">
              <thead>
                <tr className="border-b border-border text-muted-foreground">
                  <th className="text-left py-2 px-3">Date</th>
                  <th className="text-left py-2 px-3">Source</th>
                  <th className="text-center py-2 px-3">Coins</th>
                  <th className="text-center py-2 px-3">Statut</th>
                  <th className="text-right py-2 px-3">Valeur (FCFA)</th>
                </tr>
              </thead>
              <tbody>
                {coinHistory.map((c: any) => (
                  <tr key={c.id} className="border-b border-border/50 hover:bg-secondary/20">
                    <td className="py-2 px-3 whitespace-nowrap">
                      <span>{new Date(c.created_at).toLocaleDateString("fr-FR")}</span>
                      <span className="block text-[10px] text-muted-foreground">
                        {new Date(c.created_at).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </td>
                    <td className="py-2 px-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                        c.source_type === "network_sale" ? "bg-gold/20 text-gold" :
                        c.source_type === "transfer" ? "bg-primary/20 text-primary" :
                        "bg-muted text-muted-foreground"
                      }`}>
                        {c.source_type === "network_sale" ? "🌾 Vente réseau" :
                         c.source_type === "transfer" ? "📲 Transfert reçu" : c.source_type}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-center font-bold text-foreground">
                      {c.is_converted ? (
                        <span className="text-muted-foreground line-through">{c.coins}</span>
                      ) : (
                        <span className="text-gold">+{c.coins}</span>
                      )}
                    </td>
                    <td className="py-2 px-3 text-center">
                      {c.is_converted ? (
                        <span className="text-xs bg-harvest-green/20 text-harvest-green px-2 py-0.5 rounded-full">Converti</span>
                      ) : (
                        <span className="text-xs bg-gold/20 text-gold px-2 py-0.5 rounded-full">Disponible</span>
                      )}
                    </td>
                    <td className="py-2 px-3 text-right text-xs text-muted-foreground">
                      ≈ {(c.coins * 10000).toLocaleString("fr-FR")} FCFA
                    </td>
                  </tr>
                ))}
                {coinHistory.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-muted-foreground font-body">
                      Aucune transaction MSN pour le moment
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ══ TRANSFER TAB ══ */}
      {activeTab === "transfer" && (
        <div className="card-elevated max-w-lg">
          <h2 className="text-lg font-heading font-semibold text-foreground mb-2 flex items-center gap-2">
            <Send className="w-5 h-5 text-primary" /> Transférer des MSN Coins
          </h2>
          <p className="text-sm text-muted-foreground font-body mb-6">
            Envoyez des MSN Coins à un autre Moissonneur via son code ou email.
            Vous avez <span className="font-bold text-gold">{msnCoins} coins</span> disponibles.
          </p>

          <form onSubmit={handleTransferCoins} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5 font-body">
                Code Moissonneur ou Email *
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="MOI-XXXXXX ou email@exemple.com"
                  value={transferForm.recipient}
                  onChange={e => { setTransferForm({ ...transferForm, recipient: e.target.value }); setRecipientFound(null); }}
                  className="flex-1 px-4 py-3 rounded-lg border border-input bg-background text-foreground font-body text-sm"
                />
                <button
                  type="button"
                  onClick={searchRecipient}
                  disabled={searching}
                  className="px-4 py-3 rounded-lg bg-primary text-primary-foreground font-body text-sm font-semibold hover:bg-primary/90 transition-colors"
                >
                  {searching ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                </button>
              </div>
              {recipientFound && (
                <div className="mt-2 flex items-center gap-2 p-3 rounded-lg bg-harvest-green/10 border border-harvest-green/20">
                  <Check className="w-4 h-4 text-harvest-green" />
                  <span className="text-sm font-body text-foreground font-semibold">
                    {recipientFound.first_name} {recipientFound.last_name}
                  </span>
                  <span className="text-xs text-muted-foreground font-mono ml-1">
                    ({recipientFound.referral_code})
                  </span>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5 font-body">
                Nombre de coins à envoyer *
              </label>
              <input
                type="number"
                min="1"
                max={msnCoins}
                placeholder={`Max: ${msnCoins}`}
                value={transferForm.amount}
                onChange={e => setTransferForm({ ...transferForm, amount: e.target.value })}
                className="w-full px-4 py-3 rounded-lg border border-input bg-background text-foreground font-body text-sm"
              />
              {transferForm.amount && Number(transferForm.amount) > 0 && (
                <p className="text-xs text-muted-foreground font-body mt-1">
                  Valeur estimée ≈ {(Number(transferForm.amount) * 10000).toLocaleString("fr-FR")} FCFA
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={transferSubmitting || !recipientFound || !transferForm.amount || msnCoins === 0}
              className="w-full btn-gold !text-sm !py-2.5 disabled:opacity-50"
            >
              {transferSubmitting ? "Envoi en cours..." : `Envoyer ${transferForm.amount || "0"} coins`}
            </button>
          </form>
        </div>
      )}

      {/* ══ CONVERT MODAL ══ */}
      {showConvertModal && selectedTier && (
        <div className="fixed inset-0 bg-foreground/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-card rounded-2xl border border-border p-6 w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-heading font-bold text-foreground flex items-center gap-2">
                <Flame className="w-5 h-5 text-primary" /> Confirmer la conversion
              </h2>
              <button onClick={() => { setShowConvertModal(false); setSelectedTier(null); }}
                className="p-1.5 rounded-lg hover:bg-secondary transition-colors">
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>

            <div className="bg-gradient-to-r from-primary/10 to-gold/10 rounded-xl p-4 mb-4 border border-primary/20">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-xs text-muted-foreground font-body">Vous convertissez</p>
                  <p className="text-3xl font-heading font-bold text-foreground">{selectedTier.coins} <span className="text-base text-gold">coins</span></p>
                </div>
                <ArrowRightLeft className="w-6 h-6 text-primary" />
                <div className="text-right">
                  <p className="text-xs text-muted-foreground font-body">Vous recevez</p>
                  <p className="text-3xl font-heading font-bold text-primary">${selectedTier.dollars}</p>
                </div>
              </div>
            </div>

            <div className="space-y-2 mb-4">
              <p className="text-xs text-muted-foreground font-body">Valeur dans votre devise :</p>
              <select value={convertCurrency} onChange={e => setConvertCurrency(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-input bg-background text-foreground font-body text-sm">
                {CURRENCIES.map(c => <option key={c.code} value={c.code}>{c.label}</option>)}
              </select>
              <div className="bg-secondary rounded-lg p-3 text-center">
                <p className="text-xl font-heading font-bold text-harvest-green">
                  {formatAmount(getDollarValueInCurrency(selectedTier.dollars, convertCurrency), convertCurrency)} {getCurrencySymbol(convertCurrency)}
                </p>
                <p className="text-xs text-muted-foreground font-body">
                  ≈ {Math.round(selectedTier.dollars * (exchangeRates["USD"] ? 1 / exchangeRates["USD"] : 620)).toLocaleString("fr-FR")} FCFA crédités sur votre portefeuille
                </p>
              </div>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4 text-xs font-body text-amber-800">
              ⚠️ Cette action est <strong>irréversible</strong>. {selectedTier.coins} coins seront définitivement convertis.
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleConvertToWallet}
                disabled={converting}
                className="flex-1 btn-gold !text-sm !py-2.5 disabled:opacity-50"
              >
                {converting ? "Conversion..." : `🔥 Confirmer la conversion`}
              </button>
              <button onClick={() => { setShowConvertModal(false); setSelectedTier(null); }}
                className="px-4 py-2.5 rounded-lg border border-input text-muted-foreground font-body text-sm hover:bg-secondary">
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default MSNWalletPage;
