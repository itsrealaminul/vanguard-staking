import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_ANON_KEY || ''
);

export default async function handler(req: any, res: any) {
  const telegramId = parseInt(req.query.telegram_id || '0');
  const username = req.query.username;
  const firstName = req.query.first_name;

  if (!telegramId) return res.status(400).json({ error: 'telegram_id required' });

  try {
    let { data: user, error } = await supabase.from('users').select('*').eq('telegram_id', telegramId).single();
    if (error && error.code === 'PGRST116') {
      const { data: newUser, error: insertError } = await supabase.from('users').insert({
        telegram_id: telegramId,
        username: username || null,
        first_name: firstName || null,
        balance: 0, affiliate_balance: 0, total_staked: 0, total_earned: 0, referrals_count: 0,
      }).select().single();
      if (insertError) throw insertError;
      user = newUser;
    } else if (error) {
      throw error;
    }
    res.status(200).json(user);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}
