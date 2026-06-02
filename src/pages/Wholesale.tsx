import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import DashboardLayout from "@/components/DashboardLayout";
import { ShoppingCart, Search, X, Package, Wallet } from "lucide-react";

const STATUS: Record<string, string> = {
  pending: "En attente", confirmed: "Confirmé", shipped: "Expédié",
  delivered: "Livré", cancelled: "Annulé",
};

const Wholesale = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState<"catalogue" | "orders" | "agent">("catalogue");
  const [products, setProducts] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [agentOrders, setAgentOrders] = useState<any[]>([]);
  const [profile, setProfile] = useState<any>(null);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<any>(null);
  const [form, setForm] = useState({ quantity: 1, delivery_city: "", delivery_address: "", delivery_phone: "", notes: "", for_client: false, client_name: "" });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => { if (!loading && !user) navigate("/connexion"); }, [user, loading, navigate]);
  useEffect(() => { if (user) load(); }, [user]);

  const load = async () => {
    const [p, prof, o, ag] = await Promise.all([
      supabase.from("wholesale_products" as any).select("*").eq("is_active", true).order("created_at", { ascending: false }),
      supabase.from("profiles").select("*").eq("user_id", user!.id).single(),
      supabase.from("wholesale_orders" as any).select("*").eq("user_id", user!.id).order("created_at", { ascending: false }),
      supabase.from("wholesale_orders" as any).select("*").eq("agent_id", user!.id).order("created_at", { ascending: false }),
    ]);
    setProducts((p.data as any) || []);
    setProfile(prof.data);
    setOrders((o.data as any) || []);
    setAgentOrders((ag.data as any) || []);
  };

  const openBuy = (p: any) => {
    setSelected(p);
    setForm({ quantity: Math.max(1, p.min_quantity || 1), delivery_city: "", delivery_address: "", delivery_phone: "", notes: "", for_client: false, client_name: "" });
  };

  const totalAmount = selected
    ? form.quantity * Number(form.quantity >= (selected.min_quantity || 1) ? selected.bulk_price : selected.unit_price)
    : 0;

  const handleBuy = async () => {
    if (!selected || !profile) return;
    if (form.quantity < (selected.min_quantity || 1)) {
      toast.error(`Quantité minimale : ${selected.min_quantity}`);
      return;
    }
    if (!form.delivery_city || !form.delivery_phone) {
      toast.error("Ville et téléphone requis");
      return;
    }
    if (!form.for_client && Number(profile.wallet_balance) < totalAmount) {
      toast.error(`Solde insuffisant. Nécessaire : ${totalAmount.toLocaleString("fr-FR")} F`);
      return;
    }
    setSubmitting(true);
    try {
      const commission = Math.round(totalAmount * Number(selected.commission_percent || 0) / 100);
      const payload: any = {
        product_id: selected.id,
        user_id: user!.id,
        quantity: form.quantity,
        unit_price: Number(selected.bulk_price || selected.unit_price),
        total_amount: totalAmount,
        commission_amount: form.for_client ? commission : 0,
        agent_id: form.for_client ? user!.id : null,
        status: "pending",
        delivery_city: form.delivery_city,
        delivery_address: form.delivery_address,
        delivery_phone: form.delivery_phone,
        notes: form.for_client ? `Client: ${form.client_name}. ${form.notes}` : form.notes,
      };
      const { error } = await supabase.from("wholesale_orders" as any).insert(payload);
      if (error) throw error;
      if (!form.for_client) {
        await supabase.from("profiles").update({ wallet_balance: Number(profile.wallet_balance) - totalAmount }).eq("user_id", user!.id);
        await supabase.from("transactions").insert({
          user_id: user!.id, amount: totalAmount, type: "product_purchase" as any, status: "approved" as any,
          description: `Achat en gros: ${selected.name} x${form.quantity}`, processed_at: new Date().toISOString(),
        } as any);
      }
      toast.success(form.for_client ? "Proposition enregistrée !" : "Commande passée !");
      setSelected(null);
      load();
    } catch (e: any) {
      toast.error(e.message || "Erreur");
    } finally {
      setSubmitting(false);
    }
  };

  const filtered = products.filter(p => p.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <DashboardLayout>
      <div className="mb-6">
        <h1 className="text-3xl font-heading font-bold text-foreground">📦 Produits en Gros</h1>
        <p className="text-muted-foreground font-body text-sm">Achetez en gros ou proposez à vos clients pour gagner des commissions</p>
      </div>

      <div className="flex gap-2 mb-6 border-b border-border overflow-x-auto">
        {[
          { k: "catalogue", l: "Catalogue" },
          { k: "orders", l: "Mes commandes" },
          { k: "agent", l: "Mes ventes (commissions)" },
        ].map(t => (
          <button key={t.k} onClick={() => setTab(t.k as any)}
            className={`px-4 py-2 font-body text-sm whitespace-nowrap ${tab === t.k ? "border-b-2 border-primary text-primary font-semibold" : "text-muted-foreground"}`}>
            {t.l}
          </button>
        ))}
      </div>

      {tab === "catalogue" && (
        <>
          <div className="relative mb-4">
            <Search className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher..." className="input-field pl-10" />
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map(p => (
              <div key={p.id} className="card-elevated">
                {p.images?.[0] && <img src={p.images[0]} alt={p.name} className="w-full h-40 object-cover rounded-lg mb-3" />}
                <h3 className="font-heading font-bold text-foreground mb-1">{p.name}</h3>
                <p className="text-xs text-muted-foreground mb-2 line-clamp-2">{p.description}</p>
                <div className="text-sm font-body mb-3">
                  <p>Unité : {Number(p.unit_price).toLocaleString("fr-FR")} F</p>
                  <p className="text-primary font-semibold">Gros (min {p.min_quantity}) : {Number(p.bulk_price).toLocaleString("fr-FR")} F</p>
                  <p className="text-xs text-harvest-green">Commission : {p.commission_percent}%</p>
                </div>
                <button onClick={() => openBuy(p)} className="btn-hero !text-sm !py-2 w-full flex items-center justify-center gap-2">
                  <ShoppingCart className="w-4 h-4" /> Acheter / Proposer
                </button>
              </div>
            ))}
            {filtered.length === 0 && <p className="text-muted-foreground font-body col-span-full text-center py-8">Aucun produit disponible.</p>}
          </div>
        </>
      )}

      {tab === "orders" && (
        <div className="card-elevated overflow-x-auto">
          <table className="w-full text-sm font-body">
            <thead><tr className="text-left text-muted-foreground border-b border-border">
              <th className="p-2">Date</th><th className="p-2">Qté</th><th className="p-2">Total</th><th className="p-2">Statut</th>
            </tr></thead>
            <tbody>
              {orders.map(o => (
                <tr key={o.id} className="border-b border-border/50">
                  <td className="p-2">{new Date(o.created_at).toLocaleDateString("fr-FR")}</td>
                  <td className="p-2">{o.quantity}</td>
                  <td className="p-2">{Number(o.total_amount).toLocaleString("fr-FR")} F</td>
                  <td className="p-2">{STATUS[o.status] || o.status}</td>
                </tr>
              ))}
              {orders.length === 0 && <tr><td colSpan={4} className="p-6 text-center text-muted-foreground">Aucune commande</td></tr>}
            </tbody>
          </table>
        </div>
      )}

      {tab === "agent" && (
        <div className="card-elevated overflow-x-auto">
          <table className="w-full text-sm font-body">
            <thead><tr className="text-left text-muted-foreground border-b border-border">
              <th className="p-2">Date</th><th className="p-2">Qté</th><th className="p-2">Total</th><th className="p-2">Commission</th><th className="p-2">Statut</th>
            </tr></thead>
            <tbody>
              {agentOrders.map(o => (
                <tr key={o.id} className="border-b border-border/50">
                  <td className="p-2">{new Date(o.created_at).toLocaleDateString("fr-FR")}</td>
                  <td className="p-2">{o.quantity}</td>
                  <td className="p-2">{Number(o.total_amount).toLocaleString("fr-FR")} F</td>
                  <td className="p-2 text-harvest-green font-semibold">{Number(o.commission_amount || 0).toLocaleString("fr-FR")} F</td>
                  <td className="p-2">{STATUS[o.status] || o.status}</td>
                </tr>
              ))}
              {agentOrders.length === 0 && <tr><td colSpan={5} className="p-6 text-center text-muted-foreground">Aucune vente</td></tr>}
            </tbody>
          </table>
        </div>
      )}

      {selected && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 overflow-auto">
          <div className="bg-card rounded-2xl max-w-lg w-full p-6 my-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-heading text-xl font-bold">{selected.name}</h2>
              <button onClick={() => setSelected(null)}><X className="w-5 h-5" /></button>
            </div>
            {selected.images?.[0] && <img src={selected.images[0]} className="w-full h-48 object-cover rounded-lg mb-3" alt="" />}
            <p className="text-sm text-muted-foreground mb-4">{selected.description}</p>
            <div className="space-y-3 font-body text-sm">
              <label>Quantité (min {selected.min_quantity})
                <input type="number" min={selected.min_quantity} value={form.quantity}
                  onChange={e => setForm({ ...form, quantity: +e.target.value })} className="input-field" />
              </label>
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={form.for_client}
                  onChange={e => setForm({ ...form, for_client: e.target.checked })} />
                Proposer à un client (je gagne une commission)
              </label>
              {form.for_client && (
                <input className="input-field" placeholder="Nom du client" value={form.client_name}
                  onChange={e => setForm({ ...form, client_name: e.target.value })} />
              )}
              <input className="input-field" placeholder="Ville de livraison" value={form.delivery_city}
                onChange={e => setForm({ ...form, delivery_city: e.target.value })} />
              <input className="input-field" placeholder="Adresse" value={form.delivery_address}
                onChange={e => setForm({ ...form, delivery_address: e.target.value })} />
              <input className="input-field" placeholder="Téléphone" value={form.delivery_phone}
                onChange={e => setForm({ ...form, delivery_phone: e.target.value })} />
              <textarea className="input-field" rows={2} placeholder="Notes" value={form.notes}
                onChange={e => setForm({ ...form, notes: e.target.value })} />
              <div className="p-3 rounded-lg bg-primary/10 flex items-center justify-between">
                <span>Total :</span>
                <strong className="text-primary">{totalAmount.toLocaleString("fr-FR")} F</strong>
              </div>
              {!form.for_client && profile && (
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Wallet className="w-3 h-3" /> Solde : {Number(profile.wallet_balance).toLocaleString("fr-FR")} F
                </p>
              )}
            </div>
            <div className="flex gap-2 mt-6">
              <button onClick={() => setSelected(null)} className="flex-1 py-2 rounded-lg bg-secondary text-sm">Annuler</button>
              <button disabled={submitting} onClick={handleBuy} className="flex-1 btn-hero !text-sm !py-2">
                {submitting ? "..." : (form.for_client ? "Proposer" : "Acheter")}
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default Wholesale;
