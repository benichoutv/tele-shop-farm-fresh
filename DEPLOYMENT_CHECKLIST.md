# RSLiv - Deployment Checklist & Verification

## 🚀 Quick Deployment

```bash
# 1. Clone/upload your code to /var/www/rsliv
sudo mkdir -p /var/www/rsliv
cd /var/www/rsliv

# 2. Run automated deployment
sudo chmod +x deploy.sh
sudo ./deploy.sh your-domain.com your-email@example.com

# 3. Edit environment variables
sudo nano /var/www/rsliv/.env
# Set TELEGRAM_BOT_TOKEN and TELEGRAM_ADMIN_CONTACT

# 4. Restart application
pm2 restart rsliv-app
```

## ✅ Post-Deployment Verification

### 1. Check Backend Health

```bash
# API health check
curl http://localhost:3000/api/health
# Expected: {"status":"ok","timestamp":"2025-10-07T..."}

# PM2 status
pm2 status
# Expected: rsliv-app should be "online"

# Check logs for errors
pm2 logs rsliv-app --lines 50
```

### 2. Verify Database

```bash
# Check database file exists
ls -lh /var/www/rsliv/data/app.db

# Connect to SQLite and verify schema
sqlite3 /var/www/rsliv/data/app.db "SELECT name FROM sqlite_master WHERE type='table';"
# Expected: categories, products, product_prices, orders, order_items, settings, admin_users
```

### 3. Test API Endpoints

```bash
# Get all products
curl http://localhost:3000/api/products
# Expected: [] (empty array if no products) or array of products

# Get all categories
curl http://localhost:3000/api/categories
# Expected: [] or array of categories

# Get settings
curl http://localhost:3000/api/settings
# Expected: {"welcome_message":"...","telegram_contact":"..."}

# Test admin login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'
# Expected: {"token":"...","username":"admin"}
```

### 4. Check File Uploads Directory

```bash
# Verify uploads directory is accessible
ls -la /var/www/rsliv/uploads

# Check permissions (should be 755)
stat /var/www/rsliv/uploads
```

### 5. Verify Nginx Configuration

```bash
# Test Nginx config
sudo nginx -t
# Expected: test is successful

# Check if site is enabled
ls -l /etc/nginx/sites-enabled/rsliv

# Reload Nginx
sudo systemctl reload nginx

# Check Nginx status
sudo systemctl status nginx
```

### 6. Test Frontend Access

```bash
# Test homepage (should return HTML)
curl -I http://localhost/
# Expected: HTTP/1.1 200 OK

# Test admin page
curl -I http://localhost/admin/login
# Expected: HTTP/1.1 200 OK

# If using domain with SSL
curl -I https://your-domain.com/
# Expected: HTTP/2 200
```

## 🔧 Common Issues & Solutions

### Issue: "no such column: p.category_id"

**Solution:** Database schema is outdated. Recreate database:

```bash
cd /var/www/rsliv
# Backup current database
cp data/app.db data/app.db.backup
# Remove old database
rm data/app.db
# Restart (will recreate with correct schema)
pm2 restart rsliv-app
```

### Issue: Products not showing on frontend

**Check:**
1. API returns data: `curl http://localhost:3000/api/products`
2. Frontend API URL is correct in `.env`: `VITE_API_URL=/api`
3. Rebuild frontend: `npm run build && pm2 restart rsliv-app`

### Issue: Images not loading

**Check:**
1. Uploads directory exists: `ls /var/www/rsliv/uploads`
2. Nginx serves uploads: `curl http://localhost/uploads/` (should not 404)
3. File permissions: `chmod -R 755 /var/www/rsliv/uploads`

### Issue: Cannot login to admin

**Check:**
1. API auth endpoint works: `curl -X POST http://localhost:3000/api/auth/login -H "Content-Type: application/json" -d '{"username":"admin","password":"admin123"}'`
2. JWT_SECRET is set in `.env`
3. Check browser console for errors

### Issue: PM2 app not starting

```bash
# View detailed logs
pm2 logs rsliv-app

# Check for port conflicts
lsof -i :3000

# Restart with verbose output
pm2 restart rsliv-app --update-env
```

### Issue: Nginx 502 Bad Gateway

**Check:**
1. Backend is running: `pm2 status`
2. Port 3000 is accessible: `curl http://localhost:3000/api/health`
3. Nginx config is correct: `sudo nginx -t`
4. Check Nginx error logs: `sudo tail -f /var/log/nginx/error.log`

## 🔐 Security Checklist

- [ ] Changed JWT_SECRET in `.env` (use strong random string)
- [ ] Changed admin password from default `admin123`
- [ ] Configured Telegram bot token
- [ ] SSL certificate installed (Let's Encrypt)
- [ ] Firewall configured (UFW recommended):
  ```bash
  sudo ufw allow 22/tcp   # SSH
  sudo ufw allow 80/tcp   # HTTP
  sudo ufw allow 443/tcp  # HTTPS
  sudo ufw enable
  ```
- [ ] Database file permissions are secure (600):
  ```bash
  chmod 600 /var/www/rsliv/data/app.db
  ```

## 📊 Monitoring

### View Real-time Logs
```bash
# All logs
pm2 logs rsliv-app

# Only errors
pm2 logs rsliv-app --err

# Follow logs
pm2 logs rsliv-app --lines 100 -f
```

### Monitor Resources
```bash
# PM2 monitoring dashboard
pm2 monit

# System resources
htop
```

### Database Size
```bash
# Check database size
du -h /var/www/rsliv/data/app.db

# Check uploads size
du -sh /var/www/rsliv/uploads
```

## 🔄 Update/Redeploy

```bash
cd /var/www/rsliv

# Pull latest code
git pull origin main

# Install dependencies
npm ci

# Rebuild frontend
npm run build

# Restart backend
pm2 restart rsliv-app

# Reload Nginx (if config changed)
sudo nginx -t && sudo systemctl reload nginx
```

## 📱 Testing End-to-End Flow

1. **Create a category** (via admin or API):
   ```bash
   # Get auth token first
   TOKEN=$(curl -s -X POST http://localhost:3000/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{"username":"admin","password":"admin123"}' | jq -r .token)
   
   # Create category
   curl -X POST http://localhost:3000/api/categories \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer $TOKEN" \
     -d '{"name":"Weed"}'
   ```

2. **Create a product** via admin dashboard or API

3. **View on homepage** - refresh frontend and verify product appears

4. **Add to cart** and place test order

5. **Check order** in admin dashboard

6. **Verify Telegram notification** (if configured)

## 🆘 Emergency Rollback

If deployment fails:

```bash
# Stop current version
pm2 stop rsliv-app

# Restore database backup
cp /var/www/rsliv/data/app.db.backup /var/www/rsliv/data/app.db

# Restore previous code (if using git)
git reset --hard HEAD~1

# Rebuild
npm run build

# Restart
pm2 restart rsliv-app
```

## 📞 Support

For issues:
1. Check PM2 logs: `pm2 logs rsliv-app`
2. Check Nginx logs: `sudo tail -f /var/log/nginx/error.log`
3. Verify all steps in this checklist
4. Review `DEPLOY_VPS.md` for architecture details

---

**Last updated:** 2025-10-07
