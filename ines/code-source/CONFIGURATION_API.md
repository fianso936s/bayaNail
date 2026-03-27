# Configuration de la Communication Frontend-Backend

## Problème
Le frontend ne peut pas communiquer avec le backend lors de la connexion.

## Solutions

### Solution 1 : Utiliser la variable d'environnement (Recommandé)

Créez un fichier `.env.local` à la racine du projet (bayanail-web) avec :

```env
VITE_API_URL=http://localhost:3001
```

**Note:** Le fichier `.env.local` est ignoré par Git pour des raisons de sécurité.

### Solution 2 : Vérifier le proxy Vite

Le proxy Vite est configuré dans `vite.config.ts` pour rediriger automatiquement les routes API vers `http://localhost:3001`.

**Vérifications:**
1. Le serveur Vite doit être démarré sur `http://localhost:5173`
2. Le serveur backend doit être démarré sur `http://localhost:3001`
3. Les deux serveurs doivent être démarrés simultanément

### Solution 3 : Configuration manuelle

Si le proxy ne fonctionne pas, vous pouvez modifier `src/lib/api/apiUrl.ts` pour forcer l'URL :

```typescript
export const resolveApiBaseUrl = (): string => {
  // Forcer l'URL en développement
  return "http://localhost:3001";
};
```

## Test de la connexion

### Test direct du backend
```powershell
$body = @{email="admin@bayanail.com";password="lounes92"} | ConvertTo-Json
Invoke-WebRequest -Uri "http://localhost:3001/auth/login" -Method POST -Body $body -ContentType "application/json"
```

### Test via le proxy Vite
Si le serveur Vite est démarré sur `http://localhost:5173` :
```powershell
$body = @{email="admin@bayanail.com";password="lounes92"} | ConvertTo-Json
Invoke-WebRequest -Uri "http://localhost:5173/auth/login" -Method POST -Body $body -ContentType "application/json"
```

## Format de la réponse attendue

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

Les cookies `accessToken` et `refreshToken` sont également envoyés dans les headers.

## Dépannage

### Erreur "Cannot GET /auth/login"
- **Cause:** Tentative d'accès avec GET au lieu de POST
- **Solution:** Utiliser POST avec un body JSON

### Erreur "Failed to fetch"
- **Cause:** Le backend n'est pas démarré ou l'URL est incorrecte
- **Solution:** Vérifier que le backend est démarré sur `http://localhost:3001`

### Erreur CORS
- **Cause:** Le backend bloque les requêtes depuis le frontend
- **Solution:** Vérifier que `http://localhost:5173` est dans la liste CORS du backend

### Les cookies ne sont pas transmis
- **Cause:** Configuration CORS ou SameSite incorrecte
- **Solution:** Vérifier la configuration CORS dans `bayanail-api/src/index.ts`

