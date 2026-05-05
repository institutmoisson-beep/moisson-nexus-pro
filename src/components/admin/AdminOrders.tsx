import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type Row = {
  id: string;
  kind: "pack" | "product";
  user_id: string;
  name: string;
  amount: number;
  status: string;
  created_at: string;
  delivery_city?: string | null;
  delivery_country?: string | null;
  delivery_phone?: string | null;
  user_note?: string | null;
  user_rating?: number | null;
};

const AdminOrders = () => {
  const [rows, setRows] = useState<Row[]>([]);
  const [users, setUsers] = useState<any[]>([]);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    const [packOrdersRes, productPurchasesRes, packsRes, usersRes] = await Promise.all([
      supabase.from("pack_orders").select("*").order("created_at", { ascending: false }),
      supabase.from("product_purchases").select("*").order("created_at", { ascending: false }),
      supabase.from("packs").select("id, name"),
      supabase.from("profiles").select("user_id, first_name, last_name, email"),
    ]);
    const packs = packsRes.data || [];

    const packOrders: Row[] = (packOrdersRes.data || []).map((o: any) => ({
      id: o.id, kind: "pack", user_id: o.user_id,
      name: packs.find(p => p.id === o.pack_id)?.name || "Pack",
      amount: Number(o.amount_paid), status: o.status, created_at: o.created_at,
      delivery_city: o.delivery_city, delivery_country: o.delivery_country, delivery_phone: o.delivery_phone,
      user_note: o.user_note, user_rating: o.user_rating,
    }));
    const productOrders: Row[] = (productPurchasesRes.data || []).map((o: any) => ({
      id: o.id, kind: "product", user_id: o.user_id,
      name: o.product_name || "Produit",
      amount: Number(o.amount_paid), status: o.status, created_at: o.created_at,
      delivery_city: o.delivery_city, delivery_country: o.delivery_country, delivery_phone: o.delivery_phone,
      user_note: o.user_note, user_rating: o.user_rating,
    }));
    setRows([...packOrders, ...productOrders].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    ));
    setUsers(usersRes.data || []);
  };

  const getUserName = (userId: string) => {
    const u = users.find(p => p.user_id === userId);
    return u ? `${u.first_name} ${u.last_name}` : userId.slice(0, 8);
  };

  const updateStatus = async (row: Row, status: string) => {
    const table = row.kind === "pack" ? "pack_orders" : "product_purchases";
    const { error } = await supabase.from(table).update({ status }).eq("id", row.id);
    if (error) { toast.error(error.message); return; }
    toast.success(`Statut mis à jour: ${status}`);
    loadData();
  };

  const statusLabel = (s: string) => {
    switch (s) {
      case "pending": return { label: "En attente", cls: "bg-gold/20 text-gold" };
      case "pending_delivery": return { label: "À livrer", cls: "bg-gold/20 text-gold" };
      case "confirmed": return { label: "Confirmé", cls: "bg-primary/20 text-primary" };
      case "shipped": return { label: "Expédié", cls: "bg-harvest-green/20 text-harvest-green" };
      case "delivered": return { label: "Livré", cls: "bg-harvest-green/20 text-harvest-green" };
      case "completed": return { label: "Terminé", cls: "bg-harvest-green/20 text-harvest-green" };
      case "cancelled": return { label: "Annulé", cls: "bg-destructive/20 text-destructive" };
      default: return { label: s, cls: "bg-muted text-muted-foreground" };
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-heading font-bold text-foreground mb-6">Commandes (Packs & Produits)</h1>
      <div className="overflow-x-auto">
        <table className="w-full text-sm font-body">
          <thead><tr className="border-b border-border text-muted-foreground">
            <th className="text-left py-2 px-3">Date</th>
            <th className="text-left py-2 px-3">Type</th>
            <th className="text-left py-2 px-3">Utilisateur</th>
            <th className="text-left py-2 px-3">Article</th>
            <th className="text-right py-2 px-3">Montant</th>
            <th className="text-left py-2 px-3">Livraison</th>
            <th className="text-left py-2 px-3">Avis</th>
            <th className="text-left py-2 px-3">Statut</th>
            <th className="text-right py-2 px-3">Actions</th>
          </tr></thead>
          <tbody>
            {rows.map(o => {
              const st = statusLabel(o.status);
              return (
                <tr key={`${o.kind}-${o.id}`} className="border-b border-border/50">
                  <td className="py-2 px-3">{new Date(o.created_at).toLocaleDateString("fr-FR")}</td>
                  <td className="py-2 px-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${o.kind === "pack" ? "bg-primary/15 text-primary" : "bg-gold/15 text-gold"}`}>
                      {o.kind === "pack" ? "Pack" : "Produit"}
                    </span>
                  </td>
                  <td className="py-2 px-3">{getUserName(o.user_id)}</td>
                  <td className="py-2 px-3">{o.name}</td>
                  <td className="py-2 px-3 text-right font-semibold">{o.amount.toLocaleString("fr-FR")} FCFA</td>
                  <td className="py-2 px-3 text-xs">
                    {o.delivery_city && <span>{o.delivery_city}, {o.delivery_country}</span>}
                    {o.delivery_phone && <span className="block">{o.delivery_phone}</span>}
                  </td>
                  <td className="py-2 px-3 text-xs">
                    {o.user_rating ? <span>⭐ {o.user_rating}/5</span> : <span className="text-muted-foreground">—</span>}
                    {o.user_note && <span className="block truncate max-w-[180px]" title={o.user_note}>{o.user_note}</span>}
                  </td>
                  <td className="py-2 px-3"><span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${st.cls}`}>{st.label}</span></td>
                  <td className="py-2 px-3 text-right">
                    <select value={o.status} onChange={e => updateStatus(o, e.target.value)}
                      className="px-2 py-1 rounded border border-input bg-background text-foreground font-body text-xs">
                      <option value="pending">En attente</option>
                      <option value="pending_delivery">À livrer</option>
                      <option value="confirmed">Confirmé</option>
                      <option value="shipped">Expédié</option>
                      <option value="delivered">Livré</option>
                      <option value="completed">Terminé</option>
                      <option value="cancelled">Annulé</option>
                    </select>
                  </td>
                </tr>
              );
            })}
            {rows.length === 0 && <tr><td colSpan={9} className="py-8 text-center text-muted-foreground">Aucune commande</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminOrders;
