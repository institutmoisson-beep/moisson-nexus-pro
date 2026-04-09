import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import logo from "@/assets/logo-moisson.png";

const countries = [
  "Côte d'Ivoire", "Cameroun", "Sénégal", "Mali", "Burkina Faso", "Guinée", "Togo", "Bénin",
  "Niger", "Congo (RDC)", "Congo (Brazzaville)", "Gabon", "Tchad", "Madagascar", "France",
  "Belgique", "Canada", "Suisse", "États-Unis", "Maroc", "Tunisie", "Algérie", "Haïti",
];

const Register = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [searchParams] = useSearchParams();
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    country: "",
    referralCode: searchParams.get("ref") || "",
    password: "",
    confirmPassword: "",
  });
  const [loading, setLoading] = useState(false);
  const { signUp } = useAuth();
  const navigate = useNavigate();

  const updateField = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (form.password !== form.confirmPassword) {
      toast.error("Les mots de passe ne correspondent pas");
      return;
    }

    let referrerId: string | null = null;

    if (form.referralCode.trim()) {
      const { data: referrer } = await supabase
        .from("profiles")
        .select("id")
        .eq("referral_code", form.referralCode.trim().toUpperCase())
        .maybeSingle();

      if (!referrer) {
        toast.error("Code de parrainage invalide");
        return;
      }
      referrerId = referrer.id;
    } else {
      // Check if any profiles exist - if yes, referral code is required
      const { count } = await supabase.from("profiles").select("id", { count: "exact", head: true });
      if (count && count > 0) {
        toast.error("Le code de parrainage est obligatoire");
        return;
      }
    }

    setLoading(true);
    const metadata: Record<string, string> = {
      first_name: form.firstName,
      last_name: form.lastName,
      phone: form.phone,
      country: form.country,
    };
    if (referrerId) metadata.referred_by = referrerId;

    const { error } = await signUp(form.email, form.password, metadata);
    setLoading(false);

    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Compte créé avec succès ! Connectez-vous.");
      navigate("/connexion");
    }
  };

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
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5 font-body">Nom</label>
                <input type="text" placeholder="Votre nom" required value={form.lastName} onChange={(e) => updateField("lastName", e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border border-input bg-background text-foreground font-body focus:ring-2 focus:ring-ring focus:border-transparent outline-none transition-all" />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5 font-body">Prénom</label>
                <input type="text" placeholder="Votre prénom" required value={form.firstName} onChange={(e) => updateField("firstName", e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border border-input bg-background text-foreground font-body focus:ring-2 focus:ring-ring focus:border-transparent outline-none transition-all" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5 font-body">Email</label>
              <input type="email" placeholder="votre@email.com" required value={form.email} onChange={(e) => updateField("email", e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-input bg-background text-foreground font-body focus:ring-2 focus:ring-ring focus:border-transparent outline-none transition-all" />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5 font-body">Contact (téléphone)</label>
              <input type="tel" placeholder="+225 XX XX XX XX XX" value={form.phone} onChange={(e) => updateField("phone", e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-input bg-background text-foreground font-body focus:ring-2 focus:ring-ring focus:border-transparent outline-none transition-all" />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5 font-body">Pays</label>
              <select required value={form.country} onChange={(e) => updateField("country", e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-input bg-background text-foreground font-body focus:ring-2 focus:ring-ring focus:border-transparent outline-none transition-all">
                <option value="">Sélectionner votre pays</option>
                {countries.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5 font-body">
                Code de Parrainage
              </label>
              <input type="text" placeholder="MOI-XXXXXX" value={form.referralCode} onChange={(e) => updateField("referralCode", e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-input bg-background text-foreground font-body focus:ring-2 focus:ring-ring focus:border-transparent outline-none transition-all" />
              <p className="text-xs text-muted-foreground mt-1 font-body">Demandez-le à votre parrain</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5 font-body">Mot de passe</label>
              <div className="relative">
                <input type={showPassword ? "text" : "password"} placeholder="Créer un mot de passe" required value={form.password} onChange={(e) => updateField("password", e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border border-input bg-background text-foreground font-body focus:ring-2 focus:ring-ring focus:border-transparent outline-none transition-all pr-12" />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5 font-body">Confirmer le mot de passe</label>
              <input type="password" placeholder="Confirmer le mot de passe" required value={form.confirmPassword} onChange={(e) => updateField("confirmPassword", e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-input bg-background text-foreground font-body focus:ring-2 focus:ring-ring focus:border-transparent outline-none transition-all" />
            </div>

            <button type="submit" disabled={loading} className="btn-gold w-full !text-base disabled:opacity-50">
              {loading ? "Création..." : "🌱 Créer mon compte Moissonneur"}
            </button>
          </form>

          <p className="text-center text-sm text-muted-foreground mt-6 font-body">
            Déjà Moissonneur ?{" "}
            <Link to="/connexion" className="text-primary font-semibold hover:underline">Se connecter</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
