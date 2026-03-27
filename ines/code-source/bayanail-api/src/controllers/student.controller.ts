import { Request, Response } from "express";
import prisma from "../lib/prisma.js";
import { hashPassword } from "../lib/password.js";
import { logAction } from "../lib/audit.js";
import { AuthRequest } from "../middleware/auth.js";
import { emitEvent } from "../lib/socket.js";
import { z } from "zod";
import { studentSchema } from "../lib/validations/student.schema.js";

export const getStudents = async (req: AuthRequest, res: Response) => {
  const { query, status, page = "1" } = req.query;
  const skip = (parseInt(page as string) - 1) * 10;

  try {
    const students = await prisma.studentProfile.findMany({
      where: {
        AND: [
          {
            user: {
              role: { not: "ADMIN" }
            }
          },
          query ? {
            OR: [
              { firstName: { contains: query as string } },
              { lastName: { contains: query as string } },
              { user: { email: { contains: query as string } } },
            ]
          } : {},
        ]
      },
      include: {
        user: {
          select: {
            email: true,
            role: true,
          }
        }
      },
      skip,
      take: 10,
      orderBy: { createdAt: "desc" },
    });

    res.json(students);
  } catch (error) {
    res.status(500).json({ message: "Erreur lors de la récupération des élèves" });
  }
};

export const createStudent = async (req: AuthRequest, res: Response) => {
  try {
    const data = req.body; // Les données sont déjà validées par le middleware validate()
    const normalizedEmail = data.email.toLowerCase().trim();
    
    // Vérifier si l'email existe déjà
    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail }
    });
    
    if (existingUser) {
      return res.status(400).json({ message: "Cet email est déjà utilisé" });
    }
    
    // Le mot de passe est requis par le schéma de validation
    if (!data.password) {
      return res.status(400).json({ message: "Le mot de passe est requis" });
    }
    
    const hashedPassword = await hashPassword(data.password);

    const student = await prisma.user.create({
      data: {
        email: normalizedEmail, // Sauvegarder l'email normalisé
        password: hashedPassword,
        role: "STUDENT",
        studentProfile: {
          create: {
            firstName: data.firstName,
            lastName: data.lastName,
            phone: data.phone,
            city: data.city,
            birthDate: data.birthDate ? new Date(data.birthDate) : null,
            address: data.address,
            postalCode: data.postalCode,
            cpfEligible: data.cpfEligible,
          }
        }
      },
      include: {
        studentProfile: true
      }
    });

    await logAction("CREATE", "Student", student.id, req.user?.id);
    emitEvent("student:create", student);
    
    // Ne pas renvoyer le mot de passe haché
    const { password: _, ...studentWithoutPassword } = student;
    res.status(201).json(studentWithoutPassword);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ errors: error.errors });
    }
    res.status(500).json({ message: "Erreur lors de la création de l'élève" });
  }
};

export const getStudentById = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;

  try {
    const student = await prisma.studentProfile.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            email: true,
            role: true,
          }
        }
      }
    });

    if (!student) {
      return res.status(404).json({ message: "Élève non trouvé" });
    }

    res.json(student);
  } catch (error) {
    res.status(500).json({ message: "Erreur lors de la récupération de l'élève" });
  }
};

export const updateStudent = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const updateSchema = studentSchema.partial();

  try {
    const validated = updateSchema.parse({ body: req.body });
    const bodyData = validated.body;
    
    const updateData: any = {};
    if (bodyData?.firstName !== undefined) updateData.firstName = bodyData.firstName;
    if (bodyData?.lastName !== undefined) updateData.lastName = bodyData.lastName;
    if (bodyData?.phone !== undefined) updateData.phone = bodyData.phone;
    if (bodyData?.city !== undefined) updateData.city = bodyData.city;
    if (bodyData?.birthDate !== undefined) updateData.birthDate = new Date(bodyData.birthDate);
    if (bodyData?.address !== undefined) updateData.address = bodyData.address;
    if (bodyData?.postalCode !== undefined) updateData.postalCode = bodyData.postalCode;
    if (bodyData?.cpfEligible !== undefined) updateData.cpfEligible = bodyData.cpfEligible;
    
    const student = await prisma.studentProfile.update({
      where: { id },
      data: updateData,
    });

    await logAction("UPDATE", "Student", student.id, req.user?.id, updateData);
    emitEvent("student:update", student);
    res.json(student);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ errors: error.errors });
    }
    res.status(500).json({ message: "Erreur lors de la mise à jour de l'élève" });
  }
};

export const deleteStudent = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;

  try {
    // Soft delete can be implemented by adding an isActive field to User or StudentProfile
    // For now, we'll just delete the user (which cascades to profile)
    const profile = await prisma.studentProfile.findUnique({ where: { id } });
    if (!profile) return res.status(404).json({ message: "Élève non trouvé" });

    await prisma.user.delete({ where: { id: profile.userId } });
    await logAction("DELETE", "Student", id, req.user?.id);
    emitEvent("student:delete", id);
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ message: "Erreur lors de la suppression de l'élève" });
  }
};

