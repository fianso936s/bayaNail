/**
 * Script d'application des corrections automatiques
 * Applique les corrections simples et génère des suggestions pour les cas complexes
 */

import * as fs from 'fs';
import * as path from 'path';
import { DetectedError } from '../analysis/analyze-logs';
import { FixRules, FixSuggestion } from './fix-rules';
import { initLogger } from '../utils/logger';

interface FixResult {
  errorId: string;
  applied: boolean;
  suggestion: FixSuggestion;
  error?: string;
}

export class AutoFixer {
  private logger: ReturnType<typeof initLogger>;
  private rootDir: string;
  private fixesDir: string;

  constructor(logDir: string, rootDir: string) {
    this.logger = initLogger(logDir, 'auto-fix');
    this.rootDir = rootDir;
    this.fixesDir = path.join(rootDir, 'fixes');
    
    // Créer le dossier fixes s'il n'existe pas
    if (!fs.existsSync(this.fixesDir)) {
      fs.mkdirSync(this.fixesDir, { recursive: true });
    }
  }

  /**
   * Applique une correction automatique
   */
  private applyAutomaticFix(suggestion: FixSuggestion): boolean {
    try {
      this.logger.info(`Application de la correction automatique: ${suggestion.action}`, {
        errorId: suggestion.errorId,
        file: suggestion.file,
      });

      switch (suggestion.action) {
        case 'create_env_file':
          return this.createEnvFile(suggestion);
        
        case 'add_cors_origin':
          return this.addCorsOrigin(suggestion);
        
        case 'install_package':
          return this.installPackage(suggestion);
        
        default:
          this.logger.warn(`Action automatique non implémentée: ${suggestion.action}`);
          return false;
      }
    } catch (error: any) {
      this.logger.error(`Erreur lors de l'application de la correction`, error, {
        errorId: suggestion.errorId,
        action: suggestion.action,
      });
      return false;
    }
  }

  /**
   * Crée le fichier .env depuis env.example
   */
  private createEnvFile(suggestion: FixSuggestion): boolean {
    if (!suggestion.file || !suggestion.code) {
      return false;
    }

    const envExampleFile = path.join(this.rootDir, 'bayanail-api', 'env.example');
    if (!fs.existsSync(envExampleFile)) {
      this.logger.warn('Fichier env.example non trouvé');
      return false;
    }

    // Copier le contenu de env.example vers .env
    const content = fs.readFileSync(envExampleFile, 'utf8');
    fs.writeFileSync(suggestion.file, content, 'utf8');
    
    this.logger.info(`Fichier .env créé: ${suggestion.file}`);
    return true;
  }

  /**
   * Ajoute une origine CORS
   */
  private addCorsOrigin(suggestion: FixSuggestion): boolean {
    if (!suggestion.file || !suggestion.code) {
      return false;
    }

    const content = fs.readFileSync(suggestion.file, 'utf8');
    const lines = content.split('\n');
    
    // Trouver la ligne avec ]; qui ferme le tableau allowedCorsOrigins
    let insertIndex = -1;
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].includes('allowedCorsOrigins') && i + 1 < lines.length) {
        // Chercher la ligne de fermeture du tableau
        for (let j = i + 1; j < lines.length; j++) {
          if (lines[j].includes('];')) {
            insertIndex = j;
            break;
          }
        }
        break;
      }
    }

    if (insertIndex === -1) {
      this.logger.warn('Impossible de trouver où insérer l\'origine CORS');
      return false;
    }

    // Insérer la nouvelle ligne avant la fermeture du tableau
    lines.splice(insertIndex, 0, suggestion.code);
    const newContent = lines.join('\n');
    
    fs.writeFileSync(suggestion.file, newContent, 'utf8');
    this.logger.info(`Origine CORS ajoutée dans ${suggestion.file}`);
    return true;
  }

  /**
   * Installe un package npm
   */
  private installPackage(suggestion: FixSuggestion): boolean {
    if (!suggestion.code) {
      return false;
    }

    // Extraire le nom du package depuis la commande
    const match = suggestion.code.match(/npm install (.+)/);
    if (!match) {
      return false;
    }

    const packageName = match[1];
    this.logger.info(`Installation du package: ${packageName}`);
    
    // Note: Dans un vrai scénario, on exécuterait la commande npm install
    // Ici, on génère juste une suggestion car l'exécution nécessite des privilèges
    this.logger.warn('L\'installation de packages nécessite une exécution manuelle');
    
    return false; // Retourner false pour forcer une suggestion
  }

  /**
   * Génère un fichier de suggestion de correction
   */
  private generateSuggestionFile(suggestion: FixSuggestion): void {
    const fileName = `suggested-fix-${suggestion.errorId}.md`;
    const filePath = path.join(this.fixesDir, fileName);

    let content = `# Suggestion de correction pour ${suggestion.errorId}\n\n`;
    content += `**Description:** ${suggestion.description}\n\n`;
    content += `**Type:** ${suggestion.type}\n\n`;
    content += `**Action:** ${suggestion.action}\n\n`;

    if (suggestion.file) {
      content += `**Fichier:** ${suggestion.file}\n\n`;
    }

    if (suggestion.code) {
      content += `**Code à ajouter/modifier:**\n\n\`\`\`\n${suggestion.code}\n\`\`\`\n\n`;
    }

    if (suggestion.patch) {
      content += `**Patch:**\n\n\`\`\`diff\n${suggestion.patch}\n\`\`\`\n\n`;
    }

    content += `---\n\n*Généré automatiquement par le système de correction*\n`;

    fs.writeFileSync(filePath, content, 'utf8');
    this.logger.info(`Suggestion générée: ${filePath}`);
  }

  /**
   * Applique toutes les corrections
   */
  applyFixes(errors: DetectedError[]): FixResult[] {
    this.logger.info(`Application des corrections pour ${errors.length} erreurs`);

    const rules = new FixRules(this.rootDir);
    const suggestions = rules.generateFixSuggestions(errors);
    const results: FixResult[] = [];

    for (const suggestion of suggestions) {
      let applied = false;
      let error: string | undefined;

      if (suggestion.type === 'automatic') {
        applied = this.applyAutomaticFix(suggestion);
        if (!applied) {
          error = 'Échec de l\'application automatique';
        }
      } else {
        // Générer un fichier de suggestion
        this.generateSuggestionFile(suggestion);
      }

      results.push({
        errorId: suggestion.errorId,
        applied,
        suggestion,
        error,
      });
    }

    // Sauvegarder les résultats
    const resultsPath = path.join(this.fixesDir, 'fix-results.json');
    fs.writeFileSync(resultsPath, JSON.stringify(results, null, 2), 'utf8');
    this.logger.info(`Résultats sauvegardés: ${resultsPath}`);

    // Générer un résumé
    const appliedCount = results.filter((r) => r.applied).length;
    const suggestionCount = results.filter((r) => !r.applied && r.suggestion.type === 'suggestion').length;

    this.logger.info('Résumé des corrections', {
      total: results.length,
      applied: appliedCount,
      suggestions: suggestionCount,
    });

    return results;
  }
}

// Point d'entrée
function main() {
  const rootDir = process.argv.find((arg) => arg.startsWith('--rootDir'))?.split('=')[1] ||
                 process.cwd();
  
  const logDir = process.argv.find((arg) => arg.startsWith('--logDir'))?.split('=')[1] ||
                 path.join(rootDir, 'logs', new Date().toISOString().replace(/:/g, '-'));

  const errorsFile = process.argv.find((arg) => arg.startsWith('--errorsFile'))?.split('=')[1] ||
                     path.join(logDir, 'analysis', 'errors-detected.json');

  if (!fs.existsSync(errorsFile)) {
    console.error(`Le fichier d'erreurs n'existe pas: ${errorsFile}`);
    process.exit(1);
  }

  const errorsData = JSON.parse(fs.readFileSync(errorsFile, 'utf8'));
  const errors: DetectedError[] = errorsData.errors || [];

  if (errors.length === 0) {
    console.log('Aucune erreur à corriger');
    process.exit(0);
  }

  const fixer = new AutoFixer(logDir, rootDir);
  const results = fixer.applyFixes(errors);

  // Afficher le résumé
  console.log('\n=== Résumé des corrections ===');
  console.log(`Total: ${results.length}`);
  console.log(`Appliquées: ${results.filter((r) => r.applied).length}`);
  console.log(`Suggestions générées: ${results.filter((r) => !r.applied).length}`);

  const failed = results.filter((r) => r.error);
  if (failed.length > 0) {
    console.log('\n=== Corrections échouées ===');
    failed.forEach((r) => {
      console.log(`✗ ${r.errorId}: ${r.error}`);
    });
  }

  process.exit(0);
}

// Point d'entrée
main();

