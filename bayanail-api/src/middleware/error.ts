import { Request, Response, NextFunction } from "express";

export interface AppError extends Error {
  statusCode?: number;
}

export const errorHandler = (
  err: AppError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const statusCode = err.statusCode || 500;
  
  // Log l'erreur pour les développeurs
  console.error(`[${new Date().toISOString()}] ${err.stack || err.message}`);

  // Ne pas exposer les détails de l'erreur en production
  const message = process.env.NODE_ENV === "production" && statusCode === 500
    ? "Une erreur interne est survenue"
    : err.message;

  res.status(statusCode).json({
    status: "error",
    message,
    ...(process.env.NODE_ENV !== "production" && { stack: err.stack })
  });
};

