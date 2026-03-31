import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { UserCheck, UserX, Search } from "lucide-react";

const AdminProDirectory = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [search, setSearch] = useState("");

  useEffect(() => { loadUsers(); }, []);

  const loadUsers = async () => {
    const { data } = await supabase.from("profiles").select("*").order("created_at", { ascending: false });
    setUsers(data || []);
  };

  const toggleProVisibility = async (profileId: string, current: boolean) => {
    await supabase.from("profiles").update({ is_pro_visible: !current }).eq("id", profileId);
    toast.success(current ? "Retiré de l'annuaire Pros" : "Ajouté à l'annuaire Pros");
    loadUsers();
  };

  const filtered = users.filter(u =>
    `${u.first_name} ${u.last_name} ${u.email}`.toLowerCase().includes(search.toLowerCase())
  );

  const proCount = users.filter(u => u.is_pro_visible).length;

  return (
    <div>
      <h1 className="text-2xl font-heading font-bold text-foreground mb-2">Annuaire Moissonneurs Pros</h1>
      <p className="text-sm text-muted-foreground font-body mb-6">
        {proCount} moissonneur{proCount > 1 ? "s" : ""} visible{proCount > 1 ? "s" : ""} dans l'annuaire
      </p>

      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input placeholder="Rechercher un utilisateur..." value={search} onChange={e => setSearch(e.target.value)}
          className="w-full pl-9 pr-3 py-2 rounded-lg border border-input bg-background text-foreground font-body text-sm" />
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm font-body">
          <thead><tr className="border-b border-border text-muted-foreground">
            <th className="text-left py-2 px-3">Nom</th>
            <th className="text-left py-2 px-3">Email</th>
            <th className="text-left py-2 px-3">WhatsApp</th>
            <th className="text-left py-2 px-3">MLM</th>
            <th className="text-center py-2 px-3">Annuaire Pros</th>
            <th className="text-right py-2 px-3">Action</th>
          </tr></thead>
          <tbody>
            {filtered.map((u: any) => (
              <tr key={u.id} className="border-b border-border/50">
                <td className="py-2 px-3 font-medium">{u.first_name} {u.last_name}</td>
                <td className="py-2 px-3">{u.email}</td>
                <td className="py-2 px-3">{u.phone || "—"}</td>
                <td className="py-2 px-3">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${u.is_mlm_active ? "bg-harvest-green/20 text-harvest-green" : "bg-muted text-muted-foreground"}`}>
                    {u.is_mlm_active ? "Actif" : "Inactif"}
                  </span>
                </td>
                <td className="py-2 px-3 text-center">
                  {u.is_pro_visible ? (
                    <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-primary/20 text-primary">✓ Visible</span>
                  ) : (
                    <span className="text-xs text-muted-foreground">—</span>
                  )}
                </td>
                <td className="py-2 px-3 text-right">
                  <button onClick={() => toggleProVisibility(u.id, u.is_pro_visible)}
                    className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-body font-semibold transition-colors ${
                      u.is_pro_visible
                        ? "bg-destructive/10 text-destructive hover:bg-destructive/20"
                        : "bg-primary/10 text-primary hover:bg-primary/20"
                    }`}>
                    {u.is_pro_visible ? <><UserX className="w-3 h-3" /> Retirer</> : <><UserCheck className="w-3 h-3" /> Ajouter</>}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminProDirectory;
