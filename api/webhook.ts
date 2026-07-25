import { createClient } from '@supabase/supabase-js';
const supabase = createClient(process.env.SUPABASE_URL || '', process.env.SUPABASE_ANON_KEY || '');
const BOT_TOKEN = process.env.BOT_TOKEN || '';
const APP_URL = process.env.APP_URL || '';
const CHANNEL_ID = process.env.CHANNEL_ID || '';
const BANNER_URL = `${APP_URL}/banner.svg`;
let bot: any = null;
try { const TB = (await import('node-telegram-bot-api')).default; if (BOT_TOKEN) bot = new TB(BOT_TOKEN, { polling: false }); } catch {}
async function postToChannel(msg: string) { if (bot && CHANNEL_ID) { try { await bot.sendMessage(CHANNEL_ID, msg, { parse_mode: 'HTML' }); } catch {} } }
export default async function handler(req: any, res: any) {
  if (!bot) return res.sendStatus(200);
  const update = req.body;
  try {
    if (update.message) {
      const msg = update.message; const chatId = msg.chat.id; const text = msg.text || '';
      const firstName = msg.from?.first_name || 'User'; const username = msg.from?.username || ''; const userId = msg.from?.id;
      if (text.startsWith('/start')) {
        const referralCode = text.split(' ')[1];
        const kb = { inline_keyboard: [
          [{ text: '🚀 Open Vanguard Staking', web_app: { url: APP_URL } }],
          [{ text: '📊 Join Channel', url: CHANNEL_ID ? `https://t.me/${CHANNEL_ID.replace('@', '')}` : '#' }],
          [{ text: '👥 Invite Friends & Earn 40%', callback_data: `referral_${userId}` }],
        ]};
        const caption = ['━━━━━━━━━━━━━━━━━━━━━━━━━━', '⚔️ <b>VANGUARD STAKING</b> ⚔️', '━━━━━━━━━━━━━━━━━━━━━━━━━━', '', `Welcome, <b>${firstName}</b>! 👋`, '', '💰 <b>Stake USDT</b> → Earn up to <b>3% daily</b>', '🔒 <b>Secure</b> → TRC-20 Protocol', '⚡ <b>Fast</b> → Instant Deposits', '🌍 <b>Trusted</b> → 5,000+ Users', '👥 <b>Earn More</b> → 40% Commissions', '', '━━━━━━━ <b>NEW SERVICES</b> ━━━━━━━', '🔍 <b>Token Scanner</b> → Check safety', '⛽ <b>Gas Tracker</b> → Real-time prices', '🎓 <b>Crypto Academy</b> → Learn free', '', '━━━━━━━━━━━━━━━━━━━━━━━━━━', '🚀 <i>Tap below to start your journey!</i>', '━━━━━━━━━━━━━━━━━━━━━━━━━━' ].join('\n');
        try { await bot.sendPhoto(chatId, BANNER_URL, { caption, reply_markup: kb, parse_mode: 'HTML' }); }
        catch { await bot.sendMessage(chatId, caption, { reply_markup: kb, parse_mode: 'HTML' }); }
        const userTag = username ? `@${username}` : firstName;
        await postToChannel(`🆕 <b>New User!</b>\n\n👤 ${userTag}\n🆔 <code>${userId}</code>`);
        if (referralCode && userId && parseInt(referralCode) !== userId) {
          await supabase.from('users').update({ referrer_id: parseInt(referralCode) }).eq('telegram_id', userId);
          const { data: ref } = await supabase.from('users').select('referrals_count, affiliate_balance').eq('telegram_id', parseInt(referralCode)).single();
          if (ref) await supabase.from('users').update({ referrals_count: (ref.referrals_count || 0) + 1, affiliate_balance: (ref.affiliate_balance || 0) + 1 }).eq('telegram_id', parseInt(referralCode));
        }
      } else if (text === '/help') {
        await bot.sendMessage(chatId, '📖 <b>Commands</b>\n\n🚀 /start — Start bot\n💰 /stake — Open app\n🔍 /scan — Token scanner\n⛽ /gas — Gas prices\n🎓 /learn — Academy\n👥 /referral — Referral link\n📖 /help — Help', { parse_mode: 'HTML' });
      } else if (text === '/stake') {
        await bot.sendMessage(chatId, '💰 Open Staking:', { reply_markup: { inline_keyboard: [[{ text: '🚀 Open App', web_app: { url: APP_URL } }]] } });
      } else if (text === '/referral') {
        await bot.sendMessage(chatId, `👥 Referral Link:\n\nhttps://t.me/vanguardstakingbot?start=${userId}\n\n💰 1 USDT/ref + 40% commission`);
      } else if (text.startsWith('/approve') && userId?.toString() === process.env.ADMIN_TELEGRAM_ID) {
        // Admin command: /approve <telegram_id> <service_id>
        const parts = text.split(' ');
        if (parts.length >= 3) {
          const targetId = parts[1]; const svcId = parts[2];
          try {
            const verifyRes = await fetch(`${APP_URL}/api/service/verify`, {
              method: 'POST', headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ telegram_id: targetId, admin_telegram_id: userId, service_id: svcId, action: 'approve' }),
            });
            const result = await verifyRes.json();
            await bot.sendMessage(chatId, result.success ? `✅ Approved ${svcId} for user ${targetId}` : `❌ Error: ${result.error}`);
          } catch (e: any) { await bot.sendMessage(chatId, `❌ Error: ${e.message}`); }
        } else {
          await bot.sendMessage(chatId, 'Usage: /approve <user_id> <service_id>');
        }
      } else if (text.startsWith('/reject') && userId?.toString() === process.env.ADMIN_TELEGRAM_ID) {
        const parts = text.split(' ');
        if (parts.length >= 3) {
          const targetId = parts[1]; const svcId = parts[2];
          try {
            const verifyRes = await fetch(`${APP_URL}/api/service/verify`, {
              method: 'POST', headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ telegram_id: targetId, admin_telegram_id: userId, service_id: svcId, action: 'reject' }),
            });
            const result = await verifyRes.json();
            await bot.sendMessage(chatId, result.success ? `❌ Rejected ${svcId} for user ${targetId}` : `❌ Error: ${result.error}`);
          } catch (e: any) { await bot.sendMessage(chatId, `❌ Error: ${e.message}`); }
        } else {
          await bot.sendMessage(chatId, 'Usage: /reject <user_id> <service_id>');
        }
      } else if (text === '/payments' && userId?.toString() === process.env.ADMIN_TELEGRAM_ID) {
        try {
          const { data: purchases } = await supabase.from('service_purchases').select('*, users(username, first_name)').eq('status', 'pending').order('created_at', { ascending: false });
          if (!purchases || purchases.length === 0) {
            await bot.sendMessage(chatId, '✅ No pending payments!');
          } else {
            const list = purchases.map((p: any) =>
              `👤 ${p.users?.username ? '@' + p.users.username : (p.users?.first_name || 'User')} (ID: ${p.telegram_id})\n🔧 ${p.service_id} • ${p.price} USDT\n⏰ ${new Date(p.created_at).toLocaleString()}`
            ).join('\n\n');
            await bot.sendMessage(chatId, `📋 <b>Pending Payments (${purchases.length})</b>\n\n${list}\n\n/approve <id> <service> • /reject <id> <service>`, { parse_mode: 'HTML' });
          }
        } catch (e: any) { await bot.sendMessage(chatId, `❌ Error: ${e.message}`); }
      }
    }
    if (update.callback_query) {
      const q = update.callback_query; const chatId = q.message?.chat.id;
      if (q.data?.startsWith('referral_')) {
        await bot.answerCallbackQuery(q.id);
        await bot.sendMessage(chatId, `👥 Referral Link:\n\nhttps://t.me/vanguardstakingbot?start=${q.data.split('_')[1]}\n\nShare & earn 40%!`);
      }
    }
  } catch (err) { console.error('Webhook error:', err); }
  res.sendStatus(200);
}
