import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
} from "@/components/ui/dialog";
import { Coins, ArrowUpCircle, ArrowDownCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";

const AdminCommunityFund = () => {
  const [balance, setBalance] = useState(0);
  const [tx, setTx] = useState<any[]>([]);
  const [profilesMap, setProfilesMap] = useState<Record<string, any>>({});
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const load = async () => {
    const [{ data: f }, { data: t }] = await Promise.all([
      (supabase as any).from("community_fund").select("balance").eq("id", 1).single(),
      (supabase as any).from("fund_transactions").select("*").order("created_at", { ascending: false }).limit(200),
    ]);
    if (f) setBalance(Number(f.balance));
    setTx(t || []);
    const ids = Array.from(new Set((t || []).map((x: any) => x.user_id)));
    if (ids.length) {
      const { data: profs } = await supabase
        .from("profiles").select("user_id, first_name, last_name").in("user_id", ids);
      const map: Record<string, any> = {};
      (profs || []).forEach((p: any) => { map[p.user_id] = p; });
      setProfilesMap(map);
    }
  };

  useEffect(() => {
    load();
    const ch = supabase
      .channel("admin-fund")
      .on("postgres_changes", { event: "*", schema: "public", table: "community_fund" },
        (p: any) => p.new?.balance !== undefined && setBalance(Number(p.new.balance)))
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "fund_transactions" },
        () => load())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  const withdraw = async () => {
    const n = Number(amount);
    if (!n || n <= 0) { toast.error("Montant invalide"); return; }
    if (!reason.trim() || reason.trim().length < 3) { toast.error("Motif obligatoire (3+ caractères)"); return; }
    if (n > balance) { toast.error("Solde du fond insuffisant"); return; }
    setSubmitting(true);
    const { error } = await (supabase as any).rpc("admin_withdraw_from_fund", {
      _amount: n, _reason: reason.trim(),
    });
    setSubmitting(false);
    if (error) { toast.error(error.message); return; }
    toast.success("✅ Retrait effectué");
    setAmount(""); setReason(""); setOpen(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <h2 className="text-2xl font-heading font-bold flex items-center gap-2">
          <Coins className="w-6 h-6 text-gold" /> Fond Communautaire
        </h2>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button variant="destructive">
              <ArrowUpCircle className="w-4 h-4 mr-2" /> Retirer du fond
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Retrait du fond communautaire</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div className="bg-secondary/50 rounded-lg p-3 text-sm">
                Solde actuel : <strong>{balance.toLocaleString("fr-FR")} FCFA</strong>
              </div>
              <div>
                <Label>Montant (FCFA) *</Label>
                <Input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} />
              </div>
              <div>
                <Label>Motif * (visible par tous les utilisateurs)</Label>
                <Textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={3}
                  placeholder="Ex : Aide d'urgence à Mme X (10 000 FCFA, mandat #123)" />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)} disabled={submitting}>Annuler</Button>
              <Button variant="destructive" onClick={withdraw} disabled={submitting}>
                {submitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Confirmer le retrait
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="card-elevated bg-gradient-to-br from-gold/10 to-primary/5">
        <p className="text-xs uppercase text-muted-foreground tracking-wide">Solde du fond</p>
        <p className="text-4xl font-heading font-bold mt-1">
          {balance.toLocaleString("fr-FR")} <span className="text-xl text-muted-foreground">FCFA</span>
        </p>
      </div>

      <div className="space-y-2">
        <h3 className="font-heading font-semibold mt-4">Historique complet ({tx.length})</h3>
        {tx.length === 0 ? (
          <div className="card-elevated text-center py-6 text-muted-foreground">Aucun mouvement.</div>
        ) : tx.map((t: any) => {
          const p = profilesMap[t.user_id];
          const isW = t.type === "withdrawal";
          return (
            <div key={t.id} className="card-elevated">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    isW ? "bg-red-500/10 text-red-600" : "bg-harvest-green/10 text-harvest-green"
                  }`}>
                    {isW ? <ArrowUpCircle className="w-5 h-5" /> : <ArrowDownCircle className="w-5 h-5" />}
                  </div>
                  <div>
                    <p className="font-heading font-semibold">
                      {isW ? "Retrait" : "Cotisation"}
                      {p && <span className="text-xs text-muted-foreground ml-2">— {p.first_name} {p.last_name}</span>}
                    </p>
                    {t.reason && <p className="text-sm text-muted-foreground italic mt-1">Motif : {t.reason}</p>}
                    <p className="text-xs text-muted-foreground mt-1">{new Date(t.created_at).toLocaleString("fr-FR")}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`font-heading font-bold ${isW ? "text-red-600" : "text-harvest-green"}`}>
                    {isW ? "−" : "+"} {Number(t.amount).toLocaleString("fr-FR")}
                  </p>
                  <Badge variant="secondary" className="mt-1">Solde : {Number(t.balance_after).toLocaleString("fr-FR")}</Badge>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default AdminCommunityFund;
