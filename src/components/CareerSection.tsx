const careers = [
  { level: 1, name: "Semeur", condition: "Inscription + achat d'un pack", emoji: "🌱" },
  { level: 2, name: "Cultivateur", condition: "5 directs MLM niveau 3", emoji: "🌿" },
  { level: 3, name: "Moissonneur", condition: "20 directs + volume MLM niveau 5", emoji: "🌾" },
  { level: 4, name: "Guide de Champ", condition: "3 leaders Niveau 5 + bonus mensuel", emoji: "🧭" },
  { level: 5, name: "Maître Moissonneur", condition: "3 Guides de Champ + bonus mensuel", emoji: "⚔️" },
  { level: 6, name: "Grand Moissonneur", condition: "Réseau international + revenus passifs", emoji: "👑" },
  { level: 7, name: "Ambassadeur Moisson", condition: "5 Grands Moissonneurs actifs", emoji: "🏅" },
  { level: 8, name: "Stratège Moisson", condition: "Réseau multi-pays + volume exceptionnel", emoji: "🎯" },
  { level: 9, name: "Élite Moisson", condition: "Top 1% du réseau mondial", emoji: "💎" },
  { level: 10, name: "Guide Moissonneur", condition: "Rang suprême + héritage de réseau", emoji: "🏆" },
];

const CareerSection = () => {
  return (
    <section id="carrieres" className="py-24 bg-secondary/50">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <p className="text-accent-foreground font-semibold text-sm uppercase tracking-widest mb-3 font-body">
            🏆 Votre parcours
          </p>
          <h2 className="text-3xl md:text-5xl font-heading font-bold text-foreground mb-4">
            Profils de <span className="text-gradient-gold">Carrière</span>
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto font-body text-lg">
            Gravissez les échelons et débloquez des bonus exclusifs à chaque niveau.
          </p>
        </div>

        <div className="grid gap-3 max-w-3xl mx-auto">
          {careers.map((career) => (
            <div
              key={career.level}
              className="flex items-center gap-4 p-4 rounded-xl bg-card border border-border hover:border-primary/30 transition-all group"
            >
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-lg">
                {career.emoji}
              </div>
              <div className="flex-shrink-0 w-8 text-center">
                <span className="text-xs font-bold text-muted-foreground font-body">N{career.level}</span>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-heading font-semibold text-foreground group-hover:text-primary transition-colors">
                  {career.name}
                </h3>
                <p className="text-sm text-muted-foreground font-body truncate">{career.condition}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default CareerSection;
