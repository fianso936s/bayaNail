# Scripts d'automatisation pour bayanail-web

Ce répertoire contient un ensemble complet de scripts d'automatisation pour orchestrer, tester et corriger automatiquement le dépôt `bayanail-web`.

## Structure

```
scripts/
├── orchestration/          # Scripts PowerShell d'orchestration
│   ├── start-backend.ps1   # Lance le backend avec migrations
│   ├── start-frontend.ps1   # Lance le frontend avec build
│   ├── start-all.ps1       # Lance backend + frontend en parallèle
│   └── validate-all.ps1    # Validation continue complète
├── testing/                 # Scripts de test
│   └── test-all-endpoints.ts  # Tests complets de tous les endpoints
├── analysis/                # Scripts d'analyse
│   └── analyze-logs.ts     # Analyse des logs et détection d'erreurs
├── auto-fix/                # Scripts de correction automatique
│   ├── fix-rules.ts        # Règles de correction par type d'erreur
│   └── apply-fixes.ts      # Application des corrections
├── utils/                   # Utilitaires
│   ├── logger.ts           # Système de logging centralisé
│   └── dependency-mapper.ts # Cartographie des dépendances
└── config/                  # Configuration
    └── test-config.json     # Configuration des tests
```

## Prérequis

- Node.js 18+ et npm
- PowerShell 5.1+ (Windows)
- TypeScript et tsx installés globalement ou localement
- Prisma CLI installé

## Installation

Les dépendances sont gérées automatiquement par les scripts. Pour installer manuellement :

```powershell
# À la racine du projet
npm install

# Dans bayanail-api
cd bayanail-api
npm install
```

## Utilisation

### 1. Lancer le backend

```powershell
.\scripts\orchestration\start-backend.ps1
```

Options :
- `-SkipInstall` : Ignore l'installation des dépendances
- `-SkipMigrations` : Ignore l'application des migrations

Les logs sont enregistrés dans `logs/YYYY-MM-DD-HH-MM-SS/backend/`.

### 2. Lancer le frontend

```powershell
.\scripts\orchestration\start-frontend.ps1
```

Options :
- `-SkipInstall` : Ignore l'installation des dépendances
- `-SkipBuild` : Ignore la compilation TypeScript

Les logs sont enregistrés dans `logs/YYYY-MM-DD-HH-MM-SS/frontend/`.

### 3. Lancer backend et frontend simultanément

```powershell
.\scripts\orchestration\start-all.ps1
```

Ce script lance les deux serveurs en parallèle et génère un rapport de démarrage.

### 4. Validation continue complète

```powershell
.\scripts\orchestration\validate-all.ps1
```

Ce script :
1. Lance tous les serveurs
2. Vérifie leur santé (health checks)
3. Exécute les tests d'endpoints
4. Analyse les logs
5. Applique les corrections automatiques
6. Relance les tests jusqu'à ce que tous passent (max 5 itérations)

Options :
- `-MaxIterations <n>` : Nombre maximum d'itérations (défaut: 5)
- `-SkipAutoFix` : Ignore l'application des corrections automatiques

### 5. Tester tous les endpoints

```powershell
npx tsx scripts\testing\test-all-endpoints.ts [logDir]
```

Ce script :
- S'authentifie avec les credentials de test
- Teste tous les endpoints définis dans `src/lib/api/*.ts`
- Génère un rapport JSON dans `logs/.../tests/summary.json`

Variables d'environnement :
- `VITE_API_URL` : URL de l'API (défaut: http://localhost:3001)
- `TEST_EMAIL` : Email pour les tests (défaut: admin@bayanail.com)
- `TEST_PASSWORD` : Mot de passe pour les tests

### 6. Analyser les logs

```powershell
npx tsx scripts\analysis\analyze-logs.ts --logDir=logs\YYYY-MM-DD-HH-MM-SS
```

Ce script :
- Parse les logs backend, frontend et tests
- Détecte et classe les erreurs par sévérité (CRITICAL, MAJOR, MINOR)
- Génère un rapport dans `logs/.../analysis/errors-detected.json`

### 7. Appliquer les corrections automatiques

```powershell
npx tsx scripts\auto-fix\apply-fixes.ts --logDir=logs\YYYY-MM-DD-HH-MM-SS --rootDir=.
```

Ce script :
- Lit les erreurs détectées
- Applique les corrections automatiques simples
- Génère des fichiers de suggestion pour les corrections complexes dans `fixes/`

## Structure des logs

Les logs sont organisés par horodatage dans `logs/YYYY-MM-DD-HH-MM-SS/` :

```
logs/
└── YYYY-MM-DD-HH-MM-SS/
    ├── backend/
    │   ├── server.log          # Logs du serveur Express
    │   ├── prisma.log          # Logs Prisma
    │   └── errors.log          # Erreurs uniquement
    ├── frontend/
    │   ├── vite.log            # Logs Vite
    │   ├── build.log           # Logs de compilation
    │   └── errors.log          # Erreurs uniquement
    ├── tests/
    │   ├── endpoints.log       # Résultats des tests
    │   ├── summary.json        # Résumé JSON
    │   └── errors.log          # Erreurs de tests
    ├── analysis/
    │   └── errors-detected.json # Erreurs détectées
    └── report.json             # Rapport final
```

## Types d'erreurs détectées

### Backend
- **Database** : Erreurs de connexion Prisma, violations de contraintes
- **Routing** : Routes 404 (Cannot GET/POST)
- **Validation** : Erreurs Zod
- **CORS** : Erreurs CORS
- **Authentication** : Erreurs JWT/tokens
- **Server** : Port déjà utilisé, erreurs de démarrage

### Frontend
- **TypeScript** : Erreurs de compilation TS
- **Vite** : Erreurs de build Vite
- **Network** : Failed to fetch, erreurs réseau
- **Import** : Modules non trouvés

### Tests
- **API** : Erreurs HTTP (4xx, 5xx)
- **Timeout** : Timeouts de requêtes

## Corrections automatiques

Le système peut corriger automatiquement :

1. **Création du fichier .env** : Copie depuis `env.example` si manquant
2. **Ajout d'origines CORS** : Ajoute automatiquement les origines manquantes dans `bayanail-api/src/index.ts`
3. **Installation de packages** : Génère des suggestions pour installer les packages manquants

Pour les corrections complexes, des fichiers de suggestion sont générés dans `fixes/suggested-fix-XXX.md`.

## Configuration

Le fichier `scripts/config/test-config.json` contient :
- URLs de l'API
- Credentials de test
- Données mockées pour les tests
- Paramètres de test

## Dépendances TypeScript

Les scripts TypeScript nécessitent :
- `typescript` : Compilateur TypeScript
- `tsx` : Exécuteur TypeScript
- Types Node.js : `@types/node`

Installation :
```powershell
npm install -D typescript tsx @types/node
```

## Dépannage

### Le backend ne démarre pas

1. Vérifiez que le port 3001 n'est pas déjà utilisé
2. Vérifiez que `DATABASE_URL` est configuré dans `.env`
3. Consultez les logs dans `logs/.../backend/errors.log`

### Le frontend ne compile pas

1. Vérifiez les erreurs TypeScript dans `logs/.../frontend/build.log`
2. Installez les dépendances manquantes
3. Vérifiez que `node_modules` est à jour

### Les tests échouent

1. Vérifiez que le backend est démarré et accessible
2. Vérifiez les credentials de test dans `scripts/config/test-config.json`
3. Consultez `logs/.../tests/summary.json` pour les détails

### Les corrections automatiques ne s'appliquent pas

1. Vérifiez les permissions d'écriture sur les fichiers
2. Consultez `logs/.../auto-fix/` pour les détails
3. Les corrections complexes nécessitent une application manuelle (voir `fixes/`)

## Workflow recommandé

1. **Développement quotidien** :
   ```powershell
   .\scripts\orchestration\start-all.ps1
   ```

2. **Avant un commit** :
   ```powershell
   .\scripts\orchestration\validate-all.ps1
   ```

3. **Après une erreur** :
   ```powershell
   # Analyser les logs
   npx tsx scripts\analysis\analyze-logs.ts --logDir=logs\LATEST
   
   # Appliquer les corrections
   npx tsx scripts\auto-fix\apply-fixes.ts --logDir=logs\LATEST
   ```

## Contribution

Pour ajouter de nouvelles règles de correction :

1. Ajoutez une méthode dans `scripts/auto-fix/fix-rules.ts`
2. Ajoutez le cas dans `getFixSuggestion()`
3. Implémentez l'application dans `scripts/auto-fix/apply-fixes.ts`

## Licence

Ce projet fait partie de bayanail-web.

