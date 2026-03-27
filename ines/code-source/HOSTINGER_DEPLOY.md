# Guide de Déploiement Hostinger - Moniteur1D

## 1. Base de Données (MySQL)
1. Dans le hPanel Hostinger, allez dans **Bases de données** -> **Gestion des bases de données**.
2. Créez une nouvelle base de données (ex: `u123456789_bayanail`).
3. Notez l'utilisateur, le nom de la base et le mot de passe.
4. L'URL DATABASE_URL sera : `mysql://utilisateur:mot_de_passe@localhost:3306/nom_db`

## 2. Configuration du Dépôt Git
1. Dans le hPanel, allez dans **Avancé** -> **Git**.
2. Déployez le dépôt : `https://github.com/fianso936s/auto-ecole-web.git`
3. Branche : `main`.

## 3. Configuration du Backend (Node.js)
1. Allez dans **Avancé** -> **Node.js**.
2. Créez une application :
   - Dossier : `/bayanail-api`
   - Version Node : 18 ou 20
   - Fichier d'entrée : `dist/index.js`
3. Dans le dossier `bayanail-api` sur Hostinger (via le Gestionnaire de fichiers), créez un fichier `.env` :
```env
DATABASE_URL="votre_url_mysql"
JWT_SECRET="choisissez_un_secret_long"
JWT_REFRESH_SECRET="choisissez_un_autre_secret_long"
FRONTEND_URL="https://bayanail.com"
PORT=3000
NODE_ENV=production

# Admin (création auto au démarrage si ADMIN_PASSWORD est défini)
ADMIN_EMAIL="soufiane936s@gmail.com"
ADMIN_PASSWORD="votre_mot_de_passe_admin"
ADMIN_FIRST_NAME="Admin"
ADMIN_LAST_NAME="System"

# Optionnels
CRON_TOKEN="token_aleatoire_si_jobs"
STRIPE_SECRET_KEY="sk_live_... (si Stripe)"
STRIPE_WEBHOOK_SECRET="whsec_... (si Stripe)"
RESEND_API_KEY="re_... (si emails Resend)"
```

## 4. Build du Frontend
Le frontend doit être construit (build) avant d'être envoyé dans `public_html`.
0. Configurez l'URL de l'API pour Vite (frontend) :
   - Créez un fichier `.env.production` à la racine (à côté de `vite.config.ts`)
   - Ou utilisez le template `env.production.example` (à copier en `.env.production`)
```env
VITE_API_URL="https://api.bayanail.com"
```
1. Dans Cursor, lancez : `npm run build`
2. Cela va créer un dossier `dist/` à la racine de votre projet.
3. Compressez le contenu du dossier `dist/` et envoyez-le dans le dossier `public_html` de votre site via le Gestionnaire de fichiers Hostinger.

## 5. Initialisation de la base de données
Connectez-vous en SSH à votre serveur Hostinger et lancez ces commandes dans le dossier `/bayanail-api` :
```bash
npm install
npx prisma generate
npx prisma migrate deploy
npx prisma db seed
```

## Notes importantes
- Ne committez jamais de fichiers `.env` avec de vrais secrets. Préférez définir les variables dans Hostinger.
- `DATABASE_URL` est en **MySQL** (le schéma Prisma utilise `provider = "mysql"`).
- La variable `API_URL` n'est pas utilisée côté backend dans ce projet ; côté frontend c'est `VITE_API_URL`.

