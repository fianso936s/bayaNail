/**
 * Script d'analyse des logs
 * Détecte et classe les erreurs dans les logs backend, frontend et tests
 */

import * as fs from 'fs';
import * as path from 'path';
import { initLogger } from '../utils/logger';

export enum ErrorSeverity {
  CRITICAL = 'CRITICAL',
  MAJOR = 'MAJOR',
  MINOR = 'MINOR',
}

export interface DetectedError {
  id: string;
  severity: ErrorSeverity;
  category: string;
  message: string;
  source: string;
  file?: string;
  line?: number;
  timestamp: string;
  context?: Record<string, any>;
}

export interface ErrorAnalysis {
  timestamp: string;
  totalErrors: number;
  bySeverity: Record<ErrorSeverity, number>;
  byCategory: Record<string, number>;
  errors: DetectedError[];
}

export class LogAnalyzer {
  private logger: ReturnType<typeof initLogger>;
  private errors: DetectedError[] = [];
  private errorIdCounter = 0;

  constructor(logDir: string) {
    this.logger = initLogger(logDir, 'analysis');
  }

  /**
   * Analyse tous les logs dans un répertoire
   */
  analyzeLogs(logDir: string): ErrorAnalysis {
    this.logger.info('Démarrage de l\'analyse des logs', { logDir });

    // Analyser les logs backend
    const backendLogDir = path.join(logDir, 'backend');
    if (fs.existsSync(backendLogDir)) {
      this.analyzeBackendLogs(backendLogDir);
    }

    // Analyser les logs frontend
    const frontendLogDir = path.join(logDir, 'frontend');
    if (fs.existsSync(frontendLogDir)) {
      this.analyzeFrontendLogs(frontendLogDir);
    }

    // Analyser les logs de tests
    const testsLogDir = path.join(logDir, 'tests');
    if (fs.existsSync(testsLogDir)) {
      this.analyzeTestLogs(testsLogDir);
    }

    // Générer le rapport
    const analysis = this.generateAnalysis();

    this.logger.info('Analyse terminée', {
      totalErrors: analysis.totalErrors,
      critical: analysis.bySeverity[ErrorSeverity.CRITICAL],
      major: analysis.bySeverity[ErrorSeverity.MAJOR],
      minor: analysis.bySeverity[ErrorSeverity.MINOR],
    });

    return analysis;
  }

  /**
   * Analyse les logs backend
   */
  private analyzeBackendLogs(logDir: string): void {
    this.logger.debug('Analyse des logs backend', { logDir });

    const logFiles = [
      'server.log',
      'prisma.log',
      'errors.log',
      'backend-startup.log',
      'backend-startup-errors.log',
    ];

    for (const logFile of logFiles) {
      const filePath = path.join(logDir, logFile);
      if (fs.existsSync(filePath)) {
        this.parseBackendLogFile(filePath);
      }
    }
  }

  /**
   * Parse un fichier de log backend
   */
  private parseBackendLogFile(filePath: string): void {
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');

    for (const line of lines) {
      // Erreurs Prisma
      if (line.includes('Can\'t reach database server') || line.includes('P1001')) {
        this.addError({
          severity: ErrorSeverity.CRITICAL,
          category: 'database',
          message: 'Impossible de se connecter à la base de données',
          source: 'backend',
          file: path.basename(filePath),
          context: { line },
        });
      }

      if (line.includes('PrismaClientKnownRequestError') || line.includes('P2002')) {
        this.addError({
          severity: ErrorSeverity.MAJOR,
          category: 'database',
          message: 'Erreur Prisma: violation de contrainte unique',
          source: 'backend',
          file: path.basename(filePath),
          context: { line },
        });
      }

      // Erreurs Express
      if (line.includes('Cannot GET') || line.includes('Cannot POST') || line.includes('Cannot PUT') || line.includes('Cannot DELETE')) {
        const match = line.match(/Cannot (GET|POST|PUT|DELETE|PATCH) (.+)/);
        if (match) {
          this.addError({
            severity: ErrorSeverity.MAJOR,
            category: 'routing',
            message: `Route non trouvée: ${match[1]} ${match[2]}`,
            source: 'backend',
            file: path.basename(filePath),
            context: { method: match[1], route: match[2], line },
          });
        }
      }

      // Erreurs de validation Zod
      if (line.includes('ZodError') || line.includes('Validation error')) {
        this.addError({
          severity: ErrorSeverity.MAJOR,
          category: 'validation',
          message: 'Erreur de validation des données',
          source: 'backend',
          file: path.basename(filePath),
          context: { line },
        });
      }

      // Erreurs CORS
      if (line.includes('Not allowed by CORS') || line.includes('CORS')) {
        this.addError({
          severity: ErrorSeverity.MAJOR,
          category: 'cors',
          message: 'Erreur CORS détectée',
          source: 'backend',
          file: path.basename(filePath),
          context: { line },
        });
      }

      // Erreurs JWT/Auth
      if (line.includes('jwt') || line.includes('token') || line.includes('unauthorized') || line.includes('401')) {
        if (line.toLowerCase().includes('expired') || line.toLowerCase().includes('invalid')) {
          this.addError({
            severity: ErrorSeverity.MAJOR,
            category: 'authentication',
            message: 'Erreur d\'authentification JWT',
            source: 'backend',
            file: path.basename(filePath),
            context: { line },
          });
        }
      }

      // Erreurs critiques (serveur ne démarre pas)
      if (line.includes('EADDRINUSE') || line.includes('port already in use')) {
        this.addError({
          severity: ErrorSeverity.CRITICAL,
          category: 'server',
          message: 'Le port est déjà utilisé',
          source: 'backend',
          file: path.basename(filePath),
          context: { line },
        });
      }

      if (line.includes('ECONNREFUSED') || line.includes('connection refused')) {
        this.addError({
          severity: ErrorSeverity.CRITICAL,
          category: 'network',
          message: 'Connexion refusée',
          source: 'backend',
          file: path.basename(filePath),
          context: { line },
        });
      }
    }
  }

  /**
   * Analyse les logs frontend
   */
  private analyzeFrontendLogs(logDir: string): void {
    this.logger.debug('Analyse des logs frontend', { logDir });

    const logFiles = ['vite.log', 'build.log', 'errors.log', 'frontend-startup.log', 'frontend-startup-errors.log'];

    for (const logFile of logFiles) {
      const filePath = path.join(logDir, logFile);
      if (fs.existsSync(filePath)) {
        this.parseFrontendLogFile(filePath);
      }
    }
  }

  /**
   * Parse un fichier de log frontend
   */
  private parseFrontendLogFile(filePath: string): void {
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');

    for (const line of lines) {
      // Erreurs TypeScript
      if (line.includes('error TS') || line.includes('Type error')) {
        const match = line.match(/error TS(\d+):(.+)/);
        if (match) {
          this.addError({
            severity: ErrorSeverity.MAJOR,
            category: 'typescript',
            message: `Erreur TypeScript TS${match[1]}: ${match[2].substring(0, 100)}`,
            source: 'frontend',
            file: path.basename(filePath),
            context: { errorCode: match[1], details: match[2], line },
          });
        }
      }

      // Erreurs Vite
      if (line.includes('VITE') && (line.includes('error') || line.includes('failed'))) {
        this.addError({
          severity: ErrorSeverity.MAJOR,
          category: 'vite',
          message: 'Erreur Vite détectée',
          source: 'frontend',
          file: path.basename(filePath),
          context: { line },
        });
      }

      // Erreurs réseau
      if (line.includes('Failed to fetch') || line.includes('NetworkError') || line.includes('fetch failed')) {
        this.addError({
          severity: ErrorSeverity.MAJOR,
          category: 'network',
          message: 'Erreur réseau: impossible de contacter le serveur',
          source: 'frontend',
          file: path.basename(filePath),
          context: { line },
        });
      }

      // Erreurs CORS frontend
      if (line.includes('CORS') || line.includes('cross-origin')) {
        this.addError({
          severity: ErrorSeverity.MAJOR,
          category: 'cors',
          message: 'Erreur CORS côté frontend',
          source: 'frontend',
          file: path.basename(filePath),
          context: { line },
        });
      }

      // Erreurs d'import
      if (line.includes('Cannot find module') || line.includes('Module not found')) {
        const match = line.match(/Cannot find module ['"](.+)['"]/);
        if (match) {
          this.addError({
            severity: ErrorSeverity.MAJOR,
            category: 'import',
            message: `Module non trouvé: ${match[1]}`,
            source: 'frontend',
            file: path.basename(filePath),
            context: { module: match[1], line },
          });
        }
      }
    }
  }

  /**
   * Analyse les logs de tests
   */
  private analyzeTestLogs(logDir: string): void {
    this.logger.debug('Analyse des logs de tests', { logDir });

    // Analyser le fichier summary.json s'il existe
    const summaryPath = path.join(logDir, 'summary.json');
    if (fs.existsSync(summaryPath)) {
      try {
        const summary = JSON.parse(fs.readFileSync(summaryPath, 'utf8'));
        if (summary.failed > 0) {
          // Analyser les résultats échoués
          for (const result of summary.results || []) {
            if (!result.success) {
              this.addError({
                severity: ErrorSeverity.MAJOR,
                category: 'test',
                message: `Test échoué: ${result.module}.${result.functionName}`,
                source: 'tests',
                context: {
                  endpoint: result.endpoint,
                  method: result.method,
                  error: result.error,
                  statusCode: result.statusCode,
                },
              });
            }
          }
        }
      } catch (error: any) {
        this.logger.warn('Impossible de parser summary.json', { error: error.message });
      }
    }

    // Analyser les autres fichiers de log de tests
    const logFiles = ['endpoints.log', 'errors.log', 'tests-execution.log'];
    for (const logFile of logFiles) {
      const filePath = path.join(logDir, logFile);
      if (fs.existsSync(filePath)) {
        this.parseTestLogFile(filePath);
      }
    }
  }

  /**
   * Parse un fichier de log de tests
   */
  private parseTestLogFile(filePath: string): void {
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');

    for (const line of lines) {
      // Erreurs ApiError
      if (line.includes('ApiError') || line.includes('HTTP 4') || line.includes('HTTP 5')) {
        const match = line.match(/HTTP (\d+)/);
        if (match) {
          const statusCode = parseInt(match[1]);
          const severity = statusCode >= 500 ? ErrorSeverity.CRITICAL : ErrorSeverity.MAJOR;
          
          this.addError({
            severity,
            category: 'api',
            message: `Erreur API HTTP ${statusCode}`,
            source: 'tests',
            file: path.basename(filePath),
            context: { statusCode, line },
          });
        }
      }

      // Timeouts
      if (line.includes('timeout') || line.includes('ETIMEDOUT')) {
        this.addError({
          severity: ErrorSeverity.MAJOR,
          category: 'timeout',
          message: 'Timeout de requête détecté',
          source: 'tests',
          file: path.basename(filePath),
          context: { line },
        });
      }
    }
  }

  /**
   * Ajoute une erreur détectée
   */
  private addError(error: Omit<DetectedError, 'id' | 'timestamp'>): void {
    this.errorIdCounter++;
    this.errors.push({
      ...error,
      id: `ERR-${this.errorIdCounter}`,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Génère le rapport d'analyse
   */
  private generateAnalysis(): ErrorAnalysis {
    const bySeverity: Record<ErrorSeverity, number> = {
      [ErrorSeverity.CRITICAL]: 0,
      [ErrorSeverity.MAJOR]: 0,
      [ErrorSeverity.MINOR]: 0,
    };

    const byCategory: Record<string, number> = {};

    for (const error of this.errors) {
      bySeverity[error.severity]++;
      byCategory[error.category] = (byCategory[error.category] || 0) + 1;
    }

    return {
      timestamp: new Date().toISOString(),
      totalErrors: this.errors.length,
      bySeverity,
      byCategory,
      errors: this.errors,
    };
  }

  /**
   * Sauvegarde l'analyse
   */
  saveAnalysis(analysis: ErrorAnalysis, outputPath: string): void {
    fs.writeFileSync(outputPath, JSON.stringify(analysis, null, 2), 'utf8');
    this.logger.info(`Analyse sauvegardée: ${outputPath}`);
  }
}

// Point d'entrée
function main() {
  const logDir = process.argv.find((arg) => arg.startsWith('--logDir'))?.split('=')[1] ||
                 process.argv[2] ||
                 path.join(process.cwd(), 'logs', new Date().toISOString().replace(/:/g, '-'));

  if (!fs.existsSync(logDir)) {
    console.error(`Le répertoire de logs n'existe pas: ${logDir}`);
    process.exit(1);
  }

  const analysisLogDir = path.join(logDir, 'analysis');
  if (!fs.existsSync(analysisLogDir)) {
    fs.mkdirSync(analysisLogDir, { recursive: true });
  }

  const analyzer = new LogAnalyzer(analysisLogDir);
  const analysis = analyzer.analyzeLogs(logDir);

  // Sauvegarder l'analyse
  const errorsPath = path.join(analysisLogDir, 'errors-detected.json');
  analyzer.saveAnalysis(analysis, errorsPath);

  // Afficher le résumé
  console.log('\n=== Analyse des logs ===');
  console.log(`Total d'erreurs: ${analysis.totalErrors}`);
  console.log(`Critiques: ${analysis.bySeverity[ErrorSeverity.CRITICAL]}`);
  console.log(`Majeures: ${analysis.bySeverity[ErrorSeverity.MAJOR]}`);
  console.log(`Mineures: ${analysis.bySeverity[ErrorSeverity.MINOR]}`);
  console.log('\nPar catégorie:');
  Object.entries(analysis.byCategory).forEach(([category, count]) => {
    console.log(`  ${category}: ${count}`);
  });

  process.exit(analysis.totalErrors > 0 ? 1 : 0);
}

// Point d'entrée
main();

