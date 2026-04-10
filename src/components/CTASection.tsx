import { Link } from "react-router-dom";

const CTASection = () => {
  return (
    <section className="py-24 relative overflow-hidden">
      <div className="absolute inset-0" style={{ background: "var(--gradient-hero)" }} />
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDE4YzMuMzE0IDAgNiAyLjY4NiA2IDZzLTIuNjg2IDYtNiA2LTYtMi42ODYtNi02IDIuNjg2LTYgNi02eiIvPjwvZz48L2c+PC9zdmc+')] opacity-30" />
      
      <div className="relative z-10 container mx-auto px-6 text-center">
        <h2 className="text-3xl md:text-5xl font-heading font-bold text-primary-foreground mb-6">
          Prêt à rejoindre la <span className="text-gradient-gold">famille</span> ?
        </h2>
        <p className="text-primary-foreground/80 text-lg max-w-xl mx-auto mb-10 font-body">
          Inscrivez-vous maintenant et commencez à bâtir votre avenir avec une communauté qui vous soutient.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link to="/inscription" className="btn-gold text-lg">
            🤝 Rejoindre maintenant
          </Link>
          <Link
            to="/connexion"
            className="inline-flex items-center justify-center rounded-lg px-8 py-4 text-lg font-semibold transition-all duration-300 border-2 border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10"
          >
            J'ai déjà un compte
          </Link>
        </div>
      </div>
    </section>
  );
};

export default CTASection;
