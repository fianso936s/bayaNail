# 🔄 Migration MySQL → Neon PostgreSQL sur le VPS

## ⚠️ Important

Vous devez mettre à jour le `DATABASE_URL` sur le VPS pour utiliser Neon PostgreSQL au lieu de MySQL.

## 📋 État Actuel

**Sur le VPS (à remplacer) :**
```env
DATABASE_URL="mysql://u122173286_bayanail:lounes92localhost:3306/u122173286_bayanailweb"
```

**À utiliser (Neon PostgreSQL) :**
```env
DATABASE_URL="postgresql://USER:PASSWORD@ep-xxx-pooler.us-east-1.aws.neon.tech/dbname?sslmode=require&channel_binding=require"
```

## 🔑 Obtenir Votre URL Neon

### Option 1 : Depuis Neon Console

1. Allez sur https://console.neon.tech
2. Connectez-vous à votre compte
3. Sélectionnez votre projet
4. Allez dans l'onglet **"Connection Details"**
5. Copiez la **connection string** (format pooler recommandé)

### Option 2 : Depuis Votre .env Local

Si vous avez déjà Neon configuré en local, copiez la `DATABASE_URL` de votre `.env` local.

## 🚀 Mise à Jour sur le VPS

### Méthode Simple : Connexion SSH

```bash
# 1. Se connecter
ssh root@62.72.18.224

# 2. Trouver le dossier
find / -name ".env" -path "*/bayanail-api/*" 2>/dev/null

# 3. Aller dans le dossier
cd /root/bayanail-api  # ou le chemin trouvé

# 4. Sauvegarder
cp .env .env.backup.$(date +%Y%m%d_%H%M%S)

# 5. Éditer
nano .env
```

### Dans nano, Modifier :

**Remplacer cette ligne :**
```
DATABASE_URL="mysql://u122173286_bayanail:lounes92localhost:3306/u122173286_bayanailweb"
```

**Par votre URL Neon (exemple) :**
```
DATABASE_URL="postgresql://neondb_owner:npg_UiGw9m0hqsvS@ep-muddy-cell-ahzxxj69-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"
```

**Et aussi ajouter/modifier :**
```
NODE_ENV=production
JWT_SECRET="f08067b81db8ea38c7da688b7d395d73c30bfe3f5e8bc5327f5ff4514e86f91d"
JWT_REFRESH_SECRET="3ec65f61dd7764a3bb1bacc3050217754fcca9a3e75ae89a1f4541af125376bb"
```

Sauvegarder : `Ctrl+O`, `Enter`, `Ctrl+X`

### Redémarrer

```bash
pm2 restart bayanail-api
pm2 logs bayanail-api --lines 50
```

## ✅ Vérification

### 1. Vérifier la Connexion

```bash
# Sur le VPS
cd bayanail-api
npm run check:db
```

Vous devriez voir :
```
✅ Connexion à la base de données réussie
```

### 2. Vérifier les Logs

```bash
pm2 logs bayanail-api
```

Recherchez les erreurs de connexion à la base de données.

### 3. Tester l'API

```bash
curl https://api.bayanail.com/health
```

## 📝 Checklist Complète

- [ ] URL Neon PostgreSQL obtenue depuis Neon Console
- [ ] `.env` sauvegardé sur le VPS
- [ ] `DATABASE_URL` remplacé par l'URL Neon
- [ ] `NODE_ENV=production` ajouté
- [ ] `JWT_SECRET` remplacé par le secret fort
- [ ] `JWT_REFRESH_SECRET` remplacé par le secret fort
- [ ] Serveur redémarré
- [ ] Connexion à la base vérifiée (`npm run check:db`)
- [ ] API testée (`curl https://api.bayanail.com/health`)
- [ ] Audit de production exécuté (`npm run audit:production`)

## 🆘 Problèmes Courants

### Erreur : "Cannot connect to database"

**Causes possibles :**
1. URL Neon incorrecte
2. Credentials Neon invalides
3. Firewall bloque les connexions sortantes

**Solutions :**
1. Vérifiez l'URL dans Neon Console
2. Vérifiez les credentials
3. Testez la connexion depuis le VPS : `curl https://api.neon.tech`

### Erreur : "Unknown database"

**Cause :** Le nom de la base de données dans l'URL est incorrect

**Solution :** Vérifiez le nom de la base dans Neon Console

### Erreur : "SSL connection required"

**Cause :** Paramètres SSL manquants dans l'URL

**Solution :** Assurez-vous que l'URL contient `?sslmode=require&channel_binding=require`

---

**Consultez `COMMANDES-VPS-NEON.md` pour les instructions détaillées.**

