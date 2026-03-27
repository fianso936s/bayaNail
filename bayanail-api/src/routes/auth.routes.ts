import { Router } from "express";
import rateLimit from "express-rate-limit";
import { register, login, logout, me, refresh } from "../controllers/auth.controller.js";
import { authenticate, authorize } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { loginSchema, registerSchema } from "../lib/validations/auth.schema.js";
import { csrfToken } from "../middleware/csrf.js";
import prisma from "../lib/prisma.js";

const router = Router();

// Rate limiting spécifique pour l'authentification
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Max 10 tentatives par IP
  message: "Trop de tentatives de connexion, réessayez dans 15 minutes.",
  standardHeaders: true,
  legacyHeaders: false,
});

// Endpoint pour obtenir le token CSRF (doit être avant les autres routes)
router.get("/csrf-token", csrfToken, (req, res) => {
  const token = req.cookies?.["csrf-token"] || req.headers["x-csrf-token"];
  res.json({ csrfToken: token });
});

router.post("/register", authLimiter, validate(registerSchema), register);
router.post("/login", authLimiter, validate(loginSchema), login);
router.post("/logout", logout);
router.post("/refresh", refresh);
router.get("/me", authenticate, me);

// Route de debug (à supprimer en production)
if (process.env.NODE_ENV !== "production") {
  router.get("/debug/users", authenticate, authorize(["ADMIN"]), async (req, res) => {
    try {
      const users = await prisma.user.findMany({
        select: {
          id: true,
          email: true,
          role: true,
          password: true, // Pour debug uniquement
        },
        orderBy: { createdAt: "desc" },
        take: 10,
      });
      
      // Ne pas exposer les mots de passe complets, juste indiquer s'ils existent
      const safeUsers = users.map(u => ({
        id: u.id,
        email: u.email,
        role: u.role,
        hasPassword: !!u.password,
        passwordLength: u.password ? u.password.length : 0,
      }));
      
      res.json({ users: safeUsers, total: users.length });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });
}

export default router;

