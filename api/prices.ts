export default async function handler(_req: any, res: any) {
  try {
    const r = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=tether,bitcoin,ethereum,tron&vs_currencies=usd&include_24hr_change=true');
    const d = await r.json();
    res.setHeader('Cache-Control', 's-maxage=30, stale-while-revalidate');
    res.status(200).json({
      usdt: { price: d.tether?.usd || 1, change: d.tether?.usd_24h_change || 0 },
      btc: { price: d.bitcoin?.usd || 0, change: d.bitcoin?.usd_24h_change || 0 },
      eth: { price: d.ethereum?.usd || 0, change: d.ethereum?.usd_24h_change || 0 },
      trx: { price: d.tron?.usd || 0, change: d.tron?.usd_24h_change || 0 },
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
}
