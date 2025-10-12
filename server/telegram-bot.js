import 'dotenv/config';
import TelegramBot from 'node-telegram-bot-api';
import { getDb } from './db/connection.js';

const token = process.env.TELEGRAM_BOT_TOKEN;
const appUrl = process.env.APP_BASE_URL;

if (!token) {
  console.error('❌ TELEGRAM_BOT_TOKEN manquant dans .env');
  process.exit(1);
}

if (!appUrl) {
  console.error('❌ APP_BASE_URL manquant dans .env');
  process.exit(1);
}

// Créer le bot en mode polling (écoute active)
const bot = new TelegramBot(token, { polling: true });

console.log('✅ Bot RS-Liv démarré avec succès');
console.log(`📱 URL de la mini-app : ${appUrl}`);

// Vérification de l'admin
const ADMIN_ID = parseInt(process.env.TELEGRAM_ADMIN_ID) || 0;

function isAdmin(userId) {
  if (ADMIN_ID === 0) {
    console.warn('⚠️ TELEGRAM_ADMIN_ID non configuré dans .env');
    return false;
  }
  return userId === ADMIN_ID;
}

// Répondre à la commande /start
bot.onText(/\/start/, async (msg) => {
  const chatId = msg.chat.id;
  const firstName = msg.from.first_name || '';
  
  try {
    // Récupérer les boutons personnalisés depuis la base de données
    const db = await getDb();
    const buttons = await db.all('SELECT * FROM bot_buttons ORDER BY position ASC');
    
    // Construire le clavier inline
    const keyboard = [
      // Première ligne : bouton principal (web_app)
      [{ text: '🛒 Ouvrir RSliv', web_app: { url: appUrl } }]
    ];
    
    // Ajouter les boutons personnalisés (1 par ligne)
    buttons.forEach(btn => {
      keyboard.push([{
        text: `${btn.emoji} ${btn.name}`,
        url: btn.url
      }]);
    });
    
    await bot.sendMessage(
      chatId,
      `👋 Bonjour ${firstName} ! Bienvenue sur le bot officiel RSliv 🔥🍓\n\n📱 Ici, tu trouveras toutes nos infos, Livraison, actus et offres spéciales.\n\n⏰ Utilise /start pour afficher notre menu et passer commande facilement.\n\n🏠 Merci de faire confiance à RsLiv — Service rapide, discret & sécurisé.`,
      {
        reply_markup: { inline_keyboard: keyboard }
      }
    );
    console.log(`✅ Commande /start envoyée à ${msg.from.username || chatId}`);
  } catch (error) {
    console.error('❌ Erreur lors de l\'envoi du message /start:', error);
  }
});

// Commande /help
bot.onText(/\/help/, async (msg) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;
  
  if (!isAdmin(userId)) {
    await bot.sendMessage(chatId, '💡 Utilise /start pour accéder au menu RSliv.');
    return;
  }
  
  const helpMessage = `
🔧 *Commandes Admin RS-Liv Bot*

📋 *Gestion des boutons de contact :*

• \`/addbutton\` - Ajouter un nouveau bouton
  Format : Nom | Emoji | URL
  
• \`/listbuttons\` - Afficher tous les boutons configurés
  
• \`/removebutton ID\` - Supprimer un bouton par son ID
  
• \`/start\` - Aperçu du message utilisateur

*Exemple d'ajout :*
1️⃣ Envoie \`/addbutton\`
2️⃣ Réponds : \`WhatsApp Support | 💬 | https://wa.me/33612345678\`
3️⃣ Le bouton apparaît immédiatement dans /start
  `;
  
  await bot.sendMessage(chatId, helpMessage, { parse_mode: 'Markdown' });
});

// Commande /addbutton
bot.onText(/\/addbutton/, async (msg) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;
  
  if (!isAdmin(userId)) {
    await bot.sendMessage(chatId, '❌ Cette commande est réservée à l\'administrateur.');
    return;
  }
  
  await bot.sendMessage(
    chatId,
    '📝 Pour ajouter un bouton, réponds avec le format suivant :\n\n' +
    '`Nom | Emoji | URL`\n\n' +
    '*Exemple :*\n' +
    '`WhatsApp Support | 💬 | https://wa.me/33612345678`\n\n' +
    'Ou envoie "annuler" pour abandonner.',
    { parse_mode: 'Markdown' }
  );
  
  // Créer un listener temporaire pour la réponse
  const responseHandler = async (response) => {
    // Ignorer si c'est un autre utilisateur ou une commande
    if (response.from.id !== userId || !response.text) return;
    if (response.text.startsWith('/')) {
      bot.removeListener('message', responseHandler);
      return;
    }
    
    const text = response.text.trim();
    
    if (text.toLowerCase() === 'annuler') {
      await bot.sendMessage(chatId, '❌ Ajout de bouton annulé.');
      bot.removeListener('message', responseHandler);
      return;
    }
    
    const parts = text.split('|').map(s => s.trim());
    
    if (parts.length !== 3) {
      await bot.sendMessage(
        chatId, 
        '❌ Format invalide. Utilise : `Nom | Emoji | URL`\n\nOu envoie "annuler" pour abandonner.',
        { parse_mode: 'Markdown' }
      );
      return;
    }
    
    const [name, emoji, url] = parts;
    
    // Validation basique de l'URL
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      await bot.sendMessage(chatId, '❌ L\'URL doit commencer par http:// ou https://');
      return;
    }
    
    try {
      const db = await getDb();
      const maxPos = await db.get('SELECT MAX(position) as max FROM bot_buttons');
      const position = (maxPos?.max || 0) + 1;
      
      await db.run(
        'INSERT INTO bot_buttons (name, emoji, url, position) VALUES (?, ?, ?, ?)',
        [name, emoji, url, position]
      );
      
      await bot.sendMessage(chatId, `✅ Bouton "${emoji} ${name}" ajouté avec succès !\n\nUtilise /start pour voir le résultat.`);
      console.log(`✅ Bouton ajouté par admin ${userId}: ${emoji} ${name}`);
      
      // Nettoyer le listener
      bot.removeListener('message', responseHandler);
    } catch (error) {
      console.error('❌ Erreur ajout bouton:', error);
      await bot.sendMessage(chatId, '❌ Erreur lors de l\'ajout du bouton. Vérifie les logs.');
      bot.removeListener('message', responseHandler);
    }
  };
  
  bot.on('message', responseHandler);
  
  // Auto-nettoyage après 2 minutes
  setTimeout(() => {
    bot.removeListener('message', responseHandler);
  }, 120000);
});

// Commande /listbuttons
bot.onText(/\/listbuttons/, async (msg) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;
  
  if (!isAdmin(userId)) {
    await bot.sendMessage(chatId, '❌ Cette commande est réservée à l\'administrateur.');
    return;
  }
  
  try {
    const db = await getDb();
    const buttons = await db.all('SELECT * FROM bot_buttons ORDER BY position ASC');
    
    if (buttons.length === 0) {
      await bot.sendMessage(
        chatId, 
        '📋 Aucun bouton configuré pour le moment.\n\nUtilise /addbutton pour en ajouter un.'
      );
      return;
    }
    
    let message = `📋 *Boutons configurés (${buttons.length}) :*\n\n`;
    
    buttons.forEach((btn, index) => {
      message += `*${index + 1}️⃣ ${btn.emoji} ${btn.name}*\n`;
      message += `   URL: ${btn.url}\n`;
      message += `   ID: \`${btn.id}\`\n\n`;
    });
    
    message += '\n💡 Pour supprimer un bouton : `/removebutton ID`\n';
    message += 'Exemple : `/removebutton 1`';
    
    await bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
  } catch (error) {
    console.error('❌ Erreur listbuttons:', error);
    await bot.sendMessage(chatId, '❌ Erreur lors de la récupération des boutons.');
  }
});

// Commande /removebutton
bot.onText(/\/removebutton (.+)/, async (msg, match) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;
  
  if (!isAdmin(userId)) {
    await bot.sendMessage(chatId, '❌ Cette commande est réservée à l\'administrateur.');
    return;
  }
  
  const buttonId = parseInt(match[1]);
  
  if (isNaN(buttonId)) {
    await bot.sendMessage(
      chatId, 
      '❌ ID invalide. Utilise `/removebutton ID`\n\nExemple : `/removebutton 1`',
      { parse_mode: 'Markdown' }
    );
    return;
  }
  
  try {
    const db = await getDb();
    const button = await db.get('SELECT * FROM bot_buttons WHERE id = ?', [buttonId]);
    
    if (!button) {
      await bot.sendMessage(chatId, `❌ Aucun bouton trouvé avec l'ID ${buttonId}.\n\nUtilise /listbuttons pour voir les IDs disponibles.`);
      return;
    }
    
    await db.run('DELETE FROM bot_buttons WHERE id = ?', [buttonId]);
    await bot.sendMessage(
      chatId, 
      `✅ Bouton #${buttonId} "${button.emoji} ${button.name}" supprimé avec succès !\n\nUtilise /start pour voir le résultat.`
    );
    console.log(`✅ Bouton supprimé par admin ${userId}: ${button.emoji} ${button.name}`);
  } catch (error) {
    console.error('❌ Erreur removebutton:', error);
    await bot.sendMessage(chatId, '❌ Erreur lors de la suppression du bouton.');
  }
});

// Répondre aux messages texte (autres que commandes)
bot.on('message', async (msg) => {
  // Ignorer toutes les commandes (déjà gérées par onText)
  if (msg.text && msg.text.startsWith('/')) return;
  
  // Ignorer les médias
  if (!msg.text) return;
  
  const chatId = msg.chat.id;
  const userId = msg.from.id;
  
  try {
    // Message différent selon si c'est l'admin ou un utilisateur
    if (isAdmin(userId)) {
      await bot.sendMessage(chatId, '💡 Utilise /help pour voir les commandes admin.');
    } else {
      await bot.sendMessage(chatId, '💡 Utilise /start pour afficher notre menu et passer commande facilement.');
    }
    console.log(`ℹ️ Message d'aide envoyé à ${msg.from.username || chatId}`);
  } catch (error) {
    console.error('❌ Erreur lors de l\'envoi du message d\'aide:', error);
  }
});

// Gérer les erreurs de polling
bot.on('polling_error', (error) => {
  console.error('❌ Erreur de polling:', error.code, error.message);
});

// Arrêt propre du bot
process.on('SIGINT', () => {
  console.log('\n⏹️ Arrêt du bot...');
  bot.stopPolling();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n⏹️ Arrêt du bot...');
  bot.stopPolling();
  process.exit(0);
});
