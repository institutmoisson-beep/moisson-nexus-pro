import { useAuth } from "@/contexts/AuthContext";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { useEffect, useState, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { LayoutDashboard, Wallet, Package, Users, User, Shield, LogOut, Menu, X } from "lucide-react";
import logo from "@/assets/logo-moisson.png";

const NAV_ITEMS = [
  { path: "/dashboard", label: "Tableau de bord", icon: LayoutDashboard },
  { path: "/portefeuille", label: "Portefeuille", icon: Wallet },
  { path: "/packs", label: "Packs", icon: Package },
  { path: "/reseau", label: "Mon Réseau", icon: Users },
  { path: "/profil", label: "Profil", icon: User },
];

const DashboardLayout = ({ children }: { children: ReactNode }) => {
  const { user, signOut, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isAdmin, setIsAdmin] = useState(false);
  const [mobileMenu, setMobileMenu] = useState(false);
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    if (!loading && !user) navigate("/connexion");
  }, [user, loading]);

  useEffect(() => {
    if (user) {
      supabase.rpc("has_role", { _user_id: user.id, _role: "admin" }).then(({ data }) => setIsAdmin(!!data));
      supabase.from("profiles").select("first_name, last_name").eq("user_id", user.id).single().then(({ data }) => setProfile(data));
    }
  }, [user]);

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
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

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1">
            {NAV_ITEMS.map(item => (
              <Link key={item.path} to={item.path}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-body transition-colors ${
                  location.pathname === item.path ? "bg-primary text-primary-foreground font-semibold" : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                }`}>
                <item.icon className="w-4 h-4" /> {item.label}
              </Link>
            ))}
            {isAdmin && (
              <Link to="/admin" className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-body bg-accent text-accent-foreground font-semibold hover:opacity-90 transition-colors">
                <Shield className="w-4 h-4" /> Admin
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

      {/* Mobile Nav */}
      {mobileMenu && (
        <div className="md:hidden border-b border-border bg-card">
          <nav className="p-3 space-y-1">
            {NAV_ITEMS.map(item => (
              <Link key={item.path} to={item.path} onClick={() => setMobileMenu(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-body transition-colors ${
                  location.pathname === item.path ? "bg-primary text-primary-foreground font-semibold" : "text-muted-foreground hover:bg-secondary"
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
          </nav>
        </div>
      )}

      {/* Content */}
      <main className="container mx-auto px-4 md:px-6 py-6 md:py-8">
        {children}
      </main>
    </div>
  );
};

export default DashboardLayout;
