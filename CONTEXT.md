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
│   └── banner.png        # Bot welcome banner (1280x640)
├── src/
│   ├── App.tsx           # Main React app (all pages)
│   ├── api.ts            # Frontend API utility functions
│   ├── index.css         # All styles + animations
│   ├── main.tsx          # React entry point
│   └── vite-env.d.ts     # Vite type declarations
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
| `SUPABASE_URL` | Supabase project URL | `https://xxx.supabase.co` |
| `SUPABASE_ANON_KEY` | Supabase public key | `sb_pub_xxx` |
| `BOT_TOKEN` | Telegram Bot token | `123456:ABC-DEF` |
| `APP_URL` | Vercel deployment URL | `https://vanguard-staking.vercel.app` |
| `ADMIN_TELEGRAM_ID` | Admin Telegram user ID | `7010136281` |
| `CHANNEL_ID` | Telegram channel for auto-posts | `@VanguardStakingOfficial` |
| `OWNER_WALLET_ADDRESS` | TRC-20 deposit wallet | `TQ5zn...xuLh` |
| `VITE_OWNER_WALLET_ADDRESS` | Same (for frontend) | `TQ5zn...xuLh` |

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

### Public
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

### Admin
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/users?telegram_id=` | Get all users (admin only) |
| GET | `/api/admin/withdrawals?telegram_id=` | Get all withdrawals |
| POST | `/api/admin/withdrawal` | Approve/reject withdrawal |

### Bot
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

### Channel Auto-Posts
All these events automatically post to `@VanguardStakingOfficial`:
- 🆕 New user joined
- 💰 Deposit submitted
- 🔒 New stake created
- 🎁 Reward claimed
- 👥 New referral
- 💸 Withdrawal requested
- ✅ Withdrawal approved/rejected

---

## 🎨 Frontend Pages (Mini App)

| Tab | Description |
|-----|-------------|
| **Dashboard** | Balance, stats, trust indicators, how it works |
| **Plans** | 4 staking plans (Starter/Growth/Pro/Elite) |
| **Stakes** | Active stakes with claim rewards + progress bars |
| **Deposit** | Wallet address + deposit verification form |
| **Withdraw** | Withdrawal form + history |
| **Referral** | Referral link + stats |

### Staking Plans
| Plan | Days | Daily Rate | Min Amount |
|------|------|------------|------------|
| Starter | 7 | 1.0%/day | 10 USDT |
| Growth | 14 | 1.5%/day | 50 USDT |
| Pro | 30 | 2.0%/day | 100 USDT |
| Elite | 90 | 3.0%/day | 500 USDT |

---

## 🎨 Branding & Design

### Colors
| Element | Color |
|---------|-------|
| Background | `#0B1023` (deep midnight blue) |
| Cards | `#151E30` (dark navy) |
| Accent | `#FFD54F` → `#C48D0A` (gold gradient) |
| Text Primary | `#FFFFFF` |
| Text Secondary | `#7A8CA5` (slate grey) |
| Success | `#00b894` (green) |
| Warning | `#F0D040` (yellow) |
| Danger | `#e17055` (red) |
| Border | `#1E2D45` |

### Logo
Gold equilateral triangle with a circle inside — represents growth, stability, and value.

### Banner
1280x640 PNG with:
- Animated-style characters (phone, selfie, laptop, withdraw, celebrate)
- Gold triangle logo with glow
- Floating particles
- Trust message
- 40% commission badge

---

## 🚀 Deployment

### Push to GitHub
```bash
git add -A
git commit -m "description"
git push origin main
```

### Vercel Auto-Deploys
Push to `main` branch triggers automatic deployment.

### Manual Redeploy
```
https://vercel.com/aminul-islam1/vanguard-staking/deployments
→ ⋯ → Redeploy
```

### Setup Bot After Deploy
```
https://vanguard-staking.vercel.app/api/setup-bot
```

---

## ⚠️ Important Notes

1. **RLS (Row Level Security):** If Supabase tables have RLS enabled, disable them or add proper policies for the API to work.

2. **Bot Webhook:** The bot uses webhook mode (not polling). The webhook URL is automatically set to `{APP_URL}/api/webhook` when the API starts.

3. **Channel Admin:** The bot must be added as an admin to `@VanguardStakingOfficial` with "Post Messages" permission.

4. **Token Security:** Never commit tokens or keys to GitHub. Use Vercel environment variables.

5. **Deposit Verification:** Deposits are manually verified. Users submit amount + TX hash, admin reviews and updates balance.

---

## 🔧 Troubleshooting

| Issue | Solution |
|-------|----------|
| 500 error on /api/user | Check Supabase tables exist + RLS disabled |
| Bot not responding | Check BOT_TOKEN in Vercel ENV + redeploy |
| Channel not posting | Check bot is admin in channel + CHANNEL_ID set |
| Banner not showing | Check banner.png URL is accessible |
| Join Channel not working | Ensure CHANNEL_ID doesn't have double @ |

---

## 📞 Support

- **Admin Telegram ID:** 7010136281
- **Channel:** https://t.me/VanguardStakingOfficial
- **Bot:** https://t.me/vanguardstakingbot
