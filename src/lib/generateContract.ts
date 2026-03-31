/**
 * Generate MSN Moisson guarantee contract as a downloadable PDF-like HTML document
 */
export const generateGuaranteeContract = (memberName: string, packName: string, packPrice: number) => {
  const date = new Date().toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
  const contractNumber = `MSN-${Date.now().toString(36).toUpperCase()}`;

  const html = `
<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<title>Contrat de Garantie MSN Moisson - ${contractNumber}</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700&family=DM+Sans:wght@400;500;600&display=swap');
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'DM Sans', sans-serif; color: #1a1a2e; line-height: 1.7; padding: 40px; max-width: 800px; margin: 0 auto; background: #fff; }
  .header { text-align: center; border-bottom: 3px solid #7c3aed; padding-bottom: 20px; margin-bottom: 30px; }
  .header h1 { font-family: 'Playfair Display', serif; font-size: 28px; color: #7c3aed; margin-bottom: 5px; }
  .header .subtitle { font-size: 14px; color: #666; letter-spacing: 2px; text-transform: uppercase; }
  .contract-number { font-size: 12px; color: #999; margin-top: 10px; }
  .section { margin-bottom: 25px; }
  .section h2 { font-family: 'Playfair Display', serif; font-size: 18px; color: #7c3aed; margin-bottom: 10px; border-left: 4px solid #d4a017; padding-left: 12px; }
  .section h3 { font-size: 15px; font-weight: 600; color: #333; margin: 12px 0 6px; }
  .section p, .section li { font-size: 14px; color: #444; }
  .section ul { padding-left: 20px; }
  .section li { margin-bottom: 4px; }
  .info-box { background: #f8f5ff; border: 1px solid #e0d4f5; border-radius: 8px; padding: 15px; margin: 15px 0; }
  .info-box p { font-size: 13px; }
  .info-box strong { color: #7c3aed; }
  .signatures { display: flex; justify-content: space-between; margin-top: 50px; padding-top: 30px; border-top: 1px solid #ddd; }
  .sig-block { width: 45%; }
  .sig-block p { font-size: 13px; color: #666; margin-bottom: 8px; }
  .sig-block .sig-name { font-weight: 600; color: #1a1a2e; font-size: 14px; }
  .signature-image { font-family: 'Playfair Display', serif; font-size: 32px; color: #7c3aed; font-style: italic; transform: rotate(-5deg); display: inline-block; margin: 10px 0; position: relative; }
  .signature-image::after { content: ''; position: absolute; bottom: -2px; left: 0; right: 0; height: 2px; background: linear-gradient(90deg, #7c3aed, #d4a017); }
  .seal { text-align: center; margin: 30px 0; }
  .seal-badge { display: inline-block; border: 3px double #d4a017; border-radius: 50%; width: 80px; height: 80px; line-height: 74px; text-align: center; font-family: 'Playfair Display', serif; font-size: 11px; color: #d4a017; font-weight: 700; letter-spacing: 1px; }
  .footer { text-align: center; margin-top: 30px; padding-top: 15px; border-top: 1px solid #eee; font-size: 11px; color: #999; }
  @media print { body { padding: 20px; } }
</style>
</head>
<body>
<div class="header">
  <h1>🌾 CONTRAT DE GARANTIE MSN MOISSON</h1>
  <div class="subtitle">Institut Moisson — Unis pour prospérer & protéger</div>
  <div class="contract-number">N° ${contractNumber} | ${date}</div>
</div>

<div class="info-box">
  <p><strong>Membre :</strong> ${memberName}</p>
  <p><strong>Pack acquis :</strong> ${packName}</p>
  <p><strong>Montant :</strong> ${packPrice.toLocaleString("fr-FR")} FCFA</p>
  <p><strong>Date d'acquisition :</strong> ${date}</p>
</div>

<div class="section">
  <h2>1. OBJET DU CONTRAT</h2>
  <p>Le présent contrat garantit au Membre l'acquisition d'un Pack Métier opérationnel, incluant le matériel, la formation et l'accompagnement nécessaire à son insertion économique.</p>
</div>

<div class="section">
  <h2>2. LES CINQ PILIERS DE LA GARANTIE MSN</h2>

  <h3>A. Livraison Certifiée</h3>
  <p>MSN s'engage à livrer l'intégralité du matériel constituant le pack dans un délai maximum de <strong>15 jours ouvrés</strong> après validation du paiement. Un procès-verbal de réception sera signé.</p>

  <h3>B. Formation Certifiante</h3>
  <p>Le Membre bénéficie d'une formation technique intensive de <strong>2 à 4 semaines</strong> dispensée par des experts métiers partenaires. Une certification <em>"Expert Moissonneur"</em> est délivrée en fin de cursus.</p>

  <h3>C. Kit de Visibilité</h3>
  <p>Pour lancer son activité, le membre reçoit :</p>
  <ul>
    <li>1 Enseigne lumineuse ou Panneau publicitaire MSN</li>
    <li>100 Cartes de visite personnalisées</li>
    <li>Tenue de travail logotypée (T-shirt, Casquette, Gilet tactique selon le pack)</li>
  </ul>

  <h3>D. Insertion Réseau</h3>
  <p>Le membre est prioritaire sur tous les appels d'offres internes de la plateforme MSN et est répertorié dans l'annuaire <em>"Moissonneurs Pros"</em> consulté par tous les membres du réseau.</p>

  <h3>E. Suivi Business</h3>
  <p>Pendant <strong>6 mois</strong>, un mentor dédié accompagne le membre sur :</p>
  <ul>
    <li>La gestion financière</li>
    <li>La recherche de clients locaux</li>
    <li>L'entretien du matériel</li>
  </ul>
</div>

<div class="section">
  <h2>3. ENGAGEMENT DU MEMBRE</h2>
  <p>Le membre s'engage à suivre l'intégralité de la formation et à respecter la charte éthique MSN dans l'exercice de son métier.</p>
</div>

<div class="seal">
  <div class="seal-badge">MSN<br/>CERTIFIÉ</div>
</div>

<div class="signatures">
  <div class="sig-block">
    <p>Pour MSN Moisson :</p>
    <div class="signature-image">Oniel Celvus</div>
    <p class="sig-name">Oniel Celvus</p>
    <p>Directeur Général — MSN Moisson</p>
  </div>
  <div class="sig-block">
    <p>Le Membre :</p>
    <br/><br/>
    <p class="sig-name">${memberName}</p>
    <p>Signature précédée de "Lu et approuvé"</p>
  </div>
</div>

<div class="footer">
  <p>Institut Moisson — MSN Moisson © ${new Date().getFullYear()} | Document officiel — Reproduction interdite</p>
  <p>Unis pour prospérer & protéger 🌾</p>
</div>
</body>
</html>`;

  const blob = new Blob([html], { type: "text/html" });
  const url = URL.createObjectURL(blob);
  const printWindow = window.open(url, "_blank");
  if (printWindow) {
    printWindow.onload = () => {
      printWindow.print();
    };
  }
};
