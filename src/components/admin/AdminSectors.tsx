import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";

const AdminSectors = () => {
  const [sectors, setSectors] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", description: "" });

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    const { data } = await supabase.from("pack_sectors").select("*").order("created_at", { ascending: false });
    setSectors(data || []);
  };

  const handleCreate = async () => {
    if (!form.name) { toast.error("Nom requis"); return; }
    const { error } = await supabase.from("pack_sectors").insert(form);
    if (error) { toast.error("Erreur: " + error.message); return; }
    toast.success("Secteur ajouté !");
    setShowForm(false);
    setForm({ name: "", description: "" });
    loadData();
  };

  const toggleActive = async (id: string, current: boolean) => {
    await supabase.from("pack_sectors").update({ is_active: !current }).eq("id", id);
    toast.success(current ? "Désactivé" : "Activé");
    loadData();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-heading font-bold text-foreground">Secteurs de packs</h1>
        <button onClick={() => setShowForm(!showForm)} className="btn-hero !text-sm !py-2 !px-4">
          <Plus className="w-4 h-4 mr-1" /> Ajouter
        </button>
      </div>

      {showForm && (
        <div className="card-elevated mb-6 space-y-3">
          <input placeholder="Nom du secteur (ex: Agriculture, BTP, Restauration...)" value={form.name} onChange={e => setForm({...form, name: e.target.value})}
            className="w-full px-3 py-2 rounded-lg border border-input bg-background text-foreground font-body text-sm" />
          <textarea placeholder="Description (optionnel)" value={form.description} onChange={e => setForm({...form, description: e.target.value})}
            className="w-full px-3 py-2 rounded-lg border border-input bg-background text-foreground font-body text-sm" rows={2} />
          <button onClick={handleCreate} className="btn-gold !text-sm !py-2">Ajouter le secteur</button>
        </div>
      )}

      <div className="grid md:grid-cols-3 gap-4">
        {sectors.map((s: any) => (
          <div key={s.id} className={`card-elevated ${!s.is_active ? "opacity-50" : ""}`}>
            <div className="flex justify-between items-start">
              <h3 className="font-heading font-semibold text-foreground">{s.name}</h3>
              <button onClick={() => toggleActive(s.id, s.is_active)}
                className={`text-xs px-2 py-1 rounded font-body ${s.is_active ? "bg-destructive/10 text-destructive" : "bg-harvest-green/10 text-harvest-green"}`}>
                {s.is_active ? "Désactiver" : "Activer"}
              </button>
            </div>
            {s.description && <p className="text-sm text-muted-foreground font-body mt-2">{s.description}</p>}
          </div>
        ))}
        {sectors.length === 0 && <p className="text-muted-foreground font-body col-span-3 text-center py-8">Aucun secteur créé</p>}
      </div>
    </div>
  );
};

export default AdminSectors;
