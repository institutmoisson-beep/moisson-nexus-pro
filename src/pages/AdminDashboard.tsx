import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import logo from "@/assets/logo-moisson.png";
import {
  Users, Package, Building2, CreditCard, TrendingUp, Award,
  LogOut, ArrowLeft, Wallet, FolderOpen, UserCheck,
  Menu, X, ShoppingBag, Settings2, Flame, HandshakeIcon
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
import AdminOrders from "@/components/admin/AdminOrders";
import AdminFees from "@/components/admin/AdminFees";
import AdminMSN from "@/components/admin/AdminMSN";
import AdminMSNWithdrawals from "@/components/admin/AdminMSNWithdrawals";
import AdminMandatePacks from "@/components/admin/AdminMandatePacks";

type AdminTab =
  | "overview" | "users" | "packs" | "sectors" | "partners"
  | "transactions" | "payments" | "commissions" | "bonuses"
  | "pro_directory" | "orders" | "fees" | "msn_plan" | "msn_withdrawals"
  | "mandate_packs";

const STAFF_TAB_ACCESS: Record<string, AdminTab[]> = {
  financier: ["overview", "transactions", "payments", "commissions", "bonuses", "fees", "msn_withdrawals"],
  gestion_packs: ["overview", "packs", "sectors", "orders", "commissions", "mandate_packs"],
  gestion_stand: ["overview", "partners", "orders"],
  informaticien: ["overview", "users", "packs", "sectors", "partners", "transactions", "payments", "commissions", "bonuses", "pro_directory", "orders", "fees", "msn_plan", "msn_withdrawals", "mandate_packs"],
  commercial: ["overview", "users", "pro_directory", "orders", "mandate_packs"],
  communication: ["overview", "partners", "pro_directory"],
};

const ALL_TABS: { key: AdminTab; label: string; icon: React.ReactNode }[] = [
  { key: "overview", label: "Vue d'ensemble", icon: <TrendingUp className="w-4 h-4" /> },
  { key: "users", label: "Utilisateurs", icon: <Users className="w-4 h-4" /> },
  { key: "pro_directory", label: "Moissonneurs Pros", icon: <UserCheck className="w-4 h-4" /> },
  { key: "packs", label: "Packs", icon: <Package className="w-4 h-4" /> },
  { key: "mandate_packs", label: "Vente par Mandat 🏬", icon: <HandshakeIcon className="w-4 h-4" /> },
  { key: "sectors", label: "Secteurs", icon: <FolderOpen className="w-4 h-4" /> },
  { key: "partners", label: "Partenaires", icon: <Building2 className="w-4 h-4" /> },
  { key: "orders", label: "Commandes", icon: <ShoppingBag className="w-4 h-4" /> },
  { key: "transactions", label: "Transactions", icon: <CreditCard className="w-4 h-4" /> },
  { key: "payments", label: "Moyens de paiement", icon: <Wallet className="w-4 h-4" /> },
  { key: "commissions", label: "Commissions", icon: <TrendingUp className="w-4 h-4" /> },
  { key: "bonuses", label: "Bonus carrière", icon: <Award className="w-4 h-4" /> },
  { key: "fees", label: "Frais & Config", icon: <Settings2 className="w-4 h-4" /> },
  { key: "msn_plan", label: "Plan MSN 🔥", icon: <TrendingUp className="w-4 h-4" /> },
  { key: "msn_withdrawals", label: "Retraits MSN 🔥", icon: <Flame className="w-4 h-4" /> },
];

const AdminDashboard = () => {
  const { user, signOut, loading } = useAuth();
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);
  const [staffRoles, setStaffRoles] = useState<string[]>([]);
  const [checkingRole, setCheckingRole] = useState(true);
  const [activeTab, setActiveTab] = useState<AdminTab>("overview");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [pendingMsnWithdrawals, setPendingMsnWithdrawals] = useState(0);

  useEffect(() => {
    if (!loading && !user) { navigate("/connexion"); return; }
    if (user) {
      Promise.all([
        supabase.rpc("has_role", { _user_id: user.id, _role: "admin" }),
        supabase.from("staff_roles").select("role").eq("user_id", user.id),
        (supabase as any).from("msn_withdrawals").select("id", { count: "exact", head: true }).eq("status", "pending"),
      ]).then(([adminRes, staffRes, wdRes]) => {
        const admin = !!adminRes.data;
        const roles = (staffRes.data || []).map((r: any) => r.role);
        if (!admin && roles.length === 0) {
          toast.error("Accès refusé");
          navigate("/dashboard");
        } else {
          setIsAdmin(admin);
          setStaffRoles(roles);
        }
        setPendingMsnWithdrawals((wdRes as any).count || 0);
        setCheckingRole(false);
      });
    }
  }, [user, loading, navigate]);

  if (loading || checkingRole || (!isAdmin && staffRoles.length === 0)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground font-body">Vérification des droits...</div>
      </div>
    );
  }

  const allowedTabs = isAdmin
    ? ALL_TABS
    : ALL_TABS.filter(t => {
        const allowed = new Set<AdminTab>();
        staffRoles.forEach(role => {
          (STAFF_TAB_ACCESS[role] || []).forEach(tab => allowed.add(tab));
        });
        return allowed.has(t.key);
      });

  const handleTabClick = (key: AdminTab) => {
    setActiveTab(key);
    setSidebarOpen(false);
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card sticky top-0 z-50">
        <div className="container mx-auto px-4 md:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="md:hidden p-1.5 rounded-lg hover:bg-secondary">
              {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
            <img src={logo} alt="Institut Moisson" className="w-8 h-8" width={32} height={32} />
            <span className="font-heading text-lg font-bold text-foreground">
              {isAdmin ? "Admin Panel" : "Gestion"}
            </span>
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
        <aside className="w-56 min-h-[calc(100vh-57px)] border-r border-border bg-card p-3 hidden md:block shrink-0">
          <nav className="space-y-0.5">
            {allowedTabs.map(tab => (
              <button key={tab.key} onClick={() => handleTabClick(tab.key)}
                className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-body transition-all relative ${
                  activeTab === tab.key ? "bg-primary text-primary-foreground font-semibold" : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                }`}>
                {tab.icon} {tab.label}
                {tab.key === "msn_withdrawals" && pendingMsnWithdrawals > 0 && (
                  <span className="ml-auto bg-destructive text-destructive-foreground text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                    {pendingMsnWithdrawals}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </aside>

        {sidebarOpen && (
          <div className="md:hidden fixed inset-0 top-[57px] z-40">
            <div className="absolute inset-0 bg-foreground/30" onClick={() => setSidebarOpen(false)} />
            <aside className="relative w-64 h-full bg-card border-r border-border p-3 overflow-y-auto">
              <nav className="space-y-0.5">
                {allowedTabs.map(tab => (
                  <button key={tab.key} onClick={() => handleTabClick(tab.key)}
                    className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-body transition-all relative ${
                      activeTab === tab.key ? "bg-primary text-primary-foreground font-semibold" : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                    }`}>
                    {tab.icon} {tab.label}
                    {tab.key === "msn_withdrawals" && pendingMsnWithdrawals > 0 && (
                      <span className="ml-auto bg-destructive text-destructive-foreground text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                        {pendingMsnWithdrawals}
                      </span>
                    )}
                  </button>
                ))}
              </nav>
            </aside>
          </div>
        )}

        <main className="flex-1 p-4 md:p-6 overflow-auto min-h-[calc(100vh-57px)]">
          {activeTab === "overview" && <AdminOverview />}
          {activeTab === "users" && <AdminUsers />}
          {activeTab === "pro_directory" && <AdminProDirectory />}
          {activeTab === "transactions" && <AdminTransactions />}
          {activeTab === "packs" && <AdminPacks />}
          {activeTab === "sectors" && <AdminSectors />}
          {activeTab === "partners" && <AdminPartners />}
          {activeTab === "orders" && <AdminOrders />}
          {activeTab === "payments" && <AdminPayments />}
          {activeTab === "commissions" && <AdminCommissions />}
          {activeTab === "bonuses" && <AdminBonuses />}
          {activeTab === "fees" && <AdminFees />}
          {activeTab === "msn_plan" && <AdminMSN />}
          {activeTab === "msn_withdrawals" && <AdminMSNWithdrawals />}
          {activeTab === "mandate_packs" && <AdminMandatePacks />}
        </main>
      </div>
    </div>
  );
};

export default AdminDashboard;
