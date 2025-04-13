import { pgTable, text, serial, integer, boolean, timestamp, jsonb, date, varchar, json, unique } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// User schema
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  fullName: text("full_name").notNull(),
  email: text("email").notNull().unique(),
  department: text("department").notNull(),
  role: text("role").notNull(), // initiator, validator, approver, admin
  createdAt: timestamp("created_at").defaultNow().notNull()
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true
});

// Request/need schema
export const requests = pgTable("requests", {
  id: serial("id").primaryKey(),
  ticketId: text("ticket_id").notNull().unique(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  priority: text("priority").notNull(), // low, medium, high, critical
  department: text("department").notNull(),
  status: text("status").notNull(), // draft, pending_approval, approved, rejected
  createdBy: integer("created_by").notNull(),
  currentApprover: integer("current_approver"),
  documents: jsonb("documents"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

export const insertRequestSchema = createInsertSchema(requests).omit({
  id: true,
  ticketId: true,
  status: true,
  currentApprover: true,
  createdAt: true,
  updatedAt: true
});

// Approval steps schema
export const approvalSteps = pgTable("approval_steps", {
  id: serial("id").primaryKey(),
  requestId: integer("request_id").notNull(),
  userId: integer("user_id").notNull(),
  role: text("role").notNull(),
  order: integer("order").notNull(),
  status: text("status").notNull(), // pending, approved, rejected
  comments: text("comments"),
  signature: text("signature"),
  actionDate: timestamp("action_date"),
  createdAt: timestamp("created_at").defaultNow().notNull()
});

export const insertApprovalStepSchema = createInsertSchema(approvalSteps).omit({
  id: true,
  actionDate: true,
  createdAt: true
});

// Notifications schema
export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  requestId: integer("request_id").notNull(),
  message: text("message").notNull(),
  isRead: boolean("is_read").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull()
});

export const insertNotificationSchema = createInsertSchema(notifications).omit({
  id: true,
  isRead: true,
  createdAt: true
});

// Type exports
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Request = typeof requests.$inferSelect;
export type InsertRequest = z.infer<typeof insertRequestSchema>;

export type ApprovalStep = typeof approvalSteps.$inferSelect;
export type InsertApprovalStep = z.infer<typeof insertApprovalStepSchema>;

export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = z.infer<typeof insertNotificationSchema>;

// Document categories schema
export const documentCategories = pgTable("document_categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow().notNull()
});

export const insertDocumentCategorySchema = createInsertSchema(documentCategories).omit({
  id: true,
  createdAt: true
});

// Document tags schema
export const documentTags = pgTable("document_tags", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  createdAt: timestamp("created_at").defaultNow().notNull()
});

export const insertDocumentTagSchema = createInsertSchema(documentTags).omit({
  id: true,
  createdAt: true
});

// Document-tag relationship schema
export const documentToTags = pgTable("document_to_tags", {
  id: serial("id").primaryKey(),
  documentId: integer("document_id").notNull(),
  tagId: integer("tag_id").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull()
}, (table) => {
  return {
    unq: unique().on(table.documentId, table.tagId)
  };
});

// Documents schema
export const documents = pgTable("documents", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  categoryId: integer("category_id").notNull(),
  createdBy: integer("created_by").notNull(),
  status: text("status").notNull().default("draft"), // draft, published, archived
  reference: text("reference").unique(),
  requestId: integer("request_id"), // can be linked to a request or standalone
  metaData: jsonb("meta_data"),
  extractedText: text("extracted_text"), // Texte extrait par OCR
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

export const insertDocumentSchema = createInsertSchema(documents).omit({
  id: true,
  reference: true,
  createdAt: true,
  updatedAt: true
});

// Document versions schema
export const documentVersions = pgTable("document_versions", {
  id: serial("id").primaryKey(),
  documentId: integer("document_id").notNull(),
  version: integer("version").notNull().default(1),
  fileName: text("file_name").notNull(),
  fileType: text("file_type").notNull(),
  fileSize: integer("file_size").notNull(),
  filePath: text("file_path").notNull(),
  uploadedBy: integer("uploaded_by").notNull(),
  uploadedAt: timestamp("uploaded_at").defaultNow().notNull(),
  comments: text("comments"),
  extractedText: text("extracted_text") // Texte extrait par OCR
}, (table) => {
  return {
    unq: unique().on(table.documentId, table.version)
  };
});

export const insertDocumentVersionSchema = createInsertSchema(documentVersions).omit({
  id: true,
  uploadedAt: true
});

// Document access logs schema
export const documentAccessLogs = pgTable("document_access_logs", {
  id: serial("id").primaryKey(),
  documentId: integer("document_id").notNull(),
  userId: integer("user_id").notNull(),
  action: text("action").notNull(), // view, download, modify, delete
  timestamp: timestamp("timestamp").defaultNow().notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent")
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  documents: many(documents),
  documentVersions: many(documentVersions)
}));

export const documentsRelations = relations(documents, ({ one, many }) => ({
  category: one(documentCategories, {
    fields: [documents.categoryId],
    references: [documentCategories.id]
  }),
  creator: one(users, {
    fields: [documents.createdBy],
    references: [users.id]
  }),
  request: one(requests, {
    fields: [documents.requestId],
    references: [requests.id]
  }),
  versions: many(documentVersions),
  tags: many(documentToTags)
}));

export const documentVersionsRelations = relations(documentVersions, ({ one }) => ({
  document: one(documents, {
    fields: [documentVersions.documentId],
    references: [documents.id]
  }),
  uploader: one(users, {
    fields: [documentVersions.uploadedBy],
    references: [users.id]
  })
}));

export const documentToTagsRelations = relations(documentToTags, ({ one }) => ({
  document: one(documents, {
    fields: [documentToTags.documentId],
    references: [documents.id]
  }),
  tag: one(documentTags, {
    fields: [documentToTags.tagId],
    references: [documentTags.id]
  })
}));

export const requestsRelations = relations(requests, ({ one, many }) => ({
  creator: one(users, {
    fields: [requests.createdBy],
    references: [users.id]
  }),
  approver: one(users, {
    fields: [requests.currentApprover],
    references: [users.id]
  }),
  approvalSteps: many(approvalSteps),
  documents: many(documents)
}));

export const approvalStepsRelations = relations(approvalSteps, ({ one }) => ({
  request: one(requests, {
    fields: [approvalSteps.requestId],
    references: [requests.id]
  }),
  user: one(users, {
    fields: [approvalSteps.userId],
    references: [users.id]
  })
}));

export type DocumentCategory = typeof documentCategories.$inferSelect;
export type InsertDocumentCategory = z.infer<typeof insertDocumentCategorySchema>;

export type DocumentTag = typeof documentTags.$inferSelect;
export type InsertDocumentTag = z.infer<typeof insertDocumentTagSchema>;

export type Document = typeof documents.$inferSelect;
export type InsertDocument = z.infer<typeof insertDocumentSchema>;

export type DocumentVersion = typeof documentVersions.$inferSelect;
export type InsertDocumentVersion = z.infer<typeof insertDocumentVersionSchema>;

export type DocumentAccessLog = typeof documentAccessLogs.$inferSelect;

// Helper schemas for frontend forms
export const loginSchema = z.object({
  username: z.string().min(3, { message: "Le nom d'utilisateur doit comporter au moins 3 caractères" }),
  password: z.string().min(6, { message: "Le mot de passe doit comporter au moins 6 caractères" })
});

export type LoginForm = z.infer<typeof loginSchema>;

export const requestFormSchema = insertRequestSchema.extend({
  files: z.any().optional(),
  // Nouveaux champs pour le formulaire d'expression de besoins
  demandeur: z.string().min(2, "Le nom du demandeur est requis"),
  service: z.string().min(2, "Le service est requis"),
  direction: z.string().min(2, "La direction est requise"),
  dateCreation: z.string().optional(),

  // Détail des besoins (tableau d'articles)
  lignesBesoins: z.array(z.object({
    ordre: z.number(),
    cbu: z.string().optional(),
    designation: z.string().min(3, "La désignation est requise"),
    quantite: z.number().min(1, "La quantité doit être d'au moins 1"),
    budgetise: z.boolean().default(false),
    memoAccord: z.string().optional()
  })).min(1, "Au moins un article est requis"),

  // Champs pour la section budget (remplis par la DCF)
  ligneBudgetaire: z.string().optional(),
  budgetPrevisionnel: z.number().optional(),
  depensesEffectuees: z.number().optional(),
  budgetDisponible: z.number().optional(),
  montantDemande: z.number().optional(),
  observations: z.string().optional(),

  // Affectations
  affectations: z.array(z.object({
    direction: z.string(),
    valide: z.boolean().optional(),
    date: z.string().optional()
  })).optional(),

  // Validation
  validationDirection: z.boolean().optional(),
  validationDcgai: z.boolean().optional(),
  validationDg: z.boolean().optional(),

  // Achats
  existantService: z.boolean().optional(),
  referenceBc: z.string().optional(),
  attributaire: z.string().optional(),
  montant: z.number().optional(),
  livraisonPrevisionnelle: z.string().optional(),
  livraisonEffective: z.string().optional(),

  // Trésorerie
  disponibiliteTresorerie: z.boolean().optional()
});

export type RequestForm = z.infer<typeof requestFormSchema>;

export const approvalActionSchema = z.object({
  requestId: z.number(),
  comments: z.string().optional(),
  signature: z.string().optional(),
  action: z.enum(["approve", "reject"])
});

export type ApprovalAction = z.infer<typeof approvalActionSchema>;

// Document related schemas for frontend forms
export const documentFormSchema = insertDocumentSchema.extend({
  file: z.any().optional(),
  tags: z.array(z.number()).optional()
});

export type DocumentForm = z.infer<typeof documentFormSchema>;

export const documentSearchSchema = z.object({
  query: z.string().optional(),
  category: z.number().optional(),
  tags: z.array(z.number()).optional(),
  status: z.enum(["draft", "published", "archived"]).optional(),
  createdBy: z.number().optional(),
  dateFrom: z.date().optional(),
  dateTo: z.date().optional()
});

export type DocumentSearch = z.infer<typeof documentSearchSchema>;

export const documentVersionFormSchema = insertDocumentVersionSchema.extend({
  file: z.any()
});

export type DocumentVersionForm = z.infer<typeof documentVersionFormSchema>;
// Folders schema
export const folders = pgTable("folders", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  parentId: integer("parent_id"),
  path: text("path").notNull(),
  createdBy: integer("created_by").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Délégation de validation schema
export const validationDelegations = pgTable("validation_delegations", {
  id: serial("id").primaryKey(),
  delegatorId: integer("delegator_id").notNull(),
  delegateId: integer("delegate_id").notNull(),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  reason: text("reason"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull()
});

// Document permissions schema
export const documentPermissions = pgTable("document_permissions", {
  id: serial("id").primaryKey(),
  documentId: integer("document_id").notNull(),
  userId: integer("user_id").notNull(),
  permission: text("permission").notNull(), // read, write, admin
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => {
  return {
    unq: unique().on(table.documentId, table.userId)
  };
});

// Custom metadata schema
export const documentMetadata = pgTable("document_metadata", {
  id: serial("id").primaryKey(),
  documentId: integer("document_id").notNull(),
  key: text("key").notNull(),
  value: text("value").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Configuration des thèmes
export const themeConfig = pgTable("theme_config", {
  id: serial("id").primaryKey(),
  primaryColor: text("primary_color").notNull(),
  variant: text("variant").notNull(), // light, dark, tint
  borderRadius: integer("border_radius").notNull(),
  companyLogo: text("company_logo"),
  companyName: text("company_name"),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});