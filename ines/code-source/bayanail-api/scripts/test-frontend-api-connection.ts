import dotenv from 'dotenv';

dotenv.config();

// Configuration
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';
const API_URL = process.env.API_URL || process.env.VITE_API_URL || 'http://localhost:3001';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@bayanail.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || process.env.UNIFORM_PASSWORD || 'lounes92';

interface TestResult {
  test: string;
  status: '✅' | '❌' | '⚠️';
  message: string;
  details?: any;
}

const results: TestResult[] = [];

function addResult(test: string, status: '✅' | '❌' | '⚠️', message: string, details?: any) {
  results.push({ test, status, message, details });
  console.log(`${status} ${test}: ${message}`);
}

// Simuler le comportement du navigateur avec gestion des cookies
class CookieJar {
  private cookies: Map<string, string> = new Map();

  parseCookies(setCookieHeader: string | null) {
    if (!setCookieHeader) return;
    
    const cookies = setCookieHeader.split(',').map(c => c.trim());
    cookies.forEach(cookie => {
      const [nameValue] = cookie.split(';');
      const [name, value] = nameValue.split('=');
      if (name && value) {
        this.cookies.set(name.trim(), value.trim());
      }
    });
  }

  getCookieString(): string {
    return Array.from(this.cookies.entries())
      .map(([name, value]) => `${name}=${value}`)
      .join('; ');
  }

  get(name: string): string | undefined {
    return this.cookies.get(name);
  }
}

async function testFrontendToApiConnection() {
  console.log('🔍 TEST CONNEXION FRONTEND → API');
  console.log('='.repeat(80));
  console.log(`Frontend URL: ${FRONTEND_URL}`);
  console.log(`API URL: ${API_URL}`);
  console.log(`Email: ${ADMIN_EMAIL}`);
  console.log(`Mot de passe: ***${ADMIN_PASSWORD.slice(-3)}`);
  console.log('');

  const cookieJar = new CookieJar();

  // Test 1: Vérifier que le frontend est accessible
  console.log('\n📋 TEST 1: Accessibilité du frontend\n');
  try {
    const frontendResponse = await fetch(FRONTEND_URL, {
      method: 'GET',
      signal: AbortSignal.timeout(5000)
    });
    
    if (frontendResponse.ok) {
      addResult('Frontend accessible', '✅', `Frontend répond (${frontendResponse.status})`);
    } else {
      addResult('Frontend accessible', '⚠️', `Frontend répond avec status ${frontendResponse.status}`);
    }
  } catch (error: any) {
    if (error.name === 'AbortError') {
      addResult('Frontend accessible', '❌', 'Timeout - Frontend non accessible');
    } else {
      addResult('Frontend accessible', '❌', `Erreur: ${error.message}`);
    }
    console.log('\n💡 Assurez-vous que le frontend est démarré: npm run dev');
    return;
  }

  // Test 2: Vérifier que l'API est accessible
  console.log('\n📋 TEST 2: Accessibilité de l\'API\n');
  try {
    const apiHealthResponse = await fetch(`${API_URL}/health`, {
      method: 'GET',
      signal: AbortSignal.timeout(5000)
    });
    
    if (apiHealthResponse.ok) {
      const healthData = await apiHealthResponse.json();
      addResult('API accessible', '✅', `API répond (${apiHealthResponse.status})`, healthData);
    } else {
      addResult('API accessible', '⚠️', `API répond avec status ${apiHealthResponse.status}`);
    }
  } catch (error: any) {
    if (error.name === 'AbortError') {
      addResult('API accessible', '❌', 'Timeout - API non accessible');
    } else {
      addResult('API accessible', '❌', `Erreur: ${error.message}`);
    }
    console.log('\n💡 Assurez-vous que l\'API est démarrée: cd bayanail-api && npm run dev');
    return;
  }

  // Test 3: Récupérer le token CSRF (comme le frontend le fait)
  console.log('\n📋 TEST 3: Récupération du token CSRF\n');
  let csrfToken: string | null = null;
  
  try {
    // Essayer depuis /auth/csrf-token
    const csrfResponse = await fetch(`${API_URL}/auth/csrf-token`, {
      method: 'GET',
      credentials: 'include',
      signal: AbortSignal.timeout(5000)
    });

    if (csrfResponse.ok) {
      const csrfData = await csrfResponse.json();
      csrfToken = csrfData.csrfToken || csrfResponse.headers.get('X-CSRF-Token');
      cookieJar.parseCookies(csrfResponse.headers.get('set-cookie'));
      
      if (csrfToken) {
        addResult('CSRF Token', '✅', 'Token CSRF récupéré', {
          token: `${csrfToken.substring(0, 20)}...${csrfToken.substring(csrfToken.length - 10)}`
        });
      } else {
        addResult('CSRF Token', '⚠️', 'Token CSRF non trouvé dans la réponse');
      }
    } else {
      // Essayer depuis /health
      const healthResponse = await fetch(`${API_URL}/health`, {
        method: 'GET',
        credentials: 'include',
        signal: AbortSignal.timeout(5000)
      });
      csrfToken = healthResponse.headers.get('X-CSRF-Token');
      cookieJar.parseCookies(healthResponse.headers.get('set-cookie'));
      
      if (csrfToken) {
        addResult('CSRF Token', '✅', 'Token CSRF récupéré depuis /health');
      } else {
        addResult('CSRF Token', '⚠️', 'Token CSRF non trouvé');
      }
    }
  } catch (error: any) {
    addResult('CSRF Token', '❌', `Erreur: ${error.message}`);
  }

  // Test 4: Test de connexion via le proxy Vite (simulation frontend)
  console.log('\n📋 TEST 4: Connexion via proxy Vite (simulation frontend)\n');
  
  try {
    const loginHeaders: HeadersInit = {
      'Content-Type': 'application/json'
    };
    
    if (csrfToken) {
      loginHeaders['X-CSRF-Token'] = csrfToken;
    }
    
    const cookieString = cookieJar.getCookieString();
    if (cookieString) {
      loginHeaders['Cookie'] = cookieString;
    }

    // Tester via le proxy Vite (si disponible)
    const proxyUrl = `${FRONTEND_URL}/auth/login`;
    const loginResponse = await fetch(proxyUrl, {
      method: 'POST',
      headers: loginHeaders,
      credentials: 'include',
      body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD }),
      signal: AbortSignal.timeout(10000)
    });

    cookieJar.parseCookies(loginResponse.headers.get('set-cookie'));

    if (loginResponse.ok) {
      const loginData = await loginResponse.json();
      addResult('Login via proxy', '✅', 'Connexion réussie via proxy Vite', {
        user: loginData.user?.email,
        role: loginData.user?.role
      });
    } else {
      const errorData = await loginResponse.json().catch(() => ({}));
      addResult('Login via proxy', '❌', `Échec: ${errorData.message || loginResponse.statusText}`, {
        status: loginResponse.status,
        error: errorData
      });
    }
  } catch (error: any) {
    if (error.name === 'AbortError') {
      addResult('Login via proxy', '❌', 'Timeout lors de la connexion');
    } else {
      addResult('Login via proxy', '❌', `Erreur: ${error.message}`);
    }
  }

  // Test 5: Test de connexion directe à l'API
  console.log('\n📋 TEST 5: Connexion directe à l\'API\n');
  
  try {
    const loginHeaders: HeadersInit = {
      'Content-Type': 'application/json'
    };
    
    if (csrfToken) {
      loginHeaders['X-CSRF-Token'] = csrfToken;
    }
    
    const cookieString = cookieJar.getCookieString();
    if (cookieString) {
      loginHeaders['Cookie'] = cookieString;
    }

    const directLoginResponse = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: loginHeaders,
      credentials: 'include',
      body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD }),
      signal: AbortSignal.timeout(10000)
    });

    cookieJar.parseCookies(directLoginResponse.headers.get('set-cookie'));

    if (directLoginResponse.ok) {
      const loginData = await directLoginResponse.json();
      addResult('Login direct API', '✅', 'Connexion réussie directement à l\'API', {
        user: loginData.user?.email,
        role: loginData.user?.role
      });
    } else {
      const errorData = await directLoginResponse.json().catch(() => ({}));
      addResult('Login direct API', '❌', `Échec: ${errorData.message || directLoginResponse.statusText}`, {
        status: directLoginResponse.status,
        error: errorData
      });
    }
  } catch (error: any) {
    if (error.name === 'AbortError') {
      addResult('Login direct API', '❌', 'Timeout lors de la connexion');
    } else {
      addResult('Login direct API', '❌', `Erreur: ${error.message}`);
    }
  }

  // Test 6: Vérifier la configuration de l'URL API dans le frontend
  console.log('\n📋 TEST 6: Configuration de l\'URL API\n');
  
  const expectedApiUrl = API_URL;
  addResult('Configuration API URL', '✅', `URL API configurée: ${expectedApiUrl}`, {
    frontendUrl: FRONTEND_URL,
    apiUrl: expectedApiUrl,
    note: 'Vérifiez que VITE_API_URL est correctement configuré dans .env'
  });

  // Test 7: Vérifier les endpoints disponibles
  console.log('\n📋 TEST 7: Vérification des endpoints\n');
  
  const endpoints = [
    '/health',
    '/auth/csrf-token',
    '/auth/login',
    '/offers',
  ];

  for (const endpoint of endpoints) {
    try {
      const response = await fetch(`${API_URL}${endpoint}`, {
        method: 'GET',
        signal: AbortSignal.timeout(5000)
      });
      
      if (response.ok || response.status === 401 || response.status === 403) {
        addResult(`Endpoint ${endpoint}`, '✅', `Accessible (${response.status})`);
      } else {
        addResult(`Endpoint ${endpoint}`, '⚠️', `Status ${response.status}`);
      }
    } catch (error: any) {
      addResult(`Endpoint ${endpoint}`, '❌', `Erreur: ${error.message}`);
    }
  }

  // Générer le rapport
  console.log('\n\n' + '='.repeat(80));
  console.log('📋 RAPPORT DE TEST FRONTEND → API');
  console.log('='.repeat(80));
  
  const successCount = results.filter(r => r.status === '✅').length;
  const warningCount = results.filter(r => r.status === '⚠️').length;
  const errorCount = results.filter(r => r.status === '❌').length;

  console.log(`\n✅ Succès: ${successCount}`);
  console.log(`⚠️  Avertissements: ${warningCount}`);
  console.log(`❌ Erreurs: ${errorCount}`);

  console.log('\n\n🔍 DÉTAILS DES TESTS:\n');
  results.forEach((result, index) => {
    console.log(`${index + 1}. ${result.status} ${result.test}`);
    console.log(`   ${result.message}`);
    if (result.details) {
      console.log(`   Détails:`, JSON.stringify(result.details, null, 2));
    }
    console.log('');
  });

  // Recommandations
  console.log('\n\n💡 RECOMMANDATIONS:\n');
  
  const errors = results.filter(r => r.status === '❌');
  if (errors.length > 0) {
    console.log('❌ PROBLÈMES IDENTIFIÉS:\n');
    errors.forEach((error, index) => {
      console.log(`${index + 1}. ${error.test}: ${error.message}`);
    });
    console.log('');
  }

  if (errors.some(e => e.test.includes('Frontend'))) {
    console.log('1. Démarrez le frontend: npm run dev');
  }
  
  if (errors.some(e => e.test.includes('API'))) {
    console.log('2. Démarrez l\'API: cd bayanail-api && npm run dev');
  }
  
  if (errors.some(e => e.test.includes('CSRF'))) {
    console.log('3. Vérifiez que le middleware CSRF est correctement configuré');
  }
  
  if (errors.some(e => e.test.includes('Login'))) {
    console.log('4. Vérifiez les identifiants dans .env');
    console.log(`   ADMIN_EMAIL="${ADMIN_EMAIL}"`);
    console.log(`   ADMIN_PASSWORD="***"`);
  }

  console.log('\n5. Vérifiez la configuration dans vite.config.ts');
  console.log('   Le proxy doit rediriger vers http://localhost:3001');
  
  console.log('\n6. Vérifiez la configuration dans src/lib/api/apiUrl.ts');
  console.log('   L\'URL de l\'API doit être correctement résolue');
}

testFrontendToApiConnection().catch((error) => {
  console.error('❌ Erreur fatale:', error);
  process.exit(1);
});

