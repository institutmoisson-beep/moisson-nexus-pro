import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import DashboardLayout from "@/components/DashboardLayout";
import { supabase } from "@/integrations/supabase/client";
import { Camera, CameraOff, CheckCircle2, AlertTriangle, XCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

type Result =
  | { state: "success"; data: any }
  | { state: "warning"; data: any }
  | { state: "error"; message: string }
  | null;

export default function VerifierPage() {
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState<Result>(null);
  const [loading, setLoading] = useState(false);
  const [params] = useSearchParams();
  const scannerRef = useRef<any>(null);
  const containerId = "qr-reader-box";

  const lookup = async (token: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.rpc("verify_moissonneur", { _token: token });
      if (error) throw error;
      const row = Array.isArray(data) ? data[0] : data;
      if (!row) { setResult({ state: "error", message: "Code inconnu ou invalide. Risque de contrefaçon ❌" }); return; }
      if (row.is_suspended || !row.is_mlm_active) { setResult({ state: "warning", data: row }); return; }
      setResult({ state: "success", data: row });
    } catch (e: any) {
      setResult({ state: "error", message: e.message || "Erreur de vérification" });
    } finally {
      setLoading(false);
    }
  };

  // Handle deep-link ?token=...
  useEffect(() => {
    const t = params.get("token");
    if (t) lookup(t);
  }, [params]);

  const extractToken = (text: string): string | null => {
    try {
      const m = text.match(/token=([0-9a-f-]{36})/i);
      if (m) return m[1];
      if (/^[0-9a-f-]{36}$/i.test(text)) return text;
    } catch {}
    return null;
  };

  const startScan = async () => {
    setResult(null);
    setScanning(true);
    try {
      const { Html5Qrcode } = await import("html5-qrcode");
      // Wait a tick so the div is mounted
      await new Promise(r => setTimeout(r, 50));
      const scanner = new Html5Qrcode(containerId);
      scannerRef.current = scanner;
      await scanner.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 240, height: 240 } },
        async (decoded) => {
          const token = extractToken(decoded);
          if (token) {
            await scanner.stop().catch(() => {});
            setScanning(false);
            lookup(token);
          }
        },
        () => {}
      );
    } catch (e: any) {
      setScanning(false);
      setResult({ state: "error", message: "Caméra indisponible: " + e.message });
    }
  };

  const stopScan = async () => {
    try { await scannerRef.current?.stop(); } catch {}
    setScanning(false);
  };

  useEffect(() => () => { stopScan(); }, []);

  const bgClass =
    result?.state === "success" ? "bg-green-600" :
    result?.state === "warning" ? "bg-orange-500" :
    result?.state === "error" ? "bg-red-600 animate-pulse" : "";

  return (
    <DashboardLayout>
      <div className="max-w-xl mx-auto">
        <h1 className="text-2xl md:text-3xl font-heading font-bold mb-6">📷 Vérificateur de Communauté</h1>

        {!scanning && !result && (
          <div className="card-elevated text-center py-10">
            <Camera className="w-12 h-12 mx-auto text-primary mb-3" />
            <p className="text-sm text-muted-foreground mb-4">Scannez la carte d'un Moissonneur pour vérifier son authenticité.</p>
            <Button onClick={startScan} className="bg-primary"><Camera className="w-4 h-4" /> Activer la caméra</Button>
          </div>
        )}

        {scanning && (
          <div className="card-elevated">
            <div id={containerId} className="rounded-lg overflow-hidden border-4 border-primary/40" style={{ width: "100%" }} />
            <Button onClick={stopScan} variant="outline" className="mt-4 w-full"><CameraOff className="w-4 h-4" /> Arrêter</Button>
          </div>
        )}

        {loading && (
          <div className="text-center py-12"><Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" /></div>
        )}

        {result && !loading && (
          <div className={`rounded-xl p-6 text-white ${bgClass} mt-4`}>
            {result.state === "success" && (
              <div className="text-center">
                <CheckCircle2 className="w-16 h-16 mx-auto mb-2" />
                <p className="text-3xl font-heading font-bold mb-2">VÉRIFIÉ ✅</p>
                {result.data.avatar_url && <img src={result.data.avatar_url} className="w-24 h-24 rounded-full mx-auto border-4 border-white mb-2 object-cover" alt="" />}
                <p className="text-xl font-bold">{result.data.full_name}</p>
                <p className="font-mono text-sm opacity-90">{result.data.id_moissonneur}</p>
                <p className="mt-2 text-sm">{result.data.est_souverain ? "Pack Souverain Actif" : `Statut: ${result.data.career_level}`}</p>
              </div>
            )}
            {result.state === "warning" && (
              <div className="text-center">
                <AlertTriangle className="w-16 h-16 mx-auto mb-2" />
                <p className="text-2xl font-heading font-bold mb-2">ADHÉSION INACTIVE ⚠️</p>
                <p className="font-bold">{result.data.full_name}</p>
                <p className="font-mono text-sm opacity-90">{result.data.id_moissonneur}</p>
                <p className="mt-2 text-sm">{result.data.is_suspended ? "Compte suspendu" : "Adhésion MLM expirée ou non activée"}</p>
              </div>
            )}
            {result.state === "error" && (
              <div className="text-center">
                <XCircle className="w-16 h-16 mx-auto mb-2" />
                <p className="text-2xl font-heading font-bold mb-2">ALERTE</p>
                <p>{result.message}</p>
              </div>
            )}
            <div className="mt-4 text-center">
              <Button onClick={() => { setResult(null); }} variant="outline" className="bg-white text-foreground">Nouveau scan</Button>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
