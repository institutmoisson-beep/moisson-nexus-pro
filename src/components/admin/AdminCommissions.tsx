import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const AdminCommissions = () => {
  const [levels, setLevels] = useState<any[]>([]);
  const [form, setForm] = useState({ level_number: "", percentage: "", description: "" });

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    const { data } = await supabase.from("commission_levels").select("*").order("level_number");
    setLevels(data || []);
  };

  const handleCreate = async () => {
    if (!form.level_number || !form.percentage) { toast.error("Niveau et pourcentage requis"); return; }
    const { error } = await supabase.from("commission_levels").insert({
      level_number: Number(form.level_number), percentage: Number(form.percentage), description: form.description,
    });
    if (error) { toast.error("Erreur: " + error.message); return; }
    toast.success("Niveau ajouté !");
    setForm({ level_number: "", percentage: "", description: "" });
    loadData();
  };

  return (
    <div>
      <h1 className="text-2xl font-heading font-bold text-foreground mb-6">Niveaux de commission</h1>
      <div className="card-elevated mb-6 space-y-3">
        <div className="grid grid-cols-3 gap-3">
          <input placeholder="Niveau" type="number" value={form.level_number} onChange={e => setForm({...form, level_number: e.target.value})}
            className="px-3 py-2 rounded-lg border border-input bg-background text-foreground font-body text-sm" />
          <input placeholder="Pourcentage" type="number" step="0.1" value={form.percentage} onChange={e => setForm({...form, percentage: e.target.value})}
            className="px-3 py-2 rounded-lg border border-input bg-background text-foreground font-body text-sm" />
          <input placeholder="Description" value={form.description} onChange={e => setForm({...form, description: e.target.value})}
            className="px-3 py-2 rounded-lg border border-input bg-background text-foreground font-body text-sm" />
        </div>
        <button onClick={handleCreate} className="btn-gold !text-sm !py-2">Ajouter</button>
      </div>
      <table className="w-full text-sm font-body">
        <thead><tr className="border-b border-border text-muted-foreground">
          <th className="text-left py-2 px-3">Niveau</th><th className="text-right py-2 px-3">Pourcentage</th><th className="text-left py-2 px-3">Description</th>
        </tr></thead>
        <tbody>
          {levels.map((l: any) => (
            <tr key={l.id} className="border-b border-border/50">
              <td className="py-2 px-3 font-bold">Niveau {l.level_number}</td>
              <td className="py-2 px-3 text-right font-semibold text-primary">{l.percentage}%</td>
              <td className="py-2 px-3">{l.description || "—"}</td>
            </tr>
          ))}
          {levels.length === 0 && <tr><td colSpan={3} className="py-8 text-center text-muted-foreground">Aucun niveau</td></tr>}
        </tbody>
      </table>
    </div>
  );
};

export default AdminCommissions;
