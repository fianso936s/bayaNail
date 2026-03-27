# 🚀 Commandes Finales pour Mettre à Jour le VPS

## Valeurs Actuelles sur le VPS

```
DATABASE_URL="mysql://u122173286_bayanail:lounes92localhost:3306/u122173286_bayanailweb"
JWT_SECRET="soufiane_moniteur_936_secret"
JWT_REFRESH_SECRET="soufiane_moniteur_936_refresh"
FRONTEND_URL="https://bayanail.com"
PORT=3000
```

## ✅ Modifications à Apporter

1. **Ajouter** `NODE_ENV=production`
2. **Remplacer** `JWT_SECRET` par un secret fort
3. **Remplacer** `JWT_REFRESH_SECRET` par un secret fort
4. **Garder** `DATABASE_URL`, `FRONTEND_URL`, et `PORT` tels quels

## Secrets Forts Générés

```
JWT_SECRET=f08067b81db8ea38c7da688b7d395d73c30bfe3f5e8bc5327f5ff4514e86f91d
JWT_REFRESH_SECRET=3ec65f61dd7764a3bb1bacc3050217754fcca9a3e75ae89a1f4541af125376bb
```

---

## Méthode 1 : Connexion SSH et Commandes sed

### Se Connecter

```bash
ssh root@62.72.18.224
```

### Trouver le Dossier

```bash
find / -name ".env" -path "*/bayanail-api/*" 2>/dev/null | head -1
```

### Aller dans le Dossier (remplacez par le chemin trouvé)

```bash
cd /root/bayanail-api
# ou le chemin trouvé ci-dessus
```

### Sauvegarder

```bash
cp .env .env.backup.$(date +%Y%m%d_%H%M%S)
```

### Mettre à Jour les Variables

```bash
# Ajouter NODE_ENV si absent, sinon remplacer
grep -q "^NODE_ENV=" .env || echo "NODE_ENV=production" >> .env
sed -i 's/^NODE_ENV=.*/NODE_ENV=production/' .env

# Remplacer JWT_SECRET
sed -i 's|^JWT_SECRET=.*|JWT_SECRET="f08067b81db8ea38c7da688b7d395d73c30bfe3f5e8bc5327f5ff4514e86f91d"|' .env

# Remplacer JWT_REFRESH_SECRET
sed -i 's|^JWT_REFRESH_SECRET=.*|JWT_REFRESH_SECRET="3ec65f61dd7764a3bb1bacc3050217754fcca9a3e75ae89a1f4541af125376bb"|' .env
```

### Vérifier

```bash
grep -E "^(NODE_ENV|FRONTEND_URL|JWT_SECRET|JWT_REFRESH_SECRET)=" .env
```

Vous devriez voir :
```
NODE_ENV=production
FRONTEND_URL="https://bayanail.com"
JWT_SECRET="f08067b81db8ea38c7da688b7d395d73c30bfe3f5e8bc5327f5ff4514e86f91d"
JWT_REFRESH_SECRET="3ec65f61dd7764a3bb1bacc3050217754fcca9a3e75ae89a1f4541af125376bb"
```

### Redémarrer

```bash
pm2 restart bayanail-api
```

---

## Méthode 2 : Commande Unique (Copier-Coller)

```bash
ssh root@62.72.18.224 'cd $(find / -name ".env" -path "*/bayanail-api/*" 2>/dev/null | head -1 | xargs dirname) && cp .env .env.backup.$(date +%Y%m%d_%H%M%S) && (grep -q "^NODE_ENV=" .env || echo "NODE_ENV=production" >> .env) && sed -i "s/^NODE_ENV=.*/NODE_ENV=production/" .env && sed -i "s|^JWT_SECRET=.*|JWT_SECRET=\"f08067b81db8ea38c7da688b7d395d73c30bfe3f5e8bc5327f5ff4514e86f91d\"|" .env && sed -i "s|^JWT_REFRESH_SECRET=.*|JWT_REFRESH_SECRET=\"3ec65f61dd7764a3bb1bacc3050217754fcca9a3e75ae89a1f4541af125376bb\"|" .env && grep -E "^(NODE_ENV|FRONTEND_URL|JWT_SECRET|JWT_REFRESH_SECRET)=" .env && pm2 restart bayanail-api'
```

---

## Méthode 3 : Édition Manuelle avec nano

### Se Connecter

```bash
ssh root@62.72.18.224
```

### Trouver et Aller dans le Dossier

```bash
cd $(find / -name ".env" -path "*/bayanail-api/*" 2>/dev/null | head -1 | xargs dirname)
```

### Sauvegarder

```bash
cp .env .env.backup.$(date +%Y%m%d_%H%M%S)
```

### Éditer

```bash
nano .env
```

### Modifier/Ajouter Ces Lignes

```
NODE_ENV=production
JWT_SECRET="f08067b81db8ea38c7da688b7d395d73c30bfe3f5e8bc5327f5ff4514e86f91d"
JWT_REFRESH_SECRET="3ec65f61dd7764a3bb1bacc3050217754fcca9a3e75ae89a1f4541af125376bb"
```

Dans nano :
- `Ctrl+O` pour sauvegarder
- `Enter` pour confirmer
- `Ctrl+X` pour quitter

### Redémarrer

```bash
pm2 restart bayanail-api
pm2 logs bayanail-api --lines 20
```

---

## ✅ Vérification Finale

### Depuis le VPS

```bash
# Vérifier que le serveur tourne
pm2 status

# Tester l'endpoint
curl https://api.bayanail.com/health

# Voir les logs
pm2 logs bayanail-api --lines 50
```

### Depuis votre Machine Locale

```bash
cd bayanail-api
npm run audit:production
```

Le score devrait être proche de 100/100.

---

## 📋 Résumé des Changements

| Variable | Avant | Après |
|----------|-------|-------|
| NODE_ENV | (absent) | `production` |
| JWT_SECRET | `soufiane_moniteur_936_secret` | `f08067b81db8ea38c7da688b7d395d73c30bfe3f5e8bc5327f5ff4514e86f91d` |
| JWT_REFRESH_SECRET | `soufiane_moniteur_936_refresh` | `3ec65f61dd7764a3bb1bacc3050217754fcca9a3e75ae89a1f4541af125376bb` |
| FRONTEND_URL | `https://bayanail.com` | ✅ Déjà correct |
| DATABASE_URL | (MySQL) | ✅ Conservé tel quel |
| PORT | `3000` | ✅ Conservé tel quel |

