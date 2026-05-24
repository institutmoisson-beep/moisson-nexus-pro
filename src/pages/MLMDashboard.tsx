import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  TrendingUp, Users, Award, Coins, Copy, RefreshCw,
  ChevronDown, ChevronRight, GitBranch, Zap, Target,
  ArrowLeft, LogOut, Star, Check, Clock
} from "lucide-react";
import { toast } from "sonner";
import logo from "@/assets/logo-moisson.png";
import DashboardLayout from "@/components/DashboardLayout";

// ── Types ─────────────────────────────────────────────────────
interface MLMNode {
  id: string;
  profile_id: string;
  sponsor_id: string | null;
  parent_id: string | null;
  position: "left" | "right" | null;
  current_rank: string;
  accumulated_pv_left: number;
  accumulated_pv_right: number;
  total_pv_left: number;
  total_pv_right: number;
  profile?: { first_name: string; last_name: string; referral_code: string };
  children?: MLMNode[];
}

const RANK_COLORS: Record<string, { bg: string; text: string; icon: string }> = {
  "Distributeur":   { bg: "bg-muted",               text: "text-muted-foreground", icon: "🌱" },
  "Bronze":         { bg: "bg-amber-700/20",         text: "text-amber-700",        icon: "🥉" },
  "Argent":         { bg: "bg-slate-400/20",         text: "text-slate-500",        icon: "🥈" },
  "Or":             { bg: "bg-gold/20",              text: "text-gold",             icon: "🥇" },
  "Diamant":        { bg: "bg-blue-500/20",          text: "text-blue-600",         icon: "💎" },
  "Elite Diamant":  { bg: "bg-primary/20",           text: "text-primary",          icon: "👑" },
};

// ── Composant nœud arbre ──────────────────────────────────────
const TreeNode = ({ node, depth = 0 }: { node: MLMNode; depth?: number }) => {
  const [expanded, setExpanded] = useState(depth < 2);
  const rank = RANK_COLORS[node.current_rank] || RANK_COLORS["Distributeur"];
  const hasChildren = (node.children || []).length > 0;

  return (
    <div className="flex flex-col items-center">
      {/* Node Card */}
      <div className={`relative flex flex-col items-center p-3 rounded-xl border-2 min-w-[120px] max-w-[140px] text-center shadow-sm transition-all
        ${depth === 0 ? "border-primary bg-primary/5 shadow-primary/20 shadow-md" : "border-border bg-card hover:border-primary/50"}
      `}>
        <div className={w-8 h-8 rounded-full flex items-center justify-center text-sm mb-1 ${rank.bg}}>
          <span>{rank.icon}</span>
        </div>
        <p className="text-xs font-bold text-foreground font-body leading-tight truncate w-full">
          {node.profile?.first_name || "?"} {node.profile?.last_name?.charAt(0) || ""}
        </p>
        <span className={text-[9px] px-1.5 py-0.5 rounded-full font-semibold mt-0.5 ${rank.bg} ${rank.text}}>
          {node.current_rank}
        </span>
        {depth > 0 && (
          <div className="flex gap-1 mt-1 text-[9px] font-body text-muted-foreground">
            <span className="bg-blue-500/10 text-blue-600 px-1 rounded">L:{node.accumulated_pv_left}</span>
            <span className="bg-harvest-green/10 text-harvest-green px-1 rounded">R:{node.accumulated_pv_right}</span>
          </div>
        )}
        {hasChildren && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="mt-1 text-muted-foreground hover:text-foreground transition-colors"
          >
            {expanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
          </button>
        )}
      </div>

      {/* Children */}
      {expanded && hasChildren && (
        <>
          <div className="w-px h-5 bg-border" />
          <div className="flex gap-6 relative">
            {node.children!.length === 2 && (
              <div className="absolute top-0 left-1/2 -translate-x-1/2 h-px bg-border" style={{ width: "calc(100% - 70px)" }} />
            )}
            {node.children!.map(child => (
              <div key={child.id} className="flex flex-col items-center">
                <div className="w-px h-5 bg-border" />
                <div className="text-[9px] font-body text-muted-foreground mb-1 bg-secondary px-1.5 py-0.5 rounded-full">
                  {child.position === "left" ? "← G" : "D →"}
                </div>
                <TreeNode node={child} depth={depth + 1} />
              </div>
            ))}
            {/* Slots vides */}
            {node.children!.length === 1 && (
              <div className="flex flex-col items-center">
                <div className="w-px h-5 bg-border" />
                <div className="text-[9px] font-body text-muted-foreground mb-1 bg-secondary px-1.5 py-0.5 rounded-full">
                  {node.children![0].position === "left" ? "D →" : "← G"}
                </div>
                <div className="w-[120px] h-[80px] rounded-xl border-2 border-dashed border-border/50 flex items-center justify-center">
                  <span className="text-xs text-muted-foreground font-body">+ Recruter</span>
                </div>
              </div>
            )}
            {node.children!.length === 0 && (
              <>
                {["← G", "D →"].map(lbl => (
                  <div key={lbl} className="flex flex-col items-center">
                    <div className="w-px h-5 bg-border" />
                    <div className="text-[9px] font-body text-muted-foreground mb-1 bg-secondary px-1.5 py-0.5 rounded-full">{lbl}</div>
                    <div className="w-[120px] h-[80px] rounded-xl border-2 border-dashed border-border/50 flex items-center justify-center">
                      <span className="text-xs text-muted-foreground font-body">+ Recruter</span>
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
};

// ── Page principale ────────────────────────────────────────────
const MLMDashboard = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<any>(null);
  const [myNode, setMyNode] = useState<MLMNode | null>(null);
  const [tree, setTree] = useState<MLMNode | null>(null);
  const [commissions, setCommissions] = useState<any[]>([]);
  const [ranks, setRanks] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<"overview" | "tree" | "commissions" | "rank">("overview");
  const [pageLoading, setPageLoading] = useState(true);
  const [totalEarned, setTotalEarned] = useState(0);
  const [pendingAmount, setPendingAmount] = useState(0);

  useEffect(() => { if (!loading && !user) navigate("/connexion"); }, [user, loading]);
  useEffect(() => { if (user) loadAll(); }, [user]);

  const loadAll = async () => {
    setPageLoading(true);
    const [profileRes, nodeRes, commissionsRes, ranksRes, allNodesRes] = await Promise.all([
      supabase.from("profiles").select("*").eq("user_id", user!.id).single(),
      (supabase as any).from("mlm_nodes").select("*, profile:profiles(first_name,last_name,referral_code)").eq("profile_id", user!.id).single(),
      (supabase as any).from("mlm_commissions").select("*").eq("profile_id", user!.id).order("created_at", { ascending: false }).limit(50),
      (supabase as any).from("mlm_ranks").select("*").order("sort_order"),
      (supabase as any).from("mlm_nodes").select("*, profile:profiles(first_name,last_name,referral_code)").order("created_at"),
    ]);

    setProfile(profileRes.data);
    const node = nodeRes.data;
    setMyNode(node);
    setRanks(ranksRes.data || []);

    const comms = commissionsRes.data || [];
    setCommissions(comms);
    setTotalEarned(comms.filter((c: any) => c.status === "paid").reduce((s: number, c: any) => s + Number(c.amount_fcfa), 0));
    setPendingAmount(comms.filter((c: any) => c.status === "pending").reduce((s: number, c: any) => s + Number(c.amount_fcfa), 0));

    // Construire l'arbre
    if (node) {
      const allNodes: MLMNode[] = allNodesRes.data || [];
      const built = buildTree(node.id, allNodes, 0);
      setTree(built);
    }
    setPageLoading(false);
  };

  const buildTree = (nodeId: string, allNodes: MLMNode[], depth: number): MLMNode => {
    const node = allNodes.find(n => n.id === nodeId)!;
    if (!node || depth > 4) return node;
    const children = allNodes.filter(n => n.parent_id === nodeId);
    return { ...node, children: children.map(c => buildTree(c.id, allNodes, depth + 1)) };
  };

  const referralLink = profile ? ${window.location.origin}/inscription?ref=${profile.referral_code} : "";

  const copyLink = () => {
    navigator.clipboard.writeText(referralLink);
    toast.success("Lien de parrainage copié !");
  };

  const currentRankIdx = ranks.findIndex(r => r.name === myNode?.current_rank);
  const nextRank = ranks[currentRankIdx + 1];
  const minLegPV = myNode ? Math.min(myNode.total_pv_left, myNode.total_pv_right) : 0;
  const progressPct = nextRank ? Math.min(100, (minLegPV / nextRank.min_pv_leg) * 100) : 100;

  const COMM_TYPE_LABELS: Record<string, { label: string; color: string }> = {
    direct_referral: { label: "Bonus Direct", color: "text-primary" },
    binary_pair:     { label: "Paire Binaire", color: "text-gold" },
    matching_gen1:   { label: "Coaching Gen.1", color: "text-harvest-green" },
    matching_gen2:   { label: "Coaching Gen.2", color: "text-harvest-green" },
    matching_gen3:   { label: "Coaching Gen.3", color: "text-harvest-green" },
  };

  if (loading || pageLoading) return (
    <DashboardLayout>
      <div className="flex items-center justify-center py-24">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    </DashboardLayout>
  );

  return (
    <DashboardLayout>
      {/* HERO */}
      <div className="relative overflow-hidden rounded-2xl mb-6 p-6 bg-gradient-to-br from-primary via-primary/90 to-gold/60">
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "radial-gradient(circle at 80% 20%, #fff 0%, transparent 50%)" }} />
        <div className="relative z-10 flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <GitBranch className="w-5 h-5 text-white" />
              <span className="text-white/80 text-sm font-body font-semibold uppercase tracking-widest">Plan MLM OlyLife</span>
            </div>
            <h1 className="text-3xl font-heading font-bold text-white mb-1">Mon Réseau MLM 🌿</h1>
            <div className="flex items-center gap-2 mt-2">
              <span className={px-3 py-1 rounded-full text-sm font-bold ${RANK_COLORS[myNode?.current_rank || "Distributeur"]?.bg} ${RANK_COLORS[myNode?.current_rank || "Distributeur"]?.text}}>
                {RANK_COLORS[myNode?.current_rank || "Distributeur"]?.icon} {myNode?.current_rank || "Distributeur"}
              </span>
            </div>
          </div>
          <div className="flex gap-3 flex-wrap">
            {[
              { label: "Gagné total", value: ${totalEarned.toLocaleString("fr-FR")} F, color: "text-gold" },
              { label: "En attente", value: ${pendingAmount.toLocaleString("fr-FR")} F, color: "text-white" },
              { label: "PV Gauche", value: ${Math.round(myNode?.accumulated_pv_left || 0)}, color: "text-blue-200" },
              { label: "PV Droite", value: ${Math.round(myNode?.accumulated_pv_right || 0)}, color: "text-green-200" },
            ].map((s, i) => (
              <div key={i} className="bg-white/15 backdrop-blur-sm rounded-xl px-4 py-3 border border-white/20 text-center min-w-[80px]">
                <p className="text-white/70 text-[10px] font-body mb-1">{s.label}</p>
                <p className={text-base font-heading font-bold ${s.color}}>{s.value}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* LIEN PARRAINAGE */}
      <div className="card-elevated mb-6 border-primary/20 bg-primary/5">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <p className="text-sm font-semibold text-foreground font-body mb-1">🔗 Mon lien de parrainage</p>
            <p className="text-xs text-muted-foreground font-body font-mono truncate max-w-sm">{referralLink}</p>
          </div>
          <button onClick={copyLink} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold font-body hover:opacity-90 transition-all">
            <Copy className="w-4 h-4" /> Copier le lien
          </button>
        </div>
      </div>

      {/* TABS */}
      <div className="flex gap-1 bg-secondary p-1 rounded-xl mb-6 flex-wrap">
        {[
          { key: "overview",     label: "📊 Vue d'ensemble" },
          { key: "tree",         label: "🌳 Arbre Binaire" },
          { key: "commissions",  label: 💰 Commissions (${commissions.length}) },
          { key: "rank",         label: "🏆 Rangs & Progression" },
        ].map(tab => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key as any)}
            className={px-4 py-2.5 rounded-lg text-sm font-body font-semibold transition-all ${activeTab === tab.key ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* ══ OVERVIEW ══ */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          {/* Statistiques */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { icon: <Coins className="w-5 h-5 text-gold" />, label: "Commissions totales", value: ${totalEarned.toLocaleString("fr-FR")} FCFA, bg: "bg-gold/10" },
              { icon: <Clock className="w-5 h-5 text-primary" />, label: "En attente", value: ${pendingAmount.toLocaleString("fr-FR")} FCFA, bg: "bg-primary/10" },
              { icon: <TrendingUp className="w-5 h-5 text-harvest-green" />, label: "PV Total Gauche", value: ${Math.round(myNode?.total_pv_left || 0)}, bg: "bg-harvest-green/10" },
              { icon: <TrendingUp className="w-5 h-5 text-blue-500" />, label: "PV Total Droite", value: ${Math.round(myNode?.total_pv_right || 0)}, bg: "bg-blue-500/10" },
            ].map((s, i) => (
              <div key={i} className="card-elevated p-4">
                <div className={w-10 h-10 rounded-xl ${s.bg} flex items-center justify-center mb-3}>{s.icon}</div>
                <p className="text-xs text-muted-foreground font-body">{s.label}</p>
                <p className="text-xl font-heading font-bold text-foreground mt-1">{s.value}</p>
              </div>
            ))}
          </div>

          {/* Progression vers prochain rang */}
          {nextRank && (
            <div className="card-elevated">
              <h2 className="font-heading font-semibold text-foreground mb-4 flex items-center gap-2">
                <Target className="w-5 h-5 text-primary" /> Progression vers {nextRank.icon} {nextRank.name}
              </h2>
              <div className="mb-3">
                <div className="flex justify-between text-xs text-muted-foreground font-body mb-1.5">
                  <span>PV minimum sur la jambe faible</span>
                  <span className="font-bold">{Math.round(minLegPV)} / {nextRank.min_pv_leg} PV</span>
                </div>
                <div className="h-3 bg-secondary rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-primary to-gold rounded-full transition-all duration-500"
                    style={{ width: ${progressPct}% }} />
                </div>
                <p className="text-xs text-muted-foreground font-body mt-1.5 text-right">{progressPct.toFixed(1)}%</p>
              </div>
              <div className="grid grid-cols-3 gap-3 text-center text-xs font-body">
                <div className="bg-secondary rounded-lg p-2">
                  <p className="text-muted-foreground">Bonus par paire</p>
                  <p className="font-bold text-gold">{Number(nextRank.binary_bonus_fcfa).toLocaleString("fr-FR")} F</p>
                </div>
                <div className="bg-secondary rounded-lg p-2">
                  <p className="text-muted-foreground">Bonus direct</p>
                  <p className="font-bold text-primary">{nextRank.direct_bonus_pct}%</p>
                </div>
                <div className="bg-secondary rounded-lg p-2">
                  <p className="text-muted-foreground">PV restants</p>
                  <p className="font-bold text-foreground">{Math.max(0, nextRank.min_pv_leg - minLegPV).toFixed(0)}</p>
                </div>
              </div>
            </div>
          )}

          {/* Volume PV jambes */}
          <div className="card-elevated">
            <h2 className="font-heading font-semibold text-foreground mb-4 flex items-center gap-2">
              <Zap className="w-5 h-5 text-gold" /> Volume PV actuel (paires en attente)
            </h2>
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: "Jambe Gauche", value: myNode?.accumulated_pv_left || 0, color: "from-blue-500 to-primary", textColor: "text-blue-600" },
                { label: "Jambe Droite", value: myNode?.accumulated_pv_right || 0, color: "from-harvest-green to-green-600", textColor: "text-harvest-green" },
              ].map((leg, i) => {
                const threshold = 100;
                const pairs = Math.floor(leg.value / threshold);
                const pct = (leg.value % threshold) / threshold * 100;
                return (
                  <div key={i} className="bg-secondary/50 rounded-xl p-4">
                    <p className="text-xs text-muted-foreground font-body mb-2">{leg.label}</p>
                    <p className={text-2xl font-heading font-bold ${leg.textColor}}>{Math.round(leg.value)} PV</p>
                    <div className="h-2 bg-muted rounded-full mt-2 overflow-hidden">
                      <div className={h-full bg-gradient-to-r ${leg.color} rounded-full} style={{ width: ${pct}% }} />
                    </div>
                    <p className="text-[10px] text-muted-foreground font-body mt-1">{pairs} paire(s) complète(s) · {Math.round(pct)}% vers la suivante</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Dernières commissions */}
          {commissions.length > 0 && (
            <div className="card-elevated">
              <h2 className="font-heading font-semibold text-foreground mb-4">Dernières commissions</h2>
              <div className="space-y-2">
                {commissions.slice(0, 5).map(c => {
                  const ct = COMM_TYPE_LABELS[c.type] || { label: c.type, color: "text-foreground" };
                  return (
                    <div key={c.id} className="flex items-center justify-between py-2.5 border-b border-border/50 last:border-0">
                      <div>
                        <p className={text-sm font-semibold font-body ${ct.color}}>{ct.label}</p>
                        <p className="text-xs text-muted-foreground font-body">{new Date(c.created_at).toLocaleDateString("fr-FR")}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-heading font-bold text-foreground">+{Number(c.amount_fcfa).toLocaleString("fr-FR")} F</p>
                        <span className={text-[10px] px-2 py-0.5 rounded-full font-semibold ${c.status === "paid" ? "bg-harvest-green/20 text-harvest-green" : "bg-gold/20 text-gold"}}>
                          {c.status === "paid" ? "✓ Payé" : "⏳ En attente"}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
              {commissions.length > 5 && (
                <button onClick={() => setActiveTab("commissions")} className="w-full mt-2 text-sm text-primary font-semibold font-body hover:underline">
                  Voir tout ({commissions.length}) →
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* ══ ARBRE BINAIRE ══ */}
      {activeTab === "tree" && (
        <div className="card-elevated">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-heading font-semibold text-foreground flex items-center gap-2">
              <GitBranch className="w-5 h-5 text-primary" /> Arbre Binaire (4 niveaux)
            </h2>
            <button onClick={loadAll} className="p-2 rounded-lg bg-secondary hover:bg-muted transition-colors">
              <RefreshCw className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>
          <div className="overflow-auto min-h-[300px] py-4">
            {tree ? (
              <div className="flex justify-center min-w-max px-4">
                <TreeNode node={tree} depth={0} />
              </div>
            ) : (
              <div className="text-center py-12">
                <GitBranch className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground font-body">Votre nœud MLM n'est pas encore configuré</p>
                <p className="text-xs text-muted-foreground font-body mt-1">Achetez un pack pour activer votre position dans l'arbre</p>
              </div>
            )}
          </div>
          <div className="mt-4 flex flex-wrap gap-2 justify-center text-xs font-body text-muted-foreground">
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-primary/30 inline-block" /> Vous</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-muted inline-block" /> Distributeur</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-gold/30 inline-block" /> Or+</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-blue-500/30 inline-block" /> Diamant</span>
          </div>
        </div>
      )}

      {/* ══ COMMISSIONS ══ */}
      {activeTab === "commissions" && (
        <div className="space-y-4">
          {/* Résumé */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {Object.entries(COMM_TYPE_LABELS).map(([key, val]) => {
              const total = commissions.filter(c => c.type === key).reduce((s, c) => s + Number(c.amount_fcfa), 0);
              return (
                <div key={key} className="card-elevated p-3 text-center">
                  <p className={text-xs font-semibold font-body ${val.color} mb-1}>{val.label}</p>
                  <p className="text-base font-heading font-bold text-foreground">{total.toLocaleString("fr-FR")} F</p>
                </div>
              );
            })}
          </div>

          {/* Liste */}
          <div className="card-elevated overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm font-body">
                <thead><tr className="border-b border-border text-muted-foreground bg-secondary/30">
                  <th className="text-left py-3 px-4">Date</th>
                  <th className="text-left py-3 px-4">Type</th>
                  <th className="text-right py-3 px-4">Montant</th>
                  <th className="text-left py-3 px-4">Description</th>
                  <th className="text-center py-3 px-4">Statut</th>
                </tr></thead>
                <tbody>
                  {commissions.map(c => {
                    const ct = COMM_TYPE_LABELS[c.type] || { label: c.type, color: "text-foreground" };
                    return (
                      <tr key={c.id} className="border-b border-border/50 hover:bg-secondary/20 transition-colors">
                        <td className="py-2.5 px-4 text-xs text-muted-foreground">{new Date(c.created_at).toLocaleDateString("fr-FR")}</td>
                        <td className="py-2.5 px-4">
                          <span className={text-xs font-semibold ${ct.color}}>{ct.label}</span>
                        </td>
                        <td className="py-2.5 px-4 text-right font-bold text-harvest-green">
                          +{Number(c.amount_fcfa).toLocaleString("fr-FR")} F
                        </td>
                        <td className="py-2.5 px-4 text-xs text-muted-foreground max-w-[200px] truncate">{c.description || "—"}</td>
                        <td className="py-2.5 px-4 text-center">
                          <span className={text-[10px] px-2 py-0.5 rounded-full font-semibold ${c.status === "paid" ? "bg-harvest-green/20 text-harvest-green" : "bg-gold/20 text-gold"}}>
                            {c.status === "paid" ? "✓ Payé" : "⏳ Attente"}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                  {commissions.length === 0 && (
                    <tr><td colSpan={5} className="py-12 text-center text-muted-foreground font-body">
                      Aucune commission pour l'instant. Développez votre réseau !
                    </td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ══ RANGS ══ */}
      {activeTab === "rank" && (
        <div className="space-y-4">
          <div className="card-elevated border-primary/20 bg-primary/5">
            <h2 className="font-heading font-bold text-foreground mb-2">🏆 Système de Rangs OlyLife</h2>
            <p className="text-sm text-muted-foreground font-body">
              Votre rang détermine le <strong>bonus par paire binaire</strong> et le <strong>% de bonus direct</strong>.
              Il évolue automatiquement selon votre volume PV cumulé sur la jambe la plus faible.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {ranks.map(rank => {
              const rankStyle = RANK_COLORS[rank.name] || RANK_COLORS["Distributeur"];
              const isCurrentRank = myNode?.current_rank === rank.name;
              const isAchieved = ranks.findIndex(r => r.name === rank.name) <= currentRankIdx;
              return (
                <div key={rank.id} className={card-elevated relative transition-all ${isCurrentRank ? "border-primary shadow-lg shadow-primary/20" : ""} ${isAchieved ? "opacity-100" : "opacity-60"}}>
                  {isCurrentRank && (
                    <div className="absolute -top-2 -right-2 bg-primary text-primary-foreground text-[10px] font-bold px-2 py-0.5 rounded-full">
                      Votre rang
                    </div>
                  )}
                  {isAchieved && !isCurrentRank && (
                    <div className="absolute -top-2 -right-2 bg-harvest-green text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                      <Check className="w-2.5 h-2.5" /> Atteint
                    </div>
                  )}
                  <div className="flex items-center gap-3 mb-4">
                    <div className={w-12 h-12 rounded-xl ${rankStyle.bg} flex items-center justify-center text-2xl}>
                      {rank.icon}
                    </div>
                    <div>
                      <h3 className={font-heading font-bold ${rankStyle.text}}>{rank.name}</h3>
                      <p className="text-xs text-muted-foreground font-body">Min. {rank.min_pv_leg} PV / jambe</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-center text-xs font-body">
                    <div className="bg-secondary rounded-lg p-2.5">
                      <p className="text-muted-foreground">Bonus binaire</p>
                      <p className="font-bold text-gold text-sm mt-0.5">{Number(rank.binary_bonus_fcfa).toLocaleString("fr-FR")} F</p>
                      <p className="text-[10px] text-muted-foreground">par paire</p>
                    </div>
                    <div className="bg-secondary rounded-lg p-2.5">
                      <p className="text-muted-foreground">Bonus direct</p>
                      <p className="font-bold text-primary text-sm mt-0.5">{rank.direct_bonus_pct}%</p>
                      <p className="text-[10px] text-muted-foreground">sur vente directe</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="card-elevated">
            <h3 className="font-heading font-semibold text-foreground mb-3">💡 Les 3 types de bonus</h3>
            <div className="space-y-3">
              {[
                { title: "Bonus Direct (Parrainage)", desc: "Quand vous recrutez un membre qui achète un pack, vous recevez immédiatement votre % sur le montant.", color: "bg-primary/10 border-primary/20", icon: "👥" },
                { title: "Bonus Binaire (Paire)", desc: "Chaque achat génère des PV. Quand vous avez 100 PV à gauche ET 100 PV à droite, vous recevez le bonus de paire selon votre rang.", color: "bg-gold/10 border-gold/20", icon: "⚡" },
                { title: "Matching / Coaching (Génération)", desc: "Quand vos filleuls reçoivent un bonus binaire, vous recevez automatiquement 10% (G1), 5% (G2), 2.5% (G3) de leur gain.", color: "bg-harvest-green/10 border-harvest-green/20", icon: "🌿" },
              ].map((b, i) => (
                <div key={i} className={p-4 rounded-xl border ${b.color}}>
                  <p className="font-semibold text-foreground font-body text-sm flex items-center gap-2 mb-1">
                    <span className="text-lg">{b.icon}</span> {b.title}
                  </p>
                  <p className="text-xs text-muted-foreground font-body">{b.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default MLMDashboard;
