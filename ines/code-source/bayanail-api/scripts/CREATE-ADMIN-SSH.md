# 🔐 Guide : Créer l'admin via SSH

Ce guide vous explique comment créer ou mettre à jour le compte administrateur sur le serveur Hostinger via SSH.

## ⚠️ Sécurité

- ✅ Le mot de passe est **toujours hashé** avec bcrypt avant d'être stocké
- ✅ Le mot de passe en clair **n'est jamais affiché** dans les logs
- ✅ Seul le **hash sécurisé** est stocké en base de données
- ✅ Le hash ne peut **pas être inversé** pour retrouver le mot de passe

## 🚀 Méthode 1 : Via SSH (Recommandé)

### Étape 1 : Connectez-vous au serveur

```bash
ssh root@votre-serveur-hostinger.com
# ou
ssh votre-utilisateur@votre-serveur-hostinger.com
```

### Étape 2 : Naviguez vers le dossier de l'API

```bash
cd bayanail-api
```

### Étape 3 : Vérifiez que le fichier .env existe

```bash
ls -la .env
```

Si le fichier n'existe pas, créez-le avec votre `DATABASE_URL` :

```bash
nano .env
```

Ajoutez :
```env
DATABASE_URL="postgresql://user:password@host.neon.tech/dbname?sslmode=require"
ADMIN_EMAIL="admin@bayanail.com"
ADMIN_PASSWORD="lounes92"
ADMIN_FIRST_NAME="Admin"
ADMIN_LAST_NAME="System"
```

### Étape 4 : Exécutez le script

**Option A : Script TypeScript direct**
```bash
# Si tsx est installé
npx tsx scripts/create-admin-ssh.ts

# Ou si ts-node est installé
npx ts-node scripts/create-admin-ssh.ts
```

**Option B : Script bash (plus simple)**
```bash
chmod +x scripts/create-admin-ssh.sh
./scripts/create-admin-ssh.sh
```

**Option C : Avec npm**
```bash
npm run create:admin
```

### Étape 5 : Vérifiez le résultat

Le script affichera :
```
✅ Compte administrateur créé/mis à jour avec succès!
📋 Informations du compte:
   ID: ...
   Email: admin@bayanail.com
   Rôle: ADMIN
   Mot de passe: ✅ Hashé et sécurisé
```

## 🔧 Méthode 2 : Avec des paramètres personnalisés

Vous pouvez spécifier l'email et le mot de passe directement :

```bash
# Via le script bash
./scripts/create-admin-ssh.sh admin@bayanail.com lounes92 Admin System

# Via les variables d'environnement
export ADMIN_EMAIL="admin@bayanail.com"
export ADMIN_PASSWORD="lounes92"
npx tsx scripts/create-admin-ssh.ts
```

## 📋 Ce que fait le script

1. **Normalise l'email** (minuscules, sans espaces)
2. **Hash le mot de passe** avec bcrypt (10 rounds)
3. **Vérifie si l'utilisateur existe** déjà
4. **Crée ou met à jour** l'utilisateur avec le rôle ADMIN
5. **Crée le profil** si nécessaire
6. **Vérifie le hash** pour s'assurer qu'il est correct
7. **Affiche uniquement le hash** (jamais le mot de passe en clair)

## 🔒 Sécurité du mot de passe

### Hash bcrypt
- **Algorithme** : bcrypt avec 10 rounds
- **Longueur du hash** : 60 caractères
- **Format** : `$2b$10$...` (version, coût, salt, hash)

### Exemple de hash
```
$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy
```

### Pourquoi c'est sécurisé ?
- ✅ Le hash ne peut **pas être inversé**
- ✅ Même avec le hash, on ne peut **pas retrouver** le mot de passe
- ✅ Chaque hash est **unique** (même mot de passe = hash différent)
- ✅ Le salt est **généré automatiquement** par bcrypt

## 🧪 Vérification

Après avoir créé l'admin, vous pouvez tester la connexion :

```bash
# Test local
npm run test:prod

# Ou test manuel avec curl
curl -X POST https://api.bayanail.com/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@bayanail.com","password":"lounes92"}'
```

## 📝 Notes importantes

1. **Le mot de passe en clair n'est jamais stocké**
   - Seul le hash est enregistré en base de données
   - Même vous ne pouvez pas voir le mot de passe après création

2. **Le script peut être exécuté plusieurs fois**
   - Si l'utilisateur existe, il sera mis à jour
   - Le mot de passe sera re-hashé à chaque exécution

3. **Variables d'environnement**
   - Le script utilise les variables du fichier `.env`
   - Vous pouvez les surcharger via les paramètres

4. **Base de données**
   - Assurez-vous que `DATABASE_URL` est correctement configuré
   - Vérifiez que la connexion fonctionne avant d'exécuter le script

## 🆘 Dépannage

### Erreur : "Cannot find module"
```bash
npm install
```

### Erreur : "DATABASE_URL not found"
Vérifiez que le fichier `.env` existe et contient `DATABASE_URL`.

### Erreur : "Connection refused"
Vérifiez que la base de données est accessible depuis le serveur.

### Le script fonctionne mais le login échoue
1. Vérifiez que l'email est exactement le même (sensible à la casse après normalisation)
2. Vérifiez que le mot de passe est correct
3. Vérifiez les logs de l'API pour plus de détails

## ✅ Checklist

Avant d'exécuter le script :
- [ ] Connecté au serveur via SSH
- [ ] Dans le dossier `bayanail-api`
- [ ] Fichier `.env` existe avec `DATABASE_URL`
- [ ] Variables `ADMIN_EMAIL` et `ADMIN_PASSWORD` configurées
- [ ] Connexion à la base de données fonctionne

Après l'exécution :
- [ ] Le script affiche "✅ Compte administrateur créé/mis à jour"
- [ ] Le hash est affiché (pas le mot de passe)
- [ ] La vérification du hash réussit
- [ ] Test de connexion fonctionne

