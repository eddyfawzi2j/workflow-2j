// Script pour mettre à jour uniquement les nouvelles colonnes dans la base de données
import pg from 'pg';
const { Pool } = pg;

// Connexion à la base de données
const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function updateDatabase() {
  const client = await pool.connect();
  
  try {
    // Commencer une transaction
    await client.query('BEGIN');
    
    // Vérifier si la colonne extracted_text existe déjà dans la table documents
    const checkDocumentsResult = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'documents' AND column_name = 'extracted_text'
    `);
    
    // Ajouter la colonne si elle n'existe pas
    if (checkDocumentsResult.rows.length === 0) {
      console.log("Ajout de la colonne extracted_text à la table documents...");
      await client.query(`
        ALTER TABLE documents 
        ADD COLUMN IF NOT EXISTS extracted_text TEXT
      `);
    }
    
    // Vérifier si la colonne extracted_text existe déjà dans la table document_versions
    const checkVersionsResult = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'document_versions' AND column_name = 'extracted_text'
    `);
    
    // Ajouter la colonne si elle n'existe pas
    if (checkVersionsResult.rows.length === 0) {
      console.log("Ajout de la colonne extracted_text à la table document_versions...");
      await client.query(`
        ALTER TABLE document_versions 
        ADD COLUMN IF NOT EXISTS extracted_text TEXT
      `);
    }
    
    // Valider la transaction
    await client.query('COMMIT');
    
    console.log("Mise à jour de la base de données terminée avec succès!");
  } catch (error) {
    // Annuler la transaction en cas d'erreur
    await client.query('ROLLBACK');
    console.error("Erreur lors de la mise à jour de la base de données:", error);
  } finally {
    // Libérer le client
    client.release();
    // Fermer le pool
    pool.end();
  }
}

// Exécuter la mise à jour
updateDatabase();