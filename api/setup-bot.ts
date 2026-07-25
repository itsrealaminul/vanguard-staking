const BOT_TOKEN = process.env.BOT_TOKEN || '';
export default async function handler(_req: any, res: any) {
  if (!BOT_TOKEN) return res.status(500).json({ error: 'Bot not configured' });
  try {
    const TB = (await import('node-telegram-bot-api')).default;
    const bot = new TB(BOT_TOKEN, { polling: false });
    await bot.setMyCommands([
      { command: 'start', description: '🚀 Start the bot' }, { command: 'stake', description: '💰 Open staking app' },
      { command: 'scan', description: '🔍 Scan token contract' }, { command: 'gas', description: '⛽ Check gas prices' },
      { command: 'learn', description: '🎓 Crypto Academy' }, { command: 'referral', description: '👥 Get referral link' },
      { command: 'payments', description: '📋 Pending payments (admin)' },
      { command: 'help', description: '📖 Show help' },
    ]);
    await bot.setMyDescription({ description: '⚔️ Vanguard Staking — Your all-in-one crypto platform.\n\n💰 Stake USDT → Earn up to 3% daily\n🔍 Token Scanner → Check contract safety\n⛽ Gas Tracker → Real-time gas prices\n🎓 Crypto Academy → Free education\n👥 40% Affiliate Commissions\n🔒 Secure TRC-20 Protocol\n\nTrusted by 5,000+ users. Tap Start!' });
    await bot.setMyShortDescription({ short_description: 'Stake USDT • Token Scanner • Gas Tracker • Crypto Academy. Earn up to 3% daily.' });
    res.status(200).json({ success: true, message: 'Bot configured!' });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
}
