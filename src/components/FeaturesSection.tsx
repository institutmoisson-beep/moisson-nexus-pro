import { Users, Wallet, TrendingUp, Shield, Globe, Award } from "lucide-react";

const features = [
  {
    icon: Users,
    title: "Réseau Binaire Puissant",
    description: "Construisez votre réseau avec un système binaire et gagnez des commissions sur un nombre infini de niveaux.",
  },
  {
    icon: Wallet,
    title: "Portefeuille Intégré",
    description: "Rechargez et retirez facilement via Mobile Money, crypto-monnaies, PayPal et plus encore.",
  },
  {
    icon: TrendingUp,
    title: "Commissions Automatiques",
    description: "Recevez vos commissions instantanément dans votre portefeuille dès qu'un filleul active un pack.",
  },
  {
    icon: Award,
    title: "Profils de Carrière",
    description: "10 niveaux de progression du Semeur au Guide Moissonneur avec des bonus à chaque étape.",
  },
  {
    icon: Globe,
    title: "Réseau International",
    description: "Conversion automatique des devises et partenaires du monde entier à votre portée.",
  },
  {
    icon: Shield,
    title: "Communauté Solidaire",
    description: "Être Moissonneur, c'est appartenir à une famille qui s'entraide et protège ses membres.",
  },
];

const FeaturesSection = () => {
  return (
    <section id="opportunite" className="py-24 bg-background">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <p className="text-primary font-semibold text-sm uppercase tracking-widest mb-3 font-body">
            L'opportunité
          </p>
          <h2 className="text-3xl md:text-5xl font-heading font-bold text-foreground mb-4">
            Pourquoi choisir <span className="text-gradient-primary">Institut Moisson</span> ?
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto font-body text-lg">
            Un système MLM 2.1 révolutionnaire qui facilite l'adhésion et la réussite de chaque membre.
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
      </div>
    </section>
  );
};

export default FeaturesSection;
