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

const OWNER_WALLET = 'TQ5zn9C7CAko9gKs3RRYyA1Tj9YasXxuLh';

// ─── Custom SVG Icons ─────────────────────────────────
const Icons = {
  home: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
      <polyline points="9 22 9 12 15 12 15 22"/>
    </svg>
  ),
  plans: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
      <line x1="3" y1="9" x2="21" y2="9"/>
      <line x1="9" y1="21" x2="9" y2="9"/>
    </svg>
  ),
  stakes: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/>
      <polyline points="17 6 23 6 23 12"/>
    </svg>
  ),
  deposit: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19"/>
      <polyline points="19 12 12 19 5 12"/>
      <line x1="2" y1="20" x2="22" y2="20"/>
    </svg>
  ),
  withdraw: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="19" x2="12" y2="5"/>
      <polyline points="5 12 12 5 19 12"/>
      <line x1="2" y1="4" x2="22" y2="4"/>
    </svg>
  ),
  referral: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
      <circle cx="9" cy="7" r="4"/>
      <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
      <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>
  ),
  wallet: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/>
      <line x1="1" y1="10" x2="23" y2="10"/>
    </svg>
  ),
  copy: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
    </svg>
  ),
  claim: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
    </svg>
  ),
  clock: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/>
      <polyline points="12 6 12 12 16 14"/>
    </svg>
  ),
  shield: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
    </svg>
  ),
  zap: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
    </svg>
  ),
  gift: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 12 20 22 4 22 4 12"/>
      <rect x="2" y="7" width="20" height="5"/>
      <line x1="12" y1="22" x2="12" y2="7"/>
      <path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"/>
      <path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"/>
    </svg>
  ),
  users: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
      <circle cx="9" cy="7" r="4"/>
      <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
      <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>
  ),
  info: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/>
      <line x1="12" y1="16" x2="12" y2="12"/>
      <line x1="12" y1="8" x2="12.01" y2="8"/>
    </svg>
  ),
  arrowRight: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="5" y1="12" x2="19" y2="12"/>
      <polyline points="12 5 19 12 12 19"/>
    </svg>
  ),
};

const STAKE_PLANS = [
  { name: 'Starter', days: 7, dailyRate: 0.01, minAmount: 10, color: '#4CAF50', progress: 7 },
  { name: 'Growth', days: 14, dailyRate: 0.015, minAmount: 50, color: '#2196F3', progress: 50 },
  { name: 'Pro', days: 30, dailyRate: 0.02, minAmount: 100, color: '#FF9800', progress: 75 },
  { name: 'Elite', days: 90, dailyRate: 0.03, minAmount: 500, color: '#FFD54F', progress: 100 },
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
  const [pageKey, setPageKey] = useState(0);

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

  const switchTab = (newTab: Tab) => {
    setTab(newTab);
    setPageKey(k => k + 1);
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

  const getStakeProgress = (startDate: string, endDate: string) => {
    const start = new Date(startDate).getTime();
    const end = new Date(endDate).getTime();
    const now = Date.now();
    const progress = ((now - start) / (end - start)) * 100;
    return Math.min(100, Math.max(0, progress));
  };

  const getDailyReward = (amount: number, rate: number) => (amount * rate).toFixed(4);

  if (loading) {
    return (
      <div className="app">
        <div className="loading">
          <div className="loading-spinner" />
          Loading Vanguard Staking...
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      {message && <div className="toast">{message}</div>}

      {/* Header with Logo */}
      <div className="header">
        <div className="logo-container">
          <svg className="logo-svg" width="64" height="64" viewBox="0 0 100 100" fill="none">
            <defs>
              <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#C48D0A" />
                <stop offset="50%" stopColor="#FFD54F" />
                <stop offset="100%" stopColor="#FFECB3" />
              </linearGradient>
              <linearGradient id="goldGrad2" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#D89D15" />
                <stop offset="100%" stopColor="#FFECB3" />
              </linearGradient>
              <filter id="glow">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>
            {/* Outer triangle */}
            <polygon
              points="50,8 92,85 8,85"
              fill="none"
              stroke="url(#goldGrad)"
              strokeWidth="3"
              filter="url(#glow)"
            />
            {/* Inner filled triangle */}
            <polygon
              points="50,22 80,78 20,78"
              fill="url(#goldGrad)"
              opacity="0.9"
            />
            {/* Circle inside triangle */}
            <circle
              cx="50"
              cy="65"
              r="12"
              fill="url(#goldGrad2)"
              filter="url(#glow)"
            />
            {/* Inner circle highlight */}
            <circle
              cx="50"
              cy="62"
              r="6"
              fill="#FFECB3"
              opacity="0.6"
            />
          </svg>
        </div>
        <h1>VANGUARD STAKING</h1>
        <div className="subtitle">STAKE • EARN • GROW</div>
      </div>

      {/* Dashboard */}
      {tab === 'dashboard' && (
        <div key={pageKey}>
          <div className="balance-card">
            <div className="label">Total Balance</div>
            <div className="amount">{(user?.balance || 0).toFixed(4)}<span>USDT</span></div>
            <div className="stats">
              <div className="stat" style={{'--i': 0} as any}>
                <div className="stat-label">Staked</div>
                <div className="stat-value">{(user?.total_staked || 0).toFixed(2)}</div>
              </div>
              <div className="stat" style={{'--i': 1} as any}>
                <div className="stat-label">Earned</div>
                <div className="stat-value">{(user?.total_earned || 0).toFixed(4)}</div>
              </div>
              <div className="stat" style={{'--i': 2} as any}>
                <div className="stat-label">Referrals</div>
                <div className="stat-value">{user?.referrals_count || 0}</div>
              </div>
            </div>
          </div>

          {/* Trust Indicators */}
          <div className="trust-bar">
            <div className="trust-item">
              <span className="trust-icon">{Icons.shield}</span>
              <span>Secure</span>
            </div>
            <div className="trust-divider" />
            <div className="trust-item">
              <span className="trust-icon">{Icons.zap}</span>
              <span>Instant</span>
            </div>
            <div className="trust-divider" />
            <div className="trust-item">
              <span className="trust-icon">{Icons.users}</span>
              <span>5K+ Users</span>
            </div>
          </div>

          <div className="card">
            <h3>{Icons.zap} Quick Stats</h3>
            <p style={{marginTop: 8}}>
              Active Stakes: <strong style={{color: '#FFD54F'}}>{stakes.filter(s => s.status === 'active').length}</strong><br/>
              Affiliate Balance: <strong style={{color: '#FFD54F'}}>{(user?.affiliate_balance || 0).toFixed(4)} USDT</strong><br/>
              Pending Withdrawals: <strong style={{color: '#F0D040'}}>{withdrawals.filter(w => w.status === 'pending').length}</strong>
            </p>
          </div>

          <div className="card">
            <h3>{Icons.shield} How It Works</h3>
            <p style={{marginTop: 8}}>
              1. Choose a staking plan<br/>
              2. Deposit USDT to your wallet<br/>
              3. Earn daily rewards<br/>
              4. Claim anytime
            </p>
          </div>

          <div className="card" style={{background: 'linear-gradient(135deg, #1a2a1a, #151E30)'}}>
            <h3 style={{color: '#00b894'}}>{Icons.gift} 40% Affiliate Commissions</h3>
            <p style={{marginTop: 8}}>
              Invite friends and earn <strong style={{color: '#FFD54F'}}>1 USDT</strong> for each referral!
            </p>
          </div>

          {/* Trust & Security Section */}
          <div className="trust-section">
            <h3 className="trust-title">Why Vanguard Staking?</h3>
            <div className="trust-grid">
              <div className="trust-card">
                <div className="trust-card-icon">{Icons.shield}</div>
                <div className="trust-card-title">Secure Protocol</div>
                <div className="trust-card-desc">Audited smart contracts</div>
              </div>
              <div className="trust-card">
                <div className="trust-card-icon">{Icons.zap}</div>
                <div className="trust-card-title">Daily Rewards</div>
                <div className="trust-card-desc">Earn up to 3% daily</div>
              </div>
              <div className="trust-card">
                <div className="trust-card-icon">{Icons.withdraw}</div>
                <div className="trust-card-title">Fast Withdrawals</div>
                <div className="trust-card-desc">Process within 24h</div>
              </div>
              <div className="trust-card">
                <div className="trust-card-icon">{Icons.users}</div>
                <div className="trust-card-title">Active Community</div>
                <div className="trust-card-desc">5,000+ stakers</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Stake Plans */}
      {tab === 'stake' && (
        <div key={pageKey}>
          <h2 style={{marginBottom: 16, color: '#FFD54F', fontSize: 18}}>Staking Plans</h2>
          {STAKE_PLANS.map((plan, i) => (
            <div
              key={plan.name}
              className="plan-card"
              onClick={() => { setSelectedPlan(plan); setShowStakeModal(true); }}
            >
              <div className="plan-header">
                <div className="plan-name">
                  <div className="plan-icon" style={{background: `linear-gradient(135deg, ${plan.color}22, ${plan.color}11)`, borderColor: `${plan.color}33`}}>
                    {Icons.zap}
                  </div>
                  {plan.name}
                </div>
                <div className="plan-rate">{(plan.dailyRate * 100).toFixed(1)}%/day</div>
              </div>
              <div className="plan-details">
                Duration: {plan.days} days • Min: {plan.minAmount} USDT
              </div>
              <div className="plan-progress">
                <div className="plan-progress-bar" style={{width: `${plan.progress}%`}} />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Active Stakes */}
      {tab === 'stakes' && (
        <div key={pageKey}>
          <h2 style={{marginBottom: 16, color: '#FFD54F', fontSize: 18}}>My Stakes</h2>
          {stakes.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">{Icons.stakes}</div>
              <p>No stakes yet. Start staking to earn!</p>
            </div>
          ) : (
            stakes.map((stake, i) => (
              <div key={stake.id} className="stake-item" style={{animationDelay: `${i * 0.1}s`}}>
                <div className="stake-header">
                  <div className="stake-amount">{parseFloat(stake.amount).toFixed(2)} USDT</div>
                  <div className={`stake-status ${stake.status}`}>{stake.status}</div>
                </div>
                <div className="stake-info">
                  Plan: {stake.plan_days} days • Rate: {(stake.daily_rate * 100).toFixed(1)}%/day<br/>
                  <span style={{display: 'inline-flex', alignItems: 'center', gap: 4}}>
                    {Icons.clock} Days left: {getDaysLeft(stake.end_date)} • Daily: {getDailyReward(stake.amount, stake.daily_rate)} USDT
                  </span>
                </div>
                <div className="stake-progress">
                  <div className="stake-progress-bar" style={{width: `${getStakeProgress(stake.start_date, stake.end_date)}%`}} />
                </div>
                <div className="stake-reward">
                  Est. total: {(stake.amount * stake.daily_rate * stake.plan_days).toFixed(4)} USDT
                </div>
                {stake.status === 'active' && (
                  <button
                    className="btn btn-success"
                    onClick={() => handleClaim(stake.id)}
                    disabled={actionLoading}
                  >
                    {actionLoading ? 'Claiming...' : <span style={{display: 'inline-flex', alignItems: 'center', gap: 8}}>{Icons.claim} Claim Reward</span>}
                  </button>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* Deposit */}
      {tab === 'deposit' && (
        <div key={pageKey}>
          <h2 style={{marginBottom: 16, color: '#FFD54F', fontSize: 18}}>Deposit</h2>
          <div className="card deposit-card">
            <div style={{display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 12}}>
              {Icons.wallet}
              <h3 style={{margin: 0, fontSize: 16}}>Send USDT (TRC-20) to:</h3>
            </div>
            <div className="deposit-address">
              <div className="address">{OWNER_WALLET}</div>
            </div>
            <button
              className="btn btn-primary"
              onClick={() => {
                navigator.clipboard?.writeText(OWNER_WALLET);
                showMsg('Wallet address copied!');
              }}
            >
              <span style={{display: 'inline-flex', alignItems: 'center', gap: 8}}>{Icons.copy} Copy Address</span>
            </button>
          </div>

          <div className="card">
            <h3 style={{display: 'flex', alignItems: 'center', gap: 8}}>{Icons.info} Important</h3>
            <p style={{marginTop: 10, lineHeight: 1.8}}>
              • Send only <strong style={{color: '#FFD54F'}}>USDT (TRC-20)</strong> network<br/>
              • Minimum deposit: <strong style={{color: '#FFD54F'}}>10 USDT</strong><br/>
              • Balance updates automatically<br/>
              • Contact admin if not updated after 30 min
            </p>
          </div>

          <div className="card">
            <h3 style={{display: 'flex', alignItems: 'center', gap: 8}}>{Icons.shield} Network Info</h3>
            <p style={{marginTop: 10, lineHeight: 1.8}}>
              Network: <strong style={{color: '#FFD54F'}}>TRON (TRC-20)</strong><br/>
              Token: <strong style={{color: '#FFD54F'}}>USDT</strong><br/>
              Confirmations: <strong style={{color: '#FFD54F'}}>1</strong>
            </p>
          </div>
        </div>
      )}

      {/* Withdraw */}
      {tab === 'withdraw' && (
        <div key={pageKey}>
          <h2 style={{marginBottom: 16, color: '#FFD54F', fontSize: 18}}>Withdraw</h2>
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
              {actionLoading ? 'Processing...' : <span style={{display: 'inline-flex', alignItems: 'center', gap: 8}}>{Icons.withdraw} Request Withdrawal</span>}
            </button>
          </div>

          <h3 style={{marginTop: 24, marginBottom: 12, color: '#FFD54F', fontSize: 16}}>Withdrawal History</h3>
          {withdrawals.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">{Icons.withdraw}</div>
              <p>No withdrawals yet</p>
            </div>
          ) : (
            withdrawals.map((wd, i) => (
              <div key={wd.id} className="withdrawal-item" style={{animationDelay: `${i * 0.1}s`}}>
                <div className="wd-header">
                  <div style={{fontWeight: 600, color: '#FFD54F'}}>{parseFloat(wd.amount).toFixed(2)} USDT</div>
                  <div className={`wd-status ${wd.status}`}>{wd.status}</div>
                </div>
                <div style={{fontSize: 12, color: '#7A8CA5', marginTop: 4}}>
                  {wd.wallet_address?.slice(0, 10)}...{wd.wallet_address?.slice(-6)}
                </div>
                <div style={{fontSize: 11, color: '#7A8CA5', marginTop: 4, display: 'flex', alignItems: 'center', gap: 4}}>
                  {Icons.clock} {new Date(wd.created_at).toLocaleDateString()}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* History */}
      {tab === 'history' && (
        <div key={pageKey}>
          <h2 style={{marginBottom: 16, color: '#FFD54F', fontSize: 18}}>Transactions</h2>
          {transactions.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">{Icons.history || Icons.stakes}</div>
              <p>No transactions yet</p>
            </div>
          ) : (
            <div className="card">
              {transactions.map((tx, i) => (
                <div key={tx.id} className="tx-item" style={{animationDelay: `${i * 0.05}s`}}>
                  <div style={{display: 'flex', alignItems: 'center'}}>
                    <div className={`tx-icon ${tx.type === 'reward_claim' ? 'reward' : tx.type === 'stake' ? 'stake' : 'withdraw'}`}>
                      {tx.type === 'reward_claim' ? Icons.claim : tx.type === 'stake' ? Icons.stakes : Icons.withdraw}
                    </div>
                    <div className="tx-info">
                      <div className="tx-type">{tx.type.replace(/_/g, ' ')}</div>
                      <div className="tx-date">{new Date(tx.created_at).toLocaleDateString()}</div>
                    </div>
                  </div>
                  <div className={`tx-amount ${tx.type === 'reward_claim' ? 'positive' : 'negative'}`}>
                    {tx.type === 'reward_claim' ? '+' : '-'}{parseFloat(tx.amount).toFixed(4)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Referral */}
      {tab === 'referral' && (
        <div key={pageKey}>
          <h2 style={{marginBottom: 16, color: '#FFD54F', fontSize: 18}}>Referral</h2>
          <div className="referral-card">
            <h3 style={{display: 'flex', alignItems: 'center', gap: 8}}>{Icons.gift} Invite & Earn</h3>
            <p style={{color: '#7A8CA5', fontSize: 13, marginTop: 8}}>
              Share your referral link and earn <strong style={{color: '#FFD54F'}}>1 USDT</strong> for each friend who joins!
            </p>
            <div className="referral-link">
              https://t.me/share?url=https://t.me/your_bot?start={TELEGRAM_ID}
            </div>
            <button
              className="btn btn-primary"
              onClick={() => {
                navigator.clipboard?.writeText(`https://t.me/your_bot?start=${TELEGRAM_ID}`);
                showMsg('Referral link copied!');
              }}
            >
              <span style={{display: 'inline-flex', alignItems: 'center', gap: 8}}>{Icons.copy} Copy Link</span>
            </button>
          </div>

          <div className="card">
            <h3 style={{display: 'flex', alignItems: 'center', gap: 8}}>{Icons.users} Referral Stats</h3>
            <p style={{marginTop: 10, lineHeight: 1.8}}>
              Total Referrals: <strong style={{color: '#FFD54F'}}>{user?.referrals_count || 0}</strong><br/>
              Affiliate Balance: <strong style={{color: '#FFD54F'}}>{(user?.affiliate_balance || 0).toFixed(4)} USDT</strong>
            </p>
          </div>
        </div>
      )}

      {/* Stake Modal */}
      {showStakeModal && selectedPlan && (
        <div className="modal-overlay" onClick={() => setShowStakeModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2 style={{display: 'flex', alignItems: 'center', gap: 8}}>
              <div className="plan-icon" style={{background: `linear-gradient(135deg, ${selectedPlan.color}22, ${selectedPlan.color}11)`, borderColor: `${selectedPlan.color}33`}}>
                {Icons.zap}
              </div>
              {selectedPlan.name} Plan
            </h2>
            <p style={{color: '#7A8CA5', marginBottom: 16, fontSize: 13}}>
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
              <div style={{marginBottom: 16, fontSize: 13, color: '#7A8CA5', lineHeight: 1.8}}>
                <p>Daily reward: <strong style={{color: '#00b894'}}>{(parseFloat(stakeAmount) * selectedPlan.dailyRate).toFixed(4)} USDT</strong></p>
                <p>Total reward: <strong style={{color: '#00b894'}}>{(parseFloat(stakeAmount) * selectedPlan.dailyRate * selectedPlan.days).toFixed(4)} USDT</strong></p>
              </div>
            )}
            <div style={{display: 'flex', gap: 8}}>
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
          { id: 'dashboard' as Tab, icon: Icons.home, label: 'Home' },
          { id: 'stake' as Tab, icon: Icons.plans, label: 'Plans' },
          { id: 'stakes' as Tab, icon: Icons.stakes, label: 'Stakes' },
          { id: 'deposit' as Tab, icon: Icons.deposit, label: 'Deposit' },
          { id: 'withdraw' as Tab, icon: Icons.withdraw, label: 'Withdraw' },
          { id: 'referral' as Tab, icon: Icons.referral, label: 'Referral' },
        ]).map((item) => (
          <button
            key={item.id}
            className={`nav-item ${tab === item.id ? 'active' : ''}`}
            onClick={() => switchTab(item.id)}
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
