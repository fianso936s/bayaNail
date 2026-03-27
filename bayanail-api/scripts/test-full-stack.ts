import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

// Configuration des URLs
const HOSTINGER_FRONTEND_URL = process.env.HOSTINGER_FRONTEND_URL || 'https://powderblue-turtle-426494.hostingersite.com';
const PROD_API_URL = process.env.PROD_API_URL || 'https://api.bayanail.com';
const LOCAL_API_URL = process.env.LOCAL_API_URL || 'http://localhost:3001';
const LOCAL_FRONTEND_URL = process.env.LOCAL_FRONTEND_URL || 'http://localhost:5173';

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@bayanail.com';
const ADMIN_PASSWORD = process.env.UNIFORM_PASSWORD || process.env.ADMIN_PASSWORD || 'lounes92';

interface TestResult {
  component: string;
  test: string;
  status: '✅' | '❌' | '⚠️';
  message: string;
  details?: any;
  duration?: number;
}

const results: TestResult[] = [];

function addResult(component: string, test: string, status: '✅' | '❌' | '⚠️', message: string, details?: any, duration?: number) {
  results.push({ component, test, status, message, details, duration });
  const durationStr = duration ? ` (${duration}ms)` : '';
  console.log(`${status} [${component}] ${test}: ${message}${durationStr}`);
}

async function testDatabaseConnection() {
  console.log('\n📊 TEST 1: Connexion à la base de données\n');
  const startTime = Date.now();
  
  try {
    await prisma.$connect();
    const duration = Date.now() - startTime;
    addResult('Database', 'Connexion', '✅', 'Connexion réussie', undefined, duration);
    
    // Test de lecture
    const userCount = await prisma.user.count();
    addResult('Database', 'Lecture', '✅', `${userCount} utilisateur(s) trouvé(s)`, { count: userCount });
    
    // Test d'écriture (lecture seule pour vérifier les permissions)
    const testUser = await prisma.user.findFirst();
    if (testUser) {
      addResult('Database', 'Permissions', '✅', 'Permissions de lecture OK');
    }
    
    return true;
  } catch (error: any) {
    const duration = Date.now() - startTime;
    addResult('Database', 'Connexion', '❌', `Erreur: ${error.message}`, error, duration);
    return false;
  }
}

async function testApiServer(url: string, name: string) {
  console.log(`\n🌐 TEST API: ${name} (${url})\n`);
  const startTime = Date.now();
  
  try {
    const healthResponse = await fetch(`${url}/health`, {
      method: 'GET',
      signal: AbortSignal.timeout(10000) // Timeout de 10 secondes
    });
    
    const duration = Date.now() - startTime;
    
    if (healthResponse.ok) {
      const healthData = await healthResponse.json();
      addResult(`API-${name}`, 'Health Check', '✅', 'Serveur accessible et répond', healthData, duration);
      return { success: true, url, cookies: null };
    } else {
      addResult(`API-${name}`, 'Health Check', '⚠️', `Serveur répond avec status ${healthResponse.status}`, undefined, duration);
      return { success: false, url, cookies: null };
    }
  } catch (error: any) {
    const duration = Date.now() - startTime;
    if (error.name === 'AbortError') {
      addResult(`API-${name}`, 'Health Check', '❌', 'Timeout - Serveur non accessible', { timeout: '10s' }, duration);
    } else {
      addResult(`API-${name}`, 'Health Check', '❌', `Serveur non accessible: ${error.message}`, error, duration);
    }
    return { success: false, url, cookies: null };
  }
}

async function testApiAuthentication(apiUrl: string, name: string) {
  console.log(`\n🔐 TEST Authentification: ${name}\n`);
  const startTime = Date.now();
  
  try {
    // Récupérer le token CSRF
    const csrfResponse = await fetch(`${apiUrl}/auth/csrf-token`, {
      method: 'GET',
      credentials: 'include',
      signal: AbortSignal.timeout(10000)
    });

    let csrfToken: string | null = null;
    if (csrfResponse.ok) {
      const csrfData = await csrfResponse.json();
      csrfToken = csrfData.csrfToken || csrfResponse.headers.get('X-CSRF-Token');
    } else {
      // Essayer depuis le health check
      const healthResponse = await fetch(`${apiUrl}/health`, {
        method: 'GET',
        credentials: 'include',
        signal: AbortSignal.timeout(10000)
      });
      csrfToken = healthResponse.headers.get('X-CSRF-Token');
    }

    if (!csrfToken) {
      addResult(`API-${name}`, 'CSRF Token', '⚠️', 'Impossible de récupérer le token CSRF');
    } else {
      addResult(`API-${name}`, 'CSRF Token', '✅', 'Token CSRF récupéré');
    }

    // Test de connexion
    const loginHeaders: HeadersInit = { 
      'Content-Type': 'application/json'
    };
    if (csrfToken) {
      loginHeaders['X-CSRF-Token'] = csrfToken;
    }

    const loginResponse = await fetch(`${apiUrl}/auth/login`, {
      method: 'POST',
      headers: loginHeaders,
      credentials: 'include',
      body: JSON.stringify({ 
        email: ADMIN_EMAIL, 
        password: ADMIN_PASSWORD 
      }),
      signal: AbortSignal.timeout(10000)
    });

    const duration = Date.now() - startTime;

    if (loginResponse.ok) {
      const loginData = await loginResponse.json();
      const cookies = loginResponse.headers.get('set-cookie');
      
      addResult(`API-${name}`, 'Login', '✅', 'Connexion réussie', {
        user: loginData.user?.email,
        role: loginData.user?.role
      }, duration);

      if (cookies) {
        addResult(`API-${name}`, 'Cookies', '✅', 'Cookies reçus');
        return { success: true, cookies, csrfToken };
      } else {
        addResult(`API-${name}`, 'Cookies', '⚠️', 'Aucun cookie reçu');
        return { success: true, cookies: null, csrfToken };
      }
    } else {
      const errorData = await loginResponse.json().catch(() => ({}));
      addResult(`API-${name}`, 'Login', '❌', `Échec: ${errorData.message || loginResponse.statusText}`, {
        status: loginResponse.status
      }, duration);
      return { success: false, cookies: null, csrfToken };
    }
  } catch (error: any) {
    const duration = Date.now() - startTime;
    if (error.name === 'AbortError') {
      addResult(`API-${name}`, 'Authentification', '❌', 'Timeout lors de l\'authentification', { timeout: '10s' }, duration);
    } else {
      addResult(`API-${name}`, 'Authentification', '❌', `Erreur: ${error.message}`, error, duration);
    }
    return { success: false, cookies: null, csrfToken: null };
  }
}

async function testApiDataRetrieval(apiUrl: string, name: string, cookies: string | null, csrfToken: string | null) {
  console.log(`\n📥 TEST Récupération données: ${name}\n`);
  
  try {
    const headers: HeadersInit = {};
    if (cookies) {
      headers['Cookie'] = cookies.split(',').map(c => c.trim().split(';')[0]).join('; ');
    }
    if (csrfToken) {
      headers['X-CSRF-Token'] = csrfToken;
    }

    // Test /me
    const meResponse = await fetch(`${apiUrl}/auth/me`, {
      method: 'GET',
      headers,
      credentials: 'include',
      signal: AbortSignal.timeout(10000)
    });

    if (meResponse.ok) {
      const meData = await meResponse.json();
      addResult(`API-${name}`, 'Récupération /me', '✅', 'Données utilisateur récupérées', {
        user: meData.user?.email
      });
    } else {
      addResult(`API-${name}`, 'Récupération /me', '⚠️', `Status ${meResponse.status}`);
    }

    // Test /offers
    const offersResponse = await fetch(`${apiUrl}/offers`, {
      method: 'GET',
      headers,
      credentials: 'include',
      signal: AbortSignal.timeout(10000)
    });

    if (offersResponse.ok) {
      const offersData = await offersResponse.json();
      const offersCount = Array.isArray(offersData) ? offersData.length : offersData.offers?.length || 0;
      addResult(`API-${name}`, 'Récupération /offers', '✅', `${offersCount} offre(s) récupérée(s)`, {
        count: offersCount
      });
    } else {
      addResult(`API-${name}`, 'Récupération /offers', '⚠️', `Status ${offersResponse.status}`);
    }
  } catch (error: any) {
    if (error.name === 'AbortError') {
      addResult(`API-${name}`, 'Récupération données', '❌', 'Timeout lors de la récupération');
    } else {
      addResult(`API-${name}`, 'Récupération données', '❌', `Erreur: ${error.message}`);
    }
  }
}

async function testFrontendConnection(frontendUrl: string, name: string) {
  console.log(`\n🎨 TEST Frontend: ${name} (${frontendUrl})\n`);
  const startTime = Date.now();
  
  try {
    const response = await fetch(frontendUrl, {
      method: 'GET',
      signal: AbortSignal.timeout(10000),
      redirect: 'follow'
    });
    
    const duration = Date.now() - startTime;
    
    if (response.ok || response.status === 200) {
      addResult(`Frontend-${name}`, 'Accessibilité', '✅', 'Frontend accessible', {
        status: response.status,
        contentType: response.headers.get('content-type')
      }, duration);
      return true;
    } else {
      addResult(`Frontend-${name}`, 'Accessibilité', '⚠️', `Status ${response.status}`, undefined, duration);
      return false;
    }
  } catch (error: any) {
    const duration = Date.now() - startTime;
    if (error.name === 'AbortError') {
      addResult(`Frontend-${name}`, 'Accessibilité', '❌', 'Timeout - Frontend non accessible', { timeout: '10s' }, duration);
    } else {
      addResult(`Frontend-${name}`, 'Accessibilité', '❌', `Erreur: ${error.message}`, error, duration);
    }
    return false;
  }
}

async function testFrontendApiCommunication(frontendUrl: string, apiUrl: string, name: string) {
  console.log(`\n🔗 TEST Communication Frontend ↔ API: ${name}\n`);
  
  try {
    // Simuler une requête depuis le frontend vers l'API
    // En production, le frontend devrait utiliser l'URL de l'API configurée
    const testResponse = await fetch(`${apiUrl}/health`, {
      method: 'GET',
      headers: {
        'Origin': frontendUrl,
        'Referer': frontendUrl
      },
      signal: AbortSignal.timeout(10000)
    });

    if (testResponse.ok) {
      addResult(`Frontend-${name}`, 'Communication API', '✅', 'Communication Frontend ↔ API OK', {
        cors: testResponse.headers.get('access-control-allow-origin')
      });
      return true;
    } else {
      addResult(`Frontend-${name}`, 'Communication API', '⚠️', `Status ${testResponse.status}`);
      return false;
    }
  } catch (error: any) {
    if (error.name === 'AbortError') {
      addResult(`Frontend-${name}`, 'Communication API', '❌', 'Timeout lors de la communication');
    } else {
      addResult(`Frontend-${name}`, 'Communication API', '❌', `Erreur: ${error.message}`);
    }
    return false;
  }
}

async function generateReport() {
  console.log('\n\n' + '='.repeat(80));
  console.log('📋 RAPPORT COMPLET DE TEST - HOSTINGER ↔ API ↔ DATABASE ↔ FRONTEND');
  console.log('='.repeat(80));
  
  const successCount = results.filter(r => r.status === '✅').length;
  const warningCount = results.filter(r => r.status === '⚠️').length;
  const errorCount = results.filter(r => r.status === '❌').length;

  console.log(`\n✅ Succès: ${successCount}`);
  console.log(`⚠️  Avertissements: ${warningCount}`);
  console.log(`❌ Erreurs: ${errorCount}`);

  // Résumé par composant
  console.log('\n\n📊 RÉSUMÉ PAR COMPOSANT:\n');
  const components = [...new Set(results.map(r => r.component))];
  components.forEach(component => {
    const componentResults = results.filter(r => r.component === component);
    const success = componentResults.filter(r => r.status === '✅').length;
    const total = componentResults.length;
    const status = success === total ? '✅' : success > 0 ? '⚠️' : '❌';
    console.log(`${status} ${component}: ${success}/${total} tests réussis`);
  });

  // Détails des tests
  console.log('\n\n🔍 DÉTAILS DES TESTS:\n');
  results.forEach((result, index) => {
    console.log(`${index + 1}. ${result.status} [${result.component}] ${result.test}`);
    console.log(`   ${result.message}`);
    if (result.duration) {
      console.log(`   Durée: ${result.duration}ms`);
    }
    if (result.details) {
      console.log(`   Détails:`, JSON.stringify(result.details, null, 2));
    }
    console.log('');
  });

  // Problèmes identifiés
  const problems = results.filter(r => r.status === '❌');
  if (problems.length > 0) {
    console.log('\n\n❌ PROBLÈMES IDENTIFIÉS:\n');
    problems.forEach((problem, index) => {
      console.log(`${index + 1}. [${problem.component}] ${problem.test}: ${problem.message}`);
    });
  }

  // Recommandations
  console.log('\n\n💡 RECOMMANDATIONS:\n');
  if (errorCount === 0 && warningCount === 0) {
    console.log('✅ Tous les composants fonctionnent correctement !');
    console.log('✅ La communication entre Hostinger, API, Base de données et Frontend est opérationnelle.');
  } else {
    if (problems.some(p => p.component.includes('Database'))) {
      console.log('1. Vérifiez la configuration DATABASE_URL dans le fichier .env');
      console.log('2. Vérifiez que la base de données est accessible depuis le serveur');
    }
    if (problems.some(p => p.component.includes('API-Production'))) {
      console.log('3. Vérifiez que l\'API de production est démarrée sur Hostinger');
      console.log('4. Vérifiez les logs de l\'application Node.js sur Hostinger');
    }
    if (problems.some(p => p.component.includes('API-Local'))) {
      console.log('5. Démarrez l\'API locale: cd bayanail-api && npm run dev');
    }
    if (problems.some(p => p.component.includes('Frontend'))) {
      console.log('6. Vérifiez que le frontend est déployé sur Hostinger');
      console.log('7. Vérifiez la configuration VITE_API_URL pour le frontend');
    }
  }
}

async function main() {
  console.log('🔍 TEST COMPLET - HOSTINGER ↔ API ↔ DATABASE ↔ FRONTEND');
  console.log('='.repeat(80));
  console.log(`Frontend Hostinger: ${HOSTINGER_FRONTEND_URL}`);
  console.log(`API Production: ${PROD_API_URL}`);
  console.log(`API Local: ${LOCAL_API_URL}`);
  console.log(`Frontend Local: ${LOCAL_FRONTEND_URL}`);
  console.log(`Admin Email: ${ADMIN_EMAIL}`);

  // Test 1: Base de données
  const dbOk = await testDatabaseConnection();

  // Test 2: API Production (Hostinger)
  const prodApiHealth = await testApiServer(PROD_API_URL, 'Production');
  let prodApiAuth = { success: false, cookies: null, csrfToken: null };
  if (prodApiHealth.success) {
    prodApiAuth = await testApiAuthentication(PROD_API_URL, 'Production');
    if (prodApiAuth.success && prodApiAuth.cookies) {
      await testApiDataRetrieval(PROD_API_URL, 'Production', prodApiAuth.cookies, prodApiAuth.csrfToken);
    }
  }

  // Test 3: API Local
  const localApiHealth = await testApiServer(LOCAL_API_URL, 'Local');
  let localApiAuth = { success: false, cookies: null, csrfToken: null };
  if (localApiHealth.success) {
    localApiAuth = await testApiAuthentication(LOCAL_API_URL, 'Local');
    if (localApiAuth.success && localApiAuth.cookies) {
      await testApiDataRetrieval(LOCAL_API_URL, 'Local', localApiAuth.cookies, localApiAuth.csrfToken);
    }
  }

  // Test 4: Frontend Hostinger
  const hostingerFrontendOk = await testFrontendConnection(HOSTINGER_FRONTEND_URL, 'Hostinger');
  if (hostingerFrontendOk) {
    await testFrontendApiCommunication(HOSTINGER_FRONTEND_URL, PROD_API_URL, 'Hostinger');
  }

  // Test 5: Frontend Local
  const localFrontendOk = await testFrontendConnection(LOCAL_FRONTEND_URL, 'Local');
  if (localFrontendOk) {
    await testFrontendApiCommunication(LOCAL_FRONTEND_URL, LOCAL_API_URL, 'Local');
  }

  // Générer le rapport
  await generateReport();

  await prisma.$disconnect();
}

main().catch((error) => {
  console.error('❌ Erreur fatale:', error);
  process.exit(1);
});

