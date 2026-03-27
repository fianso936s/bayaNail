/**
 * Système de logging centralisé avec rotation et format JSON
 */

import * as fs from 'fs';
import * as path from 'path';

export enum LogLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
}

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: Record<string, any>;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
}

export class Logger {
  private logDir: string;
  private logFile: string;
  private errorLogFile: string;
  private maxFileSize: number = 10 * 1024 * 1024; // 10MB
  private maxFiles: number = 5;

  constructor(logDir: string, prefix: string = 'app') {
    this.logDir = logDir;
    
    // Créer le dossier de logs s'il n'existe pas
    if (!fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true });
    }

    this.logFile = path.join(this.logDir, `${prefix}.log`);
    this.errorLogFile = path.join(this.logDir, `${prefix}-errors.log`);
  }

  private rotateLogs(filePath: string): void {
    if (!fs.existsSync(filePath)) {
      return;
    }

    const stats = fs.statSync(filePath);
    if (stats.size < this.maxFileSize) {
      return;
    }

    // Rotation: déplacer les fichiers existants
    for (let i = this.maxFiles - 1; i >= 1; i--) {
      const oldFile = `${filePath}.${i}`;
      const newFile = `${filePath}.${i + 1}`;
      if (fs.existsSync(oldFile)) {
        if (fs.existsSync(newFile)) {
          fs.unlinkSync(newFile);
        }
        fs.renameSync(oldFile, newFile);
      }
    }

    // Déplacer le fichier actuel
    const firstRotated = `${filePath}.1`;
    if (fs.existsSync(firstRotated)) {
      fs.unlinkSync(firstRotated);
    }
    fs.renameSync(filePath, firstRotated);
  }

  private writeLog(entry: LogEntry, isError: boolean = false): void {
    const logEntry: LogEntry = {
      ...entry,
      timestamp: new Date().toISOString(),
    };

    const logLine = JSON.stringify(logEntry) + '\n';
    const targetFile = isError ? this.errorLogFile : this.logFile;

    // Rotation avant écriture
    this.rotateLogs(targetFile);

    // Écrire dans le fichier principal
    fs.appendFileSync(targetFile, logLine, 'utf8');

    // Écrire aussi dans le fichier d'erreurs si c'est une erreur
    if (isError && targetFile !== this.errorLogFile) {
      this.rotateLogs(this.errorLogFile);
      fs.appendFileSync(this.errorLogFile, logLine, 'utf8');
    }

    // Afficher dans la console aussi
    const levelColor = this.getLevelColor(logEntry.level);
    const resetColor = '\x1b[0m';
    console.log(
      `${levelColor}[${logEntry.timestamp}] [${logEntry.level}]${resetColor} ${logEntry.message}`,
      logEntry.context || '',
      logEntry.error || ''
    );
  }

  private getLevelColor(level: LogLevel): string {
    switch (level) {
      case LogLevel.DEBUG:
        return '\x1b[36m'; // Cyan
      case LogLevel.INFO:
        return '\x1b[32m'; // Green
      case LogLevel.WARN:
        return '\x1b[33m'; // Yellow
      case LogLevel.ERROR:
        return '\x1b[31m'; // Red
      default:
        return '\x1b[0m'; // Reset
    }
  }

  debug(message: string, context?: Record<string, any>): void {
    this.writeLog({
      level: LogLevel.DEBUG,
      message,
      context,
    });
  }

  info(message: string, context?: Record<string, any>): void {
    this.writeLog({
      level: LogLevel.INFO,
      message,
      context,
    });
  }

  warn(message: string, context?: Record<string, any>): void {
    this.writeLog({
      level: LogLevel.WARN,
      message,
      context,
    });
  }

  error(message: string, error?: Error, context?: Record<string, any>): void {
    this.writeLog(
      {
        level: LogLevel.ERROR,
        message,
        context,
        error: error
          ? {
              name: error.name,
              message: error.message,
              stack: error.stack,
            }
          : undefined,
      },
      true
    );
  }

  // Méthode utilitaire pour créer un logger enfant avec un préfixe
  child(prefix: string): Logger {
    return new Logger(this.logDir, prefix);
  }
}

// Instance singleton par défaut
let defaultLogger: Logger | null = null;

export function getLogger(logDir?: string, prefix?: string): Logger {
  if (!defaultLogger && logDir) {
    defaultLogger = new Logger(logDir, prefix);
  }
  if (!defaultLogger) {
    throw new Error('Logger must be initialized with a log directory');
  }
  return defaultLogger;
}

export function initLogger(logDir: string, prefix?: string): Logger {
  defaultLogger = new Logger(logDir, prefix);
  return defaultLogger;
}

