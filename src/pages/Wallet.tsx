import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Wallet as WalletIcon, ArrowDownCircle, ArrowUpCircle, Copy, RefreshCw, Send, ExternalLink, Flame, Coins } from "lucide-react";
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
  { code: "JPY", label: "Yen (JPY)", symbol: "¥" },
  { code: "CNY", label: "Yuan (CNY)", symbol: "¥" },
  { code: "BTC", label: "Bitcoin (BTC)", symbol: "₿" },
];

const WalletPage = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<any[]>([]);
  const [showDeposit, setShowDeposit] = useState(false);
  const [showWithdraw, setShowWithdraw] = useState(false);
  const [showTransfer, setShowTransfer] = useState(false);
  const [displayCurrency, setDisplayCurrency] = useState("XOF");
  const [exchangeRates, setExchangeRates] = useState<Record<string, number>>({});
  const [depositForm, setDepositForm] = useState({ amount: "", payment_method_id: "", transaction_contact: "", transaction_id_external: "" });
  const [withdrawForm, setWithdrawForm] = useState({ amount: "", payment_method_id: "", transaction_contact: "" });
  const [transferForm, setTransferForm] = useState({ amount: "", recipient: "" });
  const [submitting, setSubmitting] = useState(false);
  const [fees, setFees] = useState({ withdrawal_fee_percent: 0, transfer_fee_percent: 0 });
  const [msnCoins, setMsnCoins] = useState(0);
  const [msnConfig, setMsnConfig] = useState<any>({});
  const [convertingCoins, setConvertingCoins] = useState(false);

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
    try {
      const res = await fetch("https://api.exchangerate-api.com/v4/latest/XOF");
      const data = await res.json();
      setExchangeRates(data.rates || {});
    } catch { setExchangeRates({}); }
  };

  const convertedBalance = () => {
    if (!profile || displayCurrency === "XOF") return Number(profile?.wallet_balance || 0);
    const rate = exchangeRates[displayCurrency];
    if (!rate) return Number(profile?.wallet_balance || 0);
    return Number(profile.wallet_balance) * rate;
  };

  const getCurrencySymbol = () => CURRENCIES.find(c => c.code === displayCurrency)?.symbol || displayCurrency;

  const selectedDepositMethod = paymentMethods.find(m => m.id === depositForm.payment_method_id);
  const selectedWithdrawMethod = paymentMethods.find(m => m.id === withdrawForm.payment_method_id);

  const handleDeposit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!depositForm.amount || !depositForm.payment_method_id) { toast.error("Remplissez les champs obligatoires"); return; }
    setSubmitting(true);
    const { error } = await supabase.from("transactions").insert({
      user_id: user!.id, amount: Number(depositForm.amount), type: "deposit" as const,
      payment_method_id: depositForm.payment_method_id,
      transaction_contact: depositForm.transaction_contact,
      transaction_id_external: depositForm.transaction_id_external,
      description: "Demande de dépôt",
    });
    setSubmitting(false);
    if (error) { toast.error("Erreur: " + error.message); return; }
    toast.success("Demande de dépôt envoyée ! En attente de validation.");
    setShowDeposit(false);
    setDepositForm({ amount: "", payment_method_id: "", transaction_contact: "", transaction_id_external: "" });
    loadData();
  };

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = Number(withdrawForm.amount);
    if (!amount || !withdrawForm.payment_method_id) { toast.error("Remplissez les champs obligatoires"); return; }
    const fee = amount * fees.withdrawal_fee_percent / 100;
    const total = amount + fee;
    if (total > Number(profile?.wallet_balance || 0)) { toast.error("Solde insuffisant (montant + frais)"); return; }
    setSubmitting(true);
    const { error } = await supabase.from("transactions").insert({
      user_id: user!.id, amount, type: "withdrawal" as const,
      payment_method_id: withdrawForm.payment_method_id,
      transaction_contact: withdrawForm.transaction_contact,
      description: `Demande de retrait (frais: ${fee.toLocaleString("fr-FR")} FCFA)`,
      metadata: { fee, fee_percent: fees.withdrawal_fee_percent },
    });
    setSubmitting(false);
    if (error) { toast.error("Erreur: " + error.message); return; }
    toast.success("Demande de retrait envoyée !");
    setShowWithdraw(false);
    setWithdrawForm({ amount: "", payment_method_id: "", transaction_contact: "" });
    loadData();
  };

  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = Number(transferForm.amount);
    if (!amount || !transferForm.recipient) { toast.error("Remplissez tous les champs"); return; }
    const fee = amount * fees.transfer_fee_percent / 100;
    const total = amount + fee;
    if (total > Number(profile?.wallet_balance || 0)) { toast.error("Solde insuffisant (montant + frais)"); return; }

    // Find recipient by email or referral code
    const { data: recipients } = await supabase.from("profiles").select("id, user_id, first_name, last_name, email, referral_code")
      .or(`email.eq.${transferForm.recipient},referral_code.eq.${transferForm.recipient}`);
    const recipient = recipients?.[0];
    if (!recipient) { toast.error("Destinataire introuvable"); return; }
    if (recipient.user_id === user!.id) { toast.error("Vous ne pouvez pas vous transférer à vous-même"); return; }

    setSubmitting(true);
    // Debit sender
    const newSenderBalance = Number(profile.wallet_balance) - total;
    await supabase.from("profiles").update({ wallet_balance: newSenderBalance }).eq("user_id", user!.id);
    // Credit recipient
    const { data: recipientProfile } = await supabase.from("profiles").select("wallet_balance").eq("user_id", recipient.user_id).single();
    const newRecipientBalance = Number(recipientProfile?.wallet_balance || 0) + amount;
    await supabase.from("profiles").update({ wallet_balance: newRecipientBalance }).eq("user_id", recipient.user_id);
    // Transactions
    await supabase.from("transactions").insert([
      {
        user_id: user!.id, amount: total, type: "transfer" as const, status: "approved" as const,
        description: `Transfert à ${recipient.first_name} ${recipient.last_name} (frais: ${fee.toLocaleString("fr-FR")} FCFA)`,
        metadata: { recipient_id: recipient.user_id, fee, net_amount: amount },
      },
      {
        user_id: recipient.user_id, amount, type: "transfer" as const, status: "approved" as const,
        description: `Transfert reçu de ${profile.first_name} ${profile.last_name}`,
        metadata: { sender_id: user!.id },
      },
    ]);
    setSubmitting(false);
    toast.success(`${amount.toLocaleString("fr-FR")} FCFA transféré à ${recipient.first_name} !`);
    setShowTransfer(false);
    setTransferForm({ amount: "", recipient: "" });
    loadData();
  };

  const renderPaymentMethodDetails = (method: any) => {
    if (!method) return null;
    return (
      <div className="bg-secondary rounded-lg p-4">
        <p className="text-sm font-semibold text-foreground mb-2 font-body">Informations du moyen de paiement :</p>
        {method.payment_link && (
          <a href={method.payment_link} target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-2 mb-3 px-4 py-2.5 rounded-lg bg-primary text-primary-foreground font-body text-sm font-semibold hover:bg-primary/90 transition-colors">
            <ExternalLink className="w-4 h-4" /> Cliquer pour payer en ligne
          </a>
        )}
        {Object.entries(method.details as Record<string, string>).map(([key, value]) => (
          <div key={key} className="flex items-center justify-between text-sm font-body mb-1">
            <span className="text-muted-foreground capitalize">{key.replace(/_/g, " ")}:</span>
            <div className="flex items-center gap-2">
              <span className="font-medium text-foreground">{String(value)}</span>
              <button type="button" onClick={() => { navigator.clipboard.writeText(String(value)); toast.success("Copié !"); }}
                className="p-1 rounded hover:bg-muted transition-colors"><Copy className="w-3.5 h-3.5 text-muted-foreground" /></button>
            </div>
          </div>
        ))}
      </div>
    );
  };

  const handleConvertCoins = async (tier: { coins: number; dollars: number }) => {
    if (msnCoins < tier.coins) { toast.error(`Vous n'avez que ${msnCoins} coins, il en faut ${tier.coins}`); return; }
    setConvertingCoins(true);
    // Mark coins as converted
    const { data: userCoins } = await supabase.from("msn_coins").select("id").eq("user_id", user!.id).eq("is_converted", false).limit(tier.coins);
    if (userCoins) {
      for (const c of userCoins) {
        await supabase.from("msn_coins").update({ is_converted: true } as any).eq("id", c.id);
      }
    }
    // Record conversion
    await supabase.from("msn_conversions").insert({ user_id: user!.id, coins_used: tier.coins, dollar_amount: tier.dollars } as any);
    // Credit wallet (convert $ to FCFA approx 600)
    const fcfaAmount = tier.dollars * 600;
    const newBalance = Number(profile.wallet_balance) + fcfaAmount;
    await supabase.from("profiles").update({ wallet_balance: newBalance }).eq("user_id", user!.id);
    await supabase.from("transactions").insert({
      user_id: user!.id, amount: fcfaAmount, type: "bonus" as const, status: "approved" as const,
      description: `Conversion MSN: ${tier.coins} coins → ${tier.dollars}$ (${fcfaAmount.toLocaleString("fr-FR")} FCFA)`,
    });
    toast.success(`🔥 ${tier.coins} MSN Coins convertis en ${tier.dollars}$ !`);
    setConvertingCoins(false);
    loadData();
  };

  if (loading || !profile) {
    return <div className="min-h-screen flex items-center justify-center bg-background"><div className="animate-pulse text-muted-foreground font-body">Chargement...</div></div>;
  }

  return (
    <DashboardLayout>
      <h1 className="text-3xl font-heading font-bold text-foreground mb-6">💰 Mon Portefeuille</h1>

      {/* Balance Card */}
      <div className="card-elevated mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <WalletIcon className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground font-body">Solde disponible</p>
              <p className="text-3xl font-heading font-bold text-foreground">
                {convertedBalance().toLocaleString("fr-FR", { maximumFractionDigits: 2 })} {getCurrencySymbol()}
              </p>
            </div>
          </div>
          <select value={displayCurrency} onChange={e => setDisplayCurrency(e.target.value)}
            className="px-3 py-2 rounded-lg border border-input bg-background text-foreground font-body text-sm">
            {CURRENCIES.map(c => <option key={c.code} value={c.code}>{c.label}</option>)}
          </select>
        </div>
        <div className="flex gap-3 flex-wrap">
          <button onClick={() => { setShowDeposit(true); setShowWithdraw(false); setShowTransfer(false); }} className="flex-1 btn-hero !text-sm !py-2.5">
            <ArrowDownCircle className="w-4 h-4 mr-2" /> Recharger
          </button>
          <button onClick={() => { setShowWithdraw(true); setShowDeposit(false); setShowTransfer(false); }}
            className="flex-1 inline-flex items-center justify-center rounded-lg px-4 py-2.5 text-sm font-semibold transition-all bg-accent text-accent-foreground hover:opacity-90">
            <ArrowUpCircle className="w-4 h-4 mr-2" /> Retirer
          </button>
          <button onClick={() => { setShowTransfer(true); setShowDeposit(false); setShowWithdraw(false); }}
            className="flex-1 inline-flex items-center justify-center rounded-lg px-4 py-2.5 text-sm font-semibold transition-all bg-harvest-green text-primary-foreground hover:opacity-90">
            <Send className="w-4 h-4 mr-2" /> Transférer
          </button>
        </div>
      </div>

      {/* Deposit Form */}
      {showDeposit && (
        <div className="card-elevated mb-6">
          <h2 className="text-lg font-heading font-semibold text-foreground mb-4">📥 Demande de recharge</h2>
          <form onSubmit={handleDeposit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5 font-body">Montant (FCFA)</label>
              <input type="number" required value={depositForm.amount} onChange={e => setDepositForm({...depositForm, amount: e.target.value})}
                className="w-full px-4 py-3 rounded-lg border border-input bg-background text-foreground font-body" placeholder="Ex: 50000" />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5 font-body">Moyen de paiement</label>
              <select required value={depositForm.payment_method_id} onChange={e => setDepositForm({...depositForm, payment_method_id: e.target.value})}
                className="w-full px-4 py-3 rounded-lg border border-input bg-background text-foreground font-body">
                <option value="">Choisir un moyen</option>
                {paymentMethods.map(m => <option key={m.id} value={m.id}>{m.name} ({m.type.replace(/_/g, " ")})</option>)}
              </select>
            </div>
            {renderPaymentMethodDetails(selectedDepositMethod)}
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5 font-body">Contact / Adresse de la transaction</label>
              <input type="text" value={depositForm.transaction_contact} onChange={e => setDepositForm({...depositForm, transaction_contact: e.target.value})}
                className="w-full px-4 py-3 rounded-lg border border-input bg-background text-foreground font-body" placeholder="Numéro, adresse crypto, email PayPal..." />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5 font-body">ID de la transaction</label>
              <input type="text" value={depositForm.transaction_id_external} onChange={e => setDepositForm({...depositForm, transaction_id_external: e.target.value})}
                className="w-full px-4 py-3 rounded-lg border border-input bg-background text-foreground font-body" placeholder="ID ou référence de la transaction" />
            </div>
            <div className="flex gap-3">
              <button type="submit" disabled={submitting} className="flex-1 btn-gold !text-sm !py-2.5 disabled:opacity-50">
                {submitting ? "Envoi..." : "Valider la demande"}
              </button>
              <button type="button" onClick={() => setShowDeposit(false)} className="px-4 py-2.5 rounded-lg border border-input text-muted-foreground font-body text-sm hover:bg-secondary">Annuler</button>
            </div>
          </form>
        </div>
      )}

      {/* Withdraw Form */}
      {showWithdraw && (
        <div className="card-elevated mb-6">
          <h2 className="text-lg font-heading font-semibold text-foreground mb-4">📤 Demande de retrait</h2>
          {fees.withdrawal_fee_percent > 0 && (
            <p className="text-xs text-muted-foreground font-body mb-3 bg-secondary rounded-lg p-2">
              ⚠️ Frais de retrait: <span className="font-semibold text-foreground">{fees.withdrawal_fee_percent}%</span>
              {withdrawForm.amount && <> — Frais: <span className="font-semibold">{(Number(withdrawForm.amount) * fees.withdrawal_fee_percent / 100).toLocaleString("fr-FR")} FCFA</span></>}
            </p>
          )}
          <form onSubmit={handleWithdraw} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5 font-body">Montant (FCFA)</label>
              <input type="number" required value={withdrawForm.amount} onChange={e => setWithdrawForm({...withdrawForm, amount: e.target.value})}
                className="w-full px-4 py-3 rounded-lg border border-input bg-background text-foreground font-body" placeholder="Ex: 10000" />
              <p className="text-xs text-muted-foreground mt-1 font-body">Solde: {Number(profile.wallet_balance).toLocaleString("fr-FR")} FCFA</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5 font-body">Moyen de retrait</label>
              <select required value={withdrawForm.payment_method_id} onChange={e => setWithdrawForm({...withdrawForm, payment_method_id: e.target.value})}
                className="w-full px-4 py-3 rounded-lg border border-input bg-background text-foreground font-body">
                <option value="">Choisir un moyen</option>
                {paymentMethods.map(m => <option key={m.id} value={m.id}>{m.name} ({m.type.replace(/_/g, " ")})</option>)}
              </select>
            </div>
            {renderPaymentMethodDetails(selectedWithdrawMethod)}
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5 font-body">Contact / Adresse de réception</label>
              <input type="text" required value={withdrawForm.transaction_contact} onChange={e => setWithdrawForm({...withdrawForm, transaction_contact: e.target.value})}
                className="w-full px-4 py-3 rounded-lg border border-input bg-background text-foreground font-body" placeholder="Numéro, adresse crypto, email PayPal..." />
            </div>
            <div className="flex gap-3">
              <button type="submit" disabled={submitting} className="flex-1 btn-gold !text-sm !py-2.5 disabled:opacity-50">
                {submitting ? "Envoi..." : "Valider la demande de retrait"}
              </button>
              <button type="button" onClick={() => setShowWithdraw(false)} className="px-4 py-2.5 rounded-lg border border-input text-muted-foreground font-body text-sm hover:bg-secondary">Annuler</button>
            </div>
          </form>
        </div>
      )}

      {/* Transfer Form */}
      {showTransfer && (
        <div className="card-elevated mb-6">
          <h2 className="text-lg font-heading font-semibold text-foreground mb-4">📲 Transférer de l'argent</h2>
          {fees.transfer_fee_percent > 0 && (
            <p className="text-xs text-muted-foreground font-body mb-3 bg-secondary rounded-lg p-2">
              ⚠️ Frais de transfert: <span className="font-semibold text-foreground">{fees.transfer_fee_percent}%</span>
              {transferForm.amount && <> — Frais: <span className="font-semibold">{(Number(transferForm.amount) * fees.transfer_fee_percent / 100).toLocaleString("fr-FR")} FCFA</span></>}
            </p>
          )}
          <form onSubmit={handleTransfer} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5 font-body">Email ou Code Moissonneur du destinataire</label>
              <input type="text" required value={transferForm.recipient} onChange={e => setTransferForm({...transferForm, recipient: e.target.value})}
                className="w-full px-4 py-3 rounded-lg border border-input bg-background text-foreground font-body" placeholder="email@example.com ou MOI-XXXXXX" />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5 font-body">Montant (FCFA)</label>
              <input type="number" required value={transferForm.amount} onChange={e => setTransferForm({...transferForm, amount: e.target.value})}
                className="w-full px-4 py-3 rounded-lg border border-input bg-background text-foreground font-body" placeholder="Ex: 5000" />
              <p className="text-xs text-muted-foreground mt-1 font-body">Solde: {Number(profile.wallet_balance).toLocaleString("fr-FR")} FCFA</p>
            </div>
            <div className="flex gap-3">
              <button type="submit" disabled={submitting} className="flex-1 btn-gold !text-sm !py-2.5 disabled:opacity-50">
                {submitting ? "Envoi..." : "Envoyer"}
              </button>
              <button type="button" onClick={() => setShowTransfer(false)} className="px-4 py-2.5 rounded-lg border border-input text-muted-foreground font-body text-sm hover:bg-secondary">Annuler</button>
            </div>
          </form>
        </div>
      )}

      {/* Transaction History */}
      <div className="card-elevated">
        <h2 className="text-lg font-heading font-semibold text-foreground mb-4">📋 Historique des transactions</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm font-body">
            <thead><tr className="border-b border-border text-muted-foreground">
              <th className="text-left py-2 px-3">Date</th>
              <th className="text-left py-2 px-3">Type</th>
              <th className="text-right py-2 px-3">Montant</th>
              <th className="text-left py-2 px-3">Statut</th>
              <th className="text-left py-2 px-3">Description</th>
            </tr></thead>
            <tbody>
              {transactions.map(tx => (
                <tr key={tx.id} className="border-b border-border/50">
                  <td className="py-2 px-3">{new Date(tx.created_at).toLocaleDateString("fr-FR")}</td>
                  <td className="py-2 px-3 capitalize">{tx.type.replace(/_/g, " ")}</td>
                  <td className={`py-2 px-3 text-right font-semibold ${["deposit", "commission", "bonus", "admin_credit"].includes(tx.type) ? "text-harvest-green" : tx.type === "transfer" && tx.description?.includes("reçu") ? "text-harvest-green" : "text-destructive"}`}>
                    {["deposit", "commission", "bonus", "admin_credit"].includes(tx.type) || (tx.type === "transfer" && tx.description?.includes("reçu")) ? "+" : "-"}{Number(tx.amount).toLocaleString("fr-FR")} FCFA
                  </td>
                  <td className="py-2 px-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                      tx.status === "approved" ? "bg-harvest-green/20 text-harvest-green" :
                      tx.status === "rejected" ? "bg-destructive/20 text-destructive" : "bg-gold/20 text-gold"
                    }`}>{tx.status === "approved" ? "Approuvé" : tx.status === "rejected" ? "Rejeté" : "En attente"}</span>
                  </td>
                  <td className="py-2 px-3 text-muted-foreground text-xs">{tx.description || "—"}</td>
                </tr>
              ))}
              {transactions.length === 0 && <tr><td colSpan={5} className="py-8 text-center text-muted-foreground">Aucune transaction</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default WalletPage;
