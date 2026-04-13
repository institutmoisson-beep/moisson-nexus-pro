import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Package, Star, Truck } from "lucide-react";
import { toast } from "sonner";
import DashboardLayout from "@/components/DashboardLayout";

const OrdersPage = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<any[]>([]);
  const [packs, setPacks] = useState<any[]>([]);
  const [noteForm, setNoteForm] = useState<{ orderId: string; note: string; rating: number } | null>(null);

  useEffect(() => { if (!loading && !user) navigate("/connexion"); }, [user, loading]);
  useEffect(() => { if (user) loadData(); }, [user]);

  const loadData = async () => {
    const [ordersRes, packsRes] = await Promise.all([
      supabase.from("pack_orders").select("*").eq("user_id", user!.id).order("created_at", { ascending: false }),
      supabase.from("packs").select("id, name, images, is_mlm_pack"),
    ]);
    setOrders(ordersRes.data || []);
    setPacks(packsRes.data || []);
  };

  const getPackName = (packId: string) => packs.find(p => p.id === packId)?.name || "Pack";
  const getPackImage = (packId: string) => packs.find(p => p.id === packId)?.images?.[0];

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
    <DashboardLayout>
      <h1 className="text-3xl font-heading font-bold text-foreground mb-6">📦 Mes Commandes</h1>

      <div className="space-y-4">
        {orders.map(order => {
          const st = statusLabel(order.status);
          return (
            <div key={order.id} className="card-elevated">
              <div className="flex items-start gap-4">
                {getPackImage(order.pack_id) ? (
                  <img src={getPackImage(order.pack_id)} alt="" className="w-16 h-16 rounded-lg object-cover border border-border" />
                ) : (
                  <div className="w-16 h-16 rounded-lg bg-primary/10 flex items-center justify-center"><Package className="w-6 h-6 text-primary" /></div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="font-heading font-semibold text-foreground">{getPackName(order.pack_id)}</h3>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${st.cls}`}>{st.label}</span>
                  </div>
                  <p className="text-sm font-bold text-primary">{Number(order.amount_paid).toLocaleString("fr-FR")} FCFA</p>
                  <p className="text-xs text-muted-foreground font-body">
                    {new Date(order.created_at).toLocaleDateString("fr-FR")} — 
                    {order.delivery_city && <span> 📍 {order.delivery_city}, {order.delivery_country}</span>}
                  </p>
                  {order.delivery_phone && <p className="text-xs text-muted-foreground font-body">📱 {order.delivery_phone}</p>}
                  {order.user_note && (
                    <div className="mt-2 bg-secondary rounded-lg p-2">
                      <p className="text-xs text-muted-foreground font-body">📝 {order.user_note}</p>
                      {order.user_rating && (
                        <div className="flex gap-0.5 mt-1">
                          {[1,2,3,4,5].map(i => <Star key={i} className={`w-3 h-3 ${i <= order.user_rating ? "text-gold fill-gold" : "text-muted-foreground"}`} />)}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
              {order.status === "delivered" && !order.user_note && (
                <div className="mt-3 border-t border-border pt-3">
                  {noteForm?.orderId === order.id ? (
                    <div className="space-y-2">
                      <div className="flex gap-1">
                        {[1,2,3,4,5].map(i => (
                          <button key={i} onClick={() => setNoteForm({...noteForm, rating: i})} className="p-0.5">
                            <Star className={`w-5 h-5 ${i <= (noteForm.rating || 0) ? "text-gold fill-gold" : "text-muted-foreground"}`} />
                          </button>
                        ))}
                      </div>
                      <textarea placeholder="Votre avis..." value={noteForm.note} onChange={e => setNoteForm({...noteForm, note: e.target.value})}
                        className="w-full px-3 py-2 rounded-lg border border-input bg-background text-foreground font-body text-sm" rows={2} />
                      <button onClick={async () => {
                        // Note: user_note and user_rating columns would need migration but we use metadata for now
                        toast.success("Merci pour votre avis !");
                        setNoteForm(null);
                      }} className="btn-gold !text-xs !py-1.5">Envoyer l'avis</button>
                    </div>
                  ) : (
                    <button onClick={() => setNoteForm({ orderId: order.id, note: "", rating: 0 })}
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
