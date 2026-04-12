import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Package, Search, ChevronLeft, ChevronRight } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";

const PacksPage = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<any>(null);
  const [packs, setPacks] = useState<any[]>([]);
  const [sectors, setSectors] = useState<any[]>([]);
  const [selectedSector, setSelectedSector] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => { if (!loading && !user) navigate("/connexion"); }, [user, loading]);
  useEffect(() => { if (user) loadData(); }, [user]);

  const loadData = async () => {
    const [profileRes, packsRes, sectorsRes] = await Promise.all([
      supabase.from("profiles").select("*").eq("user_id", user!.id).single(),
      supabase.from("packs").select("*, partner_companies(name)").eq("is_active", true),
      supabase.from("pack_sectors").select("*").eq("is_active", true),
    ]);
    setProfile(profileRes.data);
    setPacks(packsRes.data || []);
    setSectors(sectorsRes.data || []);
  };

  const filteredPacks = packs.filter(p => {
    const matchSector = !selectedSector || p.sector_id === selectedSector;
    const q = searchQuery.toLowerCase();
    const matchSearch = !q || p.name.toLowerCase().includes(q) ||
      (p.description || "").toLowerCase().includes(q) ||
      (p.partner_companies?.name || "").toLowerCase().includes(q);
    return matchSector && matchSearch;
  });

  if (loading || !profile) {
    return <div className="min-h-screen flex items-center justify-center bg-background"><div className="animate-pulse text-muted-foreground font-body">Chargement...</div></div>;
  }

  return (
    <DashboardLayout>
      <h1 className="text-3xl font-heading font-bold text-foreground mb-2">📦 Packs d'activation</h1>
      <p className="text-muted-foreground font-body mb-6">
        Solde: <span className="font-bold text-primary">{Number(profile.wallet_balance).toLocaleString("fr-FR")} FCFA</span>
        {profile.is_mlm_active && <span className="ml-2 text-xs bg-harvest-green/20 text-harvest-green px-2 py-1 rounded-full">MLM Actif ✓</span>}
      </p>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input placeholder="Rechercher par nom ou entreprise..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-input bg-background text-foreground font-body text-sm" />
        </div>
        <select value={selectedSector} onChange={e => setSelectedSector(e.target.value)}
          className="px-3 py-2.5 rounded-lg border border-input bg-background text-foreground font-body text-sm">
          <option value="">Tous les secteurs</option>
          {sectors.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
      </div>

      {/* Pack Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredPacks.map(pack => (
          <PackCard key={pack.id} pack={pack} onClick={() => navigate(`/packs/${pack.id}`)} />
        ))}
        {filteredPacks.length === 0 && <p className="text-muted-foreground font-body col-span-3 text-center py-12">Aucun pack trouvé</p>}
      </div>
    </DashboardLayout>
  );
};

const PackCard = ({ pack, onClick }: { pack: any; onClick: () => void }) => {
  const [imgIndex, setImgIndex] = useState(0);
  const images: string[] = pack.images || [];

  return (
    <div className="card-elevated flex flex-col cursor-pointer hover:shadow-lg transition-shadow" onClick={onClick}>
      {images.length > 0 && (
        <div className="relative mb-3 rounded-lg overflow-hidden bg-secondary aspect-video">
          <img src={images[imgIndex]} alt={pack.name} className="w-full h-full object-cover" />
          {images.length > 1 && (
            <>
              <button onClick={e => { e.stopPropagation(); setImgIndex((imgIndex - 1 + images.length) % images.length); }}
                className="absolute left-1 top-1/2 -translate-y-1/2 p-1 bg-foreground/50 text-background rounded-full">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button onClick={e => { e.stopPropagation(); setImgIndex((imgIndex + 1) % images.length); }}
                className="absolute right-1 top-1/2 -translate-y-1/2 p-1 bg-foreground/50 text-background rounded-full">
                <ChevronRight className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
      )}
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="font-heading font-bold text-foreground text-lg">{pack.name}</h3>
          {pack.partner_companies?.name && (
            <p className="text-xs text-muted-foreground font-body">par {pack.partner_companies.name}</p>
          )}
        </div>
        <Package className="w-6 h-6 text-primary shrink-0" />
      </div>
      <p className="text-2xl font-heading font-bold text-primary mb-2">{Number(pack.price).toLocaleString("fr-FR")} FCFA</p>
      {pack.description && <p className="text-sm text-muted-foreground font-body mb-3 line-clamp-2">{pack.description}</p>}
      <div className="mt-auto">
        <span className="text-sm text-primary font-semibold font-body">Voir les détails →</span>
      </div>
    </div>
  );
};

export default PacksPage;
