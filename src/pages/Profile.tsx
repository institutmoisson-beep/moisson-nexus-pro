import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Copy, Share2, User, Mail, Phone, MapPin, Award } from "lucide-react";
import { toast } from "sonner";
import DashboardLayout from "@/components/DashboardLayout";

const CAREER_LEVELS = [
  { key: "semeur", label: "Semeur", desc: "Inscription + achat pack", icon: "🌱" },
  { key: "cultivateur", label: "Cultivateur", desc: "5 directs MLM actifs", icon: "🌿" },
  { key: "moissonneur", label: "Moissonneur", desc: "20 directs + volume réseau", icon: "🌾" },
  { key: "guide_de_champ", label: "Guide de Champ", desc: "3 leaders niveau 5", icon: "🏕️" },
  { key: "maitre_moissonneur", label: "Maître Moissonneur", desc: "3 Guide de Champ", icon: "⚔️" },
  { key: "grand_moissonneur", label: "Grand Moissonneur", desc: "Réseau international", icon: "👑" },
  { key: "ambassadeur_moisson", label: "Ambassadeur Moisson", desc: "Impact continental", icon: "🌍" },
  { key: "stratege_moisson", label: "Stratège Moisson", desc: "Stratégie globale", icon: "🧠" },
  { key: "elite_moisson", label: "Élite Moisson", desc: "Top 1% du réseau", icon: "💎" },
  { key: "guide_moissonneur", label: "Guide Moissonneur", desc: "Légende vivante", icon: "🏆" },
];

const ProfilePage = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<any>(null);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ phone: "", address: "", city: "", street: "", country: "" });

  useEffect(() => {
    if (!loading && !user) navigate("/connexion");
  }, [user, loading]);

  useEffect(() => {
    if (user) loadProfile();
  }, [user]);

  const loadProfile = async () => {
    const { data } = await supabase.from("profiles").select("*").eq("user_id", user!.id).single();
    setProfile(data);
    if (data) setForm({ phone: data.phone || "", address: data.address || "", city: data.city || "", street: data.street || "", country: data.country || "" });
  };

  const saveProfile = async () => {
    await supabase.from("profiles").update(form).eq("user_id", user!.id);
    toast.success("Profil mis à jour !");
    setEditing(false);
    loadProfile();
  };

  const referralLink = profile ? `${window.location.origin}/inscription?ref=${profile.referral_code}` : "";

  const currentLevelIndex = CAREER_LEVELS.findIndex(l => l.key === profile?.career_level);

  if (loading || !profile) {
    return <div className="min-h-screen flex items-center justify-center bg-background"><div className="animate-pulse text-muted-foreground font-body">Chargement...</div></div>;
  }

  return (
    <DashboardLayout>
      <h1 className="text-3xl font-heading font-bold text-foreground mb-6">👤 Mon Profil</h1>

      {/* Info Card */}
      <div className="card-elevated mb-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
            <span className="text-2xl font-bold text-primary">{profile.first_name.charAt(0)}{profile.last_name.charAt(0)}</span>
          </div>
          <div>
            <h2 className="text-xl font-heading font-bold text-foreground">{profile.first_name} {profile.last_name}</h2>
            <p className="text-sm text-muted-foreground font-body capitalize">{profile.career_level.replace(/_/g, " ")}</p>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-4 text-sm font-body">
          <div className="flex items-center gap-2"><Mail className="w-4 h-4 text-muted-foreground" /> {profile.email}</div>
          <div className="flex items-center gap-2"><Phone className="w-4 h-4 text-muted-foreground" /> {profile.phone || "Non renseigné"}</div>
          <div className="flex items-center gap-2"><MapPin className="w-4 h-4 text-muted-foreground" /> {profile.country || "Non renseigné"}{profile.city ? `, ${profile.city}` : ""}</div>
          <div className="flex items-center gap-2"><Award className="w-4 h-4 text-muted-foreground" /> MLM: {profile.is_mlm_active ? "Actif ✅" : "Inactif"}</div>
        </div>

        {!editing ? (
          <button onClick={() => setEditing(true)} className="mt-4 btn-hero !text-sm !py-2 !px-4">Modifier mon profil</button>
        ) : (
          <div className="mt-4 space-y-3 border-t border-border pt-4">
            <input placeholder="Téléphone" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})}
              className="w-full px-3 py-2 rounded-lg border border-input bg-background text-foreground font-body text-sm" />
            <input placeholder="Pays" value={form.country} onChange={e => setForm({...form, country: e.target.value})}
              className="w-full px-3 py-2 rounded-lg border border-input bg-background text-foreground font-body text-sm" />
            <input placeholder="Ville" value={form.city} onChange={e => setForm({...form, city: e.target.value})}
              className="w-full px-3 py-2 rounded-lg border border-input bg-background text-foreground font-body text-sm" />
            <input placeholder="Rue / Quartier" value={form.street} onChange={e => setForm({...form, street: e.target.value})}
              className="w-full px-3 py-2 rounded-lg border border-input bg-background text-foreground font-body text-sm" />
            <input placeholder="Adresse" value={form.address} onChange={e => setForm({...form, address: e.target.value})}
              className="w-full px-3 py-2 rounded-lg border border-input bg-background text-foreground font-body text-sm" />
            <div className="flex gap-3">
              <button onClick={saveProfile} className="btn-gold !text-sm !py-2">Enregistrer</button>
              <button onClick={() => setEditing(false)} className="px-4 py-2 rounded-lg border border-input text-muted-foreground font-body text-sm">Annuler</button>
            </div>
          </div>
        )}
      </div>

      {/* Referral Card */}
      <div className="card-elevated mb-6">
        <h2 className="text-lg font-heading font-semibold text-foreground mb-4">🌱 Code Moissonneur</h2>
        <div className="flex items-center gap-3 mb-4">
          <div className="flex-1 px-4 py-3 rounded-lg bg-secondary font-mono text-lg text-foreground font-bold tracking-wider">
            {profile.referral_code}
          </div>
          <button onClick={() => { navigator.clipboard.writeText(profile.referral_code); toast.success("Code copié !"); }}
            className="p-3 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors"><Copy className="w-5 h-5" /></button>
        </div>
        <div className="flex gap-3">
          <button onClick={() => { navigator.clipboard.writeText(referralLink); toast.success("Lien copié !"); }}
            className="flex-1 btn-hero !text-sm !py-2.5 !px-4"><Copy className="w-4 h-4 mr-2" /> Copier le lien</button>
          <button onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent(`Rejoins Institut Moisson avec mon code : ${profile.referral_code}\n${referralLink}`)}`, "_blank")}
            className="flex-1 inline-flex items-center justify-center rounded-lg px-4 py-2.5 text-sm font-semibold transition-all bg-harvest-green text-harvest-green-foreground hover:opacity-90">
            <Share2 className="w-4 h-4 mr-2" /> WhatsApp
          </button>
        </div>
      </div>

      {/* Career Progress */}
      <div className="card-elevated">
        <h2 className="text-lg font-heading font-semibold text-foreground mb-4">🏆 Profil de carrière</h2>
        <div className="space-y-3">
          {CAREER_LEVELS.map((level, i) => (
            <div key={level.key} className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${
              i === currentLevelIndex ? "bg-primary/10 border border-primary/30" :
              i < currentLevelIndex ? "bg-harvest-green/5" : "bg-muted/30"
            }`}>
              <span className="text-xl">{level.icon}</span>
              <div className="flex-1">
                <p className={`text-sm font-semibold font-body ${i <= currentLevelIndex ? "text-foreground" : "text-muted-foreground"}`}>{level.label}</p>
                <p className="text-xs text-muted-foreground font-body">{level.desc}</p>
              </div>
              {i < currentLevelIndex && <span className="text-harvest-green text-xs font-bold">✓</span>}
              {i === currentLevelIndex && <span className="text-primary text-xs font-bold">Actuel</span>}
            </div>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default ProfilePage;
