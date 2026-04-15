import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Flame, Coins, TrendingUp, ArrowRightLeft, History,
  Send, RefreshCw, X, Check, Search,
  Wallet, ArrowDownCircle, Info, AlertTriangle
} from "lucide-react";
import { toast } from "sonner";
import DashboardLayout from "@/components/DashboardLayout";

// 1 MSN Coin = 450 FCFA (XOF)
const MSN_COIN_RATE_FCFA = 450;

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
  const [exchangeRates, setExchangeRates] = useState<Record<string, number>>({});
  const [displayCurrency, setDisplayCurrency] = useState("XOF");
  const [ratesLoading, setRatesLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"wallet" | "history" | "transfer">("wallet");

  // Transfer state
  const [transferForm, setTransferForm] = useState({ recipient: "", amount: "" });
  const [transferSubmitting, setTransferSubmitting] = useState(false);
  const [recipientFound, setRecipientFound] = useState<any>(null);
  const [searching, setSearching] = useState(false);

  // Convert to wallet state
  const [convertAmount, setConvertAmount] = useState("");
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
    const [profileRes, coinsRes, historyRes] = await Promise.all([
      supabase.from("profiles").select("*").eq("user_id", user!.id).single(),
      supabase.from("msn_coins").select("coins").eq("user_id", user!.id).eq("is_converted", false),
      supabase.from("msn_coins").select("*").eq("user_id", user!.id).order("created_at", { ascending: false }).limit(50),
    ]);
    setProfile(profileRes.data);
    const total = (coinsRes.data || []).reduce((s: number, c: any) => s + c.coins, 0);
    setMsnCoins(total);
    setCoinHistory(historyRes.data || []);
  };

  const fetchRates = async () => {
    setRatesLoading(true);
    try {
      const res = await fetch("https://api.exchangerate-api.com/v4/latest/XOF");
      const data = await res.json();
      setExchangeRates(data.rates || {});
    } catch {
      // Fallback rates
      setExchangeRates({
        USD: 0.00162, EUR: 0.00152, GBP: 0.00128, XAF: 1,
        MAD: 0.0163, GHS: 0.0196, NGN: 2.43, CAD: 0.0022,
        CHF: 0.00146, BTC: 0.000000025
      });
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

  // Convert coins to FCFA: 1 coin = 450 FCFA
  const coinsToFCFA = (coins: number) => coins * MSN_COIN_RATE_FCFA;
  const coinsToValue = (coins: number, currency: string) => convertFromXOF(coinsToFCFA(coins), currency);

  // Total wallet value in selected display currency
  const totalFCFA = coinsToFCFA(msnCoins);
  const totalInCurrency = convertFromXOF(totalFCFA, displayCurrency);

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

    // Deduct from sender (oldest first)
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
    const amount = parseInt(convertAmount);
    if (!amount || amount <= 0) { toast.error("Entrez un montant valide"); return; }
    if (amount > msnCoins) { toast.error(`Vous avez seulement ${msnCoins} coins disponibles`); return; }

    setConverting(true);

    // Deduct coins (oldest first)
    let toConvert = amount;
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

    // 1 coin = 450 FCFA
    const fcfaAmount = amount * MSN_COIN_RATE_FCFA;
    const newBalance = Number(profile.wallet_balance) + fcfaAmount;

    await supabase.from("profiles").update({ wallet_balance: newBalance }).eq("user_id", user!.id);
    await supabase.from("transactions").insert({
      user_id: user!.id,
      amount: fcfaAmount,
      type: "bonus" as const,
      status: "approved" as const,
      description: `Conversion MSN: ${amount} coin${amount > 1 ? "s" : ""} → ${fcfaAmount.toLocaleString("fr-FR")} FCFA (${amount} × 450 FCFA)`,
      metadata: { coins_used: amount, fcfa_rate: MSN_COIN_RATE_FCFA, total_fcfa: fcfaAmount },
    });

    await supabase.from("msn_conversions").insert({
      user_id: user!.id,
      coins_used: amount,
      dollar_amount: fcfaAmount / (exchangeRates["USD"] ? 1 / exchangeRates["USD"] : 620),
    } as any);

    const valueInCur = convertFromXOF(fcfaAmount, convertCurrency);
    toast.success(`🔥 ${amount} coins convertis → +${formatAmount(valueInCur, convertCurrency)} ${getCurrencySymbol(convertCurrency)} dans votre portefeuille !`);
    setConverting(false);
    setShowConvertModal(false);
    setConvertAmount("");
    loadData();
  };

  if (loading || !profile) {
    return (
      <DashboardLayout>
        <div className="animate-pulse text-muted-foreground font-body text-center py-12">Chargement...</div>
      </DashboardLayout>
    );
  }

  const convertAmountNum = parseInt(convertAmount) || 0;
  const convertFCFA = convertAmountNum * MSN_COIN_RATE_FCFA;
  const convertInCurrency = convertFromXOF(convertFCFA, convertCurrency);

  return (
    <DashboardLayout>
      <h1 className="text-3xl font-heading font-bold text-foreground mb-2">🔥 Portefeuille MSN Coins</h1>
      <p className="text-muted-foreground font-body mb-6">
        <span className="bg-primary/10 text-primary font-semibold px-2 py-0.5 rounded-full text-sm">1 MSN Coin = 450 FCFA</span>
        {" "}— Convertissez, transférez et suivez votre historique
      </p>

      {/* ── TABS ── */}
      <div className="flex gap-1 bg-secondary p-1 rounded-xl mb-6 w-fit">
        {[
          { key: "wallet", label: "💰 Mon Portefeuille" },
          { key: "history", label: "📋 Historique" },
          { key: "transfer", label: "📲 Transférer" },
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
                    = <span className="text-primary font-bold">{totalFCFA.toLocaleString("fr-FR")} FCFA</span>
                    {" "}(1 coin × 450 FCFA)
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
              <p className="text-xs text-muted-foreground font-body mb-1">
                Valeur de vos {msnCoins} coins en {displayCurrency}
              </p>
              <div className="flex items-center gap-3">
                <span className="text-2xl font-heading font-bold text-primary">
                  {formatAmount(totalInCurrency, displayCurrency)} {getCurrencySymbol(displayCurrency)}
                </span>
                <span className="text-xs text-muted-foreground font-body bg-secondary px-2 py-1 rounded-full">
                  1 coin = {formatAmount(convertFromXOF(MSN_COIN_RATE_FCFA, displayCurrency), displayCurrency)} {getCurrencySymbol(displayCurrency)}
                </span>
              </div>
            </div>

            <div className="bg-secondary/50 rounded-lg p-3 mt-3 flex items-start gap-2">
              <Info className="w-4 h-4 text-primary shrink-0 mt-0.5" />
              <p className="text-xs text-muted-foreground font-body">
                Taux fixe : <strong className="text-foreground">1 MSN Coin = 450 FCFA</strong>. La valeur dans les autres devises est calculée via le taux de change en temps réel.
              </p>
            </div>
          </div>

          {/* Convert to Main Wallet */}
          <div className="card-elevated">
            <h2 className="text-lg font-heading font-semibold text-foreground mb-4 flex items-center gap-2">
              <Wallet className="w-5 h-5 text-primary" /> Convertir en FCFA (Portefeuille principal)
            </h2>

            <div className="bg-gradient-to-r from-primary/10 to-gold/10 rounded-xl p-4 mb-4 border border-primary/20">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-xs text-muted-foreground font-body">Taux de conversion</p>
                  <p className="text-xl font-heading font-bold text-primary">450 FCFA</p>
                  <p className="text-xs text-muted-foreground font-body">par coin</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-body">Vos coins</p>
                  <p className="text-xl font-heading font-bold text-foreground">{msnCoins}</p>
                  <p className="text-xs text-muted-foreground font-body">disponibles</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-body">Valeur max</p>
                  <p className="text-xl font-heading font-bold text-gold">{totalFCFA.toLocaleString("fr-FR")}</p>
                  <p className="text-xs text-muted-foreground font-body">FCFA</p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5 font-body">
                  Nombre de coins à convertir
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    min="1"
                    max={msnCoins}
                    placeholder={`1 à ${msnCoins}`}
                    value={convertAmount}
                    onChange={e => setConvertAmount(e.target.value)}
                    className="flex-1 px-4 py-3 rounded-lg border border-input bg-background text-foreground font-body text-sm"
                  />
                  <button
                    onClick={() => setConvertAmount(String(msnCoins))}
                    className="px-3 py-2 rounded-lg bg-secondary text-foreground font-body text-xs font-semibold hover:bg-muted transition-colors"
                  >
                    Max
                  </button>
                </div>
              </div>

              {convertAmountNum > 0 && (
                <div className="bg-secondary rounded-xl p-4 space-y-2">
                  <div className="flex justify-between text-sm font-body">
                    <span className="text-muted-foreground">Coins utilisés :</span>
                    <span className="font-bold text-foreground">{convertAmountNum} coins</span>
                  </div>
                  <div className="flex justify-between text-sm font-body">
                    <span className="text-muted-foreground">Valeur FCFA :</span>
                    <span className="font-bold text-primary">{convertFCFA.toLocaleString("fr-FR")} FCFA</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <select
                      value={convertCurrency}
                      onChange={e => setConvertCurrency(e.target.value)}
                      className="flex-1 px-3 py-1.5 rounded-lg border border-input bg-background text-foreground font-body text-xs"
                    >
                      {CURRENCIES.map(c => <option key={c.code} value={c.code}>{c.label}</option>)}
                    </select>
                    <span className="text-sm font-bold text-gold">
                      ≈ {formatAmount(convertInCurrency, convertCurrency)} {getCurrencySymbol(convertCurrency)}
                    </span>
                  </div>
                  {convertAmountNum > msnCoins && (
                    <div className="flex items-center gap-2 text-destructive text-xs font-body">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      Solde insuffisant (vous avez {msnCoins} coins)
                    </div>
                  )}
                </div>
              )}

              <button
                onClick={() => {
                  if (!convertAmountNum || convertAmountNum <= 0) { toast.error("Entrez un nombre de coins valide"); return; }
                  if (convertAmountNum > msnCoins) { toast.error("Solde insuffisant"); return; }
                  setShowConvertModal(true);
                }}
                disabled={msnCoins === 0 || !convertAmountNum || convertAmountNum <= 0}
                className="w-full btn-gold !text-sm !py-2.5 disabled:opacity-50"
              >
                🔥 Convertir {convertAmountNum > 0 ? `${convertAmountNum} coins → ${convertFCFA.toLocaleString("fr-FR")} FCFA` : "des coins"}
              </button>
            </div>

            {msnCoins === 0 && (
              <div className="mt-4 bg-secondary rounded-lg p-4 text-center">
                <p className="text-sm font-body text-muted-foreground">
                  🌱 Parrainez des membres et développez votre réseau pour gagner des MSN Coins !
                </p>
              </div>
            )}
          </div>

          {/* Quick info to main wallet */}
          <div className="card-elevated">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-heading font-semibold text-foreground flex items-center gap-2">
                  <Wallet className="w-5 h-5 text-harvest-green" /> Portefeuille principal
                </h2>
                <p className="text-sm text-muted-foreground font-body mt-1">
                  Solde actuel : <span className="font-bold text-primary">{Number(profile.wallet_balance).toLocaleString("fr-FR")} FCFA</span>
                </p>
              </div>
              <button
                onClick={() => navigate("/portefeuille")}
                className="btn-hero !text-sm !py-2.5 !px-5"
              >
                <ArrowDownCircle className="w-4 h-4 mr-2" /> Voir
              </button>
            </div>
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
                         c.source_type === "transfer" ? "📲 Transfert" : c.source_type}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-center font-bold">
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
                    <td className="py-2 px-3 text-right text-xs text-muted-foreground font-semibold">
                      {(c.coins * MSN_COIN_RATE_FCFA).toLocaleString("fr-FR")} FCFA
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
            Envoyez des MSN Coins à un autre Moissonneur.
            Vous avez <span className="font-bold text-gold">{msnCoins} coins</span> (= {totalFCFA.toLocaleString("fr-FR")} FCFA).
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
                  Valeur = {(Number(transferForm.amount) * MSN_COIN_RATE_FCFA).toLocaleString("fr-FR")} FCFA
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

      {/* ══ CONVERT CONFIRMATION MODAL ══ */}
      {showConvertModal && (
        <div className="fixed inset-0 bg-foreground/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-card rounded-2xl border border-border p-6 w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-heading font-bold text-foreground flex items-center gap-2">
                <Flame className="w-5 h-5 text-primary" /> Confirmer la conversion
              </h2>
              <button onClick={() => setShowConvertModal(false)}
                className="p-1.5 rounded-lg hover:bg-secondary transition-colors">
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>

            <div className="bg-gradient-to-r from-primary/10 to-gold/10 rounded-xl p-4 mb-4 border border-primary/20">
              <div className="flex justify-between items-center mb-3">
                <div>
                  <p className="text-xs text-muted-foreground font-body">Vous convertissez</p>
                  <p className="text-3xl font-heading font-bold text-foreground">
                    {convertAmountNum} <span className="text-base text-gold">coins</span>
                  </p>
                </div>
                <ArrowRightLeft className="w-6 h-6 text-primary" />
                <div className="text-right">
                  <p className="text-xs text-muted-foreground font-body">Vous recevez</p>
                  <p className="text-3xl font-heading font-bold text-primary">
                    {convertFCFA.toLocaleString("fr-FR")} <span className="text-base">FCFA</span>
                  </p>
                </div>
              </div>
              <p className="text-xs text-center text-muted-foreground font-body">
                Taux : {convertAmountNum} × 450 FCFA = {convertFCFA.toLocaleString("fr-FR")} FCFA
              </p>
            </div>

            <div className="bg-secondary rounded-lg p-3 mb-4">
              <p className="text-xs text-muted-foreground font-body mb-1">Équivalent dans d'autres devises :</p>
              <div className="flex items-center gap-2">
                <select value={convertCurrency} onChange={e => setConvertCurrency(e.target.value)}
                  className="flex-1 px-3 py-2 rounded-lg border border-input bg-background text-foreground font-body text-sm">
                  {CURRENCIES.map(c => <option key={c.code} value={c.code}>{c.label}</option>)}
                </select>
                <span className="font-bold text-harvest-green text-sm">
                  ≈ {formatAmount(convertInCurrency, convertCurrency)} {getCurrencySymbol(convertCurrency)}
                </span>
              </div>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4 text-xs font-body text-amber-800">
              ⚠️ Cette action est <strong>irréversible</strong>. {convertAmountNum} coins seront définitivement convertis et crédités sur votre portefeuille principal.
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleConvertToWallet}
                disabled={converting}
                className="flex-1 btn-gold !text-sm !py-2.5 disabled:opacity-50"
              >
                {converting ? "Conversion..." : `🔥 Confirmer — +${convertFCFA.toLocaleString("fr-FR")} FCFA`}
              </button>
              <button onClick={() => setShowConvertModal(false)}
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
