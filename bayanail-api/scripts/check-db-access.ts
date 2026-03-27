import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

interface UserCheck {
  id: string;
  email: string;
  role: string;
  hasPassword: boolean;
  passwordHash?: string;
  profile?: {
    firstName: string;
    lastName: string;
  };
}

async function checkDatabaseAccess() {
  console.log('🔍 Vérification de l\'accès à la base de données...\n');
  
  try {
    // 1. Vérifier la connexion
    await prisma.$connect();
    console.log('✅ Connexion à la base de données réussie\n');

    // 2. Lister tous les utilisateurs
    console.log('📋 Liste des utilisateurs dans la base de données:\n');
    const users = await prisma.user.findMany({
      include: {
        profile: true,
        studentProfile: true,
        instructorProfile: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    if (users.length === 0) {
      console.log('⚠️  Aucun utilisateur trouvé dans la base de données\n');
      console.log('💡 Pour créer un admin, utilisez: npm run seed\n');
      return;
    }

    console.log(`Total: ${users.length} utilisateur(s)\n`);
    console.log('─'.repeat(80));

    for (const user of users) {
      console.log(`\n👤 Utilisateur ID: ${user.id}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Rôle: ${user.role}`);
      console.log(`   Mot de passe: ${user.password ? '✅ Présent' : '❌ Absent'}`);
      
      if (user.password) {
        console.log(`   Longueur hash: ${user.password.length} caractères`);
      }

      if (user.profile) {
        console.log(`   Nom: ${user.profile.firstName} ${user.profile.lastName}`);
      }

      if (user.studentProfile) {
        console.log(`   Type: Élève`);
      }

      if (user.instructorProfile) {
        console.log(`   Type: Moniteur`);
        console.log(`   Actif: ${user.instructorProfile.isActive ? 'Oui' : 'Non'}`);
      }

      if (!user.studentProfile && !user.instructorProfile && user.role === 'ADMIN') {
        console.log(`   Type: Administrateur`);
      }

      console.log(`   Créé le: ${user.createdAt.toLocaleString('fr-FR')}`);
      console.log('─'.repeat(80));
    }

    // 3. Vérifier les admins
    console.log('\n\n🔐 Vérification des administrateurs:\n');
    const admins = users.filter(u => u.role === 'ADMIN');
    
    if (admins.length === 0) {
      console.log('⚠️  Aucun administrateur trouvé!\n');
      console.log('💡 Pour créer un admin:');
      console.log('   1. Définissez ADMIN_EMAIL et ADMIN_PASSWORD dans .env');
      console.log('   2. Exécutez: npm run seed\n');
    } else {
      console.log(`✅ ${admins.length} administrateur(s) trouvé(s):\n`);
      admins.forEach((admin, index) => {
        console.log(`   ${index + 1}. ${admin.email}`);
        console.log(`      Mot de passe: ${admin.password ? '✅ Présent' : '❌ Absent'}`);
      });
    }

    // 4. Vérifier les variables d'environnement
    console.log('\n\n⚙️  Configuration depuis .env:\n');
    const adminEmail = process.env.ADMIN_EMAIL || 'Non défini';
    const adminPassword = process.env.ADMIN_PASSWORD ? '✅ Défini' : '❌ Non défini';
    
    console.log(`   ADMIN_EMAIL: ${adminEmail}`);
    console.log(`   ADMIN_PASSWORD: ${adminPassword}`);
    
    if (process.env.ADMIN_PASSWORD) {
      console.log(`   Longueur: ${process.env.ADMIN_PASSWORD.length} caractères`);
    }

    // 5. Test de connexion avec un utilisateur spécifique
    console.log('\n\n🧪 Test de vérification de mot de passe:\n');
    
    if (admins.length > 0 && process.env.ADMIN_PASSWORD) {
      const admin = admins[0];
      if (admin.password) {
        console.log(`   Test avec: ${admin.email}`);
        const isValid = await bcrypt.compare(process.env.ADMIN_PASSWORD, admin.password);
        console.log(`   Résultat: ${isValid ? '✅ Mot de passe valide' : '❌ Mot de passe invalide'}`);
      } else {
        console.log(`   ⚠️  L'admin ${admin.email} n'a pas de mot de passe`);
      }
    } else {
      console.log('   ⚠️  Impossible de tester: admin ou mot de passe manquant');
    }

    // 6. Statistiques par rôle
    console.log('\n\n📊 Statistiques par rôle:\n');
    const roleStats = users.reduce((acc, user) => {
      acc[user.role] = (acc[user.role] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    Object.entries(roleStats).forEach(([role, count]) => {
      console.log(`   ${role}: ${count} utilisateur(s)`);
    });

    // 7. Vérifier les emails normalisés
    console.log('\n\n📧 Vérification de la normalisation des emails:\n');
    const emailsWithIssues = users.filter(u => {
      const normalized = u.email.toLowerCase().trim();
      return u.email !== normalized;
    });

    if (emailsWithIssues.length > 0) {
      console.log(`   ⚠️  ${emailsWithIssues.length} email(s) non normalisé(s):`);
      emailsWithIssues.forEach(u => {
        console.log(`      - ${u.email} (devrait être: ${u.email.toLowerCase().trim()})`);
      });
    } else {
      console.log('   ✅ Tous les emails sont normalisés');
    }

  } catch (error: any) {
    console.error('❌ Erreur lors de la vérification:', error.message);
    console.error('\nDétails:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Fonction pour tester la connexion avec un email/mot de passe
async function testLogin(email: string, password: string) {
  console.log(`\n🔐 Test de connexion avec: ${email}\n`);
  
  try {
    const normalizedEmail = email.toLowerCase().trim();
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      include: { profile: true }
    });

    if (!user) {
      console.log(`❌ Utilisateur non trouvé avec l'email: ${normalizedEmail}`);
      return false;
    }

    console.log(`✅ Utilisateur trouvé:`);
    console.log(`   ID: ${user.id}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Rôle: ${user.role}`);
    console.log(`   Mot de passe présent: ${user.password ? 'Oui' : 'Non'}`);

    if (!user.password) {
      console.log(`\n❌ L'utilisateur n'a pas de mot de passe défini`);
      return false;
    }

    const isValid = await bcrypt.compare(password, user.password);
    
    if (isValid) {
      console.log(`\n✅ Mot de passe valide!`);
      console.log(`\n📋 Informations pour le frontend:`);
      console.log(`   {
  "id": "${user.id}",
  "email": "${user.email}",
  "role": "${user.role}",
  "profile": ${user.profile ? JSON.stringify(user.profile, null, 2) : 'null'}
}`);
      return true;
    } else {
      console.log(`\n❌ Mot de passe invalide`);
      return false;
    }
  } catch (error: any) {
    console.error(`❌ Erreur: ${error.message}`);
    return false;
  }
}

// Fonction principale
async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 2 && args[0] === '--test-login') {
    // Mode test de connexion
    const email = args[1];
    const password = process.argv[3] || process.env.ADMIN_PASSWORD || '';
    
    if (!password) {
      console.log('❌ Mot de passe requis. Utilisez: --test-login <email> <password>');
      console.log('   Ou définissez ADMIN_PASSWORD dans .env');
      process.exit(1);
    }
    
    await prisma.$connect();
    await testLogin(email, password);
    await prisma.$disconnect();
  } else {
    // Mode vérification complète
    await checkDatabaseAccess();
  }
}

main()
  .catch((error) => {
    console.error('Erreur fatale:', error);
    process.exit(1);
  });

