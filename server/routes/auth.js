import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { getDb } from '../db/connection.js';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  console.error('CRITICAL: JWT_SECRET is not set in environment variables!');
  process.exit(1);
}

// Login
router.post('/login', async (req, res) => {
  try {
    const db = await getDb();
    const { username, password } = req.body;
    
    // Input validation
    if (!username || !password) {
      return res.status(400).json({ error: 'Username et password requis' });
    }
    
    if (typeof username !== 'string' || typeof password !== 'string') {
      return res.status(400).json({ error: 'Format invalide' });
    }
    
    if (username.length > 50 || password.length > 100) {
      return res.status(400).json({ error: 'Données trop longues' });
    }
    
    const user = await db.get('SELECT * FROM admin_users WHERE username = ?', [username]);
    
    if (!user) {
      return res.status(401).json({ error: 'Identifiants incorrects' });
    }
    
    // Support legacy PHP-style bcrypt hashes ($2y$) by normalizing to $2a$
    let storedHash = user.password_hash || '';
    if (storedHash.startsWith('$2y$')) {
      storedHash = storedHash.replace(/^\$2y\$/, '$2a$');
    }

    const validPassword = await bcrypt.compare(password, storedHash);
    
    if (!validPassword) {
      return res.status(401).json({ error: 'Identifiants incorrects' });
    }
    
    const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, {
      expiresIn: '24h'
    });
    
    res.json({ token, username: user.username });
  } catch (error) {
    console.error('Error during login:', error);
    res.status(500).json({ error: 'Erreur lors de la connexion' });
  }
});

// Verify token
router.get('/verify', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ error: 'Token manquant' });
    }
    
    const decoded = jwt.verify(token, JWT_SECRET);
    res.json({ valid: true, username: decoded.username });
  } catch (error) {
    res.status(401).json({ error: 'Token invalide' });
  }
});

export default router;
