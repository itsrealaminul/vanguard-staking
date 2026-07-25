import { createClient } from '@supabase/supabase-js';
const supabase = createClient(process.env.SUPABASE_URL || '', process.env.SUPABASE_ANON_KEY || '');
export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });
  try {
    const { telegram_id, referrer_id } = req.body;
    if (!telegram_id || !referrer_id) return res.status(400).json({ error: 'telegram_id and referrer_id required' });
    if (telegram_id === referrer_id) return res.status(400).json({ error: 'Cannot refer yourself' });
    await supabase.from('users').update({ referrer_id }).eq('telegram_id', telegram_id);
    const { data: referrer } = await supabase.from('users').select('referrals_count, affiliate_balance').eq('telegram_id', referrer_id).single();
    if (referrer) await supabase.from('users').update({ referrals_count: (referrer.referrals_count || 0) + 1, affiliate_balance: (referrer.affiliate_balance || 0) + 1 }).eq('telegram_id', referrer_id);
    res.status(200).json({ success: true });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
}
