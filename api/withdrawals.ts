import { createClient } from '@supabase/supabase-js';
const supabase = createClient(process.env.SUPABASE_URL || '', process.env.SUPABASE_ANON_KEY || '');
export default async function handler(req: any, res: any) {
  const telegramId = parseInt(req.query.telegram_id || req.body?.telegram_id || '0');
  if (req.method === 'GET') {
    if (!telegramId) return res.status(400).json({ error: 'telegram_id required' });
    const { data } = await supabase.from('withdrawals').select('*').eq('telegram_id', telegramId).order('created_at', { ascending: false });
    return res.status(200).json(data || []);
  }
  if (req.method === 'POST') {
    const { amount, wallet_address } = req.body;
    if (!telegramId || !amount || !wallet_address) return res.status(400).json({ error: 'Missing fields' });
    const { data, error } = await supabase.from('withdrawals').insert({ telegram_id: telegramId, amount, wallet_address, status: 'pending' }).select().single();
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json(data);
  }
  res.status(405).json({ error: 'Method not allowed' });
}
