import { createClient } from '@supabase/supabase-js';
const supabase = createClient(process.env.SUPABASE_URL || '', process.env.SUPABASE_ANON_KEY || '');
const CHANNEL_ID = process.env.CHANNEL_ID || '';
const APP_URL = process.env.APP_URL || '';
const BOT_TOKEN = process.env.BOT_TOKEN || '';
let bot: any = null;
try { const TB = (await import('node-telegram-bot-api')).default; if (BOT_TOKEN) bot = new TB(BOT_TOKEN, { polling: false }); } catch {}
async function postToChannel(msg: string) { if (bot && CHANNEL_ID) { try { await bot.sendMessage(CHANNEL_ID, msg, { parse_mode: 'HTML' }); } catch {} } }
export default async function handler(req: any, res: any) {
  if (req.method === 'GET') {
    const telegramId = parseInt(req.query.telegram_id || '0');
    if (!telegramId) return res.status(400).json({ error: 'telegram_id required' });
    try {
      const { data, error } = await supabase.from('stakes').select('*').eq('telegram_id', telegramId).order('start_date', { ascending: false });
      if (error) throw error;
      return res.status(200).json(data || []);
    } catch (err: any) { return res.status(500).json({ error: err.message }); }
  }
  if (req.method === 'POST') {
    try {
      const { telegram_id, amount, plan_days, daily_rate } = req.body;
      if (!telegram_id || !amount || !plan_days || !daily_rate) return res.status(400).json({ error: 'Missing fields' });
      const startDate = new Date();
      const endDate = new Date(); endDate.setDate(endDate.getDate() + plan_days);
      const { data: stake, error } = await supabase.from('stakes').insert({
        telegram_id, amount, plan_days, daily_rate,
        start_date: startDate.toISOString(), end_date: endDate.toISOString(),
        last_reward_claim: startDate.toISOString(), status: 'active',
      }).select().single();
      if (error) throw error;
      const { data: user } = await supabase.from('users').select('total_staked, username, first_name').eq('telegram_id', telegram_id).single();
      if (user) await supabase.from('users').update({ total_staked: (user.total_staked || 0) + parseFloat(amount) }).eq('telegram_id', telegram_id);
      const userTag = user?.username ? `@${user.username}` : (user?.first_name || 'User');
      await postToChannel(`🔒 <b>New Stake!</b>\n\n👤 ${userTag}\n💵 ${parseFloat(amount).toFixed(2)} USDT\n📅 ${plan_days} days`);
      return res.status(200).json(stake);
    } catch (err: any) { return res.status(500).json({ error: err.message }); }
  }
  res.status(405).json({ error: 'Method not allowed' });
}
