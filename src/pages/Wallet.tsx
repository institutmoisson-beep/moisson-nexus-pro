import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Wallet as WalletIcon, ArrowDownCircle, ArrowUpCircle, Copy,
  Send, ExternalLink, Flame, Coins, TrendingUp, RefreshCw, X, ChevronDown
} from "lucide-react";
import { toast } from "sonner";
import DashboardLayout from "@/components/DashboardLayout";

const CURRENCIES = [
  { code: "XOF", label: "FCFA (XOF)", symbol: "FCFA", rate: 1 },
  { code: "USD", label: "Dollar US (USD)", symbol: "$" },
  { code: "EUR", label: "Euro (EUR)", symbol: "€" },
  { code: "GBP", label: "Livre Sterling (GBP)", symbol: "£" },
  { code: "NGN", label: "Naira (NGN)", symbol: "₦" },
  { code: "GHS", label: "Cedi (GHS)", symbol: "₵" },
  { code: "MAD", label: "Dirham (MAD)", symbol: "MAD" },
  { code: "XAF", label: "FCFA (XAF)", symbol: "FCFA" },
  { code: "CAD", label: "Dollar CA (CAD)", symbol: "CA$" },
  { code: "CHF", label: "Franc Suisse (CHF)", symbol: "CHF" },
  { code: "CNY", label: "Yuan (CNY)", symbol: "¥" },
  { code: "BTC", label: "Bitcoin (BTC)", symbol: "₿" },
];

const TYPE_LABELS: Record<string, string> = {
  deposit: "Dépôt",
  withdrawal: "Retrait",
  pack_purchase: "Achat",
  commission: "Commission",
  bonus: "Bonus",
  admin_credit: "Crédit admin",
  admin_debit: "Débit admin",
  transfer: "Transfert",
  product_purchase: "Achat produit",
};

// MSN Coin value: 1 coin = 10,000 FCFA base value
// Tiers determine how many coins give how many dollars
// 3 coins → $40 = ~24,000 FCFA each
// 6 coins → $125 = ~12,500 FCFA each  
// 12 coins → $250 = ~12,500 FCFA each
const MSN_COIN_VALUE_FCFA = 10000; // base value per coin in FCFA

const WalletPage = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<any[]>([]);
  const [showDeposit, setShowDeposit] = useState(false);
  const [showWithdraw, setShowWithdraw] = useState(false);
  const [showTransfer, setShowTransfer] = useState(false);
  const [showMSNConvert, setShowMSNConvert] = useState(false);
  const [displayCurrency, setDisplayCurrency] = useState("XOF");
  const [exchangeRates, setExchangeRates] = useState<Record<string, number>>({});
  const [ratesLoading, setRatesLoading] = useState(false);
  const [depositForm, setDepositForm] = useState({ amount: "", payment_method_id: "", transaction_contact: "", transaction_id_external: "" });
  const [withdrawForm, setWithdrawForm] = useState({ amount: "", payment_method_id: "", transaction_contact: "" });
  const [transferForm, setTransferForm] = useState({ amount: "", recipient: "" });
  const [submitting, setSubmitting] = useState(false);
  const [fees, setFees] = useState({ withdrawal_fee_percent: 0, transfer_fee_percent: 0 });
  const [msnCoins, setMsnCoins] = useState(0);
  const [msnConfig, setMsnConfig] = useState<any>({});
  const [convertingCoins, setConvertingCoins] = useState(false);
  const [selectedConvertCurrency, setSelectedConvertCurrency] = useState("XOF");
  const [selectedTier, setSelectedTier] = useState<any>(null);

  useEffect(() => {
    if (!loading && !user) navigate("/connexion");
  }, [user, loading]);

  useEffect(() => {
    if (user) { loadData(); fetchRates(); }
  }, [user]);

  const loadData = async () => {
    const [profileRes, txRes, pmRes, feeRes, coinsRes, msnCfgRes] = await Promise.all([
      supabase.from("profiles").select("*").eq("user_id", user!.id).single(),
      supabase.from("transactions").select("*").eq("user_id", user!.id).order("created_at", { ascending: false }).limit(50),
      supabase.from("payment_methods").select("*").eq("is_active", true),
      supabase.from("mlm_config").select("*").in("key", ["withdrawal_fee_percent", "transfer_fee_percent"]),
      supabase.from("msn_coins").select("coins, is_converted").eq("user_id", user!.id).eq("is_converted", false),
      supabase.from("msn_config").select("*"),
    ]);
    setProfile(profileRes.data);
    setTransactions(txRes.data || []);
    setPaymentMethods(pmRes.data || []);
    const feeData: any = {};
    (feeRes.data || []).forEach((c: any) => { feeData[c.key] = Number(c.value); });
    setFees({ withdrawal_fee_percent: feeData.withdrawal_fee_percent || 0, transfer_fee_percent: feeData.transfer_fee_percent || 0 });
    const totalCoins = (coinsRes.data || []).reduce((s: number, c: any) => s + c.coins, 0);
    setMsnCoins(totalCoins);
    const cfgMap: Record<string, any> = {};
    (msnCfgRes.data || []).forEach((r: any) => { cfgMap[r.key] = r.value; });
    setMsnConfig(cfgMap);
  };

  const fetchRates = async () => {
    setRatesLoading(true);
    try {
      const res = await fetch("https://api.exchangerate-api.com/v4/latest/XOF");
      const data = await res.json();
      setExchangeRates(data.rates || {});
    } catch {
      // Fallback rates if API fails
      setExchangeRates({ USD: 0.00162, EUR: 0.00152, GBP: 0.00128, XAF: 1, MAD: 0.0163, GHS: 0.0196, NGN: 2.43, CAD: 0.0022, CHF: 0.00146, CNY: 0.0117, BTC: 0.000000025 });
    }
    setRatesLoading(false);
  };

  const convertFromXOF = (amountXOF: number, targetCurrency: string): number => {
    if (targetCurrency === "XOF" || targetCurrency === "XAF") return amountXOF;
    const rate = exchangeRates[targetCurrency];
    if (!rate) return amountXOF;
    return amountXOF * rate;
  };

  const getCurrencySymbol = (code: string) => CURRENCIES.find(c => c.code === code)?.symbol || code;

  const formatAmount = (amount: number, currency: string) => {
    if (currency === "BTC") return amount.toFixed(8);
    if (["USD", "EUR", "GBP", "CAD", "CHF"].includes(currency)) return amount.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    return Math.round(amount).toLocaleString("fr-FR");
  };

  const displayBalance = convertFromXOF(Number(profile?.wallet_balance || 0), displayCurrency);
  const selectedDepositMethod = paymentMethods.find(m => m.id === depositForm.payment_method_id);
  const selectedWithdrawMethod = paymentMethods.find(m => m.id === withdrawForm.payment_method_id);

  // MSN Coin conversion value in selected currency
  const getMSNCoinValueInCurrency = (coins: number, dollars: number, targetCurrency: string): number => {
    // dollars → XOF (1 USD ≈ 620 FCFA)
    const usdToXOF = exchangeRates["USD"] ? 1 / exchangeRates["USD"] : 620;
    const fcfaValue = dollars * usdToXOF;
    return convertFromXOF(fcfaValue, targetCurrency);
  };

  const handleDeposit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!depositForm.amount || !depositForm.payment_method_id) { toast.error("Remplissez les champs obligatoires"); return; }
    setSubmitting(true);
    const { error } = await supabase.from("transactions").insert({
      user_id: user!.id,
      amount: Number(depositForm.amount),
      type: "deposit" as const,
      payment_method_id: depositForm.payment_method_id,
      transaction_contact: depositForm.transaction_contact,
      transaction_id_external: depositForm.transaction_id_external,
      description: "Demande de dépôt",
    });
    setSubmitting(false);
    if (error) { toast.error("Erreur: " + error.message); return; }
    toast.success("Demande de dépôt envoyée ! En attente de validation par l'admin.");
    setShowDeposit(false);
    setDepositForm({ amount: "", payment_method_id: "", transaction_contact: "", transaction_id_external: "" });
    loadData();
  };

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = Number(withdrawForm.amount);
    if (!amount || !withdrawForm.payment_method_id || !withdrawForm.transaction_contact) {
      toast.error("Remplissez tous les champs obligatoires"); return;
    }
    const fee = Math.round(amount * fees.withdrawal_fee_percent / 100);
    const total = amount + fee;
    if (total > Number(profile?.wallet_balance || 0)) {
      toast.error(`Solde insuffisant. Il faut ${total.toLocaleString("fr-FR")} FCFA (montant + frais)`); return;
    }
    setSubmitting(true);
    const { error } = await supabase.from("transactions").insert({
      user_id: user!.id,
      amount,
      type: "withdrawal" as const,
      payment_method_id: withdrawForm.payment_method_id,
      transaction_contact: withdrawForm.transaction_contact,
      description: fees.withdrawal_fee_percent > 0
        ? `Retrait — frais ${fees.withdrawal_fee_percent}% = ${fee.toLocaleString("fr-FR")} FCFA`
        : "Demande de retrait",
      metadata: { fee, fee_percent: fees.withdrawal_fee_percent, total_deducted: total },
    });
    setSubmitting(false);
    if (error) { toast.error("Erreur: " + error.message); return; }
    toast.success("Demande de retrait envoyée ! En attente de traitement.");
    setShowWithdraw(false);
    setWithdrawForm({ amount: "", payment_method_id: "", transaction_contact: "" });
    loadData();
  };

  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = Number(transferForm.amount);
    if (!amount || !transferForm.recipient) { toast.error("Remplissez tous les champs"); return; }
    const fee = Math.round(amount * fees.transfer_fee_percent / 100);
    const totalCost = amount + fee;
    if (totalCost > Number(profile?.wallet_balance || 0)) {
      toast.error(`Solde insuffisant. Coût total: ${totalCost.toLocaleString("fr-FR")} FCFA`); return;
    }

    const recipientInput = transferForm.recipient.trim();
    const { data: recipients } = await supabase.from("profiles").select("id, user_id, first_name, last_name, email, referral_code")
      .or(`email.eq.${recipientInput},referral_code.eq.${recipientInput.toUpperCase()}`);
    const recipient = recipients?.[0];
    if (!recipient) { toast.error("Destinataire introuvable (vérifiez l'email ou le code Moissonneur)"); return; }
    if (recipient.user_id === user!.id) { toast.error("Vous ne pouvez pas vous transférer à vous-même"); return; }

    setSubmitting(true);

    // Debit sender
    await supabase.from("profiles").update({ wallet_balance: Number(profile.wallet_balance) - totalCost }).eq("user_id", user!.id);
    // Credit recipient (net amount only)
    const { data: rp } = await supabase.from("profiles").select("wallet_balance").eq("user_id", recipient.user_id).single();
    await supabase.from("profiles").update({ wallet_balance: Number(rp?.wallet_balance || 0) + amount }).eq("user_id", recipient.user_id);

    // Transactions
    await supabase.from("transactions").insert([
      {
        user_id: user!.id, amount: totalCost, type: "transfer" as const, status: "approved" as const,
        description: `Envoi à ${recipient.first_name} ${recipient.last_name}${fee > 0 ? ` (frais: ${fee.toLocaleString("fr-FR")} FCFA)` : ""}`,
        metadata: { recipient_id: recipient.user_id, fee, net_amount: amount },
      },
      {
        user_id: recipient.user_id, amount, type: "transfer" as const, status: "approved" as const,
        description: `Reçu de ${profile.first_name} ${profile.last_name}`,
        metadata: { sender_id: user!.id },
      },
    ]);

    setSubmitting(false);
    toast.success(`${amount.toLocaleString("fr-FR")} FCFA envoyé à ${recipient.first_name} ${recipient.last_name} !`);
    setShowTransfer(false);
    setTransferForm({ amount: "", recipient: "" });
    loadData();
  };

  const handleConvertCoins = async () => {
    if (!selectedTier) { toast.error("Sélectionnez un palier"); return; }
    if (msnCoins < selectedTier.coins) {
      toast.error(`Vous avez ${msnCoins} coins, il en faut ${selectedTier.coins}`); return;
    }

    setConvertingCoins(true);

    // Mark coins as converted (oldest first)
    let coinsToConvert = selectedTier.coins;
    const { data: userCoins } = await supabase.from("msn_coins")
      .select("id, coins")
      .eq("user_id", user!.id)
      .eq("is_converted", false)
      .order("created_at", { ascending: true });

    if (userCoins) {
      for (const c of userCoins) {
        if (coinsToConvert <= 0) break;
        const toMark = Math.min(c.coins, coinsToConvert);
        if (toMark >= c.coins) {
          await supabase.from("msn_coins").update({ is_converted: true } as any).eq("id", c.id);
        } else {
          // Partial: update coins count
          await supabase.from("msn_coins").update({ coins: c.coins - toMark } as any).eq("id", c.id);
        }
        coinsToConvert -= toMark;
      }
    }

    // Calculate FCFA value (1 USD ≈ 1/rate from XOF)
    const usdToXOF = exchangeRates["USD"] ? 1 / exchangeRates["USD"] : 620;
    const fcfaAmount = Math.round(selectedTier.dollars * usdToXOF);

    // Credit wallet
    const newBalance = Number(profile.wallet_balance) + fcfaAmount;
    await supabase.from("profiles").update({ wallet_balance: newBalance }).eq("user_id", user!.id);

    // Record transaction
    await supabase.from("transactions").insert({
      user_id: user!.id,
      amount: fcfaAmount,
      type: "bonus" as const,
      status: "approved" as const,
      description: `Conversion MSN: ${selectedTier.coins} coins → $${selectedTier.dollars} (${fcfaAmount.toLocaleString("fr-FR")} FCFA)`,
      metadata: { coins_used: selectedTier.coins, dollar_value: selectedTier.dollars, currency: selectedConvertCurrency },
    });

    // Record in msn_conversions
    await supabase.from("msn_conversions").insert({
      user_id: user!.id,
      coins_used: selectedTier.coins,
      dollar_amount: selectedTier.dollars,
    } as any);

    const valueInCurrency = getMSNCoinValueInCurrency(selectedTier.coins, selectedTier.dollars, selectedConvertCurrency);
    toast.success(`🔥 ${selectedTier.coins} MSN Coins convertis ! +${formatAmount(valueInCurrency, selectedConvertCurrency)} ${getCurrencySymbol(selectedConvertCurrency)} crédités !`);
    setConvertingCoins(false);
    setShowMSNConvert(false);
    setSelectedTier(null);
    loadData();
  };

  const renderPaymentMethodDetails = (method: any) => {
    if (!method) return null;
    return (
      <div className="bg-secondary rounded-lg p-4 space-y-2">
        <p className="text-xs font-semibold text-foreground font-body">📋 Informations de paiement :</p>
        {method.payment_link && (
          <a href={method.payment_link} target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-primary text-primary-foreground font-body text-sm font-semibold hover:bg-primary/90 transition-colors">
            <ExternalLink className="w-4 h-4" /> Cliquer pour payer en ligne
          </a>
        )}
        {Object.entries(method.details as Record<string, string>).filter(([k]) => k !== "instructions").map(([key, value]) => (
          <div key={key} className="flex items-center justify-between text-sm font-body">
            <span className="text-muted-foreground capitalize">{key.replace(/_/g, " ")} :</span>
            <div className="flex items-center gap-2">
              <span className="font-medium text-foreground">{String(value)}</span>
              <button type="button" onClick={() => { navigator.clipboard.writeText(String(value)); toast.success("Copié !"); }}
                className="p-1 rounded hover:bg-muted transition-colors"><Copy className="w-3.5 h-3.5 text-muted-foreground" /></button>
            </div>
          </div>
        ))}
        {method.details?.instructions && (
          <p className="text-xs text-muted-foreground font-body border-t border-border pt-2">{method.details.instructions}</p>
        )}
      </div>
    );
  };

  const getTransactionSign = (tx: any) => {
    const positive = ["deposit", "commission", "bonus", "admin_credit"];
    if (positive.includes(tx.type)) return "+";
    if (tx.type === "transfer" && tx.description?.includes("Reçu")) return "+";
    return "-";
  };
  const isPositive = (tx: any) => getTransactionSign(tx) === "+";

  if (loading || !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground font-body">Chargement...</div>
      </div>
    );
  }

  const conversionTiers: { coins: number; dollars: number }[] = msnConfig.conversion_tiers || [
    { coins: 3, dollars: 40 },
    { coins: 6, dollars: 125 },
    { coins: 12, dollars: 250 },
  ];

  return (
    <DashboardLayout>
      <h1 className="text-3xl font-heading font-bold text-foreground mb-6">💰 Mon Portefeuille</h1>

      {/* ====== BALANCE CARD ====== */}
      <div className="card-elevated mb-6">
        <div className="flex items-start justify-between mb-4 flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <WalletIcon className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground font-body">Solde disponible</p>
              <p className="text-3xl font-heading font-bold text-foreground">
                {formatAmount(displayBalance, displayCurrency)} {getCurrencySymbol(displayCurrency)}
              </p>
              {displayCurrency !== "XOF" && (
                <p className="text-xs text-muted-foreground font-body">
                  ≈ {Number(profile.wallet_balance).toLocaleString("fr-FR")} FCFA
                </p>
              )}
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
            <button onClick={fetchRates} className="p-2 rounded-lg bg-secondary hover:bg-muted transition-colors" title="Actualiser les taux">
              <RefreshCw className={`w-4 h-4 text-muted-foreground ${ratesLoading ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>

        <div className="flex gap-3 flex-wrap">
          <button
            onClick={() => { setShowDeposit(true); setShowWithdraw(false); setShowTransfer(false); setShowMSNConvert(false); }}
            className="flex-1 min-w-[120px] btn-hero !text-sm !py-2.5"
          >
            <ArrowDownCircle className="w-4 h-4 mr-2" /> Recharger
          </button>
          <button
            onClick={() => { setShowWithdraw(true); setShowDeposit(false); setShowTransfer(false); setShowMSNConvert(false); }}
            className="flex-1 min-w-[120px] inline-flex items-center justify-center rounded-lg px-4 py-2.5 text-sm font-semibold transition-all bg-accent text-accent-foreground hover:opacity-90"
          >
            <ArrowUpCircle className="w-4 h-4 mr-2" /> Retirer
          </button>
          <button
            onClick={() => { setShowTransfer(true); setShowDeposit(false); setShowWithdraw(false); setShowMSNConvert(false); }}
            className="flex-1 min-w-[120px] inline-flex items-center justify-center rounded-lg px-4 py-2.5 text-sm font-semibold transition-all bg-harvest-green text-white hover:opacity-90"
          >
            <Send className="w-4 h-4 mr-2" /> Transférer
          </button>
        </div>
      </div>

      {/* ====== MSN COINS SECTION ====== */}
      <div className="card-elevated mb-6">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-gold flex items-center justify-center">
              <Flame className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground font-body">MSN Coins disponibles</p>
              <div className="flex items-center gap-2">
                <p className="text-2xl font-heading font-bold text-foreground">{msnCoins}</p>
                <Coins className="w-5 h-5 text-gold" />
              </div>
            </div>
          </div>
          {msnCoins > 0 && (
            <div className="text-right text-xs font-body text-muted-foreground">
              <p>Valeur estimée</p>
              <p className="text-primary font-bold">
                ~{Math.round(msnCoins * MSN_COIN_VALUE_FCFA).toLocaleString("fr-FR")} FCFA
              </p>
            </div>
          )}
        </div>

        <p className="text-xs text-muted-foreground font-body mb-4">
          🔥 Chaque vente dans votre réseau vous rapporte des MSN Coins. Convertissez-les en argent réel !
          {msnCoins === 0 && " Développez votre réseau pour gagner vos premiers coins."}
        </p>

        {msnCoins > 0 ? (
          <>
            <div className="grid grid-cols-3 gap-2 mb-4">
              {conversionTiers.map((tier, i) => {
                const valueInCurrency = getMSNCoinValueInCurrency(tier.coins, tier.dollars, selectedConvertCurrency);
                const canConvert = msnCoins >= tier.coins;
                return (
                  <button
                    key={i}
                    onClick={() => { setSelectedTier(tier); setShowMSNConvert(true); setShowDeposit(false); setShowWithdraw(false); setShowTransfer(false); }}
                    disabled={!canConvert}
                    className={`p-3 rounded-xl border-2 transition-all text-center ${
                      canConvert
                        ? selectedTier?.coins === tier.coins
                          ? "border-primary bg-primary/10"
                          : "border-border hover:border-primary/50 bg-card hover:bg-primary/5"
                        : "border-border/50 bg-muted/30 opacity-50 cursor-not-allowed"
                    }`}
                  >
                    <p className="text-sm font-bold font-heading text-foreground">{tier.coins} coins</p>
                    <p className="text-xs text-gold font-semibold">${tier.dollars}</p>
                    <p className="text-[10px] text-muted-foreground font-body mt-1">
                      ≈ {formatAmount(valueInCurrency, selectedConvertCurrency)} {getCurrencySymbol(selectedConvertCurrency)}
                    </p>
                  </button>
                );
              })}
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground font-body">Voir les valeurs en :</span>
              <select
                value={selectedConvertCurrency}
                onChange={e => setSelectedConvertCurrency(e.target.value)}
                className="flex-1 px-3 py-1.5 rounded-lg border border-input bg-background text-foreground font-body text-xs"
              >
                {CURRENCIES.map(c => <option key={c.code} value={c.code}>{c.label}</option>)}
              </select>
            </div>
          </>
        ) : (
          <div className="bg-secondary rounded-lg p-4 text-center">
            <TrendingUp className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm font-body text-muted-foreground">Parrainez des membres et suivez leurs achats pour gagner des MSN Coins !</p>
          </div>
        )}
      </div>

      {/* ====== MSN CONVERT MODAL ====== */}
      {showMSNConvert && selectedTier && (
        <div className="card-elevated mb-6 border-2 border-primary/30 bg-primary/5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-heading font-semibold text-foreground flex items-center gap-2">
              <Flame className="w-5 h-5 text-primary" /> Conversion MSN Coins
            </h2>
            <button onClick={() => { setShowMSNConvert(false); setSelectedTier(null); }}
              className="p-1.5 rounded-lg hover:bg-secondary transition-colors">
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>

          <div className="bg-card rounded-xl p-4 mb-4 border border-border">
            <div className="flex justify-between items-center mb-3">
              <div>
                <p className="text-xs text-muted-foreground font-body">Vous convertissez</p>
                <p className="text-2xl font-heading font-bold text-foreground">{selectedTier.coins} <span className="text-base text-gold">coins</span></p>
              </div>
              <div className="text-2xl">→</div>
              <div className="text-right">
                <p className="text-xs text-muted-foreground font-body">Vous recevez</p>
                <p className="text-2xl font-heading font-bold text-primary">${selectedTier.dollars}</p>
              </div>
            </div>

            <div className="border-t border-border pt-3">
              <p className="text-xs text-muted-foreground font-body mb-2">Valeur dans votre devise :</p>
              <div className="flex items-center gap-2">
                <select
                  value={selectedConvertCurrency}
                  onChange={e => setSelectedConvertCurrency(e.target.value)}
                  className="flex-1 px-3 py-2 rounded-lg border border-input bg-background text-foreground font-body text-sm"
                >
                  {CURRENCIES.map(c => <option key={c.code} value={c.code}>{c.label}</option>)}
                </select>
                <div className="text-right min-w-[120px]">
                  <p className="text-lg font-heading font-bold text-harvest-green">
                    {formatAmount(getMSNCoinValueInCurrency(selectedTier.coins, selectedTier.dollars, selectedConvertCurrency), selectedConvertCurrency)} {getCurrencySymbol(selectedConvertCurrency)}
                  </p>
                  <p className="text-xs text-muted-foreground font-body">
                    ≈ {Math.round(selectedTier.dollars * (exchangeRates["USD"] ? 1 / exchangeRates["USD"] : 620)).toLocaleString("fr-FR")} FCFA
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-secondary rounded-lg p-3 mb-4 text-xs font-body text-muted-foreground">
            <p>⚠️ Cette action est <strong className="text-foreground">irréversible</strong>. {selectedTier.coins} coins seront déduits de votre solde et le montant équivalent en FCFA sera crédité immédiatement sur votre portefeuille.</p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleConvertCoins}
              disabled={convertingCoins || msnCoins < selectedTier.coins}
              className="flex-1 btn-gold !text-sm !py-2.5 disabled:opacity-50"
            >
              {convertingCoins ? "Conversion..." : `🔥 Convertir ${selectedTier.coins} coins`}
            </button>
            <button onClick={() => { setShowMSNConvert(false); setSelectedTier(null); }}
              className="px-4 py-2.5 rounded-lg border border-input text-muted-foreground font-body text-sm hover:bg-secondary">
              Annuler
            </button>
          </div>
        </div>
      )}

      {/* ====== DEPOSIT FORM ====== */}
      {showDeposit && (
        <div className="card-elevated mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-heading font-semibold text-foreground">📥 Demande de recharge</h2>
            <button onClick={() => setShowDeposit(false)} className="p-1.5 rounded-lg hover:bg-secondary">
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>
          <form onSubmit={handleDeposit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5 font-body">Montant (FCFA) *</label>
              <input type="number" required min="1000" value={depositForm.amount}
                onChange={e => setDepositForm({ ...depositForm, amount: e.target.value })}
                className="w-full px-4 py-3 rounded-lg border border-input bg-background text-foreground font-body"
                placeholder="Ex: 50000" />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5 font-body">Moyen de paiement *</label>
              <select required value={depositForm.payment_method_id}
                onChange={e => setDepositForm({ ...depositForm, payment_method_id: e.target.value })}
                className="w-full px-4 py-3 rounded-lg border border-input bg-background text-foreground font-body">
                <option value="">Choisir un moyen</option>
                {paymentMethods.map(m => <option key={m.id} value={m.id}>{m.name} ({m.type.replace(/_/g, " ")})</option>)}
              </select>
            </div>
            {selectedDepositMethod && renderPaymentMethodDetails(selectedDepositMethod)}
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5 font-body">Votre numéro / adresse d'envoi</label>
              <input type="text" value={depositForm.transaction_contact}
                onChange={e => setDepositForm({ ...depositForm, transaction_contact: e.target.value })}
                className="w-full px-4 py-3 rounded-lg border border-input bg-background text-foreground font-body"
                placeholder="Numéro expéditeur, adresse crypto, email PayPal..." />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5 font-body">ID / Référence de la transaction</label>
              <input type="text" value={depositForm.transaction_id_external}
                onChange={e => setDepositForm({ ...depositForm, transaction_id_external: e.target.value })}
                className="w-full px-4 py-3 rounded-lg border border-input bg-background text-foreground font-body"
                placeholder="ID de transaction, hash, référence..." />
            </div>
            <div className="flex gap-3">
              <button type="submit" disabled={submitting} className="flex-1 btn-gold !text-sm !py-2.5 disabled:opacity-50">
                {submitting ? "Envoi..." : "Valider la demande"}
              </button>
              <button type="button" onClick={() => setShowDeposit(false)}
                className="px-4 py-2.5 rounded-lg border border-input text-muted-foreground font-body text-sm hover:bg-secondary">Annuler</button>
            </div>
          </form>
        </div>
      )}

      {/* ====== WITHDRAW FORM ====== */}
      {showWithdraw && (
        <div className="card-elevated mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-heading font-semibold text-foreground">📤 Demande de retrait</h2>
            <button onClick={() => setShowWithdraw(false)} className="p-1.5 rounded-lg hover:bg-secondary">
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>
          {fees.withdrawal_fee_percent > 0 && (
            <div className="bg-accent/10 border border-accent/20 rounded-lg p-3 mb-4 text-sm font-body">
              <p>⚠️ Frais de retrait : <strong className="text-foreground">{fees.withdrawal_fee_percent}%</strong>
                {withdrawForm.amount && Number(withdrawForm.amount) > 0 && (
                  <> — Frais : <strong className="text-destructive">{Math.round(Number(withdrawForm.amount) * fees.withdrawal_fee_percent / 100).toLocaleString("fr-FR")} FCFA</strong>
                    {" "}| Total débité : <strong>{Math.round(Number(withdrawForm.amount) * (1 + fees.withdrawal_fee_percent / 100)).toLocaleString("fr-FR")} FCFA</strong>
                  </>
                )}
              </p>
            </div>
          )}
          <form onSubmit={handleWithdraw} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5 font-body">Montant à retirer (FCFA) *</label>
              <input type="number" required min="1000" value={withdrawForm.amount}
                onChange={e => setWithdrawForm({ ...withdrawForm, amount: e.target.value })}
                className="w-full px-4 py-3 rounded-lg border border-input bg-background text-foreground font-body"
                placeholder="Ex: 10000" />
              <p className="text-xs text-muted-foreground mt-1 font-body">
                Solde : <span className="font-bold text-primary">{Number(profile.wallet_balance).toLocaleString("fr-FR")} FCFA</span>
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5 font-body">Moyen de retrait *</label>
              <select required value={withdrawForm.payment_method_id}
                onChange={e => setWithdrawForm({ ...withdrawForm, payment_method_id: e.target.value })}
                className="w-full px-4 py-3 rounded-lg border border-input bg-background text-foreground font-body">
                <option value="">Choisir un moyen</option>
                {paymentMethods.map(m => <option key={m.id} value={m.id}>{m.name} ({m.type.replace(/_/g, " ")})</option>)}
              </select>
            </div>
            {selectedWithdrawMethod && renderPaymentMethodDetails(selectedWithdrawMethod)}
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5 font-body">Adresse / Numéro de réception *</label>
              <input type="text" required value={withdrawForm.transaction_contact}
                onChange={e => setWithdrawForm({ ...withdrawForm, transaction_contact: e.target.value })}
                className="w-full px-4 py-3 rounded-lg border border-input bg-background text-foreground font-body"
                placeholder="Numéro Mobile Money, adresse crypto, email PayPal..." />
            </div>
            <div className="flex gap-3">
              <button type="submit" disabled={submitting} className="flex-1 btn-gold !text-sm !py-2.5 disabled:opacity-50">
                {submitting ? "Envoi..." : "Envoyer la demande"}
              </button>
              <button type="button" onClick={() => setShowWithdraw(false)}
                className="px-4 py-2.5 rounded-lg border border-input text-muted-foreground font-body text-sm hover:bg-secondary">Annuler</button>
            </div>
          </form>
        </div>
      )}

      {/* ====== TRANSFER FORM ====== */}
      {showTransfer && (
        <div className="card-elevated mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-heading font-semibold text-foreground">📲 Transférer de l'argent</h2>
            <button onClick={() => setShowTransfer(false)} className="p-1.5 rounded-lg hover:bg-secondary">
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>
          {fees.transfer_fee_percent > 0 && (
            <div className="bg-accent/10 border border-accent/20 rounded-lg p-3 mb-4 text-sm font-body">
              <p>⚠️ Frais de transfert : <strong className="text-foreground">{fees.transfer_fee_percent}%</strong>
                {transferForm.amount && Number(transferForm.amount) > 0 && (
                  <> — Frais : <strong className="text-destructive">{Math.round(Number(transferForm.amount) * fees.transfer_fee_percent / 100).toLocaleString("fr-FR")} FCFA</strong>
                  </>
                )}
              </p>
            </div>
          )}
          <form onSubmit={handleTransfer} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5 font-body">Email ou Code Moissonneur du destinataire *</label>
              <input type="text" required value={transferForm.recipient}
                onChange={e => setTransferForm({ ...transferForm, recipient: e.target.value })}
                className="w-full px-4 py-3 rounded-lg border border-input bg-background text-foreground font-body"
                placeholder="email@exemple.com ou MOI-XXXXXX" />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5 font-body">Montant à envoyer (FCFA) *</label>
              <input type="number" required min="500" value={transferForm.amount}
                onChange={e => setTransferForm({ ...transferForm, amount: e.target.value })}
                className="w-full px-4 py-3 rounded-lg border border-input bg-background text-foreground font-body"
                placeholder="Ex: 5000" />
              <p className="text-xs text-muted-foreground mt-1 font-body">
                Solde : <span className="font-bold text-primary">{Number(profile.wallet_balance).toLocaleString("fr-FR")} FCFA</span>
                {transferForm.amount && Number(transferForm.amount) > 0 && fees.transfer_fee_percent > 0 && (
                  <> | Coût total : <span className="font-bold text-destructive">{Math.round(Number(transferForm.amount) * (1 + fees.transfer_fee_percent / 100)).toLocaleString("fr-FR")} FCFA</span></>
                )}
              </p>
            </div>
            <div className="flex gap-3">
              <button type="submit" disabled={submitting} className="flex-1 btn-gold !text-sm !py-2.5 disabled:opacity-50">
                {submitting ? "Envoi..." : "Envoyer"}
              </button>
              <button type="button" onClick={() => setShowTransfer(false)}
                className="px-4 py-2.5 rounded-lg border border-input text-muted-foreground font-body text-sm hover:bg-secondary">Annuler</button>
            </div>
          </form>
        </div>
      )}

      {/* ====== TRANSACTION HISTORY ====== */}
      <div className="card-elevated">
        <h2 className="text-lg font-heading font-semibold text-foreground mb-4">📋 Historique des transactions</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm font-body">
            <thead>
              <tr className="border-b border-border text-muted-foreground">
                <th className="text-left py-2 px-3">Date</th>
                <th className="text-left py-2 px-3">Type</th>
                <th className="text-right py-2 px-3">Montant</th>
                <th className="text-left py-2 px-3">Statut</th>
                <th className="text-left py-2 px-3 hidden md:table-cell">Description</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map(tx => (
                <tr key={tx.id} className="border-b border-border/50 hover:bg-secondary/20 transition-colors">
                  <td className="py-2 px-3 whitespace-nowrap">
                    <span>{new Date(tx.created_at).toLocaleDateString("fr-FR")}</span>
                    <span className="block text-[10px] text-muted-foreground">
                      {new Date(tx.created_at).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </td>
                  <td className="py-2 px-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                      tx.type === "commission" ? "bg-gold/20 text-gold" :
                      tx.type === "bonus" ? "bg-harvest-green/20 text-harvest-green" :
                      tx.type === "deposit" ? "bg-primary/20 text-primary" :
                      tx.type === "admin_credit" ? "bg-harvest-green/20 text-harvest-green" :
                      tx.type === "admin_debit" ? "bg-destructive/20 text-destructive" :
                      "bg-muted text-muted-foreground"
                    }`}>
                      {TYPE_LABELS[tx.type] || tx.type}
                    </span>
                  </td>
                  <td className={`py-2 px-3 text-right font-semibold whitespace-nowrap ${isPositive(tx) ? "text-harvest-green" : "text-destructive"}`}>
                    {getTransactionSign(tx)}{Number(tx.amount).toLocaleString("fr-FR")} FCFA
                  </td>
                  <td className="py-2 px-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                      tx.status === "approved" ? "bg-harvest-green/20 text-harvest-green" :
                      tx.status === "rejected" ? "bg-destructive/20 text-destructive" :
                      "bg-gold/20 text-gold"
                    }`}>
                      {tx.status === "approved" ? "✓" : tx.status === "rejected" ? "✗" : "⏳"}
                    </span>
                  </td>
                  <td className="py-2 px-3 text-muted-foreground text-xs hidden md:table-cell max-w-[200px] truncate">
                    {tx.description || "—"}
                  </td>
                </tr>
              ))}
              {transactions.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-muted-foreground font-body">
                    Aucune transaction pour le moment
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default WalletPage;
