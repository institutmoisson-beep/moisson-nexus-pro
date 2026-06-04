import { ReactNode, useEffect, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { 
  LayoutDashboard, Wallet, Package, Users, ShoppingCart, 
  UserCircle, LogOut, Menu, X, Store, Truck, Box, Shield,
  Briefcase, FileSignature, Coins, HeartHandshake, AlertTriangle, Building2, Handshake
} from "lucide-react";

const BASE_NAV = [
  { path: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { path: "/portefeuille", label: "Portefeuille", icon: Wallet },
  { path: "/msn-wallet", label: "MSN Coins", icon: Coins },
  { path: "/packs", label: "Packs", icon: Package },
  { path: "/commandes", label: "Commandes", icon: ShoppingCart },
  { path: "/reseau", label: "Réseau", icon: Users },
  { path: "/produits-en-gros", label: "Produits en Gros", icon: Box },
  { path: "/distribution", label: "Distribution", icon: Truck },
  { path: "/stand", label: "Stand", icon: Store },
  { path: "/partenaires", label: "Partenaires", icon: Handshake },
  { path: "/vente-mandat", label: "Vente par Mandat", icon: FileSignature },
  { path: "/porteur-affaires", label: "Porteur d'Affaires", icon: Briefcase },
  { path: "/moissonneurs-pros", label: "Annuaire Pro", icon: Building2 },
  { path: "/cas-urgents", label: "Cas Urgents", icon: AlertTriangle },
  { path: "/fond-communautaire", label: "Fond Communautaire", icon: HeartHandshake },
  { path: "/profil", label: "Profil", icon: UserCircle },
];

const ADMIN_NAV = [
  { path: "/admin", label: "Administration", icon: Shield },
  { path: "/admin/packs", label: "Gestion Packs", icon: Package },
  { path: "/admin/wholesale", label: "Admin Gros", icon: Box },
  { path: "/admin/distribution", label: "Admin Distribution", icon: Truck },
];

const DashboardLayout = ({ children }: { children: ReactNode }) => {
  const { user, signOut, loading, getUserProfile } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenu, setMobileMenu] = useState(false);
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    if (!loading && !user) navigate("/connexion");
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user) {
      setProfile(getUserProfile());
    }
  }, [user, getUserProfile, location.pathname]);

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const isAdmin = profile?.role === "admin";
  const navItems = isAdmin ? [...BASE_NAV, ...ADMIN_NAV] : BASE_NAV;

  const getLinkClass = (_path: string, isActive: boolean) => {
    if (isActive) return "bg-primary text-primary-foreground font-semibold";
    return "text-muted-foreground hover:bg-secondary hover:text-foreground";
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 bg-card/80 backdrop-blur-md border-b border-border">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <img src="/images/logo-moisson.png" alt="Institut Moisson" className="w-8 h-8" width={32} height={32} />
            <span className="font-heading text-lg font-bold text-foreground hidden sm:inline">Institut Moisson</span>
          </Link>

          <nav className="hidden lg:flex items-center gap-1">
            {navItems.map(item => (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-body transition-colors ${getLinkClass(item.path, location.pathname === item.path)}`}
              >
                <item.icon className="w-4 h-4" /> {item.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <span className="text-sm font-body text-muted-foreground hidden md:inline">
              {profile?.first_name} {profile?.last_name}
              {isAdmin && <span className="ml-2 text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full">Admin</span>}
            </span>
            <button onClick={handleSignOut} className="p-2 rounded-lg text-muted-foreground hover:bg-secondary transition-colors" title="Déconnexion">
              <LogOut className="w-4 h-4" />
            </button>
            <button onClick={() => setMobileMenu(!mobileMenu)} className="lg:hidden p-2 rounded-lg text-muted-foreground hover:bg-secondary">
              {mobileMenu ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </header>

      {mobileMenu && (
        <div className="lg:hidden fixed inset-0 top-[57px] z-20 bg-card/95 backdrop-blur-md p-4 overflow-auto">
          <nav className="space-y-1">
            {navItems.map(item => (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setMobileMenu(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-body transition-colors ${getLinkClass(item.path, location.pathname === item.path)}`}
              >
                <item.icon className="w-4 h-4" /> {item.label}
              </Link>
            ))}
          </nav>
        </div>
      )}

      <main className="container mx-auto px-4 py-6 pb-24">
        {children}
      </main>
    </div>
  );
};

export default DashboardLayout;
