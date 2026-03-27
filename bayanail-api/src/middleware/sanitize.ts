import { Request, Response, NextFunction } from "express";
import { sanitizeObject, containsHTML } from "../lib/sanitize.js";

/**
 * Middleware de sanitisation qui nettoie tous les inputs utilisateur
 * pour prévenir les attaques XSS
 */
export const sanitizeInput = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Sanitiser le body
  if (req.body && typeof req.body === "object") {
    // Vérifier d'abord si du HTML est présent (pour rejeter immédiatement)
    const bodyString = JSON.stringify(req.body);
    if (containsHTML(bodyString)) {
      return res.status(400).json({
        message: "Les balises HTML et JavaScript ne sont pas autorisées dans les champs",
        error: "XSS_DETECTED"
      });
    }
    
    // Sanitiser récursivement tous les champs texte
    req.body = sanitizeObject(req.body);
  }

  // Sanitiser les query params
  if (req.query && typeof req.query === "object") {
    const queryString = JSON.stringify(req.query);
    if (containsHTML(queryString)) {
      return res.status(400).json({
        message: "Les balises HTML et JavaScript ne sont pas autorisées dans les paramètres",
        error: "XSS_DETECTED"
      });
    }
    req.query = sanitizeObject(req.query);
  }

  // Sanitiser les params de route
  if (req.params && typeof req.params === "object") {
    const paramsString = JSON.stringify(req.params);
    if (containsHTML(paramsString)) {
      return res.status(400).json({
        message: "Les balises HTML et JavaScript ne sont pas autorisées dans les paramètres d'URL",
        error: "XSS_DETECTED"
      });
    }
    req.params = sanitizeObject(req.params);
  }

  next();
};

