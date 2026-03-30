import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Globe, Phone, Mail, MessageCircle, Facebook, Clock, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import logo from "@/assets/logo-moisson.png";

const PartnersPage = () => {
  const [partners, setPartners] = useState<any[]>([]);
  const [selectedPartner, setSelectedPartner] = useState<any>(null);
  const [packs, setPacks] = useState<any[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const [partnersRes, packsRes] = await Promise.all([
      supabase.from("partner_companies").select("*").eq("is_active", true).order("created_at"),
      supabase.from("packs").select("*").eq("is_active", true),
    ]);
    setPartners(partnersRes.data || []);
    setPacks(packsRes.data || []);
  };

  const getPartnerDuration = (since: string) => {
    const months = Math.floor((Date.now() - new Date(since).getTime()) / (1000 * 60 * 60 * 24 * 30));
    if (months < 1) return "Nouveau partenaire";
    if (months < 12) return `Partenaire depuis ${months} mois`;
    return `Partenaire depuis ${Math.floor(months / 12)} an(s)`;
  };

  const partnerPacks = (partnerId: string) => packs.filter(p => p.partner_company_id === partnerId);

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={logo} alt="Institut Moisson" className="w-8 h-8" width={32} height={32} />
            <span className="font-heading text-lg font-bold text-foreground">Annuaire Partenaires</span>
          </div>
          <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground font-body">
            <ArrowLeft className="w-4 h-4" /> Accueil
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8">
        <h1 className="text-3xl font-heading font-bold text-foreground mb-2">🏢 Nos Entreprises Partenaires</h1>
        <p className="text-muted-foreground font-body mb-8">Découvrez les entreprises qui font confiance à Institut Moisson</p>

        {/* Partner Stands */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {partners.map(partner => (
            <div key={partner.id} className="card-elevated hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setSelectedPartner(partner)}>
              <div className="flex items-center gap-3 mb-4">
                {partner.logo_url ? (
                  <img src={partner.logo_url} alt={partner.name} className="w-14 h-14 rounded-xl object-cover border border-border" />
                ) : (
                  <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center">
                    <span className="text-xl font-bold text-primary">{partner.name.charAt(0)}</span>
                  </div>
                )}
                <div>
                  <h3 className="font-heading font-bold text-foreground">{partner.name}</h3>
                  <p className="text-xs text-muted-foreground font-body flex items-center gap-1">
                    <Clock className="w-3 h-3" /> {getPartnerDuration(partner.partner_since)}
                  </p>
                </div>
              </div>

              {partner.description && <p className="text-sm text-muted-foreground font-body mb-4 line-clamp-3">{partner.description}</p>}

              {(partner.image1_url || partner.image2_url) && (
                <div className="flex gap-2 mb-4">
                  {partner.image1_url && <img src={partner.image1_url} alt="" className="w-1/2 h-24 rounded-lg object-cover" />}
                  {partner.image2_url && <img src={partner.image2_url} alt="" className="w-1/2 h-24 rounded-lg object-cover" />}
                </div>
              )}

              <div className="flex flex-wrap gap-2">
                {partner.whatsapp && (
                  <a href={`https://wa.me/${partner.whatsapp}`} target="_blank" rel="noopener" onClick={e => e.stopPropagation()}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-harvest-green/10 text-harvest-green text-xs font-semibold hover:bg-harvest-green/20 transition-colors">
                    <MessageCircle className="w-3.5 h-3.5" /> WhatsApp
                  </a>
                )}
                {partner.website && (
                  <a href={partner.website.startsWith("http") ? partner.website : `https://${partner.website}`} target="_blank" rel="noopener" onClick={e => e.stopPropagation()}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-primary/10 text-primary text-xs font-semibold hover:bg-primary/20 transition-colors">
                    <Globe className="w-3.5 h-3.5" /> Site web
                  </a>
                )}
                {partner.facebook && (
                  <a href={partner.facebook.startsWith("http") ? partner.facebook : `https://facebook.com/${partner.facebook}`} target="_blank" rel="noopener" onClick={e => e.stopPropagation()}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-blue-500/10 text-blue-600 text-xs font-semibold hover:bg-blue-500/20 transition-colors">
                    <Facebook className="w-3.5 h-3.5" /> Facebook
                  </a>
                )}
              </div>

              {/* Products from this partner */}
              {partnerPacks(partner.id).length > 0 && (
                <div className="mt-4 pt-4 border-t border-border">
                  <p className="text-xs font-semibold text-foreground mb-2 font-body">Produits disponibles:</p>
                  {partnerPacks(partner.id).map(pack => (
                    <div key={pack.id} className="flex justify-between text-xs font-body mb-1">
                      <span className="text-muted-foreground">{pack.name}</span>
                      <span className="font-semibold text-primary">{Number(pack.price).toLocaleString("fr-FR")} FCFA</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
          {partners.length === 0 && <p className="text-muted-foreground font-body col-span-3 text-center py-12">Aucun partenaire pour le moment</p>}
        </div>

        {/* Partner Detail Modal */}
        {selectedPartner && (
          <div className="fixed inset-0 bg-foreground/50 flex items-center justify-center z-50 p-4" onClick={() => setSelectedPartner(null)}>
            <div className="bg-card rounded-xl border border-border p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
              <div className="flex items-center gap-4 mb-4">
                {selectedPartner.logo_url ? (
                  <img src={selectedPartner.logo_url} alt={selectedPartner.name} className="w-16 h-16 rounded-xl object-cover border border-border" />
                ) : (
                  <div className="w-16 h-16 rounded-xl bg-primary/10 flex items-center justify-center">
                    <span className="text-2xl font-bold text-primary">{selectedPartner.name.charAt(0)}</span>
                  </div>
                )}
                <div>
                  <h2 className="text-xl font-heading font-bold text-foreground">{selectedPartner.name}</h2>
                  <p className="text-sm text-muted-foreground font-body">{getPartnerDuration(selectedPartner.partner_since)}</p>
                </div>
              </div>

              {selectedPartner.description && <p className="text-sm text-foreground font-body mb-4">{selectedPartner.description}</p>}

              {(selectedPartner.image1_url || selectedPartner.image2_url) && (
                <div className="flex gap-2 mb-4">
                  {selectedPartner.image1_url && <img src={selectedPartner.image1_url} alt="" className="w-1/2 h-32 rounded-lg object-cover" />}
                  {selectedPartner.image2_url && <img src={selectedPartner.image2_url} alt="" className="w-1/2 h-32 rounded-lg object-cover" />}
                </div>
              )}

              <div className="space-y-2 mb-4">
                {selectedPartner.phone && <p className="text-sm font-body flex items-center gap-2"><Phone className="w-4 h-4 text-muted-foreground" /> {selectedPartner.phone}</p>}
                {selectedPartner.email && <p className="text-sm font-body flex items-center gap-2"><Mail className="w-4 h-4 text-muted-foreground" /> {selectedPartner.email}</p>}
                {selectedPartner.whatsapp && <a href={`https://wa.me/${selectedPartner.whatsapp}`} target="_blank" className="text-sm font-body flex items-center gap-2 text-harvest-green"><MessageCircle className="w-4 h-4" /> {selectedPartner.whatsapp}</a>}
                {selectedPartner.website && <a href={selectedPartner.website.startsWith("http") ? selectedPartner.website : `https://${selectedPartner.website}`} target="_blank" className="text-sm font-body flex items-center gap-2 text-primary"><Globe className="w-4 h-4" /> {selectedPartner.website}</a>}
              </div>

              <button onClick={() => setSelectedPartner(null)} className="w-full py-2.5 rounded-lg border border-input text-muted-foreground font-body text-sm hover:bg-secondary">
                Fermer
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default PartnersPage;
