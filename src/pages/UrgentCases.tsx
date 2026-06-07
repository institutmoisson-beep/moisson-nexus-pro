import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertTriangle, Plus, Send, Image as ImageIcon, Loader2, MessageCircle } from "lucide-react";
import { toast } from "sonner";

type UrgentCase = {
  id: string;
  user_id: string;
  title: string;
  description: string;
  images: string[];
  country: string | null;
  city: string | null;
  address: string | null;
  phone: string | null;
  severity: "low" | "medium" | "high" | "critical";
  status: "open" | "in_progress" | "resolved" | "closed";
  created_at: string;
  resolved_at: string | null;
};

const SEVERITY_COLORS: Record<string, string> = {
  low: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  medium: "bg-amber-500/10 text-amber-600 border-amber-500/20",
  high: "bg-orange-500/10 text-orange-600 border-orange-500/20",
  critical: "bg-red-500/10 text-red-600 border-red-500/20",
};
const SEVERITY_LABEL: Record<string, string> = {
  low: "Faible", medium: "Modéré", high: "Élevé", critical: "Critique",
};
const STATUS_LABEL: Record<string, string> = {
  open: "Ouvert", in_progress: "En cours", resolved: "Résolu", closed: "Clôturé",
};

const UrgentCases = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [cases, setCases] = useState<UrgentCase[]>([]);
  const [loadingList, setLoadingList] = useState(true);
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<UrgentCase | null>(null);

  // Form
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [severity, setSeverity] = useState<"low" | "medium" | "high" | "critical">("medium");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && !user) navigate("/connexion");
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user) load();
  }, [user]);

  const load = async () => {
    setLoadingList(true);
    const { data } = await supabase
      .from("urgent_cases" as any)
      .select("*")
      .eq("user_id", user!.id)
      .order("created_at", { ascending: false });
    setCases((data || []) as any);
    setLoadingList(false);
  };

  const submit = async () => {
    if (!title.trim() || !description.trim()) {
      toast.error("Titre et description obligatoires");
      return;
    }
    setSubmitting(true);
    try {
      // Upload images — store the storage PATH (bucket is private; we render via signed URLs)
      const urls: string[] = [];
      for (const file of files) {
        const path = `${user!.id}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.]/g, "_")}`;
        const { error: upErr } = await supabase.storage.from("urgent-cases").upload(path, file);
        if (upErr) { console.error(upErr); continue; }
        urls.push(path);
      }

      // Get profile for country/city
      const { data: profile } = await supabase
        .from("profiles").select("country, city").eq("user_id", user!.id).single();

      const { error } = await (supabase.from("urgent_cases" as any) as any).insert({
        user_id: user!.id,
        title: title.trim(),
        description: description.trim(),
        severity,
        phone: phone.trim() || null,
        address: address.trim() || null,
        images: urls,
        country: profile?.country || null,
        city: profile?.city || null,
      });
      if (error) throw error;

      toast.success("🚨 Cas urgent envoyé. Les responsables ont été notifiés.");
      setOpen(false);
      setTitle(""); setDescription(""); setSeverity("medium");
      setPhone(""); setAddress(""); setFiles([]);
      load();
    } catch (e: any) {
      toast.error(e.message || "Erreur lors de l'envoi");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center">Chargement...</div>;

  return (
    <DashboardLayout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-heading font-bold text-foreground flex items-center gap-2">
            <AlertTriangle className="w-7 h-7 text-red-500" />
            Cas Urgents
          </h1>
          <p className="text-muted-foreground font-body mt-1">
            Signalez une urgence — les Moissonneurs de votre zone et les administrateurs sont alertés.
          </p>
        </div>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="bg-red-500 hover:bg-red-600 text-white">
              <Plus className="w-4 h-4 mr-2" /> Nouveau cas
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <AlertTriangle className="text-red-500" /> Signaler un cas urgent
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Titre *</Label>
                <Input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={120}
                  placeholder="Résumé en quelques mots" />
              </div>
              <div>
                <Label>Description détaillée *</Label>
                <Textarea value={description} onChange={(e) => setDescription(e.target.value)} maxLength={2000}
                  rows={5} placeholder="Décrivez la situation, le contexte, ce dont vous avez besoin…" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Gravité</Label>
                  <Select value={severity} onValueChange={(v: any) => setSeverity(v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">🟦 Faible</SelectItem>
                      <SelectItem value="medium">🟨 Modéré</SelectItem>
                      <SelectItem value="high">🟧 Élevé</SelectItem>
                      <SelectItem value="critical">🟥 Critique</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Téléphone de contact</Label>
                  <Input value={phone} onChange={(e) => setPhone(e.target.value)} maxLength={30}
                    placeholder="Optionnel" />
                </div>
              </div>
              <div>
                <Label>Adresse / lieu précis</Label>
                <Input value={address} onChange={(e) => setAddress(e.target.value)} maxLength={255}
                  placeholder="Optionnel — où vous trouver" />
              </div>
              <div>
                <Label className="flex items-center gap-2">
                  <ImageIcon className="w-4 h-4" /> Photos (jusqu'à 5)
                </Label>
                <Input type="file" accept="image/*" multiple onChange={(e) => {
                  const list = Array.from(e.target.files || []).slice(0, 5);
                  setFiles(list);
                }} />
                {files.length > 0 && (
                  <p className="text-xs text-muted-foreground mt-1">{files.length} fichier(s) sélectionné(s)</p>
                )}
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)} disabled={submitting}>Annuler</Button>
              <Button onClick={submit} disabled={submitting} className="bg-red-500 hover:bg-red-600 text-white">
                {submitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
                Envoyer le signalement
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {loadingList ? (
        <div className="text-center py-12 text-muted-foreground">Chargement…</div>
      ) : cases.length === 0 ? (
        <div className="card-elevated text-center py-12">
          <AlertTriangle className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
          <p className="font-heading font-bold text-foreground mb-1">Aucun cas urgent</p>
          <p className="text-sm text-muted-foreground font-body">
            En cas d'urgence, cliquez sur "Nouveau cas" pour alerter immédiatement les responsables.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {cases.map((c) => (
            <button
              key={c.id}
              onClick={() => setSelected(c)}
              className="card-elevated text-left hover:shadow-lg transition-shadow w-full"
            >
              <div className="flex items-start justify-between gap-3 mb-2">
                <h3 className="font-heading font-bold text-foreground">{c.title}</h3>
                <Badge className={SEVERITY_COLORS[c.severity]} variant="outline">
                  {SEVERITY_LABEL[c.severity]}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground font-body line-clamp-2 mb-3">{c.description}</p>
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>{new Date(c.created_at).toLocaleString("fr-FR")}</span>
                <Badge variant="secondary">{STATUS_LABEL[c.status]}</Badge>
              </div>
            </button>
          ))}
        </div>
      )}

      {selected && <CaseDetailDialog c={selected} onClose={() => { setSelected(null); load(); }} userId={user!.id} />}
    </DashboardLayout>
  );
};

// ── Dialog détail / discussion ─────────────────────────
const CaseDetailDialog = ({ c, onClose, userId }: { c: UrgentCase; onClose: () => void; userId: string }) => {
  const [responses, setResponses] = useState<any[]>([]);
  const [msg, setMsg] = useState("");
  const [sending, setSending] = useState(false);

  const load = async () => {
    const { data } = await supabase
      .from("urgent_case_responses" as any)
      .select("*")
      .eq("case_id", c.id)
      .order("created_at", { ascending: true });
    setResponses(data || []);
  };
  useEffect(() => { load(); }, [c.id]);

  const send = async () => {
    if (!msg.trim()) return;
    setSending(true);
    const { error } = await (supabase.from("urgent_case_responses" as any) as any).insert({
      case_id: c.id,
      responder_id: userId,
      responder_role: "user",
      message: msg.trim(),
    });
    if (error) toast.error(error.message);
    else { setMsg(""); load(); }
    setSending(false);
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="text-red-500" /> {c.title}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="flex gap-2 flex-wrap">
            <Badge className={SEVERITY_COLORS[c.severity]} variant="outline">{SEVERITY_LABEL[c.severity]}</Badge>
            <Badge variant="secondary">{STATUS_LABEL[c.status]}</Badge>
            {c.country && <Badge variant="outline">{c.country}{c.city ? ` · ${c.city}` : ""}</Badge>}
          </div>
          <p className="text-sm font-body text-foreground whitespace-pre-wrap">{c.description}</p>
          {c.phone && <p className="text-sm">📞 {c.phone}</p>}
          {c.address && <p className="text-sm">📍 {c.address}</p>}
          {c.images?.length > 0 && (
            <div className="grid grid-cols-3 gap-2">
              {c.images.map((url, i) => (
                <a key={i} href={url} target="_blank" rel="noreferrer">
                  <img src={url} alt={`Photo ${i + 1}`} className="rounded-lg w-full h-24 object-cover" />
                </a>
              ))}
            </div>
          )}

          <div className="border-t pt-3">
            <h4 className="font-heading font-semibold mb-2 flex items-center gap-2">
              <MessageCircle className="w-4 h-4" /> Réponses ({responses.length})
            </h4>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {responses.length === 0 && (
                <p className="text-sm text-muted-foreground italic">Aucune réponse pour l'instant.</p>
              )}
              {responses.map((r) => (
                <div key={r.id} className={`p-2.5 rounded-lg ${r.responder_id === userId ? "bg-primary/10" : "bg-secondary"}`}>
                  <div className="flex justify-between text-xs text-muted-foreground mb-1">
                    <span className="capitalize">{r.responder_role.replace(/_/g, " ")}</span>
                    <span>{new Date(r.created_at).toLocaleString("fr-FR")}</span>
                  </div>
                  <p className="text-sm whitespace-pre-wrap">{r.message}</p>
                </div>
              ))}
            </div>

            {c.status !== "closed" && c.status !== "resolved" && (
              <div className="flex gap-2 mt-3">
                <Textarea value={msg} onChange={(e) => setMsg(e.target.value)} maxLength={1000}
                  placeholder="Votre message…" rows={2} />
                <Button onClick={send} disabled={sending || !msg.trim()}>
                  {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                </Button>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default UrgentCases;
