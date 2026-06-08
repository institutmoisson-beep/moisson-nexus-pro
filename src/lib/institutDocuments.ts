import jsPDF from "jspdf";

const PRIMARY = "#5B21B6"; // violet
const GOLD = "#B8860B";
const TEXT = "#1F2937";

interface DocContext {
  fullName?: string;
  userId?: string;
  email?: string;
  currentPack?: string;
  registrationDate?: string;
  signatureHash?: string;
  acceptedAt?: string;
}

function header(doc: jsPDF, title: string, subtitle?: string) {
  doc.setFillColor(PRIMARY);
  doc.rect(0, 0, 210, 28, "F");
  doc.setTextColor("#FFFFFF");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text("INSTITUT MOISSON", 15, 12);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text("ONG Internationale • Communauté Participative Globale", 15, 18);
  doc.setFontSize(8);
  doc.text("Siège : Bendèkouassikro / Bouaké — République de Côte d'Ivoire", 15, 23);

  doc.setTextColor(TEXT);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text(title, 105, 40, { align: "center" });
  if (subtitle) {
    doc.setFont("helvetica", "italic");
    doc.setFontSize(10);
    doc.setTextColor("#6B7280");
    doc.text(subtitle, 105, 47, { align: "center" });
    doc.setTextColor(TEXT);
  }
  doc.setDrawColor(GOLD);
  doc.setLineWidth(0.6);
  doc.line(60, subtitle ? 50 : 44, 150, subtitle ? 50 : 44);
  return subtitle ? 58 : 52;
}

function footer(doc: jsPDF) {
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setDrawColor("#E5E7EB");
    doc.line(15, 285, 195, 285);
    doc.setFontSize(8);
    doc.setTextColor("#6B7280");
    doc.setFont("helvetica", "normal");
    doc.text("Institut Moisson — Document officiel", 15, 290);
    doc.text(`Page ${i} / ${pageCount}`, 195, 290, { align: "right" });
  }
}

function writeBlocks(doc: jsPDF, blocks: { type: "h1" | "h2" | "h3" | "p"; text: string }[], startY: number) {
  let y = startY;
  const margin = 18;
  const maxWidth = 210 - margin * 2;

  for (const b of blocks) {
    if (y > 270) { doc.addPage(); y = 25; }
    if (b.type === "h1") {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(13);
      doc.setTextColor(PRIMARY);
      const lines = doc.splitTextToSize(b.text, maxWidth);
      doc.text(lines, margin, y);
      y += lines.length * 6 + 3;
    } else if (b.type === "h2") {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.setTextColor(TEXT);
      const lines = doc.splitTextToSize(b.text, maxWidth);
      doc.text(lines, margin, y);
      y += lines.length * 5.5 + 2;
    } else if (b.type === "h3") {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.setTextColor(GOLD);
      const lines = doc.splitTextToSize(b.text, maxWidth);
      doc.text(lines, margin, y);
      y += lines.length * 5 + 1.5;
    } else {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(TEXT);
      const lines = doc.splitTextToSize(b.text, maxWidth);
      for (const line of lines) {
        if (y > 275) { doc.addPage(); y = 25; }
        doc.text(line, margin, y);
        y += 5;
      }
      y += 2;
    }
  }
  return y;
}

// ============ 1. STATUTS ============
export function generateStatutsPDF(): jsPDF {
  const doc = new jsPDF();
  const y = header(doc, "STATUTS DE L'ORGANISATION INTERNATIONALE", "« INSTITUT MOISSON »");

  writeBlocks(doc, [
    { type: "h1", text: "TITRE I : CONSTITUTION — DÉNOMINATION — SIÈGE — DURÉE" },
    { type: "h2", text: "ARTICLE 1 : CONSTITUTION ET FORME JURIDIQUE" },
    { type: "p", text: "Il est constitué entre les adhérents aux présents statuts et tous ceux qui y adhéreront ultérieurement, une Organisation Non Gouvernementale (ONG) Internationale à vocation de Fondation par Actions Participatives et Groupement d'Intérêt Communautaire, régie par les lois nationales en vigueur et les dispositions du droit international des associations." },
    { type: "h2", text: "ARTICLE 2 : DÉNOMINATION" },
    { type: "p", text: "L'organisation prend la dénomination officielle de : INSTITUT MOISSON (abrégé « IM » ou « La Communauté »)." },
    { type: "h2", text: "ARTICLE 3 : SIÈGE SOCIAL" },
    { type: "p", text: "Le siège international de l'Institut Moisson est établi à Bendèkouassikro / Bouaké, République de Côte d'Ivoire. Il peut être transféré dans toute autre ville ou pays par décision du Haut Conseil d'Éthique. Des antennes nationales (chapitres) peuvent être créées librement à l'étranger pour encadrer les membres locaux." },
    { type: "h2", text: "ARTICLE 4 : DURÉE" },
    { type: "p", text: "La durée de l'Institut Moisson est illimitée, sauf dissolution anticipée prononcée conformément aux présents statuts." },

    { type: "h1", text: "TITRE II : BUTS — OBJECTIFS — MOYENS D'ACTION" },
    { type: "h2", text: "ARTICLE 5 : BUT ET DOCTRINE" },
    { type: "p", text: "L'Institut Moisson est une communauté internationale bâtie sur les principes d'une famille solidaire, visant l'élévation morale, technique, financière et professionnelle de ses membres par la mutualisation des compétences et des ressources. Sa doctrine repose sur la droiture, la discipline collective et la maîtrise absolue de soi." },
    { type: "h2", text: "ARTICLE 6 : OBJECTIFS STRATÉGIQUES" },
    { type: "p", text: "L'Institut se donne pour missions :\n1. La formation professionnelle d'élite dans les secteurs régaliens et technologiques (Sécurité opérationnelle, Cyber-sécurité, Droit, Ingénierie).\n2. Le développement d'un écosystème commercial et financier participatif permettant l'autonomisation de ses membres.\n3. Le financement de projets entrepreneuriaux portés par ses jeunes diplômés afin de lutter contre le chômage.\n4. L'assistance sociale, l'entraide mutuelle et la protection financière de la famille communautaire." },
    { type: "h2", text: "ARTICLE 7 : MOYENS D'ACTION ET MODÈLE ÉCONOMIQUE HYBRIDE" },
    { type: "p", text: "Pour atteindre ses objectifs, l'Institut Moisson utilise un modèle d'actionnariat participatif global structuré autour d'une application numérique officielle combinant :\n• Des cycles de formation d'excellence conçus par l'Institut et validés par conventionnement avec des structures privées agréées et des institutions étatiques nationales et internationales.\n• Un réseau d'expansion basé sur le marketing relationnel (MLM / multi-niveaux) géré par des algorithmes de distribution automatique.\n• Un réseau de distribution et de commerce de gros de produits de grande consommation.\n• Un outil de gestion financière décentralisé matérialisé par un portefeuille électronique sécurisé (Wallet MSN)." },

    { type: "h1", text: "TITRE III : COMPOSITION — ADHÉSION — RESSOURCES FINANCIÈRES" },
    { type: "h2", text: "ARTICLE 8 : QUALITÉ DE MEMBRE ET CONTRAT D'ADHÉSION" },
    { type: "p", text: "Peut devenir membre de l'Institut Moisson toute personne physique ou morale partageant les valeurs de l'organisation. L'adhésion s'effectue obligatoirement par voie numérique via l'application officielle par la validation du Contrat d'Adhésion Communautaire. L'adhérent prend alors le titre de « Membre Moissonneur » ou « Membre Distributeur »." },
    { type: "h2", text: "ARTICLE 9 : ACQUISITION DE MULTI-PACKS" },
    { type: "p", text: "Chaque membre a la faculté de souscrire à un ou plusieurs « Packs d'Activité et de Formation » au sein de l'application. La souscription de chaque pack donne droit aux formations rattachées et ouvre des droits de distribution commerciale spécifiques dans le réseau." },
    { type: "h2", text: "ARTICLE 10 : RESSOURCES DE L'ORGANISATION" },
    { type: "p", text: "Les ressources de l'Institut Moisson proviennent :\n1. Des contributions participatives liées à la souscription des packs de formation.\n2. Des cotisations et fonds d'adhésion des membres.\n3. Des marges générées par la centrale d'achat et le commerce de gros de la communauté.\n4. Un prélèvement algorithmique fixe sur chaque transaction (achats de packs, commissions réseau, flux marchands) destiné à alimenter le Fonds Communautaire de Solidarité et de Financement." },

    { type: "h1", text: "TITRE IV : GOUVERNANCE ET ADMINISTRATION" },
    { type: "h2", text: "ARTICLE 11 : LE HAUT CONSEIL D'ÉTHIQUE" },
    { type: "p", text: "L'Institut Moisson est placé sous l'autorité suprême du Haut Conseil d'Éthique. Ce conseil est le garant de la doctrine, de la discipline, de la légalité républicaine et de l'éthique de la communauté. Il détient le pouvoir de veto sur toutes les décisions financières, pédagogiques et administratives." },
    { type: "h2", text: "ARTICLE 12 : LE COMITÉ EXÉCUTIF ET DE PILOTAGE" },
    { type: "p", text: "Le Comité Exécutif assure la gestion quotidienne de l'organisation, supervise l'ingénierie technique de l'application mobile / web, valide le catalogue des produits en gros et ordonnance les investissements de développement validés par le Haut Conseil." },

    { type: "h1", text: "TITRE V : LE FONDS DE SOLIDARITÉ ET DISSOLUTION" },
    { type: "h2", text: "ARTICLE 13 : AFFECTATION DU FONDS DE SOLIDARITÉ" },
    { type: "p", text: "Le Fonds Communautaire de Solidarité et de Financement, géré de manière transparente au sein de l'écosystème numérique, ne peut être redistribué à des fins d'enrichissement personnel des dirigeants. Il est exclusivement mobilisé pour :\n• Financer à taux zéro ou sous forme de bourses les projets d'entreprise des jeunes diplômés méritants de la communauté.\n• Soutenir financièrement les familles des membres en cas de coup dur (maladie, décès, sinistres)." },
    { type: "h2", text: "ARTICLE 14 : DISSOLUTION" },
    { type: "p", text: "En cas de dissolution volontaire ou forcée de l'organisation, l'ensemble des actifs technologiques, financiers et physiques de l'Institut Moisson sera intégralement transféré à des œuvres caritatives ou à des fondations sœurs poursuivant des buts similaires, sous la supervision d'un liquidateur nommé par le Haut Conseil d'Éthique." },
  ], y);

  footer(doc);
  return doc;
}

// ============ 2. RÈGLEMENT INTÉRIEUR ============
export function generateReglementPDF(): jsPDF {
  const doc = new jsPDF();
  const y = header(doc, "RÈGLEMENT INTÉRIEUR", "INSTITUT MOISSON");

  writeBlocks(doc, [
    { type: "h1", text: "CHAPITRE I : DISCIPLINE, MAÎTRISE DE SOI ET CODE D'HONNEUR" },
    { type: "h2", text: "ARTICLE 1 : DISCIPLINE COMMUNAUTAIRE" },
    { type: "p", text: "L'Institut Moisson n'est pas qu'une plateforme d'apprentissage ou de commerce ; c'est une famille d'honneur. Chaque membre doit traiter ses pairs avec le respect, la loyauté et la bienveillance dus à un membre de sa propre famille. La calomnie, la trahison et la division au sein du réseau sont sévèrement sanctionnées." },
    { type: "h2", text: "ARTICLE 2 : MAÎTRISE DE SOI ET ORDRE PUBLIC" },
    { type: "p", text: "Les membres formés par l'Institut, notamment au sein du Pôle Security Vanguard, doivent faire preuve d'une maîtrise de soi absolue. L'usage de la force, de la provocation, de l'intimidation ou l'implication dans des troubles à l'ordre public est strictement interdit. Le Moissonneur est un bâtisseur de paix et de sécurité au service de l'État et de la communauté." },

    { type: "h1", text: "CHAPITRE II : COMMERCE EN GROS ET RÉGULATION DES MARCHÉS" },
    { type: "h2", text: "ARTICLE 3 : STATUT DE MEMBRE DISTRIBUTEUR" },
    { type: "p", text: "Tout membre ayant validé son profil a accès au catalogue de gros de l'Institut. Il est autorisé à revendre les produits de consommation (agroalimentaire, cosmétiques, technologies) en appliquant des marges conformes aux grilles de prix indicatives fixées par l'application pour éviter toute concurrence déloyale entre Moissonneurs." },
    { type: "h2", text: "ARTICLE 4 : GESTION DES POINTS VALEURS (PV)" },
    { type: "p", text: "Les achats de produits de gros effectués par un membre ou par sa lignée descendante (downline) génèrent des Points Valeurs (PV). Ces PV sont accumulés mensuellement et convertis automatiquement en bonus financiers sur le portefeuille intégré de l'utilisateur. Toute manipulation frauduleuse du volume de PV ou fausse déclaration entraîne le blocage immédiat du compte." },

    { type: "h1", text: "CHAPITRE III : GESTION DU PORTEFEUILLE NUMÉRIQUE (WALLET MSN) ET MARKETING RELATIONNEL (MLM)" },
    { type: "h2", text: "ARTICLE 5 : TRANSPARENCE DU RÉSEAU MLM" },
    { type: "p", text: "L'écosystème utilise le marketing de réseau pour propager son modèle. Le parrainage doit être basé sur l'explication honnête de la vision de l'Institut. Il est interdit de présenter l'application comme un système de placement d'argent passif (Ponzi). Les gains proviennent exclusivement du travail réel : vente de produits de gros et distribution de packs de formation." },
    { type: "h2", text: "ARTICLE 6 : RÈGLES DE RETRAIT ET DE SÉCURITÉ DU WALLET" },
    { type: "p", text: "Le Wallet MSN est strictement personnel. L'utilisateur est responsable de la confidentialité de ses codes d'accès. Les commissions MLM et marges de gros créditées sont retirables selon les paliers techniques configurés dans l'application, après déduction automatique de la quote-part obligatoire destinée au Fonds Communautaire de Solidarité." },

    { type: "h1", text: "CHAPITRE IV : ATTRIBUTION DES DIPLÔMES ET INSIGNES OFFICIELS" },
    { type: "h2", text: "ARTICLE 7 : ACCOMPLISSEMENT DU CURSUS ACADÉMIQUE" },
    { type: "p", text: "L'acquisition d'un pack de formation ne vaut pas obtention du diplôme. Le membre doit obligatoirement suivre l'intégralité des modules en ligne et sur le terrain, et obtenir la moyenne requise aux examens supervisés par le consortium (Institut, Partenaires Privés et Autorités Étatiques)." },
    { type: "h2", text: "ARTICLE 8 : PORT DE L'UNIFORME ET INSIGNES PROTÉGÉS" },
    { type: "p", text: "L'uniforme d'apparat officiel (la veste d'honneur varoise rose clair kaki) et l'Insigne officiel des Moissonneurs sont des marques déposées et protégées auprès de l'OAPI (Organisation Africaine de la Propriété Intellectuelle). Le port de l'uniforme complet est strictement réservé aux cérémonies officielles de remise de diplômes, aux assemblées générales ou sur autorisation écrite expresse du Haut Conseil d'Éthique. Tout usage abusif, déshonorant ou commercialisation parallèle de l'uniforme entraînera l'exclusion immédiate et des poursuites pénales." },

    { type: "h1", text: "CHAPITRE V : SANCTIONS ET EXCLUSIONS" },
    { type: "h2", text: "ARTICLE 9 : ÉCHELLE DES SANCTIONS" },
    { type: "p", text: "En cas de violation des statuts ou du présent règlement intérieur, le Conseil d'Éthique peut appliquer les sanctions suivantes, selon la gravité de la faute :\n1. Avertissement numérique avec notification dans l'application.\n2. Suspension temporaire du Wallet MSN et blocage des liens de parrainage.\n3. Révocation des droits de distribution de gros.\n4. Exclusion définitive de la Communauté avec suppression du compte de l'application et perte totale des droits sur le réseau constitué." },
    { type: "h2", text: "ARTICLE 10 : SIGNATURE ET ACCEPTATION REQUISES" },
    { type: "p", text: "L'acceptation du présent Règlement Intérieur est obligatoire lors de la première connexion à l'application. Elle est matérialisée par une case à cocher électronique qui lie juridiquement le membre à l'Institut Moisson, avec la même valeur qu'une signature manuscrite." },
  ], y);

  footer(doc);
  return doc;
}

// ============ 3. CONTRAT D'ADHÉSION ============
export function generateContratPDF(ctx: DocContext): jsPDF {
  const doc = new jsPDF();
  const y = header(doc, "CONTRAT D'ADHÉSION COMMUNAUTAIRE", "Association Internationale & GIE — Écosystème Participatif Global");

  const accepted = ctx.acceptedAt
    ? new Date(ctx.acceptedAt).toLocaleString("fr-FR")
    : "—";

  writeBlocks(doc, [
    { type: "h1", text: "ENTRE LES SOUSSIGNÉS" },
    { type: "p", text: "L'INSTITUT MOISSON, Organisation Non Gouvernementale (ONG) Internationale à gouvernance participative et Groupement d'Intérêt Communautaire, dont le siège mondial est établi à Bendèkouassikro / Bouaké, Côte d'Ivoire, représenté par son Président du Haut Conseil d'Éthique, ci-après dénommé « L'Institut » ou « La Communauté », d'une part ;" },
    { type: "p", text: "ET L'ADHÉRENT NUMÉRIQUE, utilisateur inscrit via l'application officielle de l'Institut Moisson, dont les informations d'identité électronique sont les suivantes :" },
    { type: "h3", text: "IDENTITÉ DE L'ADHÉRENT" },
    { type: "p", text:
      `• Nom complet : ${ctx.fullName || "—"}\n` +
      `• Identifiant Unique (User ID) : ${ctx.userId || "—"}\n` +
      `• Adresse e-mail : ${ctx.email || "—"}\n` +
      `• Pack Initial Souscrit : ${ctx.currentPack || "—"}\n` +
      `• Date et Heure d'Adhésion : ${ctx.registrationDate || "—"}`
    },
    { type: "p", text: "Ci-après dénommé(e) « L'Adhérent », « Le Membre Distributeur » ou « Le Moissonneur », d'autre part." },

    { type: "h1", text: "PRÉAMBULE" },
    { type: "p", text: "L'Institut Moisson constitue une communauté internationale unie par des principes de solidarité, de mutualisation des ressources et d'élévation professionnelle, formant une véritable famille collective. Le présent accord scelle l'intégration de l'Adhérent au sein de ce modèle d'actionnariat participatif global. Ce contrat de groupement fusionne la formation d'élite, le financement de projets, le commerce en gros et le marketing relationnel de réseau, le tout opéré de manière transparente à travers l'écosystème numérique et le portefeuille intégré de l'application." },

    { type: "h2", text: "ARTICLE 1 : STATUT DU MEMBRE, FORMATIONS ET MULTI-PACKS" },
    { type: "p", text: "En validant son adhésion, l'Adhérent acquiert le statut de Membre de la communauté internationale de l'Institut Moisson. L'Adhérent a le droit et l'opportunité de souscrire à un ou plusieurs autres packs de formation et d'activité (Pôles Security Vanguard, Cyber-Vanguard, Juristes, ou autres packs sectoriels) directement depuis son interface. L'achat de chaque pack débloque l'accès aux cycles de formation d'excellence correspondants, co-dispensés et légitimés conjointement par des structures privées agréées et des institutions étatiques nationaux et internationaux partenaires de l'Institut." },

    { type: "h2", text: "ARTICLE 2 : ÉCOSYSTÈME MLM ET COMMISSIONS RELATIONNELLES" },
    { type: "p", text: "L'Institut Moisson structure son expansion internationale sur un modèle de marketing relationnel (MLM / Marketing Multi-Niveaux). L'Adhérent est libre de développer son propre réseau de recommandation. À ce titre, il perçoit des commissions algorithmiques directes et indirectes basées sur les taux contractuels affectés à chaque pack lors de l'inscription de nouveaux membres au sein de son réseau de parrainage. Le calcul et la distribution de ces commissions de réseau sont entièrement automatisés par les scripts informatiques sécurisés du système." },

    { type: "h2", text: "ARTICLE 3 : LE PORTEFEUILLE INTÉGRÉ (WALLET MSN)" },
    { type: "p", text: "L'application fournit à l'Adhérent un portefeuille électronique sécurisé intégré (Wallet MSN). Ce portefeuille enregistre en temps réel :\n• Les contributions financières participatives de l'Adhérent pour l'acquisition de nouveaux packs ou produits.\n• Les commissions de marketing de réseau (MLM) acquises par l'Adhérent.\n• Les revenus générés par ses ventes en gros.\nL'Adhérent peut utiliser le solde disponible dans son portefeuille pour réinvestir dans l'écosystème ou en demander le retrait selon les conditions financières définies par la communauté." },

    { type: "h2", text: "ARTICLE 4 : COMMERCE DE GROS, DISTRIBUTION ET RÉMUNÉRATION" },
    { type: "p", text: "L'Institut Moisson met à disposition de sa communauté une centrale d'achat et un catalogue de produits de grande consommation (produits alimentaires de base, cosmétiques, savons, équipements spécialisés). L'Adhérent bénéficie du statut de Membre Distributeur Agréé :\n1. Il est habilité à acheter ces denrées et articles en gros à des prix communautaires préférentiels.\n2. Il génère des marges commerciales directes lors de la revente de ces produits sur le marché.\n3. Le volume d'achat de produits de sa lignée (downline) génère des points valeurs (PV) convertibles en bonus financiers mensuels crédités sur son portefeuille intégré." },

    { type: "h2", text: "ARTICLE 5 : LE FONDS COMMUNAUTAIRE DE SOLIDARITÉ ET DE FINANCEMENT" },
    { type: "p", text: "Chaque acquisition de pack, chaque transaction commerciale et chaque mouvement réseau au sein de l'application alimente à hauteur d'un pourcentage défini le Fonds Communautaire de Solidarité de l'Institut Moisson. Ce fonds d'actionnariat participatif est exclusivement destiné à :\n• Accorder des bourses d'études et soutenir les membres de la famille Moissonneur en situation de vulnérabilité.\n• Financer de manière participative des projets entrepreneuriaux et d'ingénierie soumis par les jeunes diplômés et membres de la communauté, après validation par le comité de pilotage." },

    { type: "h2", text: "ARTICLE 6 : CODE D'HONNEUR, ÉTHIQUE ET VALIDATION ÉLECTRONIQUE" },
    { type: "p", text: "Le Membre s'engage à respecter le Code d'Honneur de l'organisation, basé sur la loyauté, la droiture et la maîtrise de soi apprise lors du tronc commun. Les uniformes d'apparat (la veste varoise d'honneur rose clair kaki) et insignes officiels sont protégés auprès de l'OAPI. Ce contrat est réputé signé et exécutoire dès la validation de l'inscription de l'utilisateur sur l'application. La génération automatique du présent PDF, comprenant l'identifiant de sécurité unique et l'empreinte de la transaction, fait foi de consentement mutuel parfait." },
  ], y);

  // Signature block
  let sy = (doc as any).internal.pageSize.height ? (doc as any).lastAutoTable?.finalY : 0;
  // Force new page if low
  // Simpler: add new page for signature
  doc.addPage();
  doc.setDrawColor(GOLD);
  doc.setLineWidth(0.4);
  doc.line(15, 25, 195, 25);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.setTextColor(PRIMARY);
  doc.text("SIGNATURE ÉLECTRONIQUE SÉCURISÉE", 105, 35, { align: "center" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(TEXT);

  // Two columns
  doc.setFont("helvetica", "bold");
  doc.text("Pour l'Institut Moisson", 50, 60, { align: "center" });
  doc.text("Pour l'Adhérent / Distributeur", 160, 60, { align: "center" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text("Le Secrétariat Général", 50, 68, { align: "center" });
  doc.text("Haut Conseil d'Éthique", 50, 74, { align: "center" });
  doc.text("Bendèkouassikro / Bouaké", 50, 80, { align: "center" });

  doc.text("Signature numérique de l'utilisateur", 160, 68, { align: "center" });
  doc.text(`ID : ${ctx.userId || "—"}`, 160, 74, { align: "center" });
  doc.text(`Accepté le : ${accepted}`, 160, 80, { align: "center" });

  doc.setDrawColor("#9CA3AF");
  doc.line(20, 100, 90, 100);
  doc.line(120, 100, 200, 100);

  // Stamp
  doc.setDrawColor(PRIMARY);
  doc.setLineWidth(1);
  doc.circle(50, 130, 18);
  doc.setFontSize(7);
  doc.setTextColor(PRIMARY);
  doc.text("INSTITUT MOISSON", 50, 127, { align: "center" });
  doc.text("HAUT CONSEIL", 50, 132, { align: "center" });
  doc.text("D'ÉTHIQUE", 50, 136, { align: "center" });

  // Hash box
  doc.setDrawColor("#D1D5DB");
  doc.setLineWidth(0.3);
  doc.roundedRect(15, 160, 180, 35, 2, 2);
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(TEXT);
  doc.text("EMPREINTE DE SÉCURITÉ DU CONTRAT", 105, 168, { align: "center" });
  doc.setFont("courier", "normal");
  doc.setFontSize(8);
  doc.setTextColor("#374151");
  doc.text(`Hash      : ${ctx.signatureHash || "—"}`, 20, 178);
  doc.text(`User ID   : ${ctx.userId || "—"}`, 20, 184);
  doc.text(`Accepté   : ${accepted}`, 20, 190);

  doc.setFont("helvetica", "italic");
  doc.setFontSize(8);
  doc.setTextColor("#6B7280");
  doc.text(
    "Ce document a été généré automatiquement par l'application Institut Moisson. La validation électronique\nde l'utilisateur tient lieu de signature manuscrite conformément au droit international des contrats numériques.",
    105, 215, { align: "center" }
  );

  footer(doc);
  return doc;
}

export async function computeSignatureHash(input: string): Promise<string> {
  const buf = new TextEncoder().encode(input);
  const hash = await crypto.subtle.digest("SHA-256", buf);
  return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, "0")).join("");
}
