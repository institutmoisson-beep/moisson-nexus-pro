import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import DashboardLayout from "@/components/DashboardLayout";
import { getPacks, createPack, updatePack, deletePack, type Pack } from "@/lib/demo-data";
import { toast } from "sonner";
import { Plus, Edit2, Trash2, Save, X, Eye } from "lucide-react";
import { generateCommissionLevels, DEFAULT_MLM_CONFIG } from "@/lib/mlm-commission";

const AdminPacks = () => {
  const { getUserProfile } = useAuth();
  const navigate = useNavigate();
  const [packs, setPacks] = useState<Pack[]>([]);
  const [editingPack, setEditingPack] = useState<Pack | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [previewPack, setPreviewPack] = useState<Pack | null>(null);
  const [form, setForm] = useState({
    name: "", description: "", price: 0, benefit: 0,
    level1_commission_percent: DEFAULT_MLM_CONFIG.level1CommissionPercent,
    decay_factor: DEFAULT_MLM_CONFIG.decayFactor,
    min_commission: DEFAULT_MLM_CONFIG.minCommission,
    is_active: true,
  });

  useEffect(() => {
    const profile = getUserProfile();
    if (!profile || profile.role !== "admin") {
      toast.error("Accès réservé aux administrateurs");
      navigate("/dashboard");
    }
  }, [navigate, getUserProfile]);

  useEffect(() => { loadPacks(); }, []);

  const loadPacks = () => setPacks(getPacks());

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (form.benefit > form.price) { toast.error("Le bénéfice ne peut pas dépasser le prix"); return; }
    if (form.level1_commission_percent <= 0 || form.level1_commission_percent > 100) { toast.error("Taux entre 1% et 100%"); return; }

    const packData = { name: form.name, description: form.description, price: form.price, benefit: form.benefit, level1_commission_percent: form.level1_commission_percent, decay_factor: form.decay_factor, min_commission: form.min_commission, is_active: form.is_active };

    if (editingPack) {
      updatePack(editingPack.id, packData);
      toast.success("Pack mis à jour !");
    } else {
      createPack(packData);
      toast.success("Pack créé !");
    }
    resetForm();
    loadPacks();
  };

  const resetForm = () => {
    setForm({ name: "", description: "", price: 0, benefit: 0, level1_commission_percent: DEFAULT_MLM_CONFIG.level1CommissionPercent, decay_factor: DEFAULT_MLM_CONFIG.decayFactor, min_commission: DEFAULT_MLM_CONFIG.minCommission, is_active: true });
    setEditingPack(null);
    setShowForm(false);
  };

  const startEdit = (pack: Pack) => {
    setForm({ name: pack.name, description: pack.description || "", price: pack.price, benefit: pack.benefit, level1_commission_percent: pack.level1_commission_percent, decay_factor: pack.decay_factor, min_commission: pack.min_commission, is_active: pack.is_active });
    setEditingPack(pack);
    setShowForm(true);
  };

  const handleDelete = (id: string) => {
    if (!confirm("Supprimer ce pack ?")) return;
    deletePack(id);
    toast.success("Pack supprimé");
    loadPacks();
  };

  const formCommissions = form.benefit > 0 ? generateCommissionLevels(form.benefit, form.level1_commission_percent, form.decay_factor, form.min_commission) : [];

  return (
    <DashboardLayout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-heading font-bold text-foreground">📦 Gestion des Packs MLM</h1>
          <p className="text-muted-foreground font-body mt-1">Configurez les packs et leurs commissions</p>
        </div>
        {!showForm && (
          <button onClick={() => setShowForm(true)} className="btn-hero !text-sm !py-2.5 !px-4 flex items-center gap-2">
            <Plus className="w-4 h-4" /> Nouveau Pack
          </button>
        )}
      </div>

      {showForm && (
        <div className="card-elevated mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-heading font-bold text-lg text-foreground">{editingPack ? "Modifier" : "Créer"}</h2>
            <button onClick={resetForm} className="p-2 rounded-lg hover:bg-secondary text-muted-foreground"><X className="w-5 h-5" /></button>
          </div>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h3 className="font-heading font-semibold text-foreground">Informations du pack</h3>
                <input required placeholder="Nom du pack" value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="w-full px-4 py-3 rounded-lg border border-input bg-background text-foreground font-body focus:ring-2 focus:ring-ring outline-none" />
                <textarea placeholder="Description" value={form.description} onChange={e => setForm({...form, description: e.target.value})} rows={3} className="w-full px-4 py-3 rounded-lg border border-input bg-background text-foreground font-body focus:ring-2 focus:ring-ring outline-none resize-none" />
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1.5 font-body">Prix (FCFA)</label>
                    <input type="number" required min={0} value={form.price} onChange={e => setForm({...form, price: Number(e.target.value)})} className="w-full px-4 py-3 rounded-lg border border-input bg-background text-foreground font-body focus:ring-2 focus:ring-ring outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1.5 font-body">Bénéfice (FCFA)</label>
                    <input type="number" required min={0} max={form.price} value={form.benefit} onChange={e => setForm({...form, benefit: Number(e.target.value)})} className="w-full px-4 py-3 rounded-lg border border-gold/50 bg-gold/5 text-foreground font-body focus:ring-2 focus:ring-gold outline-none" />
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <h3 className="font-heading font-semibold text-foreground">Configuration MLM</h3>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5 font-body">Commission Niveau 1 (%)</label>
                  <input type="number" required min={1} max={100} value={form.level1_commission_percent} onChange={e => setForm({...form, level1_commission_percent: Number(e.target.value)})} className="w-full px-4 py-3 rounded-lg border border-harvest-green/50 bg-harvest-green/5 text-foreground font-body focus:ring-2 focus:ring-harvest-green outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5 font-body">Facteur de décroissance (0.1-0.9)</label>
                  <input type="number" required min={0.1} max={0.9} step={0.05} value={form.decay_factor} onChange={e => setForm({...form, decay_factor: Number(e.target.value)})} className="w-full px-4 py-3 rounded-lg border border-input bg-background text-foreground font-body focus:ring-2 focus:ring-ring outline-none" />
                </div>
                {formCommissions.length > 0 && (
                  <div className="bg-secondary/50 rounded-xl p-4 border border-border">
                    <h4 className="font-heading font-semibold text-sm text-foreground mb-3">Aperçu des commissions</h4>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {formCommissions.slice(0, 8).map(level => (
                        <div key={level.level} className="flex justify-between items-center text-sm font-body">
                          <span className="text-muted-foreground">Niveau {level.level}</span>
                          <span className="font-semibold text-foreground">{level.amount.toLocaleString("fr-FR")} FCFA <span className="text-xs text-muted-foreground">({level.percentage}%)</span></span>
                        </div>
                      ))}
                    </div>
                    <div className="border-t border-border mt-3 pt-3">
                      <div className="flex justify-between text-sm font-body">
                        <span className="text-muted-foreground">Total</span>
                        <span className="font-bold text-harvest-green">{formCommissions.reduce((s, l) => s + l.amount, 0).toLocaleString("fr-FR")} FCFA</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div className="flex gap-3 pt-4 border-t border-border">
              <button type="submit" className="btn-gold flex items-center gap-2"><Save className="w-4 h-4" /> {editingPack ? "Mettre à jour" : "Créer"}</button>
              <button type="button" onClick={resetForm} className="px-6 py-3 rounded-lg border border-input text-muted-foreground hover:bg-secondary font-body">Annuler</button>
            </div>
          </form>
        </div>
      )}

      <div className="space-y-4">
        {packs.map((pack) => (
          <div key={pack.id} className="card-elevated">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="font-heading font-bold text-lg text-foreground">{pack.name}</h3>
                  {!pack.is_active && <span className="text-xs bg-muted px-2 py-1 rounded-full text-muted-foreground">Inactif</span>}
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div><p className="text-muted-foreground font-body">Prix</p><p className="font-heading font-bold text-foreground">{pack.price.toLocaleString("fr-FR")} FCFA</p></div>
                  <div><p className="text-muted-foreground font-body">Bénéfice</p><p className="font-heading font-bold text-gold">{pack.benefit.toLocaleString("fr-FR")} FCFA</p></div>
                  <div><p className="text-muted-foreground font-body">Commission N1</p><p className="font-heading font-bold text-harvest-green">{pack.level1_commission_percent}%</p></div>
                  <div><p className="text-muted-foreground font-body">Décroissance</p><p className="font-heading font-bold text-foreground">{(pack.decay_factor * 100).toFixed(0)}%</p></div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => setPreviewPack(previewPack?.id === pack.id ? null : pack)} className="p-2.5 rounded-lg border hover:bg-secondary text-muted-foreground"><Eye className="w-4 h-4" /></button>
                <button onClick={() => startEdit(pack)} className="p-2.5 rounded-lg border hover:bg-secondary text-muted-foreground"><Edit2 className="w-4 h-4" /></button>
                <button onClick={() => handleDelete(pack.id)} className="p-2.5 rounded-lg border border-destructive/30 hover:bg-destructive/10 text-destructive"><Trash2 className="w-4 h-4" /></button>
              </div>
            </div>
            {previewPack?.id === pack.id && (
              <div className="mt-4 pt-4 border-t border-border">
                <h4 className="font-heading font-semibold text-foreground mb-3">Répartition des commissions</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                  {generateCommissionLevels(pack.benefit, pack.level1_commission_percent, pack.decay_factor, pack.min_commission).map(level => (
                    <div key={level.level} className="bg-secondary/50 rounded-lg p-3 text-center">
                      <p className="text-xs text-muted-foreground font-body">Niveau {level.level}</p>
                      <p className="font-heading font-bold text-foreground">{level.amount.toLocaleString("fr-FR")} F</p>
                      <p className="text-xs text-muted-foreground">{level.percentage}%</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </DashboardLayout>
  );
};

export default AdminPacks;
