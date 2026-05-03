/**
 * Captcha mathématique simple — protection anti-bots.
 * Génère 2 nombres + opération aléatoire ; l'utilisateur doit donner la réponse.
 * `onValidChange(true)` quand la réponse est correcte.
 */
import { useEffect, useMemo, useState } from "react";
import { RefreshCw } from "lucide-react";

interface Props {
  onValidChange: (valid: boolean) => void;
}

const gen = () => {
  const a = Math.floor(Math.random() * 9) + 1;
  const b = Math.floor(Math.random() * 9) + 1;
  const op = Math.random() < 0.5 ? "+" : "−";
  const result = op === "+" ? a + b : a - b;
  return { a, b, op, result };
};

const MathCaptcha = ({ onValidChange }: Props) => {
  const [seed, setSeed] = useState(0);
  const challenge = useMemo(() => gen(), [seed]);
  const [val, setVal] = useState("");

  useEffect(() => {
    onValidChange(Number(val) === challenge.result);
  }, [val, challenge, onValidChange]);

  const refresh = () => { setSeed((s) => s + 1); setVal(""); };

  return (
    <div>
      <label className="block text-sm font-medium text-foreground mb-1.5 font-body">
        Vérification anti-robot
      </label>
      <div className="flex items-center gap-2">
        <div className="px-4 py-3 rounded-lg bg-secondary font-heading font-bold text-lg select-none">
          {challenge.a} {challenge.op} {challenge.b} = ?
        </div>
        <input
          type="number"
          required
          inputMode="numeric"
          value={val}
          onChange={(e) => setVal(e.target.value)}
          placeholder="Réponse"
          className="flex-1 px-4 py-3 rounded-lg border border-input bg-background text-foreground font-body focus:ring-2 focus:ring-ring outline-none"
        />
        <button type="button" onClick={refresh}
          className="p-3 rounded-lg border border-input hover:bg-secondary transition-colors"
          aria-label="Régénérer">
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default MathCaptcha;
