# 🔐 Mots de Passe - Guide Rapide

## ✅ Mot de passe uniforme activé

**Tous les utilisateurs utilisent le même mot de passe :** `lounes92`

## 🚀 Connexion rapide

### Frontend
- **Email** : `admin@bayanail.com` (ou n'importe quel autre compte)
- **Mot de passe** : `lounes92`

### API
```bash
npm run test:api-login -- admin@bayanail.com lounes92
```

## 📋 Comptes de test

| Email | Rôle | Mot de passe |
|-------|------|--------------|
| `admin@bayanail.com` | ADMIN | `lounes92` |
| `jean.moniteur@bayanail.fr` | INSTRUCTOR | `lounes92` |
| `marie.monitrice@bayanail.fr` | INSTRUCTOR | `lounes92` |
| `student1@bayanail.fr` | STUDENT | `lounes92` |
| ... (student2 à student10) | STUDENT | `lounes92` |

## 🔧 Changer le mot de passe uniforme

1. Ajoutez dans `.env` :
   ```env
   UNIFORM_PASSWORD="VotreNouveauMotDePasse"
   ```

2. Réuniformisez les mots de passe :
   ```bash
   npm run uniformize-passwords
   ```

## 📚 Documentation complète

Voir `MOTS-DE-PASSE-UNIFORMES.md` pour plus de détails.

