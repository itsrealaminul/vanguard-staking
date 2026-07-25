import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_ANON_KEY || ''
);

export default async function handler(req: any, res: any) {
  try {
    const telegramId = parseInt(req.query.telegram_id || '0');
    const serviceId = req.query.service_id;
    if (!telegramId || !serviceId) return res.status(400).json({ error: 'telegram_id and service_id required' });

    try {
      const { data: purchase } = await supabase.from('service_purchases')
        .select('*')
        .eq('telegram_id', telegramId)
        .eq('service_id', serviceId)
        .eq('status', 'active')
        .single();

      if (purchase && new Date(purchase.expires_at) > new Date()) {
        return res.status(200).json({ hasAccess: true, expiresAt: purchase.expires_at });
      }
    } catch { /* table might not exist or no rows */ }

    res.status(200).json({ hasAccess: false });
  } catch (err: any) {
    res.status(200).json({ hasAccess: false });
  }
}
