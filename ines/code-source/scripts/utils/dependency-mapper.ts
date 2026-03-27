/**
 * Cartographie des dépendances entre modules API frontend et routes backend
 */

import * as fs from 'fs';
import * as path from 'path';
import * as ts from 'typescript';

export interface ApiFunction {
  name: string;
  endpoint: string;
  method: string;
  module: string;
  parameters?: string[];
}

export interface ApiModule {
  name: string;
  file: string;
  functions: ApiFunction[];
}

export interface DependencyMap {
  modules: ApiModule[];
  functions: ApiFunction[];
  endpointMap: Map<string, ApiFunction[]>;
}

export class DependencyMapper {
  private rootDir: string;
  private apiDir: string;
  private routesDir: string;

  constructor(rootDir: string) {
    this.rootDir = rootDir;
    this.apiDir = path.join(rootDir, 'src', 'lib', 'api');
    this.routesDir = path.join(rootDir, 'bayanail-api', 'src', 'routes');
  }

  /**
   * Parse un fichier TypeScript pour extraire les fonctions exportées
   */
  private parseApiFile(filePath: string, moduleName: string): ApiFunction[] {
    const functions: ApiFunction[] = [];
    const sourceCode = fs.readFileSync(filePath, 'utf8');
    const sourceFile = ts.createSourceFile(
      filePath,
      sourceCode,
      ts.ScriptTarget.ES2020,
      true
    );

    const visit = (node: ts.Node) => {
      // Chercher les objets exportés (ex: export const authApi = { ... })
      if (
        ts.isVariableStatement(node) &&
        node.modifiers?.some((m) => m.kind === ts.SyntaxKind.ExportKeyword)
      ) {
        node.declarationList.declarations.forEach((decl) => {
          if (
            ts.isIdentifier(decl.name) &&
            decl.name.text.endsWith('Api')
          ) {
            // C'est un module API (ex: authApi)
            if (decl.initializer && ts.isObjectLiteralExpression(decl.initializer)) {
              decl.initializer.properties.forEach((prop) => {
                if (ts.isPropertyAssignment(prop) && ts.isIdentifier(prop.name)) {
                  const funcName = prop.name.text;
                  const endpoint = this.extractEndpoint(prop.initializer, funcName);
                  const method = this.extractMethod(prop.initializer);
                  
                  functions.push({
                    name: funcName,
                    endpoint,
                    method,
                    module: moduleName,
                  });
                }
              });
            }
          }
        });
      }

      ts.forEachChild(node, visit);
    };

    visit(sourceFile);
    return functions;
  }

  /**
   * Extrait l'endpoint depuis une expression fetchJson
   */
  private extractEndpoint(node: ts.Node, funcName: string): string {
    if (ts.isCallExpression(node)) {
      const args = node.arguments;
      if (args.length > 0 && ts.isStringLiteral(args[0])) {
        return args[0].text;
      }
      if (args.length > 0 && ts.isTemplateExpression(args[0])) {
        // Template literal comme `/lessons/${id}`
        const parts: string[] = [];
        parts.push(args[0].head.text);
        args[0].templateSpans.forEach((span) => {
          parts.push(`{id}`);
          parts.push(span.literal.text);
        });
        return parts.join('');
      }
    }
    return `/${funcName}`;
  }

  /**
   * Extrait la méthode HTTP depuis les options de fetchJson
   */
  private extractMethod(node: ts.Node): string {
    if (ts.isCallExpression(node) && node.arguments.length > 1) {
      const options = node.arguments[1];
      if (ts.isObjectLiteralExpression(options)) {
        for (const prop of options.properties) {
          if (
            ts.isPropertyAssignment(prop) &&
            ts.isIdentifier(prop.name) &&
            prop.name.text === 'method'
          ) {
            if (ts.isStringLiteral(prop.initializer)) {
              return prop.initializer.text;
            }
          }
        }
      }
    }
    return 'GET';
  }

  /**
   * Analyse tous les modules API
   */
  public mapDependencies(): DependencyMap {
    const modules: ApiModule[] = [];
    const allFunctions: ApiFunction[] = [];
    const endpointMap = new Map<string, ApiFunction[]>();

    // Lire le fichier index.ts pour connaître les exports
    const indexFile = path.join(this.apiDir, 'index.ts');
    if (!fs.existsSync(indexFile)) {
      throw new Error(`Fichier index.ts non trouvé: ${indexFile}`);
    }

    // Lister tous les fichiers .ts dans le dossier api (sauf index.ts et fetch.ts)
    const apiFiles = fs.readdirSync(this.apiDir).filter(
      (file) =>
        file.endsWith('.ts') &&
        file !== 'index.ts' &&
        file !== 'fetch.ts' &&
        file !== 'apiUrl.ts'
    );

    for (const file of apiFiles) {
      const filePath = path.join(this.apiDir, file);
      const moduleName = path.basename(file, '.ts');
      
      try {
        const functions = this.parseApiFile(filePath, moduleName);
        
        const module: ApiModule = {
          name: moduleName,
          file,
          functions,
        };
        
        modules.push(module);
        allFunctions.push(...functions);

        // Mapper par endpoint
        for (const func of functions) {
          const endpoint = func.endpoint.split('?')[0]; // Enlever les query params
          if (!endpointMap.has(endpoint)) {
            endpointMap.set(endpoint, []);
          }
          endpointMap.get(endpoint)!.push(func);
        }
      } catch (error) {
        console.warn(`Erreur lors de l'analyse de ${file}:`, error);
      }
    }

    return {
      modules,
      functions: allFunctions,
      endpointMap,
    };
  }

  /**
   * Génère un rapport JSON de la cartographie
   */
  public generateReport(outputPath?: string): string {
    const map = this.mapDependencies();
    const report = {
      timestamp: new Date().toISOString(),
      modules: map.modules.map((m) => ({
        name: m.name,
        file: m.file,
        functionCount: m.functions.length,
        functions: m.functions.map((f) => ({
          name: f.name,
          endpoint: f.endpoint,
          method: f.method,
        })),
      })),
      summary: {
        totalModules: map.modules.length,
        totalFunctions: map.functions.length,
        endpoints: Array.from(map.endpointMap.keys()),
      },
    };

    const jsonReport = JSON.stringify(report, null, 2);
    
    if (outputPath) {
      fs.writeFileSync(outputPath, jsonReport, 'utf8');
    }

    return jsonReport;
  }

  /**
   * Vérifie la correspondance entre les endpoints frontend et les routes backend
   */
  public validateBackendRoutes(): {
    missing: string[];
    extra: string[];
    matched: string[];
  } {
    const map = this.mapDependencies();
    const frontendEndpoints = new Set(
      map.functions.map((f) => f.endpoint.split('?')[0])
    );

    // Lister les routes backend
    const backendRoutes: string[] = [];
    if (fs.existsSync(this.routesDir)) {
      const routeFiles = fs.readdirSync(this.routesDir).filter((f) =>
        f.endsWith('.routes.ts')
      );

      for (const file of routeFiles) {
        const filePath = path.join(this.routesDir, file);
        const sourceCode = fs.readFileSync(filePath, 'utf8');
        
        // Extraire les routes (simplifié - cherche router.get/post/etc.)
        const routeMatches = sourceCode.matchAll(
          /router\.(get|post|put|patch|delete)\(['"`]([^'"`]+)['"`]/g
        );
        for (const match of routeMatches) {
          backendRoutes.push(match[2]);
        }
      }
    }

    const backendEndpoints = new Set(backendRoutes);
    const missing = Array.from(frontendEndpoints).filter(
      (e) => !backendRoutes.some((br) => br.includes(e.split('/')[1]))
    );
    const extra = Array.from(backendEndpoints).filter(
      (e) => !Array.from(frontendEndpoints).some((fe) => fe.includes(e.split('/')[1]))
    );
    const matched = Array.from(frontendEndpoints).filter((e) =>
      backendRoutes.some((br) => br.includes(e.split('/')[1]))
    );

    return { missing, extra, matched };
  }
}

// Export pour utilisation en ligne de commande
// Pour exécuter: npx tsx scripts/utils/dependency-mapper.ts [rootDir]
const isMainModule = process.argv[1]?.includes('dependency-mapper.ts');
if (isMainModule) {
  const rootDir = process.argv[2] || process.cwd();
  const mapper = new DependencyMapper(rootDir);
  const report = mapper.generateReport();
  console.log(report);

  const validation = mapper.validateBackendRoutes();
  console.log('\nValidation des routes backend:');
  console.log('Manquantes:', validation.missing);
  console.log('Supplémentaires:', validation.extra);
  console.log('Correspondantes:', validation.matched.length);
}

