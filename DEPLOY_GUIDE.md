# Guide de Déploiement Complet - Application E-commerce

## 📋 Vue d'ensemble

Cette application e-commerce est composée de:
- **Frontend**: React + Vite (interface client et admin)
- **Backend**: Node.js + Express (API REST)
- **Base de données**: SQLite
- **Médias**: Stockés sur le serveur dans `/uploads`
- **Reverse Proxy**: Nginx

Tout est hébergé sur le même VPS.

---

## 🚀 Déploiement Automatique

### Prérequis sur votre VPS

- Ubuntu 22.04 LTS (recommandé)
- Accès SSH root ou sudo
- Nom de domaine pointant vers votre VPS (optionnel mais recommandé)

### Étape 1: Préparer les fichiers

```bash
# Sur votre machine locale, compresser le projet
tar -czf rsliv-app.tar.gz .

# Uploader sur le VPS
scp rsliv-app.tar.gz user@votre-vps-ip:/tmp/
```

### Étape 2: Déployer sur le VPS

```bash
# Se connecter au VPS
ssh user@votre-vps-ip

# Créer le répertoire d'installation
sudo mkdir -p /var/www/rsliv
sudo chown $USER:$USER /var/www/rsliv

# Extraire les fichiers
cd /var/www/rsliv
tar -xzf /tmp/rsliv-app.tar.gz

# Rendre le script exécutable
chmod +x deploy.sh

# Lancer le déploiement automatique
# Remplacez par votre domaine et email
sudo ./deploy.sh votre-domaine.com votre-email@example.com

# OU pour installation locale sans SSL:
sudo ./deploy.sh localhost admin@localhost
```

Le script `deploy.sh` va:
1. ✅ Installer Node.js 18.x
2. ✅ Installer PM2 (gestionnaire de processus)
3. ✅ Installer Nginx (serveur web)
4. ✅ Installer FFmpeg (traitement vidéo)
5. ✅ Créer les répertoires nécessaires
6. ✅ Configurer les variables d'environnement
7. ✅ Installer les dépendances npm
8. ✅ Compiler le frontend
9. ✅ Démarrer le backend avec PM2
10. ✅ Configurer Nginx
11. ✅ Installer le certificat SSL (Let's Encrypt)

---

## 🔧 Configuration Post-Déploiement

### 1. Configurer le Bot Telegram

```bash
# Éditer le fichier .env
nano /var/www/rsliv/.env

# Ajouter votre token Telegram (obtenu via @BotFather)
TELEGRAM_BOT_TOKEN=123456789:ABCdefGHIjklMNOpqrsTUVwxyz
TELEGRAM_ADMIN_CONTACT=@votre_username

# Redémarrer l'application
pm2 restart rsliv-app
```

### 2. Changer le mot de passe admin

Par défaut: `admin` / `admin123`

```bash
# Se connecter à la base de données
sqlite3 /var/www/rsliv/data/app.db

# Générer un nouveau hash de mot de passe
# (utiliser bcrypt en ligne ou Node.js)

# Mettre à jour le mot de passe
UPDATE admin_users SET password_hash = 'nouveau_hash_bcrypt' WHERE username = 'admin';
.quit

# OU créer un nouvel admin via l'API (recommandé)
```

### 3. Vérifier les permissions

```bash
# S'assurer que les répertoires sont accessibles
sudo chown -R $USER:www-data /var/www/rsliv/uploads
sudo chown -R $USER:www-data /var/www/rsliv/data
sudo chmod -R 775 /var/www/rsliv/uploads
sudo chmod -R 775 /var/www/rsliv/data
```

---

## 🧪 Tests de Fonctionnement

### 1. Vérifier le Backend

```bash
# Status PM2
pm2 status

# Logs en temps réel
pm2 logs rsliv-app

# Tester l'API santé
curl http://localhost:3000/api/health
# Devrait retourner: {"status":"OK"}

# Tester les produits
curl http://localhost:3000/api/products
```

### 2. Vérifier Nginx

```bash
# Status Nginx
sudo systemctl status nginx

# Tester la configuration
sudo nginx -t

# Recharger si besoin
sudo systemctl reload nginx
```

### 3. Vérifier le Frontend

```bash
# Accéder via navigateur
https://votre-domaine.com

# Vérifier l'interface admin
https://votre-domaine.com/admin
```

---

## 🔄 Comment ça Fonctionne

### Architecture de Communication

```
┌─────────────────────────────────────────────────────────┐
│                      UTILISATEUR                        │
└─────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────┐
│                  NGINX (Port 80/443)                    │
│  - Sert les fichiers statiques (dist/)                 │
│  - Proxy /api → Backend                                 │
│  - Sert /uploads → Médias                               │
└─────────────────────────────────────────────────────────┘
            │                    │                    │
            ▼                    ▼                    ▼
┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐
│  Frontend React  │  │  Backend Node.js │  │  Uploads         │
│  (dist/)         │  │  (Port 3000)     │  │  (images/vidéos) │
└──────────────────┘  └──────────────────┘  └──────────────────┘
                               │
                               ▼
                    ┌──────────────────┐
                    │  SQLite Database │
                    │  (app.db)        │
                    └──────────────────┘
```

### Flux de Données

#### 1. **Page d'Accueil (Interface Utilisateur)**

```
1. Navigateur charge https://votre-domaine.com
2. Nginx sert index.html depuis /var/www/rsliv/dist/
3. React démarre et appelle GET /api/products
4. Nginx proxifie vers http://localhost:3000/api/products
5. Backend lit database.sqlite et retourne JSON
6. Frontend affiche les produits
```

#### 2. **Interface Admin - Ajout de Produit**

```
1. Admin se connecte à https://votre-domaine.com/admin
2. POST /api/auth/login → Backend vérifie credentials
3. Backend retourne un JWT token
4. Admin remplit le formulaire et upload une image
5. POST /api/products avec FormData (image + données)
6. Backend:
   - Sauvegarde l'image dans /var/www/rsliv/uploads/
   - Insère le produit dans database.sqlite
   - Retourne succès
7. Admin Dashboard recharge la liste des produits
```

#### 3. **Synchronisation Admin ↔ Interface Utilisateur**

```
┌──────────────────┐                    ┌──────────────────┐
│  Interface Admin │                    │ Interface Client │
└────────┬─────────┘                    └────────┬─────────┘
         │                                       │
         │ POST /api/products                    │
         │ (ajouter produit)                     │
         ▼                                       │
┌─────────────────────────────────────────────────────────┐
│            Backend API + Database SQLite                │
│  - Insère dans table products                           │
│  - Retourne succès                                      │
└─────────────────────────────────────────────────────────┘
         │                                       │
         │                                       │ GET /api/products
         │                                       │ (charger produits)
         │                                       ▼
         │                              ┌─────────────────┐
         │                              │ Produits à jour │
         │                              │ affichés        │
         └──────────────────────────────┴─────────────────┘

La base de données SQLite est la source unique de vérité.
Quand l'admin ajoute un produit, il est immédiatement 
disponible pour l'interface utilisateur via l'API.
```

---

## 📝 Variables d'Environnement Importantes

### Backend (.env)

```bash
# Serveur
NODE_ENV=production
PORT=3000
APP_BASE_URL=https://votre-domaine.com

# Base de données
DB_PATH=/var/www/rsliv/data/app.db

# Uploads
UPLOAD_DIR=/var/www/rsliv/uploads

# Sécurité
JWT_SECRET=VOTRE_SECRET_ALEATOIRE_TRES_LONG

# Telegram (optionnel)
TELEGRAM_BOT_TOKEN=votre_token
TELEGRAM_ADMIN_CONTACT=@votre_username
```

### Frontend (Build Time)

Le frontend utilise `VITE_API_URL` défini dans `.env`:

```bash
VITE_API_URL=/api
```

Cette variable indique au frontend d'envoyer toutes les requêtes à `/api/*`, qui sont ensuite proxifiées par Nginx vers le backend.

---

## 🔄 Mise à Jour de l'Application

```bash
# 1. Sauvegarder la base de données
cp /var/www/rsliv/data/app.db /var/www/rsliv/data/app.db.backup

# 2. Uploader le nouveau code
scp nouveau-code.tar.gz user@votre-vps:/tmp/

# 3. Extraire
cd /var/www/rsliv
tar -xzf /tmp/nouveau-code.tar.gz

# 4. Installer nouvelles dépendances
npm ci --production=false

# 5. Rebuilder le frontend
npm run build

# 6. Redémarrer le backend
pm2 restart rsliv-app

# 7. Recharger Nginx
sudo systemctl reload nginx
```

---

## 🐛 Dépannage

### Le backend ne démarre pas

```bash
# Vérifier les logs
pm2 logs rsliv-app

# Vérifier le port
netstat -tulpn | grep 3000

# Redémarrer
pm2 restart rsliv-app
```

### Les images ne s'affichent pas

```bash
# Vérifier les permissions
ls -la /var/www/rsliv/uploads

# Devrait être accessible par www-data
sudo chown -R $USER:www-data /var/www/rsliv/uploads
sudo chmod -R 775 /var/www/rsliv/uploads

# Vérifier la config Nginx
sudo nginx -t
```

### L'admin ne peut pas se connecter

```bash
# Vérifier que le JWT_SECRET est défini
grep JWT_SECRET /var/www/rsliv/.env

# Vérifier les logs API
pm2 logs rsliv-app | grep auth

# Tester l'endpoint
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'
```

### Les produits n'apparaissent pas sur la page d'accueil

```bash
# 1. Vérifier que les produits existent
sqlite3 /var/www/rsliv/data/app.db "SELECT * FROM products;"

# 2. Tester l'API
curl http://localhost:3000/api/products

# 3. Vérifier les logs frontend dans le navigateur (F12)
# Regarder les requêtes réseau et la console

# 4. Vider le cache du navigateur (Ctrl+Shift+R)
```

---

## 🔒 Sécurité

### Checklist de Sécurité

- [ ] JWT_SECRET changé (différent de l'exemple)
- [ ] Mot de passe admin changé
- [ ] SSL activé (HTTPS)
- [ ] Firewall configuré (ufw)
- [ ] Base de données non accessible publiquement
- [ ] CORS configuré correctement
- [ ] Rate limiting activé (optionnel)
- [ ] Backups automatiques configurés

### Configuration du Firewall

```bash
# Activer UFW
sudo ufw enable

# Autoriser SSH
sudo ufw allow 22/tcp

# Autoriser HTTP et HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Vérifier le status
sudo ufw status
```

---

## 📊 Monitoring

### Logs

```bash
# Logs application
pm2 logs rsliv-app

# Logs Nginx accès
sudo tail -f /var/log/nginx/access.log

# Logs Nginx erreurs
sudo tail -f /var/log/nginx/error.log

# Logs système
sudo journalctl -u nginx -f
```

### Performance

```bash
# Ressources PM2
pm2 monit

# Espace disque
df -h

# Utilisation mémoire
free -h
```

---

## 🎯 Commandes Utiles

```bash
# PM2
pm2 start ecosystem.config.cjs  # Démarrer
pm2 stop rsliv-app              # Arrêter
pm2 restart rsliv-app           # Redémarrer
pm2 logs rsliv-app              # Logs
pm2 monit                       # Monitoring

# Nginx
sudo systemctl start nginx      # Démarrer
sudo systemctl stop nginx       # Arrêter
sudo systemctl reload nginx     # Recharger config
sudo nginx -t                   # Tester config

# Database
sqlite3 /var/www/rsliv/data/app.db  # Ouvrir
.tables                         # Lister tables
.schema products                # Voir structure
SELECT * FROM products;         # Lister produits
```

---

## ✅ Résumé du Déploiement

1. ✅ Uploader le code sur le VPS
2. ✅ Exécuter `./deploy.sh votre-domaine.com votre-email@example.com`
3. ✅ Configurer le bot Telegram dans `.env`
4. ✅ Changer le mot de passe admin
5. ✅ Tester l'interface utilisateur sur `https://votre-domaine.com`
6. ✅ Tester l'interface admin sur `https://votre-domaine.com/admin`
7. ✅ Ajouter un produit dans l'admin
8. ✅ Vérifier qu'il apparaît sur la page d'accueil
9. ✅ Configurer les backups automatiques

**C'est tout ! Votre application est déployée. 🎉**

---

## 📞 Support

En cas de problème:
1. Consulter les logs: `pm2 logs rsliv-app`
2. Vérifier la checklist de dépannage ci-dessus
3. Vérifier que toutes les permissions sont correctes
4. S'assurer que le domaine pointe bien vers le VPS
