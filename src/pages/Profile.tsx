import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Copy, Share2, Mail, Phone, MapPin, Award, Truck, Camera, ShieldCheck, IdCard, Loader2, Eye } from "lucide-react";
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
  const [uploading, setUploading] = useState<null | "avatar" | "front" | "back">(null);
  const [signedIds, setSignedIds] = useState<{ front?: string; back?: string }>({});
  const avatarRef = useRef<HTMLInputElement>(null);
  const frontRef = useRef<HTMLInputElement>(null);
  const backRef = useRef<HTMLInputElement>(null);

  useEffect(() => { if (!loading && !user) navigate("/connexion"); }, [user, loading]);
  useEffect(() => { if (user) loadProfile(); }, [user]);

  const loadProfile = async () => {
    const { data } = await supabase.from("profiles").select("*").eq("user_id", user!.id).single();
    setProfile(data);
    if (data) {
      setForm({ phone: data.phone || "", address: data.address || "", city: data.city || "", street: data.street || "", country: data.country || "" });
      const signed: { front?: string; back?: string } = {};
      if (data.id_card_front_url) {
        const { data: s } = await supabase.storage.from("id-cards").createSignedUrl(data.id_card_front_url, 600);
        if (s) signed.front = s.signedUrl;
      }
      if (data.id_card_back_url) {
        const { data: s } = await supabase.storage.from("id-cards").createSignedUrl(data.id_card_back_url, 600);
        if (s) signed.back = s.signedUrl;
      }
      setSignedIds(signed);
    }
  };

  const uploadAvatar = async (file: File) => {
    if (!file.type.startsWith("image/")) return toast.error("Image uniquement");
    if (file.size > 5 * 1024 * 1024) return toast.error("Max 5 Mo");
    setUploading("avatar");
    try {
      const ext = file.name.split(".").pop() || "jpg";
      const path = `avatars/${user!.id}/${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from("images").upload(path, file, { upsert: true });
      if (error) throw error;
      const { data: { publicUrl } } = supabase.storage.from("images").getPublicUrl(path);
      await supabase.from("profiles").update({ avatar_url: publicUrl }).eq("user_id", user!.id);
      toast.success("Photo de profil mise à jour");
      loadProfile();
    } catch (e: any) { toast.error(e.message); }
    finally { setUploading(null); }
  };

  const uploadIdCard = async (file: File, side: "front" | "back") => {
    if (!file.type.startsWith("image/")) return toast.error("Image uniquement");
    if (file.size > 8 * 1024 * 1024) return toast.error("Max 8 Mo");
    setUploading(side);
    try {
      const ext = file.name.split(".").pop() || "jpg";
      const path = `${user!.id}/${side}-${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from("id-cards").upload(path, file, { upsert: true });
      if (error) throw error;
      const col = side === "front" ? "id_card_front_url" : "id_card_back_url";
      await supabase.from("profiles").update({ [col]: path, is_verified: false } as any).eq("user_id", user!.id);
      toast.success(`Pièce ${side === "front" ? "recto" : "verso"} envoyée — en attente de vérification`);
      loadProfile();
    } catch (e: any) { toast.error(e.message); }
    finally { setUploading(null); }
  };



  const saveProfile = async () => {
    await supabase.from("profiles").update(form).eq("user_id", user!.id);
    toast.success("Profil mis à jour !");
    setEditing(false);
    loadProfile();
  };

  const referralLink = profile ? `${window.location.origin}/inscription?ref=${profile.referral_code}` : "";

  const currentLevelIndex = CAREER_LEVELS.findIndex(l => l.key === profile?.career_level);
  const currentLevel = CAREER_LEVELS[currentLevelIndex];
  const nextLevel = currentLevelIndex < CAREER_LEVELS.length - 1 ? CAREER_LEVELS[currentLevelIndex + 1] : null;

  if (loading || !profile) {
    return <div className="min-h-screen flex items-center justify-center bg-background"><div className="animate-pulse text-muted-foreground font-body">Chargement...</div></div>;
  }

  return (
    <DashboardLayout>
      <h1 className="text-3xl font-heading font-bold text-foreground mb-6">👤 Mon Profil</h1>

      {/* Info Card */}
      <div className="card-elevated mb-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="relative group">
            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden border-2 border-primary/20">
              {profile.avatar_url ? (
                <img src={profile.avatar_url} alt="avatar" className="w-full h-full object-cover" />
              ) : (
                <span className="text-2xl font-bold text-primary">{profile.first_name.charAt(0)}{profile.last_name.charAt(0)}</span>
              )}
            </div>
            <button onClick={() => avatarRef.current?.click()} disabled={uploading === "avatar"}
              className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-md hover:opacity-90 disabled:opacity-50">
              {uploading === "avatar" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
            </button>
            <input ref={avatarRef} type="file" accept="image/*" className="hidden"
              onChange={e => e.target.files?.[0] && uploadAvatar(e.target.files[0])} />
          </div>
          <div>
            <h2 className="text-xl font-heading font-bold text-foreground flex items-center gap-2">
              {profile.first_name} {profile.last_name}
              {profile.is_verified && <span title="Compte vérifié" className="inline-flex items-center gap-1 text-xs font-semibold bg-harvest-green/20 text-harvest-green px-2 py-0.5 rounded-full"><ShieldCheck className="w-3 h-3" />Vérifié</span>}
            </h2>
            <p className="text-sm text-muted-foreground font-body capitalize">{profile.career_level.replace(/_/g, " ")}</p>
          </div>
        </div>


        <div className="grid md:grid-cols-2 gap-4 text-sm font-body">
          <div className="flex items-center gap-2"><Mail className="w-4 h-4 text-muted-foreground" /> {profile.email}</div>
          <div className="flex items-center gap-2"><Phone className="w-4 h-4 text-muted-foreground" /> {profile.phone || "Non renseigné"}</div>
          <div className="flex items-center gap-2"><MapPin className="w-4 h-4 text-muted-foreground" /> {profile.country || "Non renseigné"}{profile.city ? `, ${profile.city}` : ""}</div>
          <div className="flex items-center gap-2"><Award className="w-4 h-4 text-muted-foreground" /> MLM: {profile.is_mlm_active ? "Actif ✅" : "Inactif"}</div>
        </div>

        {/* Delivery Address Section */}
        <div className="mt-4 pt-4 border-t border-border">
          <h3 className="font-heading font-semibold text-foreground flex items-center gap-2 mb-2"><Truck className="w-4 h-4" /> Adresse de livraison</h3>
          {!editing ? (
            <div className="text-sm font-body text-muted-foreground space-y-1">
              <p>{profile.street || "Rue non renseignée"}</p>
              <p>{profile.city || "Ville non renseignée"}, {profile.country || "Pays non renseigné"}</p>
              <p>{profile.address || ""}</p>
            </div>
          ) : null}
        </div>

        {!editing ? (
          <button onClick={() => setEditing(true)} className="mt-4 btn-hero !text-sm !py-2 !px-4">Modifier mon profil</button>
        ) : (
          <div className="mt-4 space-y-3 border-t border-border pt-4">
            <input placeholder="Téléphone" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})}
              className="w-full px-3 py-2 rounded-lg border border-input bg-background text-foreground font-body text-sm" />
            <h3 className="font-heading font-semibold text-foreground flex items-center gap-2 text-sm"><Truck className="w-4 h-4" /> Adresse de livraison</h3>
            <input placeholder="Pays" value={form.country} onChange={e => setForm({...form, country: e.target.value})}
              className="w-full px-3 py-2 rounded-lg border border-input bg-background text-foreground font-body text-sm" />
            <input placeholder="Ville" value={form.city} onChange={e => setForm({...form, city: e.target.value})}
              className="w-full px-3 py-2 rounded-lg border border-input bg-background text-foreground font-body text-sm" />
            <input placeholder="Rue / Quartier" value={form.street} onChange={e => setForm({...form, street: e.target.value})}
              className="w-full px-3 py-2 rounded-lg border border-input bg-background text-foreground font-body text-sm" />
            <input placeholder="Adresse complète" value={form.address} onChange={e => setForm({...form, address: e.target.value})}
              className="w-full px-3 py-2 rounded-lg border border-input bg-background text-foreground font-body text-sm" />
            <div className="flex gap-3">
              <button onClick={saveProfile} className="btn-gold !text-sm !py-2">Enregistrer</button>
              <button onClick={() => setEditing(false)} className="px-4 py-2 rounded-lg border border-input text-muted-foreground font-body text-sm">Annuler</button>
            </div>
          </div>
        )}
      </div>

      {/* ID Card Verification */}
      <div className="card-elevated mb-6">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-lg font-heading font-semibold text-foreground flex items-center gap-2"><IdCard className="w-5 h-5 text-primary" /> Pièce d'identité</h2>
          {profile.is_verified ? (
            <span className="inline-flex items-center gap-1 text-xs font-semibold bg-harvest-green/20 text-harvest-green px-2.5 py-1 rounded-full"><ShieldCheck className="w-3.5 h-3.5" /> Compte vérifié</span>
          ) : (profile.id_card_front_url || profile.id_card_back_url) ? (
            <span className="text-xs font-semibold bg-gold/20 text-gold px-2.5 py-1 rounded-full">En attente</span>
          ) : (
            <span className="text-xs font-semibold bg-muted text-muted-foreground px-2.5 py-1 rounded-full">Non fournie</span>
          )}
        </div>
        <p className="text-xs text-muted-foreground font-body mb-4">Téléchargez le recto et le verso de votre pièce d'identité. Vos images restent privées et ne sont visibles que par l'administration.</p>
        <div className="grid grid-cols-2 gap-3">
          {(["front","back"] as const).map(side => {
            const url = side === "front" ? signedIds.front : signedIds.back;
            const label = side === "front" ? "Recto" : "Verso";
            const ref = side === "front" ? frontRef : backRef;
            return (
              <div key={side} className="rounded-lg border border-dashed border-border bg-secondary/30 p-2 flex flex-col items-center">
                <div className="w-full aspect-[1.586/1] rounded-md bg-muted/50 overflow-hidden flex items-center justify-center mb-2">
                  {url ? <img src={url} alt={label} className="w-full h-full object-cover" /> : <IdCard className="w-8 h-8 text-muted-foreground/50" />}
                </div>
                <button onClick={() => ref.current?.click()} disabled={uploading === side}
                  className="w-full btn-hero !text-xs !py-2 !px-2 inline-flex items-center justify-center gap-1">
                  {uploading === side ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Camera className="w-3.5 h-3.5" />}
                  {url ? `Remplacer ${label.toLowerCase()}` : `Envoyer ${label.toLowerCase()}`}
                </button>
                <input ref={ref} type="file" accept="image/*" className="hidden"
                  onChange={e => e.target.files?.[0] && uploadIdCard(e.target.files[0], side)} />
              </div>
            );
          })}
        </div>
      </div>


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

      {/* Career Progress - Current + Next only */}
      <div className="card-elevated">
        <h2 className="text-lg font-heading font-semibold text-foreground mb-4">🏆 Profil de carrière</h2>
        <div className="space-y-3">
          {currentLevel && (
            <div className="flex items-center gap-3 p-4 rounded-lg bg-primary/10 border border-primary/30">
              <span className="text-2xl">{currentLevel.icon}</span>
              <div className="flex-1">
                <p className="text-sm font-semibold font-body text-foreground">{currentLevel.label}</p>
                <p className="text-xs text-muted-foreground font-body">{currentLevel.desc}</p>
              </div>
              <span className="text-primary text-xs font-bold bg-primary/10 px-2 py-1 rounded-full">Actuel</span>
            </div>
          )}
          {nextLevel && (
            <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/30 border border-border">
              <span className="text-2xl">{nextLevel.icon}</span>
              <div className="flex-1">
                <p className="text-sm font-semibold font-body text-muted-foreground">{nextLevel.label}</p>
                <p className="text-xs text-muted-foreground font-body">{nextLevel.desc}</p>
              </div>
              <span className="text-gold text-xs font-bold bg-gold/10 px-2 py-1 rounded-full">Prochain</span>
            </div>
          )}
          {!nextLevel && currentLevel && (
            <div className="text-center py-4">
              <p className="text-sm text-harvest-green font-body font-semibold">🏆 Vous avez atteint le niveau maximum !</p>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default ProfilePage;
