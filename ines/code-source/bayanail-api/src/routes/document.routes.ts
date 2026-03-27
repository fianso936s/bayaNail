import { Router } from "express";
import multer from "multer";
import { uploadDocument, getDocuments, updateDocumentStatus } from "../controllers/document.controller.js";
import { authenticate, authorize } from "../middleware/auth.js";

const router = Router();
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ["image/jpeg", "image/png", "application/pdf"];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Format de fichier non supporté. Seuls JPG, PNG et PDF sont autorisés."));
    }
  }
});

router.use(authenticate);

router.post("/upload", (req, res, next) => {
  upload.single("file")(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      return res.status(400).json({ message: `Erreur d'upload: ${err.message}` });
    } else if (err) {
      return res.status(400).json({ message: err.message });
    }
    next();
  });
}, uploadDocument);
router.get("/", getDocuments);
router.patch("/:id/status", authorize(["ADMIN"]), updateDocumentStatus);

export default router;

