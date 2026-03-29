import { useState } from "react";
import { Link } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import logo from "@/assets/logo-moisson.png";

const Login = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [loginMethod, setLoginMethod] = useState<"email" | "code">("email");

  return (
    <div className="min-h-screen flex items-center justify-center bg-secondary/30 px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-3 mb-6">
            <img src={logo} alt="Institut Moisson" className="w-12 h-12" width={48} height={48} />
            <span className="font-heading text-2xl font-bold text-foreground">Institut Moisson</span>
          </Link>
          <h1 className="text-3xl font-heading font-bold text-foreground mb-2">Bon retour, Moissonneur</h1>
          <p className="text-muted-foreground font-body">Connectez-vous à votre espace</p>
        </div>

        <div className="card-elevated">
          {/* Toggle */}
          <div className="flex rounded-lg bg-secondary p-1 mb-6">
            <button
              onClick={() => setLoginMethod("email")}
              className={`flex-1 py-2.5 text-sm font-semibold rounded-md transition-all font-body ${
                loginMethod === "email"
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground"
              }`}
            >
              Email
            </button>
            <button
              onClick={() => setLoginMethod("code")}
              className={`flex-1 py-2.5 text-sm font-semibold rounded-md transition-all font-body ${
                loginMethod === "code"
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground"
              }`}
            >
              Code Moissonneur
            </button>
          </div>

          <form className="space-y-4">
            {loginMethod === "email" ? (
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5 font-body">Email</label>
                <input
                  type="email"
                  placeholder="votre@email.com"
                  className="w-full px-4 py-3 rounded-lg border border-input bg-background text-foreground font-body focus:ring-2 focus:ring-ring focus:border-transparent outline-none transition-all"
                />
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5 font-body">Code Moissonneur</label>
                <input
                  type="text"
                  placeholder="MOI-XXXXX"
                  className="w-full px-4 py-3 rounded-lg border border-input bg-background text-foreground font-body focus:ring-2 focus:ring-ring focus:border-transparent outline-none transition-all"
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5 font-body">Mot de passe</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
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

            <button type="submit" className="btn-hero w-full !text-base">
              Se connecter
            </button>
          </form>

          <p className="text-center text-sm text-muted-foreground mt-6 font-body">
            Pas encore Moissonneur ?{" "}
            <Link to="/inscription" className="text-primary font-semibold hover:underline">
              S'inscrire
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
