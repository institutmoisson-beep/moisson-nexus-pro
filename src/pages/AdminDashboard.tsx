import { useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/DashboardLayout";
import { Package, Users, Wallet, TrendingUp, Box, Truck } from "lucide-react";

const AdminDashboard = () => {
  const navigate = useNavigate();

  const adminModules = [
    { icon: Package, label: "Gestion des Packs MLM", desc: "Créer, modifier, configurer les commissions", path: "/admin/packs", color: "text-primary", bgColor: "bg-primary/10" },
    { icon: Box, label: "Produits en Gros", desc: "Gérer les produits en gros", path: "/admin/wholesale", color: "text-harvest-green", bgColor: "bg-harvest-green/10" },
    { icon: Truck, label: "Distribution", desc: "Produits de distribution", path: "/admin/distribution", color: "text-gold", bgColor: "bg-gold/10" },
    { icon: Users, label: "Membres", desc: "Gérer les utilisateurs", path: "/admin/membres", color: "text-blue-500", bgColor: "bg-blue-500/10" },
    { icon: Wallet, label: "Transactions", desc: "Valider dépôts et retraits", path: "/admin/transactions", color: "text-purple-500", bgColor: "bg-purple-500/10" },
    { icon: TrendingUp, label: "Statistiques MLM", desc: "Performances du réseau", path: "/admin/stats", color: "text-orange-500", bgColor: "bg-orange-500/10" },
  ];

  return (
    <DashboardLayout>
      <h1 className="text-3xl font-heading font-bold text-foreground mb-2">🛡️ Administration</h1>
      <p className="text-muted-foreground font-body mb-8">Gérez l'ensemble de la plateforme Moisson Nexus Pro</p>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {adminModules.map((module) => (
          <button key={module.path} onClick={() => navigate(module.path)} className="card-elevated text-left hover:shadow-lg transition-all hover:scale-[1.02]">
            <div className="flex items-start gap-4">
              <div className={`w-12 h-12 rounded-xl ${module.bgColor} flex items-center justify-center shrink-0`}>
                <module.icon className={`w-6 h-6 ${module.color}`} />
              </div>
              <div>
                <h3 className="font-heading font-bold text-foreground mb-1">{module.label}</h3>
                <p className="text-sm text-muted-foreground font-body">{module.desc}</p>
              </div>
            </div>
          </button>
        ))}
      </div>

      <div className="mt-8">
        <h2 className="font-heading font-bold text-lg text-foreground mb-4">📊 Aperçu rapide</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Membres actifs", value: "0", color: "text-foreground" },
            { label: "Packs vendus", value: "0", color: "text-primary" },
            { label: "Commissions", value: "0 FCFA", color: "text-gold" },
            { label: "Transactions", value: "0", color: "text-harvest-green" },
          ].map(stat => (
            <div key={stat.label} className="card-elevated text-center">
              <p className={`text-3xl font-heading font-bold ${stat.color}`}>{stat.value}</p>
              <p className="text-xs text-muted-foreground font-body">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AdminDashboard;
