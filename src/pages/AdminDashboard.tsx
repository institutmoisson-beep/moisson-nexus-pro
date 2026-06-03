import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import DashboardLayout from "@/components/DashboardLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";

import AdminOverview from "@/components/admin/AdminOverview";
import AdminPacks from "@/components/admin/AdminPacks";
import AdminSectors from "@/components/admin/AdminSectors";
import AdminPartners from "@/components/admin/AdminPartners";
import AdminMandatePacks from "@/components/admin/AdminMandatePacks";
import AdminWholesale from "@/components/admin/AdminWholesale";
import AdminOrders from "@/components/admin/AdminOrders";
import AdminTransactions from "@/components/admin/AdminTransactions";
import AdminPayments from "@/components/admin/AdminPayments";
import AdminUsers from "@/components/admin/AdminUsers";
import AdminCommissions from "@/components/admin/AdminCommissions";
import AdminBonuses from "@/components/admin/AdminBonuses";
import AdminFees from "@/components/admin/AdminFees";
import AdminMSN from "@/components/admin/AdminMSN";
import AdminMSNWithdrawals from "@/components/admin/AdminMSNWithdrawals";
import AdminCommunityFund from "@/components/admin/AdminCommunityFund";
import AdminUrgentCases from "@/components/admin/AdminUrgentCases";
import AdminRegionalRoles from "@/components/admin/AdminRegionalRoles";
import AdminProDirectory from "@/components/admin/AdminProDirectory";
import AdminPorteurAffaires from "@/components/admin/AdminPorteurAffaires";

const TABS: { value: string; label: string; Component: React.ComponentType }[] = [
  { value: "overview", label: "Vue d'ensemble", Component: AdminOverview },
  { value: "users", label: "Membres", Component: AdminUsers },
  { value: "packs", label: "Packs MLM", Component: AdminPacks },
  { value: "sectors", label: "Secteurs", Component: AdminSectors },
  { value: "partners", label: "Partenaires / Stands", Component: AdminPartners },
  { value: "mandate", label: "Vente par Mandat", Component: AdminMandatePacks },
  { value: "wholesale", label: "Produits en Gros", Component: AdminWholesale },
  { value: "orders", label: "Commandes", Component: AdminOrders },
  { value: "transactions", label: "Transactions", Component: AdminTransactions },
  { value: "payments", label: "Moyens de paiement", Component: AdminPayments },
  { value: "commissions", label: "Commissions", Component: AdminCommissions },
  { value: "bonuses", label: "Bonus de carrière", Component: AdminBonuses },
  { value: "fees", label: "Frais", Component: AdminFees },
  { value: "msn", label: "MSN Coins", Component: AdminMSN },
  { value: "msn-wd", label: "Retraits MSN", Component: AdminMSNWithdrawals },
  { value: "fund", label: "Fond Communautaire", Component: AdminCommunityFund },
  { value: "urgent", label: "Cas urgents", Component: AdminUrgentCases },
  { value: "regional", label: "Moissonneurs Pays/Ville", Component: AdminRegionalRoles },
  { value: "pro", label: "Annuaire Pro", Component: AdminProDirectory },
  { value: "porteur", label: "Porteurs d'affaires", Component: AdminPorteurAffaires },
];

const AdminDashboard = () => {
  const { getUserProfile, loading } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState("overview");
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    if (loading) return;
    const profile = getUserProfile();
    if (!profile) return;
    if (profile.role !== "admin") {
      toast.error("Accès réservé aux administrateurs");
      navigate("/dashboard");
    } else {
      setAllowed(true);
    }
  }, [loading, getUserProfile, navigate]);

  if (!allowed) {
    return (
      <DashboardLayout>
        <div className="text-center py-12 text-muted-foreground font-body">Vérification des accès…</div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <h1 className="text-3xl font-heading font-bold text-foreground mb-2">🛡️ Administration</h1>
      <p className="text-muted-foreground font-body mb-6">Gérez l'ensemble de la plateforme Institut Moisson</p>

      <Tabs value={tab} onValueChange={setTab} className="w-full">
        <div className="overflow-x-auto -mx-4 px-4 mb-6">
          <TabsList className="inline-flex w-max gap-1">
            {TABS.map(t => (
              <TabsTrigger key={t.value} value={t.value} className="whitespace-nowrap text-xs">
                {t.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        {TABS.map(({ value, Component }) => (
          <TabsContent key={value} value={value} className="mt-0">
            <Component />
          </TabsContent>
        ))}
      </Tabs>
    </DashboardLayout>
  );
};

export default AdminDashboard;
