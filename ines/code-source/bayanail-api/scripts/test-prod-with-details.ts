import dotenv from 'dotenv';

dotenv.config();

const PROD_API_URL = 'https://api.bayanail.com';

async function testWithDetails(email: string, password: string) {
  console.log('🔍 Test détaillé de connexion sur l\'API de PRODUCTION');
  console.log(`   URL: ${PROD_API_URL}/auth/login`);
  console.log(`   Email: ${email}`);
  console.log(`   Email normalisé: ${email.toLowerCase().trim()}`);
  console.log(`   Mot de passe: ${'*'.repeat(password.length)}`);
  console.log('─'.repeat(80));

  try {
    // Test de connexion
    const loginResponse = await fetch(`${PROD_API_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ email, password }),
    });

    console.log(`\n📊 Résultat:`);
    console.log(`   Status HTTP: ${loginResponse.status} ${loginResponse.statusText}`);
    
    const data = await loginResponse.json();
    console.log(`   Message: ${data.message || 'Aucun message'}`);
    
    if (loginResponse.ok && data.user) {
      console.log(`\n✅ Connexion réussie !`);
      console.log(`   ID: ${data.user.id}`);
      console.log(`   Email: ${data.user.email}`);
      console.log(`   Rôle: ${data.user.role}`);
      
      const cookies = loginResponse.headers.get('set-cookie');
      if (cookies) {
        console.log(`\n🍪 Cookies reçus:`);
        const hasAccessToken = cookies.includes('accessToken');
        const hasRefreshToken = cookies.includes('refreshToken');
        console.log(`   - accessToken: ${hasAccessToken ? '✅' : '❌'}`);
        console.log(`   - refreshToken: ${hasRefreshToken ? '✅' : '❌'}`);
      }
      
      return true;
    } else {
      console.log(`\n❌ Échec de la connexion`);
      console.log(`   Raison: ${data.message || 'Erreur inconnue'}`);
      
      if (loginResponse.status === 401) {
        console.log(`\n🔍 Analyse:`);
        console.log(`   - L'email ou le mot de passe est incorrect`);
        console.log(`   - OU l'utilisateur n'existe pas sur le serveur de production`);
        console.log(`   - Vérifiez que l'email est exactement: ${email.toLowerCase().trim()}`);
      }
      
      return false;
    }
  } catch (error: any) {
    console.log(`\n❌ Erreur: ${error.message}`);
    return false;
  }
}

async function main() {
  const args = process.argv.slice(2);
  
  if (args.length < 2) {
    console.log('Usage: npm run test:prod-details -- <email> <password>');
    process.exit(1);
  }

  const email = args[0];
  const password = args[1];

  await testWithDetails(email, password);
}

main().catch(console.error);

