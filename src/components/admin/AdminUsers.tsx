import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Eye, Ban, CheckCircle, UserCog, UserCheck, PlusCircle, MinusCircle } from "lucide-react";

const STAFF_ROLES = [
  { key: "financier", label: "Financier" },
  { key: "gestion_packs", label: "Gestion de Packs" },
  { key: "gestion_stand", label: "Gestion de Stand" },
  { key: "informaticien", label: "Informaticien" },
  { key: "commercial", label: "Commercial" },
  { key: "communication", label: "Communication" },
];

const AdminUsers = () => {
  const { user } = useAuth();
  const [users, setUsers] = useState<any[]>([]);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [creditAmount, setCreditAmount] = useState("");
  const [creditMotif, setCreditMotif] = useState("");
  const [creditType, setCreditType] = useState<"admin_credit" | "admin_debit">("admin_credit");
  const [staffRoles, setStaffRoles] = useState<any[]>([]);
  const [showRoleModal, setShowRoleModal] = useState<any>(null);
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [submittingCredit, setSubmittingCredit] = useState(false);

  useEffect(() => { loadUsers(); }, []);

  const loadUsers = async () => {
    const [usersRes, rolesRes] = await Promise.all([
      supabase.from("profiles").select("*").order("created_at", { ascending: false }),
      supabase.from("staff_roles").select("*"),
    ]);
    setUsers(usersRes.data || []);
    setStaffRoles(rolesRes.data || []);
  };

  const getUserStaffRoles = (userId: string) => staffRoles.filter(r => r.user_id === userId);

  const toggleSuspend = async (profileId: string, currentStatus: boolean) => {
    await supabase.from("profiles").update({ is_suspended: !currentStatus }).eq("id", profileId);
    toast.success(currentStatus ? "Compte réactivé" : "Compte suspendu"); loadUsers();
  };

  const toggleProVisible = async (profileId: string, current: boolean) => {
    await supabase.from("profiles").update({ is_pro_visible: !current }).eq("id", profileId);
    toast.success(!current ? "Ajouté à l'annuaire Pros" : "Retiré de l'annuaire Pros"); loadUsers();
  };

  const handleCreditDebit = async () => {
    if (!selectedUser || !creditAmount || !creditMotif) {
      toast.error("Remplissez tous les champs (montant et motif obligatoires)");
      return;
    }
    const amount = Number(creditAmount);
    if (amount <= 0) { toast.error("Le montant doit être supérieur à 0"); return; }

    setSubmittingCredit(true);

    // Calculer le nouveau solde
    const currentBalance = Number(selectedUser.wallet_balance);
    const newBalance = creditType === "admin_credit"
      ? currentBalance + amount
      : currentBalance - amount;

    if (creditType === "admin_debit" && newBalance < 0) {
      toast.error("Solde insuffisant pour ce débit");
      setSubmittingCredit(false);
      return;
    }

    // 1. Mettre à jour le portefeuille
    const { error: profileError } = await supabase
      .from("profiles")
      .update({ wallet_balance: newBalance })
      .eq("user_id", selectedUser.user_id);

    if (profileError) {
      toast.error("Erreur lors de la mise à jour du portefeuille: " + profileError.message);
      setSubmittingCredit(false);
      return;
    }

    // 2. Enregistrer la transaction (visible dans l'historique)
    const { error: txError } = await supabase.from("transactions").insert({
      user_id: selectedUser.user_id,
      amount,
      type: creditType,
      status: "approved" as const,
      description: creditMotif,
      processed_at: new Date().toISOString(),
      processed_by: user!.id,
      metadata: {
        admin_id: user!.id,
        previous_balance: currentBalance,
        new_balance: newBalance,
      },
    });

    if (txError) {
      toast.error("Erreur lors de l'enregistrement de la transaction: " + txError.message);
      setSubmittingCredit(false);
      return;
    }

    const label = creditType === "admin_credit" ? "crédité" : "débité";
    toast.success(`Portefeuille ${label} de ${amount.toLocaleString("fr-FR")} FCFA avec succès !`);
    setCreditAmount("");
    setCreditMotif("");

    // Rafraîchir les données et mettre à jour l'utilisateur sélectionné
    await loadUsers();
    // Mettre à jour l'utilisateur sélectionné avec le nouveau solde
    setSelectedUser((prev: any) => prev ? { ...prev, wallet_balance: newBalance } : null);
    setSubmittingCredit(false);
  };

  const openRoleModal = (u: any) => {
    setShowRoleModal(u);
    setSelectedRoles(getUserStaffRoles(u.user_id).map(r => r.role));
  };

  const saveRoles = async () => {
    if (!showRoleModal) return;
    const userId = showRoleModal.user_id;
    await supabase.from("staff_roles").delete().eq("user_id", userId);
    if (selectedRoles.length > 0) {
      await supabase.from("staff_roles").insert(selectedRoles.map(role => ({ user_id: userId, role })));
    }
    toast.success("Rôles mis à jour !");
    setShowRoleModal(null);
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
            <th className="text-left py-2 px-3">Rôles</th><th className="text-left py-2 px-3">Statut</th>
            <th className="text-right py-2 px-3">Actions</th>
          </tr></thead>
          <tbody>
            {users.map((u: any) => (
              <tr key={u.id} className="border-b border-border/50">
                <td className="py-2 px-3 font-medium">{u.first_name} {u.last_name}</td>
                <td className="py-2 px-3">{u.email}</td>
                <td className="py-2 px-3 font-mono text-xs">{u.referral_code}</td>
                <td className="py-2 px-3 text-right font-semibold">{Number(u.wallet_balance).toLocaleString("fr-FR")} FCFA</td>
                <td className="py-2 px-3">
                  <div className="flex flex-wrap gap-1">
                    {getUserStaffRoles(u.user_id).map(r => (
                      <span key={r.id} className="px-1.5 py-0.5 rounded text-[10px] bg-primary/10 text-primary font-semibold">{r.role.replace(/_/g, " ")}</span>
                    ))}
                  </div>
                </td>
                <td className="py-2 px-3">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${u.is_suspended ? "bg-destructive/20 text-destructive" : "bg-harvest-green/20 text-harvest-green"}`}>
                    {u.is_suspended ? "Suspendu" : "Actif"}
                  </span>
                </td>
                <td className="py-2 px-3 text-right">
                  <div className="flex items-center justify-end gap-1">
                    <button onClick={() => setSelectedUser(selectedUser?.id === u.id ? null : u)} className="p-1.5 rounded-md hover:bg-secondary" title="Détails / Créditer">
                      <Eye className="w-4 h-4 text-muted-foreground" />
                    </button>
                    <button onClick={() => openRoleModal(u)} className="p-1.5 rounded-md hover:bg-secondary" title="Rôles staff">
                      <UserCog className="w-4 h-4 text-primary" />
                    </button>
                    <button onClick={() => toggleProVisible(u.id, u.is_pro_visible)} className="p-1.5 rounded-md hover:bg-secondary" title={u.is_pro_visible ? "Retirer de l'annuaire" : "Ajouter à l'annuaire"}>
                      <UserCheck className={`w-4 h-4 ${u.is_pro_visible ? "text-harvest-green" : "text-muted-foreground"}`} />
                    </button>
                    <button onClick={() => toggleSuspend(u.id, u.is_suspended)} className="p-1.5 rounded-md hover:bg-secondary">
                      {u.is_suspended ? <CheckCircle className="w-4 h-4 text-harvest-green" /> : <Ban className="w-4 h-4 text-destructive" />}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Panneau détails + Crédit/Débit */}
      {selectedUser && (
        <div className="mt-6 card-elevated">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-heading font-semibold text-foreground">
              Détails — {selectedUser.first_name} {selectedUser.last_name}
            </h3>
            <button onClick={() => setSelectedUser(null)} className="text-muted-foreground hover:text-foreground text-xs">✕ Fermer</button>
          </div>

          <div className="grid md:grid-cols-2 gap-3 text-sm font-body mb-6">
            <div><span className="text-muted-foreground">Email:</span> <span className="font-medium">{selectedUser.email}</span></div>
            <div><span className="text-muted-foreground">Téléphone:</span> <span className="font-medium">{selectedUser.phone || "—"}</span></div>
            <div><span className="text-muted-foreground">Pays:</span> <span className="font-medium">{selectedUser.country || "—"}</span></div>
            <div><span className="text-muted-foreground">Code:</span> <span className="font-mono font-medium">{selectedUser.referral_code}</span></div>
            <div><span className="text-muted-foreground">Carrière:</span> <span className="font-medium capitalize">{selectedUser.career_level?.replace(/_/g, " ")}</span></div>
            <div><span className="text-muted-foreground">MLM:</span> <span className="font-medium">{selectedUser.is_mlm_active ? "✅ Actif" : "❌ Inactif"}</span></div>
            <div className="md:col-span-2 bg-secondary rounded-lg p-3">
              <span className="text-muted-foreground">Solde actuel:</span>
              <span className="font-bold text-primary text-xl ml-2">{Number(selectedUser.wallet_balance).toLocaleString("fr-FR")} FCFA</span>
            </div>
          </div>

          {/* Section Crédit / Débit */}
          <div className="border-t border-border pt-4">
            <h4 className="font-heading font-semibold text-foreground mb-3 flex items-center gap-2">
              <PlusCircle className="w-4 h-4 text-harvest-green" />
              Créditer / Débiter le portefeuille
            </h4>
            <p className="text-xs text-muted-foreground font-body mb-3">
              Cette opération sera enregistrée dans l'historique des transactions de l'utilisateur.
            </p>
            <div className="grid md:grid-cols-4 gap-3 items-end">
              <div>
                <label className="text-xs text-muted-foreground font-body block mb-1">Type d'opération</label>
                <select value={creditType} onChange={e => setCreditType(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-lg border border-input bg-background text-foreground font-body text-sm">
                  <option value="admin_credit">✅ Créditer (ajouter)</option>
                  <option value="admin_debit">❌ Débiter (retirer)</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-muted-foreground font-body block mb-1">Montant (FCFA)</label>
                <input type="number" placeholder="Ex: 50000" value={creditAmount} onChange={e => setCreditAmount(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-input bg-background text-foreground font-body text-sm" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground font-body block mb-1">Motif (obligatoire)</label>
                <input type="text" placeholder="Ex: Bonus performance, Correction erreur..." value={creditMotif} onChange={e => setCreditMotif(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-input bg-background text-foreground font-body text-sm" />
              </div>
              <button onClick={handleCreditDebit} disabled={submittingCredit}
                className={`py-2 px-4 rounded-lg text-sm font-semibold font-body transition-colors disabled:opacity-50 ${
                  creditType === "admin_credit"
                    ? "bg-harvest-green text-white hover:opacity-90"
                    : "bg-destructive text-destructive-foreground hover:opacity-90"
                }`}>
                {submittingCredit ? "En cours..." : creditType === "admin_credit" ? "💰 Créditer" : "💸 Débiter"}
              </button>
            </div>

            {/* Prévisualisation du nouveau solde */}
            {creditAmount && Number(creditAmount) > 0 && (
              <div className="mt-3 p-3 bg-secondary rounded-lg text-sm font-body">
                <span className="text-muted-foreground">Solde après opération: </span>
                <span className={`font-bold ${
                  creditType === "admin_credit" ? "text-harvest-green" : "text-destructive"
                }`}>
                  {(
                    creditType === "admin_credit"
                      ? Number(selectedUser.wallet_balance) + Number(creditAmount)
                      : Number(selectedUser.wallet_balance) - Number(creditAmount)
                  ).toLocaleString("fr-FR")} FCFA
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal Rôles Staff */}
      {showRoleModal && (
        <div className="fixed inset-0 bg-foreground/50 flex items-center justify-center z-50 p-4" onClick={() => setShowRoleModal(null)}>
          <div className="bg-card rounded-xl border border-border p-6 w-full max-w-sm" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-heading font-bold text-foreground mb-4">
              Rôles staff — {showRoleModal.first_name} {showRoleModal.last_name}
            </h3>
            <div className="space-y-2 mb-4">
              {STAFF_ROLES.map(r => (
                <label key={r.key} className="flex items-center gap-3 p-2 rounded-lg hover:bg-secondary transition-colors cursor-pointer">
                  <input type="checkbox" checked={selectedRoles.includes(r.key)}
                    onChange={e => {
                      if (e.target.checked) setSelectedRoles([...selectedRoles, r.key]);
                      else setSelectedRoles(selectedRoles.filter(x => x !== r.key));
                    }} />
                  <span className="text-sm font-body text-foreground">{r.label}</span>
                </label>
              ))}
            </div>
            <div className="flex gap-3">
              <button onClick={saveRoles} className="flex-1 btn-gold !text-sm !py-2.5">Enregistrer</button>
              <button onClick={() => setShowRoleModal(null)} className="px-4 py-2.5 rounded-lg border border-input text-muted-foreground font-body text-sm">Annuler</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminUsers;
