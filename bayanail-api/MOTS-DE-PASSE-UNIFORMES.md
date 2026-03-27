# 🔐 Système de Mots de Passe Uniformes

## ✅ Configuration terminée !

Tous les mots de passe ont été uniformisés pour simplifier le développement et les tests.

## 📋 Mot de passe uniforme

**Mot de passe pour TOUS les utilisateurs :** `lounes92`

## 👤 Comptes disponibles

Vous pouvez vous connecter avec n'importe de ces comptes en utilisant le mot de passe `lounes92` :

### Administrateur
- `admin@bayanail.com` (ADMIN)

### Moniteurs
- `jean.moniteur@bayanail.fr` (INSTRUCTOR)
- `marie.monitrice@bayanail.fr` (INSTRUCTOR)

### Élèves
- `student1@bayanail.fr` (STUDENT)
- `student2@bayanail.fr` (STUDENT)
- `student3@bayanail.fr` (STUDENT)
- `student4@bayanail.fr` (STUDENT)
- `student5@bayanail.fr` (STUDENT)
- `student6@bayanail.fr` (STUDENT)
- `student7@bayanail.fr` (STUDENT)
- `student8@bayanail.fr` (STUDENT)
- `student9@bayanail.fr` (STUDENT)
- `student10@bayanail.fr` (STUDENT)

## 🔧 Configuration

### Variable d'environnement

Pour changer le mot de passe uniforme, ajoutez dans votre `.env` :

```env
UNIFORM_PASSWORD="VotreMotDePasse"
```

Si `UNIFORM_PASSWORD` n'est pas défini, le système utilise `lounes92` par défaut.

### Scripts disponibles

#### Uniformiser tous les mots de passe existants
```bash
npm run uniformize-passwords
```

#### Mettre à jour après un seed
```bash
npm run update-passwords
```

#### Recréer tous les utilisateurs avec le mot de passe uniforme
```bash
npm run prisma:seed
```

## 🚀 Utilisation

### Frontend
Connectez-vous simplement avec n'importe quel email et le mot de passe `lounes92`

### Tests API
```bash
# Test avec l'admin
npm run test:api-login -- admin@bayanail.com lounes92

# Test avec un moniteur
npm run test:api-login -- jean.moniteur@bayanail.fr lounes92

# Test avec un élève
npm run test:api-login -- student1@bayanail.fr lounes92
```

## 📝 Notes importantes

- ⚠️ **En production**, utilisez des mots de passe différents et sécurisés pour chaque utilisateur
- ✅ **En développement**, le mot de passe uniforme simplifie les tests
- 🔒 Les mots de passe sont toujours hashés avec bcrypt (10 rounds)
- 🔄 Vous pouvez réuniformiser les mots de passe à tout moment avec `npm run uniformize-passwords`

## 🎯 Avantages

1. ✅ **Simplicité** : Un seul mot de passe à retenir
2. ✅ **Tests facilités** : Pas besoin de chercher les différents mots de passe
3. ✅ **Développement rapide** : Connexion immédiate avec n'importe quel compte
4. ✅ **Documentation claire** : Plus besoin de chercher les mots de passe dans plusieurs fichiers

## 🔄 Mise à jour

Si vous créez de nouveaux utilisateurs avec le seed, ils utiliseront automatiquement le mot de passe uniforme défini dans `UNIFORM_PASSWORD` ou `lounes92` par défaut.

Pour mettre à jour les mots de passe existants après avoir changé `UNIFORM_PASSWORD` :

```bash
npm run uniformize-passwords
```

