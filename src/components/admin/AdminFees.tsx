import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const AdminFees = () => {
  const [withdrawalFee, setWithdrawalFee] = useState("");
  const [transferFee, setTransferFee] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => { loadFees(); }, []);

  const loadFees = async () => {
    const { data } = await supabase.from("mlm_config").select("*").in("key", ["withdrawal_fee_percent", "transfer_fee_percent"]);
    (data || []).forEach((c: any) => {
      if (c.key === "withdrawal_fee_percent") setWithdrawalFee(String(c.value));
      if (c.key === "transfer_fee_percent") setTransferFee(String(c.value));
    });
  };

  const saveFee = async (key: string, value: string) => {
    setSaving(true);
    const { data: existing } = await supabase.from("mlm_config").select("id").eq("key", key).single();
    if (existing) {
      await supabase.from("mlm_config").update({ value: Number(value) }).eq("key", key);
    } else {
      await supabase.from("mlm_config").insert({ key, value: Number(value) });
    }
    setSaving(false);
    toast.success("Frais mis à jour !");
  };

  return (
    <div>
      <h1 className="text-2xl font-heading font-bold text-foreground mb-6">Frais & Configuration</h1>
      <div className="grid md:grid-cols-2 gap-6">
        <div className="card-elevated">
          <h3 className="font-heading font-semibold text-foreground mb-3">Frais de retrait</h3>
          <div className="flex items-end gap-3">
            <div className="flex-1">
              <label className="text-sm font-body text-muted-foreground">Pourcentage (%)</label>
              <input type="number" step="0.1" value={withdrawalFee} onChange={e => setWithdrawalFee(e.target.value)}
                className="w-full mt-1 px-3 py-2 rounded-lg border border-input bg-background text-foreground font-body text-sm" placeholder="Ex: 5" />
            </div>
            <button onClick={() => saveFee("withdrawal_fee_percent", withdrawalFee)} disabled={saving}
              className="btn-gold !text-sm !py-2 !px-4">Sauver</button>
          </div>
        </div>
        <div className="card-elevated">
          <h3 className="font-heading font-semibold text-foreground mb-3">Frais de transfert</h3>
          <div className="flex items-end gap-3">
            <div className="flex-1">
              <label className="text-sm font-body text-muted-foreground">Pourcentage (%)</label>
              <input type="number" step="0.1" value={transferFee} onChange={e => setTransferFee(e.target.value)}
                className="w-full mt-1 px-3 py-2 rounded-lg border border-input bg-background text-foreground font-body text-sm" placeholder="Ex: 2" />
            </div>
            <button onClick={() => saveFee("transfer_fee_percent", transferFee)} disabled={saving}
              className="btn-gold !text-sm !py-2 !px-4">Sauver</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminFees;
