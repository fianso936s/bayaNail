import { Request, Response } from "express";
import bcrypt from "bcrypt";
import prisma from "../lib/prisma.js";
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from "../lib/auth.js";
import { AuthRequest } from "../middleware/auth.js";
import { hashPassword, verifyPassword, isArgon2Hash } from "../lib/password.js";

export const register = async (req: Request, res: Response) => {
  const { email, password, firstName, lastName } = req.body;

  // Validation basique
  if (!email || !password || !firstName || !lastName) {
    return res.status(400).json({ 
      message: "Tous les champs sont requis",
      errors: [
        { field: !email ? "email" : !password ? "password" : !firstName ? "firstName" : "lastName", message: "Ce champ est requis" }
      ]
    });
  }

  try {
    const normalizedEmail = email.toLowerCase().trim();
    const existingUser = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (existingUser) {
      return res.status(400).json({ message: "Cet email est déjà utilisé" });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: "Le mot de passe doit contenir au moins 6 caractères" });
    }

    const hashedPassword = await hashPassword(password);

    const user = await prisma.user.create({
      data: {
        email: normalizedEmail, // Sauvegarder l'email normalisé pour éviter les conflits
        password: hashedPassword,
        role: "STUDENT", // 🔒 SÉCURITÉ : On force le rôle STUDENT ici pour empêcher l'auto-élévation de privilèges
        profile: {
          create: {
            firstName,
            lastName,
          }
        }
      },
      include: { profile: true }
    });

    // Log action
    await prisma.auditLog.create({
      data: {
        action: "REGISTER",
        entity: "USER",
        entityId: user.id,
        userId: user.id,
      }
    });

    res.status(201).json({ message: "Compte créé avec succès" });
  } catch (error: any) {
    console.error("Erreur lors de la création du compte:", error);
    res.status(500).json({ 
      message: "Erreur lors de la création du compte",
      ...(process.env.NODE_ENV !== "production" && { error: error.message })
    });
  }
};

export const login = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  // Validation basique
  if (!email || !password) {
    return res.status(400).json({ 
      message: "Email et mot de passe sont requis",
      errors: [
        { field: !email ? "email" : "password", message: "Ce champ est requis" }
      ]
    });
  }

  try {
    const normalizedEmail = email.toLowerCase().trim();
    const origin = req.headers.origin || "unknown";
    console.log(`[LOGIN] Tentative de connexion avec email: ${normalizedEmail}, origine: ${origin}`);
    
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      include: { profile: true }
    });

    if (!user) {
      console.log(`[LOGIN] ❌ Utilisateur non trouvé pour email: ${normalizedEmail}`);
      return res.status(401).json({ message: "Identifiants invalides" });
    }

    console.log(`[LOGIN] ✅ Utilisateur trouvé: ${user.email}, rôle: ${user.role}, a un mot de passe: ${!!user.password}`);

    if (!user.password) {
      console.log(`[LOGIN] ❌ L'utilisateur ${user.email} n'a pas de mot de passe`);
      return res.status(401).json({ message: "Identifiants invalides" });
    }

    const hashFormat = isArgon2Hash(user.password) ? "Argon2" : (user.password.startsWith("$2") ? "bcrypt" : "inconnu");
    console.log(`[LOGIN] Format du hash: ${hashFormat}, longueur: ${user.password.length}`);
    console.log(`[LOGIN] Comparaison du mot de passe pour ${user.email}...`);
    
    // Vérifier le mot de passe (support Argon2 et bcrypt pour migration progressive)
    let isPasswordValid = false;
    let passwordError: Error | null = null;
    
    try {
      if (isArgon2Hash(user.password)) {
        isPasswordValid = await verifyPassword(password, user.password);
        console.log(`[LOGIN] Vérification Argon2: ${isPasswordValid ? "✅" : "❌"}`);
      } else {
        // Ancien format bcrypt - migration progressive
        isPasswordValid = await bcrypt.compare(password, user.password);
        console.log(`[LOGIN] Vérification bcrypt: ${isPasswordValid ? "✅" : "❌"}`);
        
        // Si le mot de passe est valide et en bcrypt, migrer vers Argon2
        if (isPasswordValid) {
          const newHash = await hashPassword(password);
          await prisma.user.update({
            where: { id: user.id },
            data: { password: newHash }
          });
          console.log(`[LOGIN] ✅ Mot de passe migré vers Argon2 pour ${user.email}`);
        }
      }
    } catch (error: any) {
      passwordError = error;
      console.error(`[LOGIN] ❌ Erreur lors de la vérification du mot de passe:`, error.message);
    }
    
    if (passwordError) {
      console.log(`[LOGIN] ❌ Erreur technique lors de la vérification: ${passwordError.message}`);
      return res.status(500).json({ 
        message: "Erreur lors de la vérification du mot de passe",
        ...(process.env.NODE_ENV !== "production" && { error: passwordError.message })
      });
    }
    
    if (!isPasswordValid) {
      console.log(`[LOGIN] ❌ Mot de passe invalide pour ${user.email}`);
      return res.status(401).json({ message: "Identifiants invalides" });
    }

    console.log(`[LOGIN] Connexion réussie pour ${user.email}`);

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    // Configuration des cookies pour cross-domain (api.bayanail.com <-> bayanail.com)
    // En production avec domaines différents, utiliser SameSite=None avec Secure=true
    const isCrossDomain = process.env.NODE_ENV === "production" && 
                          process.env.FRONTEND_URL && 
                          process.env.FRONTEND_URL.includes('bayanail.com') &&
                          !process.env.FRONTEND_URL.includes('api.');
    
    res.cookie("accessToken", accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: isCrossDomain ? "none" : (process.env.NODE_ENV === "production" ? "strict" : "lax"),
      maxAge: 15 * 60 * 1000 // 15 mins
    });

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: isCrossDomain ? "none" : (process.env.NODE_ENV === "production" ? "strict" : "lax"),
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    // Log action
    await prisma.auditLog.create({
      data: {
        action: "LOGIN",
        entity: "USER",
        entityId: user.id,
        userId: user.id,
      }
    });

    res.json({
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        profile: user.profile
      }
    });
  } catch (error: any) {
    console.error("Erreur lors de la connexion:", error);
    res.status(500).json({ 
      message: "Erreur lors de la connexion",
      ...(process.env.NODE_ENV !== "production" && { error: error.message })
    });
  }
};

export const logout = (req: Request, res: Response) => {
  res.clearCookie("accessToken");
  res.clearCookie("refreshToken");
  res.json({ message: "Déconnecté" });
};

export const me = async (req: AuthRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ message: "Non authentifié" });

  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: { profile: true }
    });

    if (!user) return res.status(404).json({ message: "Utilisateur non trouvé" });

    res.json({
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        profile: user.profile
      }
    });
  } catch (error: any) {
    console.error("Erreur lors de la récupération de l'utilisateur:", error);
    res.status(500).json({ 
      message: "Erreur serveur",
      ...(process.env.NODE_ENV !== "production" && { error: error.message })
    });
  }
};

export const refresh = async (req: Request, res: Response) => {
  const token = req.cookies.refreshToken;

  if (!token) {
    return res.status(401).json({ message: "Non authentifié" });
  }

  try {
    const decoded = verifyRefreshToken(token);
    const user = await prisma.user.findUnique({ 
      where: { id: decoded.id },
      select: { id: true, email: true, role: true }
    });

    if (!user) {
      return res.status(401).json({ message: "Utilisateur non trouvé" });
    }

    const newAccessToken = generateAccessToken(user);

    // Configuration des cookies pour cross-domain
    const isCrossDomain = process.env.NODE_ENV === "production" && 
                          process.env.FRONTEND_URL && 
                          process.env.FRONTEND_URL.includes('bayanail.com') &&
                          !process.env.FRONTEND_URL.includes('api.');
    
    res.cookie("accessToken", newAccessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: isCrossDomain ? "none" : (process.env.NODE_ENV === "production" ? "strict" : "lax"),
      maxAge: 15 * 60 * 1000
    });

    res.json({ message: "Token rafraîchi" });
  } catch (error: any) {
    console.error("Erreur lors du refresh du token:", error);
    res.status(401).json({ 
      message: "Token invalide ou expiré",
      ...(process.env.NODE_ENV !== "production" && { error: error.message })
    });
  }
};

