// Types pour le système MLM Les Moissonneurs

export interface User {
  id: string;
  email: string;
  nom: string;
  prenom: string;
  codeMoissonneur: string;
  telephone?: string;
  avatar?: string;
  solde: number;
  role: UserRole;
  parrainId?: string;
  position: 'gauche' | 'droite' | null;
  niveau: number;
  isActive: boolean;
  createdAt: Date;
  lastLogin?: Date;
}

export type UserRole = 
  | 'admin'
  | 'financier'
  | 'gestion_packs'
  | 'gestion_stand'
  | 'informaticien'
  | 'commercial'
  | 'communication'
  | 'utilisateur';

export interface RoleDashboard {
  id: string;
  name: string;
  description: string;
  icon: string;
  permissions: Permission[];
  actions: string[];
  metrics: Metric[];
}

export interface Permission {
  module: string;
  read: boolean;
  write: boolean;
  delete: boolean;
  approve: boolean;
}

export interface Metric {
  label: string;
  value: number | string;
  trend?: 'up' | 'down' | 'neutral';
  change?: number;
}

export interface Pack {
  id: string;
  nom: string;
  description: string;
  prix: number;
  image: string;
  images: string[];
  isMLM: boolean;
  bonusDirect: number;
  bonusEquipe: number;
  pointsEquipe: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Stand {
  id: string;
  nom: string;
  secteur: string;
  entreprise: string;
  description: string;
  localisation: string;
  responsableId: string;
  isActive: boolean;
  createdAt: Date;
}

export interface Transaction {
  id: string;
  userId: string;
  type: TransactionType;
  montant: number;
  frais: number;
  net: number;
  statut: 'pending' | 'completed' | 'failed' | 'cancelled';
  description: string;
  reference?: string;
  transactionId?: string;
  beneficaireId?: string;
  packId?: string;
  commandeId?: string;
  commissionType?: CommissionType;
  createdAt: Date;
  processedAt?: Date;
}

export type TransactionType =
  | 'depot'
  | 'retrait'
  | 'transfert'
  | 'achat_pack'
  | 'achat_produit'
  | 'commission_directe'
  | 'commission_equipe'
  | 'bonus_mlm'
  | 'bonus_admin'
  | 'frais_service';

export type CommissionType =
  | 'direct'
  | 'binaire_gauche'
  | 'binaire_droite'
  | 'equipe_niveau_1'
  | 'equipe_niveau_2'
  | 'equipe_niveau_3'
  | 'global_pool';

export interface Commande {
  id: string;
  userId: string;
  items: CommandeItem[];
  total: number;
  statut: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  noteService?: string;
  noteLivraison?: string;
  adresseLivraison: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CommandeItem {
  productId: string;
  nom: string;
  description: string;
  quantite: number;
  prixUnitaire: number;
  total: number;
}

export interface MLMBonusConfig {
  id: string;
  nom: string;
  description: string;
  type: CommissionType;
  pourcentage: number;
  montantFixe?: number;
  niveauMax?: number;
  conditionMinimale?: number;
  isActive: boolean;
  updatedAt: Date;
}

export interface WalletSettings {
  id: string;
  fraisRetraitPourcentage: number;
  fraisRetraitFixe: number;
  fraisTransfertPourcentage: number;
  fraisTransfertFixe: number;
  montantMinRetrait: number;
  montantMinTransfert: number;
  montantMaxRetraitJour: number;
  updatedAt: Date;
}

export interface PaymentMethod {
  id: string;
  nom: string;
  type: 'mobile_money' | 'bank' | 'crypto' | 'other';
  lienPaiement?: string;
  adresse?: string;
  contact?: string;
  email?: string;
  instructions: string;
  isActive: boolean;
  logo?: string;
}

export interface CareerProfile {
  id: string;
  nom: string;
  niveauRequis: number;
  bonusNiveau: number;
  avantages: string[];
  isActive: boolean;
}

export interface BinaryTreeStats {
  userId: string;
  brancheGauche: {
    totalMembers: number;
    volumePoints: number;
    volumeBusiness: number;
    newMembersToday: number;
  };
  brancheDroite: {
    totalMembers: number;
    volumePoints: number;
    volumeBusiness: number;
    newMembersToday: number;
  };
  weakLeg: 'gauche' | 'droite';
  strongLeg: 'gauche' | 'droite';
  binaryBonusEligible: boolean;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  isRead: boolean;
  actionUrl?: string;
  createdAt: Date;
}

export const ROLES_CONFIG: Record<UserRole, RoleDashboard> = {
  admin: {
    id: 'admin',
    name: 'Administrateur',
    description: 'Gestion complète du système MLM',
    icon: 'shield',
    permissions: [
      { module: 'users', read: true, write: true, delete: true, approve: true },
      { module: 'packs', read: true, write: true, delete: true, approve: true },
      { module: 'transactions', read: true, write: true, delete: false, approve: true },
      { module: 'bonus', read: true, write: true, delete: true, approve: true },
      { module: 'stands', read: true, write: true, delete: true, approve: true },
      { module: 'commandes', read: true, write: true, delete: true, approve: true },
      { module: 'settings', read: true, write: true, delete: false, approve: true },
    ],
    actions: [
      'Gérer tous les utilisateurs',
      'Configurer les bonus MLM',
      'Modifier les packs et stands',
      'Approuver les transactions',
      'Créditer/Débiter les portefeuilles',
      'Gérer les paramètres système',
    ],
    metrics: [
      { label: 'Utilisateurs totaux', value: 0 },
      { label: 'Transactions aujourd\'hui', value: 0 },
      { label: 'Volume MLM', value: '0 FCFA' },
      { label: 'Nouveaux membres', value: 0 },
    ],
  },
  financier: {
    id: 'financier',
    name: 'Responsable Financier',
    description: 'Gestion des transactions et finances',
    icon: 'wallet',
    permissions: [
      { module: 'transactions', read: true, write: true, delete: false, approve: true },
      { module: 'users', read: true, write: false, delete: false, approve: false },
      { module: 'bonus', read: true, write: true, delete: false, approve: true },
    ],
    actions: [
      'Approuver les retraits',
      'Vérifier les dépôts',
      'Gérer les commissions',
      'Exporter les rapports financiers',
    ],
    metrics: [
      { label: 'Retraits en attente', value: 0 },
      { label: 'Dépôts à vérifier', value: 0 },
      { label: 'Total distribué (mois)', value: '0 FCFA' },
    ],
  },
  gestion_packs: {
    id: 'gestion_packs',
    name: 'Gestionnaire de Packs',
    description: 'Gestion des packs MLM et produits',
    icon: 'package',
    permissions: [
      { module: 'packs', read: true, write: true, delete: true, approve: false },
      { module: 'commandes', read: true, write: true, delete: false, approve: true },
    ],
    actions: [
      'Créer et modifier les packs',
      'Gérer les stocks',
      'Suivre les commandes',
      'Valider les livraisons',
    ],
    metrics: [
      { label: 'Packs vendus (mois)', value: 0 },
      { label: 'Commandes en cours', value: 0 },
      { label: 'Produits ordinaires', value: 0 },
    ],
  },
  gestion_stand: {
    id: 'gestion_stand',
    name: 'Gestionnaire de Stands',
    description: 'Gestion des stands et secteurs',
    icon: 'store',
    permissions: [
      { module: 'stands', read: true, write: true, delete: true, approve: false },
      { module: 'users', read: true, write: false, delete: false, approve: false },
    ],
    actions: [
      'Créer des stands entreprise',
      'Assigner des responsables',
      'Gérer les secteurs',
      'Suivre les performances',
    ],
    metrics: [
      { label: 'Stands actifs', value: 0 },
      { label: 'Secteurs couverts', value: 0 },
      { label: 'Responsables assignés', value: 0 },
    ],
  },
  informaticien: {
    id: 'informaticien',
    name: 'Responsable Informatique',
    description: 'Maintenance et support technique',
    icon: 'cpu',
    permissions: [
      { module: 'users', read: true, write: true, delete: false, approve: false },
      { module: 'settings', read: true, write: true, delete: false, approve: false },
    ],
    actions: [
      'Support technique utilisateurs',
      'Gérer les accès',
      'Surveiller le système',
      'Résoudre les incidents',
    ],
    metrics: [
      { label: 'Tickets ouverts', value: 0 },
      { label: 'Incidents résolus', value: 0 },
      { label: 'Disponibilité système', value: '99.9%' },
    ],
  },
  commercial: {
    id: 'commercial',
    name: 'Responsable Commercial',
    description: 'Développement et suivi commercial',
    icon: 'trending-up',
    permissions: [
      { module: 'users', read: true, write: false, delete: false, approve: false },
      { module: 'packs', read: true, write: false, delete: false, approve: false },
      { module: 'commandes', read: true, write: true, delete: false, approve: false },
    ],
    actions: [
      'Suivre les ventes',
      'Analyser les performances',
      'Proposer des promotions',
      'Former les distributeurs',
    ],
    metrics: [
      { label: 'Ventes totales', value: '0 FCFA' },
      { label: 'Taux de conversion', value: '0%' },
      { label: 'Distributeurs actifs', value: 0 },
    ],
  },
  communication: {
    id: 'communication',
    name: 'Responsable Communication',
    description: 'Communication et marketing',
    icon: 'megaphone',
    permissions: [
      { module: 'users', read: true, write: false, delete: false, approve: false },
    ],
    actions: [
      'Envoyer des notifications',
      'Gérer les annonces',
      'Créer du contenu',
      'Animer la communauté',
    ],
    metrics: [
      { label: 'Notifications envoyées', value: 0 },
      { label: 'Taux d\'ouverture', value: '0%' },
      { label: 'Engagement', value: '0%' },
    ],
  },
  utilisateur: {
    id: 'utilisateur',
    name: 'Utilisateur',
    description: 'Membre du réseau MLM',
    icon: 'user',
    permissions: [
      { module: 'profile', read: true, write: true, delete: false, approve: false },
      { module: 'wallet', read: true, write: true, delete: false, approve: false },
      { module: 'network', read: true, write: false, delete: false, approve: false },
    ],
    actions: [
      'Acheter des packs',
      'Transférer de l\'argent',
      'Voir son réseau',
      'Suivre ses commissions',
    ],
    metrics: [
      { label: 'Solde', value: '0 FCFA' },
      { label: 'Réseau total', value: 0 },
      { label: 'Commissions (mois)', value: '0 FCFA' },
    ],
  },
};
