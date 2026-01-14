# 📹 Guide : Page de Démo Live Streaming

**Date :** 14 janvier 2026
**Projet :** La Boutique de Morgane (qcqbtmvbvipsxwjlgjvk)
**URL de démo :** `/admin/live-test`

---

## 🎯 Objectif

Cette page de démo permet de tester l'intégralité du système de Live Streaming avec :
- **Capture webcam en temps réel**
- **3 utilisateurs simulés** (Sophie M., Julie B., Emma L.)
- **Chat automatique** avec messages aléatoires
- **Ajout de produits en direct**
- **Statistiques en temps réel** (émotions, viewers, progression)
- **Interface complète** identique au live réel

---

## 🔐 Accès

**URL :** `https://laboutiquedemorgane.com/admin/live-test`

**Restriction :**
- ✅ Accessible uniquement aux **administrateurs**
- ❌ Redirection automatique pour les utilisateurs non-admin
- 🔒 Vérification via `profile.is_admin`

---

## 🎬 Fonctionnalités

### 1. **Capture Webcam en Direct**

**Bouton :** "Démarrer le Live" / "Arrêter le Live"

**Actions :**
- ✅ Demande l'autorisation d'accès à la webcam
- ✅ Capture vidéo 1280x720 en qualité HD
- ✅ Affichage en temps réel dans le player
- ✅ Badge "EN DIRECT" animé quand actif
- ✅ Arrêt propre de tous les flux au clic

**Permissions navigateur nécessaires :**
- 📷 Caméra : Obligatoire
- 🎤 Microphone : Activé (mais muté dans la prévisualisation)

---

### 2. **Chat Automatique Simulé**

**Bouton :** "Activer Chat Auto" / "Stopper Chat Auto"

**Fonctionnement :**
- 🤖 **Messages aléatoires** toutes les 3-7 secondes
- 👥 **3 faux utilisateurs** prédéfinis :
  - Sophie M. 👩 (rose)
  - Julie B. 👩‍🦱 (bleu)
  - Emma L. 👱‍♀️ (violet)
- 💬 **10 messages types** :
  - "Trop beau ce modèle ! 😍"
  - "C'est dispo en quelle taille ?"
  - "Le prix svp ?"
  - "Zoom sur la matière ?"
  - "J'adore cette couleur !"
  - "Tu portes du combien ?"
  - "Livraison rapide ?"
  - "C'est doux au toucher ?"
  - "Parfait pour l'été ça !"
  - "Je le veux ! 💕"

**Effets secondaires :**
- ❤️ Augmentation aléatoire des émotions (coeurs, likes, sparkles)
- 📊 Simulation d'engagement réaliste

---

### 3. **Ajout de Produits en Live**

**Bouton :** "Ajouter Produit"

**Processus :**
1. Modal s'ouvre avec **tous les produits publiés** (max 20)
2. Clic sur un produit → Ajout instantané au live
3. Toast de confirmation
4. **Réactions automatiques** :
   - Message de Sophie : "Oh j'adore ce modèle ! 😍"
   - +3 coeurs dans les émotions

**Affichage produit :**
- ✅ Image du produit
- ✅ Nom (max 2 lignes)
- ✅ Prix (sale_price ou regular_price)
- ✅ Badge "Ajouté il y a Xs"
- ✅ Grille 2 colonnes responsive

---

### 4. **Simulation de Viewers**

**Bouton :** "+ Viewer"

**Actions :**
- ➕ Augmente le compteur de viewers de +1
- 📈 Augmente la barre de progression de +2%
- 🎉 Toast "Un nouveau viewer a rejoint !"

**Objectif :**
- 🎯 Barre de progression 0-100%
- 🏆 But : 100 viewers
- 📊 Affichage : "X/100 viewers"

---

### 5. **Émotions en Temps Réel**

**3 types d'émotions :**

| Émotion | Icône | Couleur | Bouton |
|---------|-------|---------|--------|
| Coeurs | ❤️ | Rouge | En bas du chat |
| Likes | 👍 | Bleu | En bas du chat |
| Sparkles | ✨ | Jaune | En bas du chat |

**Compteurs :**
- ✅ Affichés dans des cards séparées
- ✅ Mis à jour en temps réel
- ✅ Incrémentation manuelle (boutons) ou automatique (chat auto)

---

### 6. **Chat Manuel (Vous = Morgane)**

**Fonctionnalité :**
- ✍️ Saisir un message dans l'input
- ↩️ Appuyer sur Entrée ou cliquer sur Envoyer
- 👑 Apparaît avec l'avatar "👑" et le nom "Morgane (Vous)"
- 🎨 Couleur dorée (#D4AF37)

**Affichage :**
- Avatar + Nom coloré
- Timestamp (HH:MM)
- Message complet
- Scroll automatique vers le bas

---

## 🎨 Interface

### Layout Principal

```
┌─────────────────────────────────────────────────────────────┐
│ 📹 Démo Live Streaming - Mode Test       [🔴 EN DIRECT]    │
├─────────────────────────────────────────────────────────────┤
│ [Démarrer Live] [Activer Chat] [+ Viewer] [+ Produit]      │
├────────────────────────────────┬────────────────────────────┤
│                                │  👥 Viewers (3)            │
│  🎥 WEBCAM (Aspect 16:9)       │  - Sophie M. 👩           │
│                                │  - Julie B. 👩‍🦱          │
│  [🔴 EN DIRECT] [👁️ 3 viewers] │  - Emma L. 👱‍♀️           │
│                                ├────────────────────────────┤
│  ━━━━━━━━━━━━━━━ 50%          │  💬 Chat en Direct         │
│  Objectif: 3/100 viewers       │                            │
│                                │  Messages simulés...       │
├────────────────────────────────┤                            │
│ ❤️ 12  👍 8  ✨ 15             │  [❤️] [👍] [✨]            │
├────────────────────────────────┤  [Envoyer un message...] → │
│ 🛍️ Produits Partagés (2)      │                            │
│  [Produit 1] [Produit 2]       │                            │
└────────────────────────────────┴────────────────────────────┘
```

### Responsive

**Desktop (> 1024px) :**
- Layout 2 colonnes (66% / 33%)
- Vidéo + Stats à gauche
- Chat + Viewers à droite

**Mobile (< 1024px) :**
- Layout 1 colonne empilée
- Vidéo en haut
- Chat en bas

---

## 🚀 Utilisation Recommandée

### Scénario 1 : Test Complet

1. **Ouvrir** `/admin/live-test`
2. **Autoriser** l'accès à la webcam (popup navigateur)
3. **Cliquer** "Démarrer le Live" → Webcam s'active
4. **Activer** "Chat Auto" → Messages automatiques démarrent
5. **Cliquer** "+ Viewer" plusieurs fois → Progression augmente
6. **Ajouter** des produits → Modal produits, sélectionner, voir les réactions
7. **Envoyer** des messages manuels → Tester le chat en tant que Morgane
8. **Observer** les émotions augmenter automatiquement

---

### Scénario 2 : Démo Cliente

1. **Positionner** la webcam face à un produit réel
2. **Démarrer** le live
3. **Activer** le chat auto pour simuler l'engagement
4. **Ajouter** le produit montré au live
5. **Montrer** les réactions en direct (coeurs, likes)
6. **Répondre** aux "questions" du chat en tant que Morgane
7. **Simuler** l'arrivée de nouveaux viewers

**But :** Démontrer comment se passe un live shopping réel

---

### Scénario 3 : Test Technique

**Tester :**
- ✅ Qualité vidéo webcam
- ✅ Fluidité du chat en temps réel
- ✅ Ajout/retrait de produits
- ✅ Réactivité des émotions
- ✅ Performance avec 50+ messages
- ✅ Scroll automatique du chat
- ✅ Responsive mobile/desktop

---

## 🛠️ Détails Techniques

### Capture Webcam

```typescript
navigator.mediaDevices.getUserMedia({
  video: {
    width: { ideal: 1280 },
    height: { ideal: 720 },
    facingMode: 'user'
  },
  audio: true
})
```

**Résolution :**
- Idéale : 1280x720 (720p)
- Fallback automatique si non supporté
- Ratio : 16:9 (aspect-video)

**Audio :**
- Capturé mais **muté** dans la prévisualisation
- Évite l'effet Larsen (feedback audio)

---

### Simulation Chat

**Timing :**
```typescript
setInterval(() => {
  // Message aléatoire
}, 3000 + Math.random() * 4000)
// Entre 3 et 7 secondes
```

**Utilisateurs :**
```typescript
const FAKE_USERS = [
  { id: '1', name: 'Sophie M.', avatar: '👩', color: '#FF6B9D' },
  { id: '2', name: 'Julie B.', avatar: '👩‍🦱', color: '#4A90E2' },
  { id: '3', name: 'Emma L.', avatar: '👱‍♀️', color: '#9B59B6' },
];
```

---

### État Local (useState)

```typescript
const [isStreaming, setIsStreaming] = useState(false);
const [stream, setStream] = useState<MediaStream | null>(null);
const [messages, setMessages] = useState<ChatMessage[]>([]);
const [products, setProducts] = useState<LiveProduct[]>([]);
const [viewerCount, setViewerCount] = useState(3);
const [emotions, setEmotions] = useState({ hearts: 0, likes: 0, sparkles: 0 });
const [goalProgress, setGoalProgress] = useState(0);
const [autoChat, setAutoChat] = useState(false);
```

**Aucune donnée envoyée à Supabase** → Tout en mémoire locale

---

## 🎯 Différences avec le Live Réel

| Fonctionnalité | Démo | Live Réel |
|----------------|------|-----------|
| **Viewers** | Simulés (3 fixes) | Vrais utilisateurs Supabase |
| **Chat** | Messages automatiques | Messages réels en temps réel |
| **Vidéo** | Webcam locale | Stream YouTube/Twitch |
| **Produits** | Sélection manuelle | API Supabase live_shared_products |
| **Émotions** | Compteurs locaux | Supabase live_reactions |
| **Persistance** | Aucune (mémoire) | Base de données complète |

---

## 🐛 Troubleshooting

### ❌ Webcam ne s'active pas

**Causes possibles :**
1. Permission refusée dans le navigateur
2. Webcam déjà utilisée par une autre app
3. Navigateur non compatible (vieux Edge, Safari iOS)

**Solutions :**
- Vérifier les permissions Chrome : `chrome://settings/content/camera`
- Fermer Zoom, Teams, etc.
- Utiliser Chrome/Firefox récent

---

### ❌ "Accès réservé aux administrateurs"

**Cause :** Vous n'êtes pas connecté en tant qu'admin

**Solution :**
1. Se connecter avec un compte admin (`is_admin = true`)
2. Vérifier dans Supabase : `profiles.is_admin`

---

### ❌ Aucun produit dans le sélecteur

**Cause :** Aucun produit avec `status = 'published'`

**Solution :**
- Publier au moins 1 produit dans `/admin/products`
- Vérifier le statut dans la base de données

---

### ❌ Chat ne scroll pas automatiquement

**Cause :** Ref non initialisée

**Solution :**
- Attendre que les messages s'affichent
- Forcer le scroll en cliquant dans le chat

---

## 📊 Métriques de Test

**Objectifs de performance :**

| Métrique | Objectif | Critique |
|----------|----------|----------|
| **Latence webcam** | < 100ms | ✅ |
| **FPS vidéo** | ≥ 30fps | ✅ |
| **Délai chat** | < 1s | ✅ |
| **Mémoire** | < 500MB | ⚠️ |
| **Scroll fluide** | 60fps | ✅ |

**Test avec :**
- Chrome DevTools > Performance
- Task Manager (Mémoire)
- Network tab (Vérifier aucune requête inutile)

---

## 🚀 Améliorations Futures (Optionnel)

### 1. **Enregistrement du Live**
```typescript
const mediaRecorder = new MediaRecorder(stream);
// Enregistrer et télécharger la vidéo
```

### 2. **Partage d'Écran**
```typescript
navigator.mediaDevices.getDisplayMedia({ video: true })
// Capturer l'écran au lieu de la webcam
```

### 3. **Filtres Vidéo**
```typescript
// Canvas + IA pour ajouter des effets
ctx.drawImage(video, 0, 0);
// Appliquer filtres beauté, etc.
```

### 4. **Statistiques Avancées**
- Graphique temps réel (Chart.js)
- Historique des émotions
- Top 5 messages

### 5. **Export Rapport**
- Résumé de session (durée, viewers max, produits montrés)
- Export CSV/PDF

---

## ✅ Checklist de Validation

**Avant démo cliente :**

- [ ] Webcam testée et fonctionnelle
- [ ] Qualité vidéo 720p minimum
- [ ] Au moins 5 produits publiés disponibles
- [ ] Chat auto activé et fluide
- [ ] Émotions réactives
- [ ] Layout responsive vérifié (mobile + desktop)
- [ ] Permissions navigateur autorisées
- [ ] Aucun bug dans la console
- [ ] Performance fluide (pas de lag)
- [ ] Scroll chat automatique fonctionnel

---

## 📝 Notes Finales

**Cette page est une simulation complète** du système de Live Streaming sans nécessiter :
- ❌ Création de live dans la base de données
- ❌ Vrais utilisateurs connectés
- ❌ Configuration YouTube/Twitch
- ❌ Serveur de streaming externe

**Idéal pour :**
- ✅ Démonstrations clients
- ✅ Tests fonctionnels
- ✅ Formation équipe
- ✅ Validation UX
- ✅ Développement en local

**Accès direct :** `https://laboutiquedemorgane.com/admin/live-test`

---

## 🔐 Sécurité

**Restrictions :**
- ✅ Accessible uniquement aux admins (`profile.is_admin`)
- ✅ Aucune donnée persistée (tout en local)
- ✅ Aucune requête API sensible
- ✅ Pas d'upload de fichiers
- ✅ Isolation complète du live réel

**Projet verrouillé :** qcqbtmvbvipsxwjlgjvk ✅
**Build réussi :** Sans erreurs ✅
