/**
 * Script de test pour vérifier le fonctionnement de l'authentification côté serveur
 * Usage: node test-auth.js [email] [password]
 */

const API_URL = process.env.API_URL || "http://localhost:3001";

async function testAuth(email, password) {
  console.log("\n=== TEST D'AUTHENTIFICATION ===\n");
  console.log(`API URL: ${API_URL}`);
  console.log(`Email: ${email}`);
  console.log(`Password: ${password ? "***" : "non fourni"}\n`);

  try {
    // Test 1: Vérifier les utilisateurs en base (debug)
    console.log("1. Vérification des utilisateurs en base...");
    const debugResponse = await fetch(`${API_URL}/auth/debug/users`);
    if (debugResponse.ok) {
      const debugData = await debugResponse.json();
      console.log(`   ✓ ${debugData.total} utilisateur(s) trouvé(s)`);
      debugData.users.forEach((user, index) => {
        console.log(`   ${index + 1}. ${user.email} (${user.role}) - Mot de passe: ${user.hasPassword ? "Oui" : "Non"}`);
      });
    } else {
      console.log("   ⚠ Route debug non disponible (normal en production)");
    }

    // Test 2: Tentative de connexion
    console.log("\n2. Tentative de connexion...");
    const loginResponse = await fetch(`${API_URL}/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
      credentials: "include", // Important pour les cookies
    });

    const loginData = await loginResponse.json();
    
    if (loginResponse.ok) {
      console.log("   ✓ Connexion réussie !");
      console.log(`   Utilisateur: ${loginData.user?.email}`);
      console.log(`   Rôle: ${loginData.user?.role}`);
      
      // Vérifier les cookies
      const cookies = loginResponse.headers.get("set-cookie");
      if (cookies) {
        console.log("   ✓ Cookies reçus");
        if (cookies.includes("accessToken")) console.log("     - accessToken présent");
        if (cookies.includes("refreshToken")) console.log("     - refreshToken présent");
      } else {
        console.log("   ⚠ Aucun cookie reçu");
      }

      // Test 3: Vérifier /auth/me
      console.log("\n3. Vérification de /auth/me...");
      const meResponse = await fetch(`${API_URL}/auth/me`, {
        credentials: "include",
      });

      if (meResponse.ok) {
        const meData = await meResponse.json();
        console.log("   ✓ /auth/me fonctionne");
        console.log(`   Utilisateur: ${meData.user?.email}`);
      } else {
        const meError = await meResponse.json();
        console.log(`   ✗ /auth/me échoué: ${meError.message}`);
      }

    } else {
      console.log(`   ✗ Connexion échouée: ${loginData.message}`);
      console.log(`   Status: ${loginResponse.status}`);
    }

    // Test 4: Vérifier la normalisation de l'email
    console.log("\n4. Test de normalisation d'email...");
    const normalizedEmail = email.toLowerCase().trim();
    console.log(`   Email original: "${email}"`);
    console.log(`   Email normalisé: "${normalizedEmail}"`);
    
    if (email !== normalizedEmail) {
      console.log("   ⚠ L'email sera normalisé lors de la connexion");
    }

  } catch (error) {
    console.error("\n✗ Erreur:", error.message);
    if (error.message.includes("fetch")) {
      console.error("   Vérifiez que le serveur est démarré sur", API_URL);
    }
  }

  console.log("\n=== FIN DU TEST ===\n");
}

// Récupérer les arguments
const email = process.argv[2];
const password = process.argv[3];

if (!email || !password) {
  console.error("\n❌ ERREUR: Email et mot de passe requis");
  console.error("Usage: node test-auth.js <email> <password>");
  console.error("Exemple: node test-auth.js admin@bayanail.com votre_mot_de_passe\n");
  process.exit(1);
}

testAuth(email, password);

