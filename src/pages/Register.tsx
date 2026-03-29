import { useState } from "react";
import { Link } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import logo from "@/assets/logo-moisson.png";

const countries = [
  "Côte d'Ivoire", "Cameroun", "Sénégal", "Mali", "Burkina Faso", "Guinée", "Togo", "Bénin",
  "Niger", "Congo (RDC)", "Congo (Brazzaville)", "Gabon", "Tchad", "Madagascar", "France",
  "Belgique", "Canada", "Suisse", "États-Unis", "Maroc", "Tunisie", "Algérie", "Haïti",
];

const Register = () => {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="min-h-screen flex items-center justify-center bg-secondary/30 px-4 py-12">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-3 mb-6">
            <img src={logo} alt="Institut Moisson" className="w-12 h-12" width={48} height={48} />
            <span className="font-heading text-2xl font-bold text-foreground">Institut Moisson</span>
          </Link>
          <h1 className="text-3xl font-heading font-bold text-foreground mb-2">Devenir Moissonneur</h1>
          <p className="text-muted-foreground font-body">Unis pour prospérer & protéger</p>
        </div>

        <div className="card-elevated">
          <form className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5 font-body">Nom</label>
                <input
                  type="text"
                  placeholder="Votre nom"
                  className="w-full px-4 py-3 rounded-lg border border-input bg-background text-foreground font-body focus:ring-2 focus:ring-ring focus:border-transparent outline-none transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5 font-body">Prénom</label>
                <input
                  type="text"
                  placeholder="Votre prénom"
                  className="w-full px-4 py-3 rounded-lg border border-input bg-background text-foreground font-body focus:ring-2 focus:ring-ring focus:border-transparent outline-none transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5 font-body">Email</label>
              <input
                type="email"
                placeholder="votre@email.com"
                className="w-full px-4 py-3 rounded-lg border border-input bg-background text-foreground font-body focus:ring-2 focus:ring-ring focus:border-transparent outline-none transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5 font-body">Contact (téléphone)</label>
              <input
                type="tel"
                placeholder="+225 XX XX XX XX XX"
                className="w-full px-4 py-3 rounded-lg border border-input bg-background text-foreground font-body focus:ring-2 focus:ring-ring focus:border-transparent outline-none transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5 font-body">Pays</label>
              <select className="w-full px-4 py-3 rounded-lg border border-input bg-background text-foreground font-body focus:ring-2 focus:ring-ring focus:border-transparent outline-none transition-all">
                <option value="">Sélectionner votre pays</option>
                {countries.map((country) => (
                  <option key={country} value={country}>{country}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5 font-body">
                Code de Parrainage <span className="text-destructive">*</span>
              </label>
              <input
                type="text"
                placeholder="Code de votre parrain"
                required
                className="w-full px-4 py-3 rounded-lg border border-input bg-background text-foreground font-body focus:ring-2 focus:ring-ring focus:border-transparent outline-none transition-all"
              />
              <p className="text-xs text-muted-foreground mt-1 font-body">
                Obligatoire — demandez-le à votre parrain
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5 font-body">Mot de passe</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Créer un mot de passe"
                  className="w-full px-4 py-3 rounded-lg border border-input bg-background text-foreground font-body focus:ring-2 focus:ring-ring focus:border-transparent outline-none transition-all pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5 font-body">Confirmer le mot de passe</label>
              <input
                type="password"
                placeholder="Confirmer le mot de passe"
                className="w-full px-4 py-3 rounded-lg border border-input bg-background text-foreground font-body focus:ring-2 focus:ring-ring focus:border-transparent outline-none transition-all"
              />
            </div>

            <button type="submit" className="btn-gold w-full !text-base">
              🌱 Créer mon compte Moissonneur
            </button>
          </form>

          <p className="text-center text-sm text-muted-foreground mt-6 font-body">
            Déjà Moissonneur ?{" "}
            <Link to="/connexion" className="text-primary font-semibold hover:underline">
              Se connecter
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
