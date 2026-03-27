import { z } from "zod";
import { nameSchema, emailSchema, phoneSchema, messageSchema, noHTML } from "./common.js";

export const instructorSchema = z.object({
  body: z.object({
    email: z.string({ required_error: "Email requis" }).pipe(emailSchema),
    password: z.string({ required_error: "Mot de passe requis" }).min(8, "8 caractères minimum").max(128, "Le mot de passe ne peut pas dépasser 128 caractères"),
    firstName: z.string({ required_error: "Prénom requis" }).pipe(nameSchema),
    lastName: z.string({ required_error: "Nom requis" }).pipe(nameSchema),
    phone: z.string({ required_error: "Téléphone requis" }).pipe(phoneSchema),
    licenseNumber: z.string().min(3, "Le numéro de permis doit contenir au moins 3 caractères").max(50, "Le numéro de permis ne peut pas dépasser 50 caractères").pipe(noHTML("Le numéro de permis ne peut pas contenir de HTML ou JavaScript")).optional(),
    bio: z.string().max(1000, "La biographie ne peut pas dépasser 1000 caractères").pipe(messageSchema).optional(),
    isActive: z.boolean().optional(),
  }),
});

export const updateInstructorSchema = instructorSchema.partial();

