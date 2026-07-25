import { createClient } from '@supabase/supabase-js';
const supabase = createClient(process.env.SUPABASE_URL || '', process.env.SUPABASE_ANON_KEY || '');
const CHANNEL_ID = process.env.CHANNEL_ID || '';
const APP_URL = process.env.APP_URL || '';
export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });
  try {
    const { telegram_id, amount, tx_hash } = req.body;
    if (!telegram_id || !amount) return res.status(400).json({ error: 'telegram_id and amount required' });
    const { data: user } = await supabase.from('users').select('balance, username, first_name').eq('telegram_id', telegram_id).single();
    const newBalance = (user?.balance || 0) + parseFloat(amount);
    await supabase.from('users').update({ balance: newBalance }).eq('telegram_id', telegram_id);
    await supabase.from('transactions').insert({ telegram_id, type: 'deposit', amount: parseFloat(amount), details: tx_hash ? `TX: ${tx_hash}` : 'Manual deposit' });
    res.status(200).json({ success: true, balance: newBalance });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
}
