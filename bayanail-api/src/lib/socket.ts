import { Server } from "socket.io";
import { Server as HTTPServer } from "http";

let io: Server;

// Liste des origines autorisées pour Socket.IO (identique à celle de CORS Express)
const getAllowedSocketOrigins = (): Array<string | RegExp> => {
  const origins: Array<string | RegExp> = [
    "https://www.bayanail.com",
    "https://bayanail.com",
    "https://powderblue-turtle-426494.hostingersite.com",
    "http://localhost:5173",
    "http://localhost:5174",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:5174",
    /\.bayanail\.com$/,
    /\.hostingersite\.com$/,
  ];

  // Ajouter les URLs depuis FRONTEND_URL si défini
  if (process.env.FRONTEND_URL) {
    const frontendUrls = process.env.FRONTEND_URL.split(",").map(url => url.trim());
    frontendUrls.forEach(url => {
      if (url && !origins.includes(url)) {
        origins.unshift(url);
      }
    });
  }

  return origins;
};

export const initSocket = (httpServer: HTTPServer) => {
  const allowedOrigins = getAllowedSocketOrigins();
  
  io = new Server(httpServer, {
    cors: {
      origin: (origin, callback) => {
        // En développement, permettre les requêtes sans origine
        if (!origin && process.env.NODE_ENV !== "production") {
          return callback(null, true);
        }
        
        // Si pas d'origine en production, refuser
        if (!origin) {
          return callback(new Error("Not allowed by CORS"));
        }
        
        // Vérifier si l'origine est autorisée
        const isAllowed = allowedOrigins.some(allowed => {
          if (typeof allowed === "string") {
            return allowed === origin;
          }
          return allowed.test(origin);
        });
        
        if (isAllowed) {
          // Retourner l'origine exacte pour que le header Access-Control-Allow-Origin soit correct
          callback(null, origin);
        } else {
          callback(new Error("Not allowed by CORS"));
        }
      },
      credentials: true,
    },
  });

  io.on("connection", (socket) => {
    console.log(`User connected: ${socket.id}`);

    socket.on("disconnect", () => {
      console.log(`User disconnected: ${socket.id}`);
    });
  });

  return io;
};

export const getIO = () => {
  if (!io) {
    throw new Error("Socket.io not initialized!");
  }
  return io;
};

export const emitEvent = (event: string, data: any) => {
  if (io) {
    io.emit(event, data);
  }
};

