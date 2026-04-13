// Store Zustand pour la gestion d'état du système MLM

import { create } from 'zustand';
import { User, Transaction, Pack, Commande, Notification, UserRole, MLMBonusConfig, WalletSettings, PaymentMethod, Stand, CareerProfile, BinaryTreeStats } from '../types/mlm';

interface MLMState {
  // Utilisateur actuel
  currentUser: User | null;
  isAuthenticated: boolean;
  
  // Données utilisateur
  users: User[];
  transactions: Transaction[];
  packs: Pack[];
  commandes: Commande[];
  notifications: Notification[];
  
  // Configuration MLM
  bonusConfigs: MLMBonusConfig[];
  walletSettings: WalletSettings;
  paymentMethods: PaymentMethod[];
  stands: Stand[];
  careerProfiles: CareerProfile[];
  
  // Statistiques arbre binaire
  binaryStats: BinaryTreeStats | null;
  
  // Actions Authentication
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  register: (userData: Partial<User>) => Promise<boolean>;
  
  // Actions Utilisateur
  setCurrentUser: (user: User | null) => void;
  updateUserRole: (userId: string, role: UserRole) => void;
  creditWallet: (userId: string, amount: number, description: string) => void;
  debitWallet: (userId: string, amount: number, description: string) => void;
  
  // Actions Transactions
  addTransaction: (transaction: Partial<Transaction>) => void;
  updateTransactionStatus: (transactionId: string, status: Transaction['statut']) => void;
  getTransactionsByUser: (userId: string) => Transaction[];
  getAllTransactions: () => Transaction[];
  
  // Actions Packs
  addPack: (pack: Partial<Pack>) => void;
  updatePack: (packId: string, updates: Partial<Pack>) => void;
  deletePack: (packId: string) => void;
  purchasePack: (userId: string, packId: string) => void;
  
  // Actions Commandes
  addCommande: (commande: Partial<Commande>) => void;
  updateCommande: (commandeId: string, updates: Partial<Commande>) => void;
  getCommandesByUser: (userId: string) => Commande[];
  
  // Actions MLM
  calculateBinaryBonus: (userId: string) => void;
  distributeCommission: (userId: string, amount: number, type: any) => void;
  updateBonusConfig: (configId: string, updates: Partial<MLMBonusConfig>) => void;
  updateWalletSettings: (settings: Partial<WalletSettings>) => void;
  
  // Actions Notifications
  addNotification: (notification: Partial<Notification>) => void;
  markNotificationAsRead: (notificationId: string) => void;
  
  // Actions Transfert
  transferMoney: (senderId: string, recipientEmailOrCode: string, amount: number) => Promise<boolean>;
  
  // Helper
  formatAmount: (amount: number) => string;
}

// Données mockées pour le développement
const mockUsers: User[] = [
  {
    id: '1',
    email: 'admin@moissonneurs.com',
    nom: 'Admin',
    prenom: 'Principal',
    codeMoissonneur: 'ADM001',
    solde: 1000000,
    role: 'admin',
    position: null,
    niveau: 1,
    isActive: true,
    createdAt: new Date(),
  },
  {
    id: '2',
    email: 'user1@moissonneurs.com',
    nom: 'Dupont',
    prenom: 'Jean',
    codeMoissonneur: 'MSH001',
    solde: 50000,
    role: 'utilisateur',
    parrainId: '1',
    position: 'gauche',
    niveau: 2,
    isActive: true,
    createdAt: new Date(),
  },
];

const mockPacks: Pack[] = [
  {
    id: '1',
    nom: 'Pack Découverte',
    description: 'Pack d\'entrée pour commencer l\'aventure MLM',
    prix: 50000,
    image: '/packs/decouverte.jpg',
    images: ['/packs/decouverte-1.jpg', '/packs/decouverte-2.jpg'],
    isMLM: true,
    bonusDirect: 5000,
    bonusEquipe: 2000,
    pointsEquipe: 100,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: '2',
    nom: 'Pack Business',
    description: 'Pack intermédiaire pour développer votre réseau',
    prix: 100000,
    image: '/packs/business.jpg',
    images: ['/packs/business-1.jpg', '/packs/business-2.jpg'],
    isMLM: true,
    bonusDirect: 15000,
    bonusEquipe: 5000,
    pointsEquipe: 250,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: '3',
    nom: 'Pack Premium',
    description: 'Pack ultime pour les leaders',
    prix: 250000,
    image: '/packs/premium.jpg',
    images: ['/packs/premium-1.jpg', '/packs/premium-2.jpg'],
    isMLM: true,
    bonusDirect: 50000,
    bonusEquipe: 15000,
    pointsEquipe: 750,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

const mockWalletSettings: WalletSettings = {
  id: '1',
  fraisRetraitPourcentage: 2,
  fraisRetraitFixe: 500,
  fraisTransfertPourcentage: 1,
  fraisTransfertFixe: 200,
  montantMinRetrait: 5000,
  montantMinTransfert: 1000,
  montantMaxRetraitJour: 500000,
  updatedAt: new Date(),
};

export const useMLMStore = create<MLMState>((set, get) => ({
  // État initial
  currentUser: null,
  isAuthenticated: false,
  users: mockUsers,
  transactions: [],
  packs: mockPacks,
  commandes: [],
  notifications: [],
  bonusConfigs: [],
  walletSettings: mockWalletSettings,
  paymentMethods: [],
  stands: [],
  careerProfiles: [],
  binaryStats: null,

  // Authentication
  login: async (email: string, password: string) => {
    const user = get().users.find(u => u.email === email);
    if (user) {
      set({ currentUser: user, isAuthenticated: true });
      return true;
    }
    return false;
  },

  logout: () => {
    set({ currentUser: null, isAuthenticated: false });
  },

  register: async (userData: Partial<User>) => {
    const newUser: User = {
      id: String(Date.now()),
      email: userData.email || '',
      nom: userData.nom || '',
      prenom: userData.prenom || '',
      codeMoissonneur: `MSH${String(Date.now()).slice(-6)}`,
      solde: 0,
      role: 'utilisateur',
      position: userData.position || null,
      niveau: 1,
      isActive: true,
      createdAt: new Date(),
      ...userData,
    } as User;

    set(state => ({ users: [...state.users, newUser] }));
    return true;
  },

  // Utilisateur
  setCurrentUser: (user) => set({ currentUser: user }),

  updateUserRole: (userId, role) => {
    set(state => ({
      users: state.users.map(u => 
        u.id === userId ? { ...u, role } : u
      ),
    }));
  },

  creditWallet: (userId, amount, description) => {
    set(state => {
      const user = state.users.find(u => u.id === userId);
      if (!user) return state;

      const transaction: Transaction = {
        id: String(Date.now()),
        userId,
        type: 'bonus_admin',
        montant: amount,
        frais: 0,
        net: amount,
        statut: 'completed',
        description,
        createdAt: new Date(),
        processedAt: new Date(),
      };

      return {
        users: state.users.map(u =>
          u.id === userId ? { ...u, solde: u.solde + amount } : u
        ),
        transactions: [...state.transactions, transaction],
      };
    });
  },

  debitWallet: (userId, amount, description) => {
    set(state => {
      const user = state.users.find(u => u.id === userId);
      if (!user || user.solde < amount) return state;

      const transaction: Transaction = {
        id: String(Date.now()),
        userId,
        type: 'frais_service',
        montant: amount,
        frais: 0,
        net: -amount,
        statut: 'completed',
        description,
        createdAt: new Date(),
        processedAt: new Date(),
      };

      return {
        users: state.users.map(u =>
          u.id === userId ? { ...u, solde: u.solde - amount } : u
        ),
        transactions: [...state.transactions, transaction],
      };
    });
  },

  // Transactions
  addTransaction: (transactionData) => {
    const transaction: Transaction = {
      id: String(Date.now()),
      userId: transactionData.userId || '',
      type: transactionData.type || 'depot',
      montant: transactionData.montant || 0,
      frais: transactionData.frais || 0,
      net: transactionData.net || 0,
      statut: transactionData.statut || 'pending',
      description: transactionData.description || '',
      createdAt: new Date(),
      ...transactionData,
    };

    set(state => ({ transactions: [...state.transactions, transaction] }));
  },

  updateTransactionStatus: (transactionId, status) => {
    set(state => ({
      transactions: state.transactions.map(t =>
        t.id === transactionId 
          ? { ...t, statut: status, processedAt: status === 'completed' ? new Date() : t.processedAt }
          : t
      ),
    }));
  },

  getTransactionsByUser: (userId) => {
    return get().transactions.filter(t => t.userId === userId);
  },

  getAllTransactions: () => {
    return get().transactions;
  },

  // Packs
  addPack: (packData) => {
    const pack: Pack = {
      id: String(Date.now()),
      nom: packData.nom || '',
      description: packData.description || '',
      prix: packData.prix || 0,
      image: packData.image || '',
      images: packData.images || [],
      isMLM: packData.isMLM ?? true,
      bonusDirect: packData.bonusDirect || 0,
      bonusEquipe: packData.bonusEquipe || 0,
      pointsEquipe: packData.pointsEquipe || 0,
      isActive: packData.isActive ?? true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    set(state => ({ packs: [...state.packs, pack] }));
  },

  updatePack: (packId, updates) => {
    set(state => ({
      packs: state.packs.map(p =>
        p.id === packId ? { ...p, ...updates, updatedAt: new Date() } : p
      ),
    }));
  },

  deletePack: (packId) => {
    set(state => ({
      packs: state.packs.filter(p => p.id !== packId),
    }));
  },

  purchasePack: (userId, packId) => {
    const state = get();
    const user = state.users.find(u => u.id === userId);
    const pack = state.packs.find(p => p.id === packId);

    if (!user || !pack || user.solde < pack.prix) return;

    const transaction: Transaction = {
      id: String(Date.now()),
      userId,
      type: 'achat_pack',
      montant: pack.prix,
      frais: 0,
      net: -pack.prix,
      statut: 'completed',
      description: `Achat du pack ${pack.nom}`,
      packId,
      createdAt: new Date(),
      processedAt: new Date(),
    };

    // Calculer et distribuer les commissions
    if (pack.isMLM && user.parrainId) {
      const parrain = state.users.find(u => u.id === user.parrainId);
      if (parrain) {
        const commissionDirecte = pack.bonusDirect;
        
        // Créditer le parrain
        set(state => ({
          users: state.users.map(u =>
            u.id === parrain!.id ? { ...u, solde: u.solde + commissionDirecte } : u
          ),
        }));

        // Transaction pour le parrain
        const commissionTransaction: Transaction = {
          id: String(Date.now()) + '_comm',
          userId: parrain.id,
          type: 'commission_directe',
          montant: commissionDirecte,
          frais: 0,
          net: commissionDirecte,
          statut: 'completed',
          description: `Commission directe - Parrainage de ${user.nom} ${user.prenom}`,
          commissionType: 'direct',
          createdAt: new Date(),
          processedAt: new Date(),
        };

        set(state => ({
          transactions: [...state.transactions, commissionTransaction],
        }));
      }
    }

    set(state => ({
      users: state.users.map(u =>
        u.id === userId ? { ...u, solde: u.solde - pack.prix } : u
      ),
      transactions: [...state.transactions, transaction],
    }));
  },

  // Commandes
  addCommande: (commandeData) => {
    const commande: Commande = {
      id: String(Date.now()),
      userId: commandeData.userId || '',
      items: commandeData.items || [],
      total: commandeData.total || 0,
      statut: commandeData.statut || 'pending',
      adresseLivraison: commandeData.adresseLivraison || '',
      noteService: commandeData.noteService,
      noteLivraison: commandeData.noteLivraison,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    set(state => ({ commandes: [...state.commandes, commande] }));
  },

  updateCommande: (commandeId, updates) => {
    set(state => ({
      commandes: state.commandes.map(c =>
        c.id === commandeId ? { ...c, ...updates, updatedAt: new Date() } : c
      ),
    }));
  },

  getCommandesByUser: (userId) => {
    return get().commandes.filter(c => c.userId === userId);
  },

  // MLM
  calculateBinaryBonus: (userId) => {
    // Logique de calcul des bonus binaires
    console.log('Calcul des bonus binaires pour:', userId);
  },

  distributeCommission: (userId, amount, type) => {
    const transaction: Transaction = {
      id: String(Date.now()),
      userId,
      type: type,
      montant: amount,
      frais: 0,
      net: amount,
      statut: 'completed',
      description: `Commission ${type}`,
      commissionType: type,
      createdAt: new Date(),
      processedAt: new Date(),
    };

    set(state => ({
      users: state.users.map(u =>
        u.id === userId ? { ...u, solde: u.solde + amount } : u
      ),
      transactions: [...state.transactions, transaction],
    }));
  },

  updateBonusConfig: (configId, updates) => {
    set(state => ({
      bonusConfigs: state.bonusConfigs.map(c =>
        c.id === configId ? { ...c, ...updates, updatedAt: new Date() } : c
      ),
    }));
  },

  updateWalletSettings: (settings) => {
    set(state => ({
      walletSettings: { ...state.walletSettings, ...settings, updatedAt: new Date() },
    }));
  },

  // Notifications
  addNotification: (notificationData) => {
    const notification: Notification = {
      id: String(Date.now()),
      userId: notificationData.userId || '',
      title: notificationData.title || '',
      message: notificationData.message || '',
      type: notificationData.type || 'info',
      isRead: false,
      createdAt: new Date(),
    };

    set(state => ({ notifications: [...state.notifications, notification] }));
  },

  markNotificationAsRead: (notificationId) => {
    set(state => ({
      notifications: state.notifications.map(n =>
        n.id === notificationId ? { ...n, isRead: true } : n
      ),
    }));
  },

  // Transfert d'argent
  transferMoney: async (senderId, recipientEmailOrCode, amount) => {
    const state = get();
    const sender = state.users.find(u => u.id === senderId);
    const settings = state.walletSettings;

    if (!sender || sender.solde < amount) return false;

    // Trouver le destinataire par email ou code Moissonneur
    const recipient = state.users.find(
      u => u.email === recipientEmailOrCode || u.codeMoissonneur === recipientEmailOrCode
    );

    if (!recipient) return false;

    // Calculer les frais
    const frais = (amount * settings.fraisTransfertPourcentage / 100) + settings.fraisTransfertFixe;
    const totalDebit = amount + frais;

    if (sender.solde < totalDebit) return false;

    // Débiter l'expéditeur
    set(state => ({
      users: state.users.map(u =>
        u.id === senderId ? { ...u, solde: u.solde - totalDebit } : u
      ),
    }));

    // Créditer le destinataire
    set(state => ({
      users: state.users.map(u =>
        u.id === recipient!.id ? { ...u, solde: u.solde + amount } : u
      ),
    }));

    // Créer les transactions
    const senderTransaction: Transaction = {
      id: String(Date.now()),
      userId: senderId,
      type: 'transfert',
      montant: amount,
      frais,
      net: -totalDebit,
      statut: 'completed',
      description: `Transfert vers ${recipient.nom} ${recipient.prenom}`,
      beneficaireId: recipient.id,
      createdAt: new Date(),
      processedAt: new Date(),
    };

    const recipientTransaction: Transaction = {
      id: String(Date.now()) + '_rec',
      userId: recipient.id,
      type: 'transfert',
      montant: amount,
      frais: 0,
      net: amount,
      statut: 'completed',
      description: `Reçu de ${sender.nom} ${sender.prenom}`,
      beneficaireId: senderId,
      createdAt: new Date(),
      processedAt: new Date(),
    };

    set(state => ({
      transactions: [...state.transactions, senderTransaction, recipientTransaction],
    }));

    return true;
  },

  // Formattage
  formatAmount: (amount) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XAF',
      minimumFractionDigits: 0,
    }).format(amount);
  },
}));
