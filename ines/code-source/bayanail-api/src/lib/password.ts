import argon2 from "argon2";

/**
 * Utilitaire pour gérer les mots de passe avec Argon2
 * Argon2 est recommandé par l'OWASP comme meilleur algorithme de hachage
 */

/**
 * Hache un mot de passe avec Argon2id
 * @param password - Le mot de passe en clair
 * @returns Le mot de passe haché
 */
export async function hashPassword(password: string): Promise<string> {
  return await argon2.hash(password, {
    type: argon2.argon2id, // Utilise Argon2id (meilleur compromis sécurité/performance)
    memoryCost: 65536, // 64 MB de mémoire
    timeCost: 3, // 3 itérations
    parallelism: 4, // 4 threads parallèles
  });
}

/**
 * Vérifie un mot de passe contre un hash
 * @param password - Le mot de passe en clair
 * @param hash - Le hash stocké
 * @returns true si le mot de passe correspond
 */
export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  try {
    return await argon2.verify(hash, password);
  } catch (error) {
    // Si le hash n'est pas au format Argon2, retourner false
    return false;
  }
}

/**
 * Vérifie si un hash est au format Argon2
 * @param hash - Le hash à vérifier
 * @returns true si c'est un hash Argon2
 */
export function isArgon2Hash(hash: string): boolean {
  return hash.startsWith("$argon2id$") || hash.startsWith("$argon2i$") || hash.startsWith("$argon2d$");
}

