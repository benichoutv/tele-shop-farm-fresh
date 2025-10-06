# Guide de déploiement sur VPS

## Architecture de l'application

Cette application est composée de deux parties :

### 1. Frontend (React/Vite) - CE QUI EST ICI
- Interface utilisateur complète
- Pages : Accueil, Info, Panier, Détails produit, Admin
- Design responsive mobile-first
- Prêt à être déployé

### 2. Backend (À CRÉER SUR VOTRE VPS)
Le backend doit être créé séparément sur votre VPS. Voici ce dont vous avez besoin :

## Stack technique recommandée pour le backend

```
- Node.js + Express (ou NestJS)
- PostgreSQL ou MySQL (base de données)
- Stockage local pour médias (avec multer)
- node-telegram-bot-api pour les notifications
```

## Structure backend recommandée

```
backend/
├── src/
│   ├── config/
│   │   └── database.js
│   ├── controllers/
│   │   ├── products.js
│   │   ├── orders.js
│   │   └── admin.js
│   ├── models/
│   │   ├── Product.js
│   │   ├── Order.js
│   │   ├── Category.js
│   │   └── Farm.js
│   ├── routes/
│   │   ├── products.js
│   │   ├── orders.js
│   │   └── admin.js
│   ├── middleware/
│   │   ├── auth.js
│   │   └── upload.js
│   ├── services/
│   │   └── telegram.js
│   └── server.js
├── uploads/
│   ├── products/
│   └── videos/
├── .env
├── package.json
└── docker-compose.yml
```

## Endpoints API nécessaires

### Produits
```
GET    /api/products              - Liste tous les produits
GET    /api/products/:id          - Détail d'un produit
POST   /api/products              - Créer un produit (admin)
PUT    /api/products/:id          - Modifier un produit (admin)
DELETE /api/products/:id          - Supprimer un produit (admin)
POST   /api/products/:id/upload   - Upload image/vidéo (admin)
```

### Catégories & Fermes
```
GET    /api/categories            - Liste des catégories
POST   /api/categories            - Créer catégorie (admin)
GET    /api/farms                 - Liste des fermes
POST   /api/farms                 - Créer ferme (admin)
```

### Commandes
```
POST   /api/orders                - Créer une commande
GET    /api/orders                - Liste commandes (admin)
GET    /api/orders/:id            - Détail commande (admin)
```

### Admin
```
POST   /api/admin/login           - Connexion admin
GET    /api/admin/settings        - Paramètres
PUT    /api/admin/settings        - Modifier paramètres
PUT    /api/admin/credentials     - Changer identifiants
```

## Schéma de base de données

### Table: products
```sql
CREATE TABLE products (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  variety VARCHAR(255),
  farm_id INTEGER REFERENCES farms(id),
  category_id INTEGER REFERENCES categories(id),
  description TEXT,
  image_url VARCHAR(500),
  video_url VARCHAR(500),
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Table: product_prices
```sql
CREATE TABLE product_prices (
  id SERIAL PRIMARY KEY,
  product_id INTEGER REFERENCES products(id),
  weight VARCHAR(50),
  price DECIMAL(10,2),
  UNIQUE(product_id, weight)
);
```

### Table: categories
```sql
CREATE TABLE categories (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE
);
```

### Table: farms
```sql
CREATE TABLE farms (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE
);
```

### Table: orders
```sql
CREATE TABLE orders (
  id SERIAL PRIMARY KEY,
  customer_name VARCHAR(255) NOT NULL,
  customer_phone VARCHAR(50) NOT NULL,
  customer_address TEXT NOT NULL,
  telegram_username VARCHAR(255),
  total DECIMAL(10,2),
  status VARCHAR(50) DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Table: order_items
```sql
CREATE TABLE order_items (
  id SERIAL PRIMARY KEY,
  order_id INTEGER REFERENCES orders(id),
  product_id INTEGER REFERENCES products(id),
  product_name VARCHAR(255),
  weight VARCHAR(50),
  quantity INTEGER,
  price DECIMAL(10,2)
);
```

### Table: settings
```sql
CREATE TABLE settings (
  id SERIAL PRIMARY KEY,
  telegram_username VARCHAR(255),
  telegram_chat_id VARCHAR(255),
  admin_username VARCHAR(255) NOT NULL DEFAULT 'admin',
  admin_password_hash VARCHAR(500) NOT NULL
);
```

## Configuration Telegram Bot

1. Créer un bot via BotFather sur Telegram
2. Récupérer le token API
3. Configurer dans `.env` :

```env
TELEGRAM_BOT_TOKEN=votre_token_ici
TELEGRAM_ADMIN_USERNAME=@votre_username
```

## Exemple de service Telegram (Node.js)

```javascript
// src/services/telegram.js
const TelegramBot = require('node-telegram-bot-api');

class TelegramService {
  constructor() {
    this.bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, { polling: false });
  }

  async sendOrderNotification(order, items) {
    const message = `
🛍️ *Nouvelle Commande #${order.id}*

👤 *Client:*
Nom: ${order.customer_name}
Tel: ${order.customer_phone}
Adresse: ${order.customer_address}

📦 *Produits:*
${items.map(item => `- ${item.product_name} (${item.weight}) x${item.quantity} - ${item.price}€`).join('\n')}

💰 *Total: ${order.total}€*
    `;

    try {
      // Envoi au username configuré
      const adminUsername = await this.getAdminUsername();
      if (adminUsername) {
        await this.bot.sendMessage(adminUsername, message, { parse_mode: 'Markdown' });
      }

      // Optionnel: envoi au chat_id si configuré
      const chatId = await this.getChatId();
      if (chatId) {
        await this.bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
      }

      return { success: true };
    } catch (error) {
      console.error('Telegram error:', error);
      return { success: false, error };
    }
  }

  async getAdminUsername() {
    // Récupérer depuis la base de données
    const settings = await db.query('SELECT telegram_username FROM settings LIMIT 1');
    return settings.rows[0]?.telegram_username;
  }

  async getChatId() {
    // Récupérer depuis la base de données
    const settings = await db.query('SELECT telegram_chat_id FROM settings LIMIT 1');
    return settings.rows[0]?.telegram_chat_id;
  }
}

module.exports = new TelegramService();
```

## Docker Compose pour VPS

```yaml
# docker-compose.yml
version: '3.8'

services:
  postgres:
    image: postgres:15
    environment:
      POSTGRES_DB: rsliv_shop
      POSTGRES_USER: rsliv
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

  backend:
    build: ./backend
    ports:
      - "3001:3001"
    environment:
      DATABASE_URL: postgresql://rsliv:${DB_PASSWORD}@postgres:5432/rsliv_shop
      TELEGRAM_BOT_TOKEN: ${TELEGRAM_BOT_TOKEN}
      JWT_SECRET: ${JWT_SECRET}
    depends_on:
      - postgres
    volumes:
      - ./backend/uploads:/app/uploads

  frontend:
    build: ./frontend
    ports:
      - "80:80"
    depends_on:
      - backend

volumes:
  postgres_data:
```

## Étapes de déploiement sur VPS

### 1. Préparer le VPS
```bash
# Connexion SSH
ssh root@votre-ip-vps

# Installation Docker & Docker Compose
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh
apt-get install docker-compose-plugin
```

### 2. Cloner et configurer
```bash
# Créer la structure
mkdir /var/www/rsliv-shop
cd /var/www/rsliv-shop

# Copier le frontend (ce projet)
git clone votre-repo frontend/

# Créer le backend
mkdir backend
# ... créer la structure backend selon le plan ci-dessus
```

### 3. Configurer l'environnement
```bash
# Créer .env
cat > .env << EOF
DB_PASSWORD=votre_password_securise
TELEGRAM_BOT_TOKEN=votre_token_telegram
JWT_SECRET=votre_secret_jwt
EOF
```

### 4. Construire le frontend
```bash
cd frontend
npm install
npm run build
```

### 5. Démarrer les services
```bash
cd /var/www/rsliv-shop
docker-compose up -d
```

### 6. Initialiser la base de données
```bash
# Exécuter les scripts SQL pour créer les tables
docker-compose exec postgres psql -U rsliv -d rsliv_shop < init.sql
```

## Connexion du frontend au backend

Dans votre frontend, créer un fichier de configuration API :

```typescript
// src/lib/api.ts
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

export const api = {
  async getProducts() {
    const res = await fetch(`${API_BASE_URL}/products`);
    return res.json();
  },

  async createOrder(orderData: any) {
    const res = await fetch(`${API_BASE_URL}/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(orderData),
    });
    return res.json();
  },

  // ... autres méthodes
};
```

## Configuration Telegram Mini App

1. Créer l'app via BotFather: `/newapp`
2. Configurer l'URL de votre app déployée
3. Ajouter le script Telegram dans `index.html` :

```html
<script src="https://telegram.org/js/telegram-web-app.js"></script>
```

4. Récupérer les données utilisateur :

```typescript
// src/lib/telegram.ts
export const getTelegramUser = () => {
  if (window.Telegram?.WebApp) {
    return window.Telegram.WebApp.initDataUnsafe?.user;
  }
  return null;
};
```

## Maintenance & Logs

```bash
# Voir les logs
docker-compose logs -f backend

# Redémarrer les services
docker-compose restart

# Sauvegarder la base de données
docker-compose exec postgres pg_dump -U rsliv rsliv_shop > backup.sql
```

## Sécurité

1. **Toujours** utiliser HTTPS (avec Let's Encrypt)
2. **Toujours** hasher les mots de passe (bcrypt)
3. **Limiter** les uploads (taille max 10Mo)
4. **Valider** toutes les entrées utilisateur
5. **Utiliser** JWT avec expiration courte
6. **Configurer** un firewall (ufw)

## Support

Pour toute question sur l'intégration backend, consultez :
- Documentation Express.js : https://expressjs.com/
- Documentation PostgreSQL : https://www.postgresql.org/docs/
- Documentation Telegram Bot API : https://core.telegram.org/bots/api
