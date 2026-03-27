import { Request, Response } from "express";
import prisma from "../lib/prisma.js";

export const getSettings = async (req: Request, res: Response) => {
  try {
    const settings = await prisma.setting.findMany();
    res.json(settings);
  } catch (error) {
    res.status(500).json({ message: "Erreur lors de la récupération des paramètres" });
  }
};

export const updateSetting = async (req: Request, res: Response) => {
  const { key } = req.params;
  const { valueJson } = req.body;

  try {
    const setting = await prisma.setting.upsert({
      where: { key },
      update: { valueJson },
      create: { key, valueJson },
    });
    res.json(setting);
  } catch (error) {
    res.status(500).json({ message: "Erreur lors de la mise à jour du paramètre" });
  }
};

