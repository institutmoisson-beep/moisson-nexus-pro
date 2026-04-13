# 🌾 Système MLM Les Moissonneurs - Documentation Complète

## Vue d'ensemble

Système MLM (Multi-Level Marketing) binaire de dernière génération pour "Les Moissonneurs", une plateforme communautaire avec arbre généalogique gauche/droite, gestion de rôles, transactions financières, et cellule de solidarité.

---

## 🎯 Fonctionnalités Principales Implémentées

### 1. **Gestion des Rôles et Tableaux de Bord**

#### Rôles disponibles :
- **Admin** : Gestion complète du système
- **Financier** : Transactions et finances
- **Gestion Packs** : Packs MLM et produits
- **Gestion Stand** : Stands entreprise et secteurs
- **Informaticien** : Support technique
- **Commercial** : Suivi commercial
- **Communication** : Marketing et annonces
- **Utilisateur** : Membre du réseau

#### Tableau de bord par rôle :
Chaque utilisateur voit automatiquement son tableau de bord personnalisé avec :
- Métriques spécifiques au rôle
- Actions rapides autorisées
- Permissions détaillées (lecture, écriture, suppression, approbation)
- Bouton d'accès à l'espace complet du rôle

---

### 2. **Système MLM Binaire**

#### Arbre généalogique :
- Branche **gauche** et branche **droite**
- Positionnement automatique des nouveaux membres
- Calcul du volume par branche
- Détection de la branche faible/forte

#### Commissions automatiques :
- **Commission directe** : Quand un filleul achète un pack
- **Bonus binaire** : Basé sur le volume des branches
- **Bonus d'équipe** : Niveaux 1, 2, 3
- **Global Pool** : Partage des bénéfices

---

### 3. **Gestion des Packs**

#### Types de packs :
- **Pack MLM** : Active le système de commissions
- **Produit ordinaire** : Achat simple sans MLM

#### Fonctionnalités :
- ✅ Admin peut créer/modifier/supprimer des packs
- ✅ Checkbox "Est-ce un pack MLM ?"
- ✅ Images multiples avec zoom (clic pour voir en grand)
- ✅ Optimisation des images téléchargées
- ✅ Bonus configurables par pack
- ✅ Historique d'achat visible (utilisateur + admin)

---

### 4. **Transactions et Portefeuille**

#### Types de transactions :
- Dépôt
- Retrait
- Transfert entre utilisateurs
- Achat de pack
- Achat de produit
- Commission directe
- Commission équipe
- Bonus MLM
- Bonus admin
- Frais de service

#### Fonctionnalités :
- ✅ **Toutes les transactions sont visibles** dans l'historique
- ✅ Utilisateur voit ses transactions
- ✅ Admin voit toutes les transactions
- ✅ Commissions apparaissent dans l'historique
- ✅ Créditer/Débiter portefeuille par admin
- ✅ Frais de retrait et transfert configurables

---

### 5. **Transfert d'argent**

#### Méthodes de transfert :
- Par **email** du destinataire
- Par **Code Moissonneur**

#### Caractéristiques :
- ✅ Frais configurables par l'admin (% + fixe)
- ✅ Transaction visible pour l'expéditeur
- ✅ Transaction visible pour le bénéficiaire
- ✅ Copier/coller email ou code
- ✅ Liens cliquables pour paiement mobile money

---

### 6. **Moyens de Paiement**

#### Problème résolu :
❌ Avant : Seul l'admin voyait les liens  
✅ Maintenant : L'utilisateur voit et clique sur les liens

#### Fonctionnalités :
- Lien de paiement **cliquable** pour l'utilisateur
- Adresse/contact/email **copiable**
- Instructions claires avant insertion ID transaction
- Mobile Money (MTN, Orange)
- Bank Transfer
- Crypto

---

### 7. **Commandes**

#### Page de commande utilisateur :
- ✅ Voir toutes ses commandes
- ✅ Noter le service reçu
- ✅ Noter la livraison
- ✅ Statut de la commande

#### Administration :
- ✅ Voir toutes les commandes en cours
- ✅ Voir les notes des utilisateurs
- ✅ Gérer les statuts

---

### 8. **Cellule de Solidarité**

Page d'accueil avec notification :
> "🤝 Cellule de Solidarité - Tu as perdu toute famille ? Les Moissonneurs sont ta famille. Retrouve la solidarité et l'entraide face aux difficultés de la vie."

---

### 9. **Installation PWA Automatique**

- ✅ Détection automatique si PWA non installée
- ✅ Prompt d'installation automatique sur mobile
- ✅ Fonctionnement offline partiel

---

### 10. **Configuration Admin**

#### L'administrateur peut modifier :
- ✅ Noms des profils de carrière
- ✅ Montants des bonus (pourcentages et fixes)
- ✅ Frais de retrait (% + fixe)
- ✅ Frais de transfert (% + fixe)
- ✅ Packs (nom, prix, image, bonus)
- ✅ Stands entreprise et secteurs
- ✅ Moyens de paiement
- ✅ Rôles des utilisateurs

---

## 📁 Architecture du Code

### Fichiers Créés

```
src/
├── types/
│   └── mlm.ts              # Types TypeScript & configuration des rôles
├── lib/
│   └── store.ts            # Store Zustand (état global)
├── components/
│   └── dashboard/
│       └── RoleDashboardSelector.tsx  # Sélecteur de rôle
└── pages/
    └── Dashboard.tsx       # Tableau de bord utilisateur
```

---

## 🔧 Technologies Utilisées

- **Frontend** : React 18 + TypeScript + Vite
- **State Management** : Zustand
- **UI Components** : shadcn/ui + TailwindCSS
- **Icons** : Lucide React
- **Notifications** : react-hot-toast
- **Routing** : React Router DOM

---

## 🚀 Comment Tester

### 1. Installation des dépendances
```bash
cd /workspace
npm install
```

### 2. Lancer le serveur de développement
```bash
npm run dev
```

### 3. Connexion
- Email : `admin@moissonneurs.com`
- Mot de passe : (n'importe lequel pour la démo)

---

## 📊 Flux de Données

### Achat d'un Pack MLM
```
1. Utilisateur clique "Acheter" sur un pack
2. Vérification du solde
3. Débit du portefeuille utilisateur
4. Création transaction "achat_pack"
5. Si pack MLM ET parrain existe :
   → Calcul commission directe
   → Crédit portefeuille parrain
   → Création transaction "commission_directe"
6. Transaction visible dans historique (user + admin)
```

### Transfert d'argent
```
1. Utilisateur remplit formulaire (email/code + montant)
2. Calcul des frais selon config admin
3. Débit expéditeur (montant + frais)
4. Crédit destinataire (montant net)
5. Création 2 transactions :
   → Une pour l'expéditeur
   → Une pour le bénéficiaire
6. Visible dans les 2 historiques
```

### Distribution des Commissions
```
1. Admin configure les bonus dans le dashboard
2. Système détecte les événements éligibles :
   → Nouvel achat de pack
   → Nouveau membre dans le réseau
3. Calcul automatique selon configuration
4. Crédit des portefeuilles
5. Transactions créées automatiquement
```

---

## 🎨 Design & UX

### Couleurs par rôle :
- Admin : Rouge
- Financier : Vert
- Gestion Packs : Bleu
- Gestion Stand : Violet
- Informaticien : Gris
- Commercial : Orange
- Communication : Rose
- Utilisateur : Indigo

### Composants Clés :
- Cartes métriques animées
- Tableaux responsive
- Modals pour images
- Notifications toast
- Navigation par onglets

---

## 🔐 Sécurité & Permissions

### Système de permissions :
Chaque rôle a des permissions par module :
- **Read** : Voir les données
- **Write** : Modifier les données
- **Delete** : Supprimer les données
- **Approve** : Approuver les transactions

### Exemple :
```typescript
financier: {
  transactions: { read: true, write: true, delete: false, approve: true },
  users: { read: true, write: false, delete: false, approve: false },
}
```

---

## 📱 Responsive & Mobile

- ✅ Design mobile-first
- ✅ Navigation tactile
- ✅ Images optimisées
- ✅ PWA installable
- ✅ Offline partiel

---

## 🔄 Prochaines Étapes (Recommandées)

1. **Backend** : Connecter à Supabase/Firebase
2. **Authentification** : JWT + refresh tokens
3. **Paiements réels** : API MTN/Orange Money
4. **Emails** : Notifications par email
5. **PDF** : Génération de reçus
6. **Analytics** : Tableaux de bord avancés
7. **Tests** : Tests unitaires et E2E

---

## 📞 Support

Pour toute question ou amélioration, contacter l'équipe de développement.

**Les Moissonneurs** - Ensemble, moissonnons l'avenir ! 🌾
