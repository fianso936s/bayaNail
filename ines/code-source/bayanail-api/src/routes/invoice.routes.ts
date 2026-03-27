import { Router, Response } from "express";
import prisma from "../lib/prisma.js";
import { authenticate } from "../middleware/auth.js";
import { AuthRequest } from "../middleware/auth.js";

const router = Router();

router.get("/:id/pdf", authenticate, async (req: AuthRequest, res: Response) => {
  const { id } = req.params;

  try {
    const invoice = await prisma.invoice.findUnique({
      where: { id },
      include: { payment: true }
    });

    if (!invoice) return res.status(404).json({ message: "Facture non trouvée" });

    // Authorization check
    if (req.user?.role !== "ADMIN" && invoice.payment.userId !== req.user?.id) {
      return res.status(403).json({ message: "Accès refusé" });
    }

    if (!invoice.pdfUrl) return res.status(404).json({ message: "PDF non généré" });

    res.json({ pdfUrl: invoice.pdfUrl });
  } catch (error) {
    res.status(500).json({ message: "Erreur lors de la récupération du PDF" });
  }
});

export default router;

