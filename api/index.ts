import express from 'express';
import cors from 'cors';
import { createClient } from '@supabase/supabase-js';

const app = express();
app.use(cors());
app.use(express.json());

const supabase = createClient(
  process.env.SUPABASE_URL || 'https://sudpqfzogswuvhoblbyj.supabase.co',
  process.env.SUPABASE_ANON_KEY || 'sb_publishable_uOQ1Hu1Q3v_WZqxrT4lNAA_MxJ7NiuL'
);

// Helper to safely get query param as string
function getParam(val: any): string | undefined {
  if (typeof val === 'string') return val;
  if (Array.isArray(val)) return val[0] as string;
  return undefined;
}

// ─── Health ───────────────────────────────────────────
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    bot: 'Vanguard Staking Bot',
    appUrl: process.env.APP_URL || 'https://applet-orcin.vercel.app',
  });
});

// ─── Get or Create User ───────────────────────────────
app.get('/api/user', async (req, res) => {
  try {
    const telegramIdStr = getParam(req.query.telegram_id);
    if (!telegramIdStr) return res.status(400).json({ error: 'telegram_id required' });
    const telegramId = parseInt(telegramIdStr, 10);

    let { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('telegram_id', telegramId)
      .single();

    if (error && error.code === 'PGRST116') {
      const { data: newUser, error: insertError } = await supabase
        .from('users')
        .insert({
          telegram_id: telegramId,
          username: getParam(req.query.username) || null,
          first_name: getParam(req.query.first_name) || null,
          balance: 0,
          affiliate_balance: 0,
          total_staked: 0,
          total_earned: 0,
          referrals_count: 0,
        })
        .select()
        .single();

      if (insertError) throw insertError;
      user = newUser;
    } else if (error) {
      throw error;
    }

    res.json(user);
  } catch (err: any) {
    console.error('GET /api/user error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ─── Update User ──────────────────────────────────────
app.post('/api/user', async (req, res) => {
  try {
    const { telegram_id, ...updates } = req.body;
    if (!telegram_id) return res.status(400).json({ error: 'telegram_id required' });

    const { data, error } = await supabase
      .from('users')
      .update(updates)
      .eq('telegram_id', telegram_id)
      .select()
      .single();

    if (error) throw error;
    res.json(data);
  } catch (err: any) {
    console.error('POST /api/user error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ─── Get Stakes ───────────────────────────────────────
app.get('/api/stakes', async (req, res) => {
  try {
    const telegramIdStr = getParam(req.query.telegram_id);
    if (!telegramIdStr) return res.status(400).json({ error: 'telegram_id required' });
    const telegramId = parseInt(telegramIdStr, 10);

    const { data, error } = await supabase
      .from('stakes')
      .select('*')
      .eq('telegram_id', telegramId)
      .order('start_date', { ascending: false });

    if (error) throw error;
    res.json(data || []);
  } catch (err: any) {
    console.error('GET /api/stakes error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ─── Create Stake ─────────────────────────────────────
app.post('/api/stakes', async (req, res) => {
  try {
    const { telegram_id, amount, plan_days, daily_rate } = req.body;
    if (!telegram_id || !amount || !plan_days || !daily_rate) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + plan_days);

    const { data: stake, error } = await supabase
      .from('stakes')
      .insert({
        telegram_id,
        amount,
        plan_days,
        daily_rate,
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString(),
        last_reward_claim: startDate.toISOString(),
        status: 'active',
      })
      .select()
      .single();

    if (error) throw error;

    // Update user total_staked
    const { data: user } = await supabase
      .from('users')
      .select('total_staked')
      .eq('telegram_id', telegram_id)
      .single();

    if (user) {
      await supabase
        .from('users')
        .update({ total_staked: (user.total_staked || 0) + parseFloat(amount) })
        .eq('telegram_id', telegram_id);
    }

    res.json(stake);
  } catch (err: any) {
    console.error('POST /api/stakes error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ─── Withdrawals ──────────────────────────────────────
app.get('/api/withdrawals', async (req, res) => {
  try {
    const telegramIdStr = getParam(req.query.telegram_id);
    if (!telegramIdStr) return res.status(400).json({ error: 'telegram_id required' });
    const telegramId = parseInt(telegramIdStr, 10);

    const { data, error } = await supabase
      .from('withdrawals')
      .select('*')
      .eq('telegram_id', telegramId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json(data || []);
  } catch (err: any) {
    console.error('GET /api/withdrawals error:', err);
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/withdrawals', async (req, res) => {
  try {
    const { telegram_id, amount, wallet_address } = req.body;
    if (!telegram_id || !amount || !wallet_address) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const { data, error } = await supabase
      .from('withdrawals')
      .insert({ telegram_id, amount, wallet_address, status: 'pending' })
      .select()
      .single();

    if (error) throw error;
    res.json(data);
  } catch (err: any) {
    console.error('POST /api/withdrawals error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ─── Transactions ─────────────────────────────────────
app.get('/api/transactions', async (req, res) => {
  try {
    const telegramIdStr = getParam(req.query.telegram_id);
    if (!telegramIdStr) return res.status(400).json({ error: 'telegram_id required' });
    const telegramId = parseInt(telegramIdStr, 10);

    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('telegram_id', telegramId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json(data || []);
  } catch (err: any) {
    console.error('GET /api/transactions error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ─── Claim Rewards ────────────────────────────────────
app.post('/api/claim-reward', async (req, res) => {
  try {
    const { telegram_id, stake_id } = req.body;
    if (!telegram_id || !stake_id) {
      return res.status(400).json({ error: 'telegram_id and stake_id required' });
    }

    const { data: stake, error: stakeError } = await supabase
      .from('stakes')
      .select('*')
      .eq('id', stake_id)
      .eq('telegram_id', telegram_id)
      .single();

    if (stakeError) throw stakeError;
    if (!stake) return res.status(404).json({ error: 'Stake not found' });

    const now = new Date();
    const lastClaim = new Date(stake.last_reward_claim);
    const daysSinceClaim = Math.floor((now.getTime() - lastClaim.getTime()) / (1000 * 60 * 60 * 24));

    if (daysSinceClaim < 1) {
      return res.status(400).json({ error: 'Can claim once per day' });
    }

    const reward = parseFloat(stake.amount) * parseFloat(stake.daily_rate) * daysSinceClaim;

    // Update stake last_reward_claim
    await supabase
      .from('stakes')
      .update({ last_reward_claim: now.toISOString() })
      .eq('id', stake_id);

    // Update user balance
    const { data: user } = await supabase
      .from('users')
      .select('balance, total_earned')
      .eq('telegram_id', telegram_id)
      .single();

    if (user) {
      await supabase
        .from('users')
        .update({
          balance: (user.balance || 0) + reward,
          total_earned: (user.total_earned || 0) + reward,
        })
        .eq('telegram_id', telegram_id);
    }

    // Log transaction
    await supabase.from('transactions').insert({
      telegram_id,
      type: 'reward_claim',
      amount: reward,
      details: `Claimed ${reward.toFixed(4)} from stake ${stake_id}`,
    });

    res.json({ success: true, reward });
  } catch (err: any) {
    console.error('POST /api/claim-reward error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ─── Referral ─────────────────────────────────────────
app.post('/api/referral', async (req, res) => {
  try {
    const { telegram_id, referrer_id } = req.body;
    if (!telegram_id || !referrer_id) {
      return res.status(400).json({ error: 'telegram_id and referrer_id required' });
    }
    if (telegram_id === referrer_id) {
      return res.status(400).json({ error: 'Cannot refer yourself' });
    }

    const { error } = await supabase
      .from('users')
      .update({ referrer_id })
      .eq('telegram_id', telegram_id);

    if (error) throw error;

    const { data: referrer } = await supabase
      .from('users')
      .select('referrals_count, affiliate_balance')
      .eq('telegram_id', referrer_id)
      .single();

    if (referrer) {
      const bonus = 1;
      await supabase
        .from('users')
        .update({
          referrals_count: (referrer.referrals_count || 0) + 1,
          affiliate_balance: (referrer.affiliate_balance || 0) + bonus,
        })
        .eq('telegram_id', referrer_id);
    }

    res.json({ success: true });
  } catch (err: any) {
    console.error('POST /api/referral error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ─── Admin: Get All Users ─────────────────────────────
app.get('/api/admin/users', async (req, res) => {
  try {
    const adminId = parseInt(process.env.ADMIN_TELEGRAM_ID || '7010136281');
    const requestorIdStr = getParam(req.query.telegram_id);
    const requestorId = requestorIdStr ? parseInt(requestorIdStr, 10) : 0;

    if (requestorId !== adminId) {
      return res.status(403).json({ error: 'Admin only' });
    }

    const { data, error } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json(data || []);
  } catch (err: any) {
    console.error('GET /api/admin/users error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ─── Admin: Get All Withdrawals ───────────────────────
app.get('/api/admin/withdrawals', async (req, res) => {
  try {
    const adminId = parseInt(process.env.ADMIN_TELEGRAM_ID || '7010136281');
    const requestorIdStr = getParam(req.query.telegram_id);
    const requestorId = requestorIdStr ? parseInt(requestorIdStr, 10) : 0;

    if (requestorId !== adminId) {
      return res.status(403).json({ error: 'Admin only' });
    }

    const { data, error } = await supabase
      .from('withdrawals')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json(data || []);
  } catch (err: any) {
    console.error('GET /api/admin/withdrawals error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ─── Admin: Approve/Reject Withdrawal ─────────────────
app.post('/api/admin/withdrawal', async (req, res) => {
  try {
    const adminId = parseInt(process.env.ADMIN_TELEGRAM_ID || '7010136281');
    const { telegram_id, withdrawal_id, action } = req.body;

    if (parseInt(telegram_id) !== adminId) {
      return res.status(403).json({ error: 'Admin only' });
    }

    const newStatus = action === 'approve' ? 'approved' : 'rejected';

    const { data, error } = await supabase
      .from('withdrawals')
      .update({ status: newStatus })
      .eq('id', withdrawal_id)
      .select()
      .single();

    if (error) throw error;
    res.json(data);
  } catch (err: any) {
    console.error('POST /api/admin/withdrawal error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ─── Fallback ─────────────────────────────────────────
app.all('*', (_req, res) => {
  res.status(404).json({ error: 'Not found' });
});

export default app;
