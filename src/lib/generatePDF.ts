/**
 * PDF Generator using jsPDF (client-side)
 * Generates purchase receipts and guarantee contracts as downloadable PDFs
 */

// We use dynamic import for jsPDF since it's a large library
// Install: npm install jspdf

export interface PurchaseReceiptData {
  memberName: string;
  memberEmail: string;
  memberPhone?: string;
  memberCity?: string;
  memberCountry?: string;
  referralCode: string;
  packName: string;
  packPrice: number;
  orderId: string;
  deliveryCity?: string;
  deliveryCountry?: string;
  deliveryPhone?: string;
  deliveryStreet?: string;
  commissions?: { level: number; percentage: number }[];
  date?: string;
}

export interface GuaranteeContractData {
  memberName: string;
  memberEmail: string;
  memberPhone?: string;
  packName: string;
  packPrice: number;
  orderId: string;
}

const formatDate = () => {
  return new Date().toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
};

const formatCurrency = (amount: number) =>
  amount.toLocaleString("fr-FR") + " FCFA";

/**
 * Generates a purchase receipt + guarantee contract as a printable HTML page
 * Falls back to HTML blob if jsPDF is not available
 */
export const generatePurchaseReceiptHTML = (data: PurchaseReceiptData): void => {
  const date = data.date || formatDate();
  const contractNumber = MSN-${Date.now().toString(36).toUpperCase()};
  const receiptNumber = RECU-${data.orderId.slice(0, 8).toUpperCase()};

  const totalCommPct = (data.commissions || []).reduce(
    (sum, c) => sum + c.percentage,
    0
  );

  const html = `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<title>Reçu d'achat — ${receiptNumber}</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700&family=DM+Sans:wght@400;500;600&display=swap');
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'DM Sans', sans-serif; color: #1a1a2e; background: #fff; }
  .page { max-width: 800px; margin: 0 auto; padding: 40px; }

  /* ── RECEIPT ── */
  .receipt { border: 2px solid #7c3aed; border-radius: 12px; overflow: hidden; margin-bottom: 40px; }
  .receipt-header { background: linear-gradient(135deg,#7c3aed,#5b21b6); color:#fff; padding: 24px 30px; display:flex; justify-content:space-between; align-items:flex-start; }
  .receipt-header h1 { font-family:'Playfair Display',serif; font-size:22px; }
  .receipt-header .meta { text-align:right; font-size:12px; opacity:0.9; line-height:1.6; }
  .receipt-body { padding:24px 30px; }
  .receipt-row { display:flex; justify-content:space-between; padding:8px 0; border-bottom:1px solid #f0edf8; font-size:14px; }
  .receipt-row:last-child { border-bottom:none; }
  .receipt-row .label { color:#6b6b8a; }
  .receipt-row .value { font-weight:600; color:#1a1a2e; }
  .receipt-total { background:#f8f5ff; border-top:2px solid #7c3aed; padding:16px 30px; display:flex; justify-content:space-between; align-items:center; }
  .receipt-total .label { font-size:16px; font-weight:600; color:#7c3aed; }
  .receipt-total .amount { font-family:'Playfair Display',serif; font-size:28px; font-weight:700; color:#7c3aed; }
  .status-badge { display:inline-block; background:#dcfce7; color:#16a34a; padding:4px 12px; border-radius:20px; font-size:12px; font-weight:600; }

  /* ── DELIVERY ── */
  .section { margin-bottom:24px; }
  .section h3 { font-family:'Playfair Display',serif; font-size:16px; color:#7c3aed; margin-bottom:12px; padding-bottom:6px; border-bottom:1px solid #e0d4f5; }

  /* ── CONTRACT ── */
  .contract { border:2px solid #d4a017; border-radius:12px; overflow:hidden; margin-top:40px; }
  .contract-header { background:linear-gradient(135deg,#d4a017,#b8860b); color:#fff; padding:24px 30px; }
  .contract-header h2 { font-family:'Playfair Display',serif; font-size:20px; }
  .contract-header .sub { font-size:12px; opacity:0.9; margin-top:4px; }
  .contract-body { padding:24px 30px; }
  .pillar { margin-bottom:16px; }
  .pillar h4 { font-weight:600; color:#1a1a2e; font-size:13px; margin-bottom:4px; }
  .pillar p, .pillar li { font-size:13px; color:#555; line-height:1.6; }
  .pillar ul { padding-left:16px; }
  .seal-row { display:flex; justify-content:space-between; align-items:center; padding:20px 30px; background:#fffbeb; border-top:1px solid #fde68a; }
  .seal { width:70px; height:70px; border:3px double #d4a017; border-radius:50%; display:flex; align-items:center; justify-content:center; font-family:'Playfair Display',serif; font-size:10px; color:#d4a017; font-weight:700; text-align:center; line-height:1.2; }
  .sig-block p { font-size:12px; color:#888; margin-bottom:4px; }
  .sig-name { font-size:14px; font-weight:600; color:#1a1a2e; font-family:'Playfair Display',serif; }
  .sig-hand { font-family:'Playfair Display',serif; font-size:28px; color:#7c3aed; font-style:italic; }

  /* ── COMMISSION TABLE ── */
  .comm-table { width:100%; border-collapse:collapse; font-size:12px; margin-top:8px; }
  .comm-table th { background:#f8f5ff; color:#7c3aed; padding:6px 10px; text-align:left; font-weight:600; }
  .comm-table td { padding:5px 10px; border-bottom:1px solid #f0edf8; }

  .footer { text-align:center; margin-top:30px; padding-top:16px; border-top:1px solid #eee; font-size:11px; color:#999; }
  @media print {
    body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .page { padding: 20px; }
  }
</style>
</head>
<body>
<div class="page">

  <!-- ══ RECEIPT ══ -->
  <div class="receipt">
    <div class="receipt-header">
      <div>
        <h1>🌾 Reçu d'Achat Officiel</h1>
        <p style="font-size:13px;margin-top:4px;opacity:0.85;">Institut Moisson — Unis pour prospérer</p>
      </div>
      <div class="meta">
        <div>${receiptNumber}</div>
        <div>${contractNumber}</div>
        <div>${date}</div>
        <div style="margin-top:6px;"><span class="status-badge">✓ CONFIRMÉ</span></div>
      </div>
    </div>

    <div class="receipt-body">
      <div class="section">
        <h3>👤 Informations du membre</h3>
        <div class="receipt-row"><span class="label">Nom complet</span><span class="value">${data.memberName}</span></div>
        <div class="receipt-row"><span class="label">Email</span><span class="value">${data.memberEmail}</span></div>
        ${data.memberPhone ? <div class="receipt-row"><span class="label">Téléphone</span><span class="value">${data.memberPhone}</span></div> : ""}
        <div class="receipt-row"><span class="label">Code Moissonneur</span><span class="value" style="font-family:monospace;">${data.referralCode}</span></div>
        ${data.memberCountry ? <div class="receipt-row"><span class="label">Pays</span><span class="value">${data.memberCity ? data.memberCity + ", " : ""}${data.memberCountry}</span></div> : ""}
      </div>

      <div class="section">
        <h3>📦 Détails de la commande</h3>
        <div class="receipt-row"><span class="label">Pack acheté</span><span class="value">${data.packName}</span></div>
        <div class="receipt-row"><span class="label">Référence commande</span><span class="value" style="font-family:monospace;">${data.orderId.slice(0, 16).toUpperCase()}</span></div>
        <div class="receipt-row"><span class="label">Date d'achat</span><span class="value">${date}</span></div>
        <div class="receipt-row"><span class="label">Statut</span><span class="value"><span class="status-badge">✓ Payé</span></span></div>
      </div>

      ${
        data.deliveryCity || data.deliveryCountry
          ? `<div class="section">
        <h3>🚚 Adresse de livraison</h3>
        ${data.deliveryStreet ? <div class="receipt-row"><span class="label">Rue / Quartier</span><span class="value">${data.deliveryStreet}</span></div> : ""}
        ${data.deliveryCity ? <div class="receipt-row"><span class="label">Ville</span><span class="value">${data.deliveryCity}</span></div> : ""}
        ${data.deliveryCountry ? <div class="receipt-row"><span class="label">Pays</span><span class="value">${data.deliveryCountry}</span></div> : ""}
        ${data.deliveryPhone ? <div class="receipt-row"><span class="label">Contact livraison</span><span class="value">${data.deliveryPhone}</span></div> : ""}
      </div>`
          : ""
      }

      ${
        data.commissions && data.commissions.length > 0
          ? `<div class="section">
        <h3>💰 Plan de commissions parrainage</h3>
        <table class="comm-table">
          <thead><tr><th>Niveau</th><th>%</th><th>Montant estimé</th></tr></thead>
          <tbody>
            ${data.commissions
              .map(
                (c) =>
                  <tr><td>Niveau ${c.level}</td><td>${c.percentage}%</td><td>${Math.round((data.packPrice * c.percentage) / 100).toLocaleString("fr-FR")} FCFA</td></tr>
              )
              .join("")}
          </tbody>
        </table>
        <p style="font-size:11px;color:#888;margin-top:8px;">Redistribution totale : ${totalCommPct.toFixed(2)}% = ${Math.round((data.packPrice * totalCommPct) / 100).toLocaleString("fr-FR")} FCFA sur ${data.commissions.length} niveaux</p>
      </div>`
          : ""
      }
    </div>

    <div class="receipt-total">
      <span class="label">💎 Montant total payé</span>
      <span class="amount">${formatCurrency(data.packPrice)}</span>
    </div>
  </div>

  <!-- ══ CONTRACT ══ -->
  <div class="contract">
    <div class="contract-header">
      <h2>📋 Contrat de Garantie MSN Moisson</h2>
      <div class="sub">N° ${contractNumber} — Ce document constitue votre garantie officielle</div>
    </div>

    <div class="contract-body">
      <p style="font-size:13px;color:#555;margin-bottom:20px;">
        Le présent contrat garantit à <strong>${data.memberName}</strong> l'acquisition du Pack Métier
        <strong>"${data.packName}"</strong>, incluant le matériel, la formation et l'accompagnement
        nécessaire à son insertion économique au sein du réseau Institut Moisson.
      </p>

      <div class="pillar">
        <h4>A. 📦 Livraison Certifiée</h4>
        <p>MSN s'engage à livrer l'intégralité du matériel dans un délai maximum de <strong>15 jours ouvrés</strong> après validation du paiement. Un procès-verbal de réception sera signé.</p>
      </div>

      <div class="pillar">
        <h4>B. 🎓 Formation Certifiante</h4>
        <p>Formation technique intensive de <strong>2 à 4 semaines</strong> par des experts métiers partenaires. Certification <em>"Expert Moissonneur"</em> délivrée en fin de cursus.</p>
      </div>

      <div class="pillar">
        <h4>C. 📢 Kit de Visibilité</h4>
        <ul>
          <li>1 Enseigne lumineuse ou Panneau publicitaire MSN</li>
          <li>100 Cartes de visite personnalisées</li>
          <li>Tenue de travail logotypée (T-shirt, Casquette, Gilet tactique)</li>
        </ul>
      </div>

      <div class="pillar">
        <h4>D. 🌐 Insertion Réseau</h4>
        <p>Membre prioritaire sur les appels d'offres internes MSN. Référencement dans l'annuaire <em>"Moissonneurs Pros"</em>.</p>
      </div>

      <div class="pillar">
        <h4>E. 📊 Suivi Business (6 mois)</h4>
        <ul>
          <li>Gestion financière accompagnée</li>
          <li>Aide à la recherche de clients locaux</li>
          <li>Entretien et maintenance du matériel</li>
        </ul>
      </div>
    </div>

    <div class="seal-row">
      <div>
        <div class="sig-block">
          <p>Pour MSN Moisson :</p>
          <div class="sig-hand">Oniel Celvus</div>
          <div class="sig-name">Oniel Celvus — DG Institut Moisson</div>
        </div>
      </div>
      <div class="seal">MSN<br/>CERTIFIÉ<br/>✓</div>
      <div>
        <div class="sig-block">
          <p>Le Membre :</p>
          <br/><br/>
          <div class="sig-name">${data.memberName}</div>
          <p>Lu et approuvé</p>
        </div>
      </div>
    </div>
  </div>

  <div class="footer">
    <p>Institut Moisson — MSN Moisson © ${new Date().getFullYear()} | Document officiel — Reproduction interdite</p>
    <p>Unis pour prospérer &amp; protéger 🌾 | ${receiptNumber} | ${contractNumber}</p>
  </div>
</div>
</body>
</html>`;

  const blob = new Blob([html], { type: "text/html" });
  const url = URL.createObjectURL(blob);
  const win = window.open(url, "_blank");
  if (win) {
    win.onload = () => {
      setTimeout(() => {
        win.print();
      }, 500);
    };
  }
  // Also trigger a direct download as HTML (acts as PDF via print dialog)
  setTimeout(() => URL.revokeObjectURL(url), 60000);
};

/**
 * Download the receipt/contract as an HTML file that can be printed to PDF
 */
export const downloadPurchaseReceipt = (data: PurchaseReceiptData): void => {
  const receiptNumber = RECU-${data.orderId.slice(0, 8).toUpperCase()};
  generatePurchaseReceiptHTML(data);
};
