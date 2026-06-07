import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertTriangle, MessageCircle, Send, Loader2 } from "lucide-react";
import { toast } from "sonner";
import SignedImage from "@/components/SignedImage";

const SEVERITY_COLORS: Record<string, string> = {
  low: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  medium: "bg-amber-500/10 text-amber-600 border-amber-500/20",
  high: "bg-orange-500/10 text-orange-600 border-orange-500/20",
  critical: "bg-red-500/10 text-red-600 border-red-500/20",
};

const AdminUrgentCases = () => {
  const [cases, setCases] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "open" | "in_progress" | "resolved" | "closed">("open");
  const [selected, setSelected] = useState<any | null>(null);
  const [profilesMap, setProfilesMap] = useState<Record<string, any>>({});

  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("urgent_cases" as any)
      .select("*")
      .order("created_at", { ascending: false });
    const list = (data || []) as any[];
    setCases(list);

    const ids = Array.from(new Set(list.map((c: any) => c.user_id)));
    if (ids.length) {
      const { data: profs } = await supabase
        .from("profiles").select("user_id, first_name, last_name, phone, country, city").in("user_id", ids);
      const map: Record<string, any> = {};
      (profs || []).forEach((p: any) => { map[p.user_id] = p; });
      setProfilesMap(map);
    }
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const filtered = filter === "all" ? cases : cases.filter((c) => c.status === filter);

  const updateStatus = async (id: string, status: string) => {
    const patch: any = { status };
    if (status === "resolved" || status === "closed") {
      patch.resolved_at = new Date().toISOString();
    }
    const { error } = await (supabase.from("urgent_cases" as any) as any).update(patch).eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success("Statut mis à jour"); load(); }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-heading font-bold text-foreground flex items-center gap-2">
          <AlertTriangle className="text-red-500" /> Cas Urgents
        </h2>
        <Select value={filter} onValueChange={(v: any) => setFilter(v)}>
          <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="open">Ouverts</SelectItem>
            <SelectItem value="in_progress">En cours</SelectItem>
            <SelectItem value="resolved">Résolus</SelectItem>
            <SelectItem value="closed">Clôturés</SelectItem>
            <SelectItem value="all">Tous</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="text-center py-8">Chargement…</div>
      ) : filtered.length === 0 ? (
        <div className="card-elevated text-center py-8 text-muted-foreground">Aucun cas dans cette catégorie.</div>
      ) : (
        <div className="space-y-2">
          {filtered.map((c) => {
            const p = profilesMap[c.user_id];
            return (
              <button key={c.id} onClick={() => setSelected(c)}
                className="card-elevated text-left w-full hover:shadow-lg transition-shadow">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div>
                    <h3 className="font-heading font-bold">{c.title}</h3>
                    <p className="text-xs text-muted-foreground">
                      {p ? `${p.first_name} ${p.last_name}` : "Utilisateur"}
                      {p?.phone && ` · 📞 ${p.phone}`}
                      {c.country && ` · ${c.country}`}
                      {c.city && ` (${c.city})`}
                    </p>
                  </div>
                  <div className="flex flex-col gap-1 items-end">
                    <Badge className={SEVERITY_COLORS[c.severity]} variant="outline">{c.severity}</Badge>
                    <Badge variant="secondary">{c.status}</Badge>
                  </div>
                </div>
                <p className="text-sm line-clamp-2 text-muted-foreground">{c.description}</p>
                <p className="text-xs text-muted-foreground mt-2">{new Date(c.created_at).toLocaleString("fr-FR")}</p>
              </button>
            );
          })}
        </div>
      )}

      {selected && (
        <AdminCaseDialog
          c={selected}
          profile={profilesMap[selected.user_id]}
          onClose={() => { setSelected(null); load(); }}
          onUpdateStatus={updateStatus}
        />
      )}
    </div>
  );
};

// ── Dialog détail admin ──────────────────────────────────
const AdminCaseDialog = ({ c, profile, onClose, onUpdateStatus }: any) => {
  const [responses, setResponses] = useState<any[]>([]);
  const [msg, setMsg] = useState("");
  const [sending, setSending] = useState(false);
  const [me, setMe] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setMe(data.user?.id || null));
    load();
  }, [c.id]);

  const load = async () => {
    const { data } = await supabase
      .from("urgent_case_responses" as any)
      .select("*").eq("case_id", c.id).order("created_at", { ascending: true });
    setResponses(data || []);
  };

  const send = async () => {
    if (!msg.trim() || !me) return;
    setSending(true);
    const { error } = await (supabase.from("urgent_case_responses" as any) as any).insert({
      case_id: c.id, responder_id: me, responder_role: "admin", message: msg.trim(),
    });
    if (error) toast.error(error.message);
    else {
      setMsg(""); load();
      if (c.status === "open") onUpdateStatus(c.id, "in_progress");
    }
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
          {profile && (
            <div className="bg-secondary/50 p-3 rounded-lg text-sm">
              <strong>{profile.first_name} {profile.last_name}</strong>
              {profile.phone && <div>📞 {profile.phone}</div>}
              {profile.country && <div>📍 {profile.country}{profile.city ? ` · ${profile.city}` : ""}</div>}
            </div>
          )}
          <p className="whitespace-pre-wrap text-sm">{c.description}</p>
          {c.phone && <p className="text-sm">📞 Contact urgence : {c.phone}</p>}
          {c.address && <p className="text-sm">📍 {c.address}</p>}
          {c.images?.length > 0 && (
            <div className="grid grid-cols-3 gap-2">
              {c.images.map((url: string, i: number) => (
                <a key={i} href={url} target="_blank" rel="noreferrer">
                  <img src={url} alt="" className="rounded-lg w-full h-24 object-cover" />
                </a>
              ))}
            </div>
          )}

          <div className="flex gap-2 flex-wrap">
            {["open", "in_progress", "resolved", "closed"].map((s) => (
              <Button key={s} size="sm" variant={c.status === s ? "default" : "outline"}
                onClick={() => onUpdateStatus(c.id, s)}>
                {s}
              </Button>
            ))}
          </div>

          <div className="border-t pt-3">
            <h4 className="font-heading font-semibold mb-2 flex items-center gap-2">
              <MessageCircle className="w-4 h-4" /> Conversation ({responses.length})
            </h4>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {responses.map((r) => (
                <div key={r.id} className={`p-2.5 rounded-lg ${r.responder_id === me ? "bg-primary/10" : "bg-secondary"}`}>
                  <div className="flex justify-between text-xs text-muted-foreground mb-1">
                    <span className="capitalize">{r.responder_role.replace(/_/g, " ")}</span>
                    <span>{new Date(r.created_at).toLocaleString("fr-FR")}</span>
                  </div>
                  <p className="text-sm whitespace-pre-wrap">{r.message}</p>
                </div>
              ))}
            </div>
            <div className="flex gap-2 mt-3">
              <Textarea value={msg} onChange={(e) => setMsg(e.target.value)} maxLength={1000}
                placeholder="Répondre…" rows={2} />
              <Button onClick={send} disabled={sending || !msg.trim()}>
                {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AdminUrgentCases;
