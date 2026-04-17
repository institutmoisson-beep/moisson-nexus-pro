import { useAuth } from "@/contexts/AuthContext";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { useEffect, useState, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  LayoutDashboard, Wallet, Package, Users, User, Shield,
  LogOut, Menu, X, UserCheck, Store, ShoppingBag, Briefcase, Flame, HandshakeIcon, Globe, MapPin
} from "lucide-react";
import InstallPWA from "@/components/InstallPWA";
import logo from "@/assets/logo-moisson.png";

const NAV_ITEMS = [
  { path: "/dashboard", label: "Tableau de bord", icon: LayoutDashboard },
  { path: "/portefeuille", label: "Portefeuille", icon: Wallet },
  { path: "/msn-wallet", label: "MSN Coins 🔥", icon: Flame },
  { path: "/packs", label: "Packs", icon: Package },
  { path: "/vente-mandat", label: "Vente Mandat 🏬", icon: HandshakeIcon },
  { path: "/commandes", label: "Commandes", icon: ShoppingBag },
  { path: "/reseau", label: "Mon Réseau", icon: Users },
  { path: "/profil", label: "Profil", icon: User },
  { path: "/moissonneurs-pros", label: "Pros", icon: UserCheck },
  { path: "/stand", label: "Stand", icon: Store },
];

const STAFF_ROLE_LABELS: Record<string, string> = {
  financier: "Financier",
  gestion_packs: "Gestion Packs",
  gestion_stand: "Gestion Stand",
  informaticien: "Informaticien",
  commercial: "Commercial",
  communication: "Communication",
};

const DashboardLayout = ({ children }: { children: ReactNode }) => {
  const { user, signOut, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isAdmin, setIsAdmin] = useState(false);
  const [staffRoles, setStaffRoles] = useState<string[]>([]);
  const [mobileMenu, setMobileMenu] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const [hasPaysRole, setHasPaysRole] = useState(false);
  const [hasVilleRole, setHasVilleRole] = useState(false);

  useEffect(() => {
    if (!loading && !user) navigate("/connexion");
  }, [user, loading]);

  useEffect(() => {
    if (user) {
      supabase.rpc("has_role", { _user_id: user.id, _role: "admin" }).then(({ data }) => setIsAdmin(!!data));
      supabase.from("profiles").select("first_name, last_name").eq("user_id", user.id).single().then(({ data }) => setProfile(data));
      supabase.from("staff_roles").select("role").eq("user_id", user.id).then(({ data }) => {
        const roles = (data || []).map((r: any) => r.role);
        setStaffRoles(roles);
        setHasPaysRole(roles.includes("moissonneur_pays"));
        setHasVilleRole(roles.includes("moissonneur_ville"));
      });
    }
  }, [user]);

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card sticky top-0 z-50">
        <div className="container mx-auto px-4 md:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => setMobileMenu(!mobileMenu)} className="md:hidden p-1.5 rounded-lg hover:bg-secondary">
              {mobileMenu ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
            <Link to="/dashboard" className="flex items-center gap-2">
              <img src={logo} alt="Institut Moisson" className="w-8 h-8" width={32} height={32} />
              <span className="font-heading text-lg font-bold text-foreground hidden sm:inline">Institut Moisson</span>
            </Link>
          </div>

          <nav className="hidden md:flex items-center gap-1">
            {NAV_ITEMS.map(item => (
              <Link key={item.path} to={item.path}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-body transition-colors ${
                  location.pathname === item.path
                    ? "bg-primary text-primary-foreground font-semibold"
                    : item.path === "/msn-wallet"
                    ? "text-gold hover:bg-gold/10 hover:text-gold font-medium"
                    : item.path === "/vente-mandat"
                    ? "text-harvest-green hover:bg-harvest-green/10 hover:text-harvest-green font-medium"
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                }`}>
                <item.icon className="w-4 h-4" /> {item.label}
              </Link>
            ))}
            {isAdmin && (
              <Link to="/admin" className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-body bg-accent text-accent-foreground font-semibold hover:opacity-90 transition-colors">
                <Shield className="w-4 h-4" /> Admin
              </Link>
            )}
            {staffRoles.length > 0 && !isAdmin && (
              <Link to="/admin" className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-body bg-primary/10 text-primary font-semibold hover:bg-primary/20 transition-colors">
                <Briefcase className="w-4 h-4" /> Gestion
              </Link>
            )}
            {hasPaysRole && (
              <Link to="/moissonneur-pays" className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-body bg-blue-500/10 text-blue-600 font-semibold hover:bg-blue-500/20 transition-colors">
                <Globe className="w-4 h-4" /> Mon Pays
              </Link>
            )}
            {hasVilleRole && (
              <Link to="/moissonneur-ville" className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-body bg-amber-500/10 text-amber-600 font-semibold hover:bg-amber-500/20 transition-colors">
                <MapPin className="w-4 h-4" /> Ma Ville
              </Link>
            )}
          </nav>

          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground font-body hidden sm:inline">
              {profile?.first_name} {profile?.last_name}
            </span>
            <button onClick={handleSignOut} className="text-muted-foreground hover:text-foreground transition-colors">
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {mobileMenu && (
        <div className="md:hidden border-b border-border bg-card">
          <nav className="p-3 space-y-1">
            {NAV_ITEMS.map(item => (
              <Link key={item.path} to={item.path} onClick={() => setMobileMenu(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-body transition-colors ${
                  location.pathname === item.path
                    ? "bg-primary text-primary-foreground font-semibold"
                    : item.path === "/msn-wallet"
                    ? "text-gold hover:bg-gold/10 font-medium"
                    : item.path === "/vente-mandat"
                    ? "text-harvest-green hover:bg-harvest-green/10 font-medium"
                    : "text-muted-foreground hover:bg-secondary"
                }`}>
                <item.icon className="w-4 h-4" /> {item.label}
              </Link>
            ))}
            {isAdmin && (
              <Link to="/admin" onClick={() => setMobileMenu(false)}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-body bg-accent text-accent-foreground font-semibold">
                <Shield className="w-4 h-4" /> Administration
              </Link>
            )}
            {staffRoles.length > 0 && !isAdmin && (
              <Link to="/admin" onClick={() => setMobileMenu(false)}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-body bg-primary/10 text-primary font-semibold">
                <Briefcase className="w-4 h-4" /> Gestion ({staffRoles.filter(r => !["moissonneur_pays","moissonneur_ville"].includes(r)).map(r => STAFF_ROLE_LABELS[r] || r).join(", ")})
              </Link>
            )}
            {hasPaysRole && (
              <Link to="/moissonneur-pays" onClick={() => setMobileMenu(false)}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-body bg-blue-500/10 text-blue-600 font-semibold">
                <Globe className="w-4 h-4" /> Moissonneur Pays
              </Link>
            )}
            {hasVilleRole && (
              <Link to="/moissonneur-ville" onClick={() => setMobileMenu(false)}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-body bg-amber-500/10 text-amber-600 font-semibold">
                <MapPin className="w-4 h-4" /> Moissonneur Ville
              </Link>
            )}
          </nav>
        </div>
      )}

      <main className="container mx-auto px-4 md:px-6 py-6 md:py-8">
        {children}
      </main>

      <InstallPWA />
    </div>
  );
};

export default DashboardLayout;
