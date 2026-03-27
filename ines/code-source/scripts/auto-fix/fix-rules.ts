/**
 * Règles de correction pour chaque type d'erreur
 */

import * as fs from 'fs';
import * as path from 'path';
import { DetectedError, ErrorSeverity } from '../analysis/analyze-logs';

export interface FixSuggestion {
  errorId: string;
  type: 'automatic' | 'suggestion';
  description: string;
  file?: string;
  action: string;
  code?: string;
  patch?: string;
}

export interface FixRule {
  category: string;
  pattern: RegExp | string;
  severity: ErrorSeverity[];
  canAutoFix: boolean;
  fix: (error: DetectedError, rootDir: string) => FixSuggestion | null;
}

export class FixRules {
  private rootDir: string;

  constructor(rootDir: string) {
    this.rootDir = rootDir;
  }

  /**
   * Règle 1: Erreurs de connexion DB
   */
  private fixDatabaseConnection(error: DetectedError, rootDir: string): FixSuggestion | null {
    const envFile = path.join(rootDir, 'bayanail-api', '.env');
    const envExampleFile = path.join(rootDir, 'bayanail-api', 'env.example');

    if (!fs.existsSync(envFile)) {
      // Créer le fichier .env depuis env.example
      if (fs.existsSync(envExampleFile)) {
        return {
          errorId: error.id,
          type: 'automatic',
          description: 'Créer le fichier .env depuis env.example',
          file: envFile,
          action: 'create_env_file',
          code: `cp ${envExampleFile} ${envFile}`,
        };
      } else {
        return {
          errorId: error.id,
          type: 'suggestion',
          description: 'Le fichier .env est manquant. Créez-le avec DATABASE_URL configuré.',
          action: 'create_env_manually',
        };
      }
    }

    // Vérifier si DATABASE_URL est défini
    const envContent = fs.readFileSync(envFile, 'utf8');
    if (!envContent.includes('DATABASE_URL')) {
      return {
        errorId: error.id,
        type: 'suggestion',
        description: 'DATABASE_URL manquant dans .env',
        file: envFile,
        action: 'add_database_url',
        code: 'DATABASE_URL="postgresql://user:password@localhost:5432/bayanail"',
      };
    }

    return {
      errorId: error.id,
      type: 'suggestion',
      description: 'Vérifiez que DATABASE_URL est correct et que la base de données est accessible',
      action: 'check_database_connection',
    };
  }

  /**
   * Règle 2: Erreurs CORS
   */
  private fixCorsError(error: DetectedError, rootDir: string): FixSuggestion | null {
    const indexFile = path.join(rootDir, 'bayanail-api', 'src', 'index.ts');
    
    if (!fs.existsSync(indexFile)) {
      return null;
    }

    const content = fs.readFileSync(indexFile, 'utf8');
    
    // Extraire l'origine depuis le contexte si disponible
    const origin = error.context?.origin || 'http://localhost:5173';
    
    // Vérifier si l'origine est déjà dans la liste
    if (content.includes(origin)) {
      return {
        errorId: error.id,
        type: 'suggestion',
        description: `L'origine ${origin} est déjà dans la liste CORS. Vérifiez la configuration CORS.`,
        action: 'check_cors_config',
      };
    }

    // Trouver la ligne allowedCorsOrigins
    const lines = content.split('\n');
    const corsStartIndex = lines.findIndex((line) => line.includes('allowedCorsOrigins'));
    
    if (corsStartIndex === -1) {
      return null;
    }

    // Trouver la ligne où ajouter la nouvelle origine (après le dernier élément du tableau)
    let insertIndex = corsStartIndex + 1;
    while (insertIndex < lines.length && !lines[insertIndex].includes('];')) {
      insertIndex++;
    }

    if (insertIndex >= lines.length) {
      return null;
    }

    const indent = lines[insertIndex - 1].match(/^\s*/)?.[0] || '  ';
    const newLine = `${indent}"${origin}",`;

    return {
      errorId: error.id,
      type: 'automatic',
      description: `Ajouter l'origine ${origin} à la liste CORS`,
      file: indexFile,
      action: 'add_cors_origin',
      code: newLine,
      patch: `--- a/${indexFile}\n+++ b/${indexFile}\n@@ -${insertIndex},0 +${insertIndex},1 @@\n${newLine}`,
    };
  }

  /**
   * Règle 3: Erreurs de validation Zod
   */
  private fixZodValidationError(error: DetectedError, rootDir: string): FixSuggestion | null {
    return {
      errorId: error.id,
      type: 'suggestion',
      description: 'Vérifiez les données envoyées correspondent au schéma Zod attendu. Consultez les logs pour les champs manquants ou invalides.',
      action: 'check_validation_schema',
    };
  }

  /**
   * Règle 4: Erreurs de routes 404
   */
  private fixRoute404Error(error: DetectedError, rootDir: string): FixSuggestion | null {
    const method = error.context?.method || 'GET';
    const route = error.context?.route || '';

    if (!route) {
      return null;
    }

    // Chercher dans les fichiers de routes
    const routesDir = path.join(rootDir, 'bayanail-api', 'src', 'routes');
    if (!fs.existsSync(routesDir)) {
      return null;
    }

    const routeFiles = fs.readdirSync(routesDir).filter((f) => f.endsWith('.routes.ts'));
    
    // Essayer de deviner le fichier de route basé sur le chemin
    const routePrefix = route.split('/')[1];
    const possibleRouteFile = routeFiles.find((f) => f.includes(routePrefix));

    if (possibleRouteFile) {
      return {
        errorId: error.id,
        type: 'suggestion',
        description: `La route ${method} ${route} n'existe pas. Vérifiez le fichier ${possibleRouteFile}`,
        file: path.join(routesDir, possibleRouteFile),
        action: 'check_route_exists',
      };
    }

    return {
      errorId: error.id,
      type: 'suggestion',
      description: `La route ${method} ${route} n'existe pas. Vous devez l'ajouter dans le fichier de routes approprié.`,
      action: 'add_missing_route',
    };
  }

  /**
   * Règle 5: Erreurs TypeScript frontend
   */
  private fixTypeScriptError(error: DetectedError, rootDir: string): FixSuggestion | null {
    const errorCode = error.context?.errorCode;
    const details = error.context?.details || '';

    // TS2307: Cannot find module
    if (errorCode === '2307') {
      const match = details.match(/Cannot find module ['"](.+)['"]/);
      if (match) {
        const moduleName = match[1];
        return {
          errorId: error.id,
          type: 'suggestion',
          description: `Module non trouvé: ${moduleName}. Vérifiez l'import ou installez le package.`,
          action: 'fix_missing_module',
          code: `npm install ${moduleName}`,
        };
      }
    }

    // TS2322: Type error
    if (errorCode === '2322') {
      return {
        errorId: error.id,
        type: 'suggestion',
        description: 'Erreur de type TypeScript. Vérifiez les types des variables.',
        action: 'fix_type_error',
      };
    }

    // TS2304: Cannot find name
    if (errorCode === '2304') {
      const match = details.match(/Cannot find name ['"](.+)['"]/);
      if (match) {
        return {
          errorId: error.id,
          type: 'suggestion',
          description: `Variable non définie: ${match[1]}. Vérifiez l'import ou la déclaration.`,
          action: 'fix_undefined_variable',
        };
      }
    }

    return {
      errorId: error.id,
      type: 'suggestion',
      description: `Erreur TypeScript TS${errorCode}: ${details.substring(0, 100)}`,
      action: 'fix_typescript_error',
    };
  }

  /**
   * Règle 6: Erreurs ApiError
   */
  private fixApiError(error: DetectedError, rootDir: string): FixSuggestion | null {
    const statusCode = error.context?.statusCode;
    
    if (!statusCode) {
      return null;
    }

    // 401 Unauthorized
    if (statusCode === 401) {
      return {
        errorId: error.id,
        type: 'suggestion',
        description: 'Erreur 401: Non autorisé. Vérifiez l\'authentification et les tokens.',
        action: 'check_authentication',
      };
    }

    // 404 Not Found
    if (statusCode === 404) {
      return {
        errorId: error.id,
        type: 'suggestion',
        description: 'Erreur 404: Ressource non trouvée. Vérifiez l\'URL de l\'endpoint.',
        action: 'check_endpoint_url',
      };
    }

    // 409 Conflict
    if (statusCode === 409) {
      return {
        errorId: error.id,
        type: 'suggestion',
        description: 'Erreur 409: Conflit. La ressource existe déjà ou est en conflit.',
        action: 'check_conflict',
      };
    }

    // 500 Internal Server Error
    if (statusCode >= 500) {
      return {
        errorId: error.id,
        type: 'suggestion',
        description: `Erreur ${statusCode}: Erreur serveur. Consultez les logs backend pour plus de détails.`,
        action: 'check_server_logs',
      };
    }

    return {
      errorId: error.id,
      type: 'suggestion',
      description: `Erreur HTTP ${statusCode}. Vérifiez la requête et la réponse du serveur.`,
      action: 'check_http_error',
    };
  }

  /**
   * Règle 7: Erreurs d'import
   */
  private fixImportError(error: DetectedError, rootDir: string): FixSuggestion | null {
    const module = error.context?.module;
    
    if (!module) {
      return null;
    }

    // Vérifier si c'est un module npm
    const packageJson = path.join(rootDir, 'package.json');
    if (fs.existsSync(packageJson)) {
      const pkg = JSON.parse(fs.readFileSync(packageJson, 'utf8'));
      const allDeps = { ...pkg.dependencies, ...pkg.devDependencies };
      
      if (!allDeps[module]) {
        return {
          errorId: error.id,
          type: 'automatic',
          description: `Installer le package manquant: ${module}`,
          action: 'install_package',
          code: `npm install ${module}`,
        };
      }
    }

    // Vérifier si c'est un import relatif
    if (module.startsWith('.') || module.startsWith('/')) {
      return {
        errorId: error.id,
        type: 'suggestion',
        description: `Vérifiez le chemin d'import: ${module}`,
        action: 'check_import_path',
      };
    }

    return {
      errorId: error.id,
      type: 'suggestion',
      description: `Module non trouvé: ${module}. Vérifiez l'import ou installez le package.`,
      action: 'fix_import_error',
    };
  }

  /**
   * Applique les règles de correction à une erreur
   */
  getFixSuggestion(error: DetectedError): FixSuggestion | null {
    switch (error.category) {
      case 'database':
        return this.fixDatabaseConnection(error, this.rootDir);
      case 'cors':
        return this.fixCorsError(error, this.rootDir);
      case 'validation':
        return this.fixZodValidationError(error, this.rootDir);
      case 'routing':
        return this.fixRoute404Error(error, this.rootDir);
      case 'typescript':
        return this.fixTypeScriptError(error, this.rootDir);
      case 'api':
        return this.fixApiError(error, this.rootDir);
      case 'import':
        return this.fixImportError(error, this.rootDir);
      default:
        return {
          errorId: error.id,
          type: 'suggestion',
          description: `Erreur de catégorie ${error.category}. Consultez les logs pour plus de détails.`,
          action: 'manual_review',
        };
    }
  }

  /**
   * Génère toutes les suggestions de correction pour une liste d'erreurs
   */
  generateFixSuggestions(errors: DetectedError[]): FixSuggestion[] {
    const suggestions: FixSuggestion[] = [];

    for (const error of errors) {
      const suggestion = this.getFixSuggestion(error);
      if (suggestion) {
        suggestions.push(suggestion);
      }
    }

    return suggestions;
  }
}

// Export pour utilisation en ligne de commande
// Pour exécuter: npx tsx scripts/auto-fix/fix-rules.ts <rootDir> <errors-file.json>
const isMainModule = process.argv[1]?.includes('fix-rules.ts');
if (isMainModule) {
  const rootDir = process.argv[2] || process.cwd();
  const errorsFile = process.argv[3];

  if (!errorsFile || !fs.existsSync(errorsFile)) {
    console.error('Usage: tsx fix-rules.ts <rootDir> <errors-file.json>');
    process.exit(1);
  }

  const errorsData = JSON.parse(fs.readFileSync(errorsFile, 'utf8'));
  const errors = errorsData.errors || [];

  const rules = new FixRules(rootDir);
  const suggestions = rules.generateFixSuggestions(errors);

  console.log(JSON.stringify(suggestions, null, 2));
}

