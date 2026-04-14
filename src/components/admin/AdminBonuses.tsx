import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Pencil, Trash2, Plus } from "lucide-react";

const CAREER_LEVELS = [
  "semeur", "cultivateur", "moissonneur", "guide_de_champ",
  "maitre_moissonneur", "grand_moissonneur", "ambassadeur_moisson",
  "stratege_moisson", "elite_moisson", "guide_moissonneur",
];

const AdminBonuses = () => {
  const [bonuses, setBonuses] = useState<any[]>([]);
  const [form, setForm] = useState({ career_level: "", bonus_amount: "", monthly_bonus: "", requirements: "" });
  const [editId, setEditId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    const { data } = await supabase.from("career_bonuses").select("*").order("created_at");
    setBonuses(data || []);
  };

  const handleSave = async () => {
    if (!form.career_level || !form.bonus_amount) { toast.error("Profil et montant requis"); return; }
    const payload = {
      career_level: form.career_level as any,
      bonus_amount: Number(form.bonus_amount),
      monthly_bonus: Number(form.monthly_bonus) || 0,
      requirements: form.requirements || null,
    };

    if (editId) {
      const { error } = await supabase.from("career_bonuses").update(payload).eq("id", editId);
      if (error) { toast.error("Erreur: " + error.message); return; }
      toast.success("Bonus modifié !");
    } else {
      const { error } = await supabase.from("career_bonuses").insert(payload);
      if (error) { toast.error("Erreur: " + error.message); return; }
      toast.success("Bonus ajouté !");
    }
    resetForm();
    loadData();
  };

  const handleEdit = (b: any) => {
    setForm({ career_level: b.career_level, bonus_amount: String(b.bonus_amount), monthly_bonus: String(b.monthly_bonus), requirements: b.requirements || "" });
    setEditId(b.id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Supprimer ce bonus ?")) return;
    await supabase.from("career_bonuses").delete().eq("id", id);
    toast.success("Bonus supprimé");
    loadData();
  };

  const resetForm = () => {
    setForm({ career_level: "", bonus_amount: "", monthly_bonus: "", requirements: "" });
    setEditId(null);
    setShowForm(false);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-heading font-bold text-foreground">Bonus de carrière</h1>
        <button onClick={() => { resetForm(); setShowForm(true); }} className="btn-gold !text-sm !py-2 flex items-center gap-2">
          <Plus className="w-4 h-4" /> Ajouter
        </button>
      </div>

      {showForm && (
        <div className="card-elevated mb-6 space-y-3">
          <h3 className="font-heading font-semibold text-foreground">{editId ? "Modifier le bonus" : "Nouveau bonus"}</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <select value={form.career_level} onChange={e => setForm({...form, career_level: e.target.value})}
              className="px-3 py-2 rounded-lg border border-input bg-background text-foreground font-body text-sm">
              <option value="">Profil de carrière</option>
              {CAREER_LEVELS.map(l => <option key={l} value={l}>{l.replace(/_/g, " ")}</option>)}
            </select>
            <input placeholder="Bonus unique" type="number" value={form.bonus_amount} onChange={e => setForm({...form, bonus_amount: e.target.value})}
              className="px-3 py-2 rounded-lg border border-input bg-background text-foreground font-body text-sm" />
            <input placeholder="Bonus mensuel" type="number" value={form.monthly_bonus} onChange={e => setForm({...form, monthly_bonus: e.target.value})}
              className="px-3 py-2 rounded-lg border border-input bg-background text-foreground font-body text-sm" />
            <input placeholder="Conditions" value={form.requirements} onChange={e => setForm({...form, requirements: e.target.value})}
              className="px-3 py-2 rounded-lg border border-input bg-background text-foreground font-body text-sm" />
          </div>
          <div className="flex gap-3">
            <button onClick={handleSave} className="btn-gold !text-sm !py-2">{editId ? "Modifier" : "Ajouter"}</button>
            <button onClick={resetForm} className="px-4 py-2 rounded-lg border border-input text-muted-foreground font-body text-sm">Annuler</button>
          </div>
        </div>
      )}

      <table className="w-full text-sm font-body">
        <thead><tr className="border-b border-border text-muted-foreground">
          <th className="text-left py-2 px-3">Profil</th><th className="text-right py-2 px-3">Bonus unique</th>
          <th className="text-right py-2 px-3">Mensuel</th><th className="text-left py-2 px-3">Conditions</th>
          <th className="text-right py-2 px-3">Actions</th>
        </tr></thead>
        <tbody>
          {bonuses.map((b: any) => (
            <tr key={b.id} className="border-b border-border/50">
              <td className="py-2 px-3 font-semibold capitalize">{b.career_level.replace(/_/g, " ")}</td>
              <td className="py-2 px-3 text-right font-bold text-primary">{Number(b.bonus_amount).toLocaleString("fr-FR")} FCFA</td>
              <td className="py-2 px-3 text-right">{Number(b.monthly_bonus).toLocaleString("fr-FR")} FCFA</td>
              <td className="py-2 px-3 text-xs">{b.requirements || "—"}</td>
              <td className="py-2 px-3 text-right">
                <div className="flex items-center justify-end gap-1">
                  <button onClick={() => handleEdit(b)} className="p-1.5 rounded-md hover:bg-secondary"><Pencil className="w-4 h-4 text-primary" /></button>
                  <button onClick={() => handleDelete(b.id)} className="p-1.5 rounded-md hover:bg-secondary"><Trash2 className="w-4 h-4 text-destructive" /></button>
                </div>
              </td>
            </tr>
          ))}
          {bonuses.length === 0 && <tr><td colSpan={5} className="py-8 text-center text-muted-foreground">Aucun bonus configuré</td></tr>}
        </tbody>
      </table>
    </div>
  );
};

export default AdminBonuses;
