import { createWorker } from 'tesseract.js';
import fs from 'fs/promises';
import path from 'path';

/**
 * Service pour extraire le texte des images et documents scannés à l'aide de OCR
 */
export class OCRService {
  /**
   * Extrait le texte d'un fichier image
   * @param filePath Chemin vers le fichier image
   * @param language Langue du texte à reconnaître (par défaut 'fra' pour le français)
   * @returns Texte extrait du document
   */
  static async extractTextFromImage(filePath: string, language: string = 'fra'): Promise<string> {
    try {
      // Vérifier que le fichier existe
      await fs.access(filePath);
      
      // Initialiser le worker Tesseract
      const worker = await createWorker(language);
      
      // Reconnaître le texte
      const { data } = await worker.recognize(filePath);
      
      // Libérer les ressources
      await worker.terminate();
      
      return data.text;
    } catch (err) {
      const error = err as Error;
      console.error('Erreur lors de l\'extraction de texte:', error);
      throw new Error(`Échec de l'extraction de texte: ${error.message || 'Erreur inconnue'}`);
    }
  }

  /**
   * Détermine si un type de fichier est supporté pour l'OCR
   * @param fileType Type MIME du fichier
   * @returns Vrai si le type de fichier est supporté
   */
  static isFileTypeSupported(fileType: string): boolean {
    const supportedTypes = [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/gif',
      'image/tiff',
      'application/pdf'
    ];
    
    return supportedTypes.includes(fileType);
  }

  /**
   * Extrait le texte d'un PDF (première page seulement pour la démonstration)
   * Note: Dans une implémentation complète, nous aurions besoin d'une bibliothèque
   * supplémentaire pour extraire les images de toutes les pages du PDF
   * @param filePath Chemin vers le fichier PDF
   * @returns Texte extrait du PDF
   */
  static async extractTextFromPDF(filePath: string): Promise<string> {
    // Note: Ceci est une implémentation simplifiée.
    // Pour une solution complète, nous devrions utiliser pdf.js ou pdf-parse
    // pour extraire les images de chaque page et les traiter avec OCR
    return this.extractTextFromImage(filePath);
  }
}