export default async function handler(_req: any, res: any) {
  try {
    const results: any = { timestamp: new Date().toISOString() };
    try {
      const r = await fetch('https://api.etherscan.io/api?module=gastracker&action=gasoracle');
      const d = await r.json();
      if (d.status === '1') results.ethereum = { low: parseInt(d.result.SafeGasPrice), standard: parseInt(d.result.ProposeGasPrice), fast: parseInt(d.result.FastGasPrice), instant: Math.ceil(parseInt(d.result.FastGasPrice) * 1.5), unit: 'Gwei' };
    } catch { results.ethereum = { low: 15, standard: 25, fast: 40, instant: 60, unit: 'Gwei' }; }
    try {
      const r = await fetch('https://api.bscscan.com/api?module=gastracker&action=gasoracle');
      const d = await r.json();
      if (d.status === '1') results.bsc = { low: parseInt(d.result.SafeGasPrice), standard: parseInt(d.result.ProposeGasPrice), fast: parseInt(d.result.FastGasPrice), instant: Math.ceil(parseInt(d.result.FastGasPrice) * 1.5), unit: 'Gwei' };
    } catch { results.bsc = { low: 1, standard: 3, fast: 5, instant: 8, unit: 'Gwei' }; }
    try {
      const r = await fetch('https://api.trongrid.io/wallet/getchainparameters');
      const d = await r.json();
      const ef = d?.chainParameter?.find((p: any) => p.key === 'getEnergyFee')?.value || 420;
      results.tron = { low: Math.round(ef * 0.8), standard: ef, fast: Math.round(ef * 1.3), instant: Math.round(ef * 1.8), unit: 'Energy' };
    } catch { results.tron = { low: 340, standard: 420, fast: 550, instant: 750, unit: 'Energy' }; }
    try {
      const r = await fetch('https://api.polygonscan.com/api?module=gastracker&action=gasoracle');
      const d = await r.json();
      if (d.status === '1') results.polygon = { low: parseInt(d.result.SafeGasPrice), standard: parseInt(d.result.ProposeGasPrice), fast: parseInt(d.result.FastGasPrice), instant: Math.ceil(parseInt(d.result.FastGasPrice) * 1.5), unit: 'Gwei' };
    } catch { results.polygon = { low: 30, standard: 50, fast: 80, instant: 120, unit: 'Gwei' }; }
    res.setHeader('Cache-Control', 's-maxage=15, stale-while-revalidate');
    res.status(200).json(results);
  } catch (err: any) { res.status(500).json({ error: err.message }); }
}
