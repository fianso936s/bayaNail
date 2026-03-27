import { Request, Response } from "express";
import { z } from "zod";
import prisma from "../lib/prisma.js";
import { nameSchema, emailSchema, phoneSchema, messageSchema } from "../lib/validations/common.js";

const contactSchema = z.object({
  firstName: z.string().pipe(nameSchema),
  lastName: z.string().pipe(nameSchema),
  email: z.string().pipe(emailSchema),
  phone: phoneSchema.optional(),
  message: z.string().pipe(messageSchema),
  website: z.string().optional(), // Honeypot field
});

export const submitContact = async (req: Request, res: Response) => {
  try {
    const validatedData = contactSchema.parse(req.body);

    // Simple honeypot check: if 'website' field is filled, it's likely a bot
    if (validatedData.website) {
      return res.status(400).json({ message: "Spam détecté" });
    }

    const lead = await prisma.lead.upsert({
      where: { email: validatedData.email },
      update: {
        firstName: validatedData.firstName,
        lastName: validatedData.lastName,
        phone: validatedData.phone,
        status: "NEW",
        updatedAt: new Date(),
      },
      create: {
        email: validatedData.email,
        firstName: validatedData.firstName,
        lastName: validatedData.lastName,
        phone: validatedData.phone,
        source: "website",
        status: "NEW",
      },
    });

    // Créer une activité pour stocker le message
    await prisma.leadActivity.create({
      data: {
        leadId: lead.id,
        type: "NOTE",
        content: validatedData.message,
      },
    });

    res.status(201).json({ message: "Votre message a été envoyé avec succès" });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ errors: error.errors });
    }
    res.status(500).json({ message: "Une erreur est survenue lors de l'envoi du message" });
  }
};

