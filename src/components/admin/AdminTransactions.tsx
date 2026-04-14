import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { CheckCircle, Ban } from "lucide-react";

const AdminTransactions = () => {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);

  useEffect(() => { loadData(); }, []);
import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { CheckCircle, Ban, RefreshCw } from "lucide-react";

const TYPE_LABELS: Record<string, string> = {
  deposit: "Dépôt",
  withdrawal: "Retrait",
  pack_purchase: "Achat pack/produit",
  commission: "Commission parrainage",
  bonus: "Bonus",
  admin_credit: "Crédit admin",
  admin_debit: "Débit admin",
  transfer: "Transfert",
  product_purchase: "Achat produit",
};

const AdminTransactions = () => {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [filterType, setFilterType] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    const [txRes, usersRes] = await Promise.all([
      supabase.from("transactions").select("*").order("created_at", { ascending: false }).limit(200),
      supabase.from("profiles").select("user_id, first_name, last_name, wallet_balance"),
    ]);
    setTransactions(txRes.data || []);
    setUsers(usersRes.data || []);
    setLoading(false);
  };

  const getUserName = (userId: string) => {
    const u = users.find(p => p.user_id === userId);
    return u ? `${u.first_name} ${u.last_name}` : userId.slice(0, 8) + "...";
  };

  const handleTransaction = async (txId: string, action: "approved" | "rejected") => {
    const tx = transactions.find(t => t.id === txId);
    if (!tx) return;

    const { error: updateError } = await supabase.from("transactions").update({
      status: action,
      processed_at: new Date().toISOString(),
      processed_by: user!.id,
    }).eq("id", txId);

    if (updateError) { toast.error("Erreur: " + updateError.message); return; }

    if (action === "approved") {
      const profile = users.find(u => u.user_id === tx.user_id);
      if (profile) {
        let newBalance = Number(profile.wallet_balance);
        if (tx.type === "deposit") {
          newBalance += Number(tx.amount);
        } else if (tx.type === "withdrawal") {
          newBalance -= Number(tx.amount);
          if (newBalance < 0) {
            toast.error("Solde insuffisant pour ce retrait !");
            return;
          }
        }
        await supabase.from("profiles").update({ wallet_balance: newBalance }).eq("user_id", tx.user_id);
      }
    }

    toast.success(action === "approved" ? "✅ Transaction approuvée" : "❌ Transaction rejetée");
    loadData();
  };

  const filtered = transactions.filter(tx => {
    const matchType = !filterType || tx.type === filterType;
    const matchStatus = !filterStatus || tx.status === filterStatus;
    return matchType && matchStatus;
  });

  const statusStyle = (s: string) => {
    if (s === "approved") return "bg-harvest-green/20 text-harvest-green";
    if (s === "rejected") return "bg-destructive/20 text-destructive";
    return "bg-gold/20 text-gold";
  };

  const statusLabel = (s: string) => {
    if (s === "approved") return "Approuvé";
    if (s === "rejected") return "Rejeté";
    return "En attente";
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-heading font-bold text-foreground">Toutes les transactions</h1>
        <button onClick={loadData} className="p-2 rounded-lg bg-secondary text-foreground hover:bg-muted transition-colors" title="Actualiser">
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {/* Filtres */}
      <div className="flex flex-wrap gap-3 mb-4">
        <select value={filterType} onChange={e => setFilterType(e.target.value)}
          className="px-3 py-2 rounded-lg border border-input bg-background text-foreground font-body text-sm">
          <option value="">Tous les types</option>
          {Object.entries(TYPE_LABELS).map(([key, label]) => (
            <option key={key} value={key}>{label}</option>
          ))}
        </select>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
          className="px-3 py-2 rounded-lg border border-input bg-background text-foreground font-body text-sm">
          <option value="">Tous les statuts</option>
          <option value="pending">En attente</option>
          <option value="approved">Approuvé</option>
          <option value="rejected">Rejeté</option>
        </select>
        <span className="text-xs text-muted-foreground font-body self-center">{filtered.length} transaction(s)</span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm font-body">
          <thead>
            <tr className="border-b border-border text-muted-foreground">
              <th className="text-left py-2 px-3">Date</th>
              <th className="text-left py-2 px-3">Utilisateur</th>
              <th className="text-left py-2 px-3">Type</th>
              <th className="text-right py-2 px-3">Montant</th>
              <th className="text-left py-2 px-3">Contact</th>
              <th className="text-left py-2 px-3">Description</th>
              <th className="text-left py-2 px-3">Statut</th>
              <th className="text-right py-2 px-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((tx: any) => (
              <tr key={tx.id} className="border-b border-border/50 hover:bg-secondary/30 transition-colors">
                <td className="py-2 px-3 whitespace-nowrap">
                  {new Date(tx.created_at).toLocaleDateString("fr-FR")}
                  <span className="block text-[10px] text-muted-foreground">
                    {new Date(tx.created_at).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                  </span>
                </td>
                <td className="py-2 px-3 font-medium whitespace-nowrap">{getUserName(tx.user_id)}</td>
                <td className="py-2 px-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                    tx.type === "commission" ? "bg-gold/20 text-gold" :
                    tx.type === "admin_credit" ? "bg-harvest-green/20 text-harvest-green" :
                    tx.type === "admin_debit" ? "bg-destructive/20 text-destructive" :
                    tx.type === "deposit" ? "bg-primary/20 text-primary" :
                    "bg-muted text-muted-foreground"
                  }`}>
                    {TYPE_LABELS[tx.type] || tx.type}
                  </span>
                </td>
                <td className="py-2 px-3 text-right font-semibold whitespace-nowrap">
                  {Number(tx.amount).toLocaleString("fr-FR")} FCFA
                </td>
                <td className="py-2 px-3 text-xs text-muted-foreground">
                  {tx.transaction_contact || "—"}
                </td>
                <td className="py-2 px-3 text-xs text-muted-foreground max-w-[200px] truncate">
                  {tx.description || "—"}
                </td>
                <td className="py-2 px-3">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${statusStyle(tx.status)}`}>
                    {statusLabel(tx.status)}
                  </span>
                </td>
                <td className="py-2 px-3 text-right">
                  {tx.status === "pending" && (tx.type === "deposit" || tx.type === "withdrawal") && (
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => handleTransaction(tx.id, "approved")}
                        className="p-1.5 rounded-md bg-harvest-green/10 hover:bg-harvest-green/20 transition-colors" title="Approuver">
                        <CheckCircle className="w-4 h-4 text-harvest-green" />
                      </button>
                      <button onClick={() => handleTransaction(tx.id, "rejected")}
                        className="p-1.5 rounded-md bg-destructive/10 hover:bg-destructive/20 transition-colors" title="Rejeter">
                        <Ban className="w-4 h-4 text-destructive" />
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={8} className="py-12 text-center text-muted-foreground font-body">
                  {loading ? "Chargement..." : "Aucune transaction trouvée"}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminTransactions;

  const loadData = async () => {
    const [txRes, usersRes] = await Promise.all([
      supabase.from("transactions").select("*").order("created_at", { ascending: false }).limit(100),
      supabase.from("profiles").select("user_id, first_name, last_name, wallet_balance"),
    ]);
    setTransactions(txRes.data || []);
    setUsers(usersRes.data || []);
  };

  const getUserName = (userId: string) => {
    const u = users.find(p => p.user_id === userId);
    return u ? `${u.first_name} ${u.last_name}` : userId.slice(0, 8);
  };

  const handleTransaction = async (txId: string, action: "approved" | "rejected") => {
    const tx = transactions.find(t => t.id === txId);
    if (!tx) return;

    await supabase.from("transactions").update({
      status: action, processed_at: new Date().toISOString(), processed_by: user!.id,
    }).eq("id", txId);

    if (action === "approved") {
      const profile = users.find(u => u.user_id === tx.user_id);
      if (profile) {
        const newBalance = tx.type === "deposit"
          ? Number(profile.wallet_balance) + Number(tx.amount)
          : tx.type === "withdrawal"
            ? Number(profile.wallet_balance) - Number(tx.amount)
            : Number(profile.wallet_balance);
        await supabase.from("profiles").update({ wallet_balance: newBalance }).eq("user_id", tx.user_id);
      }
    }
    toast.success(action === "approved" ? "Transaction approuvée" : "Transaction rejetée");
    loadData();
  };

  return (
    <div>
      <h1 className="text-2xl font-heading font-bold text-foreground mb-6">Transactions</h1>
      <div className="overflow-x-auto">
        <table className="w-full text-sm font-body">
          <thead><tr className="border-b border-border text-muted-foreground">
            <th className="text-left py-2 px-3">Date</th><th className="text-left py-2 px-3">Utilisateur</th>
            <th className="text-left py-2 px-3">Type</th><th className="text-right py-2 px-3">Montant</th>
            <th className="text-left py-2 px-3">Contact</th><th className="text-left py-2 px-3">Statut</th>
            <th className="text-right py-2 px-3">Actions</th>
          </tr></thead>
          <tbody>
            {transactions.map((tx: any) => (
              <tr key={tx.id} className="border-b border-border/50">
                <td className="py-2 px-3">{new Date(tx.created_at).toLocaleDateString("fr-FR")}</td>
                <td className="py-2 px-3">{getUserName(tx.user_id)}</td>
                <td className="py-2 px-3 capitalize">{tx.type.replace(/_/g, " ")}</td>
                <td className="py-2 px-3 text-right font-semibold">{Number(tx.amount).toLocaleString("fr-FR")} FCFA</td>
                <td className="py-2 px-3 text-xs">{tx.transaction_contact || "—"}</td>
                <td className="py-2 px-3">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                    tx.status === "approved" ? "bg-harvest-green/20 text-harvest-green" :
                    tx.status === "rejected" ? "bg-destructive/20 text-destructive" : "bg-accent/20 text-accent-foreground"
                  }`}>{tx.status}</span>
                </td>
                <td className="py-2 px-3 text-right">
                  {tx.status === "pending" && (
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => handleTransaction(tx.id, "approved")} className="p-1.5 rounded-md bg-harvest-green/10 hover:bg-harvest-green/20" title="Approuver">
                        <CheckCircle className="w-4 h-4 text-harvest-green" />
                      </button>
                      <button onClick={() => handleTransaction(tx.id, "rejected")} className="p-1.5 rounded-md bg-destructive/10 hover:bg-destructive/20" title="Rejeter">
                        <Ban className="w-4 h-4 text-destructive" />
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
            {transactions.length === 0 && <tr><td colSpan={7} className="py-8 text-center text-muted-foreground">Aucune transaction</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminTransactions;
