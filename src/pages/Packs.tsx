import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Package, ShoppingCart, MapPin, Download, Search, ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import DashboardLayout from "@/components/DashboardLayout";
import { generateGuaranteeContract } from "@/lib/generateContract";

const PacksPage = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<any>(null);
  const [packs, setPacks] = useState<any[]>([]);
  const [sectors, setSectors] = useState<any[]>([]);
  const [selectedSector, setSelectedSector] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPack, setSelectedPack] = useState<any>(null);
  const [deliveryForm, setDeliveryForm] = useState({ address: "", city: "", country: "", phone: "", street: "" });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => { if (!loading && !user) navigate("/connexion"); }, [user, loading]);
  useEffect(() => { if (user) loadData(); }, [user]);

  const loadData = async () => {
    const [profileRes, packsRes, sectorsRes] = await Promise.all([
      supabase.from("profiles").select("*").eq("user_id", user!.id).single(),
      supabase.from("packs").select("*, partner_companies(*)").eq("is_active", true),
      supabase.from("pack_sectors").select("*").eq("is_active", true),
    ]);
    setProfile(profileRes.data);
    setPacks(packsRes.data || []);
    setSectors(sectorsRes.data || []);
    if (profileRes.data) {
      setDeliveryForm({
        address: profileRes.data.address || "", city: profileRes.data.city || "",
        country: profileRes.data.country || "", phone: profileRes.data.phone || "",
        street: profileRes.data.street || "",
      });
    }
  };

  const filteredPacks = packs.filter(p => {
    const matchSector = !selectedSector || p.sector_id === selectedSector;
    const matchSearch = !searchQuery || p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.description || "").toLowerCase().includes(searchQuery.toLowerCase());
    return matchSector && matchSearch;
  });

  const handlePurchase = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPack || !profile) return;
    if (Number(profile.wallet_balance) < Number(selectedPack.price)) {
      toast.error("Solde insuffisant ! Rechargez votre portefeuille.");
      return;
    }
    setSubmitting(true);

    const { error: orderError } = await supabase.from("pack_orders").insert({
      user_id: user!.id, pack_id: selectedPack.id, amount_paid: selectedPack.price,
      delivery_address: deliveryForm.address, delivery_city: deliveryForm.city,
      delivery_country: deliveryForm.country, delivery_phone: deliveryForm.phone,
      delivery_street: deliveryForm.street,
    });
    if (orderError) { toast.error("Erreur commande: " + orderError.message); setSubmitting(false); return; }

    const newBalance = Number(profile.wallet_balance) - Number(selectedPack.price);
    await supabase.from("profiles").update({
      wallet_balance: newBalance, is_mlm_active: true,
      address: deliveryForm.address, city: deliveryForm.city, street: deliveryForm.street,
    }).eq("user_id", user!.id);

    await supabase.from("transactions").insert({
      user_id: user!.id, amount: selectedPack.price, type: "pack_purchase" as const,
      status: "approved" as const, description: `Achat pack: ${selectedPack.name}`,
    });

    await distributeCommissions(user!.id, selectedPack.price, selectedPack.commission_percentage);

    toast.success("Pack acheté avec succès ! 🌾");
    setSelectedPack(null);
    setSubmitting(false);
    loadData();
  };

  const distributeCommissions = async (buyerId: string, packPrice: number, _baseCommission: number) => {
    const { data: levels } = await supabase.from("commission_levels").select("*").order("level_number");
    if (!levels || levels.length === 0) return;

    let currentProfileRes = await supabase.from("profiles").select("referred_by, user_id").eq("user_id", buyerId).single();
    let currentProfile = currentProfileRes.data;
    let level = 0;

    while (currentProfile?.referred_by && level < levels.length) {
      const sponsorRes = await supabase.from("profiles").select("*").eq("id", currentProfile.referred_by).single();
      const sponsor = sponsorRes.data;
      if (!sponsor || !sponsor.is_mlm_active) break;

      const commissionAmount = (packPrice * levels[level].percentage) / 100;
      await supabase.from("profiles").update({ wallet_balance: Number(sponsor.wallet_balance) + commissionAmount }).eq("id", sponsor.id);
      await supabase.from("transactions").insert({
        user_id: sponsor.user_id, amount: commissionAmount, type: "commission" as const,
        status: "approved" as const, description: `Commission niveau ${level + 1} - Achat pack`,
        metadata: { buyer_id: buyerId, level: level + 1, pack_price: packPrice },
      });

      currentProfile = { referred_by: sponsor.referred_by, user_id: sponsor.user_id };
      level++;
    }
  };

  const handleDownloadContract = (pack: any) => {
    const memberName = `${profile.first_name} ${profile.last_name}`;
    generateGuaranteeContract(memberName, pack.name, Number(pack.price));
  };

  const getGeolocation = () => {
    if (!navigator.geolocation) { toast.error("Géolocalisation non supportée"); return; }
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        await supabase.from("profiles").update({
          geolocation: { lat: pos.coords.latitude, lng: pos.coords.longitude },
        }).eq("user_id", user!.id);
        toast.success("Position enregistrée !");
      },
      () => toast.error("Impossible d'obtenir la position")
    );
  };

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
          <input placeholder="Rechercher un pack..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-input bg-background text-foreground font-body text-sm" />
        </div>
        <select value={selectedSector} onChange={e => setSelectedSector(e.target.value)}
          className="px-3 py-2.5 rounded-lg border border-input bg-background text-foreground font-body text-sm">
          <option value="">Tous les secteurs</option>
          {sectors.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
      </div>

      {/* Pack Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {filteredPacks.map(pack => (
          <PackCard key={pack.id} pack={pack} onBuy={() => setSelectedPack(pack)} onContract={() => handleDownloadContract(pack)} />
        ))}
        {filteredPacks.length === 0 && <p className="text-muted-foreground font-body col-span-3 text-center py-12">Aucun pack trouvé</p>}
      </div>

      {/* Purchase Modal */}
      {selectedPack && (
        <div className="fixed inset-0 bg-foreground/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-xl border border-border p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-heading font-bold text-foreground mb-4">🛒 Confirmer l'achat</h2>
            <div className="bg-secondary rounded-lg p-4 mb-4">
              <p className="font-heading font-semibold text-foreground">{selectedPack.name}</p>
              <p className="text-2xl font-bold text-primary">{Number(selectedPack.price).toLocaleString("fr-FR")} FCFA</p>
              <p className="text-xs text-muted-foreground font-body mt-1">Solde après achat: {(Number(profile.wallet_balance) - Number(selectedPack.price)).toLocaleString("fr-FR")} FCFA</p>
            </div>

            <form onSubmit={handlePurchase} className="space-y-3">
              <h3 className="font-heading font-semibold text-foreground flex items-center gap-2"><MapPin className="w-4 h-4" /> Adresse de livraison</h3>
              <input placeholder="Pays" value={deliveryForm.country} onChange={e => setDeliveryForm({...deliveryForm, country: e.target.value})}
                className="w-full px-3 py-2.5 rounded-lg border border-input bg-background text-foreground font-body text-sm" />
              <input placeholder="Ville" value={deliveryForm.city} onChange={e => setDeliveryForm({...deliveryForm, city: e.target.value})}
                className="w-full px-3 py-2.5 rounded-lg border border-input bg-background text-foreground font-body text-sm" />
              <input placeholder="Quartier / Rue" value={deliveryForm.street} onChange={e => setDeliveryForm({...deliveryForm, street: e.target.value})}
                className="w-full px-3 py-2.5 rounded-lg border border-input bg-background text-foreground font-body text-sm" />
              <input placeholder="Adresse complète" value={deliveryForm.address} onChange={e => setDeliveryForm({...deliveryForm, address: e.target.value})}
                className="w-full px-3 py-2.5 rounded-lg border border-input bg-background text-foreground font-body text-sm" />
              <input placeholder="Contact sur place" value={deliveryForm.phone} onChange={e => setDeliveryForm({...deliveryForm, phone: e.target.value})}
                className="w-full px-3 py-2.5 rounded-lg border border-input bg-background text-foreground font-body text-sm" />
              <button type="button" onClick={getGeolocation} className="text-xs text-primary font-body underline">
                📍 Activer la géolocalisation
              </button>

              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={submitting || Number(profile.wallet_balance) < Number(selectedPack.price)}
                  className="flex-1 btn-gold !text-sm !py-2.5 disabled:opacity-50">
                  {submitting ? "Achat en cours..." : "Confirmer l'achat"}
                </button>
                <button type="button" onClick={() => setSelectedPack(null)}
                  className="px-4 py-2.5 rounded-lg border border-input text-muted-foreground font-body text-sm hover:bg-secondary">
                  Annuler
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

const PackCard = ({ pack, onBuy, onContract }: { pack: any; onBuy: () => void; onContract: () => void }) => {
  const [imgIndex, setImgIndex] = useState(0);
  const images: string[] = pack.images || [];

  return (
    <div className="card-elevated flex flex-col">
      {/* Image carousel */}
      {images.length > 0 && (
        <div className="relative mb-3 rounded-lg overflow-hidden bg-secondary aspect-video">
          <img src={images[imgIndex]} alt={pack.name} className="w-full h-full object-cover" />
          {images.length > 1 && (
            <>
              <button onClick={() => setImgIndex((imgIndex - 1 + images.length) % images.length)}
                className="absolute left-1 top-1/2 -translate-y-1/2 p-1 bg-foreground/50 text-background rounded-full">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button onClick={() => setImgIndex((imgIndex + 1) % images.length)}
                className="absolute right-1 top-1/2 -translate-y-1/2 p-1 bg-foreground/50 text-background rounded-full">
                <ChevronRight className="w-4 h-4" />
              </button>
              <div className="absolute bottom-1 left-1/2 -translate-x-1/2 flex gap-1">
                {images.map((_, i) => (
                  <div key={i} className={`w-1.5 h-1.5 rounded-full ${i === imgIndex ? "bg-background" : "bg-background/50"}`} />
                ))}
              </div>
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
      {pack.description && <p className="text-sm text-muted-foreground font-body mb-3">{pack.description}</p>}
      {pack.physical_prizes && (
        <div className="bg-secondary rounded-lg p-3 mb-3">
          <p className="text-xs font-semibold text-foreground mb-1 font-body">🎁 Prix physiques inclus:</p>
          <p className="text-xs text-muted-foreground font-body">{pack.physical_prizes}</p>
        </div>
      )}
      <p className="text-xs text-muted-foreground font-body mb-4">Commission: {pack.commission_percentage}%</p>
      <div className="mt-auto space-y-2">
        <button onClick={onBuy} className="btn-gold !text-sm !py-2.5 w-full">
          <ShoppingCart className="w-4 h-4 mr-2" /> Acheter ce pack
        </button>
        <button onClick={onContract}
          className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg border border-input text-sm font-body text-muted-foreground hover:bg-secondary transition-colors">
          <Download className="w-4 h-4" /> Contrat de garantie
        </button>
      </div>
    </div>
  );
};

export default PacksPage;
