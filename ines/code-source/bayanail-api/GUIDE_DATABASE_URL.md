# Guide : Configuration DATABASE_URL pour PostgreSQL Neon

## C'est quoi ?

La `DATABASE_URL` est l'adresse de connexion à votre base de données PostgreSQL Neon. C'est comme une adresse postale, mais pour votre base de données.

## Format

```
postgresql://UTILISATEUR:MOT_DE_PASSE@host.neon.tech/NOM_DE_LA_BASE?sslmode=require
```

## Exemple Neon

```
postgresql://neondb_owner:npg_UiGw9m0hqsvS@ep-muddy-cell-ahzxxj69-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require
```

Décomposition :
- `postgresql://` = Type de base de données (PostgreSQL)
- `neondb_owner` = Nom d'utilisateur Neon
- `npg_UiGw9m0hqsvS` = Mot de passe Neon
- `ep-muddy-cell-ahzxxj69-pooler.c-3.us-east-1.aws.neon.tech` = Host Neon (pooler)
- `neondb` = Nom de votre base de données
- `?sslmode=require&channel_binding=require` = Paramètres de sécurité SSL

## Comment obtenir votre URL Neon ?

### 1. Via le Dashboard Neon

1. Connectez-vous à [Neon Console](https://console.neon.tech)
2. Sélectionnez votre projet
3. Allez dans l'onglet "Connection Details"
4. Copiez la connection string (format pooler recommandé)

### 2. Format de l'URL Neon

Neon fournit généralement deux types d'URLs :
- **Direct connection** : `ep-xxx-xxx.us-east-1.aws.neon.tech`
- **Pooler connection** : `ep-xxx-xxx-pooler.us-east-1.aws.neon.tech` (recommandé pour les applications)

Pour ce projet, utilisez le **pooler** pour de meilleures performances.

## Configuration pour différents environnements

### Production (Neon)
```
DATABASE_URL="postgresql://neondb_owner:npg_UiGw9m0hqsvS@ep-muddy-cell-ahzxxj69-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"
```

### Développement local (si vous utilisez Neon)
```
DATABASE_URL="postgresql://user:password@ep-xxx-pooler.us-east-1.aws.neon.tech/dbname?sslmode=require"
```

## Où mettre cette URL ?

Dans le fichier `bayanail-api\.env` :

```env
DATABASE_URL="postgresql://neondb_owner:npg_UiGw9m0hqsvS@ep-muddy-cell-ahzxxj69-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"
```

## Configuration automatique avec le script

Utilisez le script PowerShell fourni pour configurer automatiquement :

```powershell
cd bayanail-api
.\config-neon.ps1 -DatabaseUrl "postgresql://neondb_owner:npg_UiGw9m0hqsvS@ep-muddy-cell-ahzxxj69-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"
```

## Test rapide

Pour tester si votre DATABASE_URL fonctionne, ouvrez PowerShell dans le dossier `bayanail-api` :

```powershell
# Générer le client Prisma
npx prisma generate

# Tester la connexion
npx prisma db pull
```

Ou utilisez le script de diagnostic :

```powershell
.\diagnostic-complet.ps1
```

## Paramètres SSL importants

Neon requiert SSL pour la sécurité. Assurez-vous que votre URL contient :
- `sslmode=require` : Force l'utilisation de SSL
- `channel_binding=require` : Sécurité supplémentaire (optionnel mais recommandé)

## Migration depuis MySQL

Si vous migrez depuis MySQL, notez que :
- Le schéma Prisma est déjà configuré pour PostgreSQL
- Les types de données peuvent différer légèrement
- Utilisez `npx prisma migrate dev` pour appliquer les migrations

## Besoin d'aide ?

Si vous rencontrez des problèmes :
1. Vérifiez que votre URL Neon est correcte dans le dashboard
2. Assurez-vous que `sslmode=require` est présent dans l'URL
3. Vérifiez les logs du serveur pour les erreurs de connexion
4. Utilisez `.\diagnostic-complet.ps1` pour un diagnostic automatique
