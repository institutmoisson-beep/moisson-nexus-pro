import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Plus, Trash2, Settings } from "lucide-react";
import ImageUploader from "./ImageUploader";

const AdminPacks = () => {
  const [packs, setPacks] = useState<any[]>([]);
  const [partners, setPartners] = useState<any[]>([]);
  const [sectors, setSectors] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    name: "", price: "", commission_percentage: "10", description: "",
    physical_prizes: "", partner_company_id: "", sector_id: "",
  });
  const [packImages, setPackImages] = useState<string[]>([]);
  const [commissionPack, setCommissionPack] = useState<any>(null);
  const [commLevel1, setCommLevel1] = useState("");
  const [commLevels, setCommLevels] = useState(10);
  const [commReduction, setCommReduction] = useState(20);
  const [packCommissions, setPackCommissions] = useState<any[]>([]);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    const [packsRes, partnersRes, sectorsRes] = await Promise.all([
      supabase.from("packs").select("*, partner_companies(name)").order("created_at", { ascending: false }),
      supabase.from("partner_companies").select("id, name").eq("is_active", true),
      supabase.from("pack_sectors").select("*").eq("is_active", true),
    ]);
    setPacks(packsRes.data || []);
    setPartners(partnersRes.data || []);
    setSectors(sectorsRes.data || []);
  };

  const handleCreate = async () => {
    if (!form.name || !form.price) { toast.error("Nom et prix requis"); return; }
    if (!form.sector_id) { toast.error("Veuillez sélectionner un secteur"); return; }
    const { error } = await supabase.from("packs").insert({
      name: form.name, price: Number(form.price),
      commission_percentage: Number(form.commission_percentage),
      description: form.description, physical_prizes: form.physical_prizes,
      partner_company_id: form.partner_company_id || null,
      sector_id: form.sector_id || null,
      images: packImages,
    });
    if (error) { toast.error("Erreur: " + error.message); return; }
    toast.success("Pack créé !");
    setShowForm(false);
    setForm({ name: "", price: "", commission_percentage: "10", description: "", physical_prizes: "", partner_company_id: "", sector_id: "" });
    setPackImages([]);
    loadData();
  };

  const deletePack = async (id: string) => {
    await supabase.from("packs").update({ is_active: false }).eq("id", id);
    toast.success("Pack désactivé");
    loadData();
  };

  const openCommissions = async (pack: any) => {
    setCommissionPack(pack);
    const { data } = await supabase.from("pack_commissions").select("*").eq("pack_id", pack.id).order("level_number");
    setPackCommissions(data || []);
    if (data && data.length > 0) {
      setCommLevel1(String(data[0].percentage));
      setCommLevels(data.length);
    } else {
      setCommLevel1("");
      setCommLevels(10);
    }
  };

  const generateCommissions = () => {
    if (!commLevel1 || Number(commLevel1) <= 0) { toast.error("Commission niveau 1 requise"); return; }
    const base = Number(commLevel1);
    const levels: { level: number; pct: number }[] = [];
    for (let i = 0; i < commLevels; i++) {
      const pct = Math.round(base * Math.pow((100 - commReduction) / 100, i) * 100) / 100;
      if (pct < 0.01) break;
      levels.push({ level: i + 1, pct });
    }
    return levels;
  };

  const saveCommissions = async () => {
    const levels = generateCommissions();
    if (!levels || levels.length === 0) return;

    // Delete existing
    await supabase.from("pack_commissions").delete().eq("pack_id", commissionPack.id);

    // Insert new
    const rows = levels.map(l => ({
      pack_id: commissionPack.id,
      level_number: l.level,
      percentage: l.pct,
    }));
    const { error } = await supabase.from("pack_commissions").insert(rows);
    if (error) { toast.error("Erreur: " + error.message); return; }
    toast.success(`${levels.length} niveaux de commission enregistrés !`);
    setCommissionPack(null);
  };

  const previewLevels = generateCommissions();

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-heading font-bold text-foreground">Packs d'activation</h1>
        <button onClick={() => setShowForm(!showForm)} className="btn-hero !text-sm !py-2 !px-4">
          <Plus className="w-4 h-4 mr-1" /> Ajouter
        </button>
      </div>

      {showForm && (
        <div className="card-elevated mb-6 space-y-3">
          <input placeholder="Nom du pack" value={form.name} onChange={e => setForm({...form, name: e.target.value})}
            className="w-full px-3 py-2 rounded-lg border border-input bg-background text-foreground font-body text-sm" />
          <div className="grid grid-cols-2 gap-3">
            <input placeholder="Prix (FCFA)" type="number" value={form.price} onChange={e => setForm({...form, price: e.target.value})}
              className="px-3 py-2 rounded-lg border border-input bg-background text-foreground font-body text-sm" />
            <input placeholder="Commission %" type="number" value={form.commission_percentage} onChange={e => setForm({...form, commission_percentage: e.target.value})}
              className="px-3 py-2 rounded-lg border border-input bg-background text-foreground font-body text-sm" />
          </div>
          <textarea placeholder="Description" value={form.description} onChange={e => setForm({...form, description: e.target.value})}
            className="w-full px-3 py-2 rounded-lg border border-input bg-background text-foreground font-body text-sm" rows={2} />
          <input placeholder="Prix physiques inclus" value={form.physical_prizes} onChange={e => setForm({...form, physical_prizes: e.target.value})}
            className="w-full px-3 py-2 rounded-lg border border-input bg-background text-foreground font-body text-sm" />
          <div className="grid grid-cols-2 gap-3">
            <select value={form.sector_id} onChange={e => setForm({...form, sector_id: e.target.value})}
              className="px-3 py-2 rounded-lg border border-input bg-background text-foreground font-body text-sm">
              <option value="">-- Secteur (requis) --</option>
              {sectors.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
            <select value={form.partner_company_id} onChange={e => setForm({...form, partner_company_id: e.target.value})}
              className="px-3 py-2 rounded-lg border border-input bg-background text-foreground font-body text-sm">
              <option value="">Entreprise partenaire (optionnel)</option>
              {partners.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <ImageUploader folder="packs" images={packImages} onChange={setPackImages} max={6} label="Images du pack" />
          <button onClick={handleCreate} className="btn-gold !text-sm !py-2">Créer le pack</button>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-4">
        {packs.map((p: any) => (
          <div key={p.id} className={`card-elevated ${!p.is_active ? "opacity-50" : ""}`}>
            <div className="flex justify-between items-start mb-2">
              <h3 className="font-heading font-semibold text-foreground">{p.name}</h3>
              <div className="flex gap-1">
                <button onClick={() => openCommissions(p)} className="p-1 text-primary hover:bg-primary/10 rounded" title="Commissions"><Settings className="w-4 h-4" /></button>
                <button onClick={() => deletePack(p.id)} className="p-1 text-destructive hover:bg-destructive/10 rounded"><Trash2 className="w-4 h-4" /></button>
              </div>
            </div>
            {p.images && p.images.length > 0 && (
              <div className="flex gap-1.5 mb-2 overflow-x-auto">
                {p.images.map((img: string, i: number) => (
                  <img key={i} src={img} alt="" className="w-16 h-16 rounded-lg object-cover shrink-0 border border-border" />
                ))}
              </div>
            )}
            <p className="text-xl font-bold text-primary mb-1">{Number(p.price).toLocaleString("fr-FR")} FCFA</p>
            <p className="text-xs text-muted-foreground font-body">Commission: {p.commission_percentage}%</p>
            {p.description && <p className="text-sm text-muted-foreground font-body mt-2">{p.description}</p>}
            {p.partner_companies?.name && <p className="text-xs text-muted-foreground font-body mt-1">Partenaire: {p.partner_companies.name}</p>}
          </div>
        ))}
        {packs.length === 0 && <p className="text-muted-foreground font-body col-span-2 text-center py-8">Aucun pack</p>}
      </div>

      {/* Commission Configuration Modal */}
      {commissionPack && (
        <div className="fixed inset-0 bg-foreground/50 flex items-center justify-center z-50 p-4" onClick={() => setCommissionPack(null)}>
          <div className="bg-card rounded-xl border border-border p-6 w-full max-w-md max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <h2 className="text-xl font-heading font-bold text-foreground mb-4">💰 Commissions: {commissionPack.name}</h2>
            <p className="text-sm text-muted-foreground font-body mb-4">
              Définissez la commission du niveau 1, le système calcule automatiquement les niveaux suivants avec une réduction progressive.
            </p>
            <div className="space-y-3 mb-4">
              <div>
                <label className="text-sm font-body font-medium text-foreground">Commission Niveau 1 (%)</label>
                <input type="number" step="0.1" value={commLevel1} onChange={e => setCommLevel1(e.target.value)}
                  className="w-full mt-1 px-3 py-2 rounded-lg border border-input bg-background text-foreground font-body text-sm" placeholder="Ex: 10" />
              </div>
              <div>
                <label className="text-sm font-body font-medium text-foreground">Nombre de niveaux</label>
                <input type="number" value={commLevels} onChange={e => setCommLevels(Number(e.target.value))}
                  className="w-full mt-1 px-3 py-2 rounded-lg border border-input bg-background text-foreground font-body text-sm" min={1} max={50} />
              </div>
              <div>
                <label className="text-sm font-body font-medium text-foreground">Réduction par niveau (%)</label>
                <input type="number" value={commReduction} onChange={e => setCommReduction(Number(e.target.value))}
                  className="w-full mt-1 px-3 py-2 rounded-lg border border-input bg-background text-foreground font-body text-sm" min={1} max={90} />
                <p className="text-xs text-muted-foreground font-body mt-1">Chaque niveau reçoit {100 - commReduction}% du niveau précédent</p>
              </div>
            </div>

            {/* Preview */}
            {previewLevels && previewLevels.length > 0 && (
              <div className="bg-secondary rounded-lg p-3 mb-4 max-h-48 overflow-y-auto">
                <p className="text-xs font-semibold text-foreground mb-2 font-body">Aperçu des niveaux:</p>
                {previewLevels.map(l => (
                  <div key={l.level} className="flex justify-between text-xs font-body py-0.5">
                    <span className="text-muted-foreground">Niveau {l.level}</span>
                    <span className="font-semibold text-primary">{l.pct}%</span>
                  </div>
                ))}
              </div>
            )}

            {/* Existing commissions */}
            {packCommissions.length > 0 && (
              <div className="bg-muted/30 rounded-lg p-3 mb-4">
                <p className="text-xs font-semibold text-foreground mb-2 font-body">Commissions actuelles:</p>
                {packCommissions.map(c => (
                  <div key={c.id} className="flex justify-between text-xs font-body py-0.5">
                    <span className="text-muted-foreground">Niveau {c.level_number}</span>
                    <span className="font-semibold">{c.percentage}%</span>
                  </div>
                ))}
              </div>
            )}

            <div className="flex gap-3">
              <button onClick={saveCommissions} className="flex-1 btn-gold !text-sm !py-2.5">Enregistrer</button>
              <button onClick={() => setCommissionPack(null)} className="px-4 py-2.5 rounded-lg border border-input text-muted-foreground font-body text-sm hover:bg-secondary">Annuler</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPacks;
