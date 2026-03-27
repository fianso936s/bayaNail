/**
 * Script de diagnostic pour les problèmes CORS et Login
 * 
 * Ce script vérifie :
 * 1. La configuration CORS (origines autorisées)
 * 2. La connexion à la base de données Neon
 * 3. L'existence de l'utilisateur admin
 * 4. Le format du hash du mot de passe
 * 5. La vérification du mot de passe
 */

import dotenv from "dotenv";
import prisma from "../src/lib/prisma.js";
import { verifyPassword, isArgon2Hash } from "../src/lib/password.js";
import bcrypt from "bcrypt";

dotenv.config();

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "admin@bayanail.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || process.env.UNIFORM_PASSWORD || "lounes92";

interface DiagnosticResult {
  test: string;
  status: "✅" | "❌" | "⚠️";
  message: string;
  details?: any;
}

const results: DiagnosticResult[] = [];

function addResult(test: string, status: "✅" | "❌" | "⚠️", message: string, details?: any) {
  results.push({ test, status, message, details });
  console.log(`${status} ${test}: ${message}`);
  if (details) {
    console.log(`   Détails:`, JSON.stringify(details, null, 2));
  }
}

async function testDatabaseConnection() {
  try {
    await prisma.$connect();
    addResult("Connexion DB", "✅", "Connexion à Neon réussie");
    
    // Test simple query
    const result = await prisma.$queryRaw`SELECT 1 as test`;
    addResult("Query DB", "✅", "Requête SQL réussie", { result });
    return true;
  } catch (error: any) {
    addResult("Connexion DB", "❌", `Erreur de connexion: ${error.message}`, {
      error: error.message,
      code: error.code,
      hint: "Vérifiez votre DATABASE_URL dans .env"
    });
    return false;
  }
}

async function testAdminUser() {
  try {
    const normalizedEmail = ADMIN_EMAIL.toLowerCase().trim();
    console.log(`\n🔍 Recherche de l'utilisateur admin: ${normalizedEmail}`);
    
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      select: {
        id: true,
        email: true,
        role: true,
        password: true,
        createdAt: true,
      }
    });

    if (!user) {
      addResult("Utilisateur Admin", "❌", `Aucun utilisateur trouvé avec l'email: ${normalizedEmail}`, {
        emailRecherche: normalizedEmail,
        suggestion: "Exécutez: npm run prisma:seed ou npm run create:admin"
      });
      return null;
    }

    addResult("Utilisateur Admin", "✅", `Utilisateur trouvé: ${user.email}`, {
      id: user.id,
      email: user.email,
      role: user.role,
      aMotDePasse: !!user.password,
      longueurHash: user.password ? user.password.length : 0,
      createdAt: user.createdAt,
    });

    if (!user.password) {
      addResult("Mot de passe Admin", "❌", "L'utilisateur n'a pas de mot de passe", {
        suggestion: "Exécutez: npm run create:admin"
      });
      return user;
    }

    // Analyser le format du hash
    const isArgon2 = isArgon2Hash(user.password);
    const isBcrypt = user.password.startsWith("$2a$") || user.password.startsWith("$2b$") || user.password.startsWith("$2y$");
    
    addResult("Format Hash", isArgon2 ? "✅" : isBcrypt ? "⚠️" : "❌", 
      isArgon2 ? "Format Argon2 détecté" : isBcrypt ? "Format bcrypt détecté (ancien)" : "Format inconnu",
      {
        format: isArgon2 ? "Argon2" : isBcrypt ? "bcrypt" : "inconnu",
        debutHash: user.password.substring(0, 20) + "...",
      }
    );

    return user;
  } catch (error: any) {
    addResult("Utilisateur Admin", "❌", `Erreur lors de la recherche: ${error.message}`, {
      error: error.message,
    });
    return null;
  }
}

async function testPasswordVerification(user: any) {
  if (!user || !user.password) {
    return;
  }

  try {
    console.log(`\n🔐 Test de vérification du mot de passe...`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Mot de passe testé: ${ADMIN_PASSWORD}`);
    
    const isArgon2 = isArgon2Hash(user.password);
    let isValid = false;
    let errorMessage = "";

    if (isArgon2) {
      try {
        isValid = await verifyPassword(ADMIN_PASSWORD, user.password);
        addResult("Vérification Argon2", isValid ? "✅" : "❌", 
          isValid ? "Mot de passe valide" : "Mot de passe invalide");
      } catch (error: any) {
        errorMessage = error.message;
        addResult("Vérification Argon2", "❌", `Erreur lors de la vérification: ${error.message}`);
      }
    } else {
      // Test bcrypt
      try {
        isValid = await bcrypt.compare(ADMIN_PASSWORD, user.password);
        addResult("Vérification bcrypt", isValid ? "✅" : "❌", 
          isValid ? "Mot de passe valide" : "Mot de passe invalide");
      } catch (error: any) {
        errorMessage = error.message;
        addResult("Vérification bcrypt", "❌", `Erreur lors de la vérification: ${error.message}`);
      }
    }

    if (!isValid && !errorMessage) {
      addResult("Résultat Login", "❌", "Le mot de passe ne correspond pas", {
        suggestion: "Vérifiez ADMIN_PASSWORD ou UNIFORM_PASSWORD dans .env",
        alternative: "Réinitialisez le mot de passe avec: npm run create:admin"
      });
    } else if (isValid) {
      addResult("Résultat Login", "✅", "Le mot de passe est correct, le login devrait fonctionner");
    }

  } catch (error: any) {
    addResult("Vérification Mot de passe", "❌", `Erreur: ${error.message}`, {
      error: error.message,
    });
  }
}

function checkCorsConfiguration() {
  console.log(`\n🌐 Vérification de la configuration CORS...`);
  
  const frontendUrl = process.env.FRONTEND_URL;
  const nodeEnv = process.env.NODE_ENV;
  
  addResult("Variables CORS", frontendUrl ? "✅" : "⚠️", 
    frontendUrl ? `FRONTEND_URL configuré: ${frontendUrl}` : "FRONTEND_URL non configuré",
    {
      FRONTEND_URL: frontendUrl || "non défini",
      NODE_ENV: nodeEnv || "non défini",
      originesAttendues: [
        "https://www.bayanail.com",
        "https://bayanail.com",
      ],
      note: "Vérifiez que ces origines sont dans allowedCorsOrigins dans src/index.ts"
    }
  );
}

async function main() {
  console.log("🔍 DIAGNOSTIC CORS & LOGIN\n");
  console.log("=" .repeat(50));
  console.log(`Email admin: ${ADMIN_EMAIL}`);
  console.log(`Mot de passe testé: ${ADMIN_PASSWORD}`);
  console.log("=" .repeat(50));

  // 1. Test connexion DB
  const dbConnected = await testDatabaseConnection();
  if (!dbConnected) {
    console.log("\n❌ Impossible de continuer sans connexion DB");
    return;
  }

  // 2. Vérification CORS
  checkCorsConfiguration();

  // 3. Test utilisateur admin
  const user = await testAdminUser();

  // 4. Test vérification mot de passe
  if (user) {
    await testPasswordVerification(user);
  }

  // Résumé
  console.log("\n" + "=".repeat(50));
  console.log("📊 RÉSUMÉ");
  console.log("=".repeat(50));
  
  const success = results.filter(r => r.status === "✅").length;
  const warnings = results.filter(r => r.status === "⚠️").length;
  const errors = results.filter(r => r.status === "❌").length;
  
  console.log(`✅ Succès: ${success}`);
  console.log(`⚠️  Avertissements: ${warnings}`);
  console.log(`❌ Erreurs: ${errors}`);
  
  if (errors > 0) {
    console.log("\n❌ PROBLÈMES IDENTIFIÉS:");
    results.filter(r => r.status === "❌").forEach(r => {
      console.log(`   - ${r.test}: ${r.message}`);
    });
  }

  // Nettoyage
  await prisma.$disconnect();
}

main().catch(console.error);

