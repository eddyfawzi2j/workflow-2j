import { 
  users, type User, type InsertUser,
  requests, type Request, type InsertRequest,
  approvalSteps, type ApprovalStep, type InsertApprovalStep,
  notifications, type Notification, type InsertNotification,
  documents, type Document, type InsertDocument,
  documentVersions, type DocumentVersion, type InsertDocumentVersion,
  documentCategories, type DocumentCategory, type InsertDocumentCategory,
  documentTags, type DocumentTag, type InsertDocumentTag,
  documentToTags, documentAccessLogs, type DocumentSearch
} from "@shared/schema";
import { db } from "./db";
import { eq, and, count, or, like, between, desc, asc, isNull, isNotNull, sql } from "drizzle-orm";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { Pool } from "@neondatabase/serverless";

// Configure session store
const PostgresSessionStore = connectPg(session);
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// Interface for all storage operations
export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Request operations
  getRequest(id: number): Promise<Request | undefined>;
  getRequestByTicketId(ticketId: string): Promise<Request | undefined>;
  getRequests(): Promise<Request[]>;
  getRequestsByUser(userId: number): Promise<Request[]>;
  getRequestsToApprove(userId: number): Promise<Request[]>;
  createRequest(request: InsertRequest): Promise<Request>;
  updateRequest(id: number, updates: Partial<Request>): Promise<Request | undefined>;
  
  // Approval steps operations
  getApprovalSteps(requestId: number): Promise<ApprovalStep[]>;
  createApprovalStep(step: InsertApprovalStep): Promise<ApprovalStep>;
  updateApprovalStep(id: number, updates: Partial<ApprovalStep>): Promise<ApprovalStep | undefined>;
  
  // Notification operations
  getNotifications(userId: number): Promise<Notification[]>;
  createNotification(notification: InsertNotification): Promise<Notification>;
  markNotificationAsRead(id: number): Promise<Notification | undefined>;
  
  // Document category operations
  getDocumentCategories(): Promise<DocumentCategory[]>;
  getDocumentCategory(id: number): Promise<DocumentCategory | undefined>;
  createDocumentCategory(category: InsertDocumentCategory): Promise<DocumentCategory>;
  updateDocumentCategory(id: number, updates: Partial<DocumentCategory>): Promise<DocumentCategory | undefined>;
  deleteDocumentCategory(id: number): Promise<boolean>;
  
  // Document tag operations
  getDocumentTags(): Promise<DocumentTag[]>;
  getDocumentTag(id: number): Promise<DocumentTag | undefined>;
  createDocumentTag(tag: InsertDocumentTag): Promise<DocumentTag>;
  deleteDocumentTag(id: number): Promise<boolean>;
  
  // Document operations
  getDocument(id: number): Promise<Document | undefined>;
  getDocuments(search?: DocumentSearch): Promise<Document[]>;
  getDocumentsByRequest(requestId: number): Promise<Document[]>;
  getDocumentsByUser(userId: number): Promise<Document[]>;
  createDocument(document: InsertDocument): Promise<Document>;
  updateDocument(id: number, updates: Partial<Document>): Promise<Document | undefined>;
  deleteDocument(id: number): Promise<boolean>;
  
  // Document version operations
  getDocumentVersions(documentId: number): Promise<DocumentVersion[]>;
  getDocumentVersion(id: number): Promise<DocumentVersion | undefined>;
  createDocumentVersion(version: InsertDocumentVersion): Promise<DocumentVersion>;
  
  // Document tag relation operations
  addTagToDocument(documentId: number, tagId: number): Promise<void>;
  removeTagFromDocument(documentId: number, tagId: number): Promise<void>;
  getDocumentTags(documentId: number): Promise<DocumentTag[]>;
  
  // Document access logging
  logDocumentAccess(documentId: number, userId: number, action: string): Promise<void>;
  
  // Stats
  getRequestStats(): Promise<{
    total: number;
    pendingApproval: number;
    approved: number;
    rejected: number;
  }>;
  
  getDocumentStats(): Promise<{
    total: number;
    draft: number;
    published: number;
    archived: number;
  }>;
  
  // Session store for auth
  sessionStore: session.Store;
}

export class DatabaseStorage implements IStorage {
  sessionStore: session.Store;
  
  constructor() {
    this.sessionStore = new PostgresSessionStore({
      pool,
      createTableIfMissing: true
    });
  }
  
  // User operations
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }
  
  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }
  
  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }
  
  // Request operations
  async getRequest(id: number): Promise<Request | undefined> {
    const [request] = await db.select().from(requests).where(eq(requests.id, id));
    return request;
  }
  
  async getRequestByTicketId(ticketId: string): Promise<Request | undefined> {
    const [request] = await db.select().from(requests).where(eq(requests.ticketId, ticketId));
    return request;
  }
  
  async getRequests(): Promise<Request[]> {
    return await db.select().from(requests).orderBy(requests.createdAt);
  }
  
  async getRequestsByUser(userId: number): Promise<Request[]> {
    return await db
      .select()
      .from(requests)
      .where(eq(requests.createdBy, userId))
      .orderBy(requests.createdAt);
  }
  
  async getRequestsToApprove(userId: number): Promise<Request[]> {
    return await db
      .select()
      .from(requests)
      .where(and(
        eq(requests.currentApprover, userId),
        eq(requests.status, 'pending_approval')
      ))
      .orderBy(requests.createdAt);
  }
  
  async createRequest(insertRequest: InsertRequest): Promise<Request> {
    const now = new Date();
    const year = now.getFullYear();
    
    // Get next ID to generate ticket ID
    const [result] = await db.select({ count: count() }).from(requests);
    const nextId = (result?.count || 0) + 1;
    
    // Generate a ticket ID with pattern REQ-YYYY-NNNN
    const ticketId = `REQ-${year}-${nextId.toString().padStart(4, '0')}`;
    
    const [request] = await db
      .insert(requests)
      .values({
        ...insertRequest,
        ticketId,
        status: "pending_approval",
        createdAt: now,
        updatedAt: now
      })
      .returning();
      
    return request;
  }
  
  async updateRequest(id: number, updates: Partial<Request>): Promise<Request | undefined> {
    const [request] = await db
      .update(requests)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(requests.id, id))
      .returning();
      
    return request;
  }
  
  // Approval steps operations
  async getApprovalSteps(requestId: number): Promise<ApprovalStep[]> {
    return await db
      .select()
      .from(approvalSteps)
      .where(eq(approvalSteps.requestId, requestId))
      .orderBy(approvalSteps.order);
  }
  
  async createApprovalStep(insertStep: InsertApprovalStep): Promise<ApprovalStep> {
    const [step] = await db
      .insert(approvalSteps)
      .values(insertStep)
      .returning();
      
    return step;
  }
  
  async updateApprovalStep(id: number, updates: Partial<ApprovalStep>): Promise<ApprovalStep | undefined> {
    const actionDate = updates.status === 'pending' ? null : new Date();
    
    const [step] = await db
      .update(approvalSteps)
      .set({ ...updates, actionDate })
      .where(eq(approvalSteps.id, id))
      .returning();
      
    return step;
  }
  
  // Notification operations
  async getNotifications(userId: number): Promise<Notification[]> {
    return await db
      .select()
      .from(notifications)
      .where(eq(notifications.userId, userId))
      .orderBy(notifications.createdAt);
  }
  
  async createNotification(insertNotification: InsertNotification): Promise<Notification> {
    const [notification] = await db
      .insert(notifications)
      .values({ ...insertNotification, isRead: false })
      .returning();
      
    return notification;
  }
  
  async markNotificationAsRead(id: number): Promise<Notification | undefined> {
    const [notification] = await db
      .update(notifications)
      .set({ isRead: true })
      .where(eq(notifications.id, id))
      .returning();
      
    return notification;
  }
  
  // Document category operations
  async getDocumentCategories(): Promise<DocumentCategory[]> {
    return await db.select().from(documentCategories).orderBy(asc(documentCategories.name));
  }
  
  async getDocumentCategory(id: number): Promise<DocumentCategory | undefined> {
    const [category] = await db.select().from(documentCategories).where(eq(documentCategories.id, id));
    return category;
  }
  
  async createDocumentCategory(category: InsertDocumentCategory): Promise<DocumentCategory> {
    const [result] = await db.insert(documentCategories).values(category).returning();
    return result;
  }
  
  async updateDocumentCategory(id: number, updates: Partial<DocumentCategory>): Promise<DocumentCategory | undefined> {
    const [result] = await db
      .update(documentCategories)
      .set(updates)
      .where(eq(documentCategories.id, id))
      .returning();
    return result;
  }
  
  async deleteDocumentCategory(id: number): Promise<boolean> {
    try {
      await db.delete(documentCategories).where(eq(documentCategories.id, id));
      return true;
    } catch (error) {
      console.error('Error deleting document category:', error);
      return false;
    }
  }
  
  // Document tag operations
  async getDocumentTags(): Promise<DocumentTag[]> {
    return await db.select().from(documentTags).orderBy(asc(documentTags.name));
  }
  
  async getDocumentTag(id: number): Promise<DocumentTag | undefined> {
    const [tag] = await db.select().from(documentTags).where(eq(documentTags.id, id));
    return tag;
  }
  
  async createDocumentTag(tag: InsertDocumentTag): Promise<DocumentTag> {
    const [result] = await db.insert(documentTags).values(tag).returning();
    return result;
  }
  
  async deleteDocumentTag(id: number): Promise<boolean> {
    try {
      // First delete all relations to this tag
      await db.delete(documentToTags).where(eq(documentToTags.tagId, id));
      // Then delete the tag itself
      await db.delete(documentTags).where(eq(documentTags.id, id));
      return true;
    } catch (error) {
      console.error('Error deleting document tag:', error);
      return false;
    }
  }
  
  // Document operations
  async getDocument(id: number): Promise<Document | undefined> {
    const [document] = await db.select().from(documents).where(eq(documents.id, id));
    return document;
  }
  
  async getDocuments(search?: DocumentSearch): Promise<Document[]> {
    let query = db.select().from(documents);
    
    if (search) {
      const conditions = [];
      
      if (search.query) {
        conditions.push(
          or(
            like(documents.title, `%${search.query}%`),
            like(documents.description || '', `%${search.query}%`)
          )
        );
      }
      
      if (search.category) {
        conditions.push(eq(documents.categoryId, search.category));
      }
      
      if (search.status) {
        conditions.push(eq(documents.status, search.status));
      }
      
      if (search.createdBy) {
        conditions.push(eq(documents.createdBy, search.createdBy));
      }
      
      if (search.dateFrom && search.dateTo) {
        conditions.push(
          between(documents.createdAt, search.dateFrom, search.dateTo)
        );
      } else if (search.dateFrom) {
        conditions.push(
          sql`${documents.createdAt} >= ${search.dateFrom}`
        );
      } else if (search.dateTo) {
        conditions.push(
          sql`${documents.createdAt} <= ${search.dateTo}`
        );
      }
      
      if (conditions.length > 0) {
        query = query.where(and(...conditions));
      }
      
      // Handle tag filtering in application code after fetching documents
      // since it requires a more complex query with joins
    }
    
    const results = await query.orderBy(desc(documents.createdAt));
    
    // If tags are specified in the search and we have documents
    if (search?.tags && search.tags.length > 0 && results.length > 0) {
      // Get all document-tag relations for the documents we've found
      const documentIds = results.map(doc => doc.id);
      const tagRelations = await db
        .select()
        .from(documentToTags)
        .where(and(
          eq(documentToTags.tagId, search.tags[0]), // Start with first tag
          sql`${documentToTags.documentId} = ANY(${documentIds})`
        ));
      
      // Filter documents that have the specified tag
      const documentsWithTag = new Set(tagRelations.map(rel => rel.documentId));
      return results.filter(doc => documentsWithTag.has(doc.id));
    }
    
    return results;
  }
  
  async getDocumentsByRequest(requestId: number): Promise<Document[]> {
    return await db
      .select()
      .from(documents)
      .where(eq(documents.requestId, requestId))
      .orderBy(desc(documents.createdAt));
  }
  
  async getDocumentsByUser(userId: number): Promise<Document[]> {
    return await db
      .select()
      .from(documents)
      .where(eq(documents.createdBy, userId))
      .orderBy(desc(documents.createdAt));
  }
  
  async createDocument(insertDocument: InsertDocument): Promise<Document> {
    const now = new Date();
    const year = now.getFullYear();
    
    // Generate a reference number with pattern DOC-YYYY-XXXX
    const [result] = await db.select({ count: count() }).from(documents);
    const nextId = (result?.count || 0) + 1;
    const reference = `DOC-${year}-${nextId.toString().padStart(4, '0')}`;
    
    const [document] = await db
      .insert(documents)
      .values({
        ...insertDocument,
        reference,
        createdAt: now,
        updatedAt: now
      })
      .returning();
      
    return document;
  }
  
  async updateDocument(id: number, updates: Partial<Document>): Promise<Document | undefined> {
    const [document] = await db
      .update(documents)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(documents.id, id))
      .returning();
      
    return document;
  }
  
  async deleteDocument(id: number): Promise<boolean> {
    try {
      // First delete all document versions
      await db.delete(documentVersions).where(eq(documentVersions.documentId, id));
      
      // Delete all tag relations
      await db.delete(documentToTags).where(eq(documentToTags.documentId, id));
      
      // Delete access logs
      await db.delete(documentAccessLogs).where(eq(documentAccessLogs.documentId, id));
      
      // Finally delete the document
      await db.delete(documents).where(eq(documents.id, id));
      
      return true;
    } catch (error) {
      console.error('Error deleting document:', error);
      return false;
    }
  }
  
  // Document version operations
  async getDocumentVersions(documentId: number): Promise<DocumentVersion[]> {
    return await db
      .select()
      .from(documentVersions)
      .where(eq(documentVersions.documentId, documentId))
      .orderBy(desc(documentVersions.version));
  }
  
  async getDocumentVersion(id: number): Promise<DocumentVersion | undefined> {
    const [version] = await db.select().from(documentVersions).where(eq(documentVersions.id, id));
    return version;
  }
  
  async createDocumentVersion(insertVersion: InsertDocumentVersion): Promise<DocumentVersion> {
    // Get the current highest version number for this document
    const [currentVersion] = await db
      .select({ maxVersion: sql`MAX(${documentVersions.version})` })
      .from(documentVersions)
      .where(eq(documentVersions.documentId, insertVersion.documentId));
    
    // Increment version number
    const newVersion = (currentVersion?.maxVersion || 0) + 1;
    
    const [version] = await db
      .insert(documentVersions)
      .values({
        ...insertVersion,
        version: newVersion,
        uploadedAt: new Date()
      })
      .returning();
      
    return version;
  }
  
  // Document tag relation operations
  async addTagToDocument(documentId: number, tagId: number): Promise<void> {
    try {
      await db
        .insert(documentToTags)
        .values({
          documentId,
          tagId,
          createdAt: new Date()
        })
        .onConflictDoNothing();
    } catch (error) {
      console.error('Error adding tag to document:', error);
    }
  }
  
  async removeTagFromDocument(documentId: number, tagId: number): Promise<void> {
    try {
      await db
        .delete(documentToTags)
        .where(
          and(
            eq(documentToTags.documentId, documentId),
            eq(documentToTags.tagId, tagId)
          )
        );
    } catch (error) {
      console.error('Error removing tag from document:', error);
    }
  }
  
  async getDocumentTags(documentId: number): Promise<DocumentTag[]> {
    return await db
      .select({
        id: documentTags.id,
        name: documentTags.name,
        createdAt: documentTags.createdAt
      })
      .from(documentToTags)
      .innerJoin(documentTags, eq(documentToTags.tagId, documentTags.id))
      .where(eq(documentToTags.documentId, documentId))
      .orderBy(asc(documentTags.name));
  }
  
  // Document access logging
  async logDocumentAccess(documentId: number, userId: number, action: string): Promise<void> {
    try {
      await db
        .insert(documentAccessLogs)
        .values({
          documentId,
          userId,
          action,
          timestamp: new Date(),
          ipAddress: '',
          userAgent: ''
        });
    } catch (error) {
      console.error('Error logging document access:', error);
    }
  }
  
  // Stats
  async getRequestStats(): Promise<{
    total: number;
    pendingApproval: number;
    approved: number;
    rejected: number;
  }> {
    const [totalResult] = await db.select({ count: count() }).from(requests);
    const [pendingResult] = await db
      .select({ count: count() })
      .from(requests)
      .where(eq(requests.status, 'pending_approval'));
    const [approvedResult] = await db
      .select({ count: count() })
      .from(requests)
      .where(eq(requests.status, 'approved'));
    const [rejectedResult] = await db
      .select({ count: count() })
      .from(requests)
      .where(eq(requests.status, 'rejected'));
    
    return {
      total: totalResult?.count || 0,
      pendingApproval: pendingResult?.count || 0,
      approved: approvedResult?.count || 0,
      rejected: rejectedResult?.count || 0
    };
  }
  
  async getDocumentStats(): Promise<{
    total: number;
    draft: number;
    published: number;
    archived: number;
  }> {
    const [totalResult] = await db.select({ count: count() }).from(documents);
    const [draftResult] = await db
      .select({ count: count() })
      .from(documents)
      .where(eq(documents.status, 'draft'));
    const [publishedResult] = await db
      .select({ count: count() })
      .from(documents)
      .where(eq(documents.status, 'published'));
    const [archivedResult] = await db
      .select({ count: count() })
      .from(documents)
      .where(eq(documents.status, 'archived'));
    
    return {
      total: totalResult?.count || 0,
      draft: draftResult?.count || 0,
      published: publishedResult?.count || 0,
      archived: archivedResult?.count || 0
    };
  }
}

export class MemStorage implements IStorage {
  sessionStore: session.Store;
  private users: Map<number, User>;
  private requests: Map<number, Request>;
  private approvalSteps: Map<number, ApprovalStep>;
  private notifications: Map<number, Notification>;
  
  private userIdCounter: number;
  private requestIdCounter: number;
  private approvalStepIdCounter: number;
  private notificationIdCounter: number;
  
  constructor() {
    // Setup memory-based session store
    const MemoryStore = require("memorystore")(session);
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000 // prune expired entries every 24h
    });
    
    this.users = new Map();
    this.requests = new Map();
    this.approvalSteps = new Map();
    this.notifications = new Map();
    
    this.userIdCounter = 1;
    this.requestIdCounter = 1;
    this.approvalStepIdCounter = 1;
    this.notificationIdCounter = 1;
    
    // Add some initial users for testing
    this.createUser({
      username: "admin",
      password: "password123",
      fullName: "Admin User",
      email: "admin@example.com",
      department: "IT",
      role: "approver"
    });
    
    this.createUser({
      username: "manager",
      password: "password123",
      fullName: "John Doe",
      email: "manager@example.com",
      department: "Marketing",
      role: "validator"
    });
    
    this.createUser({
      username: "user",
      password: "password123",
      fullName: "Sarah Johnson",
      email: "user@example.com",
      department: "Marketing",
      role: "initiator"
    });
  }
  
  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }
  
  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username
    );
  }
  
  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userIdCounter++;
    const now = new Date();
    const user: User = { ...insertUser, id, createdAt: now };
    this.users.set(id, user);
    return user;
  }
  
  // Request operations
  async getRequest(id: number): Promise<Request | undefined> {
    return this.requests.get(id);
  }
  
  async getRequestByTicketId(ticketId: string): Promise<Request | undefined> {
    return Array.from(this.requests.values()).find(
      (request) => request.ticketId === ticketId
    );
  }
  
  async getRequests(): Promise<Request[]> {
    return Array.from(this.requests.values()).sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }
  
  async getRequestsByUser(userId: number): Promise<Request[]> {
    return Array.from(this.requests.values())
      .filter(request => request.createdBy === userId)
      .sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
  }
  
  async getRequestsToApprove(userId: number): Promise<Request[]> {
    return Array.from(this.requests.values())
      .filter(request => request.currentApprover === userId && request.status === 'pending_approval')
      .sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
  }
  
  async createRequest(insertRequest: InsertRequest): Promise<Request> {
    const id = this.requestIdCounter++;
    const now = new Date();
    
    // Generate a ticket ID with pattern REQ-YYYY-NNNN
    const year = now.getFullYear();
    const ticketId = `REQ-${year}-${id.toString().padStart(4, '0')}`;
    
    const request: Request = {
      ...insertRequest,
      id,
      ticketId,
      status: "pending_approval",
      createdAt: now,
      updatedAt: now
    };
    
    this.requests.set(id, request);
    return request;
  }
  
  async updateRequest(id: number, updates: Partial<Request>): Promise<Request | undefined> {
    const request = this.requests.get(id);
    if (!request) {
      return undefined;
    }
    
    const updatedRequest = { 
      ...request, 
      ...updates, 
      updatedAt: new Date() 
    };
    
    this.requests.set(id, updatedRequest);
    return updatedRequest;
  }
  
  // Approval steps operations
  async getApprovalSteps(requestId: number): Promise<ApprovalStep[]> {
    return Array.from(this.approvalSteps.values())
      .filter(step => step.requestId === requestId)
      .sort((a, b) => a.order - b.order);
  }
  
  async createApprovalStep(insertStep: InsertApprovalStep): Promise<ApprovalStep> {
    const id = this.approvalStepIdCounter++;
    const now = new Date();
    
    const step: ApprovalStep = {
      ...insertStep,
      id,
      actionDate: null,
      createdAt: now
    };
    
    this.approvalSteps.set(id, step);
    return step;
  }
  
  async updateApprovalStep(id: number, updates: Partial<ApprovalStep>): Promise<ApprovalStep | undefined> {
    const step = this.approvalSteps.get(id);
    if (!step) {
      return undefined;
    }
    
    const updatedStep: ApprovalStep = { 
      ...step, 
      ...updates,
      actionDate: updates.status === 'pending' ? null : new Date()
    };
    
    this.approvalSteps.set(id, updatedStep);
    return updatedStep;
  }
  
  // Notification operations
  async getNotifications(userId: number): Promise<Notification[]> {
    return Array.from(this.notifications.values())
      .filter(notification => notification.userId === userId)
      .sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
  }
  
  async createNotification(insertNotification: InsertNotification): Promise<Notification> {
    const id = this.notificationIdCounter++;
    const now = new Date();
    
    const notification: Notification = {
      ...insertNotification,
      id,
      isRead: false,
      createdAt: now
    };
    
    this.notifications.set(id, notification);
    return notification;
  }
  
  async markNotificationAsRead(id: number): Promise<Notification | undefined> {
    const notification = this.notifications.get(id);
    if (!notification) {
      return undefined;
    }
    
    const updatedNotification = { ...notification, isRead: true };
    this.notifications.set(id, updatedNotification);
    return updatedNotification;
  }
  
  // Stats
  async getRequestStats(): Promise<{
    total: number;
    pendingApproval: number;
    approved: number;
    rejected: number;
  }> {
    const allRequests = Array.from(this.requests.values());
    
    return {
      total: allRequests.length,
      pendingApproval: allRequests.filter(r => r.status === 'pending_approval').length,
      approved: allRequests.filter(r => r.status === 'approved').length,
      rejected: allRequests.filter(r => r.status === 'rejected').length
    };
  }
}

// Remplacer MemStorage par DatabaseStorage pour utiliser la base de données persistante
export const storage = new DatabaseStorage();
