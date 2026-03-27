import { Response, NextFunction } from "express";
import { AuthRequest } from "../../middleware/auth.js";
import prisma from "../prisma.js";

/**
 * Middleware de base pour vérifier que l'utilisateur est authentifié
 */
export const requireAuth = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({ message: "Authentification requise" });
  }
  next();
};

/**
 * Vérifie que l'utilisateur a l'un des rôles autorisés
 */
export const requireRole = (roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ message: "Authentification requise" });
    }
    
    // Bypass pour l'admin
    if (req.user.role === "ADMIN") {
      return next();
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: "Accès refusé - Rôle insuffisant" });
    }
    next();
  };
};

/**
 * Vérifie que l'élève accède à ses propres données
 */
export const requireOwnershipStudent = (studentIdParamName: string = "id") => {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ message: "Authentification requise" });
    }

    // Bypass admin
    if (req.user.role === "ADMIN") {
      return next();
    }

    const requestedStudentId = req.params[studentIdParamName];

    // On récupère le StudentProfile lié à l'utilisateur connecté
    const studentProfile = await prisma.studentProfile.findUnique({
      where: { userId: req.user.id }
    });

    if (!studentProfile || studentProfile.id !== requestedStudentId) {
      return res.status(403).json({ message: "Accès refusé - Vous ne pouvez accéder qu'à vos propres données" });
    }

    next();
  };
};

/**
 * Vérifie qu'un moniteur a accès aux données d'un élève (via une leçon commune)
 */
export const requireInstructorHasAccess = (studentIdParamName: string = "studentId", source: "params" | "body" = "params") => {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ message: "Authentification requise" });
    }

    // Bypass admin
    if (req.user.role === "ADMIN") {
      return next();
    }

    if (req.user.role !== "INSTRUCTOR") {
      return res.status(403).json({ message: "Accès réservé aux moniteurs" });
    }

    const studentId = source === "params" ? req.params[studentIdParamName] : req.body[studentIdParamName];
    
    if (!studentId) {
      return res.status(400).json({ message: "ID de l'élève manquant" });
    }
    
    // On récupère le InstructorProfile lié à l'utilisateur connecté
    const instructorProfile = await prisma.instructorProfile.findUnique({
      where: { userId: req.user.id }
    });

    if (!instructorProfile) {
      return res.status(403).json({ message: "Accès refusé - Profil moniteur non trouvé" });
    }

    // Vérifier si le moniteur a au moins une leçon passée, présente ou future avec cet élève
    const hasLesson = await prisma.lesson.findFirst({
      where: {
        instructorId: instructorProfile.id,
        studentId: studentId
      }
    });

    if (!hasLesson) {
      return res.status(403).json({ message: "Accès refusé - Cet élève ne vous est pas assigné (aucune leçon commune)" });
    }

    next();
  };
};

/**
 * Vérifie qu'un utilisateur a accès à une leçon spécifique
 */
export const requireLessonAccess = (lessonIdParamName: string = "id") => {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ message: "Authentification requise" });
    }

    // Bypass admin
    if (req.user.role === "ADMIN") {
      return next();
    }

    const lessonId = req.params[lessonIdParamName];
    const lesson = await prisma.lesson.findUnique({
      where: { id: lessonId },
      include: {
        instructor: true,
        student: true
      }
    });

    if (!lesson) {
      return res.status(404).json({ message: "Leçon non trouvée" });
    }

    if (req.user.role === "INSTRUCTOR") {
      const instructorProfile = await prisma.instructorProfile.findUnique({
        where: { userId: req.user.id }
      });
      if (!instructorProfile || lesson.instructorId !== instructorProfile.id) {
        return res.status(403).json({ message: "Accès refusé - Vous n'êtes pas le moniteur de cette leçon" });
      }
      return next();
    } else if (req.user.role === "STUDENT") {
      const studentProfile = await prisma.studentProfile.findUnique({
        where: { userId: req.user.id }
      });
      if (!studentProfile || lesson.studentId !== studentProfile.id) {
        return res.status(403).json({ message: "Accès refusé - Cette leçon ne vous appartient pas" });
      }
      return next();
    }
    
    return res.status(403).json({ message: "Accès refusé - Rôle non autorisé" });
  };
};

/**
 * Vérifie qu'un moniteur a accès à un examen (via l'élève)
 */
export const requireExamAccess = (examIdParamName: string = "id") => {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ message: "Authentification requise" });
    }

    // Bypass admin
    if (req.user.role === "ADMIN") {
      return next();
    }

    const examId = req.params[examIdParamName];
    const exam = await prisma.exam.findUnique({
      where: { id: examId },
    });

    if (!exam) {
      return res.status(404).json({ message: "Examen non trouvé" });
    }

    if (req.user.role === "STUDENT") {
      const studentProfile = await prisma.studentProfile.findUnique({
        where: { userId: req.user.id }
      });
      if (!studentProfile || exam.studentId !== studentProfile.id) {
        return res.status(403).json({ message: "Accès refusé - Cet examen ne vous appartient pas" });
      }
      return next();
    } else if (req.user.role === "INSTRUCTOR") {
      const instructorProfile = await prisma.instructorProfile.findUnique({
        where: { userId: req.user.id }
      });
      if (!instructorProfile) {
        return res.status(403).json({ message: "Accès refusé - Profil moniteur non trouvé" });
      }
      
      // Vérifier si le moniteur a accès à cet élève via une leçon
      const studentProfile = await prisma.studentProfile.findUnique({
        where: { id: exam.studentId }
      });
      
      if (studentProfile) {
        const hasLesson = await prisma.lesson.findFirst({
          where: {
            instructorId: instructorProfile.id,
            studentId: studentProfile.id
          }
        });
        
        if (!hasLesson) {
          return res.status(403).json({ message: "Accès refusé - Cet élève ne vous est pas assigné" });
        }
      }
      
      return next();
    }
    
    return res.status(403).json({ message: "Accès refusé - Rôle non autorisé" });
  };
};

/**
 * Vérifie qu'un moniteur ou administrateur a accès à une demande de leçon
 */
export const requireRequestAccess = (requestIdParamName: string = "id") => {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ message: "Authentification requise" });
    }

    // Bypass admin
    if (req.user.role === "ADMIN") {
      return next();
    }

    const requestId = req.params[requestIdParamName];
    const lessonRequest = await prisma.lessonRequest.findUnique({
      where: { id: requestId },
    });

    if (!lessonRequest) {
      return res.status(404).json({ message: "Demande non trouvée" });
    }

    if (req.user.role === "STUDENT") {
      const studentProfile = await prisma.studentProfile.findUnique({
        where: { userId: req.user.id }
      });
      if (!studentProfile || lessonRequest.studentId !== studentProfile.id) {
        return res.status(403).json({ message: "Accès refusé - Cette demande ne vous appartient pas" });
      }
    } else if (req.user.role === "INSTRUCTOR") {
      const instructorProfile = await prisma.instructorProfile.findUnique({
        where: { userId: req.user.id }
      });
      
      if (!instructorProfile) {
        return res.status(403).json({ message: "Accès refusé" });
      }

      // Pour une demande, on vérifie si le moniteur a déjà eu des leçons avec cet élève
      // OU si le moniteur est "libre" pour voir toutes les demandes (dépend de la politique métier)
      // Ici, on va permettre aux moniteurs de voir les demandes seulement s'ils ont déjà eu l'élève.
      const hasLesson = await prisma.lesson.findFirst({
        where: {
          instructorId: instructorProfile.id,
          studentId: lessonRequest.studentId
        }
      });

      if (!hasLesson) {
        return res.status(403).json({ message: "Accès refusé - Cet élève ne vous est pas assigné" });
      }
      return next();
    }
    
    // Si aucun rôle correspondant, refuser l'accès
    return res.status(403).json({ message: "Accès refusé - Rôle non autorisé" });
  };
};



