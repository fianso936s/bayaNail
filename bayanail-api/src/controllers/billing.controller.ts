import { Request, Response } from "express";
import stripe from "../lib/stripe.js";
import prisma from "../lib/prisma.js";
import { AuthRequest } from "../middleware/auth.js";
import { generateInvoicePDF } from "../lib/pdf.js";
import { sendEmail, templates } from "../lib/email.js";

export const createCheckoutSession = async (req: AuthRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ message: "Non authentifié" });

  const { preRegistrationId, type } = req.body;

  try {
    const preRegistration = await prisma.preRegistration.findUnique({
      where: { id: preRegistrationId },
      include: { offer: true }
    });

    if (!preRegistration) {
      return res.status(404).json({ message: "Pré-inscription non trouvée" });
    }

    if (preRegistration.userId !== req.user.id && req.user.role !== "ADMIN") {
      return res.status(403).json({ message: "Accès refusé - Cette pré-inscription ne vous appartient pas" });
    }

    const amount = type === "DEPOSIT" ? 250 : preRegistration.offer.price; // Example: 250€ deposit or full price

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "eur",
            product_data: {
              name: `Acompte - ${preRegistration.offer.name}`,
            },
            unit_amount: amount * 100,
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${process.env.FRONTEND_URL}/dashboard?payment=success`,
      cancel_url: `${process.env.FRONTEND_URL}/dashboard?payment=cancel`,
      client_reference_id: preRegistrationId,
      customer_email: req.user.email,
      metadata: {
        userId: req.user.id,
        preRegistrationId,
        type,
      },
    });

    // Create pending payment
    await prisma.payment.create({
      data: {
        amount,
        status: "PENDING",
        stripeSessionId: session.id,
        userId: req.user.id,
        preRegistrationId,
      }
    });

    res.json({ url: session.url });
  } catch (error) {
    res.status(500).json({ message: "Erreur lors de la création de la session" });
  }
};

export const handleWebhook = async (req: Request, res: Response) => {
  const sig = req.headers["stripe-signature"] as string;
  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err: any) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as any;
    const preRegistrationId = session.client_reference_id;

    try {
      const payment = await prisma.payment.update({
        where: { stripeSessionId: session.id },
        data: { status: "PAID" },
      });

      await prisma.preRegistration.update({
        where: { id: preRegistrationId },
        data: { status: "PAID_DEPOSIT" },
      });

      // Create Invoice
      const invoiceNumber = `INV-${Date.now()}`;
      
      const user = await prisma.user.findUnique({
        where: { id: payment.userId },
        include: { profile: true }
      });
      
      const preReg = await prisma.preRegistration.findUnique({
        where: { id: preRegistrationId },
        include: { offer: true }
      });

      const pdfUrl = await generateInvoicePDF({
        number: invoiceNumber,
        customerName: `${user?.profile?.firstName} ${user?.profile?.lastName}`,
        description: preReg?.offer.name,
        amount: payment.amount
      });

      await prisma.invoice.create({
        data: {
          number: invoiceNumber,
          paymentId: payment.id,
          pdfUrl: pdfUrl
        }
      });

      // Log action
      await prisma.auditLog.create({
        data: {
          action: "PAYMENT_COMPLETED",
          entity: "PAYMENT",
          entityId: payment.id,
          userId: payment.userId,
        }
      });

      // Send Email
      const welcome = templates.welcomeAfterDeposit(user?.profile?.firstName || "Élève");
      await sendEmail(user!.email, welcome.subject, welcome.html, "WELCOME_DEPOSIT", user!.id);
      
      const receipt = templates.paymentReceipt(payment.amount);
      await sendEmail(user!.email, receipt.subject, receipt.html, "PAYMENT_RECEIPT", user!.id);
    } catch (error) {
      console.error("Webhook processing failed", error);
    }
  }

  res.json({ received: true });
};

