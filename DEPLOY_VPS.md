# RSLiv - Guide de Déploiement VPS Ubuntu 22.04

Application e-commerce complète avec backend Node.js/Express, base de données SQLite/PostgreSQL, et notifications Telegram.

## 📋 Prérequis

- Ubuntu 22.04 LTS
- Node.js 18.x ou supérieur
- FFmpeg (pour la conversion vidéo)
- PM2 (pour la gestion du processus)

## 🚀 Installation sur VPS Ubuntu 22.04

### 1. Installer Node.js

```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
```

### 2. Installer FFmpeg

```bash
sudo apt update
sudo apt install -y ffmpeg
```

### 3. Installer PM2

```bash
sudo npm install -g pm2
```

### 4. Préparer l'application

```bash
# Cloner ou copier votre code dans /var/www/rsliv
sudo mkdir -p /var/www/rsliv
cd /var/www/rsliv

# Installer les dépendances
npm install

# Créer le dossier uploads
sudo mkdir -p /var/www/rsliv/uploads
sudo chown -R $USER:$USER /var/www/rsliv/uploads
sudo chmod -R 755 /var/www/rsliv/uploads

# Créer le dossier logs pour PM2
mkdir -p logs
```

### 5. Configuration

```bash
# Copier et éditer le fichier de configuration
cp .env.example .env
nano .env
```

**Configuration minimale requise dans `.env` :**

```env
NODE_ENV=production
PORT=3000
APP_BASE_URL=http://votre-domaine.com
UPLOAD_DIR=/var/www/rsliv/uploads
JWT_SECRET=changez-cette-cle-secrete-en-production
TELEGRAM_BOT_TOKEN=votre_token_bot
TELEGRAM_ADMIN_CONTACT=@votre_username
```

**Pour obtenir un token Telegram Bot :**
1. Ouvrir Telegram et chercher @BotFather
2. Envoyer `/newbot` et suivre les instructions
3. Copier le token fourni dans `.env`
4. Mettre votre username Telegram dans `TELEGRAM_ADMIN_CONTACT`

### 6. Build du frontend

```bash
npm run build
```

### 7. Démarrage avec PM2

```bash
# Démarrer l'application
pm2 start ecosystem.config.cjs

# Sauvegarder la configuration PM2
pm2 save

# Configurer PM2 pour démarrer au boot
pm2 startup
# Exécuter la commande affichée par pm2 startup
```

## 🔍 Vérifications après déploiement

### Vérifier que l'application tourne

```bash
pm2 status
pm2 logs rsliv-app
```

### Tester l'API

```bash
# Health check
curl http://localhost:3000/api/health

# Vérifier que les uploads sont accessibles
ls -la /var/www/rsliv/uploads
```

### Vérifier FFmpeg

```bash
ffmpeg -version
```

### Tester une requête complète

```bash
curl http://localhost:3000/api/products
curl http://localhost:3000/api/categories
curl http://localhost:3000/api/settings
```

## 🗄️ Base de données

### SQLite (par défaut)

La base de données SQLite est automatiquement créée dans `database.sqlite`.

```bash
# Voir le fichier de base de données
ls -la database.sqlite
```

### PostgreSQL (optionnel)

Pour utiliser PostgreSQL au lieu de SQLite :

1. Installer PostgreSQL :
```bash
sudo apt install postgresql postgresql-contrib
```

2. Créer la base de données :
```bash
sudo -u postgres psql
CREATE DATABASE rsliv;
CREATE USER rsliv_user WITH PASSWORD 'votre_mot_de_passe';
GRANT ALL PRIVILEGES ON DATABASE rsliv TO rsliv_user;
\q
```

3. Modifier `.env` :
```env
DB_TYPE=postgresql
DATABASE_URL=postgresql://rsliv_user:votre_mot_de_passe@localhost:5432/rsliv
```

4. Redémarrer l'application :
```bash
pm2 restart rsliv-app
```

## 🔐 Accès Admin

**Identifiants par défaut :**
- Username: `admin`
- Password: `admin123`

**⚠️ IMPORTANT :** Changez ces identifiants en production !

## 📱 Fonctionnalités

### Frontend (React)
- Catalogue de produits avec filtres par catégorie
- Fiche produit détaillée
- Panier d'achat
- Formulaire de commande
- Message de bienvenue personnalisé avec username Telegram

### Backend (Node.js/Express)
- API REST complète
- Gestion des produits (CRUD)
- Gestion des catégories
- Gestion des commandes
- Upload d'images et vidéos
- Conversion automatique des vidéos en 480p
- Notifications Telegram pour chaque commande
- Authentification admin (JWT)

### Admin
- Interface d'administration mobile-first
- CRUD produits avec upload média
- Gestion des catégories
- Options de prix multiples par produit
- Gestion des commandes
- Configuration des paramètres

## 🛠️ Commandes utiles

```bash
# Voir les logs
pm2 logs rsliv-app

# Redémarrer l'application
pm2 restart rsliv-app

# Arrêter l'application
pm2 stop rsliv-app

# Voir le statut
pm2 status

# Monitorer l'application
pm2 monit
```

## 🌐 Configuration Nginx (optionnel)

Pour servir l'application avec Nginx :

```bash
sudo apt install nginx
```

Créer `/etc/nginx/sites-available/rsliv` :

```nginx
server {
    listen 80;
    server_name votre-domaine.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }

    location /uploads {
        alias /var/www/rsliv/uploads;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }
}
```

Activer le site :

```bash
sudo ln -s /etc/nginx/sites-available/rsliv /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

## 🔒 Sécurité

- Changez le `JWT_SECRET` dans `.env`
- Changez les identifiants admin par défaut
- Configurez un firewall (UFW)
- Installez un certificat SSL avec Let's Encrypt (certbot)
