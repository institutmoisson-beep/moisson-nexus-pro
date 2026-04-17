import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Globe, MapPin, Search, Plus, Trash2, History, RefreshCw, Eye, X, Ban, CheckCircle } from "lucide-react";

const AdminRegionalRoles = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [regionalRoles, setRegionalRoles] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"roles" | "logs">("roles");
  const [showAssignForm, setShowAssignForm] = useState(false);
  const [form, setForm] = useState({ user_id: "", role_type: "moissonneur_pays", scope_value: "" });
  const [saving, setSaving] = useState(false);
  const [selectedLog, setSelectedLog] = useState<any>(null);

  useEffect(() => { loadAll(); }, []);

  const loadAll = async () => {
    setLoading(true);
    const [usersRes, staffRes, logsRes] = await Promise.all([
      supabase.from("profiles").select("user_id, first_name, last_name, email, city, country").order("first_name"),
      supabase.from("staff_roles").select("*").in("role", ["moissonneur_pays", "moissonneur_ville"]),
      (supabase as any).from("regional_moderation_log").select("*").order("created_at", { ascending: false }).limit(100),
    ]);
    setUsers(usersRes.data || []);
    setRegionalRoles(staffRes.data || []);
    setLogs(logsRes.data || []);
    setLoading(false);
  };

  const getUserName = (userId: string) => {
    const u = users.find(p => p.user_id === userId);
    return u ? `${u.first_name} ${u.last_name}` : userId.slice(0, 8) + "...";
  };

  const getUserEmail = (userId: string) => {
    const u = users.find(p => p.user_id === userId);
    return u?.email || "—";
  };

  const handleAssign = async () => {
    if (!form.user_id || !form.scope_value) {
      toast.error("Utilisateur et pays/ville requis");
      return;
    }

    setSaving(true);

    // Remove existing role of same type for this user
    await supabase.from("staff_roles")
      .delete()
      .eq("user_id", form.user_id)
      .eq("role", form.role_type);

    // Insert new role with scope via metadata
    const { error } = await supabase.from("staff_roles").insert({
      user_id: form.user_id,
      role: form.role_type,
      ...(form.role_type === "moissonneur_pays"
        ? { assigned_country: form.scope_value } as any
        : { assigned_city: form.scope_value } as any
      ),
    });

    if (error) {
      toast.error("Erreur: " + error.message);
      setSaving(false);
      return;
    }

    toast.success(`Rôle ${form.role_type === "moissonneur_pays" ? "Moissonneur Pays" : "Moissonneur Ville"} assigné !`);
    setShowAssignForm(false);
    setForm({ user_id: "", role_type: "moissonneur_pays", scope_value: "" });
    setSaving(false);
    loadAll();
  };

  const handleRevoke = async (roleId: string, userName: string) => {
    if (!confirm(`Révoquer ce rôle régional pour ${userName} ?`)) return;
    await supabase.from("staff_roles").delete().eq("id", roleId);
    toast.success("Rôle révoqué");
    loadAll();
  };

  const filteredRoles = regionalRoles.filter(r => {
    if (!search) return true;
    const name = getUserName(r.user_id).toLowerCase();
    const email = getUserEmail(r.user_id).toLowerCase();
    const scope = (r.assigned_country || r.assigned_city || "").toLowerCase();
    return name.includes(search.toLowerCase()) || email.includes(search.toLowerCase()) || scope.includes(search.toLowerCase());
  });

  const pays = regionalRoles.filter(r => r.role === "moissonneur_pays");
  const villes = regionalRoles.filter(r => r.role === "moissonneur_ville");

  const filteredUsers = users.filter(u =>
    `${u.first_name} ${u.last_name} ${u.email}`.toLowerCase().includes(search.toLowerCase()) ||
    !search
  );

  if (loading) {
    return <div className="animate-pulse text-muted-foreground font-body">Chargement...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-2">
        <div>
          <h1 className="text-2xl font-heading font-bold text-foreground">🌍 Rôles Régionaux</h1>
          <p className="text-sm text-muted-foreground font-body mt-1">
            Gérez les Moissonneurs Pays ({pays.length}) et Moissonneurs Ville ({villes.length})
          </p>
        </div>
        <button
          onClick={() => setShowAssignForm(true)}
          className="btn-gold !text-sm !py-2 flex items-center gap-2"
        >
          <Plus className="w-4 h-4" /> Assigner un rôle
        </button>
      </div>

      {/* STATS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card-elevated p-4 text-center">
          <Globe className="w-6 h-6 text-primary mx-auto mb-1" />
          <p className="text-2xl font-heading font-bold text-foreground">{pays.length}</p>
          <p className="text-xs text-muted-foreground font-body">Moissonneurs Pays</p>
        </div>
        <div className="card-elevated p-4 text-center">
          <MapPin className="w-6 h-6 text-gold mx-auto mb-1" />
          <p className="text-2xl font-heading font-bold text-foreground">{villes.length}</p>
          <p className="text-xs text-muted-foreground font-body">Moissonneurs Ville</p>
        </div>
        <div className="card-elevated p-4 text-center">
          <History className="w-6 h-6 text-harvest-green mx-auto mb-1" />
          <p className="text-2xl font-heading font-bold text-foreground">{logs.length}</p>
          <p className="text-xs text-muted-foreground font-body">Actions enregistrées</p>
        </div>
        <div className="card-elevated p-4 text-center">
          <Ban className="w-6 h-6 text-destructive mx-auto mb-1" />
          <p className="text-2xl font-heading font-bold text-foreground">
            {logs.filter(l => l.action === "suspend").length}
          </p>
          <p className="text-xs text-muted-foreground font-body">Suspensions totales</p>
        </div>
      </div>

      {/* TABS */}
      <div className="flex gap-1 bg-secondary p-1 rounded-xl w-fit">
        <button
          onClick={() => setActiveTab("roles")}
          className={`px-5 py-2 rounded-lg text-sm font-body font-semibold transition-all ${activeTab === "roles" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"}`}
        >
          Rôles assignés ({regionalRoles.length})
        </button>
        <button
          onClick={() => setActiveTab("logs")}
          className={`px-5 py-2 rounded-lg text-sm font-body font-semibold transition-all ${activeTab === "logs" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"}`}
        >
          Journal des actions ({logs.length})
        </button>
      </div>

      {/* SEARCH */}
      <div className="flex gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            placeholder={activeTab === "roles" ? "Rechercher un modérateur..." : "Rechercher dans les logs..."}
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-lg border border-input bg-background text-foreground font-body text-sm"
          />
        </div>
        <button onClick={loadAll} className="p-2 rounded-lg bg-secondary hover:bg-muted transition-colors">
          <RefreshCw className="w-4 h-4 text-muted-foreground" />
        </button>
      </div>

      {/* ASSIGN FORM MODAL */}
      {showAssignForm && (
        <div className="fixed inset-0 bg-foreground/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
          onClick={() => setShowAssignForm(false)}>
          <div className="bg-card rounded-2xl border border-border p-6 w-full max-w-md shadow-2xl"
            onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-heading font-bold text-foreground text-lg flex items-center gap-2">
                <Plus className="w-5 h-5 text-primary" /> Assigner un rôle régional
              </h3>
              <button onClick={() => setShowAssignForm(false)} className="p-1.5 rounded-lg hover:bg-secondary">
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block font-body">Type de rôle *</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, role_type: "moissonneur_pays", scope_value: "" })}
                    className={`p-3 rounded-xl border-2 text-sm font-body font-semibold transition-all flex items-center gap-2 justify-center ${
                      form.role_type === "moissonneur_pays" ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground"
                    }`}
                  >
                    <Globe className="w-4 h-4" /> Moissonneur Pays
                  </button>
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, role_type: "moissonneur_ville", scope_value: "" })}
                    className={`p-3 rounded-xl border-2 text-sm font-body font-semibold transition-all flex items-center gap-2 justify-center ${
                      form.role_type === "moissonneur_ville" ? "border-gold bg-gold/10 text-gold" : "border-border text-muted-foreground"
                    }`}
                  >
                    <MapPin className="w-4 h-4" /> Moissonneur Ville
                  </button>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block font-body">Membre *</label>
                <select
                  value={form.user_id}
                  onChange={e => setForm({ ...form, user_id: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-lg border border-input bg-background text-foreground font-body text-sm"
                >
                  <option value="">-- Choisir un membre --</option>
                  {users.map(u => (
                    <option key={u.user_id} value={u.user_id}>
                      {u.first_name} {u.last_name} — {u.email}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block font-body">
                  {form.role_type === "moissonneur_pays" ? "Pays assigné *" : "Ville assignée *"}
                </label>
                <input
                  placeholder={form.role_type === "moissonneur_pays" ? "Ex: Côte d'Ivoire" : "Ex: Abidjan"}
                  value={form.scope_value}
                  onChange={e => setForm({ ...form, scope_value: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-lg border border-input bg-background text-foreground font-body text-sm"
                />
                <p className="text-xs text-muted-foreground font-body mt-1">
                  {form.role_type === "moissonneur_pays"
                    ? "Doit correspondre exactement au champ pays des profils"
                    : "Doit correspondre au champ ville des profils (insensible à la casse)"
                  }
                </p>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={handleAssign}
                  disabled={saving}
                  className="flex-1 btn-gold !text-sm !py-2.5 disabled:opacity-50"
                >
                  {saving ? "Assignation..." : "Assigner le rôle"}
                </button>
                <button
                  onClick={() => setShowAssignForm(false)}
                  className="px-4 py-2.5 rounded-lg border border-input text-muted-foreground font-body text-sm hover:bg-secondary"
                >
                  Annuler
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ROLES TABLE */}
      {activeTab === "roles" && (
        <div className="overflow-x-auto">
          <table className="w-full text-sm font-body">
            <thead>
              <tr className="border-b border-border text-muted-foreground">
                <th className="text-left py-2 px-3">Modérateur</th>
                <th className="text-left py-2 px-3">Email</th>
                <th className="text-left py-2 px-3">Rôle</th>
                <th className="text-left py-2 px-3">Portée assignée</th>
                <th className="text-left py-2 px-3">Depuis</th>
                <th className="text-right py-2 px-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredRoles.map(role => (
                <tr key={role.id} className="border-b border-border/50 hover:bg-secondary/20">
                  <td className="py-2.5 px-3 font-semibold">{getUserName(role.user_id)}</td>
                  <td className="py-2.5 px-3 text-muted-foreground text-xs">{getUserEmail(role.user_id)}</td>
                  <td className="py-2.5 px-3">
                    <span className={`text-xs px-2.5 py-1 rounded-full font-semibold flex items-center gap-1 w-fit ${
                      role.role === "moissonneur_pays" ? "bg-primary/20 text-primary" : "bg-gold/20 text-gold"
                    }`}>
                      {role.role === "moissonneur_pays"
                        ? <><Globe className="w-3 h-3" /> Moissonneur Pays</>
                        : <><MapPin className="w-3 h-3" /> Moissonneur Ville</>
                      }
                    </span>
                  </td>
                  <td className="py-2.5 px-3">
                    <span className="font-semibold text-foreground">
                      {role.assigned_country || role.assigned_city || "—"}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-muted-foreground text-xs">
                    {new Date(role.created_at).toLocaleDateString("fr-FR")}
                  </td>
                  <td className="py-2.5 px-3 text-right">
                    <button
                      onClick={() => handleRevoke(role.id, getUserName(role.user_id))}
                      className="p-1.5 rounded-md hover:bg-secondary transition-colors"
                      title="Révoquer"
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </button>
                  </td>
                </tr>
              ))}
              {filteredRoles.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-muted-foreground font-body">
                    Aucun rôle régional assigné
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* LOGS TABLE */}
      {activeTab === "logs" && (
        <div className="overflow-x-auto">
          <table className="w-full text-sm font-body">
            <thead>
              <tr className="border-b border-border text-muted-foreground">
                <th className="text-left py-2 px-3">Date</th>
                <th className="text-left py-2 px-3">Modérateur</th>
                <th className="text-left py-2 px-3">Action</th>
                <th className="text-left py-2 px-3">Cible</th>
                <th className="text-left py-2 px-3">Portée</th>
                <th className="text-left py-2 px-3">Motif</th>
              </tr>
            </thead>
            <tbody>
              {logs
                .filter(l => !search || getUserName(l.moderator_id).toLowerCase().includes(search.toLowerCase()) || (l.motif || "").toLowerCase().includes(search.toLowerCase()))
                .map(log => (
                  <tr key={log.id} className="border-b border-border/50 hover:bg-secondary/20">
                    <td className="py-2.5 px-3 text-xs whitespace-nowrap">
                      {new Date(log.created_at).toLocaleDateString("fr-FR")}
                      <span className="block text-[10px] text-muted-foreground">
                        {new Date(log.created_at).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-semibold">{getUserName(log.moderator_id)}</td>
                    <td className="py-2.5 px-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-semibold flex items-center gap-1 w-fit ${
                        log.action === "suspend" ? "bg-destructive/20 text-destructive" : "bg-harvest-green/20 text-harvest-green"
                      }`}>
                        {log.action === "suspend"
                          ? <><Ban className="w-3 h-3" /> Suspension</>
                          : <><CheckCircle className="w-3 h-3" /> Réactivation</>
                        }
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-muted-foreground text-xs">{getUserName(log.target_user_id)}</td>
                    <td className="py-2.5 px-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${log.scope === "country" ? "bg-primary/20 text-primary" : "bg-gold/20 text-gold"}`}>
                        {log.scope === "country" ? "🌍" : "📍"} {log.scope_value}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-muted-foreground text-xs max-w-[200px] truncate">{log.motif || "—"}</td>
                  </tr>
                ))}
              {logs.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-muted-foreground font-body">
                    Aucune action enregistrée
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AdminRegionalRoles;
