/**
 * Fonctions de sanitisation pour prévenir les attaques XSS
 * Échappe les caractères HTML/JavaScript dangereux
 */

/**
 * Sanitise une chaîne de caractères en échappant les caractères HTML
 * @param input - La chaîne à sanitiser
 * @returns La chaîne sanitizée avec les caractères HTML échappés
 */
export function sanitizeString(input: string | null | undefined): string {
  if (!input || typeof input !== "string") {
    return "";
  }

  // Échapper les caractères HTML dangereux
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;")
    .replace(/\//g, "&#x2F;");
}

/**
 * Vérifie si une chaîne contient des balises HTML ou JavaScript
 * @param input - La chaîne à vérifier
 * @returns true si des balises HTML sont détectées
 */
export function containsHTML(input: string | null | undefined): boolean {
  if (!input || typeof input !== "string") {
    return false;
  }

  // Détecter les balises HTML (<...>), les événements JavaScript (onerror, onclick, etc.)
  // et les expressions JavaScript (javascript:)
  const htmlPattern = /<[^>]*>/i;
  const scriptPattern = /<script[\s\S]*?>[\s\S]*?<\/script>/gi;
  const eventPattern = /on\w+\s*=/gi;
  const javascriptPattern = /javascript:/gi;
  const dataUriPattern = /data:text\/html/gi;

  return (
    htmlPattern.test(input) ||
    scriptPattern.test(input) ||
    eventPattern.test(input) ||
    javascriptPattern.test(input) ||
    dataUriPattern.test(input)
  );
}

/**
 * Sanitise un objet récursivement en sanitizant toutes les chaînes de caractères
 * @param obj - L'objet à sanitiser
 * @returns L'objet sanitizé
 */
export function sanitizeObject<T>(obj: T): T {
  if (obj === null || obj === undefined) {
    return obj;
  }

  if (typeof obj === "string") {
    return sanitizeString(obj) as T;
  }

  if (Array.isArray(obj)) {
    return obj.map((item) => sanitizeObject(item)) as T;
  }

  if (typeof obj === "object") {
    const sanitized: any = {};
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        sanitized[key] = sanitizeObject((obj as any)[key]);
      }
    }
    return sanitized as T;
  }

  return obj;
}

/**
 * Valide qu'une chaîne ne contient pas de HTML/JavaScript
 * @param input - La chaîne à valider
 * @throws Error si du HTML est détecté
 */
export function validateNoHTML(input: string | null | undefined): void {
  if (containsHTML(input)) {
    throw new Error("Les balises HTML et JavaScript ne sont pas autorisées");
  }
}

