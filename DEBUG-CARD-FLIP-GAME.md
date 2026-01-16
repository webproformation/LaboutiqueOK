# 🎮 Guide de Débogage - Jeu Card Flip

## ✅ Corrections Appliquées

### 1. **Bug du useEffect** (CRITIQUE)
**Avant :** Le jeu ne se chargeait QUE si l'utilisateur était connecté
```typescript
useEffect(() => {
  if (user) {
    loadActiveGames();
  }
}, [user]);
```

**Après :** Le jeu se charge pour tout le monde
```typescript
useEffect(() => {
  loadActiveGames();
}, [user]);
```

### 2. **Bug de la condition d'affichage** (CRITIQUE)
**Avant :** Le jeu ne s'affichait pas aux visiteurs non-connectés
```typescript
} else if (cardFlipData && (!hasSeenToday || hasSeenToday !== today) && user) {
```

**Après :** Le jeu s'affiche à tous, avec prompt de connexion au clic
```typescript
} else if (cardFlipData && (!hasSeenToday || hasSeenToday !== today)) {
  if (!user) {
    // Affiche quand même, demandera connexion au clic
    setCardFlipGame(cardFlipData);
  }
}
```

### 3. **Logs de débogage complets**
Ajout de logs détaillés pour diagnostiquer rapidement :
- 🎮 Chargement des jeux
- 🃏 Jeu Card Flip trouvé/non trouvé
- ✅ Vérification des parties jouées
- ❌ Raisons du non-affichage
- 📅 État du sessionStorage

### 4. **Fonctions de débogage console**
Ajout de 2 fonctions globales accessibles dans la console :

```javascript
// Réinitialiser et recharger les jeux
window.resetGamePopup()

// Forcer l'affichage du jeu (bypass toutes les conditions)
window.forceShowCardFlip()
```

## 🧪 Test Immédiat

### 1. Ouvrir la console du navigateur (F12)

### 2. Recharger la page d'accueil

### 3. Observer les logs :

```
🎮 [GamePopupManager] Loading active games... { now, user }
🃏 Card flip game found: { id, name, ... }
📅 Session check: { hasSeenToday, today, shouldShow }
🃏 Card flip game active, checking if user can play...
✅ User play check: { plays, max, canPlay }
```

### 4. Si le jeu ne s'affiche pas :

**4.1. Vérifier le sessionStorage**
```javascript
sessionStorage.getItem('game-popup-seen-today')
// Si la valeur === date du jour → Le jeu a déjà été affiché
```

**4.2. Réinitialiser manuellement**
```javascript
window.resetGamePopup()
// ou
sessionStorage.removeItem('game-popup-seen-today')
location.reload()
```

**4.3. Forcer l'affichage (debug)**
```javascript
window.forceShowCardFlip()
```

## 📊 Données Vérifiées en Base

```
ID: 0915fb06-433e-4828-bc98-3f189cbb4d93
Name: Jeu de cartes d'accueil
Is Active: true
Start Date: 2026-01-13 (Aujourd'hui)
End Date: 2026-03-31
Max Plays: 1000
Coupon ID: d89ac14e-f840-421d-86b6-bc9108b42ad1
```

**Script de test backend :**
```bash
node scripts/test-card-flip-game.js
```

## 🐛 Problèmes Potentiels Restants

### A. Le jeu ne s'affiche toujours pas
**Cause probable :** sessionStorage bloqué

**Solution :**
1. Ouvrir DevTools → Application → Storage → Session Storage
2. Supprimer la clé `game-popup-seen-today`
3. Recharger la page

### B. Le jeu s'affiche mais disparaît immédiatement
**Cause probable :** L'utilisateur a déjà joué le max de fois

**Solution :**
```sql
-- Réinitialiser les parties d'un utilisateur
DELETE FROM card_flip_game_plays
WHERE user_id = 'USER_ID_ICI'
AND game_id = '0915fb06-433e-4828-bc98-3f189cbb4d93';
```

### C. Erreur "Vous devez être connecté"
**Normal !** C'est le comportement attendu pour les visiteurs non connectés.

Le jeu s'affiche, mais au clic sur une carte :
- Si non connecté → Message "Vous devez être connecté pour jouer"
- Si connecté → Le jeu fonctionne normalement

## 📝 Logs à Surveiller

### Logs Positifs ✅
```
🎮 [GamePopupManager] Loading active games...
🃏 Card flip game found: { ... }
✅ User play check: { canPlay: true }
```

### Logs Négatifs ❌
```
❌ No card flip game found in database
❌ User has already played max times
⏩ Game popup already shown today, skipping
```

## 🔍 Diagnostic Complet

Exécutez dans la console :
```javascript
console.log({
  sessionStorage: sessionStorage.getItem('game-popup-seen-today'),
  today: new Date().toDateString(),
  willReset: sessionStorage.getItem('game-popup-seen-today') !== new Date().toDateString()
});
```

## 📞 Commandes Utiles

```javascript
// Voir l'état actuel
console.log(sessionStorage.getItem('game-popup-seen-today'))

// Nettoyer et recharger
window.resetGamePopup()

// Force display (debug uniquement)
window.forceShowCardFlip()

// Supprimer toutes les clés de session liées aux jeux
Object.keys(sessionStorage).filter(k => k.includes('game')).forEach(k => sessionStorage.removeItem(k))
```

## 🚀 Mise en Production

Le jeu s'affichera automatiquement :
- 2 secondes après le chargement de la page
- Si aucun jeu n'a été montré aujourd'hui
- Si l'utilisateur n'a pas épuisé ses parties (pour les connectés)
- Aux visiteurs non-connectés (avec prompt de connexion au clic)

---

**Date de correction :** 2026-01-13
**Jeu testé :** ID `0915fb06-433e-4828-bc98-3f189cbb4d93`
**Status :** ✅ Opérationnel
