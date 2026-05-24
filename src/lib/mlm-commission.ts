/**
 * Système de calcul des commissions MLM basé sur le bénéfice du pack
 * 
 * Formule : Commission niveau N = Bénéfice × (Taux niveau 1) × (Facteur décroissance)^(N-1)
 * 
 * Exemple avec Pack Sport 10,000 FCFA :
 * - Bénéfice : 2,000 FCFA
 * - Taux niveau 1 : 30%
 * - Facteur décroissance : 0.5 (50%)
 * 
 * Niveau 1 : 2000 × 30% × 0.5^0 = 600 FCFA
 * Niveau 2 : 2000 × 30% × 0.5^1 = 300 FCFA
 * Niveau 3 : 2000 × 30% × 0.5^2 = 150 FCFA
 * Niveau 4 : 2000 × 30% × 0.5^3 = 75 FCFA
 * ... jusqu'à l'infini (arrêt quand < 1 FCFA)
 */

export interface PackMLMConfig {
  packId: string;
  packName: string;
  price: number;
  benefit: number; // Bénéfice sur lequel les commissions sont calculées
  level1CommissionPercent: number; // Pourcentage commission niveau 1 (ex: 30)
  decayFactor: number; // Facteur de décroissance (ex: 0.5 = 50% du niveau précédent)
  minCommission: number; // Commission minimum en FCFA (arrêt si inférieur)
}

export interface CommissionLevel {
  level: number;
  percentage: number; // Pourcentage effectif à ce niveau
  amount: number; // Montant en FCFA
}

/**
 * Calcule la commission pour un niveau donné
 */
export function calculateCommissionForLevel(
  benefit: number,
  level1Percent: number,
  decayFactor: number,
  level: number
): number {
  const effectivePercent = level1Percent * Math.pow(decayFactor, level - 1);
  return Math.round(benefit * (effectivePercent / 100));
}

/**
 * Génère toutes les commissions jusqu'au niveau où elles deviennent négligeables
 */
export function generateCommissionLevels(
  benefit: number,
  level1Percent: number,
  decayFactor: number,
  minCommission: number = 1
): CommissionLevel[] {
  const levels: CommissionLevel[] = [];
  let level = 1;
  
  while (true) {
    const effectivePercent = level1Percent * Math.pow(decayFactor, level - 1);
    const amount = Math.round(benefit * (effectivePercent / 100));
    
    if (amount < minCommission) break;
    
    levels.push({
      level,
      percentage: Math.round(effectivePercent * 100) / 100,
      amount,
    });
    
    level++;
    
    // Sécurité : limite à 50 niveaux max
    if (level > 50) break;
  }
  
  return levels;
}

/**
 * Calcule le total des commissions distribuées pour un achat
 */
export function calculateTotalCommissions(
  benefit: number,
  level1Percent: number,
  decayFactor: number,
  minCommission: number = 1
): number {
  const levels = generateCommissionLevels(benefit, level1Percent, decayFactor, minCommission);
  return levels.reduce((sum, l) => sum + l.amount, 0);
}

/**
 * Valeurs par défaut recommandées
 */
export const DEFAULT_MLM_CONFIG = {
  level1CommissionPercent: 30, // 30% au niveau 1
  decayFactor: 0.5, // Chaque niveau reçoit 50% du précédent
  minCommission: 10, // Arrêt à 10 FCFA minimum
};

/**
 * Exemple de calcul pour affichage
 */
export function getCommissionExample(config: PackMLMConfig): string {
  const levels = generateCommissionLevels(
    config.benefit,
    config.level1CommissionPercent,
    config.decayFactor,
    config.minCommission
  );
  
  if (levels.length === 0) return "Aucune commission";
  
  const examples = levels.slice(0, 5).map(l => 
    `Niveau ${l.level}: ${l.amount.toLocaleString("fr-FR")} FCFA (${l.percentage}%)`
  );
  
  if (levels.length > 5) {
    examples.push(`... et ${levels.length - 5} niveaux supplémentaires`);
  }
  
  return examples.join("\n");
}
