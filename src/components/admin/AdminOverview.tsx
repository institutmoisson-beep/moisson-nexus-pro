import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Users, CreditCard, Package, TrendingUp } from "lucide-react";

const AdminOverview = () => {
  const [stats, setStats] = useState({ totalUsers: 0, pendingTx: 0, totalPacks: 0, totalCommissions: 0 });
  const [recentTx, setRecentTx] = useState<any[]>([]);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    const [usersRes, pendingRes, packsRes, txRes] = await Promise.all([
      supabase.from("profiles").select("*", { count: "exact", head: true }),
      supabase.from("transactions").select("*", { count: "exact", head: true }).eq("status", "pending"),
      supabase.from("packs").select("*", { count: "exact", head: true }).eq("is_active", true),
      supabase.from("transactions").select("*").order("created_at", { ascending: false }).limit(10),
    ]);
    setStats({
      totalUsers: usersRes.count || 0,
      pendingTx: pendingRes.count || 0,
      totalPacks: packsRes.count || 0,
      totalCommissions: 0,
    });
    setRecentTx(txRes.data || []);
  };

  const cards = [
    { label: "Utilisateurs", value: stats.totalUsers, icon: <Users className="w-5 h-5 text-primary" /> },
    { label: "En attente", value: stats.pendingTx, icon: <CreditCard className="w-5 h-5 text-accent" /> },
    { label: "Packs actifs", value: stats.totalPacks, icon: <Package className="w-5 h-5 text-harvest-green" /> },
    { label: "Commissions", value: "—", icon: <TrendingUp className="w-5 h-5 text-primary" /> },
  ];

  return (
    <div>
      <h1 className="text-2xl font-heading font-bold text-foreground mb-6">Vue d'ensemble</h1>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {cards.map((s, i) => (
          <div key={i} className="card-elevated">
            <div className="flex items-center gap-2 mb-2">{s.icon}<span className="text-xs text-muted-foreground font-body">{s.label}</span></div>
            <p className="text-xl font-heading font-bold text-foreground">{s.value}</p>
          </div>
        ))}
      </div>
      <h2 className="text-lg font-heading font-semibold text-foreground mb-3">Dernières transactions</h2>
      <div className="overflow-x-auto">
        <table className="w-full text-sm font-body">
          <thead><tr className="border-b border-border text-muted-foreground">
            <th className="text-left py-2 px-3">Date</th><th className="text-left py-2 px-3">Type</th>
            <th className="text-right py-2 px-3">Montant</th><th className="text-left py-2 px-3">Statut</th>
          </tr></thead>
          <tbody>
            {recentTx.map((tx: any) => (
              <tr key={tx.id} className="border-b border-border/50">
                <td className="py-2 px-3">{new Date(tx.created_at).toLocaleDateString("fr-FR")}</td>
                <td className="py-2 px-3 capitalize">{tx.type.replace(/_/g, " ")}</td>
                <td className="py-2 px-3 text-right font-semibold">{Number(tx.amount).toLocaleString("fr-FR")} FCFA</td>
                <td className="py-2 px-3">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                    tx.status === "approved" ? "bg-harvest-green/20 text-harvest-green" :
                    tx.status === "rejected" ? "bg-destructive/20 text-destructive" : "bg-accent/20 text-accent-foreground"
                  }`}>{tx.status}</span>
                </td>
              </tr>
            ))}
            {recentTx.length === 0 && <tr><td colSpan={4} className="py-8 text-center text-muted-foreground">Aucune transaction</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminOverview;
