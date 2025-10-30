import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs/promises';
import { getDb } from '../db/connection.js';
import { convertVideo } from '../services/video.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

// Configure multer for file uploads
const uploadsDir = process.env.UPLOAD_DIR || path.join(process.cwd(), 'uploads');
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    await fs.mkdir(uploadsDir, { recursive: true });
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 500 * 1024 * 1024 }, // 500MB limit
  fileFilter: (req, file, cb) => {
    const allowedImageTypes = /jpeg|jpg|png|webp/;
    const allowedVideoTypes = /mp4|webm|mov|quicktime/;
    const isImage = allowedImageTypes.test(path.extname(file.originalname).toLowerCase()) || 
                    file.mimetype.startsWith('image/');
    const isVideo = allowedVideoTypes.test(path.extname(file.originalname).toLowerCase()) || 
                    file.mimetype.startsWith('video/');
    
    if (isImage || isVideo) {
      return cb(null, true);
    }
    cb(new Error('Seuls les fichiers image (jpg, png, webp) et vidéo (mp4, webm, mov) sont acceptés'));
  }
});

// Get all products
router.get('/', async (req, res) => {
  try {
    const db = await getDb();
    const { category } = req.query;
    
    let query = `
      SELECT p.*, c.name as category_name,
        (SELECT json_group_array(json_object('id', id, 'weight', weight, 'price', price))
         FROM product_prices WHERE product_id = p.id) as prices
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
    `;
    
    if (category && category !== 'all') {
      query += ` WHERE c.name = ?`;
      const products = await db.all(query, [category]);
      return res.json(products.map(p => ({ ...p, prices: JSON.parse(p.prices || '[]') })));
    }
    
    const products = await db.all(query);
    res.json(products.map(p => ({ ...p, prices: JSON.parse(p.prices || '[]') })));
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des produits' });
  }
});

// Get single product
router.get('/:id', async (req, res) => {
  try {
    const db = await getDb();
    const product = await db.get(
      `SELECT p.*, c.name as category_name FROM products p
       LEFT JOIN categories c ON p.category_id = c.id
       WHERE p.id = ?`,
      [req.params.id]
    );
    
    if (!product) {
      return res.status(404).json({ error: 'Produit non trouvé' });
    }
    
    const prices = await db.all(
      'SELECT * FROM product_prices WHERE product_id = ?',
      [req.params.id]
    );
    
    res.json({ ...product, prices });
  } catch (error) {
    console.error('Error fetching product:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération du produit' });
  }
});

// Create product (admin only)
router.post('/', authMiddleware, upload.fields([
  { name: 'image', maxCount: 1 },
  { name: 'video', maxCount: 1 }
]), async (req, res) => {
  try {
    const db = await getDb();
    const { name, variety, category_id, farm, description, prices } = req.body;
    
    let imageUrl = null;
    let videoUrl = null;
    
    // Handle image upload
    if (req.files?.image) {
      imageUrl = `/uploads/${req.files.image[0].filename}`;
    }
    
    // Handle video upload and conversion
    if (req.files?.video) {
      const videoFile = req.files.video[0];
      const convertedPath = await convertVideo(videoFile.path);
      videoUrl = `/uploads/${path.basename(convertedPath)}`;
    }
    
    const result = await db.run(
      `INSERT INTO products (name, variety, category_id, farm, description, image_url, video_url)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [name, variety, category_id, farm, description, imageUrl, videoUrl]
    );
    
    const productId = result.lastID;
    
    // Insert prices
    if (prices) {
      const pricesArray = JSON.parse(prices);
      for (const price of pricesArray) {
        await db.run(
          'INSERT INTO product_prices (product_id, weight, price) VALUES (?, ?, ?)',
          [productId, price.weight, price.price]
        );
      }
    }
    
    res.status(201).json({ id: productId, message: 'Produit créé avec succès' });
  } catch (error) {
    console.error('Error creating product:', error);
    res.status(500).json({ error: 'Erreur lors de la création du produit' });
  }
});

// Update product (admin only)
router.put('/:id', authMiddleware, upload.fields([
  { name: 'image', maxCount: 1 },
  { name: 'video', maxCount: 1 }
]), async (req, res) => {
  try {
    const db = await getDb();
    const { name, variety, category_id, farm, description, prices } = req.body;
    const productId = req.params.id;
    
    const product = await db.get('SELECT * FROM products WHERE id = ?', [productId]);
    if (!product) {
      return res.status(404).json({ error: 'Produit non trouvé' });
    }
    
    let imageUrl = product.image_url;
    let videoUrl = product.video_url;
    
    // Handle new image upload
    if (req.files?.image) {
      // 🔥 Supprimer l'ancienne image si elle existe
      if (product.image_url) {
        const oldImagePath = path.join(uploadsDir, path.basename(product.image_url));
        try {
          await fs.unlink(oldImagePath);
          console.log(`✅ Ancienne image supprimée: ${path.basename(oldImagePath)}`);
        } catch (err) {
          console.error('⚠️ Erreur suppression ancienne image:', err);
        }
      }
      
      imageUrl = `/uploads/${req.files.image[0].filename}`;
    }
    
    // Handle new video upload
    if (req.files?.video) {
      // 🔥 Supprimer l'ancienne vidéo si elle existe
      if (product.video_url) {
        const oldVideoPath = path.join(uploadsDir, path.basename(product.video_url));
        try {
          await fs.unlink(oldVideoPath);
          console.log(`✅ Ancienne vidéo supprimée: ${path.basename(oldVideoPath)}`);
        } catch (err) {
          console.error('⚠️ Erreur suppression ancienne vidéo:', err);
        }
      }
      
      const videoFile = req.files.video[0];
      const convertedPath = await convertVideo(videoFile.path);
      videoUrl = `/uploads/${path.basename(convertedPath)}`;
    }
    
    await db.run(
      `UPDATE products SET name = ?, variety = ?, category_id = ?, farm = ?, 
       description = ?, image_url = ?, video_url = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [name, variety, category_id, farm, description, imageUrl, videoUrl, productId]
    );
    
    // Update prices
    if (prices) {
      await db.run('DELETE FROM product_prices WHERE product_id = ?', [productId]);
      const pricesArray = JSON.parse(prices);
      for (const price of pricesArray) {
        await db.run(
          'INSERT INTO product_prices (product_id, weight, price) VALUES (?, ?, ?)',
          [productId, price.weight, price.price]
        );
      }
    }
    
    res.json({ message: 'Produit mis à jour avec succès' });
  } catch (error) {
    console.error('Error updating product:', error);
    res.status(500).json({ error: 'Erreur lors de la mise à jour du produit' });
  }
});

// Delete product (admin only)
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const db = await getDb();
    const productId = req.params.id;
    
    // 1. Récupérer le produit pour obtenir les URLs des fichiers
    const product = await db.get('SELECT image_url, video_url FROM products WHERE id = ?', [productId]);
    
    if (product) {
      // 2. Supprimer les fichiers physiques
      if (product.image_url) {
        const imagePath = path.join(uploadsDir, path.basename(product.image_url));
        try {
          await fs.unlink(imagePath);
          console.log(`✅ Image supprimée: ${path.basename(imagePath)}`);
        } catch (err) {
          console.error('⚠️ Erreur suppression image:', err);
        }
      }
      
      if (product.video_url) {
        const videoPath = path.join(uploadsDir, path.basename(product.video_url));
        try {
          await fs.unlink(videoPath);
          console.log(`✅ Vidéo supprimée: ${path.basename(videoPath)}`);
        } catch (err) {
          console.error('⚠️ Erreur suppression vidéo:', err);
        }
      }
    }
    
    // 3. Supprimer le produit de la DB (les prix seront supprimés via CASCADE)
    await db.run('DELETE FROM products WHERE id = ?', [productId]);
    
    res.json({ message: 'Produit et fichiers associés supprimés avec succès' });
  } catch (error) {
    console.error('Error deleting product:', error);
    res.status(500).json({ error: 'Erreur lors de la suppression du produit' });
  }
});

export default router;
