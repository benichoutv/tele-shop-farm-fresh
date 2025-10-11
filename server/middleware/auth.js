import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'INSECURE_DEV_SECRET';

if (!process.env.JWT_SECRET) {
  console.warn('WARNING: JWT_SECRET is not set. Using insecure default. Set JWT_SECRET in .env to secure admin APIs.');
}

export function authMiddleware(req, res, next) {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ error: 'Authentification requise' });
    }
    
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Token invalide' });
  }
}
