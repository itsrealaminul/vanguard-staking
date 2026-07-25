export default async function handler(_req: any, res: any) {
  try {
    const priceRes = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=tether,bitcoin,ethereum,tron&vs_currencies=usd&include_24hr_change=true');
    const priceData = await priceRes.json();

    res.setHeader('Cache-Control', 's-maxage=30, stale-while-revalidate');
    res.status(200).json({
      usdt: { price: priceData.tether?.usd || 1, change: priceData.tether?.usd_24h_change || 0 },
      btc: { price: priceData.bitcoin?.usd || 0, change: priceData.bitcoin?.usd_24h_change || 0 },
      eth: { price: priceData.ethereum?.usd || 0, change: priceData.ethereum?.usd_24h_change || 0 },
      trx: { price: priceData.tron?.usd || 0, change: priceData.tron?.usd_24h_change || 0 },
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}
