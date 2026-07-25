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

export async function submitDeposit(telegramId: number, amount: number, txHash?: string) {
  const res = await fetch(`${API_BASE}/deposit`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ telegram_id: telegramId, amount, tx_hash: txHash }),
  });
  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.error || `Failed to deposit: ${res.status}`);
  }
  return res.json();
}

// ─── Real-time Gas Tracker ───────────────────────────
export async function fetchGasPrices() {
  const res = await fetch(`${API_BASE}/gas`);
  if (!res.ok) throw new Error(`Failed to fetch gas: ${res.status}`);
  return res.json();
}

// ─── Real-time Token Scanner ─────────────────────────
export async function scanToken(address: string) {
  const res = await fetch(`${API_BASE}/scan?address=${encodeURIComponent(address)}`);
  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.error || `Failed to scan: ${res.status}`);
  }
  return res.json();
}

// ─── Crypto Prices ───────────────────────────────────
export async function fetchPrices() {
  const res = await fetch(`${API_BASE}/prices`);
  if (!res.ok) throw new Error(`Failed to fetch prices: ${res.status}`);
  return res.json();
}

// ─── Service Purchase ────────────────────────────────
export async function purchaseService(telegramId: number, serviceId: string, paymentMethod: 'balance' | 'direct') {
  const res = await fetch(`${API_BASE}/service/purchase`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ telegram_id: telegramId, service_id: serviceId, payment_method: paymentMethod }),
  });
  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.error || `Failed to purchase: ${res.status}`);
  }
  return res.json();
}

// ─── Check Service Access ────────────────────────────
export async function checkServiceAccess(telegramId: number, serviceId: string) {
  const res = await fetch(`${API_BASE}/service/access?telegram_id=${telegramId}&service_id=${serviceId}`);
  if (!res.ok) return { hasAccess: false };
  return res.json();
}
