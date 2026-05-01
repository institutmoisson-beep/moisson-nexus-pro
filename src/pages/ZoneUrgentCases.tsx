import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, LogOut } from "lucide-react";
import logo from "@/assets/logo-moisson.png";
import AdminUrgentCases from "@/components/admin/AdminUrgentCases";
import { toast } from "sonner";

const ZoneUrgentCases = () => {
  const { user, signOut, loading } = useAuth();
  const navigate = useNavigate();
  const [allowed, setAllowed] = useState<boolean | null>(null);

  useEffect(() => {
    if (!loading && !user) { navigate("/connexion"); return; }
    if (!user) return;
    Promise.all([
      supabase.rpc("has_role", { _user_id: user.id, _role: "admin" }),
      supabase.from("staff_roles").select("role").eq("user_id", user.id),
    ]).then(([adminRes, staffRes]) => {
      const isAdmin = !!adminRes.data;
      const roles = (staffRes.data || []).map((r: any) => r.role);
      const hasRegional = roles.some((r: string) =>
        ["moissonneur_pays", "moissonneur_ville", "financier", "gestion_packs",
         "informaticien", "commercial", "communication"].includes(r)
      );
      if (!isAdmin && !hasRegional) {
        toast.error("Accès refusé");
        navigate("/dashboard");
      } else {
        setAllowed(true);
      }
    });
  }, [user, loading, navigate]);

  if (loading || allowed === null) {
    return <div className="min-h-screen flex items-center justify-center">Vérification…</div>;
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card sticky top-0 z-50">
        <div className="container mx-auto px-4 md:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={logo} alt="" className="w-8 h-8" />
            <span className="font-heading text-lg font-bold">Cas Urgents — Ma zone</span>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => navigate(-1)} className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1">
              <ArrowLeft className="w-4 h-4" /> Retour
            </button>
            <button onClick={async () => { await signOut(); navigate("/"); }} className="text-muted-foreground hover:text-foreground">
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>
      <main className="container mx-auto px-4 md:px-6 py-6">
        <AdminUrgentCases />
      </main>
    </div>
  );
};

export default ZoneUrgentCases;
