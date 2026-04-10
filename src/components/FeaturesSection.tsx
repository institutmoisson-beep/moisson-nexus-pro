import { Heart, Wallet, TrendingUp, Shield, Globe, Award } from "lucide-react";
import communityImage from "@/assets/community-together.jpg";
import visionImage from "@/assets/vision-unity.jpg";

const features = [
  {
    icon: Heart,
    title: "Entraide & Solidarité",
    description: "Une communauté où chaque membre est soutenu, accompagné et encouragé dans son parcours vers la réussite.",
  },
  {
    icon: Wallet,
    title: "Portefeuille Intégré",
    description: "Rechargez et retirez facilement via Mobile Money, crypto-monnaies, PayPal et plus encore.",
  },
  {
    icon: TrendingUp,
    title: "Revenus Partagés",
    description: "Recevez vos commissions instantanément dans votre portefeuille dès qu'un membre de votre réseau progresse.",
  },
  {
    icon: Award,
    title: "Parcours de Croissance",
    description: "10 niveaux de progression avec des bonus à chaque étape pour récompenser votre engagement.",
  },
  {
    icon: Globe,
    title: "Communauté Internationale",
    description: "Des membres du monde entier connectés par une même vision de prospérité collective.",
  },
  {
    icon: Shield,
    title: "Protection & Confiance",
    description: "Être Moissonneur, c'est appartenir à une famille qui protège et valorise chacun de ses membres.",
  },
];

const FeaturesSection = () => {
  return (
    <>
      {/* Vision Section */}
      <section id="vision" className="py-24 bg-background">
        <div className="container mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <p className="text-primary font-semibold text-sm uppercase tracking-widest mb-3 font-body">
                🌍 Notre Vision
              </p>
              <h2 className="text-3xl md:text-5xl font-heading font-bold text-foreground mb-6">
                Bâtir un avenir <span className="text-gradient-gold">solidaire</span>
              </h2>
              <p className="text-muted-foreground font-body text-lg leading-relaxed mb-4">
                Institut Moisson est né d'une conviction profonde : ensemble, nous pouvons transformer nos vies. 
                Notre communauté repose sur l'entraide, le partage et la croissance collective.
              </p>
              <p className="text-muted-foreground font-body text-lg leading-relaxed">
                Chaque membre est un maillon essentiel de cette chaîne de solidarité. 
                En rejoignant la famille Moisson, vous ne rejoignez pas un simple réseau — 
                vous intégrez un mouvement de vie, d'espoir et de prospérité partagée.
              </p>
            </div>
            <div className="rounded-2xl overflow-hidden shadow-lg">
              <img src={visionImage} alt="Notre vision d'unité" className="w-full h-80 object-cover" loading="lazy" width={1920} height={800} />
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="opportunite" className="py-24 bg-secondary/50">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <p className="text-primary font-semibold text-sm uppercase tracking-widest mb-3 font-body">
              L'opportunité
            </p>
            <h2 className="text-3xl md:text-5xl font-heading font-bold text-foreground mb-4">
              Pourquoi choisir <span className="text-gradient-primary">Institut Moisson</span> ?
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto font-body text-lg">
              Un système innovant qui facilite l'entraide et la réussite de chaque membre de la communauté.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <div
                key={feature.title}
                className="card-elevated group hover:scale-[1.02] transition-all duration-300"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                  <feature.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-xl font-heading font-semibold text-foreground mb-2">
                  {feature.title}
                </h3>
                <p className="text-muted-foreground font-body leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>

          {/* Community image */}
          <div className="mt-16 rounded-2xl overflow-hidden shadow-lg">
            <img src={communityImage} alt="Communauté qui collabore ensemble" className="w-full h-64 md:h-80 object-cover" loading="lazy" width={1920} height={1080} />
          </div>
        </div>
      </section>
    </>
  );
};

export default FeaturesSection;
