import { useState, useEffect, useCallback } from 'react';
import { fetchUser, fetchStakes, createStake, fetchTransactions, fetchWithdrawals, requestWithdrawal, claimReward } from './api';

declare global {
  interface Window {
    Telegram?: {
      WebApp?: {
        initDataUnsafe?: {
          user?: {
            id: number;
            first_name?: string;
            last_name?: string;
            username?: string;
          };
        };
        ready: () => void;
        expand: () => void;
        close: () => void;
      };
    };
  }
}

const tg = window.Telegram?.WebApp;
const TELEGRAM_ID = tg?.initDataUnsafe?.user?.id || 7010136281;
const USERNAME = tg?.initDataUnsafe?.user?.username || '';
const FIRST_NAME = tg?.initDataUnsafe?.user?.first_name || 'User';

const STAKE_PLANS = [
  { name: 'Starter', days: 7, dailyRate: 0.01, minAmount: 10, emoji: '🌱' },
  { name: 'Growth', days: 14, dailyRate: 0.015, minAmount: 50, emoji: '📈' },
  { name: 'Pro', days: 30, dailyRate: 0.02, minAmount: 100, emoji: '🔥' },
  { name: 'Elite', days: 90, dailyRate: 0.03, minAmount: 500, emoji: '💎' },
];

type Tab = 'dashboard' | 'stake' | 'stakes' | 'deposit' | 'withdraw' | 'history' | 'referral';

function App() {
  const [tab, setTab] = useState<Tab>('dashboard');
  const [user, setUser] = useState<any>(null);
  const [stakes, setStakes] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showStakeModal, setShowStakeModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<any>(null);
  const [stakeAmount, setStakeAmount] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [walletAddress, setWalletAddress] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    tg?.ready();
    tg?.expand();
    loadData();
  }, []);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [userData, stakesData, txData, wdData] = await Promise.all([
        fetchUser(TELEGRAM_ID, USERNAME, FIRST_NAME),
        fetchStakes(TELEGRAM_ID),
        fetchTransactions(TELEGRAM_ID),
        fetchWithdrawals(TELEGRAM_ID),
      ]);
      setUser(userData);
      setStakes(stakesData);
      setTransactions(txData);
      setWithdrawals(wdData);
    } catch (err) {
      console.error('Load error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const showMsg = (msg: string) => {
    setMessage(msg);
    setTimeout(() => setMessage(''), 3000);
  };

  const handleStake = async () => {
    if (!selectedPlan || !stakeAmount) return;
    const amount = parseFloat(stakeAmount);
    if (isNaN(amount) || amount < selectedPlan.minAmount) {
      showMsg(`Minimum stake: ${selectedPlan.minAmount} USDT`);
      return;
    }
    try {
      setActionLoading(true);
      await createStake(TELEGRAM_ID, amount, selectedPlan.days, selectedPlan.dailyRate);
      showMsg(`Staked ${amount} USDT successfully!`);
      setShowStakeModal(false);
      setStakeAmount('');
      setSelectedPlan(null);
      await loadData();
    } catch (err) {
      showMsg('Stake failed. Try again.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleClaim = async (stakeId: string) => {
    try {
      setActionLoading(true);
      const result = await claimReward(TELEGRAM_ID, stakeId);
      showMsg(`Claimed ${result.reward.toFixed(4)} USDT!`);
      await loadData();
    } catch (err: any) {
      showMsg(err.message || 'Claim failed');
    } finally {
      setActionLoading(false);
    }
  };

  const handleWithdraw = async () => {
    const amount = parseFloat(withdrawAmount);
    if (isNaN(amount) || amount < 10) {
      showMsg('Minimum withdrawal: 10 USDT');
      return;
    }
    if (!walletAddress) {
      showMsg('Enter wallet address');
      return;
    }
    try {
      setActionLoading(true);
      await requestWithdrawal(TELEGRAM_ID, amount, walletAddress);
      showMsg('Withdrawal requested!');
      setWithdrawAmount('');
      setWalletAddress('');
      await loadData();
    } catch (err) {
      showMsg('Withdrawal failed');
    } finally {
      setActionLoading(false);
    }
  };

  const getDaysLeft = (endDate: string) => {
    const end = new Date(endDate);
    const now = new Date();
    const diff = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return Math.max(0, diff);
  };

  const getDailyReward = (amount: number, rate: number) => (amount * rate).toFixed(4);

  if (loading) {
    return (
      <div className="app">
        <div className="loading">
          <div style={{ fontSize: 32, marginBottom: 12 }}>⏳</div>
          Loading Vanguard Staking...
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      {message && (
        <div style={{
          position: 'fixed', top: 16, left: 16, right: 16, zIndex: 200,
          background: 'var(--accent)', color: 'white', padding: '12px 16px',
          borderRadius: 10, textAlign: 'center', fontSize: 14, fontWeight: 600,
        }}>
          {message}
        </div>
      )}

      {/* Header */}
      <div className="header">
        <h1>⚔️ Vanguard Staking</h1>
        <div className="subtitle">Stake • Earn • Grow</div>
      </div>

      {/* Dashboard */}
      {tab === 'dashboard' && (
        <>
          <div className="balance-card">
            <div className="label">Total Balance</div>
            <div className="amount">{(user?.balance || 0).toFixed(4)}<span>USDT</span></div>
            <div className="stats">
              <div className="stat">
                <div className="stat-label">Staked</div>
                <div className="stat-value">{(user?.total_staked || 0).toFixed(2)}</div>
              </div>
              <div className="stat">
                <div className="stat-label">Earned</div>
                <div className="stat-value">{(user?.total_earned || 0).toFixed(4)}</div>
              </div>
              <div className="stat">
                <div className="stat-label">Referrals</div>
                <div className="stat-value">{user?.referrals_count || 0}</div>
              </div>
            </div>
          </div>

          <div className="card">
            <h3>📊 Quick Stats</h3>
            <p>Active Stakes: {stakes.filter(s => s.status === 'active').length}</p>
            <p>Affiliate Balance: {(user?.affiliate_balance || 0).toFixed(4)} USDT</p>
            <p>Pending Withdrawals: {withdrawals.filter(w => w.status === 'pending').length}</p>
          </div>

          <div className="card">
            <h3>🎯 How It Works</h3>
            <p>1. Choose a staking plan<br/>2. Deposit USDT<br/>3. Earn daily rewards<br/>4. Claim anytime</p>
          </div>
        </>
      )}

      {/* Stake Plans */}
      {tab === 'stake' && (
        <>
          <h2 style={{ marginBottom: 16 }}>📋 Staking Plans</h2>
          {STAKE_PLANS.map((plan) => (
            <div
              key={plan.name}
              className="plan-card"
              onClick={() => { setSelectedPlan(plan); setShowStakeModal(true); }}
            >
              <div className="plan-header">
                <div className="plan-name">{plan.emoji} {plan.name}</div>
                <div className="plan-rate">{(plan.dailyRate * 100).toFixed(1)}%/day</div>
              </div>
              <div className="plan-details">
                Duration: {plan.days} days • Min: {plan.minAmount} USDT
              </div>
            </div>
          ))}
        </>
      )}

      {/* Active Stakes */}
      {tab === 'stakes' && (
        <>
          <h2 style={{ marginBottom: 16 }}>🔥 My Stakes</h2>
          {stakes.length === 0 ? (
            <div className="empty-state">
              <div className="emoji">📭</div>
              <p>No stakes yet. Start staking to earn!</p>
            </div>
          ) : (
            stakes.map((stake) => (
              <div key={stake.id} className="stake-item">
                <div className="stake-header">
                  <div className="stake-amount">{parseFloat(stake.amount).toFixed(2)} USDT</div>
                  <div className={`stake-status ${stake.status}`}>{stake.status}</div>
                </div>
                <div className="stake-info">
                  Plan: {stake.plan_days} days • Rate: {(stake.daily_rate * 100).toFixed(1)}%/day<br/>
                  Days left: {getDaysLeft(stake.end_date)} • Daily reward: {getDailyReward(stake.amount, stake.daily_rate)} USDT
                </div>
                <div className="stake-reward">
                  💰 Est. total reward: {(stake.amount * stake.daily_rate * stake.plan_days).toFixed(4)} USDT
                </div>
                {stake.status === 'active' && (
                  <button
                    className="btn btn-success"
                    onClick={() => handleClaim(stake.id)}
                    disabled={actionLoading}
                  >
                    {actionLoading ? 'Claiming...' : '🎁 Claim Reward'}
                  </button>
                )}
              </div>
            ))
          )}
        </>
      )}

      {/* Deposit */}
      {tab === 'deposit' && (
        <>
          <h2 style={{ marginBottom: 16 }}>💰 Deposit</h2>
          <div className="card" style={{ textAlign: 'center' }}>
            <h3 style={{ marginBottom: 12 }}>Send USDT (TRC-20) to:</h3>
            <div style={{
              background: 'var(--bg-primary)',
              padding: '16px',
              borderRadius: '10px',
              border: '2px dashed var(--accent)',
              marginBottom: '16px',
            }}>
              <div style={{
                fontSize: 14,
                fontWeight: 600,
                color: 'var(--accent-light)',
                wordBreak: 'break-all',
                lineHeight: 1.6,
                userSelect: 'all',
              }}>
                {(import.meta as any).env?.VITE_OWNER_WALLET || 'TQ5zn9C7CAko9gKs3RRYyA1Tj9YasXxuLh'}
              </div>
            </div>
            <button
              className="btn btn-primary"
              onClick={() => {
                navigator.clipboard?.writeText('TQ5zn9C7CAko9gKs3RRYyA1Tj9YasXxuLh');
                showMsg('Wallet address copied!');
              }}
            >
              📋 Copy Address
            </button>
          </div>

          <div className="card" style={{ marginTop: 16 }}>
            <h3>⚠️ Important</h3>
            <p style={{ marginTop: 8 }}>
              • Send only <strong>USDT (TRC-20)</strong> network<br/>
              • Minimum deposit: <strong>10 USDT</strong><br/>
              • Balance updates automatically<br/>
              • Contact admin if balance not updated after 30 min
            </p>
          </div>

          <div className="card" style={{ marginTop: 16 }}>
            <h3>📊 Network Info</h3>
            <p style={{ marginTop: 8 }}>
              Network: <strong>TRON (TRC-20)</strong><br/>
              Token: <strong>USDT</strong><br/>
              Confirmations: <strong>1</strong>
            </p>
          </div>
        </>
      )}

      {/* Withdraw */}
      {tab === 'withdraw' && (
        <>
          <h2 style={{ marginBottom: 16 }}>💸 Withdraw</h2>
          <div className="card">
            <div className="input-group">
              <label>Amount (USDT)</label>
              <input
                type="number"
                placeholder="Min 10 USDT"
                value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(e.target.value)}
              />
            </div>
            <div className="input-group">
              <label>TRC-20 Wallet Address</label>
              <input
                type="text"
                placeholder="Enter your TRC-20 wallet"
                value={walletAddress}
                onChange={(e) => setWalletAddress(e.target.value)}
              />
            </div>
            <button
              className="btn btn-primary"
              onClick={handleWithdraw}
              disabled={actionLoading}
            >
              {actionLoading ? 'Processing...' : 'Request Withdrawal'}
            </button>
          </div>

          <h3 style={{ marginTop: 24, marginBottom: 12 }}>📜 Withdrawal History</h3>
          {withdrawals.length === 0 ? (
            <div className="empty-state">
              <div className="emoji">📭</div>
              <p>No withdrawals yet</p>
            </div>
          ) : (
            withdrawals.map((wd) => (
              <div key={wd.id} className="withdrawal-item">
                <div className="wd-header">
                  <div style={{ fontWeight: 600 }}>{parseFloat(wd.amount).toFixed(2)} USDT</div>
                  <div className={`wd-status ${wd.status}`}>{wd.status}</div>
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                  {wd.wallet_address?.slice(0, 10)}...{wd.wallet_address?.slice(-6)}
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 4 }}>
                  {new Date(wd.created_at).toLocaleDateString()}
                </div>
              </div>
            ))
          )}
        </>
      )}

      {/* History */}
      {tab === 'history' && (
        <>
          <h2 style={{ marginBottom: 16 }}>📜 Transactions</h2>
          {transactions.length === 0 ? (
            <div className="empty-state">
              <div className="emoji">📭</div>
              <p>No transactions yet</p>
            </div>
          ) : (
            <div className="card">
              {transactions.map((tx) => (
                <div key={tx.id} className="tx-item">
                  <div className="tx-info">
                    <div className="tx-type">
                      {tx.type === 'reward_claim' ? '🎁' : tx.type === 'stake' ? '🔒' : '💸'} {tx.type.replace('_', ' ')}
                    </div>
                    <div className="tx-date">{new Date(tx.created_at).toLocaleDateString()}</div>
                  </div>
                  <div className={`tx-amount ${tx.type === 'reward_claim' ? 'positive' : 'negative'}`}>
                    {tx.type === 'reward_claim' ? '+' : '-'}{parseFloat(tx.amount).toFixed(4)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Referral */}
      {tab === 'referral' && (
        <>
          <h2 style={{ marginBottom: 16 }}>👥 Referral</h2>
          <div className="referral-card">
            <h3>🎁 Invite & Earn</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: 13, marginTop: 8 }}>
              Share your referral link and earn 1 USDT for each friend who joins!
            </p>
            <div className="referral-link">
              https://t.me/share/url?url=https://t.me/your_bot?start={TELEGRAM_ID}
            </div>
            <button
              className="btn btn-primary"
              onClick={() => {
                navigator.clipboard?.writeText(`https://t.me/your_bot?start=${TELEGRAM_ID}`);
                showMsg('Referral link copied!');
              }}
            >
              📋 Copy Link
            </button>
          </div>

          <div className="card">
            <h3>📊 Referral Stats</h3>
            <p>Total Referrals: {user?.referrals_count || 0}</p>
            <p>Affiliate Balance: {(user?.affiliate_balance || 0).toFixed(4)} USDT</p>
          </div>
        </>
      )}

      {/* Stake Modal */}
      {showStakeModal && selectedPlan && (
        <div className="modal-overlay" onClick={() => setShowStakeModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>{selectedPlan.emoji} {selectedPlan.name} Plan</h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: 16, fontSize: 13 }}>
              {(selectedPlan.dailyRate * 100).toFixed(1)}% daily • {selectedPlan.days} days
            </p>
            <div className="input-group">
              <label>Amount (USDT)</label>
              <input
                type="number"
                placeholder={`Min ${selectedPlan.minAmount} USDT`}
                value={stakeAmount}
                onChange={(e) => setStakeAmount(e.target.value)}
              />
            </div>
            {stakeAmount && !isNaN(parseFloat(stakeAmount)) && (
              <div style={{ marginBottom: 16, fontSize: 13, color: 'var(--text-secondary)' }}>
                <p>Daily reward: {(parseFloat(stakeAmount) * selectedPlan.dailyRate).toFixed(4)} USDT</p>
                <p>Total reward: {(parseFloat(stakeAmount) * selectedPlan.dailyRate * selectedPlan.days).toFixed(4)} USDT</p>
              </div>
            )}
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn btn-secondary" onClick={() => setShowStakeModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleStake} disabled={actionLoading}>
                {actionLoading ? 'Staking...' : 'Stake Now'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Navigation */}
      <div className="bottom-nav">
        {([
          { id: 'dashboard', icon: '🏠', label: 'Home' },
          { id: 'stake', icon: '📋', label: 'Plans' },
          { id: 'stakes', icon: '🔥', label: 'My Stakes' },
          { id: 'deposit', icon: '💰', label: 'Deposit' },
          { id: 'withdraw', icon: '💸', label: 'Withdraw' },
          { id: 'referral', icon: '👥', label: 'Referral' },
        ] as const).map((item) => (
          <button
            key={item.id}
            className={`nav-item ${tab === item.id ? 'active' : ''}`}
            onClick={() => setTab(item.id)}
          >
            <span className="nav-icon">{item.icon}</span>
            {item.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export default App;
