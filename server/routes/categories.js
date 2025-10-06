import express from 'express';
import { getDb } from '../db/connection.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

// Get all categories
router.get('/', async (req, res) => {
  try {
    const db = await getDb();
    const categories = await db.all('SELECT * FROM categories ORDER BY name');
    res.json(categories);
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des catégories' });
  }
});

// Create category (admin only)
router.post('/', authMiddleware, async (req, res) => {
  try {
    const db = await getDb();
    const { name } = req.body;
    
    if (!name) {
      return res.status(400).json({ error: 'Le nom est requis' });
    }
    
    const result = await db.run('INSERT INTO categories (name) VALUES (?)', [name]);
    res.status(201).json({ id: result.lastID, name });
  } catch (error) {
    if (error.code === 'SQLITE_CONSTRAINT') {
      return res.status(409).json({ error: 'Cette catégorie existe déjà' });
    }
    console.error('Error creating category:', error);
    res.status(500).json({ error: 'Erreur lors de la création de la catégorie' });
  }
});

// Delete category (admin only)
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const db = await getDb();
    await db.run('DELETE FROM categories WHERE id = ?', [req.params.id]);
    res.json({ message: 'Catégorie supprimée avec succès' });
  } catch (error) {
    console.error('Error deleting category:', error);
    res.status(500).json({ error: 'Erreur lors de la suppression de la catégorie' });
  }
});

export default router;
