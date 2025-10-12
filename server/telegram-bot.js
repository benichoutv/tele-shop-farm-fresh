import 'dotenv/config';
import TelegramBot from 'node-telegram-bot-api';

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

// Répondre à la commande /start
bot.onText(/\/start/, async (msg) => {
  const chatId = msg.chat.id;
  const firstName = msg.from.first_name || '';
  
  try {
    await bot.sendMessage(
      chatId,
      `👋 Bonjour ${firstName} ! Bienvenue sur le bot officiel RSliv 🔥🍓\n\n📱 Ici, tu trouveras toutes nos infos, Livraison, actus et offres spéciales.\n\n⏰ Utilise /start pour afficher notre menu et passer commande facilement.\n\n🏠 Merci de faire confiance à RsLiv — Service rapide, discret & sécurisé.`,
      {
        reply_markup: {
          inline_keyboard: [[
            {
              text: '🛒 Ouvrir RSliv',
              web_app: { url: appUrl }
            }
          ]]
        }
      }
    );
    console.log(`✅ Commande /start envoyée à ${msg.from.username || chatId}`);
  } catch (error) {
    console.error('❌ Erreur lors de l\'envoi du message /start:', error);
  }
});

// Répondre aux messages texte (autres que /start)
bot.on('message', async (msg) => {
  // Ignorer les commandes (déjà gérées par onText)
  if (msg.text && msg.text.startsWith('/')) return;
  
  // Ignorer les médias
  if (!msg.text) return;
  
  const chatId = msg.chat.id;
  
  try {
    await bot.sendMessage(chatId, '💡 Utilise /start pour afficher notre menu et passer commande facilement.');
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
