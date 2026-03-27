import { z } from "zod";
import { nameSchema, emailSchema } from "./common.js";

export const registerSchema = z.object({
  body: z.object({
    email: z.string({
      required_error: "L'email est requis",
    }).pipe(emailSchema),
    password: z.string().optional(),
    firstName: z.string({
      required_error: "Le prénom est requis",
    }).pipe(nameSchema),
    lastName: z.string({
      required_error: "Le nom est requis",
    }).pipe(nameSchema),
  }),
});

export const loginSchema = z.object({
  body: z.object({
    email: z.string({
      required_error: "L'email est requis",
    }).pipe(emailSchema),
    password: z.string({
      required_error: "Le mot de passe est requis",
    }).min(1, "Le mot de passe est requis"),
  }),
});

