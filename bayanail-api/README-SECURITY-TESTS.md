# Tests de Sécurité - Moniteur1D API

Ce document décrit les scripts de test de sécurité disponibles pour valider les protections contre les vulnérabilités.

## Scripts Disponibles

### 1. Test Complet de Sécurité (`test-security.ts`)

Script TypeScript complet qui teste toutes les protections de sécurité :

- ✅ Protection contre XSS (Cross-Site Scripting)
- ✅ Protection contre CSRF (Cross-Site Request Forgery)
- ✅ Validation Zod (blocage HTML/JavaScript)
- ✅ Headers de sécurité (CSP, X-XSS-Protection, etc.)
- ✅ Sanitisation des données
- ✅ Protection contre l'injection SQL (via Prisma)

**Usage :**
```bash
cd bayanail-api
npm run test:security
```

Ou avec une URL personnalisée :
```bash
API_URL=http://localhost:3001 npm run test:security
```

### 2. Tests XSS Manuels

#### Script Bash (`test-security-xss.sh`)
```bash
cd bayanail-api/scripts
chmod +x test-security-xss.sh
./test-security-xss.sh [API_URL]
```

#### Script PowerShell (`test-security-xss.ps1`)
```powershell
cd bayanail-api/scripts
.\test-security-xss.ps1 [API_URL]
```

### 3. Tests CSRF Manuels

#### Script Bash (`test-security-csrf.sh`)
```bash
cd bayanail-api/scripts
chmod +x test-security-csrf.sh
./test-security-csrf.sh [API_URL]
```

#### Script PowerShell (`test-security-csrf.ps1`)
```powershell
cd bayanail-api/scripts
.\test-security-csrf.ps1 [API_URL]
```

## Payloads Testés

### XSS (Cross-Site Scripting)
- `<script>alert('XSS')</script>`
- `<img src=x onerror=alert('XSS')>`
- `<svg onload=alert('XSS')>`
- `javascript:alert('XSS')`
- `<iframe src='javascript:alert("XSS")'></iframe>`
- `<body onload=alert('XSS')>`
- `<input onfocus=alert('XSS') autofocus>`
- `<details open ontoggle=alert('XSS')>`

### CSRF (Cross-Site Request Forgery)
- Requête POST sans token CSRF
- Requête POST avec token CSRF valide
- Requête POST avec token CSRF invalide
- Génération et récupération du token CSRF

### Injection SQL
- `'; DROP TABLE users; --`
- `' OR '1'='1`
- `' UNION SELECT * FROM users --`
- `admin'--`
- `1' OR '1'='1`

## Résultats Attendus

### ✅ Tests Réussis
- Les payloads XSS doivent être **rejetés** avec un status HTTP 400 ou 403
- Les requêtes sans token CSRF doivent être **rejetées** avec un status HTTP 403
- Les requêtes avec token CSRF invalide doivent être **rejetées** avec un status HTTP 403
- Les headers de sécurité doivent être **présents** dans toutes les réponses
- Les validations Zod doivent **bloquer** les entrées contenant du HTML/JavaScript

### ❌ Tests Échoués (Vulnérabilités)
- Les payloads XSS sont **acceptés** et stockés en base de données
- Les requêtes sans token CSRF sont **acceptées**
- Les headers de sécurité sont **manquants**
- Les validations Zod **n'empêchent pas** l'injection de HTML

## Interprétation des Résultats

### Taux de Réussite
- **100%** : Toutes les protections sont actives ✅
- **90-99%** : Quelques ajustements mineurs nécessaires ⚠️
- **<90%** : Des vulnérabilités critiques sont présentes ❌

### Messages d'Erreur Attendus

#### XSS Bloqué
```json
{
  "message": "Les balises HTML et JavaScript ne sont pas autorisées dans les champs",
  "error": "XSS_DETECTED"
}
```

#### CSRF Bloqué
```json
{
  "message": "Token CSRF manquant",
  "error": "CSRF_TOKEN_MISSING"
}
```

ou

```json
{
  "message": "Token CSRF invalide ou expiré",
  "error": "CSRF_TOKEN_INVALID"
}
```

## Exécution en CI/CD

Pour intégrer les tests dans un pipeline CI/CD :

```yaml
# Exemple GitHub Actions
- name: Test Security
  run: |
    cd bayanail-api
    npm run test:security
  env:
    API_URL: http://localhost:3001
```

## Dépannage

### Le serveur n'est pas démarré
```bash
# Démarrer le serveur dans un terminal
cd bayanail-api
npm run dev

# Dans un autre terminal, exécuter les tests
npm run test:security
```

### Erreur de connexion
Vérifiez que l'URL de l'API est correcte :
```bash
API_URL=http://localhost:3001 npm run test:security
```

### Tests CSRF échouent
Assurez-vous que :
1. Le middleware CSRF est bien configuré dans `index.ts`
2. Les cookies sont activés dans la configuration CORS
3. Le endpoint `/auth/csrf-token` est accessible

## Notes Importantes

- ⚠️ Ces tests ne remplacent **pas** un audit de sécurité professionnel
- ⚠️ Les tests doivent être exécutés sur un environnement de **test** uniquement
- ⚠️ Ne pas exécuter ces tests sur un environnement de **production** sans autorisation
- ✅ Les tests sont conçus pour être **non-destructifs** (pas de suppression de données)

## Support

Pour toute question ou problème avec les tests de sécurité, consultez :
- La documentation de sécurité dans `/bayanail-api/AUDIT_REPORT.md`
- Les logs du serveur pour plus de détails sur les erreurs
- Les issues GitHub pour signaler des problèmes

