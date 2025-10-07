# RSLiv - E-commerce Platform

Application e-commerce complète avec backend Node.js/Express, base de données SQLite/PostgreSQL, et notifications Telegram.

## 🚀 Fonctionnalités

### Frontend (React + Vite)
- Catalogue de produits avec filtres par catégorie
- Fiche produit détaillée avec galerie média
- Panier d'achat dynamique
- Formulaire de commande
- Interface responsive et moderne
- Message de bienvenue personnalisé avec contact Telegram

### Backend (Node.js + Express)
- API REST complète
- Gestion des produits (CRUD)
- Gestion des catégories
- Gestion des commandes
- Upload d'images et vidéos
- Conversion automatique des vidéos en 480p (FFmpeg)
- Notifications Telegram automatiques pour chaque commande
- Authentification admin (JWT)

### Panel Admin
- Interface mobile-first
- CRUD produits avec upload média
- Gestion des catégories
- Options de prix multiples par produit
- Gestion des commandes
- Configuration des paramètres (nom du site, message de bienvenue, etc.)

## 📋 Technologies

- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS, shadcn-ui
- **Backend**: Node.js, Express
- **Base de données**: SQLite (par défaut) ou PostgreSQL
- **Authentification**: JWT, bcrypt
- **Médias**: Multer, FFmpeg
- **Notifications**: Telegram Bot API

## 🔧 Développement Local

### Prérequis
- Node.js 18+ 
- npm ou yarn
- FFmpeg (pour la conversion vidéo)

### Installation

```bash
# Cloner le repository
git clone <votre-repo-url>
cd rsliv

# Installer les dépendances
npm install

# Créer le fichier .env
cp .env.example .env
# Éditer .env avec vos configurations

# Créer le dossier uploads
mkdir -p uploads

# Démarrer le serveur de développement
npm run dev
```

Le frontend sera accessible sur `http://localhost:5173` et le backend sur `http://localhost:3000`.

## 🚀 Déploiement sur VPS

### Déploiement Automatique

Pour un déploiement complet et automatisé sur Ubuntu 22.04, consultez:

📖 **[DEPLOY_VPS.md](./DEPLOY_VPS.md)** - Guide de déploiement détaillé  
📖 **[DEPLOY_GUIDE.md](./DEPLOY_GUIDE.md)** - Guide complet avec architecture  
✅ **[DEPLOYMENT_CHECKLIST.md](./DEPLOYMENT_CHECKLIST.md)** - Checklist de vérification

### Script de déploiement rapide

```bash
# Sur votre VPS Ubuntu 22.04
cd /var/www
sudo git clone <votre-repo-url> rsliv
cd rsliv
sudo chmod +x deploy.sh
sudo ./deploy.sh votre-domaine.com votre-email@example.com
```

Le script `deploy.sh` installe automatiquement:
- Node.js 18+
- PM2 (gestionnaire de processus)
- FFmpeg
- Nginx (serveur web + proxy)
- Certificat SSL (Let's Encrypt)

### Configuration Post-Déploiement

1. **Token Telegram Bot**
   ```bash
   nano /var/www/rsliv/.env
   # Ajouter: TELEGRAM_BOT_TOKEN=votre_token
   pm2 restart rsliv-app
   ```

2. **Changer le mot de passe admin**
   ```bash
   cd /var/www/rsliv
   node server/reset-admin.js
   ```

### Mises à jour

```bash
cd /var/www/rsliv
git pull origin main
npm install  # si nouvelles dépendances
npm run build
pm2 restart rsliv-app
```

## 🔐 Accès Admin

**Identifiants par défaut:**
- Username: `admin`
- Password: `Admin123!`

⚠️ **Changez ces identifiants en production!**

Accédez au panel admin sur: `https://votre-domaine.com/admin/login`

## 📱 Configuration Telegram

1. Cherchez **@BotFather** sur Telegram
2. Envoyez `/newbot` et suivez les instructions
3. Copiez le token fourni dans `.env`:
   ```env
   TELEGRAM_BOT_TOKEN=123456789:ABCdef...
   TELEGRAM_ADMIN_CONTACT=@votre_username
   ```

## 🛠️ Commandes Utiles

```bash
# Voir les logs
pm2 logs rsliv-app

# Redémarrer
pm2 restart rsliv-app

# Arrêter
pm2 stop rsliv-app

# Voir le statut
pm2 status

# Monitorer
pm2 monit
```

## 📝 Variables d'Environnement

Voir [.env.example](./.env.example) pour la liste complète des variables.

Variables essentielles:
- `NODE_ENV=production`
- `PORT=3000`
- `APP_BASE_URL=https://votre-domaine.com`
- `JWT_SECRET=changez-moi-en-production`
- `TELEGRAM_BOT_TOKEN=votre_token`
- `UPLOAD_DIR=/var/www/rsliv/uploads`

## 🤝 Développement avec Lovable

Ce projet peut être édité via [Lovable](https://lovable.dev/projects/887601b2-0bd0-470a-af60-067158a517e6).

Les changements faits dans Lovable sont automatiquement synchronisés avec GitHub.

## 📄 Licence

Projet privé - Tous droits réservés
