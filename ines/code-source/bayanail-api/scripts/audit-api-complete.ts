import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import jwt from 'jsonwebtoken';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const prisma = new PrismaClient();

interface AuditResult {
  category: string;
  check: string;
  status: 'ok' | 'warning' | 'error';
  message: string;
  solution?: string;
}

interface AuditReport {
  timestamp: string;
  score: number;
  results: AuditResult[];
  summary: {
    ok: number;
    warnings: number;
    errors: number;
  };
}

const results: AuditResult[] = [];
const API_URL = process.env.API_URL || 'http://localhost:3001';

// Helper pour ajouter un résultat
function addResult(category: string, check: string, status: 'ok' | 'warning' | 'error', message: string, solution?: string) {
  results.push({ category, check, status, message, solution });
}

// A. Configuration et Variables d'Environnement
async function auditEnvironment() {
  console.log('\n📋 A. Configuration et Variables d\'Environnement\n');
  
  // Vérifier DATABASE_URL
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    addResult('Environment', 'DATABASE_URL', 'error', 'DATABASE_URL non définie', 'Définir DATABASE_URL dans .env');
  } else {
    if (dbUrl.includes('USER:PASSWORD') || dbUrl.includes('user:password')) {
      addResult('Environment', 'DATABASE_URL', 'error', 'DATABASE_URL contient des placeholders', 'Remplacer USER et PASSWORD par les vraies valeurs');
    } else if (dbUrl.match(/postgresql:\/\/[^:]+:[^@]+@/)) {
      addResult('Environment', 'DATABASE_URL', 'ok', 'DATABASE_URL correctement formatée');
    } else {
      addResult('Environment', 'DATABASE_URL', 'warning', 'Format DATABASE_URL suspect', 'Vérifier le format de l\'URL');
    }
  }

  // Vérifier JWT_SECRET
  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    addResult('Environment', 'JWT_SECRET', 'error', 'JWT_SECRET non défini', 'Définir JWT_SECRET dans .env');
  } else if (jwtSecret === 'access_secret' || jwtSecret.includes('change_me')) {
    addResult('Environment', 'JWT_SECRET', 'warning', 'JWT_SECRET utilise une valeur par défaut', 'Utiliser un secret unique et sécurisé');
  } else {
    addResult('Environment', 'JWT_SECRET', 'ok', 'JWT_SECRET configuré');
  }

  // Vérifier JWT_REFRESH_SECRET
  const jwtRefreshSecret = process.env.JWT_REFRESH_SECRET;
  if (!jwtRefreshSecret) {
    addResult('Environment', 'JWT_REFRESH_SECRET', 'error', 'JWT_REFRESH_SECRET non défini', 'Définir JWT_REFRESH_SECRET dans .env');
  } else if (jwtRefreshSecret === 'refresh_secret' || jwtRefreshSecret.includes('change_me')) {
    addResult('Environment', 'JWT_REFRESH_SECRET', 'warning', 'JWT_REFRESH_SECRET utilise une valeur par défaut', 'Utiliser un secret unique et sécurisé');
  } else {
    addResult('Environment', 'JWT_REFRESH_SECRET', 'ok', 'JWT_REFRESH_SECRET configuré');
  }

  // Vérifier FRONTEND_URL
  const frontendUrl = process.env.FRONTEND_URL;
  if (!frontendUrl) {
    addResult('Environment', 'FRONTEND_URL', 'warning', 'FRONTEND_URL non définie', 'Définir FRONTEND_URL pour CORS et redirections');
  } else {
    addResult('Environment', 'FRONTEND_URL', 'ok', `FRONTEND_URL définie: ${frontendUrl}`);
  }

  // Vérifier ADMIN_PASSWORD ou UNIFORM_PASSWORD
  const adminPassword = process.env.ADMIN_PASSWORD;
  const uniformPassword = process.env.UNIFORM_PASSWORD;
  if (!adminPassword && !uniformPassword) {
    addResult('Environment', 'ADMIN_PASSWORD', 'warning', 'Aucun mot de passe admin configuré', 'Définir ADMIN_PASSWORD ou UNIFORM_PASSWORD');
  } else if (adminPassword && adminPassword.includes('change_me')) {
    addResult('Environment', 'ADMIN_PASSWORD', 'warning', 'ADMIN_PASSWORD utilise une valeur par défaut', 'Remplacer par un mot de passe sécurisé');
  } else {
    addResult('Environment', 'ADMIN_PASSWORD', 'ok', 'Mot de passe admin configuré');
  }

  // Vérifier variables optionnelles
  if (process.env.STRIPE_SECRET_KEY) {
    if (process.env.STRIPE_SECRET_KEY.includes('...') || process.env.STRIPE_SECRET_KEY.includes('your_')) {
      addResult('Environment', 'STRIPE_SECRET_KEY', 'warning', 'STRIPE_SECRET_KEY contient des placeholders', 'Configurer une vraie clé Stripe');
    } else {
      addResult('Environment', 'STRIPE_SECRET_KEY', 'ok', 'STRIPE_SECRET_KEY configurée');
    }
  }

  if (process.env.RESEND_API_KEY) {
    if (process.env.RESEND_API_KEY.includes('...')) {
      addResult('Environment', 'RESEND_API_KEY', 'warning', 'RESEND_API_KEY contient des placeholders', 'Configurer une vraie clé Resend');
    } else {
      addResult('Environment', 'RESEND_API_KEY', 'ok', 'RESEND_API_KEY configurée');
    }
  }

  if (process.env.CRON_TOKEN) {
    if (process.env.CRON_TOKEN.includes('change_me')) {
      addResult('Environment', 'CRON_TOKEN', 'warning', 'CRON_TOKEN utilise une valeur par défaut', 'Utiliser un token aléatoire sécurisé');
    } else {
      addResult('Environment', 'CRON_TOKEN', 'ok', 'CRON_TOKEN configuré');
    }
  }
}

// B. Configuration CORS
async function auditCORS() {
  console.log('\n🌐 B. Configuration CORS\n');
  
  try {
    const indexPath = path.join(__dirname, '../src/index.ts');
    const indexContent = fs.readFileSync(indexPath, 'utf-8');
    
    // Vérifier les origines autorisées
    const allowedOriginsMatch = indexContent.match(/const allowedCorsOrigins[^=]+=\s*\[([^\]]+)\]/s);
    if (allowedOriginsMatch) {
      addResult('CORS', 'Allowed Origins', 'ok', 'Origines CORS configurées dans le code');
    } else {
      addResult('CORS', 'Allowed Origins', 'warning', 'Impossible de détecter les origines CORS', 'Vérifier la configuration CORS');
    }

    // Vérifier que FRONTEND_URL est ajoutée
    const frontendUrlCheck = indexContent.includes('FRONTEND_URL') && indexContent.includes('allowedCorsOrigins');
    if (frontendUrlCheck) {
      addResult('CORS', 'FRONTEND_URL Integration', 'ok', 'FRONTEND_URL est intégrée aux origines autorisées');
    } else {
      addResult('CORS', 'FRONTEND_URL Integration', 'warning', 'FRONTEND_URL pourrait ne pas être ajoutée automatiquement', 'Vérifier que FRONTEND_URL est bien utilisée');
    }

    // Vérifier credentials
    if (indexContent.includes('credentials: true')) {
      addResult('CORS', 'Credentials', 'ok', 'Credentials activés pour CORS');
    } else {
      addResult('CORS', 'Credentials', 'error', 'Credentials non activés', 'Activer credentials: true pour les cookies');
    }

    // Vérifier les méthodes autorisées
    if (indexContent.includes('methods:') && indexContent.includes('GET') && indexContent.includes('POST')) {
      addResult('CORS', 'Methods', 'ok', 'Méthodes HTTP configurées');
    } else {
      addResult('CORS', 'Methods', 'warning', 'Vérifier les méthodes HTTP autorisées');
    }

    // Test de requête CORS (si serveur disponible)
    try {
      const response = await fetch(`${API_URL}/health`, {
        method: 'GET',
        headers: {
          'Origin': 'http://localhost:5173'
        }
      });
      const corsHeader = response.headers.get('access-control-allow-origin');
      if (corsHeader) {
        addResult('CORS', 'CORS Headers', 'ok', 'Headers CORS présents dans les réponses');
      } else {
        addResult('CORS', 'CORS Headers', 'warning', 'Headers CORS non détectés', 'Vérifier que le serveur renvoie les headers CORS');
      }
    } catch (error: any) {
      addResult('CORS', 'CORS Test', 'warning', 'Impossible de tester CORS (serveur non disponible)', 'Démarrer le serveur pour tester CORS');
    }
  } catch (error: any) {
    addResult('CORS', 'CORS Configuration', 'error', `Erreur lors de l'analyse CORS: ${error.message}`);
  }
}

// C. Base de Données
async function auditDatabase() {
  console.log('\n🗄️  C. Base de Données\n');
  
  try {
    await prisma.$connect();
    addResult('Database', 'Connection', 'ok', 'Connexion à la base de données réussie');

    // Vérifier les utilisateurs
    const userCount = await prisma.user.count();
    if (userCount === 0) {
      addResult('Database', 'Users', 'warning', 'Aucun utilisateur dans la base', 'Exécuter npm run prisma:seed pour créer des utilisateurs');
    } else {
      addResult('Database', 'Users', 'ok', `${userCount} utilisateur(s) trouvé(s)`);
    }

    // Vérifier les admins
    const adminCount = await prisma.user.count({ where: { role: 'ADMIN' } });
    if (adminCount === 0) {
      addResult('Database', 'Admins', 'error', 'Aucun administrateur dans la base', 'Créer un admin avec ADMIN_PASSWORD dans .env');
    } else {
      addResult('Database', 'Admins', 'ok', `${adminCount} administrateur(s) trouvé(s)`);
    }

    // Vérifier les mots de passe des admins
    const admins = await prisma.user.findMany({
      where: { role: 'ADMIN' },
      select: { id: true, email: true, password: true }
    });

    for (const admin of admins) {
      if (!admin.password) {
        addResult('Database', `Admin ${admin.email}`, 'error', 'Admin sans mot de passe', 'Mettre à jour le mot de passe de l\'admin');
      } else {
        addResult('Database', `Admin ${admin.email}`, 'ok', 'Admin avec mot de passe');
      }
    }

    // Test de requête simple
    try {
      await prisma.user.findFirst();
      addResult('Database', 'Query Test', 'ok', 'Requêtes Prisma fonctionnelles');
    } catch (error: any) {
      addResult('Database', 'Query Test', 'error', `Erreur lors des requêtes: ${error.message}`);
    }

    // Vérifier les migrations
    try {
      const migrations = await prisma.$queryRaw`SELECT * FROM _prisma_migrations ORDER BY finished_at DESC LIMIT 1`;
      addResult('Database', 'Migrations', 'ok', 'Migrations Prisma détectées');
    } catch (error: any) {
      addResult('Database', 'Migrations', 'warning', 'Impossible de vérifier les migrations', 'Vérifier manuellement avec prisma migrate status');
    }
  } catch (error: any) {
    addResult('Database', 'Connection', 'error', `Erreur de connexion: ${error.message}`, 'Vérifier DATABASE_URL dans .env');
  }
}

// D. Rate Limiting
async function auditRateLimiting() {
  console.log('\n🚦 D. Rate Limiting\n');
  
  try {
    const indexPath = path.join(__dirname, '../src/index.ts');
    const indexContent = fs.readFileSync(indexPath, 'utf-8');
    
    // Vérifier la configuration globale
    const globalLimiterMatch = indexContent.match(/max:\s*(\d+)/);
    if (globalLimiterMatch) {
      const maxRequests = parseInt(globalLimiterMatch[1]);
      if (maxRequests === 100) {
        addResult('RateLimiting', 'Global Limit', 'ok', `Limite globale: ${maxRequests} requêtes/15min`);
      } else {
        addResult('RateLimiting', 'Global Limit', 'warning', `Limite globale: ${maxRequests} requêtes/15min`, 'Vérifier si cette limite est appropriée');
      }
    }

    // Vérifier la configuration auth
    const authRoutesPath = path.join(__dirname, '../src/routes/auth.routes.ts');
    if (fs.existsSync(authRoutesPath)) {
      const authContent = fs.readFileSync(authRoutesPath, 'utf-8');
      const authLimiterMatch = authContent.match(/max:\s*(\d+)/);
      if (authLimiterMatch) {
        const authMax = parseInt(authLimiterMatch[1]);
        if (authMax === 10) {
          addResult('RateLimiting', 'Auth Limit', 'ok', `Limite auth: ${authMax} tentatives/15min`);
        } else {
          addResult('RateLimiting', 'Auth Limit', 'warning', `Limite auth: ${authMax} tentatives/15min`);
        }
      }
    }
  } catch (error: any) {
    addResult('RateLimiting', 'Configuration', 'error', `Erreur: ${error.message}`);
  }
}

// E. Authentification et Autorisation
async function auditAuthentication() {
  console.log('\n🔐 E. Authentification et Autorisation\n');
  
  const jwtSecret = process.env.JWT_SECRET || 'access_secret';
  const jwtRefreshSecret = process.env.JWT_REFRESH_SECRET || 'refresh_secret';

  // Test de génération de token
  try {
    const testUser = { id: 'test', email: 'test@test.com', role: 'ADMIN' };
    const token = jwt.sign(testUser, jwtSecret, { expiresIn: '15m' });
    addResult('Authentication', 'Token Generation', 'ok', 'Génération de tokens JWT fonctionnelle');
    
    // Test de validation
    const decoded = jwt.verify(token, jwtSecret);
    if (decoded) {
      addResult('Authentication', 'Token Validation', 'ok', 'Validation de tokens JWT fonctionnelle');
    }
  } catch (error: any) {
    addResult('Authentication', 'Token Generation', 'error', `Erreur lors de la génération: ${error.message}`);
  }

  // Test de connexion complète (si serveur disponible)
  try {
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@bayanail.com';
    const adminPassword = process.env.UNIFORM_PASSWORD || process.env.ADMIN_PASSWORD || 'lounes92';
    
    const loginResponse = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: adminEmail, password: adminPassword })
    });

    if (loginResponse.ok) {
      const data = await loginResponse.json();
      if (data.user) {
        addResult('Authentication', 'Login API', 'ok', 'Connexion API réussie');
        
        // Test de /me avec cookies
        const cookies = loginResponse.headers.get('set-cookie');
        if (cookies) {
          addResult('Authentication', 'Cookies Set', 'ok', 'Cookies définis lors de la connexion');
          
          // Test /me - Extraire les cookies individuels
          const cookiePairs = cookies.split(',').map(c => c.trim().split(';')[0]);
          const cookieString = cookiePairs.join('; ');
          
          const meResponse = await fetch(`${API_URL}/auth/me`, {
            method: 'GET',
            headers: {
              'Cookie': cookieString
            }
          });
          
          if (meResponse.ok) {
            addResult('Authentication', 'Me Endpoint', 'ok', 'Endpoint /me accessible');
          } else {
            addResult('Authentication', 'Me Endpoint', 'error', `Endpoint /me retourne ${meResponse.status}`);
          }
        }
      }
    } else {
      addResult('Authentication', 'Login API', 'warning', `Login API retourne ${loginResponse.status}`, 'Vérifier les credentials');
    }
  } catch (error: any) {
    addResult('Authentication', 'Login API', 'warning', `Serveur non disponible: ${error.message}`, 'Démarrer le serveur pour tester');
  }
}

// F. Cookies
async function auditCookies() {
  console.log('\n🍪 F. Cookies\n');
  
  try {
    const authPath = path.join(__dirname, '../src/middleware/auth.ts');
    const authContent = fs.readFileSync(authPath, 'utf-8');
    
    // Vérifier secure
    if (authContent.includes('secure: process.env.NODE_ENV === "production"')) {
      addResult('Cookies', 'Secure Flag', 'ok', 'Secure flag configuré selon l\'environnement');
    } else {
      addResult('Cookies', 'Secure Flag', 'warning', 'Vérifier la configuration secure');
    }

    // Vérifier sameSite
    if (authContent.includes('sameSite: process.env.NODE_ENV === "production" ? "strict" : "lax"')) {
      addResult('Cookies', 'SameSite', 'ok', 'SameSite configuré selon l\'environnement');
    } else {
      addResult('Cookies', 'SameSite', 'warning', 'Vérifier la configuration sameSite');
    }

    // Vérifier httpOnly
    if (authContent.includes('httpOnly: true')) {
      addResult('Cookies', 'HttpOnly', 'ok', 'HttpOnly activé');
    } else {
      addResult('Cookies', 'HttpOnly', 'warning', 'HttpOnly devrait être activé pour la sécurité');
    }
  } catch (error: any) {
    addResult('Cookies', 'Configuration', 'error', `Erreur: ${error.message}`);
  }
}

// G. Middlewares de Sécurité
async function auditSecurity() {
  console.log('\n🛡️  G. Middlewares de Sécurité\n');
  
  try {
    const indexPath = path.join(__dirname, '../src/index.ts');
    const indexContent = fs.readFileSync(indexPath, 'utf-8');
    
    // Vérifier Helmet
    if (indexContent.includes('helmet')) {
      if (indexContent.includes('crossOriginResourcePolicy')) {
        addResult('Security', 'Helmet', 'ok', 'Helmet configuré avec crossOriginResourcePolicy');
      } else {
        addResult('Security', 'Helmet', 'warning', 'Helmet présent mais configuration à vérifier');
      }
    } else {
      addResult('Security', 'Helmet', 'error', 'Helmet non détecté', 'Installer et configurer Helmet');
    }

    // Vérifier HPP
    if (indexContent.includes('hpp')) {
      addResult('Security', 'HPP', 'ok', 'HPP (HTTP Parameter Pollution) activé');
    } else {
      addResult('Security', 'HPP', 'warning', 'HPP non détecté', 'Installer HPP pour la sécurité');
    }

    // Vérifier la limite de payload
    const payloadLimitMatch = indexContent.match(/limit:\s*["']([^"']+)["']/);
    if (payloadLimitMatch) {
      const limit = payloadLimitMatch[1];
      addResult('Security', 'Payload Limit', 'ok', `Limite de payload: ${limit}`);
    } else {
      addResult('Security', 'Payload Limit', 'warning', 'Limite de payload non détectée', 'Configurer une limite pour éviter les attaques DoS');
    }
  } catch (error: any) {
    addResult('Security', 'Configuration', 'error', `Erreur: ${error.message}`);
  }
}

// H. Serveur API
async function auditServer() {
  console.log('\n🖥️  H. Serveur API\n');
  
  try {
    const healthResponse = await fetch(`${API_URL}/health`);
    if (healthResponse.ok) {
      addResult('Server', 'Health Endpoint', 'ok', 'Endpoint /health accessible');
    } else {
      addResult('Server', 'Health Endpoint', 'error', `Endpoint /health retourne ${healthResponse.status}`);
    }
  } catch (error: any) {
    addResult('Server', 'Health Endpoint', 'error', `Serveur non accessible: ${error.message}`, 'Démarrer le serveur avec npm run dev');
  }

  try {
    const rootResponse = await fetch(`${API_URL}/`);
    if (rootResponse.ok) {
      addResult('Server', 'Root Endpoint', 'ok', 'Endpoint racine accessible');
    } else {
      addResult('Server', 'Root Endpoint', 'warning', `Endpoint racine retourne ${rootResponse.status}`);
    }
  } catch (error: any) {
    addResult('Server', 'Root Endpoint', 'error', `Serveur non accessible: ${error.message}`);
  }

  // Vérifier le port
  const port = process.env.PORT || '3001';
  addResult('Server', 'Port', 'ok', `Port configuré: ${port}`);
}

// I. Socket.io
async function auditSocketIO() {
  console.log('\n🔌 I. Socket.io\n');
  
  try {
    const socketPath = path.join(__dirname, '../src/lib/socket.ts');
    if (fs.existsSync(socketPath)) {
      const socketContent = fs.readFileSync(socketPath, 'utf-8');
      
      if (socketContent.includes('cors')) {
        addResult('SocketIO', 'CORS Configuration', 'ok', 'CORS configuré pour Socket.io');
      } else {
        addResult('SocketIO', 'CORS Configuration', 'warning', 'CORS non détecté pour Socket.io', 'Configurer CORS pour Socket.io');
      }

      if (socketContent.includes('FRONTEND_URL')) {
        addResult('SocketIO', 'Frontend URL', 'ok', 'FRONTEND_URL utilisé pour Socket.io');
      }
    } else {
      addResult('SocketIO', 'Configuration', 'warning', 'Fichier socket.ts non trouvé');
    }
  } catch (error: any) {
    addResult('SocketIO', 'Configuration', 'error', `Erreur: ${error.message}`);
  }
}

// J. Tests de Connexion Réels
async function auditIntegration() {
  console.log('\n🔗 J. Tests de Connexion Réels\n');
  
  try {
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@bayanail.com';
    const adminPassword = process.env.UNIFORM_PASSWORD || process.env.ADMIN_PASSWORD || 'lounes92';

    // Test de login
    const loginResponse = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: adminEmail, password: adminPassword })
    });

    if (loginResponse.ok) {
      const data = await loginResponse.json();
      if (data.user) {
        addResult('Integration', 'Login Flow', 'ok', 'Flux de connexion complet fonctionnel');
        
        // Test refresh token
        const cookies = loginResponse.headers.get('set-cookie');
        if (cookies) {
          if (cookies.includes('refreshToken')) {
            addResult('Integration', 'Refresh Token', 'ok', 'Refresh token présent dans les cookies');
          } else {
            addResult('Integration', 'Refresh Token', 'warning', 'Refresh token non trouvé dans les cookies');
          }
        } else {
          addResult('Integration', 'Refresh Token', 'error', 'Aucun cookie reçu');
        }
      }
    } else {
      const errorText = await loginResponse.text();
      addResult('Integration', 'Login Flow', 'error', `Échec de connexion: ${loginResponse.status}`, 'Vérifier les credentials et la base de données');
    }
  } catch (error: any) {
    addResult('Integration', 'Login Flow', 'warning', `Serveur non disponible: ${error.message}`, 'Démarrer le serveur pour tester');
  }
}

// Générer le rapport
function generateReport(): AuditReport {
  const ok = results.filter(r => r.status === 'ok').length;
  const warnings = results.filter(r => r.status === 'warning').length;
  const errors = results.filter(r => r.status === 'error').length;
  const total = results.length;
  
  const score = total > 0 ? Math.round(((ok * 1 + warnings * 0.5) / total) * 100) : 0;

  return {
    timestamp: new Date().toISOString(),
    score,
    results,
    summary: { ok, warnings, errors }
  };
}

// Afficher le résumé
function displaySummary(report: AuditReport) {
  console.log('\n\n' + '='.repeat(80));
  console.log('📊 RÉSUMÉ DE L\'AUDIT');
  console.log('='.repeat(80));
  console.log(`\nScore Global: ${report.score}/100\n`);
  
  const categories = [...new Set(results.map(r => r.category))];
  for (const category of categories) {
    const categoryResults = results.filter(r => r.category === category);
    const categoryOk = categoryResults.filter(r => r.status === 'ok').length;
    const categoryWarnings = categoryResults.filter(r => r.status === 'warning').length;
    const categoryErrors = categoryResults.filter(r => r.status === 'error').length;
    
    let icon = '✅';
    if (categoryErrors > 0) icon = '❌';
    else if (categoryWarnings > 0) icon = '⚠️';
    
    console.log(`${icon} ${category}: ${categoryOk} OK, ${categoryWarnings} avertissements, ${categoryErrors} erreurs`);
  }
  
  console.log(`\nTotal: ${report.summary.ok} OK, ${report.summary.warnings} avertissements, ${report.summary.errors} erreurs\n`);
  
  // Afficher les erreurs critiques
  const errors = results.filter(r => r.status === 'error');
  if (errors.length > 0) {
    console.log('🔴 Problèmes critiques:');
    errors.forEach((error, index) => {
      console.log(`   ${index + 1}. ${error.check}: ${error.message}`);
      if (error.solution) {
        console.log(`      💡 Solution: ${error.solution}`);
      }
    });
    console.log('');
  }
  
  // Afficher les avertissements
  const warnings = results.filter(r => r.status === 'warning');
  if (warnings.length > 0) {
    console.log('⚠️  Avertissements:');
    warnings.slice(0, 5).forEach((warning, index) => {
      console.log(`   ${index + 1}. ${warning.check}: ${warning.message}`);
    });
    if (warnings.length > 5) {
      console.log(`   ... et ${warnings.length - 5} autres avertissements`);
    }
    console.log('');
  }
}

// Générer le rapport Markdown
function generateMarkdownReport(report: AuditReport): string {
  const timestamp = new Date(report.timestamp).toLocaleString('fr-FR');
  
  let markdown = `# Rapport d'Audit - Communication API\n\n`;
  markdown += `**Date:** ${timestamp}\n`;
  markdown += `**Score Global:** ${report.score}/100\n\n`;
  markdown += `---\n\n`;
  
  markdown += `## Résumé Exécutif\n\n`;
  markdown += `- ✅ **OK:** ${report.summary.ok}\n`;
  markdown += `- ⚠️  **Avertissements:** ${report.summary.warnings}\n`;
  markdown += `- ❌ **Erreurs:** ${report.summary.errors}\n\n`;
  
  const categories = [...new Set(results.map(r => r.category))];
  
  for (const category of categories) {
    markdown += `## ${category}\n\n`;
    const categoryResults = results.filter(r => r.category === category);
    
    for (const result of categoryResults) {
      const icon = result.status === 'ok' ? '✅' : result.status === 'warning' ? '⚠️' : '❌';
      markdown += `### ${icon} ${result.check}\n\n`;
      markdown += `**Statut:** ${result.status}\n\n`;
      markdown += `**Message:** ${result.message}\n\n`;
      if (result.solution) {
        markdown += `**Solution:** ${result.solution}\n\n`;
      }
    }
  }
  
  markdown += `---\n\n`;
  markdown += `**Rapport généré automatiquement par audit-api-complete.ts**\n`;
  
  return markdown;
}

// Fonction principale
async function main() {
  console.log('='.repeat(80));
  console.log('🔍 AUDIT COMPLET DE LA COMMUNICATION API');
  console.log('='.repeat(80));
  
  await auditEnvironment();
  await auditCORS();
  await auditDatabase();
  await auditRateLimiting();
  await auditAuthentication();
  await auditCookies();
  await auditSecurity();
  await auditServer();
  await auditSocketIO();
  await auditIntegration();
  
  const report = generateReport();
  displaySummary(report);
  
  // Générer le rapport Markdown
  const markdownReport = generateMarkdownReport(report);
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
  const reportPath = path.join(__dirname, `../AUDIT-API-${timestamp}.md`);
  fs.writeFileSync(reportPath, markdownReport, 'utf-8');
  
  console.log(`📄 Rapport détaillé: ${reportPath}\n`);
  
  // Nettoyer Prisma
  await prisma.$disconnect();
  
  // Exit code basé sur les erreurs
  process.exit(report.summary.errors > 0 ? 1 : 0);
}

main().catch((error) => {
  console.error('❌ Erreur fatale:', error);
  process.exit(1);
});

