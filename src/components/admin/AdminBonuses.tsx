import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

const AdminBonuses = () => {
  const [bonuses, setBonuses] = useState<any[]>([]);

  useEffect(() => {
    supabase.from("career_bonuses").select("*").then(({ data }) => setBonuses(data || []));
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-heading font-bold text-foreground mb-6">Bonus de carrière</h1>
      <table className="w-full text-sm font-body">
        <thead><tr className="border-b border-border text-muted-foreground">
          <th className="text-left py-2 px-3">Profil</th><th className="text-right py-2 px-3">Bonus</th>
          <th className="text-right py-2 px-3">Mensuel</th><th className="text-left py-2 px-3">Conditions</th>
        </tr></thead>
        <tbody>
          {bonuses.map((b: any) => (
            <tr key={b.id} className="border-b border-border/50">
              <td className="py-2 px-3 font-semibold capitalize">{b.career_level.replace(/_/g, " ")}</td>
              <td className="py-2 px-3 text-right font-bold text-primary">{Number(b.bonus_amount).toLocaleString("fr-FR")} FCFA</td>
              <td className="py-2 px-3 text-right">{Number(b.monthly_bonus).toLocaleString("fr-FR")} FCFA</td>
              <td className="py-2 px-3 text-xs">{b.requirements || "—"}</td>
            </tr>
          ))}
          {bonuses.length === 0 && <tr><td colSpan={4} className="py-8 text-center text-muted-foreground">Aucun bonus configuré</td></tr>}
        </tbody>
      </table>
    </div>
  );
};

export default AdminBonuses;
