import { useEffect, useState, useRef } from "react";
import { QRCodeSVG } from "qrcode.react";
import { RotateCw, Download, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface CardProfile {
  id_moissonneur?: string | null;
  first_name?: string;
  last_name?: string;
  avatar_url?: string | null;
  verification_token?: string;
  est_souverain?: boolean;
  career_level?: string;
}

const useLiveClock = () => {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  return now;
};

const formatClock = (d: Date) => {
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())} • ${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
};

export default function CarteIdentiteMoissonneur({ profile }: { profile: CardProfile }) {
  const [flipped, setFlipped] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const now = useLiveClock();
  const rectoRef = useRef<HTMLDivElement>(null);
  const versoRef = useRef<HTMLDivElement>(null);

  const fullName = `${profile.first_name || ""} ${profile.last_name || ""}`.trim() || "Moissonneur";
  const memberId = profile.id_moissonneur || "MS-----";
  const verifyUrl = `${window.location.origin}${window.location.pathname}#/verify?token=${profile.verification_token || ""}`;

  const downloadPDF = async () => {
    if (!profile.verification_token) {
      toast.error("Token de vérification manquant");
      return;
    }
    setDownloading(true);
    try {
      const [{ default: html2canvas }, { default: jsPDF }] = await Promise.all([
        import("html2canvas"),
        import("jspdf"),
      ]);
      const wasFlipped = flipped;
      // Snapshot recto
      setFlipped(false);
      await new Promise(r => setTimeout(r, 400));
      const rectoCanvas = await html2canvas(rectoRef.current!, { backgroundColor: null, scale: 2 });
      // Snapshot verso
      setFlipped(true);
      await new Promise(r => setTimeout(r, 500));
      const versoCanvas = await html2canvas(versoRef.current!, { backgroundColor: null, scale: 2 });
      setFlipped(wasFlipped);

      const pdf = new jsPDF({ orientation: "landscape", unit: "mm", format: [85.6, 54] });
      pdf.addImage(rectoCanvas.toDataURL("image/png"), "PNG", 0, 0, 85.6, 54);
      pdf.addPage([85.6, 54], "landscape");
      pdf.addImage(versoCanvas.toDataURL("image/png"), "PNG", 0, 0, 85.6, 54);
      pdf.save(`carte-moissonneur-${memberId}.pdf`);
      toast.success("Carte téléchargée");
    } catch (e: any) {
      toast.error("Erreur PDF: " + e.message);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <style>{`
        .card-3d-wrapper { perspective: 1500px; }
        .card-3d { transform-style: preserve-3d; transition: transform 0.8s cubic-bezier(0.4,0.2,0.2,1); position: relative; width: 100%; aspect-ratio: 1.586/1; }
        .card-3d.flipped { transform: rotateY(180deg); }
        .card-face { position: absolute; inset: 0; backface-visibility: hidden; -webkit-backface-visibility: hidden; border-radius: 16px; overflow: hidden; }
        .card-back { transform: rotateY(180deg); }
        .gold-text { background: linear-gradient(135deg, #f5d97a 0%, #c9962b 50%, #f5d97a 100%); -webkit-background-clip: text; background-clip: text; color: transparent; }
        .gold-border { border: 1.5px solid; border-image: linear-gradient(135deg, #f5d97a, #c9962b, #f5d97a) 1; }
        .holo-sticker { background: linear-gradient(120deg, #f5d97a, #fff7c2, #c9962b, #f5d97a, #fff7c2); background-size: 300% 300%; animation: holo 4s linear infinite; }
        @keyframes holo { 0%{background-position:0% 50%} 50%{background-position:100% 50%} 100%{background-position:0% 50%} }
        .filigrane { background-image: radial-gradient(circle at 20% 20%, rgba(245,217,122,0.06) 0, transparent 40%), radial-gradient(circle at 80% 80%, rgba(245,217,122,0.05) 0, transparent 40%), repeating-linear-gradient(45deg, rgba(245,217,122,0.03) 0 2px, transparent 2px 12px); }
      `}</style>

      <div className="card-3d-wrapper">
        <div className={`card-3d ${flipped ? "flipped" : ""}`}>
          {/* RECTO */}
          <div ref={rectoRef} className="card-face bg-[#0a0a0a] filigrane gold-border">
            <div className="absolute inset-0 p-4 flex flex-col justify-between text-white">
              <div className="text-center">
                <p className="gold-text font-heading font-bold text-[11px] tracking-[0.25em]">MOISSONNEUR SOUVERAIN</p>
                <div className="h-[1px] bg-gradient-to-r from-transparent via-[#c9962b] to-transparent mt-1" />
              </div>

              <div className="flex gap-3 items-center">
                <div className="w-16 h-16 rounded-full overflow-hidden flex-shrink-0" style={{ border: "2px solid #c9962b", boxShadow: "0 0 12px rgba(201,150,43,0.5)" }}>
                  {profile.avatar_url ? (
                    <img src={profile.avatar_url} alt={fullName} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-[#2a2a2a] to-[#1a1a1a] flex items-center justify-center gold-text font-bold text-xl">
                      {fullName.charAt(0)}
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-heading font-bold text-sm truncate">{fullName.toUpperCase()}</p>
                  <p className="gold-text font-mono text-[11px] font-bold tracking-wider">{memberId}</p>
                  <p className="text-[9px] text-white/60 mt-0.5">VALIDITÉ : PERMANENTE</p>
                  <p className="gold-text text-[10px] font-heading italic mt-0.5">✦ Moisson ✦</p>
                </div>
              </div>

              <div className="flex items-end justify-between gap-2">
                <div className="bg-white p-1 rounded">
                  <QRCodeSVG value={verifyUrl} size={56} level="H" />
                </div>
                <div className="flex-1 text-right">
                  <p className="text-[8px] text-white/50 uppercase tracking-wider">Horodatage Live</p>
                  <p className="gold-text font-mono text-[10px] font-bold tabular-nums">{formatClock(now)}</p>
                </div>
              </div>
            </div>
          </div>

          {/* VERSO */}
          <div ref={versoRef} className="card-face card-back bg-[#0a0a0a] filigrane gold-border">
            <div className="absolute inset-0 p-4 flex flex-col justify-between text-white">
              <div className="text-center">
                <p className="gold-text font-heading font-bold text-[11px] tracking-[0.25em]">ACADÉMIE DES MOISSONNEURS</p>
                <div className="h-[1px] bg-gradient-to-r from-transparent via-[#c9962b] to-transparent mt-1" />
              </div>

              <div className="text-[7px] leading-[1.3] text-white/70 px-1">
                <p className="gold-text font-bold text-[8px] mb-0.5">CONDITIONS D'UTILISATION & SÉCURITÉ</p>
                <p>Cette carte est strictement personnelle, non cessible et reste la propriété de l'Académie. Toute utilisation frauduleuse est passible de poursuites. En cas de perte, contacter immédiatement le support. La vérification d'authenticité s'effectue via le QR code et l'horloge live de l'application officielle.</p>
              </div>

              <div className="flex items-center justify-between gap-2">
                <div className="holo-sticker rounded-md px-2 py-3 text-[8px] font-bold text-[#3a2a00] text-center" style={{ width: 70 }}>
                  HOLO<br/>SÉCURITÉ
                </div>
                <div className="flex-1 border-b border-[#c9962b]/50 pb-1">
                  <p className="font-heading italic text-xs text-white/90" style={{ fontFamily: "cursive" }}>{fullName.split(" ")[0] || "Signature"}</p>
                  <p className="text-[7px] text-white/50 uppercase tracking-wider mt-0.5">Signature du Titulaire</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex gap-2 mt-4 justify-center">
        <Button onClick={() => setFlipped(f => !f)} variant="outline" size="sm">
          <RotateCw className="w-4 h-4" /> Retourner la carte
        </Button>
        <Button onClick={downloadPDF} disabled={downloading} size="sm" className="bg-[#c9962b] hover:bg-[#a87f24] text-white">
          {downloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
          PDF Recto-Verso
        </Button>
      </div>
    </div>
  );
}
