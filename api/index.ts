import express from 'express';
import cors from 'cors';
import { createClient } from '@supabase/supabase-js';
import TelegramBot from 'node-telegram-bot-api';

const app = express();
app.use(cors());
app.use(express.json());

const supabase = createClient(
  process.env.SUPABASE_URL || 'https://sudpqfzogswuvhoblbyj.supabase.co',
  process.env.SUPABASE_ANON_KEY || 'sb_publishable_uOQ1Hu1Q3v_WZqxrT4lNAA_MxJ7NiuL'
);

const BOT_TOKEN = process.env.BOT_TOKEN || '';
const APP_URL = process.env.APP_URL || 'https://vanguard-staking.vercel.app';
const CHANNEL_ID = process.env.CHANNEL_ID || '';
const BANNER_URL = `${APP_URL}/banner.svg`;

function getParam(val: any): string | undefined {
  if (typeof val === 'string') return val;
  if (Array.isArray(val)) return val[0] as string;
  return undefined;
}

// ─── Bot Setup ────────────────────────────────────────
let bot: TelegramBot | null = null;
if (BOT_TOKEN) {
  bot = new TelegramBot(BOT_TOKEN, { polling: false });
  const webhookUrl = `${APP_URL}/api/webhook`;
  bot.setWebHook(webhookUrl).then(() => console.log(`🔗 Webhook: ${webhookUrl}`)).catch(e => console.error('Webhook err:', e));
}

// ─── Channel Posting ──────────────────────────────────
async function postToChannel(message: string) {
  if (!bot || !CHANNEL_ID) return;
  try {
    await bot.sendMessage(CHANNEL_ID, message, { parse_mode: 'HTML' });
  } catch (err) {
    console.error('Channel post error:', err);
  }
}

// ─── Webhook ──────────────────────────────────────────
app.post('/api/webhook', async (req, res) => {
  if (!bot) return res.sendStatus(200);
  const update = req.body;
  try {
    if (update.message) {
      const msg = update.message;
      const chatId = msg.chat.id;
      const text = msg.text || '';
      const firstName = msg.from?.first_name || 'User';
      const username = msg.from?.username || '';
      const userId = msg.from?.id;

      if (text.startsWith('/start')) {
        const referralCode = text.split(' ')[1];
        const keyboard = {
          inline_keyboard: [
            [{ text: '🚀 Open Vanguard Staking', web_app: { url: APP_URL } }],
            [{ text: '📊 Join Channel', url: CHANNEL_ID ? `https://t.me/${CHANNEL_ID.replace('@', '')}` : 'https://t.me/vanguardstakingbot' }],
            [{ text: '👥 Invite Friends & Earn 40%', callback_data: `referral_${userId}` }],
          ],
        };
        try {
          const welcomeCaption = [
            '━━━━━━━━━━━━━━━━━━━━━━━━━━',
            '⚔️ <b>VANGUARD STAKING</b> ⚔️',
            '━━━━━━━━━━━━━━━━━━━━━━━━━━',
            '',
            `Welcome, <b>${firstName}</b>! 👋`,
            '',
            '💰 <b>Stake USDT</b> → Earn up to <b>3% daily</b>',
            '🔒 <b>Secure</b> → TRC-20 Protocol',
            '⚡ <b>Fast</b> → Instant Deposits',
            '🌍 <b>Trusted</b> → 5,000+ Users',
            '👥 <b>Earn More</b> → 40% Commissions',
            '',
            '━━━━━━━ <b>NEW SERVICES</b> ━━━━━━━',
            '🔍 <b>Token Scanner</b> → Check safety',
            '⛽ <b>Gas Tracker</b> → Real-time prices',
            '🎓 <b>Crypto Academy</b> → Learn free',
            '📊 <b>Portfolio</b> • 🐋 <b>Whale Alert</b>',
            '',
            '━━━━━━━━━━━━━━━━━━━━━━━━━━',
            '🚀 <i>Tap below to start your journey!</i>',
            '━━━━━━━━━━━━━━━━━━━━━━━━━━',
          ].join('\n');
          await bot.sendPhoto(chatId, BANNER_URL, {
            caption: welcomeCaption,
            reply_markup: keyboard,
            parse_mode: 'HTML',
          });
        } catch {
          await bot.sendMessage(chatId, `⚔️ Welcome, ${firstName}!\n\n💰 Stake • Earn • Grow`, { reply_markup: keyboard });
        }

        // Post to channel: New user joined
        const userTag = username ? `@${username}` : firstName;
        await postToChannel(`🆕 <b>New User Joined!</b>\n\n👤 ${userTag}\n🆔 ID: <code>${userId}</code>\n\n🔗 <a href="${APP_URL}">Open Vanguard Staking</a>`);

        // Handle referral
        if (referralCode && userId && parseInt(referralCode) !== userId) {
          await supabase.from('users').update({ referrer_id: parseInt(referralCode) }).eq('telegram_id', userId);
          const { data: referrer } = await supabase.from('users').select('referrals_count, affiliate_balance, username, first_name').eq('telegram_id', parseInt(referralCode)).single();
          if (referrer) {
            await supabase.from('users').update({
              referrals_count: (referrer.referrals_count || 0) + 1,
              affiliate_balance: (referrer.affiliate_balance || 0) + 1,
            }).eq('telegram_id', parseInt(referralCode));

            // Post to channel: Referral
            const refTag = referrer.username ? `@${referrer.username}` : (referrer.first_name || 'User');
            await postToChannel(`👥 <b>New Referral!</b>\n\n👤 ${userTag} joined via ${refTag}'s link\n💰 Referrer earned 1 USDT bonus\n\n🔗 <a href="${APP_URL}">Start Referring</a>`);
          }
        }
      } else if (text === '/help') {
        await bot.sendMessage(chatId, [
          '📖 <b>Vanguard Staking Commands</b>',
          '',
          '🚀 /start — Start bot & welcome',
          '💰 /stake — Open staking app',
          '🔍 /scan — Scan token contract',
          '⛽ /gas — Check gas prices',
          '🎓 /learn — Crypto Academy',
          '👥 /referral — Referral link',
          '📖 /help — This message',
          '',
          '━━━━━━━━━━━━━━━━━━━━━━',
          '💡 <i>All services available in the mini app!</i>',
        ].join('\n'), { parse_mode: 'HTML' });
      } else if (text === '/scan') {
        await bot.sendMessage(chatId, '🔍 <b>Token Scanner</b>\n\nCheck any token contract for safety before investing.\n\n• Detect scams & rug pulls\n• Safety score 0-100\n• Risk & safe indicators', {
          parse_mode: 'HTML',
          reply_markup: { inline_keyboard: [[{ text: '🔍 Open Scanner', web_app: { url: `${APP_URL}#scanner` } }]] },
        });
      } else if (text === '/gas') {
        await bot.sendMessage(chatId, '⛽ <b>Gas Tracker</b>\n\nReal-time gas prices:\n⟠ Ethereum • ◈ BSC\n⚡ TRON • ⬡ Polygon\n\nLow → Standard → Fast → Instant', {
          parse_mode: 'HTML',
          reply_markup: { inline_keyboard: [[{ text: '⛽ Check Gas', web_app: { url: `${APP_URL}#gas` } }]] },
        });
      } else if (text === '/learn') {
        await bot.sendMessage(chatId, '🎓 <b>Crypto Academy</b>\n\nFree crypto education!\n\n• Beginner: Blockchain, Wallets, USDT\n• Intermediate: Staking, DeFi, Gas\n• Advanced: Security, Portfolio\n\n📚 8 lessons • 100% free', {
          parse_mode: 'HTML',
          reply_markup: { inline_keyboard: [[{ text: '🎓 Start Learning', web_app: { url: `${APP_URL}#academy` } }]] },
        });
      } else if (text === '/stake') {
        await bot.sendMessage(chatId, '💰 Open Staking:', { reply_markup: { inline_keyboard: [[{ text: '🚀 Open App', web_app: { url: APP_URL } }]] } });
      } else if (text === '/referral') {
        await bot.sendMessage(chatId, `👥 <b>Referral Link</b>\n\nhttps://t.me/vanguardstakingbot?start=${userId}\n\n💰 1 USDT/ref + 40% commission`, { parse_mode: 'HTML' });
      }
    }

    if (update.callback_query) {
      const query = update.callback_query;
      const chatId = query.message?.chat.id;
      const data = query.data;
      if (data?.startsWith('referral_')) {
        const uid = data.split('_')[1];
        await bot.answerCallbackQuery(query.id);
        await bot.sendMessage(chatId, `👥 Referral Link:\n\nhttps://t.me/vanguardstakingbot?start=${uid}\n\nShare & earn 40%!`);
      }
    }
  } catch (err) {
    console.error('Webhook error:', err);
  }
  res.sendStatus(200);
});

// ─── Health ───────────────────────────────────────────
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', bot: 'Vanguard Staking Bot', appUrl: APP_URL });
});

// ─── Get or Create User ───────────────────────────────
app.get('/api/user', async (req, res) => {
  try {
    const telegramIdStr = getParam(req.query.telegram_id);
    if (!telegramIdStr) return res.status(400).json({ error: 'telegram_id required' });
    const telegramId = parseInt(telegramIdStr, 10);
    let { data: user, error } = await supabase.from('users').select('*').eq('telegram_id', telegramId).single();
    if (error && error.code === 'PGRST116') {
      const { data: newUser, error: insertError } = await supabase.from('users').insert({
        telegram_id: telegramId,
        username: getParam(req.query.username) || null,
        first_name: getParam(req.query.first_name) || null,
        balance: 0, affiliate_balance: 0, total_staked: 0, total_earned: 0, referrals_count: 0,
      }).select().single();
      if (insertError) throw insertError;
      user = newUser;
    } else if (error) {
      throw error;
    }
    res.json(user);
  } catch (err: any) {
    console.error('GET /api/user error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ─── Update User ──────────────────────────────────────
app.post('/api/user', async (req, res) => {
  try {
    const { telegram_id, ...updates } = req.body;
    if (!telegram_id) return res.status(400).json({ error: 'telegram_id required' });
    const { data, error } = await supabase.from('users').update(updates).eq('telegram_id', telegram_id).select().single();
    if (error) throw error;
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Deposit (add balance) ────────────────────────────
app.post('/api/deposit', async (req, res) => {
  try {
    const { telegram_id, amount, tx_hash } = req.body;
    if (!telegram_id || !amount) return res.status(400).json({ error: 'telegram_id and amount required' });

    // Get user info
    const { data: user } = await supabase.from('users').select('balance, username, first_name').eq('telegram_id', telegram_id).single();

    // Update balance
    const newBalance = (user?.balance || 0) + parseFloat(amount);
    await supabase.from('users').update({ balance: newBalance }).eq('telegram_id', telegram_id);

    // Log transaction
    await supabase.from('transactions').insert({
      telegram_id, type: 'deposit', amount: parseFloat(amount),
      details: tx_hash ? `Deposit TX: ${tx_hash}` : 'Manual deposit',
    });

    // Post to channel
    const userTag = user?.username ? `@${user.username}` : (user?.first_name || 'User');
    await postToChannel(`💰 <b>New Deposit!</b>\n\n👤 ${userTag}\n💵 Amount: <b>${parseFloat(amount).toFixed(2)} USDT</b>\n💳 New Balance: ${newBalance.toFixed(2)} USDT\n${tx_hash ? `🔗 TX: <code>${tx_hash}</code>\n` : ''}\n🔗 <a href="${APP_URL}">Open Vanguard Staking</a>`);

    res.json({ success: true, balance: newBalance });
  } catch (err: any) {
    console.error('POST /api/deposit error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ─── Get Stakes ───────────────────────────────────────
app.get('/api/stakes', async (req, res) => {
  try {
    const telegramIdStr = getParam(req.query.telegram_id);
    if (!telegramIdStr) return res.status(400).json({ error: 'telegram_id required' });
    const telegramId = parseInt(telegramIdStr, 10);
    const { data, error } = await supabase.from('stakes').select('*').eq('telegram_id', telegramId).order('start_date', { ascending: false });
    if (error) throw error;
    res.json(data || []);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Create Stake ─────────────────────────────────────
app.post('/api/stakes', async (req, res) => {
  try {
    const { telegram_id, amount, plan_days, daily_rate } = req.body;
    if (!telegram_id || !amount || !plan_days || !daily_rate) return res.status(400).json({ error: 'Missing fields' });
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + plan_days);
    const { data: stake, error } = await supabase.from('stakes').insert({
      telegram_id, amount, plan_days, daily_rate,
      start_date: startDate.toISOString(), end_date: endDate.toISOString(),
      last_reward_claim: startDate.toISOString(), status: 'active',
    }).select().single();
    if (error) throw error;

    // Update total_staked
    const { data: user } = await supabase.from('users').select('total_staked, username, first_name').eq('telegram_id', telegram_id).single();
    if (user) await supabase.from('users').update({ total_staked: (user.total_staked || 0) + parseFloat(amount) }).eq('telegram_id', telegram_id);

    // Post to channel
    const userTag = user?.username ? `@${user.username}` : (user?.first_name || 'User');
    const dailyReward = (parseFloat(amount) * daily_rate).toFixed(4);
    const totalReward = (parseFloat(amount) * daily_rate * plan_days).toFixed(4);
    await postToChannel(`🔒 <b>New Stake Created!</b>\n\n👤 ${userTag}\n💵 Amount: <b>${parseFloat(amount).toFixed(2)} USDT</b>\n📅 Plan: ${plan_days} days\n📊 Rate: ${(daily_rate * 100).toFixed(1)}%/day\n💰 Daily: ${dailyReward} USDT\n🎯 Total: ${totalReward} USDT\n\n🔗 <a href="${APP_URL}">Open Vanguard Staking</a>`);

    res.json(stake);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Withdrawals ──────────────────────────────────────
app.get('/api/withdrawals', async (req, res) => {
  try {
    const telegramIdStr = getParam(req.query.telegram_id);
    if (!telegramIdStr) return res.status(400).json({ error: 'telegram_id required' });
    const telegramId = parseInt(telegramIdStr, 10);
    const { data, error } = await supabase.from('withdrawals').select('*').eq('telegram_id', telegramId).order('created_at', { ascending: false });
    if (error) throw error;
    res.json(data || []);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/withdrawals', async (req, res) => {
  try {
    const { telegram_id, amount, wallet_address } = req.body;
    if (!telegram_id || !amount || !wallet_address) return res.status(400).json({ error: 'Missing fields' });
    const { data, error } = await supabase.from('withdrawals').insert({ telegram_id, amount, wallet_address, status: 'pending' }).select().single();
    if (error) throw error;

    // Get user info
    const { data: user } = await supabase.from('users').select('username, first_name').eq('telegram_id', telegram_id).single();

    // Post to channel
    const userTag = user?.username ? `@${user.username}` : (user?.first_name || 'User');
    await postToChannel(`💸 <b>Withdrawal Request!</b>\n\n👤 ${userTag}\n💵 Amount: <b>${parseFloat(amount).toFixed(2)} USDT</b>\n💳 Wallet: <code>${wallet_address.slice(0, 10)}...${wallet_address.slice(-6)}</code>\n⏳ Status: Pending\n\n🔗 <a href="${APP_URL}">Open Vanguard Staking</a>`);

    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Transactions ─────────────────────────────────────
app.get('/api/transactions', async (req, res) => {
  try {
    const telegramIdStr = getParam(req.query.telegram_id);
    if (!telegramIdStr) return res.status(400).json({ error: 'telegram_id required' });
    const telegramId = parseInt(telegramIdStr, 10);
    const { data, error } = await supabase.from('transactions').select('*').eq('telegram_id', telegramId).order('created_at', { ascending: false });
    if (error) throw error;
    res.json(data || []);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Claim Rewards ────────────────────────────────────
app.post('/api/claim-reward', async (req, res) => {
  try {
    const { telegram_id, stake_id } = req.body;
    if (!telegram_id || !stake_id) return res.status(400).json({ error: 'telegram_id and stake_id required' });
    const { data: stake, error: stakeError } = await supabase.from('stakes').select('*').eq('id', stake_id).eq('telegram_id', telegram_id).single();
    if (stakeError) throw stakeError;
    if (!stake) return res.status(404).json({ error: 'Stake not found' });
    const now = new Date();
    const lastClaim = new Date(stake.last_reward_claim);
    const daysSinceClaim = Math.floor((now.getTime() - lastClaim.getTime()) / (1000 * 60 * 60 * 24));
    if (daysSinceClaim < 1) return res.status(400).json({ error: 'Can claim once per day' });
    const reward = parseFloat(stake.amount) * parseFloat(stake.daily_rate) * daysSinceClaim;
    await supabase.from('stakes').update({ last_reward_claim: now.toISOString() }).eq('id', stake_id);
    const { data: user } = await supabase.from('users').select('balance, total_earned, username, first_name').eq('telegram_id', telegram_id).single();
    if (user) await supabase.from('users').update({ balance: (user.balance || 0) + reward, total_earned: (user.total_earned || 0) + reward }).eq('telegram_id', telegram_id);
    await supabase.from('transactions').insert({ telegram_id, type: 'reward_claim', amount: reward, details: `Claimed from stake ${stake_id}` });

    // Post to channel
    const userTag = user?.username ? `@${user.username}` : (user?.first_name || 'User');
    await postToChannel(`🎁 <b>Reward Claimed!</b>\n\n👤 ${userTag}\n💰 Reward: <b>${reward.toFixed(4)} USDT</b>\n📊 Stake: ${parseFloat(stake.amount).toFixed(2)} USDT (${stake.plan_days}d)\n\n🔗 <a href="${APP_URL}">Open Vanguard Staking</a>`);

    res.json({ success: true, reward });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Referral ─────────────────────────────────────────
app.post('/api/referral', async (req, res) => {
  try {
    const { telegram_id, referrer_id } = req.body;
    if (!telegram_id || !referrer_id) return res.status(400).json({ error: 'telegram_id and referrer_id required' });
    if (telegram_id === referrer_id) return res.status(400).json({ error: 'Cannot refer yourself' });
    const { error } = await supabase.from('users').update({ referrer_id }).eq('telegram_id', telegram_id);
    if (error) throw error;
    const { data: referrer } = await supabase.from('users').select('referrals_count, affiliate_balance, username, first_name').eq('telegram_id', referrer_id).single();
    const { data: newUser } = await supabase.from('users').select('username, first_name').eq('telegram_id', telegram_id).single();
    if (referrer) await supabase.from('users').update({ referrals_count: (referrer.referrals_count || 0) + 1, affiliate_balance: (referrer.affiliate_balance || 0) + 1 }).eq('telegram_id', referrer_id);

    // Post to channel
    const refTag = referrer?.username ? `@${referrer.username}` : (referrer?.first_name || 'User');
    const newUserTag = newUser?.username ? `@${newUser.username}` : (newUser?.first_name || 'User');
    await postToChannel(`👥 <b>New Referral!</b>\n\n👤 ${newUserTag} joined via ${refTag}'s link\n💰 Referrer earned 1 USDT\n\n🔗 <a href="${APP_URL}">Start Referring</a>`);

    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Admin Routes ─────────────────────────────────────
app.get('/api/admin/users', async (req, res) => {
  try {
    const adminId = parseInt(process.env.ADMIN_TELEGRAM_ID || '7010136281');
    if (parseInt(getParam(req.query.telegram_id) || '0') !== adminId) return res.status(403).json({ error: 'Admin only' });
    const { data, error } = await supabase.from('users').select('*').order('created_at', { ascending: false });
    if (error) throw error;
    res.json(data || []);
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

app.get('/api/admin/withdrawals', async (req, res) => {
  try {
    const adminId = parseInt(process.env.ADMIN_TELEGRAM_ID || '7010136281');
    if (parseInt(getParam(req.query.telegram_id) || '0') !== adminId) return res.status(403).json({ error: 'Admin only' });
    const { data, error } = await supabase.from('withdrawals').select('*').order('created_at', { ascending: false });
    if (error) throw error;
    res.json(data || []);
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

app.post('/api/admin/withdrawal', async (req, res) => {
  try {
    const adminId = parseInt(process.env.ADMIN_TELEGRAM_ID || '7010136281');
    const { telegram_id, withdrawal_id, action } = req.body;
    if (parseInt(telegram_id) !== adminId) return res.status(403).json({ error: 'Admin only' });
    const newStatus = action === 'approve' ? 'approved' : 'rejected';
    const { data, error } = await supabase.from('withdrawals').update({ status: newStatus }).eq('id', withdrawal_id).select().single();
    if (error) throw error;

    // Post to channel: Withdrawal status update
    const { data: wd } = await supabase.from('withdrawals').select('telegram_id, amount, wallet_address').eq('id', withdrawal_id).single();
    if (wd) {
      const { data: wdUser } = await supabase.from('users').select('username, first_name').eq('telegram_id', wd.telegram_id).single();
      const userTag = wdUser?.username ? `@${wdUser.username}` : (wdUser?.first_name || 'User');
      const emoji = newStatus === 'approved' ? '✅' : '❌';
      await postToChannel(`${emoji} <b>Withdrawal ${newStatus.charAt(0).toUpperCase() + newStatus.slice(1)}!</b>\n\n👤 ${userTag}\n💵 Amount: <b>${parseFloat(wd.amount).toFixed(2)} USDT</b>\n💳 Wallet: <code>${wd.wallet_address.slice(0, 10)}...${wd.wallet_address.slice(-6)}</code>\n\n🔗 <a href="${APP_URL}">Open Vanguard Staking</a>`);
    }

    res.json(data);
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

// ─── Setup Bot ────────────────────────────────────────
app.get('/api/setup-bot', async (_req, res) => {
  if (!bot) return res.status(500).json({ error: 'Bot not configured' });
  try {
    await bot.setMyCommands([
      { command: 'start', description: '🚀 Start the bot' },
      { command: 'stake', description: '💰 Open staking app' },
      { command: 'scan', description: '🔍 Scan token contract' },
      { command: 'gas', description: '⛽ Check gas prices' },
      { command: 'learn', description: '🎓 Crypto Academy' },
      { command: 'referral', description: '👥 Get referral link' },
      { command: 'help', description: '📖 Show help' },
    ]);
    await bot.setMyDescription({ description: '⚔️ Vanguard Staking — Your all-in-one crypto platform.\n\n💰 Stake USDT → Earn up to 3% daily\n🔍 Token Scanner → Check contract safety\n⛽ Gas Tracker → Real-time gas prices\n🎓 Crypto Academy → Free education\n👥 40% Affiliate Commissions\n🔒 Secure TRC-20 Protocol\n⚡ Instant Deposits & Fast Withdrawals\n\nTrusted by 5,000+ users worldwide. Tap Start!' });
    await bot.setMyShortDescription({ short_description: 'Stake USDT • Token Scanner • Gas Tracker • Crypto Academy. Earn up to 3% daily. 5,000+ users.' });
    res.json({ success: true, message: 'Bot configured!' });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

// ═══════════════════════════════════════════════════
// REAL-TIME SERVICE ENDPOINTS
// ═══════════════════════════════════════════════════

// ─── Gas Tracker (Real-time) ─────────────────────────
app.get('/api/gas', async (_req, res) => {
  try {
    const results: any = { timestamp: new Date().toISOString() };

    // Fetch Ethereum gas from multiple free sources
    try {
      const ethRes = await fetch('https://api.etherscan.io/api?module=gastracker&action=gasoracle');
      const ethData = await ethRes.json();
      if (ethData.status === '1' && ethData.result) {
        results.ethereum = {
          low: parseInt(ethData.result.SafeGasPrice),
          standard: parseInt(ethData.result.ProposeGasPrice),
          fast: parseInt(ethData.result.FastGasPrice),
          instant: Math.ceil(parseInt(ethData.result.FastGasPrice) * 1.5),
          unit: 'Gwei',
        };
      }
    } catch {
      results.ethereum = { low: 0, standard: 0, fast: 0, instant: 0, unit: 'Gwei', error: 'unavailable' };
    }

    // BSC gas (low cost network)
    try {
      const bscRes = await fetch('https://api.bscscan.com/api?module=gastracker&action=gasoracle');
      const bscData = await bscRes.json();
      if (bscData.status === '1' && bscData.result) {
        results.bsc = {
          low: parseInt(bscData.result.SafeGasPrice),
          standard: parseInt(bscData.result.ProposeGasPrice),
          fast: parseInt(bscData.result.FastGasPrice),
          instant: Math.ceil(parseInt(bscData.result.FastGasPrice) * 1.5),
          unit: 'Gwei',
        };
      }
    } catch {
      results.bsc = { low: 1, standard: 3, fast: 5, instant: 8, unit: 'Gwei' };
    }

    // TRON energy prices (from TronGrid)
    try {
      const tronRes = await fetch('https://api.trongrid.io/wallet/getchainparameters');
      const tronData = await tronRes.json();
      const energyFee = tronData?.chainParameter?.find((p: any) => p.key === 'getEnergyFee')?.value || 420;
      results.tron = {
        low: Math.round(energyFee * 0.8),
        standard: energyFee,
        fast: Math.round(energyFee * 1.3),
        instant: Math.round(energyFee * 1.8),
        unit: 'Energy',
      };
    } catch {
      results.tron = { low: 340, standard: 420, fast: 550, instant: 750, unit: 'Energy' };
    }

    // Polygon gas
    try {
      const polyRes = await fetch('https://api.polygonscan.com/api?module=gastracker&action=gasoracle');
      const polyData = await polyRes.json();
      if (polyData.status === '1' && polyData.result) {
        results.polygon = {
          low: parseInt(polyData.result.SafeGasPrice),
          standard: parseInt(polyData.result.ProposeGasPrice),
          fast: parseInt(polyData.result.FastGasPrice),
          instant: Math.ceil(parseInt(polyData.result.FastGasPrice) * 1.5),
          unit: 'Gwei',
        };
      }
    } catch {
      results.polygon = { low: 30, standard: 50, fast: 80, instant: 120, unit: 'Gwei' };
    }

    res.json(results);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Token Scanner (Real-time) ───────────────────────
app.get('/api/scan', async (req, res) => {
  try {
    const address = getParam(req.query.address);
    if (!address) return res.status(400).json({ error: 'address required' });

    const isTron = address.startsWith('T');
    const isEth = address.startsWith('0x');
    const risks: string[] = [];
    const safe: string[] = [];
    let holderCount = 0;
    let liquidityUSD = 0;
    let age = 0;
    let tokenName = 'Unknown';
    let tokenSymbol = '???';

    if (isTron) {
      // TRC-20 Token Info from TronGrid
      try {
        const [contractRes, infoRes] = await Promise.all([
          fetch(`https://api.trongrid.io/v1/contracts/${address}`),
          fetch(`https://apilist.tronscanapi.com/api/token_trc20?contract=${address}`),
        ]);
        const contractData = await contractRes.json();
        const infoData = await infoRes.json();

        if (contractData?.data?.[0]) {
          const c = contractData.data[0];
          tokenName = c.name || 'Unknown';
          tokenSymbol = c.symbol || '???';
          if (c.verified) safe.push('Contract verified on TronScan');
          else risks.push('Contract not verified');
        }

        if (infoData?.trc20_tokens?.[0]) {
          const t = infoData.trc20_tokens[0];
          holderCount = parseInt(t.holders_count || '0');
          if (holderCount > 1000) safe.push(`${holderCount.toLocaleString()} holders`);
          else if (holderCount < 100) risks.push(`Low holder count: ${holderCount}`);

          const totalSupply = parseFloat(t.total_supply_with_decimals || '0');
          if (totalSupply > 0) safe.push('Total supply verified');
        }

        // Check age from first transaction
        const txRes = await fetch(`https://api.trongrid.io/v1/contracts/${address}/transactions?limit=1&order_by=block_timestamp,asc`);
        const txData = await txRes.json();
        if (txData?.data?.[0]?.block_timestamp) {
          age = Math.floor((Date.now() - txData.data[0].block_timestamp) / (1000 * 60 * 60 * 24));
          if (age > 30) safe.push(`Contract age: ${age} days`);
          else risks.push(`New contract: ${age} days old`);
        }
      } catch (e) {
        risks.push('Could not fetch TRC-20 data');
      }
    } else if (isEth) {
      // ERC-20 Token Info from Etherscan
      try {
        const [contractRes, holderRes] = await Promise.all([
          fetch(`https://api.etherscan.io/api?module=contract&action=getsourcecode&address=${address}`),
          fetch(`https://api.etherscan.io/api?module=token&action=tokenholdercount&contractaddress=${address}`),
        ]);
        const contractData = await contractRes.json();
        const holderData = await holderRes.json();

        if (contractData?.result?.[0]) {
          const c = contractData.result[0];
          tokenName = c.ContractName || 'Unknown';
          if (c.SourceCode) safe.push('Source code verified');
          else risks.push('Source code not verified');
          if (c.Proxy === '1') risks.push('Proxy contract detected');
        }

        if (holderData?.result) {
          holderCount = parseInt(holderData.result);
          if (holderCount > 1000) safe.push(`${holderCount.toLocaleString()} holders`);
          else if (holderCount < 100) risks.push(`Low holder count: ${holderCount}`);
        }
      } catch (e) {
        risks.push('Could not fetch ERC-20 data');
      }
    }

    // Calculate safety score
    let score = 50; // base
    score += safe.length * 12;
    score -= risks.length * 18;
    if (holderCount > 5000) score += 10;
    if (age > 180) score += 10;
    score = Math.max(5, Math.min(98, score));

    res.json({
      address,
      network: isTron ? 'TRON (TRC-20)' : 'Ethereum (ERC-20)',
      tokenName,
      tokenSymbol,
      score,
      risks,
      safe,
      holderCount,
      liquidityUSD,
      age,
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Payment / Service Purchase ──────────────────────
const SERVICE_PRICES: Record<string, number> = {
  tokenScanner: 0.5,
  portfolio: 5,
  whale: 10,
  airdrop: 3,
  tax: 15,
  expert: 25,
};

app.post('/api/service/purchase', async (req, res) => {
  try {
    const { telegram_id, service_id, payment_method } = req.body;
    if (!telegram_id || !service_id) return res.status(400).json({ error: 'telegram_id and service_id required' });

    const price = SERVICE_PRICES[service_id];
    if (!price) return res.status(400).json({ error: 'Invalid service' });

    // Get user
    const { data: user, error: userError } = await supabase.from('users').select('*').eq('telegram_id', telegram_id).single();
    if (userError || !user) return res.status(404).json({ error: 'User not found' });

    if (payment_method === 'balance') {
      // Pay from Vanguard balance
      if ((user.balance || 0) < price) {
        return res.status(400).json({ error: 'Insufficient balance', needed: price, available: user.balance });
      }

      // Deduct balance
      await supabase.from('users').update({ balance: (user.balance || 0) - price }).eq('telegram_id', telegram_id);

      // Log transaction
      await supabase.from('transactions').insert({
        telegram_id,
        type: 'service_purchase',
        amount: price,
        details: `Purchased: ${service_id}`,
      });

      // Record purchase
      const expiry = new Date();
      expiry.setDate(expiry.getDate() + 30);
      await supabase.from('service_purchases').upsert({
        telegram_id,
        service_id,
        price,
        payment_method: 'balance',
        expires_at: expiry.toISOString(),
        status: 'active',
      }, { onConflict: 'telegram_id,service_id' });

      // Post to channel
      const userTag = user.username ? `@${user.username}` : (user.first_name || 'User');
      await postToChannel(`🛒 <b>Service Purchased!</b>\n\n👤 ${userTag}\n🔧 Service: <b>${service_id}</b>\n💵 Price: <b>${price} USDT</b>\n💳 Method: Balance\n\n🔗 <a href="${APP_URL}">Open Vanguard Staking</a>`);

      res.json({ success: true, newBalance: (user.balance || 0) - price, expiresAt: expiry.toISOString() });
    } else {
      // Direct USDT — mark as pending, admin verifies
      await supabase.from('service_purchases').upsert({
        telegram_id,
        service_id,
        price,
        payment_method: 'direct_usdt',
        status: 'pending_verification',
      }, { onConflict: 'telegram_id,service_id' });

      // Post to channel for admin
      const userTag = user.username ? `@${user.username}` : (user.first_name || 'User');
      await postToChannel(`🔔 <b>Payment Verification Needed!</b>\n\n👤 ${userTag}\n🔧 Service: <b>${service_id}</b>\n💵 Amount: <b>${price} USDT</b>\n💳 Method: Direct USDT\n\nAdmin: /admin to verify`);

      res.json({ success: true, status: 'pending_verification', message: 'Payment submitted. Admin will verify shortly.' });
    }
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Check Service Access ────────────────────────────
app.get('/api/service/access', async (req, res) => {
  try {
    const telegramIdStr = getParam(req.query.telegram_id);
    const serviceId = getParam(req.query.service_id);
    if (!telegramIdStr || !serviceId) return res.status(400).json({ error: 'telegram_id and service_id required' });

    const telegramId = parseInt(telegramIdStr, 10);
    const { data: purchase } = await supabase.from('service_purchases')
      .select('*')
      .eq('telegram_id', telegramId)
      .eq('service_id', serviceId)
      .eq('status', 'active')
      .single();

    if (purchase && new Date(purchase.expires_at) > new Date()) {
      res.json({ hasAccess: true, expiresAt: purchase.expires_at });
    } else {
      res.json({ hasAccess: false });
    }
  } catch (err: any) {
    res.json({ hasAccess: false });
  }
});

// ─── Crypto Prices (Real-time) ───────────────────────
app.get('/api/prices', async (_req, res) => {
  try {
    const priceRes = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=tether,bitcoin,ethereum,tron&vs_currencies=usd&include_24hr_change=true');
    const priceData = await priceRes.json();
    res.json({
      usdt: { price: priceData.tether?.usd || 1, change: priceData.tether?.usd_24h_change || 0 },
      btc: { price: priceData.bitcoin?.usd || 0, change: priceData.bitcoin?.usd_24h_change || 0 },
      eth: { price: priceData.ethereum?.usd || 0, change: priceData.ethereum?.usd_24h_change || 0 },
      trx: { price: priceData.tron?.usd || 0, change: priceData.tron?.usd_24h_change || 0 },
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.all('*', (_req, res) => res.status(404).json({ error: 'Not found' }));
export default app;
