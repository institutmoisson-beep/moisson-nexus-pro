import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { getPacks, type Pack } from "@/lib/demo-data";
import { Package, TrendingUp, Users, ChevronDown, ChevronUp } from "lucide-react";
import { generateCommissionLevels } from "@/lib/mlm-commission";

const Packs = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [packs, setPacks] = useState<Pack[]>([]);
  const [expandedPack, setExpandedPack] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !user) navigate("/connexion");
  }, [user, loading, navigate]);

  useEffect(() => {
    setPacks(getPacks().filter(p => p.is_active));
  }, []);

  const getCommissionLevels = (pack: Pack) => {
    return generateCommissionLevels(pack.benefit, pack.level1_commission_percent, pack.decay_factor, pack.min_commission);
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-background"><div className="animate-pulse text-muted-foreground font-body">Chargement...</div></div>;
  }

  return (
    <DashboardLayout>
      <h1 className="text-3xl font-heading font-bold text-foreground mb-2">📦 Packs d'activation</h1>
      <p className="text-muted-foreground font-body mb-8">Choisissez un pack pour activer votre compte MLM.</p>

      <div className="bg-linear-to-r from-primary/5 to-gold/5 border border-primary/10 rounded-xl p-5 mb-8">
        <h2 className="font-heading font-bold text-foreground mb-2 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-primary" /> Comment fonctionnent les commissions ?
        </h2>
        <p className="text-sm text-muted-foreground font-body">
          Les commissions sont calculées sur le <strong className="text-gold">bénéfice du pack</strong> et sont <strong className="text-harvest-green">décroissantes</strong> jusqu'à l'infini.
        </p>
      </div>

      {packs.length === 0 ? (
        <div className="text-center py-20">
          <Package className="w-16 h-16 mx-auto text-muted-foreground/30 mb-4" />
          <p className="text-muted-foreground font-body">Aucun pack disponible.</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {packs.map((pack) => {
            const levels = getCommissionLevels(pack);
            const level1Commission = levels[0]?.amount || 0;
            const isExpanded = expandedPack === pack.id;

            return (
              <div key={pack.id} className="card-elevated hover:shadow-lg transition-shadow">
                <div className="mb-4">
                  <h3 className="font-heading font-bold text-xl text-foreground mb-1">{pack.name}</h3>
                  {pack.partner_companies?.name && <p className="text-xs text-muted-foreground font-body">par {pack.partner_companies.name}</p>}
                </div>
                <p className="text-3xl font-heading font-bold text-primary mb-2">{pack.price.toLocaleString("fr-FR")} FCFA</p>
                {pack.description && <p className="text-sm text-muted-foreground font-body mb-4">{pack.description}</p>}

                <div className="bg-harvest-green/10 border border-harvest-green/20 rounded-lg p-4 mb-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Users className="w-4 h-4 text-harvest-green" />
                    <span className="text-sm font-body text-foreground font-semibold">Votre commission directe</span>
                  </div>
                  <p className="text-2xl font-heading font-bold text-harvest-green">{level1Commission.toLocaleString("fr-FR")} FCFA</p>
                </div>

                <button onClick={() => setExpandedPack(isExpanded ? null : pack.id)} className="w-full flex items-center justify-between py-2 text-sm font-body text-muted-foreground hover:text-foreground">
                  <span>Voir les commissions ({levels.length} niveaux)</span>
                  {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>

                {isExpanded && (
                  <div className="border-t border-border pt-4 mt-2">
                    <div className="space-y-2 max-h-48 overflow-y-auto mb-4">
                      {levels.map((level) => (
                        <div key={level.level} className="flex justify-between items-center text-sm font-body">
                          <span className={level.level === 1 ? "text-foreground font-semibold" : "text-muted-foreground"}>Niveau {level.level}</span>
                          <div className="text-right">
                            <span className={level.level === 1 ? "font-semibold text-harvest-green" : "font-semibold text-foreground"}>{level.amount.toLocaleString("fr-FR")} FCFA</span>
                            <span className="text-xs text-muted-foreground ml-2">({level.percentage}%)</span>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="bg-secondary/50 rounded-lg p-3 text-center">
                      <p className="text-xs text-muted-foreground font-body">Total commissions possibles</p>
                      <p className="font-heading font-bold text-gold">{levels.reduce((s, l) => s + l.amount, 0).toLocaleString("fr-FR")} FCFA</p>
                    </div>
                  </div>
                )}

                <button onClick={() => navigate(`/packs/${pack.id}`)} className="btn-hero w-full !text-sm !py-2.5 mt-4">Acheter ce pack →</button>
              </div>
            );
          })}
        </div>
      )}
    </DashboardLayout>
  );
};

export default Packs;
