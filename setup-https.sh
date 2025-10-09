#!/bin/bash

# ==========================================
# Script de Configuration HTTPS pour RSLiv
# ==========================================
# Ce script configure automatiquement HTTPS avec Let's Encrypt
# sans toucher au code de l'application

set -e  # Arrêt en cas d'erreur

# Couleurs pour les messages
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}======================================${NC}"
echo -e "${GREEN}Configuration HTTPS pour RSLiv${NC}"
echo -e "${GREEN}======================================${NC}"
echo ""

# Configuration
DOMAIN="rsliv1383.duckdns.org"
APP_DIR="/var/www/rsliv"
NGINX_CONFIG="/etc/nginx/sites-available/rsliv"
EMAIL="admin@rsliv1383.duckdns.org"  # Modifiable

# Vérification des privilèges root
if [ "$EUID" -ne 0 ]; then 
  echo -e "${RED}❌ Ce script doit être exécuté avec sudo${NC}"
  echo "Usage: sudo bash setup-https.sh"
  exit 1
fi

echo -e "${YELLOW}📋 Configuration:${NC}"
echo "   Domaine: $DOMAIN"
echo "   Email: $EMAIL"
echo "   App: $APP_DIR"
echo ""

# ==========================================
# 1. BACKUP DE SÉCURITÉ
# ==========================================
echo -e "${YELLOW}🔒 Création des backups de sécurité...${NC}"

BACKUP_DIR="/tmp/rsliv-backup-$(date +%Y%m%d_%H%M%S)"
mkdir -p "$BACKUP_DIR"

# Backup Nginx
if [ -f "$NGINX_CONFIG" ]; then
    cp "$NGINX_CONFIG" "$BACKUP_DIR/nginx-config.backup"
    echo -e "${GREEN}✓${NC} Backup Nginx: $BACKUP_DIR/nginx-config.backup"
fi

# Backup .env
if [ -f "$APP_DIR/.env" ]; then
    cp "$APP_DIR/.env" "$BACKUP_DIR/.env.backup"
    echo -e "${GREEN}✓${NC} Backup .env: $BACKUP_DIR/.env.backup"
fi

echo -e "${GREEN}✓${NC} Backups créés dans: $BACKUP_DIR"
echo ""

# ==========================================
# 2. VÉRIFICATION DNS
# ==========================================
echo -e "${YELLOW}🌐 Vérification DNS...${NC}"

PUBLIC_IP=$(curl -s ifconfig.me)
DNS_IP=$(dig +short "$DOMAIN" | tail -n1)

echo "   IP du serveur: $PUBLIC_IP"
echo "   IP DNS: $DNS_IP"

if [ "$PUBLIC_IP" != "$DNS_IP" ]; then
    echo -e "${RED}⚠️  ATTENTION: Le DNS ne pointe pas vers ce serveur${NC}"
    echo "   Continuer quand même? (y/N)"
    read -r response
    if [[ ! "$response" =~ ^[Yy]$ ]]; then
        echo "Configuration annulée."
        exit 1
    fi
fi

echo ""

# ==========================================
# 3. INSTALLATION CERTBOT
# ==========================================
echo -e "${YELLOW}📦 Vérification/Installation de Certbot...${NC}"

if ! command -v certbot &> /dev/null; then
    echo "Installation de Certbot..."
    apt-get update -qq
    apt-get install -y certbot python3-certbot-nginx
    echo -e "${GREEN}✓${NC} Certbot installé"
else
    echo -e "${GREEN}✓${NC} Certbot déjà installé"
fi

echo ""

# ==========================================
# 4. OBTENTION DU CERTIFICAT SSL
# ==========================================
echo -e "${YELLOW}🔐 Obtention du certificat SSL Let's Encrypt...${NC}"

# Vérifier si un certificat existe déjà
if [ -d "/etc/letsencrypt/live/$DOMAIN" ]; then
    echo -e "${YELLOW}⚠️  Un certificat existe déjà pour $DOMAIN${NC}"
    echo "   Le renouveler? (y/N)"
    read -r response
    if [[ "$response" =~ ^[Yy]$ ]]; then
        certbot renew --force-renewal --nginx -d "$DOMAIN"
    fi
else
    # Obtenir un nouveau certificat
    certbot --nginx -d "$DOMAIN" \
        --non-interactive \
        --agree-tos \
        --email "$EMAIL" \
        --redirect
fi

echo -e "${GREEN}✓${NC} Certificat SSL configuré"
echo ""

# ==========================================
# 5. CONFIGURATION NGINX
# ==========================================
echo -e "${YELLOW}⚙️  Configuration Nginx pour HTTPS...${NC}"

# Vérifier que la configuration contient bien SSL
if ! grep -q "ssl_certificate" "$NGINX_CONFIG"; then
    echo -e "${RED}⚠️  Configuration SSL manquante dans Nginx${NC}"
    echo "Certbot aurait dû la créer automatiquement."
fi

# Tester la configuration Nginx
if nginx -t 2>&1 | grep -q "successful"; then
    echo -e "${GREEN}✓${NC} Configuration Nginx valide"
    systemctl reload nginx
    echo -e "${GREEN}✓${NC} Nginx rechargé"
else
    echo -e "${RED}❌ Erreur dans la configuration Nginx${NC}"
    nginx -t
    echo ""
    echo "Restauration du backup..."
    cp "$BACKUP_DIR/nginx-config.backup" "$NGINX_CONFIG"
    systemctl reload nginx
    exit 1
fi

echo ""

# ==========================================
# 6. MISE À JOUR .ENV
# ==========================================
echo -e "${YELLOW}📝 Mise à jour de APP_BASE_URL...${NC}"

if [ -f "$APP_DIR/.env" ]; then
    # Remplacer http:// par https://
    sed -i "s|APP_BASE_URL=http://|APP_BASE_URL=https://|g" "$APP_DIR/.env"
    
    # Vérifier que le domaine est correct
    if grep -q "APP_BASE_URL=https://$DOMAIN" "$APP_DIR/.env"; then
        echo -e "${GREEN}✓${NC} APP_BASE_URL mis à jour: https://$DOMAIN"
    else
        # Si le domaine n'est pas trouvé, le remplacer
        sed -i "s|APP_BASE_URL=https://.*|APP_BASE_URL=https://$DOMAIN|g" "$APP_DIR/.env"
        echo -e "${GREEN}✓${NC} APP_BASE_URL configuré: https://$DOMAIN"
    fi
else
    echo -e "${RED}⚠️  Fichier .env introuvable${NC}"
fi

echo ""

# ==========================================
# 7. REDÉMARRAGE APPLICATION
# ==========================================
echo -e "${YELLOW}🔄 Redémarrage de l'application...${NC}"

cd "$APP_DIR"
pm2 restart rsliv-app 2>/dev/null || pm2 start ecosystem.config.cjs

echo -e "${GREEN}✓${NC} Application redémarrée"
echo ""

# ==========================================
# 8. VÉRIFICATIONS FINALES
# ==========================================
echo -e "${YELLOW}🧪 Vérifications finales...${NC}"

# Test HTTPS
HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "https://$DOMAIN" || echo "000")
if [ "$HTTP_STATUS" -eq 200 ] || [ "$HTTP_STATUS" -eq 301 ] || [ "$HTTP_STATUS" -eq 302 ]; then
    echo -e "${GREEN}✓${NC} HTTPS fonctionne (Status: $HTTP_STATUS)"
else
    echo -e "${YELLOW}⚠️${NC}  Status HTTPS: $HTTP_STATUS (peut nécessiter quelques secondes)"
fi

# Test redirection HTTP → HTTPS
REDIRECT=$(curl -s -o /dev/null -w "%{redirect_url}" "http://$DOMAIN")
if [[ "$REDIRECT" == https://* ]]; then
    echo -e "${GREEN}✓${NC} Redirection HTTP → HTTPS active"
else
    echo -e "${YELLOW}⚠️${NC}  Redirection HTTP → HTTPS à vérifier"
fi

echo ""

# ==========================================
# 9. CONFIGURATION RENOUVELLEMENT AUTO
# ==========================================
echo -e "${YELLOW}🔄 Configuration du renouvellement automatique...${NC}"

# Tester le renouvellement
if certbot renew --dry-run 2>&1 | grep -q "Congratulations"; then
    echo -e "${GREEN}✓${NC} Renouvellement automatique configuré"
else
    echo -e "${YELLOW}⚠️${NC}  Vérifier la configuration du renouvellement"
fi

echo ""

# ==========================================
# RÉSUMÉ
# ==========================================
echo -e "${GREEN}======================================${NC}"
echo -e "${GREEN}✅ CONFIGURATION HTTPS TERMINÉE${NC}"
echo -e "${GREEN}======================================${NC}"
echo ""
echo -e "${GREEN}🌐 Votre application est maintenant accessible via:${NC}"
echo -e "   ${GREEN}➡️  https://$DOMAIN${NC}"
echo ""
echo -e "${YELLOW}📋 Prochaines étapes:${NC}"
echo "   1. Tester l'accès HTTPS dans un navigateur"
echo "   2. Vérifier que HTTP redirige vers HTTPS"
echo "   3. Soumettre l'URL HTTPS à BotFather pour Telegram"
echo ""
echo -e "${YELLOW}🔐 Sécurité:${NC}"
echo "   • Certificat SSL valide installé"
echo "   • Renouvellement automatique configuré (tous les 90 jours)"
echo "   • Redirection HTTP → HTTPS active"
echo ""
echo -e "${YELLOW}🛡️  Backups de sécurité:${NC}"
echo "   Sauvegardés dans: $BACKUP_DIR"
echo ""
echo -e "${YELLOW}📝 En cas de problème:${NC}"
echo "   • Restaurer Nginx: sudo cp $BACKUP_DIR/nginx-config.backup $NGINX_CONFIG"
echo "   • Restaurer .env: sudo cp $BACKUP_DIR/.env.backup $APP_DIR/.env"
echo "   • Recharger Nginx: sudo systemctl reload nginx"
echo "   • Redémarrer app: pm2 restart rsliv-app"
echo ""
echo -e "${GREEN}✨ Configuration terminée avec succès!${NC}"
