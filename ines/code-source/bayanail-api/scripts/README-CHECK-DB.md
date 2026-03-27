# Script de Vérification de la Base de Données

Ce script permet de vérifier directement l'accès à la base de données sans passer par l'authentification API, pour isoler les problèmes de connexion.

## 🚀 Utilisation

### Option 1: Vérification complète (recommandé)

```bash
# Avec npm
npm run check:db

# Avec PowerShell
.\check-db.ps1

# Avec batch
check-db.bat
```

Cette commande affichera :
- ✅ Tous les utilisateurs dans la base de données
- ✅ Leurs rôles (ADMIN, INSTRUCTOR, STUDENT)
- ✅ La présence/absence de mots de passe
- ✅ Les statistiques par rôle
- ✅ La configuration depuis .env
- ✅ Un test de vérification de mot de passe

### Option 2: Test de connexion avec un utilisateur spécifique

```bash
# Avec npm
npm run test:login -- <email> <password>

# Exemple
npm run test:login -- admin@bayanail.com MonMotDePasse123

# Avec PowerShell
.\check-db.ps1 admin@bayanail.com MonMotDePasse123

# Avec batch
check-db.bat admin@bayanail.com MonMotDePasse123
```

## 📋 Ce que le script vérifie

1. **Connexion à la base de données**
   - Vérifie que DATABASE_URL est correctement configuré
   - Teste la connexion Prisma

2. **Liste des utilisateurs**
   - Affiche tous les utilisateurs avec leurs informations
   - Montre les rôles, emails, dates de création
   - Indique si un mot de passe est présent

3. **Vérification des administrateurs**
   - Liste tous les admins
   - Vérifie qu'ils ont un mot de passe

4. **Configuration .env**
   - Affiche ADMIN_EMAIL et ADMIN_PASSWORD (masqué)
   - Vérifie que les variables sont définies

5. **Test de mot de passe**
   - Compare le mot de passe du .env avec celui en base
   - Indique si la connexion serait réussie

6. **Statistiques**
   - Nombre d'utilisateurs par rôle
   - Vérification de la normalisation des emails

## 🔍 Exemple de sortie

```
🔍 Vérification de l'accès à la base de données...

✅ Connexion à la base de données réussie

📋 Liste des utilisateurs dans la base de données:

Total: 3 utilisateur(s)

────────────────────────────────────────────────────────────────────────────────
👤 Utilisateur ID: clx1234567890
   Email: admin@bayanail.com
   Rôle: ADMIN
   Mot de passe: ✅ Présent
   Longueur hash: 60 caractères
   Nom: Admin System
   Type: Administrateur
   Créé le: 22/12/2024 14:30:00
────────────────────────────────────────────────────────────────────────────────

🔐 Vérification des administrateurs:

✅ 1 administrateur(s) trouvé(s):

   1. admin@bayanail.com
      Mot de passe: ✅ Présent

🧪 Test de vérification de mot de passe:

   Test avec: admin@bayanail.com
   Résultat: ✅ Mot de passe valide
```

## 🐛 Dépannage

### Erreur: "Cannot connect to database"
- Vérifiez que DATABASE_URL est correct dans .env
- Vérifiez que la base de données est accessible
- Testez la connexion avec: `npx prisma studio`

### Erreur: "No users found"
- Exécutez le seed: `npm run prisma:seed`
- Vérifiez que ADMIN_PASSWORD est défini dans .env

### Erreur: "Password invalid"
- Vérifiez que le mot de passe dans .env correspond à celui utilisé lors du seed
- Réexécutez le seed avec le bon mot de passe

## 📝 Notes importantes

- ⚠️ Ce script accède directement à la base de données, sans authentification
- ⚠️ Il ne modifie pas les données, seulement lecture
- ✅ Utilisez-le uniquement en développement/local
- ✅ Ne commitez jamais le fichier .env avec de vrais mots de passe

