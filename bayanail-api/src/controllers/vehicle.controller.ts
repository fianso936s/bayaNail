import { Request, Response } from "express";
import prisma from "../lib/prisma.js";
import { z } from "zod";
import { logAction } from "../lib/audit.js";
import { AuthRequest } from "../middleware/auth.js";
import { emitEvent } from "../lib/socket.js";

const vehicleSchema = z.object({
  name: z.string().min(2),
  plateNumber: z.string().min(5),
  transmission: z.enum(["MANUAL", "AUTO"]),
  isActive: z.boolean().optional(),
});

export const getVehicles = async (req: AuthRequest, res: Response) => {
  try {
    const vehicles = await prisma.vehicle.findMany({
      orderBy: { createdAt: "desc" },
    });
    res.json(vehicles);
  } catch (error) {
    res.status(500).json({ message: "Erreur lors de la récupération des véhicules" });
  }
};

export const createVehicle = async (req: AuthRequest, res: Response) => {
  try {
    const data = vehicleSchema.parse(req.body);

    const vehicle = await prisma.vehicle.create({
      data: {
        name: data.name,
        plateNumber: data.plateNumber,
        transmission: data.transmission,
        isActive: data.isActive ?? true,
      }
    });

    await logAction("CREATE", "Vehicle", vehicle.id, req.user?.id);
    emitEvent("vehicle:create", vehicle);
    res.status(201).json(vehicle);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ errors: error.errors });
    }
    res.status(500).json({ message: "Erreur lors de la création du véhicule" });
  }
};

export const updateVehicle = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const updateSchema = vehicleSchema.partial();

  try {
    const data = updateSchema.parse(req.body);
    
    const vehicle = await prisma.vehicle.update({
      where: { id },
      data,
    });

    await logAction("UPDATE", "Vehicle", vehicle.id, req.user?.id, data);
    emitEvent("vehicle:update", vehicle);
    res.json(vehicle);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ errors: error.errors });
    }
    res.status(500).json({ message: "Erreur lors de la mise à jour du véhicule" });
  }
};

export const toggleVehicleActive = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { isActive } = req.body;

  try {
    const vehicle = await prisma.vehicle.update({
      where: { id },
      data: { isActive },
    });
    await logAction("TOGGLE_ACTIVE", "Vehicle", id, req.user?.id, { isActive });
    emitEvent("vehicle:update", vehicle);
    res.json(vehicle);
  } catch (error) {
    res.status(500).json({ message: "Erreur lors du changement de statut" });
  }
};

export const deleteVehicle = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;

  try {
    const vehicle = await prisma.vehicle.findUnique({
      where: { id },
      include: { _count: { select: { lessons: { where: { startAt: { gte: new Date() } } } } } }
    });

    if (!vehicle) return res.status(404).json({ message: "Véhicule non trouvé" });

    // Safety check: no future lessons
    if (vehicle._count.lessons > 0) {
      return res.status(400).json({ 
        message: "Impossible de supprimer un véhicule ayant des leçons futures prévues." 
      });
    }

    await prisma.vehicle.delete({ where: { id } });
    await logAction("DELETE", "Vehicle", id, req.user?.id);
    emitEvent("vehicle:delete", id);
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ message: "Erreur lors de la suppression du véhicule" });
  }
};

