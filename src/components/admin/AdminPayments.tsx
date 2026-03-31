import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Plus, Copy, ExternalLink, Trash2 } from "lucide-react";

const AdminPayments = () => {
  const [methods, setMethods] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    name: "", type: "mobile_money", contact: "", address: "", email_paypal: "", payment_link: "", instructions: "",
  });

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    const { data } = await supabase.from("payment_methods").select("*").order("created_at", { ascending: false });
    setMethods(data || []);
  };

  const handleCreate = async () => {
    if (!form.name) { toast.error("Nom requis"); return; }
    const details: any = {};
    if (form.contact) details.contact = form.contact;
    if (form.address) details.address = form.address;
    if (form.email_paypal) details.email = form.email_paypal;
    if (form.instructions) details.instructions = form.instructions;

    const { error } = await supabase.from("payment_methods").insert({
      name: form.name, type: form.type, details,
      payment_link: form.payment_link || null,
    });
    if (error) { toast.error("Erreur: " + error.message); return; }
    toast.success("Moyen de paiement ajouté !");
    setShowForm(false);
    setForm({ name: "", type: "mobile_money", contact: "", address: "", email_paypal: "", payment_link: "", instructions: "" });
    loadData();
  };

  const toggleActive = async (id: string, current: boolean) => {
    await supabase.from("payment_methods").update({ is_active: !current }).eq("id", id);
    toast.success(current ? "Désactivé" : "Activé");
    loadData();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-heading font-bold text-foreground">Moyens de paiement</h1>
        <button onClick={() => setShowForm(!showForm)} className="btn-hero !text-sm !py-2 !px-4">
          <Plus className="w-4 h-4 mr-1" /> Ajouter
        </button>
      </div>

      {showForm && (
        <div className="card-elevated mb-6 space-y-3">
          <input placeholder="Nom (ex: Orange Money CI)" value={form.name} onChange={e => setForm({...form, name: e.target.value})}
            className="w-full px-3 py-2 rounded-lg border border-input bg-background text-foreground font-body text-sm" />
          <select value={form.type} onChange={e => setForm({...form, type: e.target.value})}
            className="w-full px-3 py-2 rounded-lg border border-input bg-background text-foreground font-body text-sm">
            <option value="mobile_money">Mobile Money</option>
            <option value="crypto">Cryptomonnaie</option>
            <option value="paypal">PayPal</option>
            <option value="bank">Virement bancaire</option>
            <option value="other">Autre</option>
          </select>

          {(form.type === "mobile_money" || form.type === "other") && (
            <input placeholder="Numéro de contact" value={form.contact} onChange={e => setForm({...form, contact: e.target.value})}
              className="w-full px-3 py-2 rounded-lg border border-input bg-background text-foreground font-body text-sm" />
          )}
          {form.type === "crypto" && (
            <input placeholder="Adresse du portefeuille crypto" value={form.address} onChange={e => setForm({...form, address: e.target.value})}
              className="w-full px-3 py-2 rounded-lg border border-input bg-background text-foreground font-body text-sm" />
          )}
          {form.type === "paypal" && (
            <input placeholder="Email PayPal" value={form.email_paypal} onChange={e => setForm({...form, email_paypal: e.target.value})}
              className="w-full px-3 py-2 rounded-lg border border-input bg-background text-foreground font-body text-sm" />
          )}

          <input placeholder="🔗 Lien de paiement cliquable (optionnel)" value={form.payment_link} onChange={e => setForm({...form, payment_link: e.target.value})}
            className="w-full px-3 py-2 rounded-lg border border-input bg-background text-foreground font-body text-sm" />
          <textarea placeholder="Instructions supplémentaires" value={form.instructions} onChange={e => setForm({...form, instructions: e.target.value})}
            className="w-full px-3 py-2 rounded-lg border border-input bg-background text-foreground font-body text-sm" rows={2} />
          <button onClick={handleCreate} className="btn-gold !text-sm !py-2">Ajouter</button>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-4">
        {methods.map((m: any) => (
          <div key={m.id} className={`card-elevated ${!m.is_active ? "opacity-50" : ""}`}>
            <div className="flex justify-between items-start mb-2">
              <div>
                <h3 className="font-heading font-semibold text-foreground">{m.name}</h3>
                <p className="text-xs text-muted-foreground font-body capitalize">{m.type.replace(/_/g, " ")}</p>
              </div>
              <button onClick={() => toggleActive(m.id, m.is_active)}
                className={`text-xs px-2 py-1 rounded font-body ${m.is_active ? "bg-destructive/10 text-destructive" : "bg-harvest-green/10 text-harvest-green"}`}>
                {m.is_active ? "Désactiver" : "Activer"}
              </button>
            </div>
            <div className="space-y-1 text-sm font-body">
              {m.details?.contact && <p className="flex items-center gap-2">📱 {m.details.contact}</p>}
              {m.details?.address && <p className="flex items-center gap-2 break-all">💰 {m.details.address}</p>}
              {m.details?.email && <p className="flex items-center gap-2">📧 {m.details.email}</p>}
              {m.details?.instructions && <p className="text-xs text-muted-foreground mt-1">{m.details.instructions}</p>}
              {m.payment_link && (
                <a href={m.payment_link} target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-primary hover:underline text-xs mt-1">
                  <ExternalLink className="w-3 h-3" /> Lien de paiement
                </a>
              )}
            </div>
          </div>
        ))}
        {methods.length === 0 && <p className="text-muted-foreground font-body col-span-2 text-center py-8">Aucun moyen configuré</p>}
      </div>
    </div>
  );
};

export default AdminPayments;
