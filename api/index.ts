import express from 'express';
import cors from 'cors';
import { createClient } from '@supabase/supabase-js';

const app = express();
app.use(cors());
app.use(express.json());

const supabase = createClient(process.env.SUPABASE_URL || '', process.env.SUPABASE_ANON_KEY || '');
const APP_URL = process.env.APP_URL || 'https://vanguard-staking.vercel.app';

function getParam(val: any): string | undefined {
  if (typeof val === 'string') return val;
  if (Array.isArray(val)) return val[0];
  return undefined;
}

// Health
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', bot: 'Vanguard Staking Bot', appUrl: APP_URL });
});

// User
app.get('/api/user', async (req, res) => {
  try {
    const telegramId = parseInt(getParam(req.query.telegram_id) || '0');
    if (!telegramId) return res.status(400).json({ error: 'telegram_id required' });
    let { data: user, error } = await supabase.from('users').select('*').eq('telegram_id', telegramId).single();
    if (error && error.code === 'PGRST116') {
      const { data: newUser } = await supabase.from('users').insert({
        telegram_id: telegramId, username: getParam(req.query.username) || null,
        first_name: getParam(req.query.first_name) || null,
        balance: 0, affiliate_balance: 0, total_staked: 0, total_earned: 0, referrals_count: 0,
      }).select().single();
      user = newUser;
    } else if (error) throw error;
    res.json(user);
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

// Stakes
app.get('/api/stakes', async (req, res) => {
  try {
    const telegramId = parseInt(getParam(req.query.telegram_id) || '0');
    if (!telegramId) return res.status(400).json({ error: 'telegram_id required' });
    const { data } = await supabase.from('stakes').select('*').eq('telegram_id', telegramId).order('start_date', { ascending: false });
    res.json(data || []);
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

// Create Stake
app.post('/api/stakes', async (req, res) => {
  try {
    const { telegram_id, amount, plan_days, daily_rate } = req.body;
    if (!telegram_id || !amount || !plan_days || !daily_rate) return res.status(400).json({ error: 'Missing fields' });
    const startDate = new Date(); const endDate = new Date();
    endDate.setDate(endDate.getDate() + plan_days);
    const { data: stake } = await supabase.from('stakes').insert({
      telegram_id, amount, plan_days, daily_rate,
      start_date: startDate.toISOString(), end_date: endDate.toISOString(),
      last_reward_claim: startDate.toISOString(), status: 'active',
    }).select().single();
    const { data: user } = await supabase.from('users').select('total_staked').eq('telegram_id', telegram_id).single();
    if (user) await supabase.from('users').update({ total_staked: (user.total_staked || 0) + parseFloat(amount) }).eq('telegram_id', telegram_id);
    res.json(stake);
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

// Withdrawals
app.get('/api/withdrawals', async (req, res) => {
  try {
    const telegramId = parseInt(getParam(req.query.telegram_id) || '0');
    const { data } = await supabase.from('withdrawals').select('*').eq('telegram_id', telegramId).order('created_at', { ascending: false });
    res.json(data || []);
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

app.post('/api/withdrawals', async (req, res) => {
  try {
    const { telegram_id, amount, wallet_address } = req.body;
    const { data } = await supabase.from('withdrawals').insert({ telegram_id, amount, wallet_address, status: 'pending' }).select().single();
    res.json(data);
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

// Transactions
app.get('/api/transactions', async (req, res) => {
  try {
    const telegramId = parseInt(getParam(req.query.telegram_id) || '0');
    const { data } = await supabase.from('transactions').select('*').eq('telegram_id', telegramId).order('created_at', { ascending: false });
    res.json(data || []);
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

// Deposit
app.post('/api/deposit', async (req, res) => {
  try {
    const { telegram_id, amount, tx_hash } = req.body;
    if (!telegram_id || !amount) return res.status(400).json({ error: 'telegram_id and amount required' });
    const { data: user } = await supabase.from('users').select('balance').eq('telegram_id', telegram_id).single();
    const newBalance = (user?.balance || 0) + parseFloat(amount);
    await supabase.from('users').update({ balance: newBalance }).eq('telegram_id', telegram_id);
    await supabase.from('transactions').insert({ telegram_id, type: 'deposit', amount: parseFloat(amount), details: tx_hash || 'Manual' });
    res.json({ success: true, balance: newBalance });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

// Claim Reward
app.post('/api/claim-reward', async (req, res) => {
  try {
    const { telegram_id, stake_id } = req.body;
    if (!telegram_id || !stake_id) return res.status(400).json({ error: 'telegram_id and stake_id required' });
    const { data: stake } = await supabase.from('stakes').select('*').eq('id', stake_id).eq('telegram_id', telegram_id).single();
    if (!stake) return res.status(404).json({ error: 'Stake not found' });
    const now = new Date(); const lastClaim = new Date(stake.last_reward_claim);
    const daysSinceClaim = Math.floor((now.getTime() - lastClaim.getTime()) / 86400000);
    if (daysSinceClaim < 1) return res.status(400).json({ error: 'Can claim once per day' });
    const reward = parseFloat(stake.amount) * parseFloat(stake.daily_rate) * daysSinceClaim;
    await supabase.from('stakes').update({ last_reward_claim: now.toISOString() }).eq('id', stake_id);
    const { data: user } = await supabase.from('users').select('balance, total_earned').eq('telegram_id', telegram_id).single();
    if (user) await supabase.from('users').update({ balance: (user.balance || 0) + reward, total_earned: (user.total_earned || 0) + reward }).eq('telegram_id', telegram_id);
    await supabase.from('transactions').insert({ telegram_id, type: 'reward_claim', amount: reward, details: `Stake ${stake_id}` });
    res.json({ success: true, reward });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

// Referral
app.post('/api/referral', async (req, res) => {
  try {
    const { telegram_id, referrer_id } = req.body;
    await supabase.from('users').update({ referrer_id }).eq('telegram_id', telegram_id);
    const { data: ref } = await supabase.from('users').select('referrals_count, affiliate_balance').eq('telegram_id', referrer_id).single();
    if (ref) await supabase.from('users').update({ referrals_count: (ref.referrals_count || 0) + 1, affiliate_balance: (ref.affiliate_balance || 0) + 1 }).eq('telegram_id', referrer_id);
    res.json({ success: true });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

// ═══════════════════════════════════════════════════
// REAL-TIME GAS TRACKER
// ═══════════════════════════════════════════════════
app.get('/api/gas', async (_req, res) => {
  try {
    const results: any = { timestamp: new Date().toISOString() };
    try {
      const r = await fetch('https://api.etherscan.io/api?module=gastracker&action=gasoracle');
      const d = await r.json();
      if (d.status === '1') results.ethereum = { low: parseInt(d.result.SafeGasPrice), standard: parseInt(d.result.ProposeGasPrice), fast: parseInt(d.result.FastGasPrice), instant: Math.ceil(parseInt(d.result.FastGasPrice) * 1.5), unit: 'Gwei' };
    } catch { results.ethereum = { low: 15, standard: 25, fast: 40, instant: 60, unit: 'Gwei' }; }
    try {
      const r = await fetch('https://api.bscscan.com/api?module=gastracker&action=gasoracle');
      const d = await r.json();
      if (d.status === '1') results.bsc = { low: parseInt(d.result.SafeGasPrice), standard: parseInt(d.result.ProposeGasPrice), fast: parseInt(d.result.FastGasPrice), instant: Math.ceil(parseInt(d.result.FastGasPrice) * 1.5), unit: 'Gwei' };
    } catch { results.bsc = { low: 1, standard: 3, fast: 5, instant: 8, unit: 'Gwei' }; }
    try {
      const r = await fetch('https://api.trongrid.io/wallet/getchainparameters');
      const d = await r.json();
      const ef = d?.chainParameter?.find((p: any) => p.key === 'getEnergyFee')?.value || 420;
      results.tron = { low: Math.round(ef * 0.8), standard: ef, fast: Math.round(ef * 1.3), instant: Math.round(ef * 1.8), unit: 'Energy' };
    } catch { results.tron = { low: 340, standard: 420, fast: 550, instant: 750, unit: 'Energy' }; }
    try {
      const r = await fetch('https://api.polygonscan.com/api?module=gastracker&action=gasoracle');
      const d = await r.json();
      if (d.status === '1') results.polygon = { low: parseInt(d.result.SafeGasPrice), standard: parseInt(d.result.ProposeGasPrice), fast: parseInt(d.result.FastGasPrice), instant: Math.ceil(parseInt(d.result.FastGasPrice) * 1.5), unit: 'Gwei' };
    } catch { results.polygon = { low: 30, standard: 50, fast: 80, instant: 120, unit: 'Gwei' }; }
    res.setHeader('Cache-Control', 's-maxage=15, stale-while-revalidate');
    res.json(results);
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

// ═══════════════════════════════════════════════════
// REAL-TIME TOKEN SCANNER
// ═══════════════════════════════════════════════════
app.get('/api/scan', async (req, res) => {
  try {
    const address = getParam(req.query.address);
    if (!address) return res.status(400).json({ error: 'address required' });
    const isTron = address.startsWith('T');
    const risks: string[] = []; const safe: string[] = [];
    let holderCount = 0, age = 0, tokenName = 'Unknown', tokenSymbol = '???';
    if (isTron) {
      try {
        const [cRes, iRes] = await Promise.all([fetch(`https://api.trongrid.io/v1/contracts/${address}`), fetch(`https://apilist.tronscanapi.com/api/token_trc20?contract=${address}`)]);
        const cData = await cRes.json(); const iData = await iRes.json();
        if (cData?.data?.[0]) { tokenName = cData.data[0].name || 'Unknown'; tokenSymbol = cData.data[0].symbol || '???'; if (cData.data[0].verified) safe.push('Contract verified'); else risks.push('Not verified'); }
        if (iData?.trc20_tokens?.[0]) { holderCount = parseInt(iData.trc20_tokens[0].holders_count || '0'); if (holderCount > 1000) safe.push(`${holderCount.toLocaleString()} holders`); else if (holderCount < 100) risks.push(`Low holders: ${holderCount}`); }
        const txRes = await fetch(`https://api.trongrid.io/v1/contracts/${address}/transactions?limit=1&order_by=block_timestamp,asc`);
        const txData = await txRes.json();
        if (txData?.data?.[0]?.block_timestamp) { age = Math.floor((Date.now() - txData.data[0].block_timestamp) / 86400000); if (age > 30) safe.push(`Age: ${age} days`); else risks.push(`New: ${age} days`); }
      } catch { risks.push('Could not fetch TRC-20 data'); }
    }
    let score = 50 + safe.length * 12 - risks.length * 18;
    if (holderCount > 5000) score += 10; if (age > 180) score += 10;
    score = Math.max(5, Math.min(98, score));
    res.json({ address, network: isTron ? 'TRON (TRC-20)' : 'Ethereum (ERC-20)', tokenName, tokenSymbol, score, risks, safe, holderCount, liquidityUSD: 0, age, timestamp: new Date().toISOString() });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

// ═══════════════════════════════════════════════════
// CRYPTO PRICES
// ═══════════════════════════════════════════════════
app.get('/api/prices', async (_req, res) => {
  try {
    const r = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=tether,bitcoin,ethereum,tron&vs_currencies=usd&include_24hr_change=true');
    const d = await r.json();
    res.json({
      usdt: { price: d.tether?.usd || 1, change: d.tether?.usd_24h_change || 0 },
      btc: { price: d.bitcoin?.usd || 0, change: d.bitcoin?.usd_24h_change || 0 },
      eth: { price: d.ethereum?.usd || 0, change: d.ethereum?.usd_24h_change || 0 },
      trx: { price: d.tron?.usd || 0, change: d.tron?.usd_24h_change || 0 },
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

// Service Access
app.get('/api/service/access', async (req, res) => {
  try {
    const telegramId = parseInt(getParam(req.query.telegram_id) || '0');
    const serviceId = getParam(req.query.service_id);
    if (!telegramId || !serviceId) return res.status(400).json({ error: 'telegram_id and service_id required' });
    const { data: purchase } = await supabase.from('service_purchases').select('*').eq('telegram_id', telegramId).eq('service_id', serviceId).eq('status', 'active').single();
    if (purchase && (!purchase.expires_at || new Date(purchase.expires_at) > new Date())) {
      return res.json({ hasAccess: true, expiresAt: purchase.expires_at });
    }
    res.json({ hasAccess: false });
  } catch { res.json({ hasAccess: false }); }
});

// Service Purchase
app.post('/api/service/purchase', async (req, res) => {
  try {
    const { telegram_id, service_id, payment_method } = req.body;
    if (!telegram_id || !service_id) return res.status(400).json({ error: 'telegram_id and service_id required' });
    const PRICES: Record<string, number> = { tokenScanner: 0.5, portfolio: 5, whale: 10, airdrop: 3, tax: 15, expert: 25 };
    const price = PRICES[service_id];
    if (!price) return res.status(400).json({ error: 'Invalid service' });
    const { data: user } = await supabase.from('users').select('*').eq('telegram_id', telegram_id).single();
    if (!user) return res.status(404).json({ error: 'User not found' });
    if (payment_method === 'balance') {
      if ((user.balance || 0) < price) return res.status(400).json({ error: 'Insufficient balance', needed: price, available: user.balance });
      const newBalance = (user.balance || 0) - price;
      await supabase.from('users').update({ balance: newBalance }).eq('telegram_id', telegram_id);
      await supabase.from('transactions').insert({ telegram_id, type: 'service_purchase', amount: price, details: `Purchased: ${service_id}` });
      const expiry = new Date(); expiry.setDate(expiry.getDate() + 30);
      try { await supabase.from('service_purchases').upsert({ telegram_id, service_id, price, payment_method: 'balance', status: 'active', expires_at: expiry.toISOString() }, { onConflict: 'telegram_id,service_id' }); } catch {}
      return res.json({ success: true, newBalance, expiresAt: expiry.toISOString() });
    }
    try { await supabase.from('service_purchases').upsert({ telegram_id, service_id, price, payment_method: 'direct_usdt', status: 'pending' }, { onConflict: 'telegram_id,service_id' }); } catch {}
    res.json({ success: true, status: 'pending', message: 'Payment submitted. Admin will verify.' });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

// Service Verify (Admin)
app.post('/api/service/verify', async (req, res) => {
  try {
    const adminId = parseInt(process.env.ADMIN_TELEGRAM_ID || '7010136281');
    const { telegram_id, admin_telegram_id, service_id, action } = req.body;
    if (parseInt(admin_telegram_id) !== adminId) return res.status(403).json({ error: 'Admin only' });
    const expiry = new Date(); expiry.setDate(expiry.getDate() + 30);
    if (action === 'approve') {
      await supabase.from('service_purchases').update({ status: 'active', expires_at: expiry.toISOString() }).eq('telegram_id', parseInt(telegram_id)).eq('service_id', service_id);
      return res.json({ success: true, message: 'Approved' });
    }
    await supabase.from('service_purchases').update({ status: 'rejected' }).eq('telegram_id', parseInt(telegram_id)).eq('service_id', service_id);
    res.json({ success: true, message: 'Rejected' });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

// Admin Routes
app.get('/api/admin/users', async (req, res) => {
  const adminId = parseInt(process.env.ADMIN_TELEGRAM_ID || '7010136281');
  if (parseInt(getParam(req.query.telegram_id) || '0') !== adminId) return res.status(403).json({ error: 'Admin only' });
  const { data } = await supabase.from('users').select('*').order('created_at', { ascending: false });
  res.json(data || []);
});

app.get('/api/admin/withdrawals', async (req, res) => {
  const adminId = parseInt(process.env.ADMIN_TELEGRAM_ID || '7010136281');
  if (parseInt(getParam(req.query.telegram_id) || '0') !== adminId) return res.status(403).json({ error: 'Admin only' });
  const { data } = await supabase.from('withdrawals').select('*').order('created_at', { ascending: false });
  res.json(data || []);
});

app.post('/api/admin/withdrawal', async (req, res) => {
  const adminId = parseInt(process.env.ADMIN_TELEGRAM_ID || '7010136281');
  const { telegram_id, withdrawal_id, action } = req.body;
  if (parseInt(telegram_id) !== adminId) return res.status(403).json({ error: 'Admin only' });
  const newStatus = action === 'approve' ? 'approved' : 'rejected';
  const { data } = await supabase.from('withdrawals').update({ status: newStatus }).eq('id', withdrawal_id).select().single();
  res.json(data);
});

app.all('*', (_req, res) => res.status(404).json({ error: 'Not found' }));
export default app;
