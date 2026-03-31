import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Eye, Ban, CheckCircle } from "lucide-react";

const AdminUsers = () => {
  const { user } = useAuth();
  const [users, setUsers] = useState<any[]>([]);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [creditAmount, setCreditAmount] = useState("");
  const [creditMotif, setCreditMotif] = useState("");
  const [creditType, setCreditType] = useState<"admin_credit" | "admin_debit">("admin_credit");

  useEffect(() => { loadUsers(); }, []);

  const loadUsers = async () => {
    const { data } = await supabase.from("profiles").select("*").order("created_at", { ascending: false });
    setUsers(data || []);
  };

  const toggleSuspend = async (profileId: string, currentStatus: boolean) => {
    await supabase.from("profiles").update({ is_suspended: !currentStatus }).eq("id", profileId);
    toast.success(currentStatus ? "Compte réactivé" : "Compte suspendu");
    loadUsers();
  };

  const handleCreditDebit = async () => {
    if (!selectedUser || !creditAmount || !creditMotif) { toast.error("Remplissez tous les champs"); return; }
    const amount = Number(creditAmount);
    const newBalance = creditType === "admin_credit"
      ? Number(selectedUser.wallet_balance) + amount
      : Number(selectedUser.wallet_balance) - amount;

    await supabase.from("profiles").update({ wallet_balance: newBalance }).eq("user_id", selectedUser.user_id);
    await supabase.from("transactions").insert({
      user_id: selectedUser.user_id, amount, type: creditType, status: "approved",
      description: creditMotif, processed_at: new Date().toISOString(), processed_by: user!.id,
    });
    toast.success(creditType === "admin_credit" ? "Portefeuille crédité" : "Portefeuille débité");
    setCreditAmount(""); setCreditMotif("");
    loadUsers();
  };

  return (
    <div>
      <h1 className="text-2xl font-heading font-bold text-foreground mb-6">Gestion des utilisateurs</h1>
      <div className="overflow-x-auto">
        <table className="w-full text-sm font-body">
          <thead><tr className="border-b border-border text-muted-foreground">
            <th className="text-left py-2 px-3">Nom</th><th className="text-left py-2 px-3">Email</th>
            <th className="text-left py-2 px-3">Code</th><th className="text-right py-2 px-3">Solde</th>
            <th className="text-left py-2 px-3">Statut</th><th className="text-right py-2 px-3">Actions</th>
          </tr></thead>
          <tbody>
            {users.map((u: any) => (
              <tr key={u.id} className="border-b border-border/50">
                <td className="py-2 px-3 font-medium">{u.first_name} {u.last_name}</td>
                <td className="py-2 px-3">{u.email}</td>
                <td className="py-2 px-3 font-mono text-xs">{u.referral_code}</td>
                <td className="py-2 px-3 text-right font-semibold">{Number(u.wallet_balance).toLocaleString("fr-FR")} FCFA</td>
                <td className="py-2 px-3">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${u.is_suspended ? "bg-destructive/20 text-destructive" : "bg-harvest-green/20 text-harvest-green"}`}>
                    {u.is_suspended ? "Suspendu" : "Actif"}
                  </span>
                </td>
                <td className="py-2 px-3 text-right">
                  <div className="flex items-center justify-end gap-1">
                    <button onClick={() => setSelectedUser(selectedUser?.id === u.id ? null : u)} className="p-1.5 rounded-md hover:bg-secondary" title="Détails">
                      <Eye className="w-4 h-4 text-muted-foreground" />
                    </button>
                    <button onClick={() => toggleSuspend(u.id, u.is_suspended)} className="p-1.5 rounded-md hover:bg-secondary" title={u.is_suspended ? "Réactiver" : "Suspendre"}>
                      {u.is_suspended ? <CheckCircle className="w-4 h-4 text-harvest-green" /> : <Ban className="w-4 h-4 text-destructive" />}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selectedUser && (
        <div className="mt-6 card-elevated">
          <h3 className="font-heading font-semibold text-foreground mb-4">
            Détails — {selectedUser.first_name} {selectedUser.last_name}
          </h3>
          <div className="grid md:grid-cols-2 gap-3 text-sm font-body mb-6">
            <div><span className="text-muted-foreground">Email:</span> <span className="font-medium">{selectedUser.email}</span></div>
            <div><span className="text-muted-foreground">Téléphone:</span> <span className="font-medium">{selectedUser.phone || "—"}</span></div>
            <div><span className="text-muted-foreground">Pays:</span> <span className="font-medium">{selectedUser.country || "—"}</span></div>
            <div><span className="text-muted-foreground">Code:</span> <span className="font-mono font-medium">{selectedUser.referral_code}</span></div>
            <div><span className="text-muted-foreground">Carrière:</span> <span className="font-medium capitalize">{selectedUser.career_level?.replace(/_/g, " ")}</span></div>
            <div><span className="text-muted-foreground">MLM:</span> <span className="font-medium">{selectedUser.is_mlm_active ? "Actif" : "Inactif"}</span></div>
            <div><span className="text-muted-foreground">Solde:</span> <span className="font-bold text-primary">{Number(selectedUser.wallet_balance).toLocaleString("fr-FR")} FCFA</span></div>
            <div><span className="text-muted-foreground">Inscrit le:</span> <span className="font-medium">{new Date(selectedUser.created_at).toLocaleDateString("fr-FR")}</span></div>
          </div>
          <div className="border-t border-border pt-4">
            <h4 className="font-heading font-semibold text-foreground mb-3">Créditer / Débiter</h4>
            <div className="flex flex-wrap gap-3 items-end">
              <select value={creditType} onChange={e => setCreditType(e.target.value as any)}
                className="px-3 py-2 rounded-lg border border-input bg-background text-foreground font-body text-sm">
                <option value="admin_credit">Créditer</option>
                <option value="admin_debit">Débiter</option>
              </select>
              <input type="number" placeholder="Montant" value={creditAmount} onChange={e => setCreditAmount(e.target.value)}
                className="px-3 py-2 rounded-lg border border-input bg-background text-foreground font-body text-sm w-32" />
              <input type="text" placeholder="Motif" value={creditMotif} onChange={e => setCreditMotif(e.target.value)}
                className="px-3 py-2 rounded-lg border border-input bg-background text-foreground font-body text-sm flex-1 min-w-[150px]" />
              <button onClick={handleCreditDebit} className="btn-hero !text-sm !py-2 !px-4">Valider</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminUsers;
