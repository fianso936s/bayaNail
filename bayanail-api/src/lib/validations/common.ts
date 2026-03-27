import { z } from "zod";

/**
 * Regex pour valider les noms (lettres, espaces, tirets, apostrophes)
 * Autorise les caractères accentués français
 */
export const nameRegex = /^[a-zA-ZÀ-ÿ\s\-']{2,50}$/u;

/**
 * Regex pour détecter les balises HTML
 */
export const htmlTagRegex = /<[^>]*>/i;

/**
 * Regex pour détecter les scripts JavaScript
 */
export const scriptRegex = /<script[\s\S]*?>[\s\S]*?<\/script>/gi;

/**
 * Regex pour détecter les événements JavaScript (onclick, onerror, etc.)
 */
export const eventHandlerRegex = /on\w+\s*=/gi;

/**
 * Regex pour détecter les expressions JavaScript (javascript:)
 */
export const javascriptProtocolRegex = /javascript:/gi;

/**
 * Regex pour détecter les data URIs malveillants
 */
export const dataUriRegex = /data:text\/html/gi;

/**
 * Fonction de validation Zod pour bloquer le HTML
 */
export const noHTML = (message: string = "Les balises HTML et JavaScript ne sont pas autorisées") => {
  return z.string().refine(
    (val) => {
      if (!val) return true;
      return !(
        htmlTagRegex.test(val) ||
        scriptRegex.test(val) ||
        eventHandlerRegex.test(val) ||
        javascriptProtocolRegex.test(val) ||
        dataUriRegex.test(val)
      );
    },
    { message }
  );
};

/**
 * Schéma Zod pour valider un nom (prénom/nom)
 */
export const nameSchema = z
  .string()
  .min(2, "Le nom doit contenir au moins 2 caractères")
  .max(50, "Le nom ne peut pas dépasser 50 caractères")
  .regex(nameRegex, "Le nom ne peut contenir que des lettres, espaces, tirets et apostrophes")
  .pipe(noHTML("Le nom ne peut pas contenir de HTML ou JavaScript"));

/**
 * Schéma Zod pour valider un email
 */
export const emailSchema = z
  .string()
  .email("Email invalide")
  .max(255, "L'email ne peut pas dépasser 255 caractères")
  .toLowerCase()
  .trim();

/**
 * Schéma Zod pour valider un message/texte libre
 */
export const messageSchema = z
  .string()
  .min(10, "Le message doit contenir au moins 10 caractères")
  .max(5000, "Le message ne peut pas dépasser 5000 caractères")
  .pipe(noHTML("Le message ne peut pas contenir de HTML ou JavaScript"));

/**
 * Schéma Zod pour valider un téléphone français
 */
export const phoneSchema = z
  .string()
  .regex(
    /^(?:(?:\+|00)33|0)\s*[1-9](?:[\s.-]*\d{2}){4}$/,
    "Numéro de téléphone invalide"
  )
  .max(20, "Le numéro de téléphone ne peut pas dépasser 20 caractères");

/**
 * Schéma Zod pour valider une ville
 */
export const citySchema = z
  .string()
  .min(2, "La ville doit contenir au moins 2 caractères")
  .max(100, "La ville ne peut pas dépasser 100 caractères")
  .pipe(noHTML("La ville ne peut pas contenir de HTML ou JavaScript"));

/**
 * Schéma Zod pour valider une adresse
 */
export const addressSchema = z
  .string()
  .max(200, "L'adresse ne peut pas dépasser 200 caractères")
  .pipe(noHTML("L'adresse ne peut pas contenir de HTML ou JavaScript"))
  .optional();

