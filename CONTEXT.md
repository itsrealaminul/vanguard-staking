# Vanguard Staking — Project Context & Instructions

## 📋 Project Overview

**Vanguard Staking** is a full-stack Telegram Mini App and Bot for USDT staking on the TRON (TRC-20) network. Users can stake USDT, earn daily rewards, refer friends, and withdraw earnings — all within Telegram.

- **Live URL:** https://vanguard-staking.vercel.app
- **Telegram Bot:** https://t.me/vanguardstakingbot
- **Channel:** https://t.me/VanguardStakingOfficial
- **GitHub:** https://github.com/itsrealaminul/vanguard-staking

---

## 🏗️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + Vite + TypeScript |
| Backend | Express.js (Vercel Serverless Functions) |
| Database | Supabase (PostgreSQL) |
| Bot | node-telegram-bot-api (Webhook mode) |
| Hosting | Vercel |
| Network | TRON (TRC-20) |

---

## 📁 Project Structure

```
vanguard-staking/
├── api/
│   ├── index.ts          # Main API + Bot webhook + Channel posting
│   └── health.ts         # Health check endpoint
├── public/
│   ├── banner.png        # Bot welcome banner (1280x640)
│   └── banner.svg        # Banner source (SVG)
├── src/
│   ├── App.tsx           # Main React app (all pages)
│   ├── api.ts            # Frontend API utility functions
│   ├── index.css         # All styles + animations
│   ├── main.tsx          # React entry point
│   └── vite-env.d.ts     # Vite type declarations
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

---

## 📡 API Endpoints

### Public Routes
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Health check |
| GET | `/api/user?telegram_id=` | Get or create user |
| POST | `/api/user` | Update user |
| POST | `/api/deposit` | Submit deposit (amount, tx_hash) |
| GET | `/api/stakes?telegram_id=` | Get user stakes |
| POST | `/api/stakes` | Create new stake |
| GET | `/api/withdrawals?telegram_id=` | Get withdrawals |
| POST | `/api/withdrawals` | Request withdrawal |
| GET | `/api/transactions?telegram_id=` | Get transactions |
| POST | `/api/claim-reward` | Claim stake reward |
| POST | `/api/referral` | Process referral |

### Admin Routes
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/users?telegram_id=` | Get all users (admin only) |
| GET | `/api/admin/withdrawals?telegram_id=` | Get all withdrawals |
| POST | `/api/admin/withdrawal` | Approve/reject withdrawal |

### Bot Routes
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/webhook` | Telegram webhook handler |
| GET | `/api/setup-bot` | Configure bot commands & description |

---

## 🤖 Bot Features

### Commands
- `/start` — Welcome message with banner + referral handling
- `/stake` — Open staking mini app
- `/referral` — Get referral link
- `/help` — Show help

### Welcome Message Format
```
━━━━━━━━━━━━━━━━━━━━━━
⚔️ VANGUARD STAKING ⚔️
━━━━━━━━━━━━━━━━━━━━━━

Welcome, {name}! 👋

💰 Stake USDT → Earn up to 3% daily
🔒 Secure → TRC-20 Protocol
⚡ Fast → Instant Deposits
🌍 Trusted → 5,000+ Users
👥 Earn More → 40% Commissions

━━━━━━━━━━━━━━━━━━━━━━
🚀 Tap below to start your staking journey!
━━━━━━━━━━━━━━━━━━━━━━
```

### Inline Buttons
- 🚀 Open Vanguard Staking (Web App)
- 📊 Join Channel
- 👥 Invite Friends & Earn 40%

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

---

## 🎨 Frontend Pages (Mini App)

### Tabs
| Tab | Icon | Description |
|-----|------|-------------|
| **Home** | 🏠 | Balance, stats, trust indicators, how it works |
| **Plans** | 📋 | 4 staking plans with progress bars |
| **Stakes** | 📈 | Active stakes with claim rewards + progress |
| **Deposit** | 💰 | Wallet address + deposit verification form |
| **Withdraw** | 💸 | Withdrawal form + history |
| **Referral** | 👥 | Referral link + stats |

### Staking Plans
| Plan | Days | Daily Rate | Min Amount | Progress |
|------|------|------------|------------|----------|
| 🌱 Starter | 7 | 1.0%/day | 10 USDT | 7% |
| 📈 Growth | 14 | 1.5%/day | 50 USDT | 50% |
| 🔥 Pro | 30 | 2.0%/day | 100 USDT | 75% |
| 💎 Elite | 90 | 3.0%/day | 500 USDT | 100% |

### Deposit Flow
1. User copies wallet address (`TQ5zn...xuLh`)
2. Sends USDT via TRC-20
3. Submits deposit form (amount + optional TX hash)
4. Channel auto-posts deposit notification
5. Admin verifies and updates balance

### Trust Indicators
- 🔒 Secure Protocol
- ⚡ Instant
- 🌍 5K+ Users
- 🛡️ Security badge
- 💰 Daily Rewards badge
- 💸 Fast Withdrawals badge
- 👥 Active Community badge

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

### Logo
Gold equilateral triangle with a glowing circle inside — represents growth, stability, and value. SVG + PNG formats available.

### Banner (1280x640 PNG)
- 5 animated-style characters (phone, selfie, laptop, withdraw, celebrate)
- Gold triangle logo with glow effects
- Floating particles and sparkle effects
- Trust message: "Trusted by 5,000+ users worldwide"
- 40% Affiliate Commission badge
- Corner bracket decorations
- Dark gradient background with depth circles

### Animations
- fadeIn, fadeInUp, fadeInDown, slideIn, scaleIn
- bounceIn, slideUp, slideDown
- pulse, shimmer, float, glow, spin
- Staggered delays for list items
- Hover effects with translateY + shadow
- Loading spinner (gold ring)
- Toast notifications
- Progress bars for stakes
- Backdrop blur for bottom nav
- Sidebar slide-in/out transition
- Scan score ring animation

### Custom SVG Icons (25+)
All icons are custom SVG with `stroke="currentColor"` for brand consistency:
- Navigation: home, plans, stakes, deposit, withdraw, referral
- Actions: wallet, copy, claim, clock, arrowRight, search, externalLink
- Trust: shield, zap, gift, users, info, checkCircle, alert
- Services: tokenScanner (shield+magnify), gasTracker (fuel pump), academy (graduation cap)
- Services: portfolio (pie chart), whale, airdrop (parachute), swap (arrows)
- Services: tax (calculator), expert (headset), book
- UI: menu (hamburger), close (X), settings (gear), support (help circle)

---

## 🚀 Deployment

### Push to GitHub
```bash
cd vanguard-repo
git add -A
git commit -m "description"
git push origin main
```

### Vercel Auto-Deploy
Push to `main` branch triggers automatic deployment on Vercel.

### Manual Redeploy
```
https://vercel.com/aminul-islam1/vanguard-staking/deployments
→ ⋯ → Redeploy
```

### Post-Deploy Steps
1. **Setup bot:** `https://vanguard-staking.vercel.app/api/setup-bot`
2. **Set domain:** `@BotFather → /setdomain → vanguard-staking.vercel.app`
3. **Set menu:** `@BotFather → /setmenubutton → https://vanguard-staking.vercel.app`
4. **Test bot:** `https://t.me/vanguardstakingbot → /start`

---

## ⚠️ Important Notes

1. **Supabase RLS:** If tables have Row Level Security enabled, disable them or add proper policies for the serverless API to work.

2. **Bot Webhook:** Uses webhook mode (not polling). Webhook URL is auto-set to `{APP_URL}/api/webhook` when API starts.

3. **Channel Admin:** Bot must be added as admin to `@VanguardStakingOfficial` with "Post Messages" permission.

4. **Token Security:** Never commit tokens or keys to GitHub. Always use Vercel environment variables.

5. **Deposit Verification:** Deposits require manual admin verification. Users submit amount + TX hash via the app.

6. **CHANNEL_ID Format:** Use `@VanguardStakingOfficial` (with @). The code strips `@` when building `t.me/` URLs.

7. **Owner Wallet:** `TQ5zn9C7CAko9gKs3RRYyA1Tj9YasXxuLh` — TRC-20 USDT deposit address.

---

## 🔧 Troubleshooting

| Issue | Cause | Solution |
|-------|-------|----------|
| 500 error on /api/user | Supabase tables missing or RLS enabled | Create tables + disable RLS |
| Bot not responding | BOT_TOKEN missing or wrong | Check Vercel ENV + redeploy |
| Channel not posting | Bot not admin in channel | Add bot as channel admin |
| Banner not showing | Image URL inaccessible | Check banner.png in repo |
| "Join Channel" not working | Double @ in URL | CHANNEL_ID should be `@name` not `@@name` |
| TypeScript build error | API type mismatch | Check setMyDescription format |
| Mini app 403 | Domain not set in BotFather | Run /setdomain |
| Mini app 500 | API crash | Check Vercel function logs |
| Connection Failed | Vercel deployment protection | Disable in Settings |

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
│   ├── 🔍 Token Scanner [NEW]
│   ├── ⛽ Gas Tracker [LIVE]
│   ├── 🎓 Crypto Academy [FREE]
│   ├── 📊 Portfolio Tracker [SOON]
│   ├── 🐋 Whale Alert [SOON]
│   ├── 🎁 Airdrop Alert [SOON]
│   ├── 💱 Instant Swap [SOON]
│   ├── 🧮 Tax Calculator [SOON]
│   └── 👨‍💼 Expert Help [SOON]
├── ─────────────────
└── 📞 Support
```

### Sidebar Features
- Slide-in from left with smooth animation
- Dark overlay backdrop with blur
- Gold-themed icons matching brand
- Badge system: NEW (green), LIVE (gold), FREE (blue), SOON (grey)
- Disabled state for upcoming services
- Active item highlight with gold dot
- Close button with hover effect
- Version info in footer

---

## 🔍 Token Scanner (NEW)

Check any token contract for safety before investing.

| Feature | Description |
|---------|-------------|
| Contract Analysis | Scan TRC-20, ERC-20, BEP-20 addresses |
| Safety Score | 0-100 score with visual ring |
| Risk Indicators | Mint function, holder concentration, low liquidity |
| Safe Indicators | Verified contract, locked liquidity, renounced ownership |
| Details | Holder count, liquidity USD, contract age |
| Disclaimer | DYOR advisory |

**API:** Uses simulated data. Integrate BSCScan/Etherscan API for production.

---

## ⛽ Gas Tracker (NEW)

Real-time gas prices across 4 networks.

| Network | Unit | Levels |
|---------|------|--------|
| Ethereum | Gwei | Low, Standard, Fast, Instant |
| BSC | Gwei | Low, Standard, Fast, Instant |
| TRON | Energy | Low, Standard, Fast, Instant |
| Polygon | Gwei | Low, Standard, Fast, Instant |

**Features:**
- Auto-refresh on page open
- Manual refresh button
- Color-coded levels (gold=low, green=fast, red=instant)
- Gas saving tips

---

## 🎓 Crypto Academy (NEW)

Free crypto education with 8 lessons across 3 categories.

| Category | Lessons |
|----------|---------|
| Beginner | Blockchain, Wallet Setup, USDT & Stablecoins |
| Intermediate | Staking, DeFi Basics, Gas Fees |
| Advanced | Avoiding Scams, Portfolio Diversification |

**Features:**
- Category filter (All/Beginner/Intermediate/Advanced)
- Lesson detail modal with full content
- Duration indicators
- Color-coded category badges
- Animated card transitions

---

## 🎨 Dashboard Quick Services

New grid on dashboard home with 4 quick-access service cards:
- 🔍 Scan → Token Scanner
- ⛽ Gas → Gas Tracker
- 🎓 Learn → Crypto Academy
- 💱 Swap → Coming Soon (disabled)

---

## 📊 Current Status

- ✅ Frontend: React + Vite (working)
- ✅ Backend: Express API (working)
- ✅ Database: Supabase (4 tables created)
- ✅ Bot: Telegram webhook (working)
- ✅ Channel: Auto-posting (working)
- ✅ Banner: Custom PNG with characters
- ✅ Logo: SVG gold triangle
- ✅ Trust indicators: 4 trust cards
- ✅ Deposit verification: Form + channel post
- ✅ Animations: Full CSS animations
- ✅ CONTEXT.md: This documentation
- ✅ Hamburger Menu: Slide-in sidebar with services
- ✅ Token Scanner: Contract safety checker
- ✅ Gas Tracker: Multi-chain gas prices
- ✅ Crypto Academy: 8 free lessons

---

## 📞 Support

- **Admin ID:** 7010136281
- **Channel:** https://t.me/VanguardStakingOfficial
- **Bot:** https://t.me/vanguardstakingbot
- **GitHub:** https://github.com/itsrealaminul/vanguard-staking
- **Vercel:** https://vercel.com/aminul-islam1/vanguard-staking
