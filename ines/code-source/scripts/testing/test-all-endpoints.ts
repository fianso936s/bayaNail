/**
 * Script de test complet de tous les endpoints API
 * Utilise les fonctions de src/lib/api pour tester chaque endpoint
 */

import * as path from 'path';
import * as fs from 'fs';
import { DependencyMapper } from '../utils/dependency-mapper';
import { initLogger, LogLevel } from '../utils/logger';

// Import dynamique des modules API
const rootDir = path.join(__dirname, '..', '..');
const apiModulePath = path.join(rootDir, 'src', 'lib', 'api.ts');

// Configuration
const API_BASE_URL = process.env.VITE_API_URL || 'http://localhost:3001';
const TEST_EMAIL = process.env.TEST_EMAIL || 'admin@bayanail.com';
const TEST_PASSWORD = process.env.TEST_PASSWORD || 'lounes92';

interface TestResult {
  module: string;
  functionName: string;
  endpoint: string;
  method: string;
  success: boolean;
  statusCode?: number;
  error?: string;
  duration: number;
  timestamp: string;
}

interface TestSummary {
  total: number;
  passed: number;
  failed: number;
  duration: number;
  results: TestResult[];
}

class EndpointTester {
  private logger: ReturnType<typeof initLogger>;
  private mapper: DependencyMapper;
  private results: TestResult[] = [];
  private authToken: string | null = null;
  private cookies: string[] = [];

  constructor(logDir: string) {
    this.logger = initLogger(logDir, 'tests');
    this.mapper = new DependencyMapper(rootDir);
  }

  /**
   * Authentification initiale
   */
  async authenticate(): Promise<boolean> {
    try {
      this.logger.info('Authentification...');
      
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: TEST_EMAIL,
          password: TEST_PASSWORD,
        }),
        credentials: 'include',
      });

      if (!response.ok) {
        const error = await response.text();
        this.logger.error('Échec de l\'authentification', undefined, { error });
        return false;
      }

      // Extraire les cookies
      const setCookieHeaders = response.headers.getSetCookie();
      this.cookies = setCookieHeaders;

      const data = await response.json();
      this.authToken = data.token || null;
      
      this.logger.info('Authentification réussie');
      return true;
    } catch (error: any) {
      this.logger.error('Erreur lors de l\'authentification', error);
      return false;
    }
  }

  /**
   * Teste une fonction API
   */
  async testFunction(
    module: string,
    funcName: string,
    endpoint: string,
    method: string,
    apiModule: any
  ): Promise<TestResult> {
    const startTime = Date.now();
    const result: TestResult = {
      module,
      functionName: funcName,
      endpoint,
      method,
      success: false,
      duration: 0,
      timestamp: new Date().toISOString(),
    };

    try {
      this.logger.debug(`Test de ${module}.${funcName}`, { endpoint, method });

      // Obtenir la fonction depuis le module
      let func: any;
      if (apiModule[`${module}Api`]) {
        func = apiModule[`${module}Api`][funcName];
      } else if (apiModule[funcName]) {
        func = apiModule[funcName];
      }

      if (!func) {
        throw new Error(`Fonction ${funcName} non trouvée dans le module ${module}`);
      }

      // Préparer les arguments mockés selon le type de fonction
      const args = this.getMockArguments(funcName, endpoint, method);

      // Exécuter la fonction
      const response = await func(...args);

      result.success = true;
      result.statusCode = 200;
      result.duration = Date.now() - startTime;

      this.logger.info(`✓ ${module}.${funcName} réussi`, {
        duration: result.duration,
      });
    } catch (error: any) {
      result.success = false;
      result.error = error.message || String(error);
      result.duration = Date.now() - startTime;

      // Extraire le code de statut si c'est une ApiError
      if (error.status) {
        result.statusCode = error.status;
      }

      this.logger.warn(`✗ ${module}.${funcName} échoué`, {
        error: result.error,
        duration: result.duration,
      });
    }

    return result;
  }

  /**
   * Génère des arguments mockés pour les fonctions
   */
  private getMockArguments(
    funcName: string,
    endpoint: string,
    method: string
  ): any[] {
    const args: any[] = [];

    // Arguments basés sur le nom de la fonction et l'endpoint
    if (endpoint.includes('{id}') || endpoint.includes('${id}')) {
      args.push('test-id-123');
    }

    if (method === 'POST' || method === 'PATCH' || method === 'PUT') {
      // Données mockées selon le type d'endpoint
      if (endpoint.includes('/auth/login')) {
        args.push({
          email: TEST_EMAIL,
          password: TEST_PASSWORD,
        });
      } else if (endpoint.includes('/auth/register')) {
        args.push({
          email: 'test@example.com',
          password: 'Test123!@#',
          firstName: 'Test',
          lastName: 'User',
        });
      } else if (endpoint.includes('/lessons')) {
        args.push({
          instructorId: 'test-instructor-id',
          studentId: 'test-student-id',
          vehicleId: 'test-vehicle-id',
          startTime: new Date().toISOString(),
          duration: 60,
        });
      } else if (endpoint.includes('/students')) {
        args.push({
          firstName: 'Test',
          lastName: 'Student',
          email: 'student@test.com',
          phone: '1234567890',
        });
      } else if (endpoint.includes('/instructors')) {
        args.push({
          firstName: 'Test',
          lastName: 'Instructor',
          email: 'instructor@test.com',
          phone: '1234567890',
        });
      } else if (endpoint.includes('/vehicles')) {
        args.push({
          brand: 'Test',
          model: 'Model',
          licensePlate: 'TEST-123',
        });
      } else if (endpoint.includes('/availability')) {
        args.push({
          instructorId: 'test-instructor-id',
          startTime: new Date().toISOString(),
          endTime: new Date(Date.now() + 3600000).toISOString(),
        });
      } else if (endpoint.includes('/contact')) {
        args.push({
          name: 'Test User',
          email: 'test@example.com',
          message: 'Test message',
        });
      } else {
        args.push({});
      }
    }

    // Arguments pour les fonctions avec filtres
    if (funcName === 'list' || funcName === 'getEvents') {
      if (funcName === 'getEvents') {
        args.push(new Date().toISOString());
        args.push(new Date(Date.now() + 86400000).toISOString());
        args.push({});
      } else {
        args.push({});
      }
    }

    return args;
  }

  /**
   * Teste tous les endpoints
   */
  async testAllEndpoints(): Promise<TestSummary> {
    const startTime = Date.now();
    this.logger.info('Démarrage des tests d\'endpoints');

    // Authentification
    const authenticated = await this.authenticate();
    if (!authenticated) {
      this.logger.error('Impossible de s\'authentifier. Les tests nécessitent une authentification.');
      throw new Error('Authentification échouée');
    }

    // Charger dynamiquement les modules API
    // Note: En TypeScript/Node, on doit utiliser require ou import dynamique
    let apiModules: any = {};
    try {
      // Essayer d'importer depuis le build ou utiliser eval (non recommandé mais nécessaire ici)
      const apiIndexPath = path.join(rootDir, 'src', 'lib', 'api.ts');
      if (fs.existsSync(apiIndexPath)) {
        // Pour les tests, on va directement appeler les fonctions via fetch
        // car l'import dynamique est complexe avec TypeScript compilé
        apiModules = {}; // Sera rempli par les appels directs
      }
    } catch (error: any) {
      this.logger.warn('Impossible de charger les modules API directement', { error: error.message });
    }

    // Obtenir la cartographie des dépendances
    const dependencyMap = this.mapper.mapDependencies();

    // Tester chaque fonction
    for (const module of dependencyMap.modules) {
      this.logger.info(`Test du module: ${module.name}`);

      for (const func of module.functions) {
        // Pour les tests, on va faire des appels HTTP directs
        // car on ne peut pas facilement importer les modules TypeScript compilés
        const result = await this.testEndpointDirectly(func);
        this.results.push(result);
      }
    }

    const duration = Date.now() - startTime;
    const summary: TestSummary = {
      total: this.results.length,
      passed: this.results.filter((r) => r.success).length,
      failed: this.results.filter((r) => !r.success).length,
      duration,
      results: this.results,
    };

    this.logger.info('Tests terminés', {
      total: summary.total,
      passed: summary.passed,
      failed: summary.failed,
      duration: `${duration}ms`,
    });

    return summary;
  }

  /**
   * Teste un endpoint directement via HTTP
   */
  private async testEndpointDirectly(func: {
    name: string;
    endpoint: string;
    method: string;
    module: string;
  }): Promise<TestResult> {
    const startTime = Date.now();
    const result: TestResult = {
      module: func.module,
      functionName: func.name,
      endpoint: func.endpoint,
      method: func.method,
      success: false,
      duration: 0,
      timestamp: new Date().toISOString(),
    };

    try {
      // Construire l'URL complète
      let url = `${API_BASE_URL}${func.endpoint}`;
      
      // Remplacer les placeholders
      url = url.replace('{id}', 'test-id-123');
      url = url.replace('${id}', 'test-id-123');

      // Préparer les options de requête
      const options: RequestInit = {
        method: func.method,
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      };

      // Ajouter les cookies d'authentification
      if (this.cookies.length > 0) {
        options.headers = {
          ...options.headers,
          Cookie: this.cookies.join('; '),
        };
      }

      // Ajouter le body pour POST/PATCH/PUT
      if (['POST', 'PATCH', 'PUT'].includes(func.method)) {
        const mockData = this.getMockDataForEndpoint(func.endpoint, func.method);
        options.body = JSON.stringify(mockData);
      }

      // Exécuter la requête
      const response = await fetch(url, options);
      result.statusCode = response.status;
      result.success = response.ok;

      if (!response.ok) {
        const errorText = await response.text();
        result.error = `HTTP ${response.status}: ${errorText.substring(0, 200)}`;
      }

      result.duration = Date.now() - startTime;
    } catch (error: any) {
      result.success = false;
      result.error = error.message || String(error);
      result.duration = Date.now() - startTime;
    }

    return result;
  }

  /**
   * Génère des données mockées pour un endpoint
   */
  private getMockDataForEndpoint(endpoint: string, method: string): any {
    if (endpoint.includes('/auth/login')) {
      return { email: TEST_EMAIL, password: TEST_PASSWORD };
    }
    if (endpoint.includes('/auth/register')) {
      return {
        email: 'test@example.com',
        password: 'Test123!@#',
        firstName: 'Test',
        lastName: 'User',
      };
    }
    if (endpoint.includes('/lessons')) {
      return {
        instructorId: 'test-instructor-id',
        studentId: 'test-student-id',
        vehicleId: 'test-vehicle-id',
        startTime: new Date().toISOString(),
        duration: 60,
      };
    }
    if (endpoint.includes('/students')) {
      return {
        firstName: 'Test',
        lastName: 'Student',
        email: 'student@test.com',
        phone: '1234567890',
      };
    }
    if (endpoint.includes('/instructors')) {
      return {
        firstName: 'Test',
        lastName: 'Instructor',
        email: 'instructor@test.com',
        phone: '1234567890',
      };
    }
    if (endpoint.includes('/vehicles')) {
      return {
        brand: 'Test',
        model: 'Model',
        licensePlate: 'TEST-123',
      };
    }
    if (endpoint.includes('/availability')) {
      return {
        instructorId: 'test-instructor-id',
        startTime: new Date().toISOString(),
        endTime: new Date(Date.now() + 3600000).toISOString(),
      };
    }
    if (endpoint.includes('/contact')) {
      return {
        name: 'Test User',
        email: 'test@example.com',
        message: 'Test message',
      };
    }
    return {};
  }

  /**
   * Sauvegarde le résumé des tests
   */
  saveSummary(summary: TestSummary, outputPath: string): void {
    fs.writeFileSync(outputPath, JSON.stringify(summary, null, 2), 'utf8');
    this.logger.info(`Résumé sauvegardé: ${outputPath}`);
  }
}

// Point d'entrée
async function main() {
  const logDir = process.argv[2] || path.join(rootDir, 'logs', new Date().toISOString().replace(/:/g, '-'), 'tests');
  
  // Créer le dossier de logs
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
  }

  const tester = new EndpointTester(logDir);
  
  try {
    const summary = await tester.testAllEndpoints();
    
    // Sauvegarder le résumé
    const summaryPath = path.join(logDir, 'summary.json');
    tester.saveSummary(summary, summaryPath);

    // Afficher le résumé
    console.log('\n=== Résumé des tests ===');
    console.log(`Total: ${summary.total}`);
    console.log(`Réussis: ${summary.passed}`);
    console.log(`Échoués: ${summary.failed}`);
    console.log(`Durée: ${summary.duration}ms`);

    // Afficher les échecs
    if (summary.failed > 0) {
      console.log('\n=== Tests échoués ===');
      summary.results
        .filter((r) => !r.success)
        .forEach((r) => {
          console.log(`✗ ${r.module}.${r.functionName}: ${r.error}`);
        });
    }

    process.exit(summary.failed > 0 ? 1 : 0);
  } catch (error: any) {
    console.error('Erreur lors de l\'exécution des tests:', error);
    process.exit(1);
  }
}

// Point d'entrée
main().catch((error) => {
  console.error('Erreur fatale:', error);
  process.exit(1);
});

