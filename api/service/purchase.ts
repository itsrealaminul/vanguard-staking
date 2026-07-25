import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_ANON_KEY || ''
);

const SERVICE_PRICES: Record<string, number> = {
  tokenScanner: 0.5, portfolio: 5, whale: 10, airdrop: 3, tax: 15, expert: 25,
};

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });

  try {
    const { telegram_id, service_id, payment_method } = req.body;
    if (!telegram_id || !service_id) return res.status(400).json({ error: 'telegram_id and service_id required' });

    const price = SERVICE_PRICES[service_id];
    if (!price) return res.status(400).json({ error: 'Invalid service' });

    const { data: user } = await supabase.from('users').select('*').eq('telegram_id', telegram_id).single();
    if (!user) return res.status(404).json({ error: 'User not found' });

    if (payment_method === 'balance') {
      if ((user.balance || 0) < price) {
        return res.status(400).json({ error: 'Insufficient balance', needed: price, available: user.balance });
      }

      await supabase.from('users').update({ balance: (user.balance || 0) - price }).eq('telegram_id', telegram_id);
      await supabase.from('transactions').insert({
        telegram_id, type: 'service_purchase', amount: price,
        details: `Purchased: ${service_id}`,
      });

      const expiry = new Date();
      expiry.setDate(expiry.getDate() + 30);

      // Try to create service_purchases table entry (table may not exist yet)
      try {
        await supabase.from('service_purchases').upsert({
          telegram_id, service_id, price,
          payment_method: 'balance',
          expires_at: expiry.toISOString(),
          status: 'active',
        }, { onConflict: 'telegram_id,service_id' });
      } catch { /* table might not exist */ }

      return res.status(200).json({ success: true, newBalance: (user.balance || 0) - price, expiresAt: expiry.toISOString() });
    } else {
      // Direct USDT
      try {
        await supabase.from('service_purchases').upsert({
          telegram_id, service_id, price,
          payment_method: 'direct_usdt',
          status: 'pending_verification',
        }, { onConflict: 'telegram_id,service_id' });
      } catch { /* table might not exist */ }

      return res.status(200).json({ success: true, status: 'pending_verification', message: 'Payment submitted. Admin will verify.' });
    }
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}
