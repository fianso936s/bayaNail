# 🔍 Trouver le Chemin sur le VPS

## Méthode 1 : Connexion SSH et Recherche

```bash
# Se connecter au VPS
ssh root@62.72.18.224

# Chercher le dossier bayanail-api
find / -name "package.json" -path "*/bayanail-api/*" 2>/dev/null

# Ou chercher le dossier directement
find / -type d -name "bayanail-api" 2>/dev/null

# Ou chercher le fichier .env
find / -name ".env" -path "*/bayanail-api/*" 2>/dev/null
```

## Méthode 2 : Chemins Communs à Essayer

```bash
# Essayer ces chemins un par un
ls -la /root/bayanail-api
ls -la ~/bayanail-api
ls -la /opt/bayanail-api
ls -la /var/www/bayanail-api
ls -la /home/*/bayanail-api
ls -la /usr/local/bayanail-api
ls -la /srv/bayanail-api
```

## Méthode 3 : Via PM2

```bash
# Si PM2 est utilisé, voir où le processus tourne
ssh root@62.72.18.224 'pm2 list'
ssh root@62.72.18.224 'pm2 info bayanail-api | grep "script path"'
```

## Une Fois le Chemin Trouvé

Remplacez `/root/bayanail-api` par le chemin trouvé dans les commandes suivantes :

### Copie du Dossier dist

```bash
# Depuis votre machine locale
cd bayanail-api
npm run build

# Copier (remplacez CHEMIN_TROUVE par le vrai chemin)
scp -r dist root@62.72.18.224:/CHEMIN_TROUVE/
```

### Redémarrer

```bash
ssh root@62.72.18.224 'cd /CHEMIN_TROUVE && pm2 restart bayanail-api'
```

## Script Automatique

Utilisez le script PowerShell créé :

```powershell
cd bayanail-api
.\deploy-to-vps.ps1
```

Le script trouvera automatiquement le chemin et déploiera.

