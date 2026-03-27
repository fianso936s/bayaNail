# Dépannage - Problème de Connexion Frontend-Backend

## Problème
Quand vous cliquez sur "Connexion" dans le frontend, ça ne fonctionne pas.

## Solutions

### Solution 1 : Créer un fichier .env.local (RECOMMANDÉ)

Créez un fichier `.env.local` à la racine du projet (`bayanail-web/.env.local`) avec :

```env
VITE_API_URL=http://localhost:3001
```

**Important:** 
- Le fichier `.env.local` est ignoré par Git (sécurisé)
- Redémarrez le serveur Vite après avoir créé le fichier
- Utilisez `npm run dev` pour redémarrer

### Solution 2 : Vérifier que les deux serveurs sont démarrés

**Frontend (Vite):**
```bash
cd bayanail-web
npm run dev
# Devrait être sur http://localhost:5173
```

**Backend (API):**
```bash
cd bayanail-api
npm run dev
# Devrait être sur http://localhost:3001
```

### Solution 3 : Vérifier le proxy Vite

Le proxy Vite est configuré dans `vite.config.ts` pour rediriger automatiquement les routes `/auth` vers `http://localhost:3001`.

**Test du proxy:**
1. Assurez-vous que les deux serveurs sont démarrés
2. Ouvrez votre navigateur sur `http://localhost:5173`
3. Ouvrez la console développeur (F12)
4. Regardez l'onglet "Network" lors de la connexion
5. Vérifiez si la requête va vers `/auth/login` ou `http://localhost:3001/auth/login`

### Solution 4 : Vérifier les erreurs dans la console

Ouvrez la console du navigateur (F12) et regardez les erreurs :

**Erreur "Failed to fetch":**
- Le backend n'est pas démarré
- L'URL est incorrecte
- Solution: Vérifiez que `http://localhost:3001` répond

**Erreur CORS:**
- Le backend bloque les requêtes
- Solution: Vérifiez que `http://localhost:5173` est dans la liste CORS du backend

**Erreur 401 "Identifiants invalides":**
- Les identifiants sont incorrects
- Solution: Utilisez `admin@bayanail.com` / `lounes92`

**Erreur "Cannot GET /auth/login":**
- Tentative d'accès avec GET au lieu de POST
- Solution: Le frontend doit utiliser POST (normalement géré automatiquement)

## Configuration actuelle

### Frontend
- **URL:** `http://localhost:5173`
- **API URL:** Déterminée par `src/lib/api/apiUrl.ts`
  - Si `VITE_API_URL` est défini → utilise cette URL
  - Sinon → utilise le proxy Vite (chemin relatif `/auth/login`)

### Backend
- **URL:** `http://localhost:3001`
- **CORS:** Autorise `http://localhost:5173`
- **Cookies:** Configurés avec `sameSite: "lax"` en développement

## Test manuel

### Test direct du backend
```powershell
$body = @{email="admin@bayanail.com";password="lounes92"} | ConvertTo-Json
Invoke-WebRequest -Uri "http://localhost:3001/auth/login" -Method POST -Body $body -ContentType "application/json"
```

### Test via le proxy (si Vite est démarré)
```powershell
$body = @{email="admin@bayanail.com";password="lounes92"} | ConvertTo-Json
Invoke-WebRequest -Uri "http://localhost:5173/auth/login" -Method POST -Body $body -ContentType "application/json"
```

## Format de la réponse

Le backend retourne :
```json
{
  "user": {
    "id": "...",
    "email": "admin@bayanail.com",
    "role": "ADMIN",
    "profile": {
      "firstName": "Admin",
      "lastName": "System"
    }
  }
}
```

Les cookies `accessToken` et `refreshToken` sont envoyés automatiquement.

## Checklist de dépannage

- [ ] Le backend est démarré sur `http://localhost:3001`
- [ ] Le frontend est démarré sur `http://localhost:5173`
- [ ] Le fichier `.env.local` existe avec `VITE_API_URL=http://localhost:3001`
- [ ] Le serveur Vite a été redémarré après création de `.env.local`
- [ ] Les identifiants sont corrects (`admin@bayanail.com` / `lounes92`)
- [ ] La console du navigateur ne montre pas d'erreurs CORS
- [ ] La requête dans l'onglet Network montre un POST vers `/auth/login`

## Si rien ne fonctionne

1. Vérifiez les logs du backend dans la console où vous avez lancé `npm run dev`
2. Vérifiez les logs du frontend dans la console du navigateur (F12)
3. Vérifiez que les deux serveurs sont bien démarrés
4. Essayez d'accéder directement à `http://localhost:3001/health` pour vérifier que le backend répond

