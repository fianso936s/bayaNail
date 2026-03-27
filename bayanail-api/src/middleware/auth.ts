import { Request, Response, NextFunction } from "express";
import { verifyAccessToken, verifyRefreshToken, generateAccessToken } from "../lib/auth.js";
import prisma from "../lib/prisma.js";

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
  };
}

export const authenticate = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const accessToken = req.cookies.accessToken;
  const refreshToken = req.cookies.refreshToken;

  // Si pas de token du tout, retourner 401
  if (!accessToken && !refreshToken) {
    return res.status(401).json({ message: "Non authentifié" });
  }

  // Essayer de vérifier l'accessToken d'abord
  if (accessToken) {
    try {
      const decoded = verifyAccessToken(accessToken);
      req.user = decoded;
      return next();
    } catch (error) {
      // AccessToken invalide ou expiré, continuer pour vérifier refreshToken
    }
  }

  // Si accessToken invalide/expiré, vérifier refreshToken
  if (refreshToken) {
    try {
      const decoded = verifyRefreshToken(refreshToken);
      
      // Récupérer l'utilisateur depuis la base de données pour obtenir email et role
      const user = await prisma.user.findUnique({
        where: { id: decoded.id },
        select: { id: true, email: true, role: true }
      });

      if (!user) {
        return res.status(401).json({ message: "Utilisateur non trouvé" });
      }

      // Générer un nouveau accessToken
      const newAccessToken = generateAccessToken(user);
      
      // Configuration des cookies pour cross-domain (api.bayanail.com <-> bayanail.com)
      const isCrossDomain = process.env.NODE_ENV === "production" && 
                            process.env.FRONTEND_URL && 
                            process.env.FRONTEND_URL.includes('bayanail.com') &&
                            !process.env.FRONTEND_URL.includes('api.');
      
      // Définir le nouveau cookie
      res.cookie("accessToken", newAccessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: isCrossDomain ? "none" : (process.env.NODE_ENV === "production" ? "strict" : "lax"),
        maxAge: 15 * 60 * 1000 // 15 mins
      });

      // Définir l'utilisateur dans la requête
      req.user = {
        id: user.id,
        email: user.email,
        role: user.role
      };

      return next();
    } catch (error) {
      // RefreshToken aussi invalide
      return res.status(401).json({ message: "Session expirée. Veuillez vous reconnecter." });
    }
  }

  // Aucun token valide
  return res.status(401).json({ message: "Non authentifié" });
};

export const authorize = (roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ message: "Accès refusé" });
    }
    next();
  };
};

