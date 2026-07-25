import { createClient } from '@supabase/supabase-js';
const supabase = createClient(process.env.SUPABASE_URL || '', process.env.SUPABASE_ANON_KEY || '');
export default async function handler(req: any, res: any) {
  const telegramId = parseInt(req.query.telegram_id || '0');
  if (!telegramId) return res.status(400).json({ error: 'telegram_id required' });
  const { data } = await supabase.from('transactions').select('*').eq('telegram_id', telegramId).order('created_at', { ascending: false });
  res.status(200).json(data || []);
}
