import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { CheckCircle, Ban, RefreshCw, Flame, Coins, Settings, Save } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const MSN_PAYMENT_SERVICES: Record<string, string> = {
  mtn_money: "MTN Mobile Money",
  orange_money: "Orange Money",
  moov_money: "Moov Money",
  wave: "Wave",
  free_money: "Free Money",
  wizall: "Wizall Money",
  push_ci: "PUSH CI",
  flooz: "Flooz",
  mobile_money_other: "Mobile Money (Autre)",
  usdt_trc20: "USDT TRC20",
  usdt_erc20: "USDT ERC20",
  bitcoin: "Bitcoin",
  ethereum: "Ethereum",
  binance_pay: "Binance Pay",
  crypto_other: "Crypto (Autre)",
  paypal: "PayPal",
  bank_transfer: "Virement Bancaire",
};

const CURRENCIES: Record<string, string> = {
  XOF: "FCFA", USD: "$", EUR: "€", GBP: "£", NGN: "₦",
  GHS: "₵", MAD: "MAD", XAF: "FCFA", CAD: "CA$", CHF: "CHF", BTC: "₿",
};

const AdminMSNWithdrawals = () => {
  const { user } = useAuth();
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [profiles, setProfiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("");
  const [processingId, setProcessingId] = useState<string | null>(null);

  // Coin rate config
  const [coinUsdRate, setCoinUsdRate] = useState<string>("1");
  const [savingRate, setSavingRate] = useState(false);
  const [currentRate, setCurrentRate] = useState<number>(1);

  useEffect(() => { loadAll(); }, []);

  const loadAll = async () => {
    setLoading(true);
    const [wdRes, profilesRes, cfgRes] = await Promise.all([
      supabase.from("msn_withdrawals" as any).select("*").order("created_at", { ascending: false }),
      supabase.from("profiles").select("user_id, first_name, last_name, email"),
      supabase.from("msn_config").select("*").eq("key", "coin_usd_rate").single(),
    ]);
    setWithdrawals(wdRes.data || []);
    setProfiles(profilesRes.data || []);
    const rate = Number((cfgRes.data as any)?.value) || 1;
    setCurrentRate(rate);
    setCoinUsdRate(String(rate));
    setLoading(false);
  };

  const getUserName = (userId: string) => {
    const p = profiles.find(pr => pr.user_id === userId);
    return p ? `${p.first_name} ${p.last_name}` : userId.slice(0, 8) + "...";
  };

  const saveRate = async () => {
    const rate = Number(coinUsdRate);
    if (!rate || rate <= 0) { toast.error("Taux invalide"); return; }
    setSavingRate(true);
    const { error } = await supabase.from("msn_config")
      .update({ value: rate as any, updated_at: new Date().toISOString() })
      .eq("key", "coin_usd_rate");
    setSavingRate(false);
    if (error) {
      // Try insert if update failed (record might not exist)
      await supabase.from("msn_config").insert({
        key: "coin_usd_rate",
        value: rate as any,
        label: "Valeur d'1 MSN Coin en USD",
      });
    }
    setCurrentRate(rate);
    toast.success(`✅ Taux mis à jour : 1 MSN Coin = ${rate} USD`);
    loadAll();
  };

  const handleApprove = async (withdrawal: any) => {
    if (!confirm(`Valider ce retrait de ${withdrawal.coins_amount} coins pour ${getUserName(withdrawal.user_id)} ?`)) return;
    setProcessingId(withdrawal.id);

    const { error } = await supabase.from("msn_withdrawals" as any)
      .update({
        status: "approved",
        processed_by: user!.id,
        processed_at: new Date().toISOString(),
      })
      .eq("id", withdrawal.id);

    setProcessingId(null);

    if (error) { toast.error("Erreur: " + error.message); return; }
    toast.success(`✅ Retrait validé pour ${getUserName(withdrawal.user_id)}`);
    loadAll();
  };

  const handleReject = async (withdrawal: any) => {
    if (!confirm(`Refuser ce retrait et rembourser ${withdrawal.coins_amount} coins à ${getUserName(withdrawal.user_id)} ?`)) return;
    setProcessingId(withdrawal.id);

    // Reject + restore coins
    const { error } = await supabase.from("msn_withdrawals" as any)
      .update({
        status: "rejected",
        processed_by: user!.id,
        processed_at: new Date().toISOString(),
      })
      .eq("id", withdrawal.id);

    if (!error) {
      // Restore coins to user
      await supabase.from("msn_coins").insert({
        user_id: withdrawal.user_id,
        coins: withdrawal.coins_amount,
        source_type: "withdrawal_cancelled",
        is_converted: false,
      } as any);
    }

    setProcessingId(null);

    if (error) { toast.error("Erreur: " + error.message); return; }
    toast.success(`❌ Retrait refusé — ${withdrawal.coins_amount} coins remboursés`);
    loadAll();
  };

  const filtered = withdrawals.filter(w => !filterStatus || w.status === filterStatus);

  const stats = {
    pending: withdrawals.filter(w => w.status === "pending").length,
    approved: withdrawals.filter(w => w.status === "approved").length,
    rejected: withdrawals.filter(w => w.status === "rejected").length,
    totalCoins: withdrawals.filter(w => w.status === "pending").reduce((s, w) => s + w.coins_amount, 0),
  };

  if (loading) return <div className="animate-pulse text-muted-foreground font-body">Chargement...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-2">
        <Flame className="w-7 h-7 text-primary" />
        <h1 className="text-2xl font-heading font-bold text-foreground">Retraits MSN Coins</h1>
      </div>

      {/* ── COIN RATE CONFIG ── */}
      <div className="card-elevated border-primary/20 bg-primary/5">
        <h2 className="font-heading font-bold text-foreground flex items-center gap-2 mb-3">
          <Settings className="w-5 h-5 text-primary" /> Valeur du MSN Coin (taux admin)
        </h2>
        <p className="text-sm text-muted-foreground font-body mb-3">
          Taux actuel : <span className="font-bold text-primary">1 MSN Coin = {currentRate} USD</span>
        </p>
        <div className="flex items-end gap-3">
          <div className="flex-1">
            <label className="text-xs font-body text-muted-foreground block mb-1">1 MSN Coin = X USD</label>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground font-body">$</span>
              <input
                type="number"
                step="0.01"
                min="0.01"
                value={coinUsdRate}
                onChange={e => setCoinUsdRate(e.target.value)}
                className="w-32 px-3 py-2 rounded-lg border border-input bg-background text-foreground font-body text-sm"
                placeholder="Ex: 1"
              />
              <span className="text-sm text-muted-foreground font-body">USD par coin</span>
            </div>
            {coinUsdRate && Number(coinUsdRate) > 0 && (
              <p className="text-xs text-muted-foreground font-body mt-1">
                ≈ {Math.round(Number(coinUsdRate) * 620).toLocaleString("fr-FR")} FCFA par coin (taux indicatif 1$ = 620 FCFA)
              </p>
            )}
          </div>
          <button
            onClick={saveRate}
            disabled={savingRate}
            className="btn-gold !text-sm !py-2 !px-4 flex items-center gap-2"
          >
            <Save className="w-4 h-4" /> {savingRate ? "Sauvegarde..." : "Sauvegarder"}
          </button>
        </div>
      </div>

      {/* ── STATS ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="card-elevated text-center p-3">
          <p className="text-2xl font-heading font-bold text-gold">{stats.pending}</p>
          <p className="text-xs text-muted-foreground font-body">En attente</p>
        </div>
        <div className="card-elevated text-center p-3">
          <p className="text-2xl font-heading font-bold text-harvest-green">{stats.approved}</p>
          <p className="text-xs text-muted-foreground font-body">Validés</p>
        </div>
        <div className="card-elevated text-center p-3">
          <p className="text-2xl font-heading font-bold text-destructive">{stats.rejected}</p>
          <p className="text-xs text-muted-foreground font-body">Refusés</p>
        </div>
        <div className="card-elevated text-center p-3">
          <p className="text-2xl font-heading font-bold text-primary flex items-center justify-center gap-1">
            {stats.totalCoins} <Coins className="w-5 h-5 text-gold" />
          </p>
          <p className="text-xs text-muted-foreground font-body">Coins en attente</p>
        </div>
      </div>

      {/* ── FILTER ── */}
      <div className="flex gap-2 flex-wrap">
        <select
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value)}
          className="px-3 py-2 rounded-lg border border-input bg-background text-foreground font-body text-sm"
        >
          <option value="">Tous les statuts</option>
          <option value="pending">En attente</option>
          <option value="approved">Validés</option>
          <option value="rejected">Refusés</option>
        </select>
        <button onClick={loadAll} className="p-2 rounded-lg bg-secondary hover:bg-muted transition-colors">
          <RefreshCw className="w-4 h-4 text-muted-foreground" />
        </button>
        <span className="text-xs text-muted-foreground font-body self-center">{filtered.length} demande(s)</span>
      </div>

      {/* ── TABLE ── */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm font-body">
          <thead>
            <tr className="border-b border-border text-muted-foreground">
              <th className="text-left py-2 px-3">Date</th>
              <th className="text-left py-2 px-3">Membre</th>
              <th className="text-center py-2 px-3">Coins</th>
              <th className="text-right py-2 px-3">Montant</th>
              <th className="text-left py-2 px-3">Service</th>
              <th className="text-left py-2 px-3">Contact</th>
              <th className="text-center py-2 px-3">Statut</th>
              <th className="text-right py-2 px-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((w: any) => (
              <tr key={w.id} className="border-b border-border/50 hover:bg-secondary/20 transition-colors">
                <td className="py-2 px-3 whitespace-nowrap">
                  <span>{new Date(w.created_at).toLocaleDateString("fr-FR")}</span>
                  <span className="block text-[10px] text-muted-foreground">
                    {new Date(w.created_at).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                  </span>
                </td>
                <td className="py-2 px-3 font-medium whitespace-nowrap">{getUserName(w.user_id)}</td>
                <td className="py-2 px-3 text-center">
                  <span className="font-bold text-gold flex items-center justify-center gap-1">
                    {w.coins_amount} <Flame className="w-3 h-3" />
                  </span>
                  <span className="text-[10px] text-muted-foreground">{w.usd_rate}$ / coin</span>
                </td>
                <td className="py-2 px-3 text-right font-semibold text-primary whitespace-nowrap">
                  {Number(w.currency_amount).toLocaleString("fr-FR", { maximumFractionDigits: 2 })} {CURRENCIES[w.currency_code] || w.currency_code}
                </td>
                <td className="py-2 px-3 text-xs text-muted-foreground whitespace-nowrap">
                  {MSN_PAYMENT_SERVICES[w.payment_service] || w.payment_service}
                </td>
                <td className="py-2 px-3 text-xs font-mono max-w-[140px] truncate" title={w.payment_contact}>
                  {w.payment_contact}
                </td>
                <td className="py-2 px-3 text-center">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                    w.status === "approved" ? "bg-harvest-green/20 text-harvest-green" :
                    w.status === "rejected" ? "bg-destructive/20 text-destructive" :
                    "bg-gold/20 text-gold"
                  }`}>
                    {w.status === "approved" ? "✅ Validé" : w.status === "rejected" ? "❌ Refusé" : "⏳ Attente"}
                  </span>
                </td>
                <td className="py-2 px-3 text-right">
                  {w.status === "pending" && (
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => handleApprove(w)}
                        disabled={processingId === w.id}
                        className="p-1.5 rounded-md bg-harvest-green/10 hover:bg-harvest-green/20 transition-colors disabled:opacity-50"
                        title="Valider & payer"
                      >
                        <CheckCircle className="w-4 h-4 text-harvest-green" />
                      </button>
                      <button
                        onClick={() => handleReject(w)}
                        disabled={processingId === w.id}
                        className="p-1.5 rounded-md bg-destructive/10 hover:bg-destructive/20 transition-colors disabled:opacity-50"
                        title="Refuser & rembourser"
                      >
                        <Ban className="w-4 h-4 text-destructive" />
                      </button>
                    </div>
                  )}
                  {w.status !== "pending" && (
                    <span className="text-xs text-muted-foreground font-body">
                      {w.processed_at ? new Date(w.processed_at).toLocaleDateString("fr-FR") : "—"}
                    </span>
                  )}
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={8} className="py-12 text-center text-muted-foreground font-body">
                  Aucune demande de retrait
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminMSNWithdrawals;
