const API_BASE = '/api';

export async function fetchUser(telegramId: number, username?: string, firstName?: string) {
  const params = new URLSearchParams({ telegram_id: String(telegramId) });
  if (username) params.set('username', username);
  if (firstName) params.set('first_name', firstName);
  const res = await fetch(`${API_BASE}/user?${params}`);
  if (!res.ok) throw new Error(`Failed to fetch user: ${res.status}`);
  return res.json();
}

export async function updateUser(telegramId: number, updates: Record<string, any>) {
  const res = await fetch(`${API_BASE}/user`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ telegram_id: telegramId, ...updates }),
  });
  if (!res.ok) throw new Error(`Failed to update user: ${res.status}`);
  return res.json();
}

export async function fetchStakes(telegramId: number) {
  const res = await fetch(`${API_BASE}/stakes?telegram_id=${telegramId}`);
  if (!res.ok) throw new Error(`Failed to fetch stakes: ${res.status}`);
  return res.json();
}

export async function createStake(telegramId: number, amount: number, planDays: number, dailyRate: number) {
  const res = await fetch(`${API_BASE}/stakes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ telegram_id: telegramId, amount, plan_days: planDays, daily_rate: dailyRate }),
  });
  if (!res.ok) throw new Error(`Failed to create stake: ${res.status}`);
  return res.json();
}

export async function fetchWithdrawals(telegramId: number) {
  const res = await fetch(`${API_BASE}/withdrawals?telegram_id=${telegramId}`);
  if (!res.ok) throw new Error(`Failed to fetch withdrawals: ${res.status}`);
  return res.json();
}

export async function requestWithdrawal(telegramId: number, amount: number, walletAddress: string) {
  const res = await fetch(`${API_BASE}/withdrawals`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ telegram_id: telegramId, amount, wallet_address: walletAddress }),
  });
  if (!res.ok) throw new Error(`Failed to request withdrawal: ${res.status}`);
  return res.json();
}

export async function fetchTransactions(telegramId: number) {
  const res = await fetch(`${API_BASE}/transactions?telegram_id=${telegramId}`);
  if (!res.ok) throw new Error(`Failed to fetch transactions: ${res.status}`);
  return res.json();
}

export async function claimReward(telegramId: number, stakeId: string) {
  const res = await fetch(`${API_BASE}/claim-reward`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ telegram_id: telegramId, stake_id: stakeId }),
  });
  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.error || `Failed to claim: ${res.status}`);
  }
  return res.json();
}
