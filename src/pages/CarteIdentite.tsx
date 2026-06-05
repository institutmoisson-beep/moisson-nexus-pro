import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import DashboardLayout from "@/components/DashboardLayout";
import CarteIdentiteMoissonneur from "@/components/CarteIdentiteMoissonneur";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { ScanLine } from "lucide-react";

export default function CarteIdentitePage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => { if (!loading && !user) navigate("/connexion"); }, [user, loading, navigate]);

  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("*").eq("user_id", user.id).single()
      .then(({ data }) => setProfile(data));
  }, [user]);

  if (!profile) {
    return <DashboardLayout><div className="text-center text-muted-foreground py-12">Chargement de votre carte...</div></DashboardLayout>;
  }

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl md:text-3xl font-heading font-bold">🎖️ Ma Carte d'Identité</h1>
          <Link to="/verifier" className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90">
            <ScanLine className="w-4 h-4" /> Scanner
          </Link>
        </div>

        <CarteIdentiteMoissonneur profile={profile} />

        <div className="mt-8 p-4 rounded-lg bg-card border border-border text-sm text-muted-foreground">
          <p className="font-heading font-semibold text-foreground mb-2">🔒 Sécurité anti-fraude</p>
          <ul className="space-y-1 text-xs">
            <li>• L'horloge en temps réel sous le QR Code prouve qu'il s'agit d'une vraie application et non d'une capture d'écran.</li>
            <li>• Le QR Code contient un token unique qui pointe vers l'outil de vérification interne.</li>
            <li>• Tout autre Moissonneur peut scanner votre carte via "Vérificateur de Communauté".</li>
          </ul>
        </div>
      </div>
    </DashboardLayout>
  );
}
