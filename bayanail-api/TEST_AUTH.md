# Guide de Test d'Authentification

## Problème : "Identifiants invalides"

Ce guide vous aide à diagnostiquer et résoudre les problèmes d'authentification.

## Script de Test Automatique

Un script de test a été créé pour vérifier le fonctionnement côté serveur.

### Utilisation

1. **Démarrer le serveur** (dans un terminal) :
```bash
cd bayanail-api
npm run dev
```

2. **Dans un autre terminal, lancer le test** :
```bash
cd bayanail-api
npm run test:auth
```

Ou avec des identifiants personnalisés :
```bash
node test-auth.js <email> <password>
```

### Ce que le script teste

1. ✅ Liste les utilisateurs en base de données (via `/auth/debug/users`)
2. ✅ Tente une connexion avec les identifiants fournis
3. ✅ Vérifie la réception des cookies
4. ✅ Teste l'endpoint `/auth/me` après connexion
5. ✅ Vérifie la normalisation de l'email

## Route de Debug

Une route de debug est disponible en développement : `GET /auth/debug/users`

Elle liste les 10 derniers utilisateurs avec :
- Email
- Rôle
- Présence d'un mot de passe
- Longueur du mot de passe (pour vérifier qu'il est hashé)

**⚠️ Cette route n'est disponible qu'en développement (NODE_ENV !== "production")**

## Vérifications Manuelles

### 1. Vérifier que l'utilisateur existe en base

```bash
# Via curl
curl http://localhost:3001/auth/debug/users

# Ou via le navigateur (si en dev)
http://localhost:3001/auth/debug/users
```

### 2. Vérifier les logs du serveur

Le serveur affiche maintenant des logs détaillés lors des tentatives de connexion :
- Email utilisé (normalisé)
- Utilisateur trouvé ou non
- Présence d'un mot de passe
- Résultat de la comparaison bcrypt

### 3. Tester la connexion manuellement

```bash
curl -X POST http://localhost:3001/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"<votre_email>","password":"<votre_mot_de_passe>"}' \
  -v
```

Le flag `-v` affiche les headers, notamment les cookies `Set-Cookie`.

## Problèmes Courants

### 1. Utilisateur non trouvé
- **Cause** : L'email n'existe pas en base ou n'est pas normalisé correctement
- **Solution** : Vérifier via `/auth/debug/users` et s'assurer que l'email est en minuscules

### 2. Mot de passe invalide
- **Cause** : Le mot de passe en base ne correspond pas
- **Solution** : 
  - Vérifier que le mot de passe a bien été hashé lors de la création
  - Réinitialiser le mot de passe si nécessaire

### 3. Cookies non reçus
- **Cause** : Problème CORS ou configuration des cookies
- **Solution** : Vérifier la configuration CORS et `sameSite` dans `auth.controller.ts`

### 4. Email non normalisé
- **Cause** : L'email en base n'est pas en minuscules
- **Solution** : Les nouvelles créations normalisent automatiquement, mais les anciens comptes peuvent avoir besoin d'être mis à jour

## Identifiants

Les identifiants sont configurés dans le fichier `.env` :
- **ADMIN_EMAIL** : Email de l'administrateur
- **ADMIN_PASSWORD** : Mot de passe de l'administrateur

⚠️ **Important** : Ne jamais utiliser de mots de passe en dur dans le code. Utilisez toujours les variables d'environnement.

## Commandes Utiles

```bash
# Tester l'authentification
npm run test:auth

# Tester avec des identifiants personnalisés
node test-auth.js email@example.com password123

# Vérifier les utilisateurs en base
curl http://localhost:3001/auth/debug/users

# Tester la connexion
curl -X POST http://localhost:3001/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"<votre_email>","password":"<votre_mot_de_passe>"}' \
  -c cookies.txt -v
```

