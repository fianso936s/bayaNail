import { Request, Response } from "express";
import prisma from "../lib/prisma.js";
import { sendEmail } from "../lib/email.js";

export const runJobs = async (req: Request, res: Response) => {
  const token = req.query.token;

  if (token !== process.env.CRON_TOKEN) {
    return res.status(403).json({ message: "Accès refusé" });
  }

  try {
    const results = [];

    // 1. Relance pré-inscriptions SUBMITTED non payées
    const pendingPreRegs = await prisma.preRegistration.findMany({
      where: {
        status: "SUBMITTED",
        createdAt: { lt: new Date(Date.now() - 24 * 60 * 60 * 1000) }, // more than 24h ago
        payments: { none: { status: "PAID" } }
      },
      include: { user: true }
    });

    for (const pr of pendingPreRegs) {
      await sendEmail(
        pr.user.email,
        "Finalisez votre inscription",
        "<p>N'oubliez pas de payer votre acompte pour valider votre place.</p>",
        "REMINDER_PAYMENT",
        pr.userId
      );
      results.push(`Email envoyé à ${pr.user.email} (pré-inscription)`);
    }

    // 2. Relance leads nextFollowUpAt atteint
    const pendingLeads = await prisma.lead.findMany({
      where: {
        nextFollowUpAt: { lte: new Date() },
        status: { not: "CONVERTED" }
      }
    });

    const adminEmail = process.env.ADMIN_EMAIL || "admin@bayanail.com";
    for (const lead of pendingLeads) {
      await sendEmail(
        adminEmail,
        `Relance Lead: ${lead.firstName} ${lead.lastName}`,
        `<p>Le lead ${lead.email} doit être relancé.</p>`,
        "STAFF_REMINDER_LEAD"
      );
      results.push(`Rappel staff envoyé pour ${lead.email}`);
    }

    // Log action
    await prisma.auditLog.create({
      data: {
        action: "RUN_JOBS",
        entity: "SYSTEM",
        metadata: { results }
      }
    });

    res.json({ message: "Jobs exécutés", results });
  } catch (error) {
    res.status(500).json({ message: "Erreur lors de l'exécution des jobs" });
  }
};

