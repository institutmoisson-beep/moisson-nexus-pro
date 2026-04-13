import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const AdminOrders = () => {
  const [orders, setOrders] = useState<any[]>([]);
  const [packs, setPacks] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    const [ordersRes, packsRes, usersRes] = await Promise.all([
      supabase.from("pack_orders").select("*").order("created_at", { ascending: false }),
      supabase.from("packs").select("id, name"),
      supabase.from("profiles").select("user_id, first_name, last_name, email"),
    ]);
    setOrders(ordersRes.data || []);
    setPacks(packsRes.data || []);
    setUsers(usersRes.data || []);
  };

  const getUserName = (userId: string) => {
    const u = users.find(p => p.user_id === userId);
    return u ? `${u.first_name} ${u.last_name}` : userId.slice(0, 8);
  };
  const getPackName = (packId: string) => packs.find(p => p.id === packId)?.name || "Pack";

  const updateStatus = async (orderId: string, status: string) => {
    await supabase.from("pack_orders").update({ status }).eq("id", orderId);
    toast.success(`Statut mis à jour: ${status}`);
    loadData();
  };

  const statusLabel = (s: string) => {
    switch (s) {
      case "pending": return { label: "En attente", cls: "bg-gold/20 text-gold" };
      case "confirmed": return { label: "Confirmé", cls: "bg-primary/20 text-primary" };
      case "shipped": return { label: "Expédié", cls: "bg-harvest-green/20 text-harvest-green" };
      case "delivered": return { label: "Livré", cls: "bg-harvest-green/20 text-harvest-green" };
      case "cancelled": return { label: "Annulé", cls: "bg-destructive/20 text-destructive" };
      default: return { label: s, cls: "bg-muted text-muted-foreground" };
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-heading font-bold text-foreground mb-6">Commandes</h1>
      <div className="overflow-x-auto">
        <table className="w-full text-sm font-body">
          <thead><tr className="border-b border-border text-muted-foreground">
            <th className="text-left py-2 px-3">Date</th>
            <th className="text-left py-2 px-3">Utilisateur</th>
            <th className="text-left py-2 px-3">Pack/Produit</th>
            <th className="text-right py-2 px-3">Montant</th>
            <th className="text-left py-2 px-3">Livraison</th>
            <th className="text-left py-2 px-3">Statut</th>
            <th className="text-right py-2 px-3">Actions</th>
          </tr></thead>
          <tbody>
            {orders.map(o => {
              const st = statusLabel(o.status);
              return (
                <tr key={o.id} className="border-b border-border/50">
                  <td className="py-2 px-3">{new Date(o.created_at).toLocaleDateString("fr-FR")}</td>
                  <td className="py-2 px-3">{getUserName(o.user_id)}</td>
                  <td className="py-2 px-3">{getPackName(o.pack_id)}</td>
                  <td className="py-2 px-3 text-right font-semibold">{Number(o.amount_paid).toLocaleString("fr-FR")} FCFA</td>
                  <td className="py-2 px-3 text-xs">
                    {o.delivery_city && <span>{o.delivery_city}, {o.delivery_country}</span>}
                    {o.delivery_phone && <span className="block">{o.delivery_phone}</span>}
                  </td>
                  <td className="py-2 px-3"><span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${st.cls}`}>{st.label}</span></td>
                  <td className="py-2 px-3 text-right">
                    <select value={o.status} onChange={e => updateStatus(o.id, e.target.value)}
                      className="px-2 py-1 rounded border border-input bg-background text-foreground font-body text-xs">
                      <option value="pending">En attente</option>
                      <option value="confirmed">Confirmé</option>
                      <option value="shipped">Expédié</option>
                      <option value="delivered">Livré</option>
                      <option value="cancelled">Annulé</option>
                    </select>
                  </td>
                </tr>
              );
            })}
            {orders.length === 0 && <tr><td colSpan={7} className="py-8 text-center text-muted-foreground">Aucune commande</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminOrders;
