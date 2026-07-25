# Vanguard Staking — Project Context & Instructions

## 📋 Project Overview

**Vanguard Staking** is a full-stack Telegram Mini App and Bot for USDT staking on the TRON (TRC-20) network. Users can stake USDT, earn daily rewards, refer friends, withdraw earnings, and access premium crypto tools — all within Telegram.

- **Live URL:** https://vanguard-staking.vercel.app
- **Telegram Bot:** https://t.me/vanguardstakingbot
- **Channel:** https://t.me/VanguardStakingOfficial
- **GitHub:** https://github.com/itsrealaminul/vanguard-staking

---

## 🏗️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + Vite + TypeScript |
| Backend | Express.js (Single Vercel Serverless Function) |
| Database | Supabase (PostgreSQL) |
| Bot | node-telegram-bot-api (Webhook mode) |
| Hosting | Vercel (Hobby plan — max 12 functions) |
| Network | TRON (TRC-20) |
| Real-time Data | CoinGecko, Etherscan, BSCScan, TronGrid, PolygonScan |

---

## 📁 Project Structure

```
vanguard-staking/
├── api/
│   ├── index.ts          # ALL API endpoints (Express app — single function)
│   ├── health.ts         # Health check endpoint
│   ├── setup-bot.ts      # Bot commands & description setup
│   └── webhook.ts        # Telegram webhook handler
├── public/
│   ├── banner.png        # Bot welcome banner (1280x640)
│   └── banner.svg        # Banner source (SVG)
├── src/
│   ├── App.tsx           # Main React app (all pages + services)
│   ├── api.ts            # Frontend API utility functions
│   ├── index.css         # All styles + animations
│   ├── main.tsx          # React entry point
│   └── vite-env.d.ts     # Vite type declarations
├── supabase-service-purchases.sql  # Service purchases table SQL
├── CONTEXT.md            # This file — project documentation
├── index.html            # HTML entry point
├── package.json          # Dependencies
├── tsconfig.json         # TypeScript config
├── vercel.json           # Vercel routing config
└── vite.config.ts        # Vite build config
```

---

## 🔑 Environment Variables (Vercel)

| Variable | Description | Example |
|----------|-------------|---------|
| `SUPABASE_URL` | Supabase project URL | `https://sudpqfzogswuvhoblbyj.supabase.co` |
| `SUPABASE_ANON_KEY` | Supabase public key | `sb_publishable_xxx` |
| `BOT_TOKEN` | Telegram Bot token | `898922…DDLA` |
| `APP_URL` | Vercel deployment URL | `https://vanguard-staking.vercel.app` |
| `ADMIN_TELEGRAM_ID` | Admin Telegram user ID | `7010136281` |
| `CHANNEL_ID` | Telegram channel for auto-posts | `@VanguardStakingOfficial` |
| `OWNER_WALLET_ADDRESS` | TRC-20 deposit wallet | `TQ5zn9C7CAko9gKs3RRYyA1Tj9YasXxuLh` |
| `VITE_OWNER_WALLET_ADDRESS` | Same (for frontend build) | `TQ5zn9C7CAko9gKs3RRYyA1Tj9YasXxuLh` |

---

## 🗄️ Supabase Database Schema

### Users Table
```sql
CREATE TABLE public.users (
  telegram_id BIGINT PRIMARY KEY,
  username TEXT,
  first_name TEXT,
  balance NUMERIC DEFAULT 0,
  affiliate_balance NUMERIC DEFAULT 0,
  total_staked NUMERIC DEFAULT 0,
  total_earned NUMERIC DEFAULT 0,
  referrer_id BIGINT,
  referrals_count INTEGER DEFAULT 0,
  last_claim_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Stakes Table
```sql
CREATE TABLE public.stakes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  telegram_id BIGINT REFERENCES public.users(telegram_id),
  amount NUMERIC NOT NULL,
  plan_days INTEGER NOT NULL,
  daily_rate NUMERIC NOT NULL,
  start_date TIMESTAMPTZ DEFAULT NOW(),
  end_date TIMESTAMPTZ NOT NULL,
  last_reward_claim TIMESTAMPTZ DEFAULT NOW(),
  status TEXT DEFAULT 'active'
);
```

### Withdrawals Table
```sql
CREATE TABLE public.withdrawals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  telegram_id BIGINT REFERENCES public.users(telegram_id),
  amount NUMERIC NOT NULL,
  wallet_address TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Transactions Table
```sql
CREATE TABLE public.transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  telegram_id BIGINT REFERENCES public.users(telegram_id),
  type TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  details TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Service Purchases Table
```sql
CREATE TABLE public.service_purchases (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  telegram_id BIGINT,
  service_id TEXT NOT NULL,
  price NUMERIC NOT NULL,
  payment_method TEXT NOT NULL DEFAULT 'balance',
  status TEXT NOT NULL DEFAULT 'pending',
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_service_purchases_user_service
ON public.service_purchases(telegram_id, service_id);

ALTER TABLE public.service_purchases DISABLE ROW LEVEL SECURITY;
```

### RLS Disable (Required for Serverless)
```sql
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.stakes DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.withdrawals DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_purchases DISABLE ROW LEVEL SECURITY;
```

---

## 📡 API Endpoints

All endpoints are in a single Express app (`api/index.ts`).

### Core Routes
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Health check |
| GET | `/api/user?telegram_id=` | Get or create user |
| POST | `/api/user` | Update user |
| POST | `/api/deposit` | Submit deposit (min 10 USDT) |
| GET | `/api/stakes?telegram_id=` | Get user stakes |
| POST | `/api/stakes` | Create new stake |
| GET | `/api/withdrawals?telegram_id=` | Get withdrawals |
| POST | `/api/withdrawals` | Request withdrawal (deducts balance) |
| GET | `/api/transactions?telegram_id=` | Get transactions |
| POST | `/api/claim-reward` | Claim stake reward |
| POST | `/api/referral` | Process referral |

### Real-time Data Routes
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/gas` | Gas prices (ETH, BSC, TRON, Polygon) |
| GET | `/api/scan?address=` | Token scanner (TRC-20, ERC-20) |
| GET | `/api/prices` | 20 crypto prices (CoinGecko) |
| GET | `/api/whale-alerts` | Large blockchain transactions |
| GET | `/api/airdrops` | Active airdrop listings |

### Service Payment Routes
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/service/purchase` | Purchase service (balance/direct) |
| GET | `/api/service/access?telegram_id=&service_id=` | Check service access |
| POST | `/api/service/verify` | Admin approve/reject payment |

### Admin Routes
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/users?telegram_id=` | Get all users (admin only) |
| GET | `/api/admin/withdrawals?telegram_id=` | Get all withdrawals |
| POST | `/api/admin/withdrawal` | Approve/reject withdrawal |
| GET | `/api/admin/pending-payments?telegram_id=` | List pending payments |

### Bot Routes
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/webhook` | Telegram webhook handler |
| GET | `/api/setup-bot` | Configure bot commands & description |

---

## 🤖 Bot Features

### Commands
| Command | Description |
|---------|-------------|
| `/start` | Welcome message with banner + referral handling |
| `/stake` | Open staking mini app |
| `/scan` | Token scanner info |
| `/gas` | Gas prices info |
| `/learn` | Crypto Academy info |
| `/referral` | Get referral link |
| `/payments` | **Admin:** List pending payments |
| `/approve <user_id> <service>` | **Admin:** Approve payment |
| `/reject <user_id> <service>` | **Admin:** Reject payment |
| `/help` | Show help |

### Welcome Message Format
```
━━━━━━━━━━━━━━━━━━━━━━━━━━
⚔️ VANGUARD STAKING ⚔️
━━━━━━━━━━━━━━━━━━━━━━━━━━

Welcome, {name}! 👋

💰 Stake USDT → Earn up to 3% daily
🔒 Secure → TRC-20 Protocol
⚡ Fast → Instant Deposits
🌍 Trusted → 5,000+ Users
👥 Earn More → 40% Commissions

━━━━━━━━━ NEW SERVICES ━━━━━━━━
🔍 Token Scanner → Check safety
⛽ Gas Tracker → Real-time prices
🎓 Crypto Academy → Learn free

━━━━━━━━━━━━━━━━━━━━━━━━━━
🚀 Tap below to start your journey!
━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### Channel Auto-Posts (@VanguardStakingOfficial)
| Event | Post Format |
|-------|-------------|
| 🆕 New user | `New User Joined! @username` |
| 💰 Deposit | `New Deposit! @username deposited X USDT` |
| 🔒 Stake | `New Stake! @username staked X USDT (Y days)` |
| 🎁 Claim | `Reward Claimed! @username claimed X USDT` |
| 👥 Referral | `New Referral! @user joined via @referrer` |
| 💸 Withdrawal | `Withdrawal Request! @username X USDT` |
| ✅ Approved | `Withdrawal Approved! @username X USDT` |
| ❌ Rejected | `Withdrawal Rejected! @username X USDT` |
| 🛒 Purchase | `Service Purchased! @username bought X` |
| 🔔 Payment | `Payment Pending! @username needs verification` |

---

## 🍔 Hamburger Menu & Sidebar

### Menu Structure
```
🍔 Hamburger Menu (Slide-in Sidebar)
├── MAIN MENU
│   ├── 🏠 Home (Dashboard)
│   ├── 📋 Staking Plans
│   ├── 📈 My Stakes
│   ├── 💰 Deposit
│   ├── 💸 Withdraw
│   └── 👥 Referral
├── ─────────────────
├── 🛠️ CRYPTO SERVICES
│   ├── 🔍 Token Scanner [PAID - 0.5 USDT/scan]
│   ├── ⛽ Gas Tracker [FREE]
│   ├── 🎓 Crypto Academy [FREE]
│   ├── 📊 Portfolio Tracker [PAID - 5 USDT/month]
│   ├── 🐋 Whale Alert [PAID - 10 USDT/month]
│   ├── 🎁 Airdrop Alert [PAID - 3 USDT/month]
│   ├── 💱 Instant Swap [PAID - 0.3% fee]
│   ├── 🧮 Tax Calculator [PAID - 15 USDT/report]
│   └── 👨‍💼 Expert Help [PAID - 25 USDT/session]
├── ─────────────────
├── ✅ MY PURCHASES (shows active services)
└── 📞 Support
```

---

## 💰 Payment System

### Payment Methods
| Method | Verification | How it Works |
|--------|-------------|--------------|
| **Balance Pay** | Auto (instant) | Deducts from user's Vanguard balance |
| **Direct USDT** | Manual (admin) | User sends USDT → Admin verifies → Approves |

### Service Pricing
| Service | Price | Type |
|---------|-------|------|
| Token Scanner | 0.5 USDT | Per scan |
| Gas Tracker | Free | Free |
| Crypto Academy | Free | Free |
| Portfolio Tracker | 5 USDT/month | Subscription |
| Whale Alert | 10 USDT/month | Subscription |
| Airdrop Alert | 3 USDT/month | Subscription |
| Instant Swap | 0.3% fee | Per swap |
| Tax Calculator | 15 USDT/report | Per use |
| Expert Help | 25 USDT/session | Per session |

### Admin Verification Flow
```
1. User sends USDT to wallet → clicks "I've Paid"
2. Bot sends DM to admin:
   "🔔 Payment Verification Needed!
    👤 @username (ID: 123456)
    🔧 Token Scanner • 0.5 USDT"
3. Admin checks wallet → verifies payment received
4. Admin types in bot: /approve 123456 tokenScanner
5. User gets DM: "✅ Payment Verified!"
6. Service activates for 30 days
```

### Admin Bot Commands
| Command | Description |
|---------|-------------|
| `/payments` | List all pending payments |
| `/approve <user_id> <service>` | Approve and activate service |
| `/reject <user_id> <service>` | Reject payment |

---

## 🎨 Frontend Pages (Mini App)

### Bottom Navigation Tabs
| Tab | Icon | Description |
|-----|------|-------------|
| **Home** | 🏠 | Balance, crypto market, gas, quick services |
| **Plans** | 📋 | 4 staking plans with progress bars |
| **Stakes** | 📈 | Active stakes with claim rewards + progress |
| **Deposit** | 💰 | Wallet address + deposit verification form |
| **Withdraw** | 💸 | Withdrawal form + history |
| **Referral** | 👥 | Referral link + stats |

### Sidebar Service Pages
| Page | Features |
|------|----------|
| **🔍 Token Scanner** | Contract address input → Safety score (0-100) → Risk/safe indicators |
| **⛽ Gas Tracker** | 4 networks (ETH, BSC, TRON, Polygon) → Low/Standard/Fast/Instant |
| **🎓 Crypto Academy** | 8 lessons → 3 categories (Beginner/Intermediate/Advanced) → Detail modals |
| **📊 Portfolio Tracker** | Balance breakdown → Asset allocation → Progress bars → Stats |
| **🐋 Whale Alert** | Large transactions list → Network/amount/time → Auto-refresh |
| **🎁 Airdrop Alert** | Active airdrops → Token/reward/deadline/chain/difficulty |
| **💱 Instant Swap** | Token pair selector → Rate/fee calculator → Swap button |
| **🧮 Tax Calculator** | Transaction summary → Deposits/withdrawals/rewards → History |
| **👨‍💼 Expert Help** | Expert listings → Specialties/ratings → Book session button |

### Dashboard Features
- 💰 Balance card (available, staked, earned, referrals)
- 📈 **Live Crypto Market** — 20 tokens with search, tap for details
- ⛽ **Gas Prices** — 4 networks real-time
- 🔍 Quick Services grid (Scan, Gas, Learn, Swap)
- 📊 Trust indicators
- 💡 How It Works
- 🎁 Affiliate commission info

### Live Crypto Market (20 Tokens)
USDT, BTC, ETH, TRX, BNB, SOL, XRP, ADA, DOGE, POL, DOT, LINK, AVAX, UNI, LTC, ATOM, NEAR, APT, SUI, ARB

**Features:**
- Search bar (filter by name/symbol)
- Table: Token, Price, 24H Change, Market Cap
- Tap token → Detail modal (Price, 24H High/Low, Market Cap, Volume, Rank)
- Show All / Show Less toggle
- Real-time data from CoinGecko API

### Staking Plans
| Plan | Days | Daily Rate | Min Amount | Progress |
|------|------|------------|------------|----------|
| 🌱 Starter | 7 | 1.0%/day | 10 USDT | 7% |
| 📈 Growth | 14 | 1.5%/day | 50 USDT | 50% |
| 🔥 Pro | 30 | 2.0%/day | 100 USDT | 75% |
| 💎 Elite | 90 | 3.0%/day | 500 USDT | 100% |

---

## 🎨 Branding & Design

### Color Palette
| Element | Color | Hex |
|---------|-------|-----|
| Background (Primary) | Deep Midnight Blue | `#0B1023` |
| Background (Card) | Dark Navy | `#151E30` |
| Accent (Gold) | Gold | `#FFD54F` |
| Accent (Dark Gold) | Dark Gold | `#C48D0A` |
| Accent (Light) | Light Gold | `#FFECB3` |
| Success | Green | `#00b894` |
| Warning | Yellow | `#F0D040` |
| Danger | Red | `#e17055` |
| Text Primary | White | `#FFFFFF` |
| Text Secondary | Slate Grey | `#7A8CA5` |
| Border | Dark Blue-Grey | `#1E2D45` |

### Custom SVG Icons (25+)
All icons are custom SVG with `stroke="currentColor"` for brand consistency:
- Navigation: home, plans, stakes, deposit, withdraw, referral
- Actions: wallet, copy, claim, clock, arrowRight, search, externalLink
- Trust: shield, zap, gift, users, info, checkCircle, alert
- Services: tokenScanner, gasTracker, academy, portfolio, whale, airdrop, swap, tax, expert
- UI: menu (hamburger), close, settings, support

### Animations
fadeIn, fadeInUp, fadeInDown, slideIn, scaleIn, bounceIn, slideUp, pulse, shimmer, float, glow, spin, sidebar slide-in/out, scan score ring

---

## 🚀 Deployment

### Push to GitHub
```bash
cd vanguard-repo
git add -A
git commit -m "description"
git push origin main
```

### Vercel Redeploy
```
https://vercel.com/aminul-islam1/vanguard-staking/deployments
→ ⋯ → Redeploy → Uncheck "Use existing Build Cache" → Deploy
```

### Post-Deploy Steps
1. **Setup bot:** `https://vanguard-staking.vercel.app/api/setup-bot`
2. **Set domain:** `@BotFather → /setdomain → vanguard-staking.vercel.app`
3. **Set menu:** `@BotFather → /setmenubutton → https://vanguard-staking.vercel.app`
4. **Test bot:** `https://t.me/vanguardstakingbot → /start`

---

## ⚠️ Important Notes

1. **Vercel Hobby Plan:** Max 12 serverless functions. All API endpoints are in a single Express app (`api/index.ts`) to stay under the limit.

2. **Supabase RLS:** Must be disabled on all tables for serverless API to work. Run:
   ```sql
   ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
   ALTER TABLE public.stakes DISABLE ROW LEVEL SECURITY;
   ALTER TABLE public.withdrawals DISABLE ROW LEVEL SECURITY;
   ALTER TABLE public.transactions DISABLE ROW LEVEL SECURITY;
   ALTER TABLE public.service_purchases DISABLE ROW LEVEL SECURITY;
   ```

3. **Bot Webhook:** Uses webhook mode (not polling). Do NOT create `api/bot.ts` with polling — it conflicts with serverless.

4. **Token Security:** Never commit tokens or keys to GitHub. Always use Vercel environment variables.

5. **Deposit Verification:** Deposits require manual admin verification. Users submit amount + TX hash via the app.

6. **Withdrawal:** Deducts from user balance immediately. Admin approves/rejects.

7. **Owner Wallet:** `TQ5zn9C7CAko9gKs3RRYyA1Tj9YasXxuLh` — TRC-20 USDT deposit address.

8. **Real-time APIs:** Gas (Etherscan, BSCScan, TronGrid, PolygonScan), Prices (CoinGecko), Scanner (TronGrid, TronScan, Etherscan). All have fallback data if API fails.

9. **Payment Verification:** Balance pay is auto-verified. Direct USDT requires admin to check wallet and run `/approve` command in bot.

10. **GitHub Webhook:** If Vercel auto-deploy stops working, manually redeploy from Vercel dashboard.

---

## 🔧 Troubleshooting

| Issue | Cause | Solution |
|-------|-------|----------|
| 500 error on /api/* | Supabase RLS enabled | Disable RLS on all tables |
| Build failed: 12 functions | Too many serverless functions | All endpoints must be in `api/index.ts` |
| Bot not responding | BOT_TOKEN missing or wrong | Check Vercel ENV + redeploy |
| Channel not posting | Bot not admin in channel | Add bot as channel admin |
| Banner not showing | Image URL inaccessible | Check banner.svg in repo |
| Gas/Prices returning 404 | Vercel deploying old commit | Manual Redeploy from dashboard |
| Withdrawal returns null | RLS blocking insert | Disable RLS on withdrawals table |
| Payment not verifying | Admin not running /approve | Check bot DM for pending payments |
| Mini app 403 | Domain not set in BotFather | Run /setdomain |
| npm warn deprecated | Old dependencies | Normal — not an error, build still succeeds |

---

## 📊 Current Status

- ✅ Frontend: React + Vite (working)
- ✅ Backend: Express API (single function)
- ✅ Database: Supabase (5 tables, RLS disabled)
- ✅ Bot: Telegram webhook (working)
- ✅ Channel: Auto-posting (working)
- ✅ Banner: SVG gold triangle
- ✅ Logo: SVG gold triangle
- ✅ Hamburger Menu: Slide-in sidebar
- ✅ Token Scanner: Real-time TRC-20/ERC-20
- ✅ Gas Tracker: Real-time 4 networks
- ✅ Crypto Academy: 8 free lessons
- ✅ Portfolio Tracker: Balance breakdown
- ✅ Whale Alert: Blockchain transactions
- ✅ Airdrop Alert: Verified listings
- ✅ Instant Swap: Token swap UI
- ✅ Tax Calculator: Transaction summary
- ✅ Expert Help: Expert listings + booking
- ✅ Crypto Market: 20 tokens with search + details
- ✅ Payment System: Balance + Direct USDT
- ✅ Admin Verification: Bot /approve, /reject, /payments

---

## 📞 Support

- **Admin ID:** 7010136281
- **Channel:** https://t.me/VanguardStakingOfficial
- **Bot:** https://t.me/vanguardstakingbot
- **GitHub:** https://github.com/itsrealaminul/vanguard-staking
- **Vercel:** https://vercel.com/aminul-islam1/vanguard-staking
