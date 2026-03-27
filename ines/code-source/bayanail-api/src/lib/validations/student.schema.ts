import { z } from "zod";
import { nameSchema, emailSchema, phoneSchema, citySchema, addressSchema } from "./common.js";

export const studentSchema = z.object({
  body: z.object({
    email: z.string({ required_error: "Email requis" }).pipe(emailSchema),
    password: z.string({ required_error: "Mot de passe requis" }).min(8, "8 caractères minimum").max(128, "Le mot de passe ne peut pas dépasser 128 caractères"),
    firstName: z.string({ required_error: "Prénom requis" }).pipe(nameSchema),
    lastName: z.string({ required_error: "Nom requis" }).pipe(nameSchema),
    phone: z.string({ required_error: "Téléphone requis" }).pipe(phoneSchema),
    city: z.string({ required_error: "Ville requise" }).pipe(citySchema),
    birthDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Format de date invalide (YYYY-MM-DD)").optional(),
    address: addressSchema,
    postalCode: z.string().regex(/^\d{5}$/, "Code postal invalide (5 chiffres)").optional(),
    cpfEligible: z.boolean().optional(),
  }),
});

export const updateStudentSchema = studentSchema.partial();

