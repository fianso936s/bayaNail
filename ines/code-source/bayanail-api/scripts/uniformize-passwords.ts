import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

// Mot de passe uniforme pour tous les utilisateurs
const UNIFORM_PASSWORD = process.env.UNIFORM_PASSWORD || 'lounes92';

async function uniformizePasswords() {
  console.log('🔐 Uniformisation des mots de passe');
  console.log(`   Mot de passe uniforme: ${UNIFORM_PASSWORD}`);
  console.log('─'.repeat(80));
  console.log('');

  try {
    await prisma.$connect();
    console.log('✅ Connexion à la base de données réussie\n');

    // Récupérer tous les utilisateurs
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        role: true,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    if (users.length === 0) {
      console.log('⚠️  Aucun utilisateur trouvé dans la base de données');
      return;
    }

    console.log(`📋 ${users.length} utilisateur(s) trouvé(s)\n`);

    // Hasher le mot de passe uniforme
    const hashedPassword = await bcrypt.hash(UNIFORM_PASSWORD, 10);
    console.log('✅ Mot de passe hashé généré\n');

    // Mettre à jour tous les utilisateurs
    let updatedCount = 0;
    for (const user of users) {
      await prisma.user.update({
        where: { id: user.id },
        data: { password: hashedPassword },
      });
      updatedCount++;
      console.log(`✅ ${user.email} (${user.role}) - Mot de passe mis à jour`);
    }

    console.log('');
    console.log('─'.repeat(80));
    console.log(`✅ ${updatedCount} utilisateur(s) mis à jour avec succès`);
    console.log('');
    console.log('📋 Informations de connexion:');
    console.log(`   Mot de passe uniforme: ${UNIFORM_PASSWORD}`);
    console.log('');
    console.log('👤 Comptes disponibles:');
    users.forEach((user) => {
      console.log(`   - ${user.email} (${user.role})`);
    });
    console.log('');
    console.log('💡 Vous pouvez maintenant vous connecter avec n\'importe quel compte');
    console.log(`   en utilisant le mot de passe: ${UNIFORM_PASSWORD}`);

  } catch (error: any) {
    console.error('❌ Erreur lors de l\'uniformisation:', error.message);
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

uniformizePasswords()
  .catch((error) => {
    console.error('Erreur fatale:', error);
    process.exit(1);
  });

