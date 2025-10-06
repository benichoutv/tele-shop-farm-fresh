import express from 'express';
import { getDb } from '../db/connection.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

// Get all settings
router.get('/', async (req, res) => {
  try {
    const db = await getDb();
    const settings = await db.all('SELECT * FROM settings');
    const settingsObj = settings.reduce((acc, { key, value }) => {
      acc[key] = value;
      return acc;
    }, {});
    res.json(settingsObj);
  } catch (error) {
    console.error('Error fetching settings:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des paramètres' });
  }
});

// Update settings (admin only)
router.put('/', authMiddleware, async (req, res) => {
  try {
    const db = await getDb();
    const settings = req.body;
    
    for (const [key, value] of Object.entries(settings)) {
      await db.run(
        `INSERT INTO settings (key, value) VALUES (?, ?)
         ON CONFLICT(key) DO UPDATE SET value = ?, updated_at = CURRENT_TIMESTAMP`,
        [key, value, value]
      );
    }
    
    res.json({ message: 'Paramètres mis à jour avec succès' });
  } catch (error) {
    console.error('Error updating settings:', error);
    res.status(500).json({ error: 'Erreur lors de la mise à jour des paramètres' });
  }
});

export default router;
