import { Resend } from "resend";
import prisma from "./prisma.js";

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

export const sendEmail = async (to: string, subject: string, html: string, type: string, userId?: string) => {
  let status = "MOCK_SENT";

  if (resend) {
    try {
      await resend.emails.send({
        from: "Moniteur1D <noreply@bayanail.fr>",
        to,
        subject,
        html,
      });
      status = "SENT";
    } catch (error) {
      console.error("Email sending failed", error);
      status = "FAILED";
    }
  } else {
    console.log(`MOCK EMAIL to ${to}: ${subject}`);
  }

  // Log notification
  await prisma.notificationLog.create({
    data: {
      type,
      recipient: to,
      userId,
      status,
    }
  });
};

export const templates = {
  welcomeAfterDeposit: (name: string) => ({
    subject: "Bienvenue chez Moniteur1D !",
    html: `<h1>Bienvenue ${name} !</h1><p>Votre acompte a été reçu. Vous pouvez maintenant accéder à votre espace élève.</p>`
  }),
  paymentReceipt: (amount: number) => ({
    subject: "Reçu de votre paiement",
    html: `<p>Nous avons bien reçu votre paiement de ${amount} €.</p>`
  }),
  docApproved: (type: string) => ({
    subject: "Document validé",
    html: `<p>Votre document "${type}" a été validé par notre équipe.</p>`
  }),
  docRejected: (type: string, reason: string) => ({
    subject: "Document refusé",
    html: `<p>Votre document "${type}" a été refusé pour la raison suivante : ${reason}. Veuillez le télécharger à nouveau.</p>`
  }),
};

