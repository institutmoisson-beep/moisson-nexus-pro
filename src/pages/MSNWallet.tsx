import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Flame, Coins, TrendingUp, ArrowRightLeft, History,
  Send, RefreshCw, X, Check, Search,
  Wallet, ArrowDownCircle, Info, AlertTriangle,
  Package, CreditCard, Smartphone
} from "lucide-react";
import { toast } from "sonner";
import DashboardLayout from "@/components/DashboardLayout";

// Payment services for MSN withdrawals
const MSN_PAYMENT_SERVICES = [
  { value: "mtn_money", label: "MTN Mobile Money" },
  { value: "orange_money", label: "Orange Money" },
  { value: "moov_money", label: "Moov Money" },
  { value: "wave", label: "Wave" },
  { value: "free_money", label: "Free Money" },
  { value: "wizall", label: "Wizall Money" },
  { value: "push_ci", label: "PUSH CI" },
  { value: "flooz", label: "Flooz" },
  { value: "mobile_money_other", label: "Mobile Money (Autre)" },
  { value: "usdt_trc20", label: "USDT (TRC20)" },
  { value: "usdt_erc20", label: "USDT (ERC20)" },
  { value: "bitcoin", label: "Bitcoin (BTC)" },
  { value: "ethereum", label: "Ethereum (ETH)" },
  { value: "binance_pay", label: "Binance Pay" },
  { value: "crypto_other", label: "Cryptomonnaie (Autre)" },
  { value: "paypal", label: "PayPal" },
  { value: "bank_transfer", label: "Virement Bancaire" },
];

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
  const [activeTab, setActiveTab] = useState<"wallet" | "history" | "transfer" | "withdraw">("wallet");
  // Coin USD rate from admin config (default 1 USD per coin)
  const [coinUsdRate, setCoinUsdRate] = useState<number>(1);

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

  // Withdrawal state
  const [withdrawForm, setWithdrawForm] = useState({
    coins_amount: "",
    currency_code: "XOF",
    payment_service: "",
    payment_contact: "",
  });
  const [withdrawSubmitting, setWithdrawSubmitting] = useState(false);
  const [withdrawHistory, setWithdrawHistory] = useState<any[]>([]);

  useEffect(() => {
    if (!loading && !user) navigate("/connexion");
  }, [user, loading]);

  useEffect(() => {
    if (user) { loadData(); fetchRates(); }
  }, [user]);

  const loadData = async () => {
    const [profileRes, coinsRes, historyRes, withdrawRes, msnCfgRes] = await Promise.all([
      supabase.from("profiles").select("*").eq("user_id", user!.id).single(),
      supabase.from("msn_coins").select("coins").eq("user_id", user!.id).eq("is_converted", false),
      supabase.from("msn_coins").select("*").eq("user_id", user!.id).order("created_at", { ascending: false }).limit(50),
      supabase.from("msn_withdrawals" as any).select("*").eq("user_id", user!.id).order("created_at", { ascending: false }).limit(20),
      supabase.from("msn_config").select("*"),
    ]);
    setProfile(profileRes.data);
    const total = (coinsRes.data || []).reduce((s: number, c: any) => s + c.coins, 0);
    setMsnCoins(total);
    setCoinHistory(historyRes.data || []);
    setWithdrawHistory(withdrawRes.data || []);

    // Load coin USD rate from config
    const cfgMap: Record<string, any> = {};
    (msnCfgRes.data || []).forEach((r: any) => { cfgMap[r.key] = r.value; });
    const rate = Number(cfgMap.coin_usd_rate) || 1;
    setCoinUsdRate(rate);
  };

  const fetchRates = async () => {
    setRatesLoading(true);
    try {
      const res = await fetch("https://api.exchangerate-api.com/v4/latest/USD");
      const data = await res.json();
      setExchangeRates(data.rates || {});
    } catch {
      // Fallback rates relative to USD
      setExchangeRates({
        XOF: 620, XAF: 620, EUR: 0.93, GBP: 0.79, NGN: 1550,
        GHS: 12.5, MAD: 10.1, CAD: 1.37, CHF: 0.90, BTC: 0.0000155
      });
    }
    setRatesLoading(false);
  };

  // Convert coin value: 1 coin = coinUsdRate USD
  // coinUsdRate USD → target currency
  const coinValueInCurrency = (coins: number, currency: string): number => {
    const usdValue = coins * coinUsdRate;
    if (currency === "USD") return usdValue;
    const rate = exchangeRates[currency];
    return rate ? usdValue * rate : usdValue * 620; // fallback to XOF
  };

  const getCurrencySymbol = (code: string) => CURRENCIES.find(c => c.code === code)?.symbol || code;

  const formatAmount = (amount: number, currency: string) => {
    if (currency === "BTC") return amount.toFixed(8);
    if (["USD", "EUR", "GBP", "CAD", "CHF"].includes(currency))
      return amount.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    return Math.round(amount).toLocaleString("fr-FR");
  };

  const totalInCurrency = coinValueInCurrency(msnCoins, displayCurrency);
  // For display: 1 coin in XOF
  const coinValueXOF = coinValueInCurrency(1, "XOF");

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

    // Convert to FCFA using live rate
    const fcfaAmount = Math.round(coinValueInCurrency(amount, "XOF"));
    const newBalance = Number(profile.wallet_balance) + fcfaAmount;

    await supabase.from("profiles").update({ wallet_balance: newBalance }).eq("user_id", user!.id);
    await supabase.from("transactions").insert({
      user_id: user!.id,
      amount: fcfaAmount,
      type: "bonus" as const,
      status: "approved" as const,
      description: `Conversion MSN: ${amount} coin${amount > 1 ? "s" : ""} → ${fcfaAmount.toLocaleString("fr-FR")} FCFA (${amount} × ${coinValueXOF.toLocaleString("fr-FR")} FCFA)`,
      metadata: { coins_used: amount, coin_usd_rate: coinUsdRate, total_fcfa: fcfaAmount },
    });

    await supabase.from("msn_conversions").insert({
      user_id: user!.id,
      coins_used: amount,
      dollar_amount: amount * coinUsdRate,
    } as any);

    const valueInCur = coinValueInCurrency(amount, convertCurrency);
    toast.success(`🔥 ${amount} coins convertis → +${formatAmount(valueInCur, convertCurrency)} ${getCurrencySymbol(convertCurrency)} dans votre portefeuille !`);
    setConverting(false);
    setShowConvertModal(false);
    setConvertAmount("");
    loadData();
  };

  const handleWithdrawRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    const coins = parseInt(withdrawForm.coins_amount);
    if (!coins || coins <= 0) { toast.error("Entrez un nombre de coins valide"); return; }
    if (coins > msnCoins) { toast.error(`Vous n'avez que ${msnCoins} coins disponibles`); return; }
    if (!withdrawForm.payment_service) { toast.error("Sélectionnez un service de paiement"); return; }
    if (!withdrawForm.payment_contact) { toast.error("Entrez votre contact/adresse de réception"); return; }

    setWithdrawSubmitting(true);

    // Calculate amounts
    const usdAmount = coins * coinUsdRate;
    const xofRate = exchangeRates["XOF"] || 620;
    const currencyRate = exchangeRates[withdrawForm.currency_code] || (withdrawForm.currency_code === "XOF" ? xofRate : 1);
    const currencyAmount = usdAmount * currencyRate;

    // Reserve coins (mark as converted so they can't be double-spent)
    let toReserve = coins;
    const { data: userCoins } = await supabase.from("msn_coins")
      .select("id, coins").eq("user_id", user!.id).eq("is_converted", false)
      .order("created_at", { ascending: true });

    if (userCoins) {
      for (const c of userCoins) {
        if (toReserve <= 0) break;
        if (c.coins <= toReserve) {
          await supabase.from("msn_coins").update({ is_converted: true } as any).eq("id", c.id);
          toReserve -= c.coins;
        } else {
          await supabase.from("msn_coins").update({ coins: c.coins - toReserve } as any).eq("id", c.id);
          toReserve = 0;
        }
      }
    }

    // Insert withdrawal request
    const { error } = await supabase.from("msn_withdrawals" as any).insert({
      user_id: user!.id,
      coins_amount: coins,
      currency_code: withdrawForm.currency_code,
      currency_amount: currencyAmount,
      usd_rate: coinUsdRate,
      xof_rate: xofRate,
      payment_service: withdrawForm.payment_service,
      payment_contact: withdrawForm.payment_contact,
      status: "pending",
    });

    setWithdrawSubmitting(false);

    if (error) {
      // Restore coins if insert failed
      await supabase.from("msn_coins").insert({
        user_id: user!.id,
        coins,
        source_type: "withdrawal_cancelled",
        is_converted: false,
      } as any);
      toast.error("Erreur lors de la demande: " + error.message);
      return;
    }

    toast.success(`📤 Demande de retrait de ${coins} coins envoyée ! En attente de validation.`);
    setWithdrawForm({ coins_amount: "", currency_code: "XOF", payment_service: "", payment_contact: "" });
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
  const convertFCFA = Math.round(coinValueInCurrency(convertAmountNum, "XOF"));
  const convertInCurrency = coinValueInCurrency(convertAmountNum, convertCurrency);

  const withdrawCoins = parseInt(withdrawForm.coins_amount) || 0;
  const withdrawUSD = withdrawCoins * coinUsdRate;
  const withdrawCurrencyRate = withdrawForm.currency_code === "USD" ? 1 : (exchangeRates[withdrawForm.currency_code] || 620);
  const withdrawCurrencyAmount = withdrawUSD * withdrawCurrencyRate;

  return (
    <DashboardLayout>
      <h1 className="text-3xl font-heading font-bold text-foreground mb-2">🔥 Portefeuille MSN Coins</h1>
      <p className="text-muted-foreground font-body mb-6">
        <span className="bg-primary/10 text-primary font-semibold px-2 py-0.5 rounded-full text-sm">
          1 MSN Coin = {coinUsdRate} $ = {formatAmount(coinValueInCurrency(1, "XOF"), "XOF")} FCFA
        </span>
        {" "}— Taux en temps réel
      </p>

      {/* ── TABS ── */}
      <div className="flex gap-1 bg-secondary p-1 rounded-xl mb-6 w-fit flex-wrap">
        {[
          { key: "wallet", label: "💰 Portefeuille" },
          { key: "withdraw", label: "📤 Retrait" },
          { key: "transfer", label: "📲 Transférer" },
          { key: "history", label: "📋 Historique" },
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
                    = <span className="text-primary font-bold">{formatAmount(coinValueInCurrency(msnCoins, "XOF"), "XOF")} FCFA</span>
                    {" "}({msnCoins} × {formatAmount(coinValueXOF, "XOF")} FCFA)
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
                  1 coin = {coinUsdRate} $ = {formatAmount(coinValueInCurrency(1, displayCurrency), displayCurrency)} {getCurrencySymbol(displayCurrency)}
                </span>
              </div>
            </div>

            <div className="bg-secondary/50 rounded-lg p-3 mt-3 flex items-start gap-2">
              <Info className="w-4 h-4 text-primary shrink-0 mt-0.5" />
              <p className="text-xs text-muted-foreground font-body">
                Taux admin : <strong className="text-foreground">1 MSN Coin = {coinUsdRate} USD</strong>. La valeur FCFA et autres devises est calculée en temps réel.
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
                  <p className="text-xs text-muted-foreground font-body">Taux</p>
                  <p className="text-xl font-heading font-bold text-primary">{coinUsdRate} $</p>
                  <p className="text-xs text-muted-foreground font-body">par coin</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-body">Vos coins</p>
                  <p className="text-xl font-heading font-bold text-foreground">{msnCoins}</p>
                  <p className="text-xs text-muted-foreground font-body">disponibles</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-body">Valeur max</p>
                  <p className="text-xl font-heading font-bold text-gold">{formatAmount(coinValueInCurrency(msnCoins, "XOF"), "XOF")}</p>
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
                    <span className="text-muted-foreground">Valeur USD :</span>
                    <span className="font-bold text-gold">{formatAmount(convertAmountNum * coinUsdRate, "USD")} $</span>
                  </div>
                  <div className="flex justify-between text-sm font-body">
                    <span className="text-muted-foreground">Valeur FCFA :</span>
                    <span className="font-bold text-primary">{formatAmount(convertFCFA, "XOF")} FCFA</span>
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
                🔥 Convertir {convertAmountNum > 0 ? `${convertAmountNum} coins → ${formatAmount(convertFCFA, "XOF")} FCFA` : "des coins"}
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

      {/* ══ WITHDRAW TAB ══ */}
      {activeTab === "withdraw" && (
        <div className="space-y-6">
          <div className="card-elevated max-w-lg">
            <h2 className="text-lg font-heading font-semibold text-foreground mb-2 flex items-center gap-2">
              <ArrowDownCircle className="w-5 h-5 text-primary" /> Demande de retrait MSN
            </h2>
            <p className="text-sm text-muted-foreground font-body mb-6">
              Retirez vos MSN Coins dans votre devise préférée. Votre solde :
              <span className="font-bold text-gold ml-1">{msnCoins} coins</span>
              {" "}= <span className="font-bold text-primary">{formatAmount(coinValueInCurrency(msnCoins, "XOF"), "XOF")} FCFA</span>
            </p>

            <form onSubmit={handleWithdrawRequest} className="space-y-4">
              {/* Coins amount */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5 font-body">
                  Nombre de coins à retirer *
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    min="1"
                    max={msnCoins}
                    required
                    placeholder={`Max: ${msnCoins}`}
                    value={withdrawForm.coins_amount}
                    onChange={e => setWithdrawForm({ ...withdrawForm, coins_amount: e.target.value })}
                    className="flex-1 px-4 py-3 rounded-lg border border-input bg-background text-foreground font-body text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setWithdrawForm({ ...withdrawForm, coins_amount: String(msnCoins) })}
                    className="px-3 py-2 rounded-lg bg-secondary text-foreground font-body text-xs font-semibold"
                  >
                    Max
                  </button>
                </div>
              </div>

              {/* Currency selection */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5 font-body">
                  Devise de réception *
                </label>
                <select
                  required
                  value={withdrawForm.currency_code}
                  onChange={e => setWithdrawForm({ ...withdrawForm, currency_code: e.target.value })}
                  className="w-full px-4 py-3 rounded-lg border border-input bg-background text-foreground font-body text-sm"
                >
                  {CURRENCIES.map(c => <option key={c.code} value={c.code}>{c.label}</option>)}
                </select>
              </div>

              {/* Preview amount */}
              {withdrawCoins > 0 && (
                <div className="bg-gradient-to-r from-primary/10 to-gold/10 rounded-xl p-4 border border-primary/20">
                  <p className="text-xs text-muted-foreground font-body mb-2">Aperçu du retrait :</p>
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-xs text-muted-foreground font-body">Coins</p>
                      <p className="text-xl font-heading font-bold text-foreground">{withdrawCoins} 🔥</p>
                    </div>
                    <ArrowRightLeft className="w-5 h-5 text-muted-foreground" />
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground font-body">Vous recevez (~)</p>
                      <p className="text-xl font-heading font-bold text-primary">
                        {formatAmount(withdrawCurrencyAmount, withdrawForm.currency_code)} {getCurrencySymbol(withdrawForm.currency_code)}
                      </p>
                      <p className="text-xs text-muted-foreground font-body">≈ {formatAmount(coinValueInCurrency(withdrawCoins, "XOF"), "XOF")} FCFA</p>
                    </div>
                  </div>
                  <p className="text-[10px] text-muted-foreground font-body mt-2">
                    {withdrawCoins} coins × {coinUsdRate} $ = {formatAmount(withdrawUSD, "USD")} $
                  </p>
                </div>
              )}

              {/* Payment service */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5 font-body">
                  Service de paiement *
                </label>
                <select
                  required
                  value={withdrawForm.payment_service}
                  onChange={e => setWithdrawForm({ ...withdrawForm, payment_service: e.target.value })}
                  className="w-full px-4 py-3 rounded-lg border border-input bg-background text-foreground font-body text-sm"
                >
                  <option value="">— Sélectionner —</option>
                  <optgroup label="📱 Mobile Money Afrique">
                    {MSN_PAYMENT_SERVICES.filter(s => ["mtn_money","orange_money","moov_money","wave","free_money","wizall","push_ci","flooz","mobile_money_other"].includes(s.value)).map(s => (
                      <option key={s.value} value={s.value}>{s.label}</option>
                    ))}
                  </optgroup>
                  <optgroup label="₿ Cryptomonnaies">
                    {MSN_PAYMENT_SERVICES.filter(s => ["usdt_trc20","usdt_erc20","bitcoin","ethereum","binance_pay","crypto_other"].includes(s.value)).map(s => (
                      <option key={s.value} value={s.value}>{s.label}</option>
                    ))}
                  </optgroup>
                  <optgroup label="🏦 Autres">
                    {MSN_PAYMENT_SERVICES.filter(s => ["paypal","bank_transfer"].includes(s.value)).map(s => (
                      <option key={s.value} value={s.value}>{s.label}</option>
                    ))}
                  </optgroup>
                </select>
              </div>

              {/* Contact / address */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5 font-body">
                  Numéro / Adresse / Email de réception *
                </label>
                <input
                  type="text"
                  required
                  placeholder={
                    withdrawForm.payment_service?.includes("money") || withdrawForm.payment_service === "wave" || withdrawForm.payment_service === "push_ci"
                      ? "+225 XX XX XX XX XX"
                      : withdrawForm.payment_service?.includes("crypto") || ["usdt_trc20","usdt_erc20","bitcoin","ethereum"].includes(withdrawForm.payment_service)
                      ? "Adresse du portefeuille crypto..."
                      : withdrawForm.payment_service === "paypal"
                      ? "Email PayPal"
                      : withdrawForm.payment_service === "bank_transfer"
                      ? "IBAN / Coordonnées bancaires"
                      : "Contact de réception"
                  }
                  value={withdrawForm.payment_contact}
                  onChange={e => setWithdrawForm({ ...withdrawForm, payment_contact: e.target.value })}
                  className="w-full px-4 py-3 rounded-lg border border-input bg-background text-foreground font-body text-sm"
                />
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs font-body text-amber-800">
                ⚠️ Votre demande sera traitée sous 24-72h. Les coins seront réservés et débités immédiatement.
              </div>

              <button
                type="submit"
                disabled={withdrawSubmitting || msnCoins === 0}
                className="w-full btn-gold !text-sm !py-2.5 disabled:opacity-50"
              >
                {withdrawSubmitting ? "Envoi en cours..." : `📤 Demander le retrait de ${withdrawCoins || 0} coins`}
              </button>
            </form>
          </div>

          {/* Withdrawal history */}
          {withdrawHistory.length > 0 && (
            <div className="card-elevated">
              <h2 className="text-lg font-heading font-semibold text-foreground mb-4">Historique des retraits</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm font-body">
                  <thead>
                    <tr className="border-b border-border text-muted-foreground">
                      <th className="text-left py-2 px-3">Date</th>
                      <th className="text-center py-2 px-3">Coins</th>
                      <th className="text-right py-2 px-3">Montant</th>
                      <th className="text-left py-2 px-3">Service</th>
                      <th className="text-center py-2 px-3">Statut</th>
                    </tr>
                  </thead>
                  <tbody>
                    {withdrawHistory.map((w: any) => (
                      <tr key={w.id} className="border-b border-border/50">
                        <td className="py-2 px-3 text-xs">{new Date(w.created_at).toLocaleDateString("fr-FR")}</td>
                        <td className="py-2 px-3 text-center font-bold text-gold">{w.coins_amount} 🔥</td>
                        <td className="py-2 px-3 text-right font-semibold text-primary">
                          {formatAmount(w.currency_amount, w.currency_code)} {getCurrencySymbol(w.currency_code)}
                        </td>
                        <td className="py-2 px-3 text-xs text-muted-foreground">
                          {MSN_PAYMENT_SERVICES.find(s => s.value === w.payment_service)?.label || w.payment_service}
                        </td>
                        <td className="py-2 px-3 text-center">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                            w.status === "approved" ? "bg-harvest-green/20 text-harvest-green" :
                            w.status === "rejected" ? "bg-destructive/20 text-destructive" :
                            "bg-gold/20 text-gold"
                          }`}>
                            {w.status === "approved" ? "✅ Validé" : w.status === "rejected" ? "❌ Refusé" : "⏳ En attente"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
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
            Vous avez <span className="font-bold text-gold">{msnCoins} coins</span>.
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
                  Valeur ≈ {formatAmount(coinValueInCurrency(Number(transferForm.amount), "XOF"), "XOF")} FCFA
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
                        <span className="text-xs bg-harvest-green/20 text-harvest-green px-2 py-0.5 rounded-full">Utilisé</span>
                      ) : (
                        <span className="text-xs bg-gold/20 text-gold px-2 py-0.5 rounded-full">Disponible</span>
                      )}
                    </td>
                    <td className="py-2 px-3 text-right text-xs text-muted-foreground font-semibold">
                      {formatAmount(coinValueInCurrency(c.coins, "XOF"), "XOF")} FCFA
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
                    {formatAmount(convertFCFA, "XOF")} <span className="text-base">FCFA</span>
                  </p>
                </div>
              </div>
              <p className="text-xs text-center text-muted-foreground font-body">
                {convertAmountNum} coins × {coinUsdRate} $ × {formatAmount(exchangeRates["XOF"] || 620, "XOF")} FCFA/$ = {formatAmount(convertFCFA, "XOF")} FCFA
              </p>
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
                {converting ? "Conversion..." : `🔥 Confirmer — +${formatAmount(convertFCFA, "XOF")} FCFA`}
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
