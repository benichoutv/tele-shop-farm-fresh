import TelegramBot from 'node-telegram-bot-api';

let bot = null;

function getBot() {
  if (!bot && process.env.TELEGRAM_BOT_TOKEN) {
    bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, { polling: false });
  }
  return bot;
}

export async function sendOrderNotification(orderData) {
  try {
    const telegramBot = getBot();
    const adminContact = process.env.TELEGRAM_ADMIN_CONTACT;
    
    if (!telegramBot || !adminContact) {
      console.warn('Telegram bot not configured, skipping notification');
      return;
    }
    
    const { orderId, customer_name, customer_phone, customer_address, telegram_username, items, total } = orderData;
    
    let message = `🛒 *Nouvelle Commande #${orderId}*\n\n`;
    message += `👤 *Client:* ${customer_name}\n`;
    message += `📱 *Téléphone:* ${customer_phone}\n`;
    message += `📍 *Adresse:* ${customer_address}\n`;
    if (telegram_username) {
      message += `💬 *Telegram:* ${telegram_username}\n`;
    }
    message += `\n*Produits:*\n`;
    
    items.forEach((item, index) => {
      message += `${index + 1}. ${item.product_name} - ${item.weight} (x${item.quantity}) - ${item.price}€\n`;
    });
    
    message += `\n💰 *Total:* ${total}€`;
    
    await telegramBot.sendMessage(adminContact, message, { parse_mode: 'Markdown' });
    console.log('Order notification sent successfully');
  } catch (error) {
    console.error('Error sending Telegram notification:', error);
  }
}
