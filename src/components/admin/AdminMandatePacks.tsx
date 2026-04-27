import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Plus, Trash2, Edit, Package, CheckCircle, Clock, TrendingUp, RefreshCw,
} from "lucide-react";
import ImageUploader from "./ImageUploader";

const AdminMandatePacks = () => {
  const [packs, setPacks] = useState<any[]>([]);
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [profiles, setProfiles] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editPack, setEditPack] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<"packs" | "subscriptions">("packs");
  const [processing, setProcessing] = useState(false);
  const [processedCount, setProcessedCount] = useState<number | null>(null);
  const [form, setForm] = useState({
    name: "",
    description: "",
    price_fcfa: "",
    commission_every_3_days: "",
    duration_days: "30",
  });
  const [packImages, setPackImages] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    const [packsRes, subsRes, profilesRes] = await Promise.all([
      (supabase as any).from("mandate_packs").select("*").order("created_at", { ascending: false }),
      (supabase as any)
        .from("mandate_subscriptions")
        .select("*, mandate_packs(name, price_fcfa, commission_every_3_days)")
        .order("created_at", { ascending: false })
        .limit(100),
      supabase.from("profiles").select("user_id, first_name, last_name, email"),
    ]);
    setPacks(packsRes.data || []);
    setSubscriptions(subsRes.data || []);
    setProfiles(profilesRes.data || []);
  };

  const getUserName = (userId: string) => {
    const p = profiles.find((pr) => pr.user_id === userId);
    return p ? `${p.first_name} ${p.last_name}` : userId.slice(0, 8) + "...";
  };

  // ── Traitement manuel des commissions ─────────────────────
  const handleProcessCommissions = async () => {
    setProcessing(true);
    setProcessedCount(null);
    try {
      const { data, error } = await (supabase as any).rpc("process_mandate_commissions");
      if (error) {
        toast.error("Erreur: " + error.message);
      } else {
        const count = data ?? 0;
        setProcessedCount(count);
        if (count > 0) {
          toast.success(`✅ ${count} commission(s) versée(s) avec succès !`);
        } else {
          toast.info("Aucune commission due pour le moment.");
        }
        await loadData();
      }
    } catch (err: any) {
      toast.error("Erreur inattendue: " + err.message);
    } finally {
      setProcessing(false);
    }
  };

  const resetForm = () => {
    setForm({ name: "", description: "", price_fcfa: "", commission_every_3_days: "", duration_days: "30" });
    setPackImages([]);
    setEditPack(null);
    setShowForm(false);
  };

  const startEdit = (pack: any) => {
    setEditPack(pack);
    setForm({
      name: pack.name,
      description: pack.description || "",
      price_fcfa: String(pack.price_fcfa),
      commission_every_3_days: String(pack.commission_every_3_days),
      duration_days: String(pack.duration_days || 30),
    });
    setPackImages(pack.images || []);
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.name || !form.price_fcfa || !form.commission_every_3_days) {
      toast.error("Nom, prix et commission sont obligatoires");
      return;
    }
    setSaving(true);

    const payload = {
      name: form.name,
      description: form.description || null,
      price_fcfa: Number(form.price_fcfa),
      commission_every_3_days: Number(form.commission_every_3_days),
      duration_days: Number(form.duration_days) || 30,
      images: packImages,
      is_active: true,
    };

    const { error } = editPack
      ? await (supabase as any).from("mandate_packs").update(payload).eq("id", editPack.id)
      : await (supabase as any).from("mandate_packs").insert(payload);

    setSaving(false);
    if (error) { toast.error("Erreur: " + error.message); return; }
    toast.success(editPack ? "Pack modifié !" : "Pack créé !");
    resetForm();
    loadData();
  };

  const toggleActive = async (pack: any) => {
    await (supabase as any).from("mandate_packs").update({ is_active: !pack.is_active }).eq("id", pack.id);
    toast.success(pack.is_active ? "Pack désactivé" : "Pack activé");
    loadData();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Supprimer définitivement ce pack ?")) return;
    await (supabase as any).from("mandate_packs").delete().eq("id", id);
    toast.success("Pack supprimé");
    loadData();
  };

  const getDaysLeft = (endDate: string) => {
    const days = Math.ceil((new Date(endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    return Math.max(0, days);
  };

  // Stats
  const activeSubs = subscriptions.filter(
    (s) => s.status === "active" && getDaysLeft(s.end_date) > 0
  );
  const pendingCommissions = subscriptions.filter(
    (s) => s.status === "active" && new Date(s.next_commission_date) <= new Date()
  );
  const totalInvested = subscriptions.reduce((sum, s) => sum + Number(s.amount_paid || 0), 0);
  const totalCommPaid = subscriptions.reduce((sum, s) => sum + Number(s.total_commissions_paid || 0), 0);

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <h1 className="text-2xl font-heading font-bold text-foreground">🏬 Vente par Mandat</h1>
        <div className="flex items-center gap-2">
          {/* Bouton de traitement des commissions */}
          <button
            onClick={handleProcessCommissions}
            disabled={processing}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-body font-semibold transition-colors disabled:opacity-50 ${
              pendingCommissions.length > 0
                ? "bg-gold/20 text-gold border border-gold/30 hover:bg-gold/30"
                : "bg-secondary text-muted-foreground hover:bg-muted"
            }`}
            title="Verser toutes les commissions dues aux membres"
          >
            <RefreshCw className={`w-4 h-4 ${processing ? "animate-spin" : ""}`} />
            {processing
              ? "Traitement..."
              : pendingCommissions.length > 0
              ? `⏰ Verser ${pendingCommissions.length} commission(s) dues`
              : "Vérifier les commissions"}
          </button>

          <button
            onClick={() => { resetForm(); setShowForm(true); }}
            className="btn-gold !text-sm !py-2 flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> Nouveau Pack
          </button>
        </div>
      </div>

      {/* Résultat du traitement */}
      {processedCount !== null && (
        <div className={`mb-4 flex items-center gap-3 p-4 rounded-xl border ${
          processedCount > 0
            ? "bg-harvest-green/10 border-harvest-green/30 text-harvest-green"
            : "bg-secondary border-border text-muted-foreground"
        }`}>
          <CheckCircle className="w-5 h-5 flex-shrink-0" />
          <p className="text-sm font-body font-semibold">
            {processedCount > 0
              ? `${processedCount} commission(s) versée(s) automatiquement dans les portefeuilles des membres.`
              : "Aucune commission n'était due. Tout est à jour."}
          </p>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="card-elevated text-center p-4">
          <p className="text-2xl font-heading font-bold text-foreground">{packs.filter((p) => p.is_active).length}</p>
          <p className="text-xs text-muted-foreground font-body">Packs actifs</p>
        </div>
        <div className="card-elevated text-center p-4">
          <p className="text-2xl font-heading font-bold text-harvest-green">{activeSubs.length}</p>
          <p className="text-xs text-muted-foreground font-body">Mandats en cours</p>
        </div>
        <div className="card-elevated text-center p-4">
          <p className="text-lg font-heading font-bold text-primary">
            {totalInvested.toLocaleString("fr-FR")}
          </p>
          <p className="text-xs text-muted-foreground font-body">FCFA investis</p>
        </div>
        <div className="card-elevated text-center p-4">
          <p className="text-lg font-heading font-bold text-gold">
            {totalCommPaid.toLocaleString("fr-FR")}
          </p>
          <p className="text-xs text-muted-foreground font-body">FCFA commissions versées</p>
        </div>
      </div>

      {/* Alerte commissions en retard */}
      {pendingCommissions.length > 0 && (
        <div className="mb-6 flex items-center gap-3 p-4 rounded-xl bg-gold/10 border border-gold/30">
          <Clock className="w-5 h-5 text-gold flex-shrink-0" />
          <div>
            <p className="text-sm font-semibold text-foreground font-body">
              {pendingCommissions.length} commission(s) en attente de versement
            </p>
            <p className="text-xs text-muted-foreground font-body">
              Cliquez sur "Verser les commissions dues" pour créditer automatiquement les portefeuilles.
            </p>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 bg-secondary p-1 rounded-xl mb-6 w-fit">
        {[
          { key: "packs", label: `📦 Packs (${packs.length})` },
          { key: "subscriptions", label: `📋 Souscriptions (${subscriptions.length})` },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as any)}
            className={`px-4 py-2 rounded-lg text-sm font-body font-semibold transition-all ${
              activeTab === tab.key
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── CREATE / EDIT FORM ── */}
      {showForm && (
        <div className="card-elevated mb-6 space-y-4">
          <h3 className="font-heading font-semibold text-foreground">
            {editPack ? "Modifier le pack" : "Nouveau pack mandat"}
          </h3>

          <div className="grid md:grid-cols-2 gap-3">
            <input
              placeholder="Nom du pack *"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="px-3 py-2 rounded-lg border border-input bg-background text-foreground font-body text-sm col-span-2"
            />
            <textarea
              placeholder="Description (optionnel)"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={2}
              className="px-3 py-2 rounded-lg border border-input bg-background text-foreground font-body text-sm col-span-2"
            />
            <div>
              <label className="text-xs text-muted-foreground font-body block mb-1">
                Prix d'investissement (FCFA) *
              </label>
              <input
                type="number"
                placeholder="Ex: 50000"
                value={form.price_fcfa}
                onChange={(e) => setForm({ ...form, price_fcfa: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-input bg-background text-foreground font-body text-sm"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground font-body block mb-1">
                Commission tous les 3 jours (FCFA) *
              </label>
              <input
                type="number"
                placeholder="Ex: 5000"
                value={form.commission_every_3_days}
                onChange={(e) => setForm({ ...form, commission_every_3_days: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-input bg-background text-foreground font-body text-sm"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground font-body block mb-1">
                Durée du mandat (jours)
              </label>
              <input
                type="number"
                min="1"
                value={form.duration_days}
                onChange={(e) => setForm({ ...form, duration_days: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-input bg-background text-foreground font-body text-sm"
              />
            </div>
            {form.price_fcfa && form.commission_every_3_days && form.duration_days && (
              <div className="flex items-center bg-harvest-green/10 border border-harvest-green/20 rounded-lg p-3">
                <div>
                  <p className="text-xs font-body text-muted-foreground">ROI estimé</p>
                  <p className="text-sm font-bold text-harvest-green">
                    +
                    {(
                      ((Math.floor(Number(form.duration_days) / 3) * Number(form.commission_every_3_days)) /
                        Number(form.price_fcfa)) *
                      100
                    ).toFixed(1)}
                    % (
                    {(
                      Math.floor(Number(form.duration_days) / 3) * Number(form.commission_every_3_days)
                    ).toLocaleString("fr-FR")}{" "}
                    FCFA total)
                  </p>
                </div>
              </div>
            )}
          </div>

          <ImageUploader
            folder="mandate_packs"
            images={packImages}
            onChange={setPackImages}
            max={5}
            label="Images du pack"
          />

          <div className="flex gap-3">
            <button
              onClick={handleSave}
              disabled={saving}
              className="btn-gold !text-sm !py-2 disabled:opacity-50"
            >
              {saving ? "Enregistrement..." : editPack ? "Modifier" : "Créer le pack"}
            </button>
            <button
              onClick={resetForm}
              className="px-4 py-2 rounded-lg border border-input text-muted-foreground font-body text-sm hover:bg-secondary"
            >
              Annuler
            </button>
          </div>
        </div>
      )}

      {/* ── PACKS TAB ── */}
      {activeTab === "packs" && (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {packs.map((pack) => {
            const totalComm =
              Math.floor((pack.duration_days || 30) / 3) * Number(pack.commission_every_3_days);
            const roi = ((totalComm / Number(pack.price_fcfa)) * 100).toFixed(1);
            const subCount = subscriptions.filter((s) => s.mandate_pack_id === pack.id).length;
            const activeSubCount = subscriptions.filter(
              (s) => s.mandate_pack_id === pack.id && s.status === "active"
            ).length;

            return (
              <div key={pack.id} className={`card-elevated ${!pack.is_active ? "opacity-60" : ""}`}>
                {pack.images?.[0] && (
                  <div className="rounded-xl overflow-hidden aspect-video mb-3 bg-secondary">
                    <img src={pack.images[0]} alt={pack.name} className="w-full h-full object-cover" />
                  </div>
                )}

                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="font-heading font-semibold text-foreground">{pack.name}</h3>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                        pack.is_active
                          ? "bg-harvest-green/20 text-harvest-green"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {pack.is_active ? "Actif" : "Inactif"}
                    </span>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => startEdit(pack)} className="p-1.5 rounded-md hover:bg-secondary" title="Modifier">
                      <Edit className="w-4 h-4 text-primary" />
                    </button>
                    <button onClick={() => handleDelete(pack.id)} className="p-1.5 rounded-md hover:bg-secondary" title="Supprimer">
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </button>
                  </div>
                </div>

                {pack.description && (
                  <p className="text-xs text-muted-foreground font-body mb-3 line-clamp-2">
                    {pack.description}
                  </p>
                )}

                <div className="grid grid-cols-3 gap-2 text-center mb-3">
                  <div className="bg-secondary rounded-lg p-2">
                    <p className="text-[10px] text-muted-foreground font-body">Prix</p>
                    <p className="text-xs font-bold text-primary">
                      {Number(pack.price_fcfa).toLocaleString("fr-FR")} F
                    </p>
                  </div>
                  <div className="bg-harvest-green/10 rounded-lg p-2">
                    <p className="text-[10px] text-muted-foreground font-body">Comm/3j</p>
                    <p className="text-xs font-bold text-harvest-green">
                      {Number(pack.commission_every_3_days).toLocaleString("fr-FR")} F
                    </p>
                  </div>
                  <div className="bg-secondary rounded-lg p-2">
                    <p className="text-[10px] text-muted-foreground font-body">Durée</p>
                    <p className="text-xs font-bold text-foreground">{pack.duration_days}j</p>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs font-body mb-3">
                  <span className="text-muted-foreground">
                    ROI: <span className="text-harvest-green font-bold">+{roi}%</span>
                  </span>
                  <span className="text-muted-foreground">
                    {activeSubCount} actif / {subCount} total
                  </span>
                </div>

                <button
                  onClick={() => toggleActive(pack)}
                  className={`w-full py-1.5 rounded-lg text-xs font-body font-semibold transition-colors ${
                    pack.is_active
                      ? "bg-destructive/10 text-destructive hover:bg-destructive/20"
                      : "bg-harvest-green/10 text-harvest-green hover:bg-harvest-green/20"
                  }`}
                >
                  {pack.is_active ? "Désactiver" : "Activer"}
                </button>
              </div>
            );
          })}
          {packs.length === 0 && (
            <div className="col-span-3 text-center py-12">
              <Package className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground font-body">Aucun pack mandat créé</p>
              <button
                onClick={() => { resetForm(); setShowForm(true); }}
                className="mt-3 btn-gold !text-sm !py-2 !px-4"
              >
                Créer le premier pack
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── SUBSCRIPTIONS TAB ── */}
      {activeTab === "subscriptions" && (
        <div className="overflow-x-auto">
          <table className="w-full text-sm font-body">
            <thead>
              <tr className="border-b border-border text-muted-foreground">
                <th className="text-left py-2 px-3">Date</th>
                <th className="text-left py-2 px-3">Membre</th>
                <th className="text-left py-2 px-3">Pack</th>
                <th className="text-right py-2 px-3">Investi</th>
                <th className="text-right py-2 px-3">Reçues</th>
                <th className="text-left py-2 px-3">Prochaine comm.</th>
                <th className="text-center py-2 px-3">Statut</th>
                <th className="text-center py-2 px-3">Jours restants</th>
              </tr>
            </thead>
            <tbody>
              {subscriptions.map((sub: any) => {
                const daysLeft = getDaysLeft(sub.end_date);
                const isActive = sub.status === "active" && daysLeft > 0;
                const commDue = isActive && new Date(sub.next_commission_date) <= new Date();
                return (
                  <tr key={sub.id} className={`border-b border-border/50 hover:bg-secondary/20 ${commDue ? "bg-gold/5" : ""}`}>
                    <td className="py-2 px-3 text-xs whitespace-nowrap">
                      {new Date(sub.created_at).toLocaleDateString("fr-FR")}
                    </td>
                    <td className="py-2 px-3 font-medium whitespace-nowrap">
                      {getUserName(sub.user_id)}
                    </td>
                    <td className="py-2 px-3 text-xs">{sub.mandate_packs?.name || "—"}</td>
                    <td className="py-2 px-3 text-right font-semibold text-primary whitespace-nowrap">
                      {Number(sub.amount_paid).toLocaleString("fr-FR")} F
                    </td>
                    <td className="py-2 px-3 text-right font-semibold text-harvest-green whitespace-nowrap">
                      {Number(sub.total_commissions_paid || 0).toLocaleString("fr-FR")} F
                    </td>
                    <td className="py-2 px-3 text-xs whitespace-nowrap">
                      {isActive ? (
                        <span className={commDue ? "font-bold text-gold" : "text-muted-foreground"}>
                          {commDue ? "⏰ Due maintenant" : new Date(sub.next_commission_date).toLocaleDateString("fr-FR")}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="py-2 px-3 text-center">
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                          isActive
                            ? "bg-harvest-green/20 text-harvest-green"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {isActive ? "✓ Actif" : "Terminé"}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-center">
                      {isActive ? (
                        <span className="text-xs font-bold text-primary">{daysLeft}j</span>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
              {subscriptions.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-muted-foreground font-body">
                    Aucune souscription enregistrée
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

export default AdminMandatePacks;
