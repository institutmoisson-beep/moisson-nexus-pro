import { useEffect, useState } from "react";
import { FileText, Download, ShieldCheck, PenLine, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { generateStatutsPDF, generateReglementPDF, generateContratPDF, computeSignatureHash } from "@/lib/institutDocuments";

interface Props {
  user: { id: string; email?: string };
  profile: any;
}

export default function ProfileDocuments({ user, profile }: Props) {
  const [agreement, setAgreement] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showSignModal, setShowSignModal] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const [typedName, setTypedName] = useState("");
  const [signing, setSigning] = useState(false);

  const fullName = `${profile?.first_name || ""} ${profile?.last_name || ""}`.trim();
  const registrationDate = profile?.created_at
    ? new Date(profile.created_at).toLocaleString("fr-FR")
    : "—";
  const currentPack = profile?.current_pack_name || profile?.pack_name || "Pack initial";

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("user_agreements")
        .select("*")
        .eq("user_id", user.id)
        .eq("agreement_type", "contrat_adhesion")
        .maybeSingle();
      setAgreement(data);
      setLoading(false);
    })();
  }, [user.id]);

  const downloadStatuts = () => {
    generateStatutsPDF().save("InstitutMoisson_Statuts.pdf");
    toast.success("Statuts téléchargés");
  };

  const downloadReglement = () => {
    generateReglementPDF().save("InstitutMoisson_Reglement_Interieur.pdf");
    toast.success("Règlement intérieur téléchargé");
  };

  const downloadContrat = () => {
    if (!agreement) return;
    const pdf = generateContratPDF({
      fullName,
      userId: user.id,
      email: user.email,
      currentPack,
      registrationDate,
      signatureHash: agreement.signature_hash,
      acceptedAt: agreement.accepted_at,
    });
    pdf.save("InstitutMoisson_Contrat_Adhesion.pdf");
    toast.success("Contrat téléchargé");
  };

  const signContrat = async () => {
    if (!accepted) return toast.error("Vous devez cocher la case d'acceptation");
    if (typedName.trim().toLowerCase() !== fullName.toLowerCase()) {
      return toast.error("Veuillez retaper votre nom complet exactement");
    }
    setSigning(true);
    try {
      const acceptedAt = new Date().toISOString();
      const hashInput = `${user.id}|${user.email}|${fullName}|${currentPack}|${acceptedAt}`;
      const signature_hash = await computeSignatureHash(hashInput);
      const { data, error } = await supabase
        .from("user_agreements")
        .insert({
          user_id: user.id,
          agreement_type: "contrat_adhesion",
          accepted_at: acceptedAt,
          signature_hash,
          user_agent: navigator.userAgent.slice(0, 250),
        })
        .select()
        .single();
      if (error) throw error;
      setAgreement(data);
      setShowSignModal(false);
      toast.success("Contrat signé avec succès — vous pouvez le télécharger");
    } catch (e: any) {
      toast.error(e.message || "Erreur lors de la signature");
    } finally {
      setSigning(false);
    }
  };

  return (
    <div className="card-elevated mb-6">
      <h2 className="text-lg font-heading font-semibold text-foreground mb-2 flex items-center gap-2">
        <FileText className="w-5 h-5 text-primary" /> Documents officiels
      </h2>
      <p className="text-xs text-muted-foreground font-body mb-4">
        Téléchargez les documents fondateurs de l'Institut Moisson et signez votre contrat d'adhésion.
      </p>

      <div className="space-y-3">
        {/* Statuts */}
        <div className="flex items-center justify-between gap-3 p-3 rounded-lg border border-border bg-secondary/30">
          <div className="flex items-center gap-3 min-w-0">
            <FileText className="w-5 h-5 text-primary shrink-0" />
            <div className="min-w-0">
              <p className="text-sm font-semibold text-foreground font-body truncate">Statuts de l'Organisation</p>
              <p className="text-xs text-muted-foreground font-body">Document fondateur de l'ONG</p>
            </div>
          </div>
          <button onClick={downloadStatuts} className="btn-hero !text-xs !py-2 !px-3 inline-flex items-center gap-1 shrink-0">
            <Download className="w-3.5 h-3.5" /> PDF
          </button>
        </div>

        {/* Règlement */}
        <div className="flex items-center justify-between gap-3 p-3 rounded-lg border border-border bg-secondary/30">
          <div className="flex items-center gap-3 min-w-0">
            <FileText className="w-5 h-5 text-primary shrink-0" />
            <div className="min-w-0">
              <p className="text-sm font-semibold text-foreground font-body truncate">Règlement Intérieur</p>
              <p className="text-xs text-muted-foreground font-body">Discipline, éthique et sanctions</p>
            </div>
          </div>
          <button onClick={downloadReglement} className="btn-hero !text-xs !py-2 !px-3 inline-flex items-center gap-1 shrink-0">
            <Download className="w-3.5 h-3.5" /> PDF
          </button>
        </div>

        {/* Contrat */}
        <div className="p-3 rounded-lg border border-primary/30 bg-primary/5">
          <div className="flex items-center justify-between gap-3 mb-2">
            <div className="flex items-center gap-3 min-w-0">
              <PenLine className="w-5 h-5 text-primary shrink-0" />
              <div className="min-w-0">
                <p className="text-sm font-semibold text-foreground font-body truncate">Contrat d'Adhésion Communautaire</p>
                <p className="text-xs text-muted-foreground font-body">Personnalisé à votre profil</p>
              </div>
            </div>
            {agreement ? (
              <span className="inline-flex items-center gap-1 text-xs font-semibold bg-harvest-green/20 text-harvest-green px-2 py-1 rounded-full shrink-0">
                <ShieldCheck className="w-3 h-3" /> Signé
              </span>
            ) : (
              <span className="text-xs font-semibold bg-gold/20 text-gold px-2 py-1 rounded-full shrink-0">À signer</span>
            )}
          </div>
          {loading ? (
            <div className="text-xs text-muted-foreground font-body">Chargement...</div>
          ) : agreement ? (
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground font-body">
                Signé le {new Date(agreement.accepted_at).toLocaleString("fr-FR")}
              </p>
              <button onClick={downloadContrat} className="w-full btn-gold !text-xs !py-2 inline-flex items-center justify-center gap-1">
                <Download className="w-3.5 h-3.5" /> Télécharger mon contrat signé
              </button>
            </div>
          ) : (
            <button onClick={() => setShowSignModal(true)} className="w-full btn-gold !text-xs !py-2 inline-flex items-center justify-center gap-1">
              <PenLine className="w-3.5 h-3.5" /> Signer le contrat d'adhésion
            </button>
          )}
        </div>
      </div>

      {/* Sign modal */}
      {showSignModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" onClick={() => !signing && setShowSignModal(false)}>
          <div className="bg-background rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-5 border border-border" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-heading font-bold text-foreground">Signer le Contrat d'Adhésion</h3>
              <button onClick={() => !signing && setShowSignModal(false)} className="text-muted-foreground hover:text-foreground"><X className="w-5 h-5" /></button>
            </div>

            <div className="space-y-3 text-sm font-body">
              <div className="rounded-lg bg-secondary/40 p-3 space-y-1 text-xs">
                <div><span className="text-muted-foreground">Nom :</span> <span className="font-semibold text-foreground">{fullName || "—"}</span></div>
                <div><span className="text-muted-foreground">E-mail :</span> <span className="font-semibold text-foreground">{user.email}</span></div>
                <div><span className="text-muted-foreground">ID :</span> <span className="font-mono text-xs text-foreground">{user.id}</span></div>
                <div><span className="text-muted-foreground">Date :</span> <span className="text-foreground">{new Date().toLocaleString("fr-FR")}</span></div>
              </div>

              <p className="text-xs text-muted-foreground">
                En signant, vous reconnaissez avoir lu les <strong>Statuts</strong> et le <strong>Règlement Intérieur</strong> de l'Institut Moisson, et vous engagez à respecter le Code d'Honneur de la communauté.
              </p>

              <label className="flex items-start gap-2 cursor-pointer p-2 rounded-lg border border-border hover:bg-secondary/30">
                <input type="checkbox" checked={accepted} onChange={e => setAccepted(e.target.checked)} className="mt-0.5" />
                <span className="text-xs text-foreground">
                  J'accepte sans réserve les conditions du Contrat d'Adhésion Communautaire et m'engage à respecter les statuts et le règlement intérieur.
                </span>
              </label>

              <div>
                <label className="text-xs font-semibold text-foreground block mb-1">
                  Retapez votre nom complet pour signature électronique :
                </label>
                <input
                  type="text"
                  value={typedName}
                  onChange={e => setTypedName(e.target.value)}
                  placeholder={fullName}
                  className="w-full px-3 py-2 rounded-lg border border-input bg-background text-foreground font-body text-sm"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button onClick={() => setShowSignModal(false)} disabled={signing}
                  className="flex-1 px-3 py-2 rounded-lg border border-input text-muted-foreground text-sm font-body">
                  Annuler
                </button>
                <button onClick={signContrat} disabled={signing || !accepted}
                  className="flex-1 btn-gold !text-sm !py-2 inline-flex items-center justify-center gap-1 disabled:opacity-50">
                  {signing ? <Loader2 className="w-4 h-4 animate-spin" /> : <PenLine className="w-4 h-4" />}
                  Signer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
