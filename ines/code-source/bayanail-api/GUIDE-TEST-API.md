# 🧪 Guide de Test de l'API

## 📋 Prérequis

Avant de tester l'API, assurez-vous que :

1. ✅ La base de données est accessible (testé avec `npm run check:db`)
2. ✅ Le serveur backend est démarré
3. ✅ Les variables d'environnement sont configurées dans `.env`

## 🚀 Étapes pour tester l'API

### Étape 1: Démarrer le serveur backend

Dans un terminal, depuis le répertoire `bayanail-api` :

```bash
npm run dev
```

Vous devriez voir :
```
Server is running on port 3001
✅ Compte admin créé avec succès au démarrage.
```

### Étape 2: Tester la connexion API

Dans un **autre terminal**, toujours depuis `bayanail-api` :

#### Option A: Avec PowerShell (Windows)
```powershell
.\test-api-connection.ps1 admin@bayanail.com VotreMotDePasse
```

#### Option B: Avec npm
```bash
npm run test:api-login -- admin@bayanail.com VotreMotDePasse
```

#### Option C: Avec curl (tous systèmes)
```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"admin@bayanail.com\",\"password\":\"VotreMotDePasse\"}" \
  -v
```

#### Option D: Avec Postman ou Insomnia

1. Créez une nouvelle requête POST
2. URL: `http://localhost:3001/api/auth/login`
3. Headers: `Content-Type: application/json`
4. Body (JSON):
```json
{
  "email": "admin@bayanail.com",
  "password": "VotreMotDePasse"
}
```

## ✅ Résultat attendu

Si tout fonctionne, vous devriez recevoir :

**Status:** `200 OK`

**Headers:**
```
Set-Cookie: accessToken=...; HttpOnly; ...
Set-Cookie: refreshToken=...; HttpOnly; ...
```

**Body:**
```json
{
  "user": {
    "id": "cmjhrts2n0000u73wjc58z3ga",
    "email": "admin@bayanail.com",
    "role": "ADMIN",
    "profile": {
      "firstName": "Admin",
      "lastName": "System"
    }
  }
}
```

## 🐛 Problèmes courants

### ❌ "Serveur non accessible"

**Cause:** Le serveur backend n'est pas démarré

**Solution:**
1. Vérifiez que le serveur tourne sur le port 3001
2. Vérifiez les logs du serveur pour des erreurs
3. Vérifiez que le port 3001 n'est pas utilisé par un autre processus

### ❌ "Status 401 - Identifiants invalides"

**Cause:** Email ou mot de passe incorrect

**Solution:**
1. Vérifiez avec `npm run check:db` que l'utilisateur existe
2. Testez le mot de passe avec `npm run test:login -- email password`
3. Vérifiez que `ADMIN_PASSWORD` dans `.env` correspond

### ❌ "Status 400 - Requête invalide"

**Cause:** Format de la requête incorrect

**Solution:**
1. Vérifiez que le Content-Type est `application/json`
2. Vérifiez que l'email et le mot de passe sont fournis
3. Vérifiez le format JSON

### ❌ "Status 500 - Erreur serveur"

**Cause:** Erreur dans le code backend

**Solution:**
1. Vérifiez les logs du serveur
2. Vérifiez que la base de données est accessible
3. Vérifiez que `JWT_SECRET` est défini dans `.env`

### ❌ "Pas de cookies reçus"

**Cause:** Problème de configuration CORS ou cookies

**Solution:**
1. Vérifiez que `credentials: 'include'` est utilisé dans les requêtes
2. Vérifiez la configuration CORS dans `src/index.ts`
3. Vérifiez que le frontend et backend sont sur le même domaine (ou CORS configuré)

## 📊 Checklist de débogage

- [ ] Serveur backend démarré (`npm run dev`)
- [ ] Base de données accessible (`npm run check:db`)
- [ ] Utilisateur existe en base
- [ ] Mot de passe correct (`npm run test:login`)
- [ ] Variables d'environnement configurées (`.env`)
- [ ] Port 3001 disponible
- [ ] CORS configuré correctement
- [ ] JWT_SECRET défini dans `.env`

## 🔍 Test complet du flux

Pour tester tout le flux d'authentification :

1. **Base de données** → `npm run check:db`
2. **API Login** → `npm run test:api-login` (serveur démarré)
3. **Frontend** → Ouvrir le navigateur et tester la connexion

Si l'étape 1 fonctionne mais pas l'étape 2 → Problème API
Si l'étape 2 fonctionne mais pas l'étape 3 → Problème Frontend/CORS

