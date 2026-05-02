import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Coins, ArrowDownCircle, ArrowUpCircle, Loader2, Plus, History, Users } from "lucide-react";
import { toast } from "sonner";

type FundTx = {
  id: string;
  user_id: string;
  type: "contribution" | "withdrawal";
  amount: number;
  reason: string | null;
  balance_after: number;
  created_at: string;
};

const CommunityFund = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  const [balance, setBalance] = useState<number>(0);
  const [walletBalance, setWalletBalance] = useState<number>(0);
  const [allTx, setAllTx] = useState<FundTx[]>([]);
  const [profilesMap, setProfilesMap] = useState<Record<string, any>>({});
  const [loadingData, setLoadingData] = useState(true);

  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && !user) navigate("/connexion");
  }, [user, loading, navigate]);

  useEffect(() => {
    if (!user) return;
    loadAll();

    // Realtime subscriptions
    const ch = supabase
      .channel("community-fund")
      .on("postgres_changes", { event: "*", schema: "public", table: "community_fund" },
        (payload: any) => {
          if (payload.new?.balance !== undefined) setBalance(Number(payload.new.balance));
        })
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "fund_transactions" },
        () => loadHistory())
      .subscribe();

    return () => { supabase.removeChannel(ch); };
  }, [user]);

  const loadAll = async () => {
    setLoadingData(true);
    await Promise.all([loadBalance(), loadHistory(), loadWallet()]);
    setLoadingData(false);
  };

  const loadBalance = async () => {
    const { data } = await (supabase as any)
      .from("community_fund").select("balance").eq("id", 1).single();
    if (data) setBalance(Number(data.balance));
  };

  const loadWallet = async () => {
    const { data } = await supabase
      .from("profiles").select("wallet_balance").eq("user_id", user!.id).single();
    if (data) setWalletBalance(Number(data.wallet_balance));
  };

  const loadHistory = async () => {
    const { data } = await (supabase as any)
      .from("fund_transactions").select("*").order("created_at", { ascending: false }).limit(200);
    const list = (data || []) as FundTx[];
    setAllTx(list);
    const ids = Array.from(new Set(list.map(t => t.user_id)));
    if (ids.length) {
      const { data: profs } = await supabase
        .from("profiles").select("user_id, first_name, last_name").in("user_id", ids);
      const map: Record<string, any> = {};
      (profs || []).forEach((p: any) => { map[p.user_id] = p; });
      setProfilesMap(map);
    }
  };

  const myTx = allTx.filter(t => t.user_id === user?.id && t.type === "contribution");

  const submit = async () => {
    const n = Number(amount);
    if (!n || n <= 0) { toast.error("Montant invalide"); return; }
    if (n > walletBalance) { toast.error("Solde portefeuille insuffisant"); return; }
    setSubmitting(true);
    const { error } = await (supabase as any).rpc("contribute_to_fund", { _amount: n });
    setSubmitting(false);
    if (error) { toast.error(error.message); return; }
    toast.success(`✅ ${n.toLocaleString("fr-FR")} FCFA versés au fond`);
    setAmount("");
    setOpen(false);
    loadWallet();
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center">Chargement...</div>;

  return (
    <DashboardLayout>
      <div className="mb-6">
        <h1 className="text-3xl font-heading font-bold text-foreground flex items-center gap-2">
          <Coins className="w-7 h-7 text-gold" /> Fond Communautaire
        </h1>
        <p className="text-muted-foreground font-body mt-1">
          Un fond solidaire alimenté par les Moissonneurs. Solde et mouvements visibles par tous, en temps réel.
        </p>
      </div>

      {/* Solde du fond */}
      <div className="card-elevated bg-gradient-to-br from-gold/10 via-primary/5 to-harvest-green/10 border-gold/30 mb-6">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <p className="text-xs text-muted-foreground font-body uppercase tracking-wide">Solde du fond</p>
            <p className="text-4xl font-heading font-bold text-foreground mt-1">
              {balance.toLocaleString("fr-FR")} <span className="text-xl text-muted-foreground">FCFA</span>
            </p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="lg" className="bg-primary hover:bg-primary/90">
                <Plus className="w-5 h-5 mr-2" /> Cotiser
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Coins className="w-5 h-5 text-gold" /> Verser au fond
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-3">
                <div className="bg-secondary/50 rounded-lg p-3 text-sm">
                  Solde portefeuille : <strong>{walletBalance.toLocaleString("fr-FR")} FCFA</strong>
                </div>
                <div>
                  <Label>Montant à cotiser (FCFA)</Label>
                  <Input
                    type="number" min={1} step={100} value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="Ex : 5000"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setOpen(false)} disabled={submitting}>Annuler</Button>
                <Button onClick={submit} disabled={submitting}>
                  {submitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Verser
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Onglets */}
      <Tabs defaultValue="all">
        <TabsList>
          <TabsTrigger value="all"><Users className="w-4 h-4 mr-1" /> Tous les mouvements</TabsTrigger>
          <TabsTrigger value="mine"><History className="w-4 h-4 mr-1" /> Mes participations</TabsTrigger>
        </TabsList>

        <TabsContent value="all">
          <TxList list={allTx} profilesMap={profilesMap} loading={loadingData} currentUserId={user?.id} />
        </TabsContent>
        <TabsContent value="mine">
          <TxList list={myTx} profilesMap={profilesMap} loading={loadingData} currentUserId={user?.id} hideName />
        </TabsContent>
      </Tabs>
    </DashboardLayout>
  );
};

const TxList = ({ list, profilesMap, loading, currentUserId, hideName }: {
  list: FundTx[]; profilesMap: Record<string, any>; loading: boolean;
  currentUserId?: string; hideName?: boolean;
}) => {
  if (loading) return <div className="text-center py-8 text-muted-foreground">Chargement…</div>;
  if (list.length === 0) return (
    <div className="card-elevated text-center py-8 text-muted-foreground">
      Aucun mouvement pour l'instant.
    </div>
  );
  return (
    <div className="space-y-2 mt-3">
      {list.map(tx => {
        const p = profilesMap[tx.user_id];
        const isWithdraw = tx.type === "withdrawal";
        return (
          <div key={tx.id} className="card-elevated">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                  isWithdraw ? "bg-red-500/10 text-red-600" : "bg-harvest-green/10 text-harvest-green"
                }`}>
                  {isWithdraw ? <ArrowUpCircle className="w-5 h-5" /> : <ArrowDownCircle className="w-5 h-5" />}
                </div>
                <div>
                  <p className="font-heading font-semibold text-foreground">
                    {isWithdraw ? "Retrait administrateur" : "Cotisation"}
                    {!hideName && p && (
                      <span className="text-xs text-muted-foreground font-body ml-2">
                        — {p.first_name} {p.last_name}
                        {tx.user_id === currentUserId && " (vous)"}
                      </span>
                    )}
                  </p>
                  {tx.reason && (
                    <p className="text-sm text-muted-foreground font-body mt-1 italic">
                      Motif : {tx.reason}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground mt-1">
                    {new Date(tx.created_at).toLocaleString("fr-FR")}
                  </p>
                </div>
              </div>
              <div className="text-right shrink-0">
                <p className={`font-heading font-bold ${isWithdraw ? "text-red-600" : "text-harvest-green"}`}>
                  {isWithdraw ? "−" : "+"} {Number(tx.amount).toLocaleString("fr-FR")} FCFA
                </p>
                <Badge variant="secondary" className="mt-1">
                  Solde : {Number(tx.balance_after).toLocaleString("fr-FR")}
                </Badge>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default CommunityFund;
