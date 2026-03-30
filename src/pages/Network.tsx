import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ZoomIn, ZoomOut, RotateCcw } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";

interface TreeNode {
  id: string;
  first_name: string;
  last_name: string;
  career_level: string;
  is_mlm_active: boolean;
  referral_code: string;
  children: TreeNode[];
}

const NetworkPage = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<any>(null);
  const [tree, setTree] = useState<TreeNode | null>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [networkStats, setNetworkStats] = useState({ total: 0, active: 0, directs: 0 });

  useEffect(() => {
    if (!loading && !user) navigate("/connexion");
  }, [user, loading]);

  useEffect(() => {
    if (user) loadTree();
  }, [user]);

  const loadTree = async () => {
    const { data: myProfile } = await supabase.from("profiles").select("*").eq("user_id", user!.id).single();
    setProfile(myProfile);
    if (!myProfile) return;

    // Load all profiles to build tree
    const { data: allProfiles } = await supabase.from("profiles").select("id, first_name, last_name, career_level, is_mlm_active, referral_code, referred_by");
    if (!allProfiles) return;

    const buildNode = (profileId: string, depth: number): TreeNode => {
      const p = allProfiles.find(pr => pr.id === profileId);
      if (!p) return { id: profileId, first_name: "?", last_name: "", career_level: "semeur", is_mlm_active: false, referral_code: "", children: [] };
      const children = allProfiles.filter(pr => pr.referred_by === profileId);
      return {
        id: p.id,
        first_name: p.first_name,
        last_name: p.last_name,
        career_level: p.career_level,
        is_mlm_active: p.is_mlm_active,
        referral_code: p.referral_code,
        children: children.map(c => buildNode(c.id, depth + 1)),
      };
    };

    const rootTree = buildNode(myProfile.id, 0);
    setTree(rootTree);

    // Stats
    const countNodes = (node: TreeNode): number => 1 + node.children.reduce((sum, c) => sum + countNodes(c), 0);
    const countActive = (node: TreeNode): number => (node.is_mlm_active ? 1 : 0) + node.children.reduce((sum, c) => sum + countActive(c), 0);
    const total = countNodes(rootTree) - 1;
    const active = countActive(rootTree) - (rootTree.is_mlm_active ? 1 : 0);
    setNetworkStats({ total, active, directs: rootTree.children.length });
  };

  const handleMouseDown = (e: React.MouseEvent) => { setDragging(true); setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y }); };
  const handleMouseMove = (e: React.MouseEvent) => { if (dragging) setPan({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y }); };
  const handleMouseUp = () => setDragging(false);

  const levelColors: Record<string, string> = {
    semeur: "bg-muted text-muted-foreground",
    cultivateur: "bg-harvest-green/20 text-harvest-green",
    moissonneur: "bg-primary/20 text-primary",
    guide_de_champ: "bg-gold/20 text-gold",
    maitre_moissonneur: "bg-primary/30 text-primary",
    grand_moissonneur: "bg-gold/30 text-gold",
    ambassadeur_moisson: "bg-primary/40 text-primary",
    stratege_moisson: "bg-gold/40 text-gold",
    elite_moisson: "bg-primary/50 text-primary",
    guide_moissonneur: "bg-gold/50 text-gold",
  };

  const TreeNodeComponent = ({ node, depth = 0 }: { node: TreeNode; depth?: number }) => (
    <div className="flex flex-col items-center">
      <div className={`px-3 py-2 rounded-lg border border-border text-center min-w-[120px] ${node.is_mlm_active ? "bg-card" : "bg-muted/50"}`}>
        <p className="text-xs font-bold text-foreground font-body">{node.first_name} {node.last_name.charAt(0)}.</p>
        <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${levelColors[node.career_level] || "bg-muted text-muted-foreground"}`}>
          {node.career_level.replace(/_/g, " ")}
        </span>
        {!node.is_mlm_active && <p className="text-[9px] text-destructive mt-0.5">Inactif</p>}
      </div>
      {node.children.length > 0 && (
        <>
          <div className="w-px h-4 bg-border" />
          <div className="flex gap-4 relative">
            {node.children.length > 1 && <div className="absolute top-0 left-1/2 -translate-x-1/2 h-px bg-border" style={{ width: `calc(100% - 120px)` }} />}
            {node.children.map(child => (
              <div key={child.id} className="flex flex-col items-center">
                <div className="w-px h-4 bg-border" />
                <TreeNodeComponent node={child} depth={depth + 1} />
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );

  if (loading || !profile) {
    return <div className="min-h-screen flex items-center justify-center bg-background"><div className="animate-pulse text-muted-foreground font-body">Chargement...</div></div>;
  }

  return (
    <DashboardLayout>
      <h1 className="text-3xl font-heading font-bold text-foreground mb-6">🌳 Mon Réseau</h1>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="card-elevated text-center">
          <p className="text-2xl font-heading font-bold text-foreground">{networkStats.directs}</p>
          <p className="text-xs text-muted-foreground font-body">Directs</p>
        </div>
        <div className="card-elevated text-center">
          <p className="text-2xl font-heading font-bold text-foreground">{networkStats.total}</p>
          <p className="text-xs text-muted-foreground font-body">Total réseau</p>
        </div>
        <div className="card-elevated text-center">
          <p className="text-2xl font-heading font-bold text-harvest-green">{networkStats.active}</p>
          <p className="text-xs text-muted-foreground font-body">Actifs MLM</p>
        </div>
      </div>

      {/* Zoom Controls */}
      <div className="flex items-center gap-2 mb-4">
        <button onClick={() => setZoom(z => Math.min(z + 0.2, 3))} className="p-2 rounded-lg bg-secondary text-foreground hover:bg-muted transition-colors">
          <ZoomIn className="w-4 h-4" />
        </button>
        <button onClick={() => setZoom(z => Math.max(z - 0.2, 0.3))} className="p-2 rounded-lg bg-secondary text-foreground hover:bg-muted transition-colors">
          <ZoomOut className="w-4 h-4" />
        </button>
        <button onClick={() => { setZoom(1); setPan({ x: 0, y: 0 }); }} className="p-2 rounded-lg bg-secondary text-foreground hover:bg-muted transition-colors">
          <RotateCcw className="w-4 h-4" />
        </button>
        <span className="text-xs text-muted-foreground font-body ml-2">{Math.round(zoom * 100)}%</span>
      </div>

      {/* Tree View */}
      <div className="card-elevated overflow-hidden" style={{ minHeight: "400px" }}>
        <div
          className="overflow-auto cursor-grab active:cursor-grabbing"
          style={{ minHeight: "400px" }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          <div style={{ transform: `scale(${zoom}) translate(${pan.x / zoom}px, ${pan.y / zoom}px)`, transformOrigin: "top center", transition: dragging ? "none" : "transform 0.2s", padding: "2rem", minWidth: "fit-content" }}>
            {tree ? <TreeNodeComponent node={tree} /> : <p className="text-center text-muted-foreground font-body py-12">Aucun filleul pour le moment</p>}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default NetworkPage;
