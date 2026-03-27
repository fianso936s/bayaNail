import { Request, Response, NextFunction } from "express";
import crypto from "crypto";

/**
 * Middleware de protection CSRF
 * Génère et valide les tokens CSRF pour prévenir les attaques Cross-Site Request Forgery
 */

// Stockage en mémoire des tokens CSRF (en production, utiliser Redis ou une session)
const csrfTokens = new Map<string, { token: string; expiresAt: number }>();

// Durée de vie d'un token CSRF (15 minutes)
const CSRF_TOKEN_EXPIRY = 15 * 60 * 1000;

/**
 * Génère un token CSRF sécurisé
 */
export function generateCSRFToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

/**
 * Génère et stocke un token CSRF pour une session
 * @param sessionId - Identifiant de session (peut être l'IP + User-Agent hash)
 */
export function createCSRFToken(sessionId: string): string {
  const token = generateCSRFToken();
  const expiresAt = Date.now() + CSRF_TOKEN_EXPIRY;

  csrfTokens.set(sessionId, { token, expiresAt });

  // Nettoyer les tokens expirés périodiquement
  cleanupExpiredTokens();

  return token;
}

/**
 * Vérifie si un token CSRF est valide
 */
export function verifyCSRFToken(sessionId: string, token: string): boolean {
  const stored = csrfTokens.get(sessionId);

  if (!stored) {
    return false;
  }

  // Vérifier l'expiration
  if (Date.now() > stored.expiresAt) {
    csrfTokens.delete(sessionId);
    return false;
  }

  // Vérifier que les tokens ont la même longueur avant la comparaison sécurisée
  // Cela évite une RangeError si un attaquant envoie un token de longueur différente
  const storedBuffer = Buffer.from(stored.token);
  const tokenBuffer = Buffer.from(token);
  
  if (storedBuffer.length !== tokenBuffer.length) {
    return false;
  }

  // Comparaison sécurisée pour éviter les attaques par timing
  return crypto.timingSafeEqual(storedBuffer, tokenBuffer);
}

/**
 * Nettoie les tokens expirés
 */
function cleanupExpiredTokens(): void {
  const now = Date.now();
  for (const [sessionId, data] of csrfTokens.entries()) {
    if (now > data.expiresAt) {
      csrfTokens.delete(sessionId);
    }
  }
}

/**
 * Génère un identifiant de session basé sur l'IP et le User-Agent
 */
function getSessionId(req: Request): string {
  const ip = req.ip || req.socket.remoteAddress || "unknown";
  const userAgent = req.get("user-agent") || "unknown";
  const combined = `${ip}-${userAgent}`;
  return crypto.createHash("sha256").update(combined).digest("hex");
}

/**
 * Middleware pour générer et envoyer un token CSRF
 * Génère un token pour toutes les requêtes (GET, POST, etc.) pour faciliter l'accès côté frontend
 */
export const csrfToken = (req: Request, res: Response, next: NextFunction) => {
  const sessionId = getSessionId(req);
  
  // Vérifier si un token existe déjà et est valide
  const existingToken = csrfTokens.get(sessionId);
  let token: string;
  
  if (existingToken && Date.now() < existingToken.expiresAt) {
    // Réutiliser le token existant s'il est encore valide
    token = existingToken.token;
  } else {
    // Créer un nouveau token
    token = createCSRFToken(sessionId);
  }

  // Envoyer le token dans un header personnalisé
  res.setHeader("X-CSRF-Token", token);

  // Stocker aussi dans un cookie pour faciliter l'accès côté frontend
  res.cookie("csrf-token", token, {
    httpOnly: false, // Doit être accessible par JavaScript
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: CSRF_TOKEN_EXPIRY,
  });

  next();
};

/**
 * Middleware pour vérifier le token CSRF sur les requêtes modifiantes
 */
export const verifyCSRF = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Seulement vérifier sur les méthodes modifiantes
  const modifyingMethods = ["POST", "PUT", "PATCH", "DELETE"];
  if (!modifyingMethods.includes(req.method)) {
    return next();
  }

  // Exclure les webhooks Stripe (ils ont leur propre authentification)
  if (req.path.includes("/billing/webhook")) {
    return next();
  }

  const sessionId = getSessionId(req);

  // Récupérer le token depuis le header ou le body
  const token =
    req.headers["x-csrf-token"] ||
    req.headers["csrf-token"] ||
    req.body?.csrfToken ||
    req.cookies?.["csrf-token"];

  if (!token || typeof token !== "string") {
    return res.status(403).json({
      message: "Token CSRF manquant",
      error: "CSRF_TOKEN_MISSING",
    });
  }

  if (!verifyCSRFToken(sessionId, token)) {
    return res.status(403).json({
      message: "Token CSRF invalide ou expiré",
      error: "CSRF_TOKEN_INVALID",
    });
  }

  next();
};

