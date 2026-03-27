# 🚀 Commandes pour Mettre à Jour le VPS avec Neon PostgreSQL

## ⚠️ Important : Migration MySQL → Neon PostgreSQL

Vous devez remplacer le `DATABASE_URL` MySQL par une URL Neon PostgreSQL.

## 📋 Valeurs à Mettre à Jour

### Variables à Modifier

1. **NODE_ENV** : Ajouter `production`
2. **DATABASE_URL** : Remplacer MySQL par Neon PostgreSQL
3. **JWT_SECRET** : Remplacer par un secret fort
4. **JWT_REFRESH_SECRET** : Remplacer par un secret fort

### Valeurs à Conserver

- ✅ `FRONTEND_URL="https://bayanail.com"` (déjà correct)
- ✅ `PORT=3000` (déjà correct)

## 🔑 Secrets Générés

```
JWT_SECRET=f08067b81db8ea38c7da688b7d395d73c30bfe3f5e8bc5327f5ff4514e86f91d
JWT_REFRESH_SECRET=3ec65f61dd7764a3bb1bacc3050217754fcca9a3e75ae89a1f4541af125376bb
```

## 📝 Format DATABASE_URL Neon

```
postgresql://USER:PASSWORD@ep-xxx-pooler.us-east-1.aws.neon.tech/dbname?sslmode=require&channel_binding=require
```

**Exemple :**
```
postgresql://neondb_owner:npg_UiGw9m0hqsvS@ep-muddy-cell-ahzxxj69-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require
```

## 🔧 Comment Obtenir Votre URL Neon

1. Allez sur [Neon Console](https://console.neon.tech)
2. Sélectionnez votre projet
3. Allez dans "Connection Details"
4. Copiez la connection string (format pooler recommandé)

---

## Méthode 1 : Connexion SSH et Édition Manuelle (Recommandé)

### 1. Se Connecter au VPS

```bash
ssh root@62.72.18.224
```

### 2. Trouver le Dossier

```bash
find / -name ".env" -path "*/bayanail-api/*" 2>/dev/null
```

### 3. Aller dans le Dossier

```bash
cd /root/bayanail-api  # ou le chemin trouvé
```

### 4. Sauvegarder

```bash
cp .env .env.backup.$(date +%Y%m%d_%H%M%S)
```

### 5. Éditer avec nano

```bash
nano .env
```

### 6. Modifier le Fichier .env

Remplacez/modifiez ces lignes :

```env
NODE_ENV=production
DATABASE_URL="postgresql://VOTRE_USER:VOTRE_PASSWORD@VOTRE_HOST.neon.tech/VOTRE_DB?sslmode=require&channel_binding=require"
JWT_SECRET="f08067b81db8ea38c7da688b7d395d73c30bfe3f5e8bc5327f5ff4514e86f91d"
JWT_REFRESH_SECRET="3ec65f61dd7764a3bb1bacc3050217754fcca9a3e75ae89a1f4541af125376bb"
FRONTEND_URL="https://bayanail.com"
PORT=3000
```

**Important :**
- Remplacez `VOTRE_USER`, `VOTRE_PASSWORD`, `VOTRE_HOST`, `VOTRE_DB` par vos vraies valeurs Neon
- Gardez `FRONTEND_URL` et `PORT` tels quels

Dans nano :
- `Ctrl+O` pour sauvegarder
- `Enter` pour confirmer
- `Ctrl+X` pour quitter

### 7. Vérifier

```bash
grep -E "^(NODE_ENV|DATABASE_URL|JWT_SECRET|JWT_REFRESH_SECRET|FRONTEND_URL|PORT)=" .env
```

### 8. Redémarrer

```bash
pm2 restart bayanail-api
pm2 logs bayanail-api --lines 20
```

---

## Méthode 2 : Commandes sed (Si vous avez l'URL Neon)

Remplacez `VOTRE_URL_NEON` par votre vraie URL Neon :

```bash
ssh root@62.72.18.224 'cd $(find / -name ".env" -path "*/bayanail-api/*" 2>/dev/null | head -1 | xargs dirname) && cp .env .env.backup.$(date +%Y%m%d_%H%M%S) && (grep -q "^NODE_ENV=" .env || echo "NODE_ENV=production" >> .env) && sed -i "s/^NODE_ENV=.*/NODE_ENV=production/" .env && sed -i "s|^DATABASE_URL=.*|DATABASE_URL=\"VOTRE_URL_NEON\"|" .env && sed -i "s|^JWT_SECRET=.*|JWT_SECRET=\"f08067b81db8ea38c7da688b7d395d73c30bfe3f5e8bc5327f5ff4514e86f91d\"|" .env && sed -i "s|^JWT_REFRESH_SECRET=.*|JWT_REFRESH_SECRET=\"3ec65f61dd7764a3bb1bacc3050217754fcca9a3e75ae89a1f4541af125376bb\"|" .env && grep -E "^(NODE_ENV|DATABASE_URL|JWT_SECRET|JWT_REFRESH_SECRET)=" .env && pm2 restart bayanail-api'
```

---

## 📋 Exemple de .env Final

```env
NODE_ENV=production
PORT=3000
FRONTEND_URL="https://bayanail.com"

# Base de données Neon PostgreSQL
DATABASE_URL="postgresql://neondb_owner:npg_UiGw9m0hqsvS@ep-muddy-cell-ahzxxj69-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"

# JWT Secrets
JWT_SECRET="f08067b81db8ea38c7da688b7d395d73c30bfe3f5e8bc5327f5ff4514e86f91d"
JWT_REFRESH_SECRET="3ec65f61dd7764a3bb1bacc3050217754fcca9a3e75ae89a1f4541af125376bb"

# Admin (optionnel)
ADMIN_EMAIL="admin@bayanail.com"
ADMIN_PASSWORD="votre_mot_de_passe"
```

---

## ✅ Vérification Après Modification

### 1. Vérifier la Connexion à la Base

```bash
# Sur le VPS
cd bayanail-api
npm run check:db
```

### 2. Vérifier les Logs

```bash
pm2 logs bayanail-api --lines 50
```

### 3. Tester l'API

```bash
curl https://api.bayanail.com/health
```

### 4. Audit de Production

```bash
# Depuis votre machine locale
cd bayanail-api
npm run audit:production
```

---

## 🆘 En Cas de Problème

### Erreur de Connexion à la Base

1. Vérifiez que l'URL Neon est correcte
2. Vérifiez que les credentials Neon sont valides
3. Vérifiez que le firewall du VPS autorise les connexions sortantes vers Neon

### Restaurer l'Ancien .env

```bash
# Lister les backups
ls -la .env.backup.*

# Restaurer
cp .env.backup.[DATE] .env
pm2 restart bayanail-api
```

---

## 📚 Ressources

- [Guide DATABASE_URL Neon](GUIDE_DATABASE_URL.md)
- [Neon Console](https://console.neon.tech)
- [Documentation Neon](https://neon.tech/docs)

