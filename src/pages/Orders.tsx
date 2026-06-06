import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Package, Star, ShoppingBag, FileDown } from "lucide-react";
import { toast } from "sonner";
import DashboardLayout from "@/components/DashboardLayout";
import { generatePurchaseReceiptHTML } from "@/lib/generatePDF";

type UnifiedOrder = {
  id: string;
  kind: "pack" | "product";
  name: string;
  image?: string;
  amount: number;
  status: string;
  created_at: string;
  delivery_city?: string | null;
  delivery_country?: string | null;
  delivery_phone?: string | null;
  delivery_street?: string | null;
  user_note?: string | null;
  user_rating?: number | null;
  pack_id?: string | null;
  pack_description?: string | null;
};

const OrdersPage = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<UnifiedOrder[]>([]);
  const [noteForm, setNoteForm] = useState<{ id: string; kind: "pack" | "product"; note: string; rating: number } | null>(null);

  useEffect(() => { if (!loading && !user) navigate("/connexion"); }, [user, loading]);
  useEffect(() => { if (user) loadData(); }, [user]);

  const loadData = async () => {
    const [packOrdersRes, productPurchasesRes, packsRes] = await Promise.all([
      supabase.from("pack_orders").select("*").eq("user_id", user!.id).order("created_at", { ascending: false }),
      supabase.from("product_purchases").select("*").eq("user_id", user!.id).order("created_at", { ascending: false }),
      supabase.from("packs").select("id, name, images"),
    ]);
    const packsList = packsRes.data || [];

    const packOrders: UnifiedOrder[] = (packOrdersRes.data || []).map((o: any) => {
      const p = packsList.find(p => p.id === o.pack_id);
      return {
        id: o.id, kind: "pack", name: p?.name || "Pack",
        image: p?.images?.[0], amount: Number(o.amount_paid),
        status: o.status, created_at: o.created_at,
        delivery_city: o.delivery_city, delivery_country: o.delivery_country, delivery_phone: o.delivery_phone,
        user_note: o.user_note, user_rating: o.user_rating,
      };
    });

    const productOrders: UnifiedOrder[] = (productPurchasesRes.data || []).map((o: any) => ({
      id: o.id, kind: "product", name: o.product_name || "Produit",
      amount: Number(o.amount_paid), status: o.status, created_at: o.created_at,
      delivery_city: o.delivery_city, delivery_country: o.delivery_country, delivery_phone: o.delivery_phone,
      user_note: o.user_note, user_rating: o.user_rating,
    }));

    const merged = [...packOrders, ...productOrders].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
    setOrders(merged);
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

  const submitRating = async () => {
    if (!noteForm) return;
    const table = noteForm.kind === "pack" ? "pack_orders" : "product_purchases";
    const { error } = await supabase.from(table).update({
      user_note: noteForm.note,
      user_rating: noteForm.rating,
    } as any).eq("id", noteForm.id);
    if (error) { toast.error(error.message); return; }
    toast.success("Merci pour votre avis !");
    setNoteForm(null);
    loadData();
  };

  return (
    <DashboardLayout>
      <h1 className="text-3xl font-heading font-bold text-foreground mb-6">📦 Mes Commandes</h1>

      <div className="space-y-4">
        {orders.map(order => {
          const st = statusLabel(order.status);
          const canRate = (order.status === "delivered" || order.status === "completed") && !order.user_note;
          return (
            <div key={`${order.kind}-${order.id}`} className="card-elevated">
              <div className="flex items-start gap-4">
                {order.image ? (
                  <img src={order.image} alt="" className="w-16 h-16 rounded-lg object-cover border border-border" />
                ) : (
                  <div className="w-16 h-16 rounded-lg bg-primary/10 flex items-center justify-center">
                    {order.kind === "pack"
                      ? <Package className="w-6 h-6 text-primary" />
                      : <ShoppingBag className="w-6 h-6 text-primary" />}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1 gap-2">
                    <h3 className="font-heading font-semibold text-foreground truncate">
                      {order.name}
                      <span className="ml-2 text-[10px] uppercase tracking-wide text-muted-foreground font-body">
                        {order.kind === "pack" ? "Pack" : "Produit"}
                      </span>
                    </h3>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${st.cls}`}>{st.label}</span>
                  </div>
                  <p className="text-sm font-bold text-primary">{order.amount.toLocaleString("fr-FR")} FCFA</p>
                  <p className="text-xs text-muted-foreground font-body">
                    {new Date(order.created_at).toLocaleDateString("fr-FR")}
                    {order.delivery_city && <span> — 📍 {order.delivery_city}, {order.delivery_country}</span>}
                  </p>
                  {order.delivery_phone && <p className="text-xs text-muted-foreground font-body">📱 {order.delivery_phone}</p>}
                  {order.user_note && (
                    <div className="mt-2 bg-secondary rounded-lg p-2">
                      <p className="text-xs text-muted-foreground font-body">📝 {order.user_note}</p>
                      {order.user_rating && (
                        <div className="flex gap-0.5 mt-1">
                          {[1,2,3,4,5].map(i => <Star key={i} className={`w-3 h-3 ${i <= (order.user_rating || 0) ? "text-gold fill-gold" : "text-muted-foreground"}`} />)}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
              {canRate && (
                <div className="mt-3 border-t border-border pt-3">
                  {noteForm?.id === order.id ? (
                    <div className="space-y-2">
                      <div className="flex gap-1">
                        {[1,2,3,4,5].map(i => (
                          <button key={i} type="button" onClick={() => setNoteForm({ ...noteForm, rating: i })} className="p-0.5">
                            <Star className={`w-5 h-5 ${i <= (noteForm.rating || 0) ? "text-gold fill-gold" : "text-muted-foreground"}`} />
                          </button>
                        ))}
                      </div>
                      <textarea placeholder="Votre avis sur le produit et la livraison..." value={noteForm.note}
                        onChange={e => setNoteForm({ ...noteForm, note: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg border border-input bg-background text-foreground font-body text-sm" rows={2} />
                      <div className="flex gap-2">
                        <button onClick={submitRating} className="btn-gold !text-xs !py-1.5">Envoyer l'avis</button>
                        <button onClick={() => setNoteForm(null)} className="text-xs text-muted-foreground hover:underline">Annuler</button>
                      </div>
                    </div>
                  ) : (
                    <button onClick={() => setNoteForm({ id: order.id, kind: order.kind, note: "", rating: 0 })}
                      className="text-xs text-primary font-body font-semibold hover:underline">⭐ Noter ce produit/service</button>
                  )}
                </div>
              )}
            </div>
          );
        })}
        {orders.length === 0 && <p className="text-muted-foreground font-body text-center py-12">Aucune commande pour le moment</p>}
      </div>
    </DashboardLayout>
  );
};

export default OrdersPage;
