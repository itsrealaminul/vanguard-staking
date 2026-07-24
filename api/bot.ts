import TelegramBot from 'node-telegram-bot-api';

const BOT_TOKEN = process.env.BOT_TOKEN || '';
const APP_URL = process.env.APP_URL || 'https://vanguard-staking.vercel.app';
const CHANNEL_ID = process.env.CHANNEL_ID || '';

// Banner image URL (use the Vanguard Staking banner)
const BANNER_URL = 'https://raw.githubusercontent.com/itsrealaminul/vanguard-staking/main/public/banner.png';

export function startBot() {
  if (!BOT_TOKEN) {
    console.log('BOT_TOKEN not set, skipping bot startup');
    return;
  }

  const bot = new TelegramBot(BOT_TOKEN, { polling: true });

  // /start command with banner image
  bot.onText(/\/start(.*)/, async (msg, match) => {
    const chatId = msg.chat.id;
    const firstName = msg.from?.first_name || 'User';
    const referralCode = match?.[1]?.trim();

    const welcomeCaption = `⚔️ Welcome to Vanguard Staking, ${firstName}!

💰 Stake your USDT and earn up to 3% daily rewards.
🔒 Secure • ⚡ Fast • 🌍 Trusted by 5,000+ users

Tap below to start your staking journey!`;

    const keyboard = {
      inline_keyboard: [
        [
          {
            text: '🚀 Open Vanguard Staking',
            web_app: { url: APP_URL },
          },
        ],
        [
          {
            text: '📊 Join Channel',
            url: CHANNEL_ID ? `https://t.me/${CHANNEL_ID}` : 'https://t.me/vanguardstakingbot',
          },
        ],
        [
          {
            text: '👥 Invite Friends & Earn 40%',
            callback_data: 'referral',
          },
        ],
      ],
    };

    try {
      // Send banner image with welcome message
      await bot.sendPhoto(chatId, BANNER_URL, {
        caption: welcomeCaption,
        reply_markup: keyboard,
        parse_mode: 'HTML',
      });
    } catch (err) {
      // Fallback: send text only if image fails
      console.error('Banner send failed, sending text:', err);
      await bot.sendMessage(chatId, welcomeCaption, {
        reply_markup: keyboard,
        parse_mode: 'HTML',
      });
    }
  });

  // Handle referral callback
  bot.on('callback_query', async (query) => {
    if (query.data === 'referral' && query.message) {
      const chatId = query.message.chat.id;
      const userId = query.from.id;

      await bot.sendMessage(
        chatId,
        `👥 Your Referral Link:\n\nhttps://t.me/vanguardstakingbot?start=${userId}\n\nShare this link with friends. You earn 1 USDT for each referral + 40% affiliate commissions!`,
        {
          reply_markup: {
            inline_keyboard: [
              [
                {
                  text: '📋 Copy Link',
                  switch_inline_query: `https://t.me/vanguardstakingbot?start=${userId}`,
                },
              ],
              [
                {
                  text: '🔙 Back to Menu',
                  callback_data: 'back_menu',
                },
              ],
            ],
          },
        }
      );
    }

    if (query.data === 'back_menu' && query.message) {
      const chatId = query.message.chat.id;
      const firstName = query.from.first_name || 'User';

      const keyboard = {
        inline_keyboard: [
          [{ text: '🚀 Open Vanguard Staking', web_app: { url: APP_URL } }],
          [{ text: '📊 Join Channel', url: CHANNEL_ID ? `https://t.me/${CHANNEL_ID}` : 'https://t.me/vanguardstakingbot' }],
          [{ text: '👥 Invite Friends & Earn 40%', callback_data: 'referral' }],
        ],
      };

      try {
        await bot.sendPhoto(chatId, BANNER_URL, {
          caption: `⚔️ Welcome back, ${firstName}!\n\n💰 Stake • Earn • Grow\n\nTap below to continue staking!`,
          reply_markup: keyboard,
        });
      } catch {
        await bot.sendMessage(
          chatId,
          `⚔️ Welcome back, ${firstName}!\n\n💰 Stake • Earn • Grow`,
          { reply_markup: keyboard }
        );
      }
    }
  });

  // /help command
  bot.onText(/\/help/, async (msg) => {
    const chatId = msg.chat.id;
    await bot.sendMessage(
      chatId,
      `📖 <b>Vanguard Staking Commands</b>\n\n` +
        `/start — Start the bot & see welcome\n` +
        `/stake — Open staking app\n` +
        `/referral — Get your referral link\n` +
        `/help — Show this help message\n\n` +
        `💰 Stake your USDT and earn daily rewards!\n` +
        `👥 40% Affiliate Commissions`,
      { parse_mode: 'HTML' }
    );
  });

  // /stake command
  bot.onText(/\/stake/, async (msg) => {
    const chatId = msg.chat.id;
    await bot.sendMessage(chatId, '💰 Open Vanguard Staking to start earning:', {
      reply_markup: {
        inline_keyboard: [[{ text: '🚀 Open Staking App', web_app: { url: APP_URL } }]],
      },
    });
  });

  // /referral command
  bot.onText(/\/referral/, async (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from?.id;
    await bot.sendMessage(
      chatId,
      `👥 <b>Your Referral Link</b>\n\nhttps://t.me/vanguardstakingbot?start=${userId}\n\n` +
        `💰 Earn 1 USDT per referral\n` +
        `📊 Earn 40% affiliate commissions\n\n` +
        `Share this link with friends!`,
      { parse_mode: 'HTML' }
    );
  });

  console.log('🤖 Vanguard Staking Bot started!');
}
