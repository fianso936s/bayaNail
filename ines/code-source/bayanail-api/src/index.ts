import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import { sanitizeInput } from "./middleware/sanitize.js";
import { csrfToken, verifyCSRF } from "./middleware/csrf.js";
import rateLimit from "express-rate-limit";
import hpp from "hpp";
import dotenv from "dotenv";
import { createServer } from "http";
import { initSocket } from "./lib/socket.js";
import { errorHandler } from "./middleware/error.js";
import prisma from "./lib/prisma.js";
import { hashPassword } from "./lib/password.js";
import authRoutes from "./routes/auth.routes.js";
import offerRoutes from "./routes/offer.routes.js";
import contactRoutes from "./routes/contact.routes.js";
import preRegistrationRoutes from "./routes/preRegistration.routes.js";
import documentRoutes from "./routes/document.routes.js";
import billingRoutes from "./routes/billing.routes.js";
import invoiceRoutes from "./routes/invoice.routes.js";
import jobRoutes from "./routes/job.routes.js";
import studentRoutes from "./routes/student.routes.js";
import instructorRoutes from "./routes/instructor.routes.js";
import vehicleRoutes from "./routes/vehicle.routes.js";
import availabilityRoutes from "./routes/availability.routes.js";
import lessonRoutes from "./routes/lesson.routes.js";
import calendarRoutes from "./routes/calendar.routes.js";
import requestRoutes from "./routes/request.routes.js";
import skillRoutes from "./routes/skill.routes.js";
import crmRoutes from "./routes/crm.routes.js";
import settingRoutes from "./routes/setting.routes.js";
import examRoutes from "./routes/exam.routes.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Trust proxy (Nginx reverse proxy)
app.set("trust proxy", true);

const allowedCorsOrigins: Array<string | RegExp> = [
  "https://www.bayanail.com",
  "https://bayanail.com",
  "https://powderblue-turtle-426494.hostingersite.com", // Domaine Hostinger temporaire
  "http://localhost:5173",
  "http://localhost:5174", // Port alternatif Vite
  "http://127.0.0.1:5173",
  "http://127.0.0.1:5174",
  /\.bayanail\.com$/,
  /\.hostingersite\.com$/, // Autoriser tous les domaines Hostinger
];

// Permet de piloter l'origine principale via variable d'env (utile en déploiement)
if (process.env.FRONTEND_URL) {
  const frontendUrls = process.env.FRONTEND_URL.split(",").map((url) =>
    url.trim()
  );
  frontendUrls.forEach((url) => {
    if (url && !allowedCorsOrigins.includes(url)) {
      allowedCorsOrigins.unshift(url);
    }
  });
}

// Global Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message:
    "Trop de requêtes effectuées depuis cette adresse IP, réessayez plus tard.",
  standardHeaders: true,
  legacyHeaders: false,
});

// Middlewares
app.use(limiter);
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
    crossOriginEmbedderPolicy: false,
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"], // 'unsafe-inline' nécessaire pour certains frameworks CSS
        imgSrc: ["'self'", "data:", "https:"],
        connectSrc: ["'self'"],
        fontSrc: ["'self'", "data:"],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'"],
        frameSrc: ["'none'"],
        upgradeInsecureRequests: [],
      },
    },
    xssFilter: true,
    noSniff: true,
    referrerPolicy: { policy: "strict-origin-when-cross-origin" },
    permittedCrossDomainPolicies: false,
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true,
    },
  })
);
app.use(
  cors({
    origin: (origin, callback) => {
      // En développement, permettre les requêtes sans origine (ex: Postman, curl)
      if (!origin && process.env.NODE_ENV !== "production") {
        console.log(`[CORS] Requête sans origine autorisée (dev)`);
        return callback(null, true);
      }

      // Si pas d'origine en production, refuser
      if (!origin) {
        console.log(`[CORS] ❌ Requête sans origine refusée (production)`);
        return callback(new Error("Not allowed by CORS"));
      }

      console.log(`[CORS] Requête depuis origine: ${origin}`);

      // Vérifier si l'origine est autorisée
      const isAllowed = allowedCorsOrigins.some((allowed) => {
        if (typeof allowed === "string") {
          return allowed === origin;
        }
        return allowed.test(origin);
      });

      if (isAllowed) {
        // Retourner l'origine exacte pour que le header Access-Control-Allow-Origin soit correct
        console.log(`[CORS] ✅ Origine autorisée: ${origin}`);
        callback(null, origin);
      } else {
        console.log(`[CORS] ❌ Origine refusée: ${origin}`);
        console.log(`[CORS] Origines autorisées:`, allowedCorsOrigins);
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "X-CSRF-Token",
      "csrf-token",
    ],
    exposedHeaders: ["Content-Type", "X-CSRF-Token"],
  })
);
app.use(cookieParser());
app.use(hpp() as any);

// Middlewares imported at top of file

// Générer un token CSRF pour toutes les requêtes (doit être avant express.json pour les GET)
app.use(csrfToken);

// Webhook route must come BEFORE express.json()
app.use(
  "/billing/webhook",
  express.raw({ type: "application/json" }),
  (req, res, next) => {
    // Pass to billing routes specifically
    next();
  }
);

app.use(express.json({ limit: "10kb" })); // Protection against large payloads

// Sanitisation des inputs (après express.json() pour accéder au body)
app.use(sanitizeInput);

// Vérification CSRF sur toutes les routes modifiantes (après express.json pour accéder au body)
app.use(verifyCSRF);

// Routes
app.use("/auth", authRoutes);
app.use("/offers", offerRoutes);
app.use("/contact", contactRoutes);
app.use("/preinscription", preRegistrationRoutes);
app.use("/documents", documentRoutes);
app.use("/billing", billingRoutes);
app.use("/invoices", invoiceRoutes);
app.use("/jobs", jobRoutes);
app.use("/students", studentRoutes);
app.use("/instructors", instructorRoutes);
app.use("/vehicles", vehicleRoutes);
app.use("/availability", availabilityRoutes);
app.use("/lessons", lessonRoutes);
app.use("/calendar", calendarRoutes);
app.use("/lesson-requests", requestRoutes);
app.use("/skills", skillRoutes);
app.use("/crm", crmRoutes);
app.use("/settings", settingRoutes);
app.use("/exams", examRoutes);

// Health check
app.get("/health", (req, res) => {
  res.status(200).json({ status: "OK", timestamp: new Date().toISOString() });
});

// Basic route
app.get("/", (req, res) => {
  res.send("Moniteur1D API is running");
});

// Error handling - must be after all routes
app.use(errorHandler);

const httpServer = createServer(app);
initSocket(httpServer);

const ensureAdminCreated = async () => {
  try {
    const adminEmail = process.env.ADMIN_EMAIL || "admin@bayanail.com";
    // Utiliser UNIFORM_PASSWORD si défini, sinon ADMIN_PASSWORD, sinon mot de passe par défaut
    const adminPassword =
      process.env.UNIFORM_PASSWORD || process.env.ADMIN_PASSWORD || "lounes92";

    if (!adminPassword) {
      console.log(
        "⚠️ ADMIN_PASSWORD non configuré. Création admin automatique ignorée."
      );
      return;
    }

    const normalizedAdminEmail = adminEmail.toLowerCase().trim();

    // Vérifier d'abord si un admin avec cet email existe déjà
    const adminByEmail = await prisma.user.findUnique({
      where: { email: normalizedAdminEmail },
    });

    // Vérifier aussi s'il existe un admin (peu importe l'email)
    const adminExists = await prisma.user.findFirst({
      where: { role: "ADMIN" },
    });

    if (adminByEmail && adminByEmail.role === "ADMIN") {
      console.log("✅ Compte admin existe déjà avec cet email.");
      return;
    }

    if (!adminExists) {
      console.log("🚀 Tentative de création du compte admin unique...");
      const hashedPassword = await hashPassword(adminPassword);

      if (adminByEmail) {
        // Un utilisateur avec cet email existe mais n'est pas admin
        console.log(
          "⚠️ Un utilisateur avec cet email existe déjà. Mise à jour du rôle en ADMIN..."
        );
        await prisma.user.update({
          where: { id: adminByEmail.id },
          data: { role: "ADMIN" },
        });
        console.log("✅ Rôle ADMIN attribué à l'utilisateur existant.");
      } else {
        // Aucun utilisateur avec cet email, créer un nouvel admin
        await prisma.user.create({
          data: {
            email: normalizedAdminEmail, // Sauvegarder l'email normalisé
            password: hashedPassword,
            role: "ADMIN",
            profile: {
              create: {
                firstName: "Admin",
                lastName: "System",
              },
            },
          },
        });
        console.log("✅ Compte admin créé avec succès au démarrage.");
      }
    } else if (adminByEmail && adminByEmail.role !== "ADMIN") {
      // Un admin existe mais pas avec cet email, et un utilisateur avec cet email existe mais n'est pas admin
      console.log(
        "⚠️ Un admin existe déjà mais avec un autre email. L'utilisateur avec cet email sera promu ADMIN."
      );
      await prisma.user.update({
        where: { id: adminByEmail.id },
        data: { role: "ADMIN" },
      });
      console.log("✅ Rôle ADMIN attribué à l'utilisateur existant.");
    }
  } catch (error) {
    console.error(
      "❌ Erreur lors de la vérification/création de l'admin :",
      error
    );
  }
};

httpServer.listen(PORT, async () => {
  console.log(`Server is running on port ${PORT}`);
  await ensureAdminCreated();
});
