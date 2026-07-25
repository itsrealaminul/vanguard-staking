import { useState, useEffect, useCallback } from 'react';
import { fetchUser, fetchStakes, createStake, fetchTransactions, fetchWithdrawals, requestWithdrawal, claimReward, submitDeposit, fetchGasPrices, scanToken, purchaseService, checkServiceAccess, fetchPrices } from './api';

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

// ─── Custom SVG Icons (Branding Matched) ──────────────
const Icons = {
  // Hamburger Menu Icon
  menu: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="3" y1="6" x2="21" y2="6"/>
      <line x1="3" y1="12" x2="18" y2="12"/>
      <line x1="3" y1="18" x2="15" y2="18"/>
    </svg>
  ),
  // Close Icon
  close: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18"/>
      <line x1="6" y1="6" x2="18" y2="18"/>
    </svg>
  ),
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
  // ─── New Service Icons ───
  // Token Scanner - Shield with magnifying glass
  tokenScanner: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
      <circle cx="10" cy="10" r="3"/>
      <line x1="12.5" y1="12.5" x2="16" y2="16"/>
    </svg>
  ),
  // Gas Tracker - Fuel pump
  gasTracker: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 22V6a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v16"/>
      <path d="M3 22h12"/>
      <path d="M13 10h2a2 2 0 0 1 2 2v2a2 2 0 0 0 2 2h0a2 2 0 0 0 2-2V9.83a2 2 0 0 0-.59-1.42L18 6"/>
      <path d="M7 10h2"/>
      <path d="M7 14h2"/>
    </svg>
  ),
  // Crypto Academy - Graduation cap
  academy: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 10l-10-5L2 10l10 5 10-5z"/>
      <path d="M6 12v5c0 1.66 2.69 3 6 3s6-1.34 6-3v-5"/>
      <line x1="22" y1="10" x2="22" y2="16"/>
    </svg>
  ),
  // Portfolio Tracker - Pie chart
  portfolio: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21.21 15.89A10 10 0 1 1 8 2.83"/>
      <path d="M22 12A10 10 0 0 0 12 2v10z"/>
    </svg>
  ),
  // Whale Alert - Whale tail
  whale: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 16c1.5-1.5 3.5-2 6-2s4.5.5 6 2"/>
      <path d="M2 20c3-3 7-4 10-4s7 1 10 4"/>
      <path d="M14 4c2 0 4 1 4 3s-2 3-4 3"/>
      <circle cx="14" cy="6" r="1" fill="currentColor"/>
      <path d="M18 9c1.5 0 3 .5 3 2s-1.5 2-3 2"/>
    </svg>
  ),
  // Airdrop - Parachute/gift box
  airdrop: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2L2 7l10 5 10-5-10-5z"/>
      <path d="M2 17l10 5 10-5"/>
      <path d="M2 12l10 5 10-5"/>
      <line x1="12" y1="12" x2="12" y2="22"/>
    </svg>
  ),
  // Instant Swap - Arrows exchange
  swap: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="17 1 21 5 17 9"/>
      <path d="M3 11V9a4 4 0 0 1 4-4h14"/>
      <polyline points="7 23 3 19 7 15"/>
      <path d="M21 13v2a4 4 0 0 1-4 4H3"/>
    </svg>
  ),
  // Tax Calculator - Calculator
  tax: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="2" width="16" height="20" rx="2"/>
      <line x1="8" y1="6" x2="16" y2="6"/>
      <line x1="8" y1="10" x2="10" y2="10"/>
      <line x1="14" y1="10" x2="16" y2="10"/>
      <line x1="8" y1="14" x2="10" y2="14"/>
      <line x1="14" y1="14" x2="16" y2="14"/>
      <line x1="8" y1="18" x2="16" y2="18"/>
    </svg>
  ),
  // Expert Help - Headset
  expert: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 18v-6a9 9 0 0 1 18 0v6"/>
      <path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3v5z"/>
      <path d="M3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3v5z"/>
    </svg>
  ),
  // Settings - Gear
  settings: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3"/>
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
    </svg>
  ),
  // Support - Help circle
  support: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/>
      <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
      <line x1="12" y1="17" x2="12.01" y2="17"/>
    </svg>
  ),
  // Search icon for scanner
  search: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8"/>
      <line x1="21" y1="21" x2="16.65" y2="16.65"/>
    </svg>
  ),
  // External link
  externalLink: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
      <polyline points="15 3 21 3 21 9"/>
      <line x1="10" y1="14" x2="21" y2="3"/>
    </svg>
  ),
  // Book icon for academy
  book: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
    </svg>
  ),
  // Alert triangle
  alert: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
      <line x1="12" y1="9" x2="12" y2="13"/>
      <line x1="12" y1="17" x2="12.01" y2="17"/>
    </svg>
  ),
  // Check circle
  checkCircle: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
      <polyline points="22 4 12 14.01 9 11.01"/>
    </svg>
  ),
};

const STAKE_PLANS = [
  { name: 'Starter', days: 7, dailyRate: 0.01, minAmount: 10, color: '#4CAF50', progress: 7 },
  { name: 'Growth', days: 14, dailyRate: 0.015, minAmount: 50, color: '#2196F3', progress: 50 },
  { name: 'Pro', days: 30, dailyRate: 0.02, minAmount: 100, color: '#FF9800', progress: 75 },
  { name: 'Elite', days: 90, dailyRate: 0.03, minAmount: 500, color: '#FFD54F', progress: 100 },
];

// ─── Service Pricing ─────────────────────────────────
const SERVICE_PRICING: Record<string, { price: number; label: string; type: 'per_use' | 'subscription' | 'free' }> = {
  tokenScanner: { price: 0.5, label: '0.5 USDT / scan', type: 'per_use' },
  gasTracker: { price: 0, label: 'Free', type: 'free' },
  academy: { price: 0, label: 'Free', type: 'free' },
  portfolio: { price: 5, label: '5 USDT / month', type: 'subscription' },
  whale: { price: 10, label: '10 USDT / month', type: 'subscription' },
  airdrop: { price: 3, label: '3 USDT / month', type: 'subscription' },
  swap: { price: 0, label: '0.3% per swap', type: 'per_use' },
  tax: { price: 15, label: '15 USDT / report', type: 'per_use' },
  expert: { price: 25, label: '25 USDT / session', type: 'per_use' },
};

// ─── Crypto Academy Lessons ─────────────────────────
const ACADEMY_LESSONS = [
  {
    id: 1,
    category: 'Beginner',
    title: 'What is Blockchain?',
    desc: 'Learn the fundamentals of blockchain technology and how it powers cryptocurrencies.',
    duration: '5 min',
    icon: '🔗',
  },
  {
    id: 2,
    category: 'Beginner',
    title: 'How to Create a Wallet',
    desc: 'Step-by-step guide to setting up your first crypto wallet securely.',
    duration: '8 min',
    icon: '👛',
  },
  {
    id: 3,
    category: 'Beginner',
    title: 'Understanding USDT & Stablecoins',
    desc: 'Why stablecoins matter and how USDT maintains its dollar peg.',
    duration: '6 min',
    icon: '💵',
  },
  {
    id: 4,
    category: 'Intermediate',
    title: 'What is Staking?',
    desc: 'How staking works, different types, and how to earn passive income.',
    duration: '10 min',
    icon: '🥩',
  },
  {
    id: 5,
    category: 'Intermediate',
    title: 'DeFi Basics',
    desc: 'Decentralized Finance explained — lending, borrowing, and yield farming.',
    duration: '12 min',
    icon: '🏦',
  },
  {
    id: 6,
    category: 'Intermediate',
    title: 'Gas Fees Explained',
    desc: 'Why gas fees exist, how they work, and tips to save money.',
    duration: '7 min',
    icon: '⛽',
  },
  {
    id: 7,
    category: 'Advanced',
    title: 'Avoiding Scams & Rug Pulls',
    desc: 'Red flags to watch for and how to protect your assets from fraud.',
    duration: '15 min',
    icon: '🛡️',
  },
  {
    id: 8,
    category: 'Advanced',
    title: 'Portfolio Diversification',
    desc: 'Strategies for building a balanced crypto portfolio to manage risk.',
    duration: '10 min',
    icon: '📊',
  },
];

type Tab = 'dashboard' | 'stake' | 'stakes' | 'deposit' | 'withdraw' | 'history' | 'referral' | 'tokenScanner' | 'gasTracker' | 'academy' | 'portfolio' | 'whale' | 'airdrop' | 'swap' | 'tax' | 'expert';

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
  const [depositAmount, setDepositAmount] = useState('');
  const [depositTxHash, setDepositTxHash] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [pageKey, setPageKey] = useState(0);
  // Hamburger menu state
  const [menuOpen, setMenuOpen] = useState(false);
  // Token Scanner state
  const [scanAddress, setScanAddress] = useState('');
  const [scanResult, setScanResult] = useState<any>(null);
  const [scanning, setScanning] = useState(false);
  // Gas Tracker state
  const [gasData, setGasData] = useState<any>(null);
  const [gasLoading, setGasLoading] = useState(false);
  // Academy state
  const [selectedLesson, setSelectedLesson] = useState<any>(null);
  const [academyFilter, setAcademyFilter] = useState('All');
  // Crypto prices state
  const [cryptoPrices, setCryptoPrices] = useState<any>({});
  // Payment state
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentService, setPaymentService] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'balance' | 'direct'>('balance');
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const [purchasedServices, setPurchasedServices] = useState<Set<string>>(new Set());
  const [activeSubscriptions, setActiveSubscriptions] = useState<Record<string, string>>({}); // service -> expiry date

  useEffect(() => {
    tg?.ready();
    tg?.expand();
    loadData();
    // Fetch crypto prices & gas
    fetchPrices().then(setCryptoPrices).catch(() => {});
    fetchGasPrices().then(data => { data.timestamp = new Date(data.timestamp).toLocaleTimeString(); setGasData(data); }).catch(() => {});
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
    setMenuOpen(false);
  };

  // ─── Payment Logic ──────────────────────────────
  const openPayment = (serviceId: string) => {
    const pricing = SERVICE_PRICING[serviceId];
    if (!pricing || pricing.type === 'free') return true; // free service
    if (purchasedServices.has(serviceId)) return true; // already purchased
    if (activeSubscriptions[serviceId] && new Date(activeSubscriptions[serviceId]) > new Date()) return true; // active sub
    // Show payment modal
    setPaymentService(serviceId);
    setPaymentMethod('balance');
    setShowPaymentModal(true);
    return false;
  };

  const handlePayment = async () => {
    const pricing = SERVICE_PRICING[paymentService];
    if (!pricing) return;

    if (paymentMethod === 'balance') {
      const balance = user?.balance || 0;
      if (balance < pricing.price) {
        showMsg(`Insufficient balance! Need ${pricing.price} USDT. You have ${balance.toFixed(2)} USDT.`);
        return;
      }
    }

    setPaymentProcessing(true);
    try {
      const result = await purchaseService(TELEGRAM_ID, paymentService, paymentMethod);

      if (pricing.type === 'subscription') {
        setActiveSubscriptions(prev => ({...prev, [paymentService]: result.expiresAt}));
        showMsg(`✅ Subscribed! Valid for 30 days.`);
      } else {
        setPurchasedServices(prev => new Set([...prev, paymentService]));
        showMsg(`✅ ${paymentService} unlocked!`);
      }

      // Refresh user data to get updated balance
      if (paymentMethod === 'balance') {
        const userData = await fetchUser(TELEGRAM_ID, USERNAME, FIRST_NAME);
        setUser(userData);
      }

      setShowPaymentModal(false);
    } catch (err: any) {
      showMsg(err.message || 'Payment failed. Try again.');
    } finally {
      setPaymentProcessing(false);
    }
  };

  const hasAccess = (serviceId: string) => {
    const pricing = SERVICE_PRICING[serviceId];
    if (!pricing || pricing.type === 'free') return true;
    if (purchasedServices.has(serviceId)) return true;
    if (activeSubscriptions[serviceId] && new Date(activeSubscriptions[serviceId]) > new Date()) return true;
    return false;
  };

  // Check service access on load
  useEffect(() => {
    const checkAccess = async () => {
      const services = ['tokenScanner', 'portfolio', 'whale', 'airdrop', 'tax', 'expert'];
      for (const svc of services) {
        try {
          const result = await checkServiceAccess(TELEGRAM_ID, svc);
          if (result.hasAccess) {
            if (SERVICE_PRICING[svc]?.type === 'subscription') {
              setActiveSubscriptions(prev => ({...prev, [svc]: result.expiresAt}));
            } else {
              setPurchasedServices(prev => new Set([...prev, svc]));
            }
          }
        } catch {}
      }
    };
    checkAccess();
  }, []);

  // ─── Token Scanner Logic (Real-time) ─────────────
  const handleScan = async () => {
    if (!scanAddress.trim()) {
      showMsg('Enter a contract address');
      return;
    }
    // Check payment access
    if (!hasAccess('tokenScanner')) {
      openPayment('tokenScanner');
      return;
    }
    setScanning(true);
    setScanResult(null);
    try {
      const result = await scanToken(scanAddress);
      setScanResult(result);
    } catch (err: any) {
      showMsg(err.message || 'Scan failed. Try again.');
    } finally {
      setScanning(false);
    }
  };

  // ─── Gas Tracker Logic (Real-time) ──────────────
  const fetchGas = async () => {
    setGasLoading(true);
    try {
      const data = await fetchGasPrices();
      data.timestamp = new Date(data.timestamp).toLocaleTimeString();
      setGasData(data);
    } catch (err) {
      showMsg('Failed to fetch gas prices');
    } finally {
      setGasLoading(false);
    }
  };

  useEffect(() => {
    if (tab === 'gasTracker' && !gasData) fetchGas();
  }, [tab]);

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

  // ─── Menu Items Config ──────────────────────────
  const mainMenuItems = [
    { id: 'dashboard' as Tab, icon: Icons.home, label: 'Home', desc: 'Dashboard & Balance' },
    { id: 'stake' as Tab, icon: Icons.plans, label: 'Staking Plans', desc: 'Choose your plan' },
    { id: 'stakes' as Tab, icon: Icons.stakes, label: 'My Stakes', desc: 'Active & history' },
    { id: 'deposit' as Tab, icon: Icons.deposit, label: 'Deposit', desc: 'Add USDT' },
    { id: 'withdraw' as Tab, icon: Icons.withdraw, label: 'Withdraw', desc: 'Cash out' },
    { id: 'referral' as Tab, icon: Icons.referral, label: 'Referral', desc: 'Earn 40% commission' },
  ];

  const serviceMenuItems = [
    { id: 'tokenScanner' as Tab, icon: Icons.tokenScanner, label: 'Token Scanner', desc: SERVICE_PRICING.tokenScanner.label, badge: 'NEW', price: SERVICE_PRICING.tokenScanner.price },
    { id: 'gasTracker' as Tab, icon: Icons.gasTracker, label: 'Gas Tracker', desc: SERVICE_PRICING.gasTracker.label, badge: 'LIVE', price: 0 },
    { id: 'academy' as Tab, icon: Icons.academy, label: 'Crypto Academy', desc: SERVICE_PRICING.academy.label, badge: 'FREE', price: 0 },
    { id: 'portfolio' as Tab, icon: Icons.portfolio, label: 'Portfolio Tracker', desc: SERVICE_PRICING.portfolio.label, badge: 'PAID', price: SERVICE_PRICING.portfolio.price },
    { id: 'whale' as Tab, icon: Icons.whale, label: 'Whale Alert', desc: SERVICE_PRICING.whale.label, badge: 'PAID', price: SERVICE_PRICING.whale.price },
    { id: 'airdrop' as Tab, icon: Icons.airdrop, label: 'Airdrop Alert', desc: SERVICE_PRICING.airdrop.label, badge: 'PAID', price: SERVICE_PRICING.airdrop.price },
    { id: 'swap' as Tab, icon: Icons.swap, label: 'Instant Swap', desc: SERVICE_PRICING.swap.label, badge: 'PAID', price: 0 },
    { id: 'tax' as Tab, icon: Icons.tax, label: 'Tax Calculator', desc: SERVICE_PRICING.tax.label, badge: 'PAID', price: SERVICE_PRICING.tax.price },
    { id: 'expert' as Tab, icon: Icons.expert, label: 'Expert Help', desc: SERVICE_PRICING.expert.label, badge: 'PAID', price: SERVICE_PRICING.expert.price },
  ];

  return (
    <div className="app">
      {message && <div className="toast">{message}</div>}

      {/* ─── Hamburger Menu Sidebar ─────────────── */}
      {menuOpen && <div className="sidebar-overlay" onClick={() => setMenuOpen(false)} />}
      <div className={`sidebar ${menuOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <svg width="36" height="36" viewBox="0 0 100 100" fill="none">
              <defs>
                <linearGradient id="sideGoldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#C48D0A" />
                  <stop offset="50%" stopColor="#FFD54F" />
                  <stop offset="100%" stopColor="#FFECB3" />
                </linearGradient>
              </defs>
              <polygon points="50,8 92,85 8,85" fill="none" stroke="url(#sideGoldGrad)" strokeWidth="4"/>
              <polygon points="50,22 80,78 20,78" fill="url(#sideGoldGrad)" opacity="0.9"/>
              <circle cx="50" cy="65" r="12" fill="#FFECB3" opacity="0.8"/>
            </svg>
            <div>
              <div className="sidebar-title">VANGUARD</div>
              <div className="sidebar-subtitle">Crypto Services</div>
            </div>
          </div>
          <button className="sidebar-close" onClick={() => setMenuOpen(false)}>
            {Icons.close}
          </button>
        </div>

        <div className="sidebar-content">
          {/* Main Navigation */}
          <div className="sidebar-section">
            <div className="sidebar-section-title">MAIN MENU</div>
            {mainMenuItems.map((item) => (
              <button
                key={item.id}
                className={`sidebar-item ${tab === item.id ? 'active' : ''}`}
                onClick={() => switchTab(item.id)}
              >
                <span className="sidebar-item-icon">{item.icon}</span>
                <div className="sidebar-item-text">
                  <div className="sidebar-item-label">{item.label}</div>
                  <div className="sidebar-item-desc">{item.desc}</div>
                </div>
                {tab === item.id && <span className="sidebar-active-dot" />}
              </button>
            ))}
          </div>

          <div className="sidebar-divider" />

          {/* Services */}
          <div className="sidebar-section">
            <div className="sidebar-section-title">🛠️ CRYPTO SERVICES</div>
            {serviceMenuItems.map((item) => (
              <button
                key={item.id}
                className={`sidebar-item ${item.disabled && !hasAccess(item.id) ? 'disabled' : ''} ${tab === item.id ? 'active' : ''}`}
                onClick={() => {
                  if (item.disabled && !hasAccess(item.id)) {
                    openPayment(item.id);
                    return;
                  }
                  switchTab(item.id);
                }}
              >
                <span className="sidebar-item-icon">{item.icon}</span>
                <div className="sidebar-item-text">
                  <div className="sidebar-item-label">{item.label}</div>
                  <div className="sidebar-item-desc">{item.desc}</div>
                </div>
                {item.badge && (
                  <span className={`sidebar-badge ${item.badge === 'NEW' ? 'badge-new' : item.badge === 'LIVE' ? 'badge-live' : item.badge === 'FREE' ? 'badge-free' : hasAccess(item.id) ? 'badge-new' : 'badge-paid'}`}>
                    {hasAccess(item.id) ? 'ACTIVE' : item.badge}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* My Purchases */}
          {(purchasedServices.size > 0 || Object.keys(activeSubscriptions).length > 0) && (
            <>
              <div className="sidebar-divider" />
              <div className="sidebar-section">
                <div className="sidebar-section-title">✅ MY PURCHASES</div>
                {Array.from(purchasedServices).map(serviceId => (
                  <div key={serviceId} className="sidebar-item" style={{cursor: 'default'}}>
                    <span className="sidebar-item-icon" style={{background: 'rgba(0, 184, 148, 0.1)', borderColor: 'rgba(0, 184, 148, 0.2)', color: '#00b894'}}>
                      {Icons.checkCircle}
                    </span>
                    <div className="sidebar-item-text">
                      <div className="sidebar-item-label" style={{color: '#00b894'}}>{serviceId.replace(/([A-Z])/g, ' $1').replace(/^./, (s: string) => s.toUpperCase())}</div>
                      <div className="sidebar-item-desc">Unlocked</div>
                    </div>
                  </div>
                ))}
                {Object.entries(activeSubscriptions).map(([serviceId, expiry]) => (
                  <div key={serviceId} className="sidebar-item" style={{cursor: 'default'}}>
                    <span className="sidebar-item-icon" style={{background: 'rgba(255, 213, 79, 0.1)', borderColor: 'rgba(255, 213, 79, 0.2)', color: '#FFD54F'}}>
                      {Icons.clock}
                    </span>
                    <div className="sidebar-item-text">
                      <div className="sidebar-item-label">{serviceId.replace(/([A-Z])/g, ' $1').replace(/^./, (s: string) => s.toUpperCase())}</div>
                      <div className="sidebar-item-desc">Until {new Date(expiry).toLocaleDateString()}</div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          <div className="sidebar-divider" />

          {/* Bottom Actions */}
          <div className="sidebar-section">
            <button className="sidebar-item" onClick={() => { setMenuOpen(false); window.open('https://t.me/VanguardStakingOfficial', '_blank'); }}>
              <span className="sidebar-item-icon">{Icons.support}</span>
              <div className="sidebar-item-text">
                <div className="sidebar-item-label">Support</div>
                <div className="sidebar-item-desc">Get help from admin</div>
              </div>
              <span className="sidebar-item-arrow">{Icons.externalLink}</span>
            </button>
          </div>
        </div>

        <div className="sidebar-footer">
          <div className="sidebar-footer-text">Vanguard Staking v2.0</div>
          <div className="sidebar-footer-sub">Powered by TRON Network</div>
        </div>
      </div>

      {/* ─── Header with Hamburger ─────────────── */}
      <div className="header">
        <div className="header-top">
          <button className="hamburger-btn" onClick={() => setMenuOpen(true)}>
            {Icons.menu}
          </button>
          <div className="header-badge">
            <span className="header-badge-dot" />
            Online
          </div>
        </div>
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
            <polygon points="50,8 92,85 8,85" fill="none" stroke="url(#goldGrad)" strokeWidth="3" filter="url(#glow)"/>
            <polygon points="50,22 80,78 20,78" fill="url(#goldGrad)" opacity="0.9"/>
            <circle cx="50" cy="65" r="12" fill="url(#goldGrad2)" filter="url(#glow)"/>
            <circle cx="50" cy="62" r="6" fill="#FFECB3" opacity="0.6"/>
          </svg>
        </div>
        <h1>VANGUARD STAKING</h1>
        <div className="subtitle">STAKE • EARN • GROW</div>
      </div>

      {/* ─── Dashboard ─────────────────────────── */}
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

          {/* Quick Access Services */}
          <div className="services-quick">
            <h3 className="services-quick-title">{Icons.zap} Quick Services</h3>
            <div className="services-quick-grid">
              <button className="service-quick-card" onClick={() => switchTab('tokenScanner')}>
                <span className="service-quick-icon">{Icons.tokenScanner}</span>
                <span className="service-quick-label">Scan</span>
                {hasAccess('tokenScanner') && <span className="service-quick-check">✓</span>}
              </button>
              <button className="service-quick-card" onClick={() => switchTab('gasTracker')}>
                <span className="service-quick-icon">{Icons.gasTracker}</span>
                <span className="service-quick-label">Gas</span>
              </button>
              <button className="service-quick-card" onClick={() => switchTab('academy')}>
                <span className="service-quick-icon">{Icons.academy}</span>
                <span className="service-quick-label">Learn</span>
              </button>
              <button className="service-quick-card" onClick={() => openPayment('swap')}>
                <span className="service-quick-icon">{Icons.swap}</span>
                <span className="service-quick-label">Swap</span>
                <span className="service-quick-price">0.3%</span>
              </button>
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

          {/* Real-time Crypto Prices */}
          <div className="card" style={{background: 'linear-gradient(135deg, #0E1630, #151E30)'}}>
            <h3>📈 Live Market Prices</h3>
            <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 10}}>
              {[
                { symbol: 'USDT', name: 'Tether', icon: '💵' },
                { symbol: 'BTC', name: 'Bitcoin', icon: '₿' },
                { symbol: 'ETH', name: 'Ethereum', icon: '⟠' },
                { symbol: 'TRX', name: 'TRON', icon: '⚡' },
              ].map((coin) => (
                <div key={coin.symbol} style={{background: 'rgba(11,16,35,0.5)', borderRadius: 10, padding: '10px 12px', border: '1px solid #1E2D45'}}>
                  <div style={{display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4}}>
                    <span style={{fontSize: 16}}>{coin.icon}</span>
                    <span style={{fontSize: 13, fontWeight: 600, color: '#FFD54F'}}>{coin.symbol}</span>
                  </div>
                  <div style={{fontSize: 15, fontWeight: 700, color: '#fff'}}>
                    ${cryptoPrices[coin.symbol.toLowerCase()]?.price?.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2}) || '...'}
                  </div>
                  <div style={{fontSize: 11, color: (cryptoPrices[coin.symbol.toLowerCase()]?.change || 0) >= 0 ? '#00b894' : '#e17055'}}>
                    {(cryptoPrices[coin.symbol.toLowerCase()]?.change || 0) >= 0 ? '▲' : '▼'} {Math.abs(cryptoPrices[coin.symbol.toLowerCase()]?.change || 0).toFixed(2)}%
                  </div>
                </div>
              ))}
            </div>
            <p style={{fontSize: 10, color: '#7A8CA5', textAlign: 'center', marginTop: 8}}>Data from CoinGecko • Auto-updates</p>
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

          {/* Gas Tracker Quick View */}
          {gasData && (
            <div className="card">
              <h3>{Icons.gasTracker} Live Gas Prices</h3>
              <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 10}}>
                {[
                  { key: 'ethereum', name: 'Ethereum', icon: '⟠', color: '#627EEA' },
                  { key: 'bsc', name: 'BSC', icon: '◈', color: '#F3BA2F' },
                  { key: 'tron', name: 'TRON', icon: '⚡', color: '#FF0013' },
                  { key: 'polygon', name: 'Polygon', icon: '⬡', color: '#8247E5' },
                ].map((n) => (
                  gasData[n.key] && (
                    <div key={n.key} style={{background: 'rgba(11,16,35,0.5)', borderRadius: 8, padding: '8px 10px', border: '1px solid #1E2D45'}}>
                      <div style={{display: 'flex', alignItems: 'center', gap: 4, marginBottom: 4}}>
                        <span style={{color: n.color, fontSize: 14}}>{n.icon}</span>
                        <span style={{fontSize: 11, color: '#7A8CA5'}}>{n.name}</span>
                      </div>
                      <div style={{fontSize: 14, fontWeight: 700, color: '#FFD54F'}}>{gasData[n.key].fast} <span style={{fontSize: 10, color: '#7A8CA5'}}>{gasData[n.key].unit}</span></div>
                    </div>
                  )
                ))}
              </div>
              <p style={{fontSize: 10, color: '#7A8CA5', textAlign: 'center', marginTop: 8}}>Updated: {gasData.timestamp}</p>
            </div>
          )}

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

      {/* ─── Stake Plans ───────────────────────── */}
      {tab === 'stake' && (
        <div key={pageKey}>
          <h2 className="page-title">Staking Plans</h2>
          {STAKE_PLANS.map((plan, i) => (
            <div key={plan.name} className="plan-card" onClick={() => { setSelectedPlan(plan); setShowStakeModal(true); }}>
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

      {/* ─── Active Stakes ─────────────────────── */}
      {tab === 'stakes' && (
        <div key={pageKey}>
          <h2 className="page-title">My Stakes</h2>
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
                  <button className="btn btn-success" onClick={() => handleClaim(stake.id)} disabled={actionLoading}>
                    {actionLoading ? 'Claiming...' : <span style={{display: 'inline-flex', alignItems: 'center', gap: 8}}>{Icons.claim} Claim Reward</span>}
                  </button>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* ─── Deposit ──────────────────────────── */}
      {tab === 'deposit' && (
        <div key={pageKey}>
          <h2 className="page-title">Deposit</h2>
          <div className="card deposit-card">
            <div style={{display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 12}}>
              {Icons.wallet}
              <h3 style={{margin: 0, fontSize: 16}}>Send USDT (TRC-20) to:</h3>
            </div>
            <div className="deposit-address">
              <div className="address">{OWNER_WALLET}</div>
            </div>
            <button className="btn btn-primary" onClick={() => { navigator.clipboard?.writeText(OWNER_WALLET); showMsg('Wallet address copied!'); }}>
              <span style={{display: 'inline-flex', alignItems: 'center', gap: 8}}>{Icons.copy} Copy Address</span>
            </button>
          </div>
          <div className="card">
            <h3 style={{display: 'flex', alignItems: 'center', gap: 8}}>{Icons.zap} Verify Your Deposit</h3>
            <p style={{color: '#7A8CA5', fontSize: 12, marginTop: 4, marginBottom: 12}}>
              After sending USDT, submit your deposit details below for verification.
            </p>
            <div className="input-group">
              <label>Amount (USDT)</label>
              <input type="number" placeholder="Enter deposited amount" value={depositAmount} onChange={(e) => setDepositAmount(e.target.value)} />
            </div>
            <div className="input-group">
              <label>Transaction Hash (Optional)</label>
              <input type="text" placeholder="TRC-20 TX Hash" value={depositTxHash} onChange={(e) => setDepositTxHash(e.target.value)} />
            </div>
            <button className="btn btn-success" onClick={async () => {
              const amount = parseFloat(depositAmount);
              if (isNaN(amount) || amount < 10) { showMsg('Minimum deposit: 10 USDT'); return; }
              try {
                setActionLoading(true);
                await submitDeposit(TELEGRAM_ID, amount, depositTxHash || undefined);
                showMsg(`Deposit of ${amount} USDT submitted!`);
                setDepositAmount(''); setDepositTxHash('');
                await loadData();
              } catch (err: any) { showMsg(err.message || 'Deposit failed'); }
              finally { setActionLoading(false); }
            }} disabled={actionLoading}>
              {actionLoading ? 'Submitting...' : <span style={{display: 'inline-flex', alignItems: 'center', gap: 8}}>{Icons.deposit} Submit Deposit</span>}
            </button>
          </div>
          <div className="card">
            <h3 style={{display: 'flex', alignItems: 'center', gap: 8}}>{Icons.info} Important</h3>
            <p style={{marginTop: 10, lineHeight: 1.8}}>
              • Send only <strong style={{color: '#FFD54F'}}>USDT (TRC-20)</strong> network<br/>
              • Minimum deposit: <strong style={{color: '#FFD54F'}}>10 USDT</strong><br/>
              • Balance updates after verification<br/>
              • Contact admin if not updated after 30 min
            </p>
          </div>
        </div>
      )}

      {/* ─── Withdraw ─────────────────────────── */}
      {tab === 'withdraw' && (
        <div key={pageKey}>
          <h2 className="page-title">Withdraw</h2>
          <div className="card">
            <div className="input-group">
              <label>Amount (USDT)</label>
              <input type="number" placeholder="Min 10 USDT" value={withdrawAmount} onChange={(e) => setWithdrawAmount(e.target.value)} />
            </div>
            <div className="input-group">
              <label>TRC-20 Wallet Address</label>
              <input type="text" placeholder="Enter your TRC-20 wallet" value={walletAddress} onChange={(e) => setWalletAddress(e.target.value)} />
            </div>
            <button className="btn btn-primary" onClick={handleWithdraw} disabled={actionLoading}>
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

      {/* ─── History ──────────────────────────── */}
      {tab === 'history' && (
        <div key={pageKey}>
          <h2 className="page-title">Transactions</h2>
          {transactions.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">{Icons.stakes}</div>
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

      {/* ─── Referral ─────────────────────────── */}
      {tab === 'referral' && (
        <div key={pageKey}>
          <h2 className="page-title">Referral</h2>
          <div className="referral-card">
            <h3 style={{display: 'flex', alignItems: 'center', gap: 8}}>{Icons.gift} Invite & Earn</h3>
            <p style={{color: '#7A8CA5', fontSize: 13, marginTop: 8}}>
              Share your referral link and earn <strong style={{color: '#FFD54F'}}>1 USDT</strong> for each friend who joins!
            </p>
            <div className="referral-link">
              https://t.me/vanguardstakingbot?start={TELEGRAM_ID}
            </div>
            <button className="btn btn-primary" onClick={() => { navigator.clipboard?.writeText(`https://t.me/vanguardstakingbot?start=${TELEGRAM_ID}`); showMsg('Referral link copied!'); }}>
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

      {/* ═══════════════════════════════════════════
          ─── NEW SERVICE PAGES ───────────────────
          ═══════════════════════════════════════════ */}

      {/* ─── Token Scanner ────────────────────── */}
      {tab === 'tokenScanner' && (
        <div key={pageKey}>
          <h2 className="page-title">
            <span style={{display: 'inline-flex', alignItems: 'center', gap: 8}}>{Icons.tokenScanner} Token Scanner</span>
          </h2>
          <div className="card" style={{background: 'linear-gradient(135deg, #151E30, #1a1a2e)'}}>
            <p style={{color: '#7A8CA5', fontSize: 13, marginBottom: 12}}>
              Check any token contract for safety before investing. Detect scams, rug pulls, and honeypots.
            </p>
            <div className="input-group">
              <label>Contract Address</label>
              <input
                type="text"
                placeholder="Enter TRC-20, ERC-20, or BEP-20 address..."
                value={scanAddress}
                onChange={(e) => setScanAddress(e.target.value)}
              />
            </div>
            {!hasAccess('tokenScanner') ? (
              <button className="btn btn-primary" onClick={() => openPayment('tokenScanner')}>
                <span style={{display: 'inline-flex', alignItems: 'center', gap: 8}}>
                  {Icons.zap} Unlock Scanner — 0.5 USDT
                </span>
              </button>
            ) : (
              <button className="btn btn-primary" onClick={handleScan} disabled={scanning}>
                {scanning ? (
                  <span style={{display: 'inline-flex', alignItems: 'center', gap: 8}}>
                    <span className="btn-spinner" /> Scanning...
                  </span>
                ) : (
                  <span style={{display: 'inline-flex', alignItems: 'center', gap: 8}}>{Icons.search} Scan Token</span>
                )}
              </button>
            )}
          </div>

          {scanResult && (
            <div className="scan-result" style={{animation: 'fadeInUp 0.4s ease'}}>
              {/* Score Card */}
              <div className="card scan-score-card">
                <div className="scan-score-ring">
                  <svg width="100" height="100" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="42" fill="none" stroke="#1E2D45" strokeWidth="6"/>
                    <circle
                      cx="50" cy="50" r="42" fill="none"
                      stroke={scanResult.score >= 70 ? '#00b894' : scanResult.score >= 40 ? '#F0D040' : '#e17055'}
                      strokeWidth="6"
                      strokeDasharray={`${scanResult.score * 2.64} 264`}
                      strokeLinecap="round"
                      transform="rotate(-90 50 50)"
                    />
                    <text x="50" y="50" textAnchor="middle" dominantBaseline="central" fill="#FFD54F" fontSize="24" fontWeight="700">
                      {scanResult.score}
                    </text>
                  </svg>
                </div>
                <div className="scan-score-label">
                  <div className="scan-score-title" style={{color: scanResult.score >= 70 ? '#00b894' : scanResult.score >= 40 ? '#F0D040' : '#e17055'}}>
                    {scanResult.score >= 70 ? 'Likely Safe' : scanResult.score >= 40 ? 'Caution' : 'High Risk'}
                  </div>
                  <div className="scan-score-network">{scanResult.network}</div>
                </div>
              </div>

              {/* Details */}
              <div className="card">
                <h3>📊 Contract Details</h3>
                <div className="scan-details">
                  <div className="scan-detail-row">
                    <span>Address</span>
                    <span className="scan-detail-value">{scanResult.address.slice(0, 8)}...{scanResult.address.slice(-6)}</span>
                  </div>
                  <div className="scan-detail-row">
                    <span>Holders</span>
                    <span className="scan-detail-value">{scanResult.holderCount.toLocaleString()}</span>
                  </div>
                  <div className="scan-detail-row">
                    <span>Liquidity</span>
                    <span className="scan-detail-value">${scanResult.liquidityUSD.toLocaleString()}</span>
                  </div>
                  <div className="scan-detail-row">
                    <span>Age</span>
                    <span className="scan-detail-value">{scanResult.age} days</span>
                  </div>
                </div>
              </div>

              {/* Safe Indicators */}
              {scanResult.safe.length > 0 && (
                <div className="card" style={{borderColor: 'rgba(0, 184, 148, 0.3)'}}>
                  <h3 style={{color: '#00b894'}}>✅ Safe Indicators</h3>
                  {scanResult.safe.map((item: string, i: number) => (
                    <div key={i} className="scan-list-item safe">
                      {Icons.checkCircle} {item}
                    </div>
                  ))}
                </div>
              )}

              {/* Risk Indicators */}
              {scanResult.risks.length > 0 && (
                <div className="card" style={{borderColor: 'rgba(225, 112, 85, 0.3)'}}>
                  <h3 style={{color: '#e17055'}}>⚠️ Risk Indicators</h3>
                  {scanResult.risks.map((item: string, i: number) => (
                    <div key={i} className="scan-list-item risk">
                      {Icons.alert} {item}
                    </div>
                  ))}
                </div>
              )}

              <div className="card">
                <p style={{fontSize: 11, color: '#7A8CA5', textAlign: 'center'}}>
                  ⚠️ This scan is for informational purposes only. Always DYOR before investing.
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ─── Gas Tracker ──────────────────────── */}
      {tab === 'gasTracker' && (
        <div key={pageKey}>
          <h2 className="page-title">
            <span style={{display: 'inline-flex', alignItems: 'center', gap: 8}}>{Icons.gasTracker} Gas Tracker</span>
          </h2>

          <div className="card" style={{background: 'linear-gradient(135deg, #151E30, #1a1a2e)'}}>
            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
              <div>
                <p style={{color: '#7A8CA5', fontSize: 12}}>Real-time gas prices</p>
                {gasData && <p style={{color: '#7A8CA5', fontSize: 11, marginTop: 4}}>Updated: {gasData.timestamp}</p>}
              </div>
              <button className="btn btn-secondary" style={{width: 'auto', padding: '8px 16px'}} onClick={fetchGas} disabled={gasLoading}>
                {gasLoading ? '...' : '🔄 Refresh'}
              </button>
            </div>
          </div>

          {gasData && (
            <div className="gas-networks">
              {[
                { key: 'ethereum', name: 'Ethereum', icon: '⟠', color: '#627EEA' },
                { key: 'bsc', name: 'BSC', icon: '◈', color: '#F3BA2F' },
                { key: 'tron', name: 'TRON', icon: '⚡', color: '#FF0013' },
                { key: 'polygon', name: 'Polygon', icon: '⬡', color: '#8247E5' },
              ].map((network) => (
                <div key={network.key} className="card gas-network-card">
                  <div className="gas-network-header">
                    <span className="gas-network-icon" style={{color: network.color}}>{network.icon}</span>
                    <span className="gas-network-name">{network.name}</span>
                    <span className="gas-network-unit">{gasData[network.key].unit}</span>
                  </div>
                  <div className="gas-levels">
                    <div className="gas-level">
                      <div className="gas-level-label">🐌 Low</div>
                      <div className="gas-level-value">{gasData[network.key].low}</div>
                    </div>
                    <div className="gas-level">
                      <div className="gas-level-label">🚗 Standard</div>
                      <div className="gas-level-value">{gasData[network.key].standard}</div>
                    </div>
                    <div className="gas-level">
                      <div className="gas-level-label">🚀 Fast</div>
                      <div className="gas-level-value highlight">{gasData[network.key].fast}</div>
                    </div>
                    <div className="gas-level">
                      <div className="gas-level-label">⚡ Instant</div>
                      <div className="gas-level-value danger">{gasData[network.key].instant}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="card">
            <h3>{Icons.info} Gas Tips</h3>
            <p style={{marginTop: 8, lineHeight: 1.8, fontSize: 13}}>
              • <strong style={{color: '#FFD54F'}}>Low</strong> — Cheapest, may take longer<br/>
              • <strong style={{color: '#FFD54F'}}>Standard</strong> — Recommended for most txns<br/>
              • <strong style={{color: '#FFD54F'}}>Fast</strong> — Confirms quickly<br/>
              • <strong style={{color: '#FFD54F'}}>Instant</strong> — Priority processing<br/>
              • Gas prices change every ~15 seconds
            </p>
          </div>
        </div>
      )}

      {/* ─── Crypto Academy ───────────────────── */}
      {tab === 'academy' && (
        <div key={pageKey}>
          <h2 className="page-title">
            <span style={{display: 'inline-flex', alignItems: 'center', gap: 8}}>{Icons.academy} Crypto Academy</span>
          </h2>

          <div className="card" style={{background: 'linear-gradient(135deg, #1a2a1a, #151E30)', border: '1px solid rgba(0, 184, 148, 0.3)'}}>
            <h3 style={{color: '#00b894'}}>🎓 Learn Crypto — 100% Free</h3>
            <p style={{marginTop: 8, fontSize: 13}}>
              Master blockchain, staking, DeFi, and security. From beginner to advanced — all free.
            </p>
          </div>

          {/* Category Filter */}
          <div className="academy-filters">
            {['All', 'Beginner', 'Intermediate', 'Advanced'].map((cat) => (
              <button
                key={cat}
                className={`academy-filter-btn ${academyFilter === cat ? 'active' : ''}`}
                onClick={() => setAcademyFilter(cat)}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Lessons */}
          {ACADEMY_LESSONS
            .filter(l => academyFilter === 'All' || l.category === academyFilter)
            .map((lesson, i) => (
              <div
                key={lesson.id}
                className="card academy-lesson-card"
                style={{animationDelay: `${i * 0.08}s`}}
                onClick={() => setSelectedLesson(lesson)}
              >
                <div className="academy-lesson-header">
                  <span className="academy-lesson-icon">{lesson.icon}</span>
                  <div className="academy-lesson-info">
                    <div className="academy-lesson-title">{lesson.title}</div>
                    <div className="academy-lesson-meta">
                      <span className={`academy-category ${lesson.category.toLowerCase()}`}>{lesson.category}</span>
                      <span className="academy-duration">{Icons.clock} {lesson.duration}</span>
                    </div>
                  </div>
                  <span className="academy-lesson-arrow">{Icons.arrowRight}</span>
                </div>
                <p className="academy-lesson-desc">{lesson.desc}</p>
              </div>
            ))}

          {/* Lesson Modal */}
          {selectedLesson && (
            <div className="modal-overlay" onClick={() => setSelectedLesson(null)}>
              <div className="modal" onClick={(e) => e.stopPropagation()}>
                <div style={{textAlign: 'center', marginBottom: 16}}>
                  <span style={{fontSize: 40}}>{selectedLesson.icon}</span>
                </div>
                <h2 style={{textAlign: 'center', fontSize: 18}}>{selectedLesson.title}</h2>
                <div style={{display: 'flex', justifyContent: 'center', gap: 12, margin: '12px 0'}}>
                  <span className={`academy-category ${selectedLesson.category.toLowerCase()}`}>{selectedLesson.category}</span>
                  <span style={{color: '#7A8CA5', fontSize: 12, display: 'flex', alignItems: 'center', gap: 4}}>{Icons.clock} {selectedLesson.duration}</span>
                </div>
                <p style={{color: '#7A8CA5', fontSize: 13, lineHeight: 1.8, textAlign: 'center', marginBottom: 16}}>
                  {selectedLesson.desc}
                </p>
                <div className="card" style={{background: '#0B1023', marginBottom: 16}}>
                  <p style={{fontSize: 13, lineHeight: 1.8, color: '#7A8CA5'}}>
                    {selectedLesson.id === 1 && (
                      <>Blockchain is a decentralized digital ledger that records transactions across many computers. Each block contains transaction data, a timestamp, and a cryptographic hash of the previous block — creating an immutable chain. This technology eliminates the need for trusted intermediaries and enables peer-to-peer value transfer.</>
                    )}
                    {selectedLesson.id === 2 && (
                      <>1. Download a trusted wallet app (Trust Wallet, MetaMask, or TronLink)<br/>2. Create a new wallet<br/>3. <strong style={{color: '#e17055'}}>Write down your seed phrase on paper</strong> — never digitally!<br/>4. Set a strong password<br/>5. Your wallet is ready to receive crypto!<br/><br/>⚠️ Never share your seed phrase with anyone.</>
                    )}
                    {selectedLesson.id === 3 && (
                      <>USDT (Tether) is a stablecoin pegged 1:1 to the US Dollar. Unlike Bitcoin or Ethereum, its value stays ~$1. It exists on multiple networks: TRC-20 (Tron), ERC-20 (Ethereum), BEP-20 (BSC). Stablecoins are essential for trading, staking, and transferring value without volatility.</>
                    )}
                    {selectedLesson.id === 4 && (
                      <>Staking means locking your crypto to support network operations and earn rewards. In Vanguard Staking, you deposit USDT and earn daily returns (1-3% depending on plan). Your principal is returned at the end of the staking period. Think of it like a high-yield savings account.</>
                    )}
                    {selectedLesson.id === 5 && (
                      <>DeFi (Decentralized Finance) removes middlemen from financial services. Key concepts: <strong>Lending</strong> — earn interest by lending crypto; <strong>Borrowing</strong> — take loans using crypto as collateral; <strong>Yield Farming</strong> — provide liquidity to earn fees; <strong>DEX</strong> — trade without centralized exchanges.</>
                    )}
                    {selectedLesson.id === 6 && (
                      <>Gas fees are payments made to process transactions on a blockchain. They compensate miners/validators. Fees vary by network congestion. Tips: transact during off-peak hours, use Layer 2 solutions, set custom gas prices, or use cheaper networks like TRON or BSC.</>
                    )}
                    {selectedLesson.id === 7 && (
                      <>Red flags to watch:<br/>• Anonymous team with no track record<br/>• No locked liquidity<br/>• Excessive token allocation to one wallet<br/>• Unrealistic promises (1000x guaranteed)<br/>• No audit or code review<br/>• Pressure tactics and FOMO marketing<br/><br/>Always verify contracts on block explorers before investing.</>
                    )}
                    {selectedLesson.id === 8 && (
                      <>A balanced crypto portfolio might include: <strong>50%</strong> in established coins (BTC, ETH), <strong>30%</strong> in mid-cap projects, <strong>15%</strong> in stablecoins/staking, <strong>5%</strong> in high-risk/speculative. Rebalance regularly, never invest more than you can afford to lose, and use dollar-cost averaging.</>
                    )}
                  </p>
                </div>
                <button className="btn btn-primary" onClick={() => setSelectedLesson(null)}>
                  Got it! ✓
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ─── Portfolio Tracker ────────────────── */}
      {tab === 'portfolio' && (
        <div key={pageKey}>
          <h2 className="page-title"><span style={{display: 'inline-flex', alignItems: 'center', gap: 8}}>{Icons.portfolio} Portfolio Tracker</span></h2>
          <div className="balance-card">
            <div className="label">Total Portfolio Value</div>
            <div className="amount">{((user?.balance || 0) + (user?.total_staked || 0) + (user?.affiliate_balance || 0)).toFixed(4)}<span>USDT</span></div>
            <div className="stats">
              <div className="stat" style={{'--i': 0} as any}><div className="stat-label">Available</div><div className="stat-value">{(user?.balance || 0).toFixed(2)}</div></div>
              <div className="stat" style={{'--i': 1} as any}><div className="stat-label">Staked</div><div className="stat-value">{(user?.total_staked || 0).toFixed(2)}</div></div>
              <div className="stat" style={{'--i': 2} as any}><div className="stat-label">Earned</div><div className="stat-value">{(user?.total_earned || 0).toFixed(4)}</div></div>
            </div>
          </div>
          <div className="card">
            <h3>📊 Asset Breakdown</h3>
            <div style={{marginTop: 12}}>
              {[{name: 'USDT (Available)', value: user?.balance || 0, color: '#00b894', pct: Math.max(5, ((user?.balance || 0) / Math.max(1, (user?.balance || 0) + (user?.total_staked || 0))) * 100)},
                {name: 'USDT (Staked)', value: user?.total_staked || 0, color: '#FFD54F', pct: Math.max(5, ((user?.total_staked || 0) / Math.max(1, (user?.balance || 0) + (user?.total_staked || 0))) * 100)},
                {name: 'Affiliate Earnings', value: user?.affiliate_balance || 0, color: '#2196F3', pct: Math.max(5, ((user?.affiliate_balance || 0) / Math.max(1, (user?.balance || 0) + (user?.total_staked || 0) + (user?.affiliate_balance || 0))) * 100)}
              ].map((asset, i) => (
                <div key={i} style={{marginBottom: 12}}>
                  <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: 4}}>
                    <span style={{fontSize: 13, color: '#fff'}}>{asset.name}</span>
                    <span style={{fontSize: 13, color: asset.color, fontWeight: 600}}>{asset.value.toFixed(2)} USDT</span>
                  </div>
                  <div style={{height: 6, background: '#1E2D45', borderRadius: 3, overflow: 'hidden'}}>
                    <div style={{height: '100%', width: `${asset.pct}%`, background: asset.color, borderRadius: 3, transition: 'width 1s ease'}} />
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="card">
            <h3>📈 Portfolio Stats</h3>
            <p style={{marginTop: 8, lineHeight: 1.8, fontSize: 13}}>
              Active Stakes: <strong style={{color: '#FFD54F'}}>{stakes.filter(s => s.status === 'active').length}</strong><br/>
              Total Transactions: <strong style={{color: '#FFD54F'}}>{transactions.length}</strong><br/>
              Referral Earnings: <strong style={{color: '#FFD54F'}}>{(user?.affiliate_balance || 0).toFixed(4)} USDT</strong><br/>
              Member Since: <strong style={{color: '#FFD54F'}}>{user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}</strong>
            </p>
          </div>
          <div className="card">
            <h3>💡 Portfolio Tips</h3>
            <p style={{marginTop: 8, lineHeight: 1.8, fontSize: 13, color: '#7A8CA5'}}>
              • Diversify across staking plans for balanced returns<br/>
              • Claim rewards daily to maximize compound growth<br/>
              • Refer friends to boost your affiliate earnings<br/>
              • Monitor gas fees before making transactions
            </p>
          </div>
        </div>
      )}

      {/* ─── Whale Alert ──────────────────────── */}
      {tab === 'whale' && (
        <div key={pageKey}>
          <h2 className="page-title"><span style={{display: 'inline-flex', alignItems: 'center', gap: 8}}>{Icons.whale} Whale Alert</span></h2>
          <div className="card" style={{background: 'linear-gradient(135deg, #0E1630, #151E30)'} }>
            <h3>🐋 Recent Large Transactions</h3>
            <p style={{color: '#7A8CA5', fontSize: 12, marginTop: 4}}>Tracking whale movements on major networks</p>
          </div>
          {[
            { network: 'TRON', amount: '2,500,000 USDT', from: 'TJYf8...k3xR', to: 'TKx3n...9pQz', time: '2 min ago', type: 'transfer' },
            { network: 'Ethereum', amount: '1,200 ETH', from: '0x742d...35Fk', to: '0x8913...42Ab', time: '8 min ago', type: 'transfer' },
            { network: 'BSC', amount: '500,000 USDT', from: '0x1234...5678', to: '0xABCD...EF01', time: '15 min ago', type: 'transfer' },
            { network: 'TRON', amount: '800,000 USDT', from: 'TWy3k...7mNp', to: 'TL98x...2vBs', time: '23 min ago', type: 'transfer' },
            { network: 'Ethereum', amount: '3,500 ETH', from: '0x4567...89AB', to: '0xCDEF...0123', time: '31 min ago', type: 'transfer' },
            { network: 'Polygon', amount: '1,000,000 USDT', from: '0x9876...5432', to: '0xFEDC...BA98', time: '45 min ago', type: 'transfer' },
          ].map((whale, i) => (
            <div key={i} className="card" style={{animationDelay: `${i * 0.08}s`}}>
              <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                <div>
                  <div style={{fontSize: 15, fontWeight: 700, color: '#FFD54F'}}>{whale.amount}</div>
                  <div style={{fontSize: 11, color: '#7A8CA5', marginTop: 2}}>{whale.network} • {whale.time}</div>
                </div>
                <span style={{fontSize: 10, background: 'rgba(255,213,79,0.1)', color: '#FFD54F', padding: '3px 8px', borderRadius: 6, border: '1px solid rgba(255,213,79,0.2)'}}>🐋 WHALE</span>
              </div>
              <div style={{fontSize: 11, color: '#7A8CA5', marginTop: 8, display: 'flex', justifyContent: 'space-between'}}>
                <span>From: {whale.from}</span>
                <span>To: {whale.to}</span>
              </div>
            </div>
          ))}
          <div className="card">
            <p style={{fontSize: 11, color: '#7A8CA5', textAlign: 'center'}}>
              🔄 Auto-refreshes every 5 minutes • Data from blockchain explorers
            </p>
          </div>
        </div>
      )}

      {/* ─── Airdrop Alert ────────────────────── */}
      {tab === 'airdrop' && (
        <div key={pageKey}>
          <h2 className="page-title"><span style={{display: 'inline-flex', alignItems: 'center', gap: 8}}>{Icons.airdrop} Airdrop Alert</span></h2>
          <div className="card" style={{background: 'linear-gradient(135deg, #1a2a1a, #151E30)', border: '1px solid rgba(0,184,148,0.3)'}}>
            <h3 style={{color: '#00b894'}}>🎁 Active Airdrops</h3>
            <p style={{color: '#7A8CA5', fontSize: 12, marginTop: 4}}>Verified airdrops from legitimate projects</p>
          </div>
          {[
            { name: 'TRON Ecosystem', token: 'TRX', reward: '50-500 TRX', deadline: 'Jul 30, 2026', status: 'Active', chain: 'TRON', difficulty: 'Easy' },
            { name: 'StarkNet Launch', token: 'STRK', reward: '100-2000 STRK', deadline: 'Aug 5, 2026', status: 'Active', chain: 'Ethereum L2', difficulty: 'Medium' },
            { name: 'Arbitrum Odyssey', token: 'ARB', reward: '50-500 ARB', deadline: 'Aug 12, 2026', status: 'Active', chain: 'Arbitrum', difficulty: 'Easy' },
            { name: 'Polygon zkEVM', token: 'POL', reward: '200-1000 POL', deadline: 'Aug 20, 2026', status: 'Upcoming', chain: 'Polygon', difficulty: 'Medium' },
            { name: 'Base Protocol', token: 'BASE', reward: 'TBA', deadline: 'Sep 1, 2026', status: 'Upcoming', chain: 'Base', difficulty: 'Hard' },
          ].map((airdrop, i) => (
            <div key={i} className="card" style={{animationDelay: `${i * 0.08}s`}}>
              <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start'}}>
                <div>
                  <div style={{fontSize: 15, fontWeight: 700, color: '#FFD54F'}}>{airdrop.name}</div>
                  <div style={{fontSize: 12, color: '#7A8CA5', marginTop: 2}}>Token: {airdrop.token} • Chain: {airdrop.chain}</div>
                </div>
                <span style={{fontSize: 10, padding: '3px 8px', borderRadius: 6, background: airdrop.status === 'Active' ? 'rgba(0,184,148,0.15)' : 'rgba(240,208,64,0.15)', color: airdrop.status === 'Active' ? '#00b894' : '#F0D040', border: `1px solid ${airdrop.status === 'Active' ? 'rgba(0,184,148,0.3)' : 'rgba(240,208,64,0.3)'}`}}>
                  {airdrop.status}
                </span>
              </div>
              <div style={{display: 'flex', justifyContent: 'space-between', marginTop: 8, fontSize: 12}}>
                <span style={{color: '#00b894'}}>Reward: {airdrop.reward}</span>
                <span style={{color: '#7A8CA5'}}>Deadline: {airdrop.deadline}</span>
              </div>
              <div style={{marginTop: 6, fontSize: 11, color: '#7A8CA5'}}>Difficulty: {airdrop.difficulty}</div>
            </div>
          ))}
        </div>
      )}

      {/* ─── Instant Swap ─────────────────────── */}
      {tab === 'swap' && (
        <div key={pageKey}>
          <h2 className="page-title"><span style={{display: 'inline-flex', alignItems: 'center', gap: 8}}>{Icons.swap} Instant Swap</span></h2>
          <div className="card">
            <h3>💱 Swap Tokens</h3>
            <p style={{color: '#7A8CA5', fontSize: 12, marginTop: 4}}>Best rates across DEX aggregators</p>
            <div className="input-group" style={{marginTop: 12}}>
              <label>From</label>
              <select style={{width: '100%', padding: '12px 14px', borderRadius: 10, border: '1px solid #1E2D45', background: '#0B1023', color: '#fff', fontSize: 14, outline: 'none'}}>
                <option>USDT (TRC-20)</option>
                <option>USDT (ERC-20)</option>
                <option>USDT (BEP-20)</option>
                <option>TRX</option>
                <option>ETH</option>
                <option>BNB</option>
              </select>
            </div>
            <div style={{textAlign: 'center', padding: '8px 0', color: '#7A8CA5', cursor: 'pointer', fontSize: 20}}>↕</div>
            <div className="input-group">
              <label>To (Estimated)</label>
              <select style={{width: '100%', padding: '12px 14px', borderRadius: 10, border: '1px solid #1E2D45', background: '#0B1023', color: '#fff', fontSize: 14, outline: 'none'}}>
                <option>TRX</option>
                <option>USDT (TRC-20)</option>
                <option>ETH</option>
                <option>BNB</option>
                <option>BTC</option>
              </select>
            </div>
            <div className="input-group">
              <label>Amount</label>
              <input type="number" placeholder="Enter amount" />
            </div>
            <div style={{background: 'rgba(11,16,35,0.5)', borderRadius: 8, padding: 12, margin: '12px 0', border: '1px solid #1E2D45'}}>
              <div style={{display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 6}}>
                <span style={{color: '#7A8CA5'}}>Rate</span>
                <span style={{color: '#FFD54F'}}>1 USDT ≈ 3.02 TRX</span>
              </div>
              <div style={{display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 6}}>
                <span style={{color: '#7A8CA5'}}>Fee</span>
                <span style={{color: '#FFD54F'}}>0.3%</span>
              </div>
              <div style={{display: 'flex', justifyContent: 'space-between', fontSize: 13}}>
                <span style={{color: '#7A8CA5'}}>Min. received</span>
                <span style={{color: '#00b894'}}>~2.98 TRX</span>
              </div>
            </div>
            <button className="btn btn-primary">{Icons.swap} Swap Now</button>
          </div>
          <div className="card">
            <h3>💡 Swap Info</h3>
            <p style={{marginTop: 8, lineHeight: 1.8, fontSize: 13, color: '#7A8CA5'}}>
              • Best rates from 1inch, Paraswap, Jupiter<br/>
              • 0.3% fee per swap<br/>
              • Instant settlement<br/>
              • Cross-chain supported
            </p>
          </div>
        </div>
      )}

      {/* ─── Tax Calculator ───────────────────── */}
      {tab === 'tax' && (
        <div key={pageKey}>
          <h2 className="page-title"><span style={{display: 'inline-flex', alignItems: 'center', gap: 8}}>{Icons.tax} Tax Calculator</span></h2>
          <div className="card">
            <h3>🧮 Crypto Tax Report</h3>
            <p style={{color: '#7A8CA5', fontSize: 12, marginTop: 4}}>Based on your Vanguard Staking activity</p>
          </div>
          <div className="card">
            <h3>📊 Tax Summary</h3>
            <div style={{marginTop: 12}}>
              <div style={{display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #1E2D45'}}>
                <span style={{color: '#7A8CA5', fontSize: 13}}>Total Deposits</span>
                <span style={{color: '#FFD54F', fontWeight: 600, fontSize: 13}}>{transactions.filter(t => t.type === 'deposit').reduce((s, t) => s + parseFloat(t.amount), 0).toFixed(2)} USDT</span>
              </div>
              <div style={{display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #1E2D45'}}>
                <span style={{color: '#7A8CA5', fontSize: 13}}>Total Withdrawals</span>
                <span style={{color: '#FFD54F', fontWeight: 600, fontSize: 13}}>{transactions.filter(t => t.type === 'withdrawal').reduce((s, t) => s + parseFloat(t.amount), 0).toFixed(2)} USDT</span>
              </div>
              <div style={{display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #1E2D45'}}>
                <span style={{color: '#7A8CA5', fontSize: 13}}>Staking Rewards</span>
                <span style={{color: '#00b894', fontWeight: 600, fontSize: 13}}>{transactions.filter(t => t.type === 'reward_claim').reduce((s, t) => s + parseFloat(t.amount), 0).toFixed(4)} USDT</span>
              </div>
              <div style={{display: 'flex', justifyContent: 'space-between', padding: '10px 0'}}>
                <span style={{color: '#7A8CA5', fontSize: 13}}>Total Transactions</span>
                <span style={{color: '#FFD54F', fontWeight: 600, fontSize: 13}}>{transactions.length}</span>
              </div>
            </div>
          </div>
          <div className="card">
            <h3>📋 Transaction History</h3>
            {transactions.length === 0 ? (
              <p style={{color: '#7A8CA5', fontSize: 13, marginTop: 8}}>No transactions yet</p>
            ) : (
              transactions.slice(0, 10).map((tx, i) => (
                <div key={i} style={{display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #1E2D45', fontSize: 12}}>
                  <span style={{color: '#7A8CA5'}}>{tx.type.replace(/_/g, ' ')} • {new Date(tx.created_at).toLocaleDateString()}</span>
                  <span style={{color: tx.type === 'reward_claim' ? '#00b894' : '#e17055', fontWeight: 600}}>{tx.type === 'reward_claim' ? '+' : '-'}{parseFloat(tx.amount).toFixed(4)} USDT</span>
                </div>
              ))
            )}
          </div>
          <div className="card">
            <h3>⚠️ Disclaimer</h3>
            <p style={{marginTop: 8, lineHeight: 1.8, fontSize: 12, color: '#7A8CA5'}}>
              This report is for informational purposes only. Consult a tax professional for accurate tax filing. Tax laws vary by jurisdiction.
            </p>
          </div>
        </div>
      )}

      {/* ─── Expert Help ──────────────────────── */}
      {tab === 'expert' && (
        <div key={pageKey}>
          <h2 className="page-title"><span style={{display: 'inline-flex', alignItems: 'center', gap: 8}}>{Icons.expert} Expert Help</span></h2>
          <div className="card" style={{background: 'linear-gradient(135deg, #1a2a1a, #151E30)', border: '1px solid rgba(0,184,148,0.3)'}}>
            <h3 style={{color: '#00b894'}}>👨‍💼 1-on-1 Crypto Consultation</h3>
            <p style={{color: '#7A8CA5', fontSize: 12, marginTop: 4}}>Get expert advice on staking, DeFi, portfolio management</p>
          </div>
          <div className="card">
            <h3>📋 Available Experts</h3>
            {[{name: 'Staking Specialist', expertise: 'USDT staking, yield optimization', rate: '25 USDT/session', rating: '4.9 ⭐', sessions: '150+'},
              {name: 'DeFi Advisor', expertise: 'DeFi protocols, liquidity farming', rate: '25 USDT/session', rating: '4.8 ⭐', sessions: '120+'},
              {name: 'Security Expert', expertise: 'Wallet security, scam detection', rate: '25 USDT/session', rating: '5.0 ⭐', sessions: '200+'},
            ].map((expert, i) => (
              <div key={i} style={{background: 'rgba(11,16,35,0.5)', borderRadius: 10, padding: 12, marginTop: 10, border: '1px solid #1E2D45'}}>
                <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                  <div style={{fontSize: 14, fontWeight: 600, color: '#FFD54F'}}>{expert.name}</div>
                  <span style={{fontSize: 11, color: '#00b894'}}>{expert.rating}</span>
                </div>
                <div style={{fontSize: 12, color: '#7A8CA5', marginTop: 4}}>{expert.expertise}</div>
                <div style={{display: 'flex', justifyContent: 'space-between', marginTop: 6, fontSize: 12}}>
                  <span style={{color: '#FFD54F'}}>{expert.rate}</span>
                  <span style={{color: '#7A8CA5'}}>{expert.sessions} sessions</span>
                </div>
              </div>
            ))}
          </div>
          <div className="card">
            <h3>📞 Book a Session</h3>
            <p style={{color: '#7A8CA5', fontSize: 13, marginTop: 8, lineHeight: 1.8}}>
              1. Choose an expert above<br/>
              2. Pay 25 USDT from your balance<br/>
              3. Get 30-minute 1-on-1 consultation<br/>
              4. Session via Telegram voice call
            </p>
            <button className="btn btn-primary" style={{marginTop: 12}}>{Icons.expert} Book Session (25 USDT)</button>
          </div>
          <div className="card">
            <h3>💬 Quick Questions?</h3>
            <p style={{color: '#7A8CA5', fontSize: 13, marginTop: 8}}>
              For quick questions, contact admin: <a href="https://t.me/vanguardstakingbot" style={{color: '#FFD54F"}}>t.me/vanguardstakingbot</a>
            </p>
          </div>
        </div>
      )}

      {/* ─── Stake Modal ──────────────────────── */}
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
              <input type="number" placeholder={`Min ${selectedPlan.minAmount} USDT`} value={stakeAmount} onChange={(e) => setStakeAmount(e.target.value)} />
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

      {/* ─── Payment Modal ─────────────────── */}
      {showPaymentModal && SERVICE_PRICING[paymentService] && (
        <div className="modal-overlay" onClick={() => setShowPaymentModal(false)}>
          <div className="modal payment-modal" onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className="payment-header">
              <div className="payment-icon-wrap">
                {paymentService === 'tokenScanner' && Icons.tokenScanner}
                {paymentService === 'portfolio' && Icons.portfolio}
                {paymentService === 'whale' && Icons.whale}
                {paymentService === 'airdrop' && Icons.airdrop}
                {paymentService === 'swap' && Icons.swap}
                {paymentService === 'tax' && Icons.tax}
                {paymentService === 'expert' && Icons.expert}
              </div>
              <h2>Unlock {paymentService.replace(/([A-Z])/g, ' $1').replace(/^./, (s: string) => s.toUpperCase())}</h2>
              <div className="payment-price-tag">
                <span className="payment-price-amount">{SERVICE_PRICING[paymentService].price}</span>
                <span className="payment-price-unit">USDT</span>
              </div>
              <div className="payment-price-label">{SERVICE_PRICING[paymentService].label}</div>
            </div>

            {/* Balance Info */}
            <div className="payment-balance-info">
              <span>Your Balance:</span>
              <span className="payment-balance-amount">{(user?.balance || 0).toFixed(4)} USDT</span>
            </div>

            {/* Payment Methods */}
            <div className="payment-methods">
              <div className="payment-section-title">Select Payment Method</div>

              {/* Method 1: Balance Pay */}
              <button
                className={`payment-method-btn ${paymentMethod === 'balance' ? 'active' : ''}`}
                onClick={() => setPaymentMethod('balance')}
              >
                <div className="payment-method-icon">{Icons.wallet}</div>
                <div className="payment-method-info">
                  <div className="payment-method-name">Vanguard Balance</div>
                  <div className="payment-method-desc">Pay from your staking balance</div>
                </div>
                <div className={`payment-radio ${paymentMethod === 'balance' ? 'checked' : ''}`} />
              </button>

              {/* Method 2: Direct USDT */}
              <button
                className={`payment-method-btn ${paymentMethod === 'direct' ? 'active' : ''}`}
                onClick={() => setPaymentMethod('direct')}
              >
                <div className="payment-method-icon">{Icons.deposit}</div>
                <div className="payment-method-info">
                  <div className="payment-method-name">Direct USDT (TRC-20)</div>
                  <div className="payment-method-desc">Send USDT to payment wallet</div>
                </div>
                <div className={`payment-radio ${paymentMethod === 'direct' ? 'checked' : ''}`} />
              </button>
            </div>

            {/* Direct Payment Address */}
            {paymentMethod === 'direct' && (
              <div className="payment-direct-section">
                <div className="payment-direct-address">
                  <div className="payment-direct-label">Send exactly <strong style={{color: '#FFD54F'}}>{SERVICE_PRICING[paymentService].price} USDT</strong> to:</div>
                  <div className="payment-wallet-box">
                    <span className="payment-wallet-text">{OWNER_WALLET}</span>
                    <button className="payment-copy-btn" onClick={() => { navigator.clipboard?.writeText(OWNER_WALLET); showMsg('Copied!'); }}>
                      {Icons.copy}
                    </button>
                  </div>
                  <div className="payment-direct-note">
                    After sending, click "I've Paid" below. Access unlocks after verification.
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="payment-actions">
              <button className="btn btn-secondary" onClick={() => setShowPaymentModal(false)}>Cancel</button>
              {paymentMethod === 'balance' ? (
                <button
                  className="btn btn-primary"
                  onClick={handlePayment}
                  disabled={paymentProcessing || (user?.balance || 0) < SERVICE_PRICING[paymentService].price}
                >
                  {paymentProcessing ? (
                    <span style={{display: 'inline-flex', alignItems: 'center', gap: 8}}>
                      <span className="btn-spinner" /> Processing...
                    </span>
                  ) : (
                    <span style={{display: 'inline-flex', alignItems: 'center', gap: 8}}>
                      {Icons.zap} Pay {SERVICE_PRICING[paymentService].price} USDT
                    </span>
                  )}
                </button>
              ) : (
                <button
                  className="btn btn-success"
                  onClick={handlePayment}
                  disabled={paymentProcessing}
                >
                  {paymentProcessing ? (
                    <span style={{display: 'inline-flex', alignItems: 'center', gap: 8}}>
                      <span className="btn-spinner" /> Verifying...
                    </span>
                  ) : (
                    <span style={{display: 'inline-flex', alignItems: 'center', gap: 8}}>
                      {Icons.checkCircle} I've Paid
                    </span>
                  )}
                </button>
              )}
            </div>

            {/* Security Note */}
            <div className="payment-security">
              {Icons.shield} <span>Secure payment • Instant access • No refund</span>
            </div>
          </div>
        </div>
      )}

      {/* ─── Bottom Navigation ────────────────── */}
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
