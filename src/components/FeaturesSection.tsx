import { Link } from "react-router-dom";
import communityImage from "@/assets/community-together.jpg";
import visionImage from "@/assets/vision-unity.jpg";

const FeaturesSection = () => {
  return (
    <>
      {/* Vision Section */}
      <section id="vision" className="py-20 bg-background">
        <div className="container mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <p className="text-primary font-semibold text-sm uppercase tracking-widest mb-3 font-body">Notre Vision</p>
              <h2 className="text-3xl md:text-4xl font-heading font-bold text-foreground mb-6 leading-tight">
                Construire un avenir où <span className="text-primary">personne</span> n'est laissé pour compte
              </h2>
              <p className="text-muted-foreground font-body leading-relaxed mb-6">
                L'Institut Moisson est né d'une vision simple mais puissante : créer un espace où chaque personne
                peut trouver du soutien, de l'entraide et des opportunités pour prospérer. Ensemble, nous formons
                une famille qui partage les mêmes valeurs de solidarité et de réussite collective.
              </p>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-primary/5 border border-primary/10">
                  <p className="text-2xl font-heading font-bold text-primary">🌍</p>
                  <p className="text-sm font-body text-foreground font-semibold mt-2">Communauté mondiale</p>
                  <p className="text-xs text-muted-foreground font-body mt-1">Des membres sur tous les continents</p>
                </div>
                <div className="p-4 rounded-xl bg-gold/5 border border-gold/10">
                  <p className="text-2xl font-heading font-bold text-gold">🤲</p>
                  <p className="text-sm font-body text-foreground font-semibold mt-2">Entraide mutuelle</p>
                  <p className="text-xs text-muted-foreground font-body mt-1">Chaque membre soutient l'autre</p>
                </div>
              </div>
            </div>
            <div className="relative">
              <img src={communityImage} alt="Communauté solidaire" className="rounded-2xl shadow-2xl w-full object-cover aspect-[4/3]" loading="lazy" />
              <div className="absolute -bottom-4 -left-4 bg-card rounded-xl p-4 shadow-lg border border-border">
                <p className="text-sm font-heading font-bold text-foreground">+1000 familles</p>
                <p className="text-xs text-muted-foreground font-body">unies pour prospérer</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Solidarity Section — renforcée */}
      <section id="solidarite" className="py-20 bg-secondary/30">
        <div className="container mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="order-2 md:order-1">
              <img src={visionImage} alt="Solidarité et entraide" className="rounded-2xl shadow-2xl w-full object-cover aspect-[4/3]" loading="lazy" />
            </div>
            <div className="order-1 md:order-2">
              <p className="text-harvest-green font-semibold text-sm uppercase tracking-widest mb-3 font-body">🫂 Cellule de solidarité</p>
              <h2 className="text-3xl md:text-4xl font-heading font-bold text-foreground mb-6 leading-tight">
                Tu n'es <span className="text-harvest-green">jamais seul</span> face à l'adversité
              </h2>
              <p className="text-muted-foreground font-body leading-relaxed mb-6">
                Chez les Moissonneurs, nous avons mis en place une cellule de solidarité pour soutenir
                ceux qui traversent des difficultés. Que tu aies perdu un proche, que tu fasses face à un problème de santé,
                que tu traverses une épreuve financière ou personnelle —
                <strong className="text-foreground"> la famille Moisson est là pour toi, toujours.</strong>
              </p>

              {/* Encart "Tu as perdu ta famille" */}
              <div className="bg-gradient-to-r from-primary/10 to-harvest-green/10 border border-primary/20 rounded-xl p-5 mb-6">
                <p className="text-lg font-heading font-bold text-foreground mb-2">💛 Tu as perdu toute ta famille ?</p>
                <p className="text-sm font-body text-muted-foreground leading-relaxed">
                  Les Moissonneurs deviennent <strong className="text-foreground">ta nouvelle famille</strong>.
                  Personne ne devrait se sentir seul face à la perte, au deuil ou à l'isolement.
                  Rejoins une communauté qui te reconnaît, te valorise et t'accompagne chaque jour.
                </p>
              </div>

              <div className="bg-card rounded-xl p-6 border border-border mb-6">
                <p className="text-lg font-heading font-bold text-foreground mb-3">🌾 Notre promesse de solidarité</p>
                <ul className="space-y-3 text-sm font-body text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <span className="text-harvest-green font-bold mt-0.5">✓</span>
                    <span>Soutien moral et financier aux membres en difficulté</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-harvest-green font-bold mt-0.5">✓</span>
                    <span>Accompagnement dans les moments de perte, de deuil et de maladie</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-harvest-green font-bold mt-0.5">✓</span>
                    <span>Un réseau bienveillant disponible 7j/7 — tu n'es jamais seul</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-harvest-green font-bold mt-0.5">✓</span>
                    <span>Aide à la reconstruction : emploi, logement, ressources partagées</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary font-bold mt-0.5">✓</span>
                    <span><strong className="text-foreground">Tu as perdu ta famille ?</strong> Les Moissonneurs sont ta nouvelle famille — retrouve ici l'appartenance et l'amour</span>
                  </li>
                </ul>
              </div>
              <Link to="/inscription" className="btn-hero inline-flex">
                🤝 Rejoindre la cellule de solidarité
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Opportunity Section */}
      <section id="opportunite" className="py-20 bg-background">
        <div className="container mx-auto px-6 text-center">
          <p className="text-primary font-semibold text-sm uppercase tracking-widest mb-3 font-body">L'opportunité</p>
          <h2 className="text-3xl md:text-4xl font-heading font-bold text-foreground mb-4">
            Comment ça fonctionne ?
          </h2>
          <p className="text-muted-foreground font-body max-w-2xl mx-auto mb-12">
            Un système simple et transparent où chaque membre grandit en aidant les autres à grandir.
          </p>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="p-6 rounded-2xl bg-card border border-border hover:shadow-lg transition-shadow">
              <div className="w-14 h-14 mx-auto mb-4 rounded-xl bg-primary/10 flex items-center justify-center text-2xl">1️⃣</div>
              <h3 className="font-heading font-bold text-foreground mb-2">Rejoignez la famille</h3>
              <p className="text-sm text-muted-foreground font-body">Inscrivez-vous et choisissez un pack d'activation pour démarrer votre aventure.</p>
            </div>
            <div className="p-6 rounded-2xl bg-card border border-border hover:shadow-lg transition-shadow">
              <div className="w-14 h-14 mx-auto mb-4 rounded-xl bg-gold/10 flex items-center justify-center text-2xl">2️⃣</div>
              <h3 className="font-heading font-bold text-foreground mb-2">Partagez & Grandissez</h3>
              <p className="text-sm text-muted-foreground font-body">Invitez d'autres personnes et construisez votre réseau de solidarité.</p>
            </div>
            <div className="p-6 rounded-2xl bg-card border border-border hover:shadow-lg transition-shadow">
              <div className="w-14 h-14 mx-auto mb-4 rounded-xl bg-harvest-green/10 flex items-center justify-center text-2xl">3️⃣</div>
              <h3 className="font-heading font-bold text-foreground mb-2">Prospérez ensemble</h3>
              <p className="text-sm text-muted-foreground font-body">Recevez des commissions automatiques et montez les échelons avec votre communauté.</p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

export default FeaturesSection;
