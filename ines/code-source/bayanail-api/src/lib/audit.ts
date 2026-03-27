import prisma from "./prisma.js";

export const logAction = async (
  action: string,
  entity: string,
  entityId: string,
  userId?: string,
  metadata?: any
) => {
  try {
    await prisma.auditLog.create({
      data: {
        action,
        entity,
        entityId,
        userId,
        metadata: metadata ? JSON.parse(JSON.stringify(metadata)) : undefined,
      },
    });
  } catch (error) {
    console.error("Failed to create audit log:", error);
  }
};

