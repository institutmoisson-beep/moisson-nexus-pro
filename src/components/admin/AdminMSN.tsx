import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Flame, Coins, TrendingUp, Shield, Save, Users } from "lucide-react";

const AdminMSN = () => {
  const [config, setConfig] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [coinStats, setCoinStats] = useState({ total: 0, converted: 0, pending: 0 });
  const [recentCoins, setRecentCoins] = useState<any[]>([]);

  // Editable state
  const [conversionTiers, setConversionTiers] = useState<{ coins: number; dollars: number }[]>([]);
  const [maxCoins, setMaxCoins] = useState(12);
  const [matchingLevels, setMatchingLevels] = useState<{ level: number; percentage: number }[]>([]);
  const [strongLegPct, setStrongLegPct] = useState(5);
  const [revenueCaps, setRevenueCaps] = useState<{ career: string; min: number; max: number }[]>([]);

  useEffect(() => { loadAll(); }, []);

  const loadAll = async () => {
    setLoading(true);
    const [cfgRes, coinsRes, recentRes] = await Promise.all([
      supabase.from("msn_config").select("*"),
      supabase.from("msn_coins").select("id, is_converted"),
      supabase.from("msn_coins").select("*, profiles!msn_coins_user_id_fkey(first_name, last_name)").order("created_at", { ascending: false }).limit(20),
    ]);

    const cfgMap: Record<string, any> = {};
    (cfgRes.data || []).forEach((r: any) => { cfgMap[r.key] = r.value; });
    setConfig(cfgMap);

    setConversionTiers(cfgMap.conversion_tiers || []);
    setMaxCoins(Number(cfgMap.max_coins_convert) || 12);
    setMatchingLevels(cfgMap.matching_bonus_levels || []);
    setStrongLegPct(Number(cfgMap.strong_leg_bonus_pct) || 5);
    setRevenueCaps(cfgMap.revenue_caps || []);

    const coins = coinsRes.data || [];
    setCoinStats({
      total: coins.length,
      converted: coins.filter((c: any) => c.is_converted).length,
      pending: coins.filter((c: any) => !c.is_converted).length,
    });
    setRecentCoins(recentRes.data || []);
    setLoading(false);
  };

  const saveConfig = async () => {
    setSaving(true);
    const updates = [
      { key: "conversion_tiers", value: conversionTiers },
      { key: "max_coins_convert", value: maxCoins },
      { key: "matching_bonus_levels", value: matchingLevels },
      { key: "strong_leg_bonus_pct", value: strongLegPct },
      { key: "revenue_caps", value: revenueCaps },
    ];

    for (const u of updates) {
      await supabase.from("msn_config").update({ value: u.value as any, updated_at: new Date().toISOString() }).eq("key", u.key);
    }
    toast.success("Configuration MSN sauvegardée !");
    setSaving(false);
  };

  const CAREER_LABELS: Record<string, string> = {
    semeur: "Semeur", cultivateur: "Cultivateur", moissonneur: "Moissonneur",
    guide_de_champ: "Guide de Champ", maitre_moissonneur: "Maître Moissonneur",
    grand_moissonneur: "Grand Moissonneur", ambassadeur_moisson: "Ambassadeur",
    stratege_moisson: "Stratège", elite_moisson: "Élite", guide_moissonneur: "Guide Moissonneur",
  };

  if (loading) return <div className="animate-pulse text-muted-foreground font-body">Chargement MSN...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-2">
        <Flame className="w-7 h-7 text-primary" />
        <h1 className="text-2xl font-heading font-bold text-foreground">Plan MSN 🔥</h1>
      </div>
      <p className="text-sm text-muted-foreground font-body">
        Système de commission qui récompense chaque effort — même quand un seul côté travaille.
      </p>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card-elevated p-4 text-center">
          <Coins className="w-6 h-6 text-primary mx-auto mb-1" />
          <div className="text-2xl font-heading font-bold text-foreground">{coinStats.total}</div>
          <div className="text-xs text-muted-foreground font-body">Total Coins distribués</div>
        </div>
        <div className="card-elevated p-4 text-center">
          <TrendingUp className="w-6 h-6 text-green-500 mx-auto mb-1" />
          <div className="text-2xl font-heading font-bold text-foreground">{coinStats.converted}</div>
          <div className="text-xs text-muted-foreground font-body">Coins convertis</div>
        </div>
        <div className="card-elevated p-4 text-center">
          <Shield className="w-6 h-6 text-amber-500 mx-auto mb-1" />
          <div className="text-2xl font-heading font-bold text-foreground">{coinStats.pending}</div>
          <div className="text-xs text-muted-foreground font-body">Coins en attente</div>
        </div>
      </div>

      {/* Conversion Tiers */}
      <div className="card-elevated p-4 space-y-3">
        <h2 className="font-heading font-bold text-foreground flex items-center gap-2"><Coins className="w-5 h-5" /> Paliers de conversion</h2>
        <div className="space-y-2">
          {conversionTiers.map((tier, i) => (
            <div key={i} className="flex items-center gap-3">
              <input type="number" value={tier.coins} onChange={e => {
                const t = [...conversionTiers]; t[i] = { ...t[i], coins: Number(e.target.value) }; setConversionTiers(t);
              }} className="w-20 px-3 py-2 rounded-lg border border-input bg-background text-foreground font-body text-sm" />
              <span className="text-sm text-muted-foreground font-body">coins →</span>
              <input type="number" value={tier.dollars} onChange={e => {
                const t = [...conversionTiers]; t[i] = { ...t[i], dollars: Number(e.target.value) }; setConversionTiers(t);
              }} className="w-24 px-3 py-2 rounded-lg border border-input bg-background text-foreground font-body text-sm" />
              <span className="text-sm text-muted-foreground font-body">$</span>
              <button onClick={() => setConversionTiers(conversionTiers.filter((_, j) => j !== i))}
                className="text-destructive text-xs hover:underline">Suppr</button>
            </div>
          ))}
          <button onClick={() => setConversionTiers([...conversionTiers, { coins: 0, dollars: 0 }])}
            className="text-primary text-xs font-body hover:underline">+ Ajouter un palier</button>
        </div>
        <div className="flex items-center gap-3 mt-2">
          <span className="text-sm font-body text-muted-foreground">Max coins convertibles :</span>
          <input type="number" value={maxCoins} onChange={e => setMaxCoins(Number(e.target.value))}
            className="w-20 px-3 py-2 rounded-lg border border-input bg-background text-foreground font-body text-sm" />
        </div>
      </div>

      {/* Matching Bonus */}
      <div className="card-elevated p-4 space-y-3">
        <h2 className="font-heading font-bold text-foreground flex items-center gap-2"><Users className="w-5 h-5" /> Matching Bonus (par niveau)</h2>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
          {matchingLevels.map((ml, i) => (
            <div key={i} className="flex flex-col items-center gap-1 p-2 bg-secondary/50 rounded-lg">
              <span className="text-xs text-muted-foreground font-body">Niv {ml.level}</span>
              <div className="flex items-center gap-1">
                <input type="number" step="0.5" value={ml.percentage} onChange={e => {
                  const m = [...matchingLevels]; m[i] = { ...m[i], percentage: Number(e.target.value) }; setMatchingLevels(m);
                }} className="w-14 px-2 py-1 rounded border border-input bg-background text-foreground text-sm text-center" />
                <span className="text-xs text-muted-foreground">%</span>
              </div>
            </div>
          ))}
        </div>
        <button onClick={() => setMatchingLevels([...matchingLevels, { level: matchingLevels.length + 1, percentage: 1 }])}
          className="text-primary text-xs font-body hover:underline">+ Ajouter un niveau</button>
      </div>

      {/* Strong Leg Bonus */}
      <div className="card-elevated p-4 space-y-3">
        <h2 className="font-heading font-bold text-foreground flex items-center gap-2"><TrendingUp className="w-5 h-5" /> Strong Leg Bonus</h2>
        <div className="flex items-center gap-3">
          <span className="text-sm font-body text-muted-foreground">Pourcentage sur la jambe la plus forte :</span>
          <input type="number" step="0.5" value={strongLegPct} onChange={e => setStrongLegPct(Number(e.target.value))}
            className="w-20 px-3 py-2 rounded-lg border border-input bg-background text-foreground font-body text-sm" />
          <span className="text-sm text-muted-foreground">%</span>
        </div>
      </div>

      {/* Revenue Caps */}
      <div className="card-elevated p-4 space-y-3">
        <h2 className="font-heading font-bold text-foreground flex items-center gap-2"><Shield className="w-5 h-5" /> Plafonds de revenus</h2>
        <div className="space-y-2">
          {revenueCaps.map((cap, i) => (
            <div key={i} className="flex items-center gap-3 flex-wrap">
              <span className="text-sm font-body text-foreground w-36">{CAREER_LABELS[cap.career] || cap.career}</span>
              <input type="number" value={cap.min} onChange={e => {
                const c = [...revenueCaps]; c[i] = { ...c[i], min: Number(e.target.value) }; setRevenueCaps(c);
              }} className="w-24 px-3 py-2 rounded-lg border border-input bg-background text-foreground font-body text-sm" placeholder="Min $" />
              <span className="text-xs text-muted-foreground">à</span>
              <input type="number" value={cap.max} onChange={e => {
                const c = [...revenueCaps]; c[i] = { ...c[i], max: Number(e.target.value) }; setRevenueCaps(c);
              }} className="w-24 px-3 py-2 rounded-lg border border-input bg-background text-foreground font-body text-sm" placeholder="Max $" />
              <span className="text-xs text-muted-foreground">$/semaine</span>
            </div>
          ))}
        </div>
      </div>

      {/* Save */}
      <button onClick={saveConfig} disabled={saving}
        className="btn-gold flex items-center gap-2 !py-3">
        <Save className="w-4 h-4" /> {saving ? "Sauvegarde..." : "Sauvegarder la configuration MSN"}
      </button>

      {/* Recent coins */}
      <div className="card-elevated p-4 space-y-3">
        <h2 className="font-heading font-bold text-foreground">Derniers MSN Coins distribués</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm font-body">
            <thead><tr className="border-b border-border text-muted-foreground">
              <th className="text-left py-2 px-3">Date</th>
              <th className="text-left py-2 px-3">Utilisateur</th>
              <th className="text-center py-2 px-3">Coins</th>
              <th className="text-center py-2 px-3">Converti</th>
            </tr></thead>
            <tbody>
              {recentCoins.map((c: any) => (
                <tr key={c.id} className="border-b border-border/50">
                  <td className="py-2 px-3 text-xs">{new Date(c.created_at).toLocaleDateString("fr-FR")}</td>
                  <td className="py-2 px-3">{(c as any).profiles?.first_name || "—"} {(c as any).profiles?.last_name || ""}</td>
                  <td className="py-2 px-3 text-center font-bold text-primary">{c.coins}</td>
                  <td className="py-2 px-3 text-center">{c.is_converted ? "✅" : "⏳"}</td>
                </tr>
              ))}
              {recentCoins.length === 0 && <tr><td colSpan={4} className="py-6 text-center text-muted-foreground">Aucun coin distribué</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminMSN;
