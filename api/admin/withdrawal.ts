import { createClient } from '@supabase/supabase-js';
const supabase = createClient(process.env.SUPABASE_URL || '', process.env.SUPABASE_ANON_KEY || '');
export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });
  const adminId = parseInt(process.env.ADMIN_TELEGRAM_ID || '7010136281');
  const { telegram_id, withdrawal_id, action } = req.body;
  if (parseInt(telegram_id) !== adminId) return res.status(403).json({ error: 'Admin only' });
  const newStatus = action === 'approve' ? 'approved' : 'rejected';
  const { data, error } = await supabase.from('withdrawals').update({ status: newStatus }).eq('id', withdrawal_id).select().single();
  if (error) return res.status(500).json({ error: error.message });
  res.status(200).json(data);
}
