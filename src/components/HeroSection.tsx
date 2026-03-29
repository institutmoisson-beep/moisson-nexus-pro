import { Link } from "react-router-dom";
import heroImage from "@/assets/hero-harvest.jpg";
import logo from "@/assets/logo-moisson.png";

const HeroSection = () => {
  return (
    <section className="relative min-h-screen flex items-center overflow-hidden">
      {/* Background image */}
      <div className="absolute inset-0">
        <img
          src={heroImage}
          alt="Champ de blé doré au coucher du soleil"
          className="w-full h-full object-cover"
          width={1920}
          height={1080}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-foreground/80 via-foreground/50 to-transparent" />
      </div>

      {/* Navigation */}
      <nav className="absolute top-0 left-0 right-0 z-20 px-6 py-4">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={logo} alt="Institut Moisson" className="w-10 h-10" width={40} height={40} />
            <span className="font-heading text-xl font-bold text-primary-foreground">Institut Moisson</span>
          </div>
          <div className="hidden md:flex items-center gap-6">
            <a href="#vision" className="text-primary-foreground/80 hover:text-primary-foreground transition-colors font-body text-sm">
              Vision
            </a>
            <a href="#opportunite" className="text-primary-foreground/80 hover:text-primary-foreground transition-colors font-body text-sm">
              Opportunité
            </a>
            <a href="#carrieres" className="text-primary-foreground/80 hover:text-primary-foreground transition-colors font-body text-sm">
              Carrières
            </a>
            <Link to="/connexion" className="text-primary-foreground/80 hover:text-primary-foreground transition-colors font-body text-sm">
              Connexion
            </Link>
            <Link to="/inscription" className="btn-gold text-sm !px-5 !py-2.5">
              Devenir Moissonneur
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero content */}
      <div className="relative z-10 container mx-auto px-6 pt-24">
        <div className="max-w-2xl animate-fade-up">
          <p className="text-accent font-semibold text-sm uppercase tracking-widest mb-4 font-body">
            🌾 Unis pour prospérer & protéger
          </p>
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-heading font-bold text-primary-foreground leading-tight mb-6">
            La Moisson de{" "}
            <span className="text-gradient-gold">votre Succès</span>{" "}
            commence ici
          </h1>
          <p className="text-lg md:text-xl text-primary-foreground/80 mb-10 font-body leading-relaxed max-w-xl">
            Rejoignez une communauté de moissonneurs qui s'entraident, créent des opportunités
            et bâtissent ensemble un avenir prospère grâce au marketing de réseau.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <Link to="/inscription" className="btn-gold">
              🌱 Devenir Moissonneur
            </Link>
            <Link to="/connexion" className="btn-hero !bg-primary-foreground/10 backdrop-blur-sm border border-primary-foreground/20">
              Se connecter
            </Link>
          </div>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 animate-bounce">
        <div className="w-6 h-10 rounded-full border-2 border-primary-foreground/40 flex items-start justify-center p-1.5">
          <div className="w-1.5 h-3 rounded-full bg-primary-foreground/60" />
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
