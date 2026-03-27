# Script de Test Complet - Hostinger ↔ API ↔ Database ↔ Frontend

Ce script teste la communication complète entre tous les composants de l'application Moniteur1D.

## 🎯 Objectif

Vérifier que tous les composants communiquent correctement :
- ✅ Base de données (PostgreSQL Neon)
- ✅ API de production (Hostinger)
- ✅ API locale (développement)
- ✅ Frontend Hostinger
- ✅ Frontend local (développement)

## 🚀 Utilisation

### Installation des dépendances

Assurez-vous que toutes les dépendances sont installées :

```bash
cd bayanail-api
npm install
```

### Exécution du test

```bash
npm run test:full-stack
```

### Configuration via variables d'environnement

Vous pouvez personnaliser les URLs en créant un fichier `.env` dans `bayanail-api/` :

```env
# URLs de production
HOSTINGER_FRONTEND_URL=https://powderblue-turtle-426494.hostingersite.com
PROD_API_URL=https://api.bayanail.com

# URLs locales
LOCAL_API_URL=http://localhost:3001
LOCAL_FRONTEND_URL=http://localhost:5173

# Identifiants de test
ADMIN_EMAIL=admin@bayanail.com
ADMIN_PASSWORD=votre_mot_de_passe
```

## 📊 Tests Effectués

### 1. Base de Données
- ✅ Connexion à la base de données
- ✅ Lecture des données (comptage des utilisateurs)
- ✅ Vérification des permissions

### 2. API Production (Hostinger)
- ✅ Health check (`/health`)
- ✅ Récupération du token CSRF
- ✅ Authentification (`/auth/login`)
- ✅ Récupération des données (`/auth/me`, `/offers`)

### 3. API Locale
- ✅ Health check (`/health`)
- ✅ Récupération du token CSRF
- ✅ Authentification (`/auth/login`)
- ✅ Récupération des données (`/auth/me`, `/offers`)

### 4. Frontend Hostinger
- ✅ Accessibilité du site
- ✅ Communication avec l'API (CORS)

### 5. Frontend Local
- ✅ Accessibilité du site (si démarré)
- ✅ Communication avec l'API locale

## 📋 Interprétation des Résultats

### ✅ Succès
Tous les tests sont passés avec succès. La communication fonctionne correctement.

### ⚠️ Avertissements
Certains tests ont échoué mais ne bloquent pas nécessairement le fonctionnement :
- Token CSRF non récupéré (peut être normal selon la configuration)
- Certains endpoints retournent des codes d'erreur attendus

### ❌ Erreurs
Des problèmes critiques ont été détectés :
- **Base de données inaccessible** : Vérifiez `DATABASE_URL` dans `.env`
- **API non accessible** : Vérifiez que l'API est démarrée
- **Authentification échouée** : Vérifiez `ADMIN_EMAIL` et `ADMIN_PASSWORD`
- **Frontend inaccessible** : Vérifiez le déploiement ou démarrez le serveur local

## 🔧 Dépannage

### API Production inaccessible

1. Vérifiez que l'API est démarrée sur Hostinger
2. Vérifiez les logs de l'application Node.js dans le hPanel
3. Vérifiez que le port est correctement configuré
4. Vérifiez les variables d'environnement sur Hostinger

### Authentification échouée en production

1. Vérifiez que `ADMIN_EMAIL` et `ADMIN_PASSWORD` sont corrects dans `.env` de production
2. Vérifiez que l'utilisateur admin existe en base de données
3. Exécutez le seed si nécessaire : `npm run prisma:seed`

### Frontend local inaccessible

Le frontend local n'est testé que s'il est démarré. Pour le démarrer :

```bash
# Dans un autre terminal
npm run dev
```

### Base de données inaccessible

1. Vérifiez `DATABASE_URL` dans `.env`
2. Vérifiez que la base de données Neon est accessible
3. Vérifiez votre connexion internet
4. Vérifiez les credentials de la base de données

## 📈 Rapport Détaillé

Le script génère un rapport complet avec :
- Résumé par composant
- Détails de chaque test avec durées
- Liste des problèmes identifiés
- Recommandations pour résoudre les problèmes

## 🔐 Sécurité

⚠️ **Important** : Ce script utilise les identifiants admin pour les tests. Assurez-vous que :
- Les identifiants ne sont pas exposés publiquement
- Le fichier `.env` est dans `.gitignore`
- Les identifiants de production sont différents de ceux de développement

## 📝 Exemple de Sortie

```
🔍 TEST COMPLET - HOSTINGER ↔ API ↔ DATABASE ↔ FRONTEND
================================================================================
✅ Succès: 12
⚠️  Avertissements: 1
❌ Erreurs: 2

📊 RÉSUMÉ PAR COMPOSANT:
✅ Database: 3/3 tests réussis
⚠️ API-Production: 1/3 tests réussis
✅ API-Local: 6/6 tests réussis
✅ Frontend-Hostinger: 2/2 tests réussis
❌ Frontend-Local: 0/1 tests réussis
```

## 🎓 Cas d'Usage

### Avant un déploiement
Exécutez ce script pour vérifier que tous les composants sont prêts.

### Après un déploiement
Vérifiez que la production fonctionne correctement.

### Diagnostic de problèmes
Utilisez ce script pour identifier rapidement où se situe un problème de communication.

## 🔗 Liens Utiles

- [Documentation Hostinger](HOSTINGER_DEPLOY.md)
- [Configuration API](CONFIGURATION_API.md)
- [Guide de dépannage](DEPANNAGE_CONNEXION.md)

