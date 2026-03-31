import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import logo from "@/assets/logo-moisson.png";
import {
  Users, Package, Building2, CreditCard, TrendingUp, Award,
  LogOut, ArrowLeft, Wallet, FolderOpen, UserCheck,
  Menu, X
} from "lucide-react";
import AdminOverview from "@/components/admin/AdminOverview";
import AdminUsers from "@/components/admin/AdminUsers";
import AdminTransactions from "@/components/admin/AdminTransactions";
import AdminPacks from "@/components/admin/AdminPacks";
import AdminPartners from "@/components/admin/AdminPartners";
import AdminPayments from "@/components/admin/AdminPayments";
import AdminCommissions from "@/components/admin/AdminCommissions";
import AdminBonuses from "@/components/admin/AdminBonuses";
import AdminSectors from "@/components/admin/AdminSectors";
import AdminProDirectory from "@/components/admin/AdminProDirectory";

type AdminTab = "overview" | "users" | "packs" | "sectors" | "partners" | "transactions" | "payments" | "commissions" | "bonuses" | "pro_directory";

const AdminDashboard = () => {
  const { user, signOut, loading } = useAuth();
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);
  const [checkingRole, setCheckingRole] = useState(true);
  const [activeTab, setActiveTab] = useState<AdminTab>("overview");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (!loading && !user) { navigate("/connexion"); return; }
    if (user) {
      supabase.rpc("has_role", { _user_id: user.id, _role: "admin" }).then(({ data }) => {
        if (!data) { toast.error("Accès refusé"); navigate("/dashboard"); }
        else setIsAdmin(true);
        setCheckingRole(false);
      });
    }
  }, [user, loading, navigate]);

  if (loading || checkingRole || !isAdmin) {
    return <div className="min-h-screen flex items-center justify-center bg-background"><div className="animate-pulse text-muted-foreground font-body">Vérification des droits...</div></div>;
  }

  const tabs: { key: AdminTab; label: string; icon: React.ReactNode }[] = [
    { key: "overview", label: "Vue d'ensemble", icon: <TrendingUp className="w-4 h-4" /> },
    { key: "users", label: "Utilisateurs", icon: <Users className="w-4 h-4" /> },
    { key: "pro_directory", label: "Moissonneurs Pros", icon: <UserCheck className="w-4 h-4" /> },
    { key: "packs", label: "Packs", icon: <Package className="w-4 h-4" /> },
    { key: "sectors", label: "Secteurs", icon: <FolderOpen className="w-4 h-4" /> },
    { key: "partners", label: "Partenaires", icon: <Building2 className="w-4 h-4" /> },
    { key: "transactions", label: "Transactions", icon: <CreditCard className="w-4 h-4" /> },
    { key: "payments", label: "Moyens de paiement", icon: <Wallet className="w-4 h-4" /> },
    { key: "commissions", label: "Commissions", icon: <TrendingUp className="w-4 h-4" /> },
    { key: "bonuses", label: "Bonus carrière", icon: <Award className="w-4 h-4" /> },
  ];

  const handleTabClick = (key: AdminTab) => {
    setActiveTab(key);
    setSidebarOpen(false);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card sticky top-0 z-50">
        <div className="container mx-auto px-4 md:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="md:hidden p-1.5 rounded-lg hover:bg-secondary">
              {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
            <img src={logo} alt="Institut Moisson" className="w-8 h-8" width={32} height={32} />
            <span className="font-heading text-lg font-bold text-foreground">Admin Panel</span>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => navigate("/dashboard")} className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors font-body">
              <ArrowLeft className="w-4 h-4" /> <span className="hidden sm:inline">Tableau de bord</span>
            </button>
            <button onClick={async () => { await signOut(); navigate("/"); }} className="text-muted-foreground hover:text-foreground transition-colors">
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      <div className="flex relative">
        {/* Sidebar - Desktop */}
        <aside className="w-56 min-h-[calc(100vh-57px)] border-r border-border bg-card p-3 hidden md:block shrink-0">
          <nav className="space-y-0.5">
            {tabs.map(tab => (
              <button key={tab.key} onClick={() => handleTabClick(tab.key)}
                className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-body transition-all ${
                  activeTab === tab.key ? "bg-primary text-primary-foreground font-semibold" : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                }`}>
                {tab.icon} {tab.label}
              </button>
            ))}
          </nav>
        </aside>

        {/* Mobile Sidebar Overlay */}
        {sidebarOpen && (
          <div className="md:hidden fixed inset-0 top-[57px] z-40">
            <div className="absolute inset-0 bg-foreground/30" onClick={() => setSidebarOpen(false)} />
            <aside className="relative w-64 h-full bg-card border-r border-border p-3 overflow-y-auto">
              <nav className="space-y-0.5">
                {tabs.map(tab => (
                  <button key={tab.key} onClick={() => handleTabClick(tab.key)}
                    className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-body transition-all ${
                      activeTab === tab.key ? "bg-primary text-primary-foreground font-semibold" : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                    }`}>
                    {tab.icon} {tab.label}
                  </button>
                ))}
              </nav>
            </aside>
          </div>
        )}

        {/* Content */}
        <main className="flex-1 p-4 md:p-6 overflow-auto min-h-[calc(100vh-57px)]">
          {activeTab === "overview" && <AdminOverview />}
          {activeTab === "users" && <AdminUsers />}
          {activeTab === "pro_directory" && <AdminProDirectory />}
          {activeTab === "transactions" && <AdminTransactions />}
          {activeTab === "packs" && <AdminPacks />}
          {activeTab === "sectors" && <AdminSectors />}
          {activeTab === "partners" && <AdminPartners />}
          {activeTab === "payments" && <AdminPayments />}
          {activeTab === "commissions" && <AdminCommissions />}
          {activeTab === "bonuses" && <AdminBonuses />}
        </main>
      </div>
    </div>
  );
};

export default AdminDashboard;
