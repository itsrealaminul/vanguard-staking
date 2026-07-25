import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.SUPABASE_URL || '', process.env.SUPABASE_ANON_KEY || '');
const BOT_TOKEN = proces…OKEN || '';
const CHANNEL_ID = process.env.CHANNEL_ID || '';
const APP_URL = process.env.APP_URL || '';

let bot: any = null;
try { const TB = (await import('node-telegram-bot-api')).default; if (BOT_TOKEN) bot = new TB(BOT_TOKEN, { polling: false }); } catch {}

const SERVICE_NAMES: Record<string, string> = {
  tokenScanner: '🔍 Token Scanner', portfolio: '📊 Portfolio Tracker',
  whale: '🐋 Whale Alert', airdrop: '🎁 Airdrop Alert',
  tax: '🧮 Tax Calculator', expert: '👨‍💼 Expert Help',
};

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });

  try {
    const adminId = parseInt(process.env.ADMIN_TELEGRAM_ID || '7010136281');
    const { telegram_id, admin_telegram_id, service_id, action } = req.body;

    // Verify admin
    if (parseInt(admin_telegram_id) !== adminId) {
      return res.status(403).json({ error: 'Admin only' });
    }

    if (!telegram_id || !service_id || !action) {
      return res.status(400).json({ error: 'telegram_id, service_id, and action required' });
    }

    const targetUserId = parseInt(telegram_id);
    const serviceName = SERVICE_NAMES[service_id] || service_id;
    const expiry = new Date();
    expiry.setDate(expiry.getDate() + 30);

    if (action === 'approve') {
      // Activate the service
      try {
        await supabase.from('service_purchases').upsert({
          telegram_id: targetUserId,
          service_id,
          status: 'active',
          expires_at: expiry.toISOString(),
          payment_method: 'direct_usdt',
          price: 0, // will be filled by existing record
        }, { onConflict: 'telegram_id,service_id' });
      } catch {}

      // Update status if record exists
      await supabase.from('service_purchases')
        .update({ status: 'active', expires_at: expiry.toISOString() })
        .eq('telegram_id', targetUserId)
        .eq('service_id', service_id);

      // Notify user via bot
      if (bot) {
        try {
          await bot.sendMessage(targetUserId,
            `✅ <b>Payment Verified!</b>\n\n🔧 ${serviceName}\n📅 Valid for 30 days\n\n🎉 Enjoy your new service!\n\n🔗 <a href="${APP_URL}">Open Vanguard Staking</a>`,
            { parse_mode: 'HTML' }
          );
        } catch {}
      }

      // Notify channel
      const { data: user } = await supabase.from('users').select('username, first_name').eq('telegram_id', targetUserId).single();
      const userTag = user?.username ? `@${user.username}` : (user?.first_name || 'User');
      if (bot && CHANNEL_ID) {
        try {
          await bot.sendMessage(CHANNEL_ID,
            `✅ <b>Payment Approved!</b>\n\n👤 ${userTag}\n🔧 ${serviceName}\n📅 Active for 30 days\n\n🔗 <a href="${APP_URL}">Open Vanguard</a>`,
            { parse_mode: 'HTML' }
          );
        } catch {}
      }

      return res.status(200).json({ success: true, message: `${serviceName} activated for user ${targetUserId}` });

    } else if (action === 'reject') {
      // Update status to rejected
      await supabase.from('service_purchases')
        .update({ status: 'rejected' })
        .eq('telegram_id', targetUserId)
        .eq('service_id', service_id);

      // Notify user
      if (bot) {
        try {
          await bot.sendMessage(targetUserId,
            `❌ <b>Payment Rejected</b>\n\n🔧 ${serviceName}\n\nYour payment could not be verified. Please contact admin.\n\n🔗 <a href="${APP_URL}">Open Vanguard Staking</a>`,
            { parse_mode: 'HTML' }
          );
        } catch {}
      }

      return res.status(200).json({ success: true, message: `Payment rejected for user ${targetUserId}` });

    } else {
      return res.status(400).json({ error: 'Action must be "approve" or "reject"' });
    }
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}
