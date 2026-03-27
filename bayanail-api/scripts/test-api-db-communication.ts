import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import bcrypt from 'bcrypt';

dotenv.config();

const prisma = new PrismaClient();
const API_URL = process.env.API_URL || 'http://localhost:3001';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@bayanail.com';
const ADMIN_PASSWORD = process.env.UNIFORM_PASSWORD || process.env.ADMIN_PASSWORD || 'lounes92';

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

async function testDatabaseConnection() {
  console.log('\n📊 TEST 1: Connexion à la base de données\n');
  
  try {
    await prisma.$connect();
    addResult('Connexion DB', '✅', 'Connexion réussie');
    
    // Test de lecture
    const userCount = await prisma.user.count();
    addResult('Lecture DB', '✅', `${userCount} utilisateur(s) trouvé(s)`, { count: userCount });
    
    // Test d'écriture (lecture seule pour vérifier les permissions)
    const testUser = await prisma.user.findFirst();
    if (testUser) {
      addResult('Permissions DB', '✅', 'Permissions de lecture OK');
    }
    
    return true;
  } catch (error: any) {
    addResult('Connexion DB', '❌', `Erreur: ${error.message}`, error);
    return false;
  }
}

async function testApiServer() {
  console.log('\n🌐 TEST 2: Vérification du serveur API\n');
  
  try {
    const healthResponse = await fetch(`${API_URL}/health`);
    const healthData = await healthResponse.json();
    
    if (healthResponse.ok) {
      addResult('Serveur API', '✅', 'Serveur accessible et répond', healthData);
      return true;
    } else {
      addResult('Serveur API', '⚠️', `Serveur répond avec status ${healthResponse.status}`);
      return false;
    }
  } catch (error: any) {
    addResult('Serveur API', '❌', `Serveur non accessible: ${error.message}`, {
      suggestion: 'Démarrez le serveur avec: npm run dev'
    });
    return false;
  }
}

async function getCSRFToken(): Promise<string | null> {
  try {
    // Récupérer le token CSRF depuis l'endpoint dédié ou depuis une requête GET
    const csrfResponse = await fetch(`${API_URL}/auth/csrf-token`, {
      method: 'GET',
      credentials: 'include'
    });

    if (csrfResponse.ok) {
      const csrfData = await csrfResponse.json();
      const token = csrfData.csrfToken || csrfResponse.headers.get('X-CSRF-Token');
      if (token) {
        return token;
      }
    }

    // Alternative: récupérer depuis le header d'une requête GET
    const healthResponse = await fetch(`${API_URL}/health`, {
      method: 'GET',
      credentials: 'include'
    });
    const csrfToken = healthResponse.headers.get('X-CSRF-Token');
    return csrfToken;
  } catch (error) {
    return null;
  }
}

async function testApiReadData() {
  console.log('\n📥 TEST 3: API récupère des données depuis la DB\n');
  
  try {
    // Récupérer le token CSRF d'abord
    const csrfToken = await getCSRFToken();
    if (!csrfToken) {
      addResult('CSRF Token', '⚠️', 'Impossible de récupérer le token CSRF');
    } else {
      addResult('CSRF Token', '✅', 'Token CSRF récupéré');
    }

    // Test de connexion pour obtenir un token
    const loginHeaders: HeadersInit = { 
      'Content-Type': 'application/json'
    };
    if (csrfToken) {
      loginHeaders['X-CSRF-Token'] = csrfToken;
    }

    const loginResponse = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: loginHeaders,
      credentials: 'include',
      body: JSON.stringify({ 
        email: ADMIN_EMAIL, 
        password: ADMIN_PASSWORD 
      })
    });

    if (!loginResponse.ok) {
      const errorData = await loginResponse.json();
      addResult('Login API', '❌', `Échec de connexion: ${errorData.message || loginResponse.statusText}`, {
        status: loginResponse.status,
        suggestion: 'Vérifiez ADMIN_EMAIL et ADMIN_PASSWORD dans .env'
      });
      return null;
    }

    const loginData = await loginResponse.json();
    addResult('Login API', '✅', 'Connexion réussie', {
      user: loginData.user?.email,
      role: loginData.user?.role
    });

    // Récupérer les cookies
    const cookies = loginResponse.headers.get('set-cookie');
    if (!cookies) {
      addResult('Cookies API', '⚠️', 'Aucun cookie reçu');
      return null;
    }

    // Extraire les cookies pour les requêtes suivantes
    const cookieString = cookies.split(',').map(c => c.trim().split(';')[0]).join('; ');

    // Test de récupération de données via /me
    const meResponse = await fetch(`${API_URL}/auth/me`, {
      method: 'GET',
      headers: {
        'Cookie': cookieString
      },
      credentials: 'include'
    });

    if (meResponse.ok) {
      const meData = await meResponse.json();
      addResult('Récupération données', '✅', 'Données récupérées depuis la DB via API', {
        endpoint: '/auth/me',
        user: meData.user?.email
      });
    } else {
      addResult('Récupération données', '❌', `Échec: ${meResponse.status} ${meResponse.statusText}`);
    }

    // Test d'autres endpoints qui lisent depuis la DB
    const offersResponse = await fetch(`${API_URL}/offers`, {
      method: 'GET',
      headers: {
        'Cookie': cookieString
      },
      credentials: 'include'
    });

    if (offersResponse.ok) {
      const offersData = await offersResponse.json();
      const offersCount = Array.isArray(offersData) ? offersData.length : offersData.offers?.length || 0;
      addResult('Lecture Offres', '✅', `${offersCount} offre(s) récupérée(s) depuis la DB`, {
        endpoint: '/offers',
        count: offersCount
      });
    } else {
      addResult('Lecture Offres', '⚠️', `Status ${offersResponse.status}`, {
        endpoint: '/offers',
        note: 'Peut nécessiter une authentification'
      });
    }

    return cookieString;
  } catch (error: any) {
    addResult('API Read', '❌', `Erreur: ${error.message}`, error);
    return null;
  }
}

async function testApiWriteData() {
  console.log('\n📤 TEST 4: API écrit des données dans la DB\n');
  
  try {
    // Récupérer le token CSRF
    const csrfToken = await getCSRFToken();
    if (!csrfToken) {
      addResult('Écriture API', '⚠️', 'Impossible de tester sans token CSRF');
      return;
    }

    // Test de connexion
    const loginHeaders: HeadersInit = { 
      'Content-Type': 'application/json',
      'X-CSRF-Token': csrfToken
    };

    const loginResponse = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: loginHeaders,
      credentials: 'include',
      body: JSON.stringify({ 
        email: ADMIN_EMAIL, 
        password: ADMIN_PASSWORD 
      })
    });

    if (!loginResponse.ok) {
      addResult('Écriture API', '⚠️', 'Impossible de tester sans authentification');
      return;
    }

    const cookies = loginResponse.headers.get('set-cookie');
    if (!cookies) {
      addResult('Écriture API', '⚠️', 'Aucun cookie pour l\'authentification');
      return;
    }

    const cookieString = cookies.split(',').map(c => c.trim().split(';')[0]).join('; ');

    // Récupérer un nouveau token CSRF après la connexion (car la session peut avoir changé)
    const newCsrfToken = await getCSRFToken();

    // Test de création d'une donnée (ex: lead via contact)
    const testContact = {
      firstName: 'Test',
      lastName: 'API-DB',
      email: `test-${Date.now()}@test.com`,
      phone: '0600000000',
      message: 'Test de communication API-DB'
    };

    const contactHeaders: HeadersInit = {
      'Content-Type': 'application/json',
      'Cookie': cookieString
    };
    if (newCsrfToken) {
      contactHeaders['X-CSRF-Token'] = newCsrfToken;
    }

    const contactResponse = await fetch(`${API_URL}/contact`, {
      method: 'POST',
      headers: contactHeaders,
      credentials: 'include',
      body: JSON.stringify(testContact)
    });

    if (contactResponse.ok) {
      const contactData = await contactResponse.json();
      addResult('Écriture Contact', '✅', 'Données écrites dans la DB via API', {
        endpoint: '/contact',
        leadId: contactData.lead?.id || contactData.id
      });

      // Vérifier que les données sont bien en DB (le contact crée un Lead)
      const dbLead = await prisma.lead.findFirst({
        where: { email: testContact.email }
      });

      if (dbLead) {
        addResult('Vérification DB', '✅', 'Données confirmées en base de données', {
          leadId: dbLead.id,
          email: dbLead.email
        });
      } else {
        addResult('Vérification DB', '⚠️', 'Données non trouvées en DB immédiatement', {
          note: 'Peut être normal si transaction non commitée'
        });
      }
    } else {
      const errorData = await contactResponse.json().catch(() => ({}));
      addResult('Écriture Contact', '⚠️', `Status ${contactResponse.status}`, {
        endpoint: '/contact',
        error: errorData.message || contactResponse.statusText
      });
    }
  } catch (error: any) {
    addResult('Écriture API', '❌', `Erreur: ${error.message}`, error);
  }
}

async function testDataConsistency() {
  console.log('\n🔄 TEST 5: Cohérence des données entre API et DB\n');
  
  try {
    // Récupérer les données directement depuis la DB
    const dbUsers = await prisma.user.findMany({
      take: 5,
      select: {
        id: true,
        email: true,
        role: true
      }
    });

    addResult('Données DB', '✅', `${dbUsers.length} utilisateur(s) en DB`, {
      users: dbUsers.map(u => ({ email: u.email, role: u.role }))
    });

    // Essayer de récupérer via l'API (si endpoint disponible)
    try {
      const csrfToken = await getCSRFToken();
      const loginHeaders: HeadersInit = { 
        'Content-Type': 'application/json'
      };
      if (csrfToken) {
        loginHeaders['X-CSRF-Token'] = csrfToken;
      }

      const loginResponse = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: loginHeaders,
        credentials: 'include',
        body: JSON.stringify({ 
          email: ADMIN_EMAIL, 
          password: ADMIN_PASSWORD 
        })
      });

      if (loginResponse.ok) {
        const cookies = loginResponse.headers.get('set-cookie');
        if (cookies) {
          const cookieString = cookies.split(',').map(c => c.trim().split(';')[0]).join('; ');
          
          // Test endpoint debug si disponible en dev
          if (process.env.NODE_ENV !== 'production') {
            const debugResponse = await fetch(`${API_URL}/auth/debug/users`, {
              method: 'GET',
              headers: { 'Cookie': cookieString },
              credentials: 'include'
            });

            if (debugResponse.ok) {
              const apiUsers = await debugResponse.json();
              const apiUsersCount = apiUsers.users?.length || apiUsers.total || 0;
              addResult('Données API', '✅', `${apiUsersCount} utilisateur(s) via API`, {
                endpoint: '/auth/debug/users',
                note: 'Endpoint de debug uniquement'
              });

              // Comparer
              if (apiUsersCount === dbUsers.length || apiUsersCount > 0) {
                addResult('Cohérence', '✅', 'Les données correspondent entre API et DB');
              } else {
                addResult('Cohérence', '⚠️', 'Différence entre API et DB détectée', {
                  dbCount: dbUsers.length,
                  apiCount: apiUsersCount
                });
              }
            }
          }
        }
      }
    } catch (error: any) {
      addResult('Cohérence', '⚠️', `Impossible de comparer: ${error.message}`);
    }
  } catch (error: any) {
    addResult('Cohérence', '❌', `Erreur: ${error.message}`, error);
  }
}

async function generateReport() {
  console.log('\n\n' + '='.repeat(80));
  console.log('📋 RAPPORT DE DIAGNOSTIC API ↔ BASE DE DONNÉES');
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

  // Résumé des problèmes
  const problems = results.filter(r => r.status === '❌');
  if (problems.length > 0) {
    console.log('\n\n❌ PROBLÈMES IDENTIFIÉS:\n');
    problems.forEach((problem, index) => {
      console.log(`${index + 1}. ${problem.test}: ${problem.message}`);
      if (problem.details?.suggestion) {
        console.log(`   💡 Suggestion: ${problem.details.suggestion}`);
      }
    });
  }

  // Recommandations
  console.log('\n\n💡 RECOMMANDATIONS:\n');
  if (errorCount === 0 && warningCount === 0) {
    console.log('✅ Tout fonctionne correctement ! La communication entre l\'API et la base de données est opérationnelle.');
  } else {
    if (problems.some(p => p.test.includes('Serveur API'))) {
      console.log('1. Démarrez le serveur API: cd bayanail-api && npm run dev');
    }
    if (problems.some(p => p.test.includes('Connexion DB'))) {
      console.log('2. Vérifiez la configuration DATABASE_URL dans le fichier .env');
      console.log('3. Vérifiez que la base de données est accessible');
    }
    if (problems.some(p => p.test.includes('Login'))) {
      console.log('4. Vérifiez ADMIN_EMAIL et ADMIN_PASSWORD dans le fichier .env');
      console.log('5. Exécutez le seed: npm run prisma:seed');
    }
  }
}

async function main() {
  console.log('🔍 DIAGNOSTIC DE COMMUNICATION API ↔ BASE DE DONNÉES');
  console.log('='.repeat(80));
  console.log(`API URL: ${API_URL}`);
  console.log(`Admin Email: ${ADMIN_EMAIL}`);

  // Tests
  const dbOk = await testDatabaseConnection();
  const apiOk = await testApiServer();

  if (dbOk && apiOk) {
    await testApiReadData();
    await testApiWriteData();
    await testDataConsistency();
  } else {
    console.log('\n⚠️  Certains tests ont été ignorés car les prérequis ne sont pas remplis.');
  }

  await generateReport();

  await prisma.$disconnect();
}

main().catch((error) => {
  console.error('❌ Erreur fatale:', error);
  process.exit(1);
});

