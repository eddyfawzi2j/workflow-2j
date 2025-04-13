import fs from 'fs/promises';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

/**
 * Service pour gérer l'upload des fichiers
 */
export class UploadService {
  static readonly UPLOAD_DIR = 'uploads';

  /**
   * S'assure que le répertoire d'upload existe
   */
  static async ensureUploadDirExists(): Promise<void> {
    try {
      await fs.access(this.UPLOAD_DIR);
    } catch (error) {
      // Le répertoire n'existe pas, le créer
      await fs.mkdir(this.UPLOAD_DIR, { recursive: true });
    }
  }

  /**
   * Crée un répertoire pour un document
   * @param documentId Identifiant du document
   */
  static async createDocumentDir(documentId: number): Promise<string> {
    const dirPath = path.join(this.UPLOAD_DIR, `document_${documentId}`);
    await this.ensureUploadDirExists();
    
    try {
      await fs.access(dirPath);
    } catch (error) {
      // Le répertoire n'existe pas, le créer
      await fs.mkdir(dirPath, { recursive: true });
    }
    
    return dirPath;
  }

  /**
   * Sauvegarde un fichier dans le répertoire d'upload
   * @param fileBuffer Contenu du fichier
   * @param fileName Nom original du fichier
   * @param documentId Identifiant du document (optionnel)
   * @returns Le chemin où le fichier a été enregistré
   */
  static async saveFile(
    fileBuffer: Buffer, 
    fileName: string, 
    documentId?: number
  ): Promise<string> {
    await this.ensureUploadDirExists();
    
    let filePath: string;
    
    if (documentId) {
      // Créer un répertoire spécifique pour ce document
      const documentDir = await this.createDocumentDir(documentId);
      
      // Générer un nom de fichier unique pour éviter les collisions
      const uniqueFileName = `${Date.now()}_${fileName}`;
      filePath = path.join(documentDir, uniqueFileName);
    } else {
      // Fichier temporaire, utiliser un UUID pour garantir l'unicité
      const tempFileName = `${uuidv4()}_${fileName}`;
      filePath = path.join(this.UPLOAD_DIR, tempFileName);
    }
    
    // Écrire le fichier
    await fs.writeFile(filePath, fileBuffer);
    
    return filePath;
  }

  /**
   * Supprime un fichier
   * @param filePath Chemin du fichier à supprimer
   */
  static async deleteFile(filePath: string): Promise<void> {
    try {
      await fs.access(filePath);
      await fs.unlink(filePath);
    } catch (err) {
      const error = err as Error;
      console.error(`Erreur lors de la suppression du fichier ${filePath}:`, error);
      throw new Error(`Impossible de supprimer le fichier: ${error.message || 'Erreur inconnue'}`);
    }
  }

  /**
   * Déplace un fichier vers le répertoire d'un document
   * @param sourcePath Chemin source du fichier
   * @param documentId Identifiant du document
   * @param version Numéro de version
   * @param originalFileName Nom original du fichier
   * @returns Le nouveau chemin du fichier
   */
  static async moveFileToDocumentDir(
    sourcePath: string,
    documentId: number,
    version: number,
    originalFileName: string
  ): Promise<string> {
    const documentDir = await this.createDocumentDir(documentId);
    const newFileName = `${version}_${originalFileName}`;
    const targetPath = path.join(documentDir, newFileName);
    
    await fs.copyFile(sourcePath, targetPath);
    await this.deleteFile(sourcePath);
    
    return targetPath;
  }
}