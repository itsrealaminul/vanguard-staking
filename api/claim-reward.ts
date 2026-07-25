import { createClient } from '@supabase/supabase-js';
const supabase = createClient(process.env.SUPABASE_URL || '', process.env.SUPABASE_ANON_KEY || '');
export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });
  try {
    const { telegram_id, stake_id } = req.body;
    if (!telegram_id || !stake_id) return res.status(400).json({ error: 'telegram_id and stake_id required' });
    const { data: stake } = await supabase.from('stakes').select('*').eq('id', stake_id).eq('telegram_id', telegram_id).single();
    if (!stake) return res.status(404).json({ error: 'Stake not found' });
    const now = new Date();
    const lastClaim = new Date(stake.last_reward_claim);
    const daysSinceClaim = Math.floor((now.getTime() - lastClaim.getTime()) / (1000 * 60 * 60 * 24));
    if (daysSinceClaim < 1) return res.status(400).json({ error: 'Can claim once per day' });
    const reward = parseFloat(stake.amount) * parseFloat(stake.daily_rate) * daysSinceClaim;
    await supabase.from('stakes').update({ last_reward_claim: now.toISOString() }).eq('id', stake_id);
    const { data: user } = await supabase.from('users').select('balance, total_earned').eq('telegram_id', telegram_id).single();
    if (user) await supabase.from('users').update({ balance: (user.balance || 0) + reward, total_earned: (user.total_earned || 0) + reward }).eq('telegram_id', telegram_id);
    await supabase.from('transactions').insert({ telegram_id, type: 'reward_claim', amount: reward, details: `Claimed from stake ${stake_id}` });
    res.status(200).json({ success: true, reward });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
}
