import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  console.error('CRITICAL: JWT_SECRET is not set in environment variables!');
  process.exit(1);
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
