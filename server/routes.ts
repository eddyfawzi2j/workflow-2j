import { Router, Request, Response, NextFunction, Express } from "express";
import { Server, createServer } from "http";
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import session from "express-session";
import { z, ZodError } from "zod";
import multer from "multer";
import * as fs from "fs/promises";
import * as path from "path";

import { storage } from "./storage";
import { 
  User, loginSchema, insertUserSchema, 
  insertRequestSchema, approvalActionSchema,
  documentSearchSchema, insertDocumentSchema, insertDocumentCategorySchema, insertDocumentTagSchema
} from "@shared/schema";
import { OCRService } from "./services/ocr-service";
import { UploadService } from "./services/upload-service";

// Set up multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024 // Limite à 10MB
  }
});

function formatZodError(error: ZodError) {
  return error.errors.map(err => ({
    path: err.path.join("."),
    message: err.message
  }));
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Créer le répertoire d'uploads s'il n'existe pas
  await UploadService.ensureUploadDirExists();

  // Auth middleware
  const isAuthenticated = (req: Request, res: Response, next: Function) => {
    if (req.isAuthenticated()) {
      return next();
    }
    res.status(401).json({ message: "Unauthorized" });
  };

  // Servir les fichiers statiques du répertoire uploads
  app.use('/uploads', isAuthenticated, async (req, res, next) => {
    // Vérifier si l'utilisateur a le droit d'accéder au fichier
    // Dans une application complète, on vérifierait les droits d'accès dans la base de données
    // Pour l'instant, on autorise tous les utilisateurs authentifiés à accéder aux fichiers
    if (req.path) {
      try {
        const filePath = path.join(UploadService.UPLOAD_DIR, req.path);
        // Vérifier que le fichier existe
        await fs.access(filePath);

        // Pour un meilleur contrôle, déduire le type MIME du fichier au lieu de le servir directement
        const documentId = parseInt(req.path.split('/')[0].replace('document_', ''));
        if (!isNaN(documentId)) {
          // Enregistrer l'accès au document
          await storage.logDocumentAccess(documentId, req.user!.id, "download");
        }

        // Servir le fichier
        res.sendFile(path.resolve(filePath));
      } catch (error) {
        return res.status(404).json({ message: "Fichier non trouvé" });
      }
    } else {
      return res.status(403).json({ message: "Accès refusé" });
    }
  });
  // Session setup using the storage implementation's session store
  app.use(
    session({
      store: storage.sessionStore,
      secret: process.env.SESSION_SECRET || "workflow-secret",
      resave: false,
      saveUninitialized: false,
      cookie: { 
        secure: process.env.NODE_ENV === "production",
        maxAge: 1000 * 60 * 60 * 24 // 24 hours
      }
    })
  );

  // Passport setup
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        const user = await storage.getUserByUsername(username);
        if (!user || user.password !== password) {
          return done(null, false, { message: "Invalid username or password" });
        }
        return done(null, {
          id: user.id,
          username: user.username,
          fullName: user.fullName,
          department: user.department,
          role: user.role
        });
      } catch (err) {
        return done(err);
      }
    })
  );

  passport.serializeUser((user, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await storage.getUser(id);
      if (!user) {
        return done(null, false);
      }

      done(null, {
        id: user.id,
        username: user.username,
        fullName: user.fullName,
        department: user.department,
        role: user.role
      });
    } catch (err) {
      done(err);
    }
  });

  // API Routes
  // Auth routes
  app.post("/api/auth/login", (req, res, next) => {
    try {
      loginSchema.parse(req.body);

      passport.authenticate("local", (err: Error, user: Express.User, info: { message: string }) => {
        if (err) {
          return next(err);
        }
        if (!user) {
          return res.status(401).json({ message: info.message });
        }
        req.logIn(user, (err) => {
          if (err) {
            return next(err);
          }
          return res.status(200).json({ user });
        });
      })(req, res, next);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ errors: formatZodError(error) });
      }
      next(error);
    }
  });

  app.post("/api/auth/register", async (req, res, next) => {
    try {
      const userData = insertUserSchema.parse(req.body);

      // Check if username already exists
      const existingUser = await storage.getUserByUsername(userData.username);
      if (existingUser) {
        return res.status(400).json({ message: "Username already exists" });
      }

      const user = await storage.createUser(userData);
      res.status(201).json({
        user: {
          id: user.id,
          username: user.username,
          fullName: user.fullName,
          department: user.department,
          role: user.role
        }
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ errors: formatZodError(error) });
      }
      next(error);
    }
  });

  app.post("/api/auth/logout", (req, res) => {
    req.logout(() => {
      res.status(200).json({ message: "Logged out successfully" });
    });
  });

  app.get("/api/auth/user", isAuthenticated, (req, res) => {
    res.status(200).json({ user: req.user });
  });

  // Request routes
  app.get("/api/requests", isAuthenticated, async (req, res, next) => {
    try {
      const requests = await storage.getRequests();
      res.status(200).json(requests);
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/requests/my", isAuthenticated, async (req, res, next) => {
    try {
      const requests = await storage.getRequestsByUser(req.user!.id);
      res.status(200).json(requests);
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/requests/to-approve", isAuthenticated, async (req, res, next) => {
    try {
      if (req.user!.role !== 'validator' && req.user!.role !== 'approver') {
        return res.status(403).json({ message: "Forbidden: Insufficient permissions" });
      }

      const requests = await storage.getRequestsToApprove(req.user!.id);
      res.status(200).json(requests);
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/requests", isAuthenticated, async (req, res, next) => {
    try {
      const requestData = insertRequestSchema.parse({
        ...req.body,
        createdBy: req.user!.id
      });

      // Create the request
      const request = await storage.createRequest(requestData);

      // Determine approvers based on department
      // For this example, we'll assume a simple workflow:
      // 1. Department validator
      // 2. Admin approver

      // For simplicity in the demo, we'll use hard-coded approvers
      // In a real application, we would query for users with appropriate roles
      const validator = { id: 2, role: 'validator', department: requestData.department };
      const approver = { id: 1, role: 'approver' };

      if (!validator || !approver) {
        return res.status(400).json({ message: "Could not establish approval workflow" });
      }

      // Create the approval steps
      await storage.createApprovalStep({
        requestId: request.id,
        userId: req.user!.id,
        role: 'initiator',
        order: 1,
        status: 'approved',
        comments: 'Request submitted'
      });

      await storage.createApprovalStep({
        requestId: request.id,
        userId: validator.id,
        role: 'validator',
        order: 2,
        status: 'pending',
        comments: null,
        signature: null
      });

      await storage.createApprovalStep({
        requestId: request.id,
        userId: approver.id,
        role: 'approver',
        order: 3,
        status: 'pending',
        comments: null,
        signature: null
      });

      // Update the request with the current approver
      await storage.updateRequest(request.id, {
        currentApprover: validator.id
      });

      // Create notification for the validator
      await storage.createNotification({
        userId: validator.id,
        requestId: request.id,
        message: `New request requires your approval: ${request.title}`
      });

      res.status(201).json(request);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ errors: formatZodError(error) });
      }
      next(error);
    }
  });

  app.get("/api/requests/:id", isAuthenticated, async (req, res, next) => {
    try {
      const requestId = parseInt(req.params.id);
      if (isNaN(requestId)) {
        return res.status(400).json({ message: "Invalid request ID" });
      }

      const request = await storage.getRequest(requestId);

      if (!request) {
        return res.status(404).json({ message: "Request not found" });
      }

      // Get approval steps for this request
      const approvalSteps = await storage.getApprovalSteps(requestId);

      // Get requester info
      const requester = await storage.getUser(request.createdBy);

      // Build response
      const response = {
        ...request,
        approvalSteps,
        requester: requester ? {
          id: requester.id,
          fullName: requester.fullName,
          department: requester.department
        } : null
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/requests/:id/approve", isAuthenticated, async (req, res, next) => {
    try {
      const requestId = parseInt(req.params.id);
      if (isNaN(requestId)) {
        return res.status(400).json({ message: "Invalid request ID" });
      }

      const actionData = approvalActionSchema.parse({
        ...req.body,
        requestId
      });

      const request = await storage.getRequest(requestId);

      if (!request) {
        return res.status(404).json({ message: "Request not found" });
      }

      // Check if the user is the current approver
      if (request.currentApprover !== req.user!.id) {
        return res.status(403).json({ message: "You are not authorized to approve this request" });
      }

      // Get approval steps
      const approvalSteps = await storage.getApprovalSteps(requestId);

      // Find the current step
      const currentStepIndex = approvalSteps.findIndex(
        step => step.userId === req.user!.id && step.status === 'pending'
      );

      if (currentStepIndex === -1) {
        return res.status(400).json({ message: "No pending approval step found" });
      }

      const currentStep = approvalSteps[currentStepIndex];

      // Update the current step
      await storage.updateApprovalStep(currentStep.id, {
        status: actionData.action === 'approve' ? 'approved' : 'rejected',
        comments: actionData.comments || null,
        signature: actionData.signature || null
      });

      // If rejected, update the request status and notify the initiator
      if (actionData.action === 'reject') {
        await storage.updateRequest(requestId, {
          status: 'rejected',
          currentApprover: null
        });

        // Notify the initiator
        await storage.createNotification({
          userId: request.createdBy,
          requestId,
          message: `Your request "${request.title}" was rejected by ${req.user!.fullName}`
        });

        return res.status(200).json({ message: "Request rejected successfully" });
      }

      // Vérifier les conditions de validation basées sur le montant
      const montantDemande = request.montantDemande || 0;
      const requiresDGValidation = montantDemande > 1000000; // Plus de 1M
      const requiresDCFValidation = montantDemande > 500000;  // Plus de 500K

      // Ajuster les étapes de validation en fonction du montant
      if (requiresDGValidation && !approvalSteps.some(step => step.role === 'dg')) {
        // Ajouter une étape de validation DG
        await storage.createApprovalStep({
          requestId,
          role: 'dg',
          order: approvalSteps.length + 1
        });
      }

      // If approved, check if there are more steps
      if (currentStepIndex < approvalSteps.length - 1) {
        // There are more approval steps
        const nextStep = approvalSteps[currentStepIndex + 1];

        // Update the request with the next approver
        await storage.updateRequest(requestId, {
          currentApprover: nextStep.userId
        });

        // Notify the next approver
        const nextApprover = await storage.getUser(nextStep.userId);
        if (nextApprover) {
          await storage.createNotification({
            userId: nextStep.userId,
            requestId,
            message: `New request requires your approval: ${request.title}`
          });
        }
      } else {
        // This was the final approval
        await storage.updateRequest(requestId, {
          status: 'approved',
          currentApprover: null
        });

        // Notify the initiator
        await storage.createNotification({
          userId: request.createdBy,
          requestId,
          message: `Your request "${request.title}" has been fully approved`
        });
      }

      res.status(200).json({ message: "Request approved successfully" });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ errors: formatZodError(error) });
      }
      next(error);
    }
  });

  // Statistics
  app.get("/api/stats", isAuthenticated, async (req, res, next) => {
    try {
      const stats = await storage.getRequestStats();
      res.status(200).json(stats);
    } catch (error) {
      next(error);
    }
  });

  // Notifications
  app.get("/api/notifications", isAuthenticated, async (req, res, next) => {
    try {
      const notifications = await storage.getNotifications(req.user!.id);
      res.status(200).json(notifications);
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/notifications/:id/read", isAuthenticated, async (req, res, next) => {
    try {
      const notificationId = parseInt(req.params.id);
      if (isNaN(notificationId)) {
        return res.status(400).json({ message: "Invalid notification ID" });
      }

      const notification = await storage.markNotificationAsRead(notificationId);

      if (!notification) {
        return res.status(404).json({ message: "Notification not found" });
      }

      res.status(200).json(notification);
    } catch (error) {
      next(error);
    }
  });

  // Document routes
  app.get("/api/documents", isAuthenticated, async (req, res, next) => {
    try {
      const search = req.query ? documentSearchSchema.parse(req.query) : undefined;
      const documents = await storage.getDocuments(search);
      res.status(200).json(documents);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ errors: formatZodError(error) });
      }
      next(error);
    }
  });

  app.get("/api/documents/my", isAuthenticated, async (req, res, next) => {
    try {
      const documents = await storage.getDocumentsByUser(req.user!.id);
      res.status(200).json(documents);
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/documents/:id", isAuthenticated, async (req, res, next) => {
    try {
      const documentId = parseInt(req.params.id);
      if (isNaN(documentId)) {
        return res.status(400).json({ message: "Invalid document ID" });
      }

      const document = await storage.getDocument(documentId);

      if (!document) {
        return res.status(404).json({ message: "Document not found" });
      }

      // Log document access
      await storage.logDocumentAccess(documentId, req.user!.id, "view");

      // Get document versions
      const versions = await storage.getDocumentVersions(documentId);

      // Get document tags
      const tags = await storage.getDocumentTags(documentId);

      // Get owner info
      const owner = await storage.getUser(document.createdBy);

      // Build response
      const response = {
        ...document,
        versions,
        tags,
        owner: owner ? {
          id: owner.id,
          fullName: owner.fullName,
          department: owner.department
        } : null
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/documents", isAuthenticated, upload.single('file'), async (req, res, next) => {
    try {
      // Vérifier si le corps de la requête contient des données JSON
      if (!req.body || typeof req.body !== 'object') {
        return res.status(400).json({ message: "Les données du document sont requises" });
      }

      // Si des tags sont envoyés sous forme de chaîne JSON, les convertir en tableau
      if (req.body.tags && typeof req.body.tags === 'string') {
        try {
          req.body.tags = JSON.parse(req.body.tags);
        } catch (e) {
          return res.status(400).json({ message: "Format de tags invalide" });
        }
      }

      // Créer les données du document
      const documentData = insertDocumentSchema.parse({
        ...req.body,
        createdBy: req.user!.id
      });

      // Créer le document
      const document = await storage.createDocument(documentData);

      // Ajouter les tags au document s'il y en a
      if (req.body.tags && Array.isArray(req.body.tags)) {
        for (const tagId of req.body.tags) {
          await storage.addTagToDocument(document.id, tagId);
        }
      }

      // Si un fichier est inclus, créer une version initiale
      if (req.file) {
        // Définir le chemin et sauvegarder le fichier
        const filePath = await UploadService.saveFile(
          req.file.buffer, 
          req.file.originalname, 
          document.id
        );

        let extractedText = null;

        // Vérifier si le type de fichier est supporté pour l'OCR
        if (OCRService.isFileTypeSupported(req.file.mimetype)) {
          try {
            // Extraire le texte avec OCR
            if (req.file.mimetype === 'application/pdf') {
              extractedText = await OCRService.extractTextFromPDF(filePath);
            } else {
              extractedText = await OCRService.extractTextFromImage(filePath);
            }

            // Mettre à jour le document avec le texte extrait
            await storage.updateDocument(document.id, { extractedText });

          } catch (error) {
            console.error("Erreur lors de l'extraction OCR:", error);
            // Continuer même si l'OCR a échoué
          }
        }

        // Créer la version du document
        await storage.createDocumentVersion({
          documentId: document.id,
          fileName: req.file.originalname,
          fileType: req.file.mimetype,
          fileSize: req.file.size,
          filePath: filePath,
          uploadedBy: req.user!.id,
          version: 1,
          comments: "Version initiale",
          extractedText: extractedText
        });
      }

      res.status(201).json(document);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ errors: formatZodError(error) });
      }
      next(error);
    }
  });

  app.patch("/api/documents/:id", isAuthenticated, async (req, res, next) => {
    try {
      const documentId = parseInt(req.params.id);
      if (isNaN(documentId)) {
        return res.status(400).json({ message: "Invalid document ID" });
      }

      const document = await storage.getDocument(documentId);

      if (!document) {
        return res.status(404).json({ message: "Document not found" });
      }

      // Check if the user is the owner or an admin
      if (document.createdBy !== req.user!.id && req.user!.role !== 'admin') {
        return res.status(403).json({ message: "You are not authorized to update this document" });
      }

      // Update document
      const updatedDocument = await storage.updateDocument(documentId, req.body);

      // If there are tags, update them
      if (req.body.tags && Array.isArray(req.body.tags)) {
        // Get current tags
        const currentTags = await storage.getDocumentTags(documentId);

        // Remove tags that are not in the new list
        for (const tag of currentTags) {
          if (!req.body.tags.includes(tag.id)) {
            await storage.removeTagFromDocument(documentId, tag.id);
          }
        }

        // Add new tags
        for (const tagId of req.body.tags) {
          const exists = currentTags.some(tag => tag.id === tagId);
          if (!exists) {
            await storage.addTagToDocument(documentId, tagId);
          }
        }
      }

      // Si nous avons un fichier dans le corps, mais pas d'upload de fichier réel,
      // c'est probablement une mise à jour de métadonnées uniquement venant du frontend
      if (req.body.file && typeof req.body.file === 'object') {
        // Get current versions
        const versions = await storage.getDocumentVersions(documentId);
        const latestVersion = versions.length > 0 ? Math.max(...versions.map(v => v.version)) : 0;

        await storage.createDocumentVersion({
          documentId: documentId,
          fileName: req.body.file.name,
          fileType: req.body.file.type,
          fileSize: req.body.file.size,
          filePath: `/uploads/${documentId}/${latestVersion + 1}_${req.body.file.name}`,
          uploadedBy: req.user!.id,
          version: latestVersion + 1,
          comments: req.body.comments || "Nouvelle version"
        });
      }

      res.status(200).json(updatedDocument);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ errors: formatZodError(error) });
      }
      next(error);
    }
  });

  // Route pour ajouter une nouvelle version d'un document avec un fichier
  app.post("/api/documents/:id/versions", isAuthenticated, upload.single('file'), async (req, res, next) => {
    try {
      const documentId = parseInt(req.params.id);
      if (isNaN(documentId)) {
        return res.status(400).json({ message: "ID de document invalide" });
      }

      const document = await storage.getDocument(documentId);

      if (!document) {
        return res.status(404).json({ message: "Document non trouvé" });
      }

      // Vérifier si l'utilisateur est le propriétaire ou un administrateur
      if (document.createdBy !== req.user!.id && req.user!.role !== 'admin') {
        return res.status(403).json({ message: "Vous n'êtes pas autorisé à modifier ce document" });
      }

      // Vérifier si un fichier a été téléchargé
      if (!req.file) {
        return res.status(400).json({ message: "Aucun fichier n'a été téléchargé" });
      }

      // Récupérer les versions actuelles
      const versions = await storage.getDocumentVersions(documentId);
      const latestVersion = versions.length > 0 ? Math.max(...versions.map(v => v.version)) : 0;
      const newVersion = latestVersion + 1;

      // Sauvegarder le fichier
      const filePath = await UploadService.saveFile(
        req.file.buffer, 
        req.file.originalname, 
        documentId
      );

      let extractedText = null;

      // Vérifier si le type de fichier est supporté pour l'OCR
      if (OCRService.isFileTypeSupported(req.file.mimetype)) {
        try {
          // Extraire le texte avec OCR
          if (req.file.mimetype === 'application/pdf') {
            extractedText = await OCRService.extractTextFromPDF(filePath);
          } else {
            extractedText = await OCRService.extractTextFromImage(filePath);
          }

          // Si c'est la dernière version, mettre à jour le document principal avec le texte extrait
          await storage.updateDocument(documentId, { extractedText });

        } catch (error) {
          console.error("Erreur lors de l'extraction OCR:", error);
          // Continuer même si l'OCR a échoué
        }
      }

      // Créer la nouvelle version
      const docVersion = await storage.createDocumentVersion({
        documentId: documentId,
        fileName: req.file.originalname,
        fileType: req.file.mimetype,
        fileSize: req.file.size,
        filePath: filePath,
        uploadedBy: req.user!.id,
        version: newVersion,
        comments: req.body.comments || "Nouvelle version",
        extractedText: extractedText
      });

      // Mettre à jour la date de modification du document
      await storage.updateDocument(documentId, { 
        updatedAt: new Date() 
      });

      res.status(201).json(docVersion);
    } catch (error) {
      next(error);
    }
  });

  app.delete("/api/documents/:id", isAuthenticated, async (req, res, next) => {
    try {
      const documentId = parseInt(req.params.id);
      if (isNaN(documentId)) {
        return res.status(400).json({ message: "Invalid document ID" });
      }

      const document = await storage.getDocument(documentId);

      if (!document) {
        return res.status(404).json({ message: "Document not found" });
      }

      // Check if the user is the owner or an admin
      if (document.createdBy !== req.user!.id && req.user!.role !== 'admin') {
        return res.status(403).json({ message: "You are not authorized to delete this document" });
      }

      // Delete document
      await storage.deleteDocument(documentId);

      res.status(200).json({ message: "Document deleted successfully" });
    } catch (error) {
      next(error);
    }
  });

  // Route pour récupérer le texte extrait par OCR d'un document
  app.get("/api/documents/:id/extracted-text", isAuthenticated, async (req, res, next) => {
    try {
      const documentId = parseInt(req.params.id);
      if (isNaN(documentId)) {
        return res.status(400).json({ message: "ID de document invalide" });
      }

      const document = await storage.getDocument(documentId);

      if (!document) {
        return res.status(404).json({ message: "Document non trouvé" });
      }

      // Enregistrer l'accès au document
      await storage.logDocumentAccess(documentId, req.user!.id, "view_ocr");

      // Si le document n'a pas de texte extrait, récupérer la dernière version
      if (!document.extractedText) {
        const versions = await storage.getDocumentVersions(documentId);
        if (versions.length > 0) {
          // Trier par numéro de version (décroissant)
          versions.sort((a, b) => b.version - a.version);
          const latestVersion = versions[0];

          if (latestVersion.extractedText) {
            return res.status(200).json({ 
              extractedText: latestVersion.extractedText,
              fromVersion: latestVersion.version
            });
          }
        }

        return res.status(404).json({ 
          message: "Aucun texte extrait disponible pour ce document",
          documentId
        });
      }

      return res.status(200).json({ 
        extractedText: document.extractedText,
        fromDocument: true
      });

    } catch (error) {
      next(error);
    }
  });

  // Document categories routes
  app.get("/api/document-categories", isAuthenticated, async (req, res, next) => {
    try {
      const categories = await storage.getDocumentCategories();
      res.status(200).json(categories);
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/document-categories", isAuthenticated, async (req, res, next) => {
    try {
      // Only admin can create categories
      if (req.user!.role !== 'admin') {
        return res.status(403).json({ message: "Only admin can create document categories" });
      }

      const categoryData = insertDocumentCategorySchema.parse(req.body);
      const category = await storage.createDocumentCategory(categoryData);

      res.status(201).json(category);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ errors: formatZodError(error) });
      }
      next(error);
    }
  });

  // Document tags routes
  app.get("/api/document-tags", isAuthenticated, async (req, res, next) => {
    try {
      const tags = await storage.getDocumentTags();
      res.status(200).json(tags);
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/document-tags", isAuthenticated, async (req, res, next) => {
    try {
      const tagData = insertDocumentTagSchema.parse(req.body);
      const tag = await storage.createDocumentTag(tagData);

      res.status(201).json(tag);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ errors: formatZodError(error) });
      }
      next(error);
    }
  });

  // Document stats
  app.get("/api/document-stats", isAuthenticated, async (req, res, next) => {
    try {
      const stats = await storage.getDocumentStats();
      res.status(200).json(stats);
    } catch (error) {
      next(error);
    }
  });

    const httpServer = createServer(app);
  return httpServer;
}