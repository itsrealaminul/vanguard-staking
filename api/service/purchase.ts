import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.SUPABASE_URL || '', process.env.SUPABASE_ANON_KEY || '');
const BOT_TOKEN = proces…OKEN || '';
const CHANNEL_ID = process.env.CHANNEL_ID || '';
const ADMIN_ID = process.env.ADMIN_TELEGRAM_ID || '7010136281';
const APP_URL = process.env.APP_URL || '';

let bot: any = null;
try { const TB = (await import('node-telegram-bot-api')).default; if (BOT_TOKEN) bot = new TB(BOT_TOKEN, { polling: false }); } catch {}

const PRICES: Record<string, number> = {
  tokenScanner: 0.5, portfolio: 5, whale: 10, airdrop: 3, tax: 15, expert: 25,
};

const SERVICE_NAMES: Record<string, string> = {
  tokenScanner: '🔍 Token Scanner', portfolio: '📊 Portfolio Tracker',
  whale: '🐋 Whale Alert', airdrop: '🎁 Airdrop Alert',
  tax: '🧮 Tax Calculator', expert: '👨‍💼 Expert Help',
};

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });

  try {
    const { telegram_id, service_id, payment_method } = req.body;
    if (!telegram_id || !service_id) return res.status(400).json({ error: 'telegram_id and service_id required' });

    const price = PRICES[service_id];
    if (!price) return res.status(400).json({ error: 'Invalid service' });

    const { data: user } = await supabase.from('users').select('*').eq('telegram_id', telegram_id).single();
    if (!user) return res.status(404).json({ error: 'User not found' });

    const serviceName = SERVICE_NAMES[service_id] || service_id;
    const expiry = new Date();
    expiry.setDate(expiry.getDate() + 30);

    if (payment_method === 'balance') {
      // ─── Balance Payment (Auto-verify) ───
      if ((user.balance || 0) < price) {
        return res.status(400).json({ error: 'Insufficient balance', needed: price, available: user.balance });
      }

      // Deduct from balance
      const newBalance = (user.balance || 0) - price;
      await supabase.from('users').update({ balance: newBalance }).eq('telegram_id', telegram_id);

      // Log transaction
      await supabase.from('transactions').insert({
        telegram_id, type: 'service_purchase', amount: price,
        details: `Purchased: ${service_id} via balance`,
      });

      // Record purchase (active immediately)
      try {
        await supabase.from('service_purchases').upsert({
          telegram_id, service_id, price,
          payment_method: 'balance',
          status: 'active',
          expires_at: expiry.toISOString(),
        }, { onConflict: 'telegram_id,service_id' });
      } catch (e) { console.log('service_purchases table not found, skipping'); }

      // Notify channel
      const userTag = user.username ? `@${user.username}` : (user.first_name || 'User');
      if (bot && CHANNEL_ID) {
        try {
          await bot.sendMessage(CHANNEL_ID,
            `🛒 <b>Service Purchased!</b>\n\n👤 ${userTag}\n🔧 ${serviceName}\n💵 <b>${price} USDT</b>\n💳 Method: Balance\n✅ Auto-verified\n\n🔗 <a href="${APP_URL}">Open Vanguard</a>`,
            { parse_mode: 'HTML' }
          );
        } catch {}
      }

      return res.status(200).json({
        success: true,
        newBalance,
        expiresAt: expiry.toISOString(),
        message: `${serviceName} unlocked!`,
      });

    } else {
      // ─── Direct USDT Payment (Needs admin verification) ───
      try {
        await supabase.from('service_purchases').upsert({
          telegram_id, service_id, price,
          payment_method: 'direct_usdt',
          status: 'pending',
          expires_at: null,
        }, { onConflict: 'telegram_id,service_id' });
      } catch (e) { console.log('service_purchases table not found, skipping'); }

      // Notify admin via bot DM
      const userTag = user.username ? `@${user.username}` : (user.first_name || 'User');
      if (bot) {
        try {
          await bot.sendMessage(parseInt(ADMIN_ID),
            `🔔 <b>Payment Verification Needed!</b>\n\n` +
            `👤 ${userTag} (ID: <code>${telegram_id}</code>)\n` +
            `🔧 Service: <b>${serviceName}</b>\n` +
            `💵 Amount: <b>${price} USDT</b>\n` +
            `💳 Method: Direct USDT\n` +
            `⏰ Time: ${new Date().toLocaleString()}\n\n` +
            `━━━━━━━━━━━━━━━━━━━━\n` +
            `✅ Approve: <code>/approve ${telegram_id} ${service_id}</code>\n` +
            `❌ Reject: <code>/reject ${telegram_id} ${service_id}</code>\n` +
            `━━━━━━━━━━━━━━━━━━━━`,
            { parse_mode: 'HTML' }
          );
        } catch {}
      }

      // Notify channel
      if (bot && CHANNEL_ID) {
        try {
          await bot.sendMessage(CHANNEL_ID,
            `🔔 <b>Payment Pending Verification</b>\n\n👤 ${userTag}\n🔧 ${serviceName}\n💵 <b>${price} USDT</b>\n💳 Method: Direct USDT\n⏳ Status: Pending\n\n🔗 <a href="${APP_URL}">Open Vanguard</a>`,
            { parse_mode: 'HTML' }
          );
        } catch {}
      }

      return res.status(200).json({
        success: true,
        status: 'pending',
        message: `Payment submitted! ${price} USDT sent to wallet. Admin will verify within 30 minutes.`,
      });
    }
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}
