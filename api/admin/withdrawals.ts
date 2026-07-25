import { createClient } from '@supabase/supabase-js';
const supabase = createClient(process.env.SUPABASE_URL || '', process.env.SUPABASE_ANON_KEY || '');
export default async function handler(req: any, res: any) {
  const adminId = parseInt(process.env.ADMIN_TELEGRAM_ID || '7010136281');
  if (parseInt(req.query.telegram_id || '0') !== adminId) return res.status(403).json({ error: 'Admin only' });
  const { data } = await supabase.from('withdrawals').select('*').order('created_at', { ascending: false });
  res.status(200).json(data || []);
}
