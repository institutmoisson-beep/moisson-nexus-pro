import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Plus } from "lucide-react";

const AdminPartners = () => {
  const [partners, setPartners] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", description: "", website: "", whatsapp: "", facebook: "", email: "", phone: "" });

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    const { data } = await supabase.from("partner_companies").select("*").order("created_at", { ascending: false });
    setPartners(data || []);
  };

  const handleCreate = async () => {
    if (!form.name) { toast.error("Nom requis"); return; }
    const { error } = await supabase.from("partner_companies").insert(form);
    if (error) { toast.error("Erreur"); return; }
    toast.success("Partenaire ajouté !");
    setShowForm(false);
    setForm({ name: "", description: "", website: "", whatsapp: "", facebook: "", email: "", phone: "" });
    loadData();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-heading font-bold text-foreground">Entreprises partenaires</h1>
        <button onClick={() => setShowForm(!showForm)} className="btn-hero !text-sm !py-2 !px-4">
          <Plus className="w-4 h-4 mr-1" /> Ajouter
        </button>
      </div>

      {showForm && (
        <div className="card-elevated mb-6 space-y-3">
          <input placeholder="Nom de l'entreprise" value={form.name} onChange={e => setForm({...form, name: e.target.value})}
            className="w-full px-3 py-2 rounded-lg border border-input bg-background text-foreground font-body text-sm" />
          <textarea placeholder="Description" value={form.description} onChange={e => setForm({...form, description: e.target.value})}
            className="w-full px-3 py-2 rounded-lg border border-input bg-background text-foreground font-body text-sm" rows={2} />
          <div className="grid grid-cols-2 gap-3">
            <input placeholder="Site web" value={form.website} onChange={e => setForm({...form, website: e.target.value})}
              className="px-3 py-2 rounded-lg border border-input bg-background text-foreground font-body text-sm" />
            <input placeholder="WhatsApp" value={form.whatsapp} onChange={e => setForm({...form, whatsapp: e.target.value})}
              className="px-3 py-2 rounded-lg border border-input bg-background text-foreground font-body text-sm" />
            <input placeholder="Facebook" value={form.facebook} onChange={e => setForm({...form, facebook: e.target.value})}
              className="px-3 py-2 rounded-lg border border-input bg-background text-foreground font-body text-sm" />
            <input placeholder="Email" value={form.email} onChange={e => setForm({...form, email: e.target.value})}
              className="px-3 py-2 rounded-lg border border-input bg-background text-foreground font-body text-sm" />
            <input placeholder="Téléphone" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})}
              className="px-3 py-2 rounded-lg border border-input bg-background text-foreground font-body text-sm" />
          </div>
          <button onClick={handleCreate} className="btn-gold !text-sm !py-2">Ajouter</button>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-4">
        {partners.map((p: any) => (
          <div key={p.id} className={`card-elevated ${!p.is_active ? "opacity-50" : ""}`}>
            <h3 className="font-heading font-semibold text-foreground mb-1">{p.name}</h3>
            {p.description && <p className="text-sm text-muted-foreground font-body mb-2">{p.description}</p>}
            <div className="text-xs text-muted-foreground font-body space-y-0.5">
              {p.website && <p>🌐 {p.website}</p>}
              {p.whatsapp && <p>💬 {p.whatsapp}</p>}
              {p.email && <p>📧 {p.email}</p>}
            </div>
          </div>
        ))}
        {partners.length === 0 && <p className="text-muted-foreground font-body col-span-2 text-center py-8">Aucun partenaire</p>}
      </div>
    </div>
  );
};

export default AdminPartners;
