export default function handler(_req, res) {
  res.status(200).json({
    status: 'ok',
    bot: 'Vanguard Staking Bot',
    appUrl: process.env.APP_URL || 'https://applet-orcin.vercel.app',
  });
}
