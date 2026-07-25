export default async function handler(_req: any, res: any) {
  try {
    const results: any = { timestamp: new Date().toISOString() };

    // Ethereum gas from Etherscan
    try {
      const ethRes = await fetch('https://api.etherscan.io/api?module=gastracker&action=gasoracle');
      const ethData = await ethRes.json();
      if (ethData.status === '1' && ethData.result) {
        results.ethereum = {
          low: parseInt(ethData.result.SafeGasPrice),
          standard: parseInt(ethData.result.ProposeGasPrice),
          fast: parseInt(ethData.result.FastGasPrice),
          instant: Math.ceil(parseInt(ethData.result.FastGasPrice) * 1.5),
          unit: 'Gwei',
        };
      }
    } catch { results.ethereum = { low: 15, standard: 25, fast: 40, instant: 60, unit: 'Gwei' }; }

    // BSC gas from BSCScan
    try {
      const bscRes = await fetch('https://api.bscscan.com/api?module=gastracker&action=gasoracle');
      const bscData = await bscRes.json();
      if (bscData.status === '1' && bscData.result) {
        results.bsc = {
          low: parseInt(bscData.result.SafeGasPrice),
          standard: parseInt(bscData.result.ProposeGasPrice),
          fast: parseInt(bscData.result.FastGasPrice),
          instant: Math.ceil(parseInt(bscData.result.FastGasPrice) * 1.5),
          unit: 'Gwei',
        };
      }
    } catch { results.bsc = { low: 1, standard: 3, fast: 5, instant: 8, unit: 'Gwei' }; }

    // TRON energy from TronGrid
    try {
      const tronRes = await fetch('https://api.trongrid.io/wallet/getchainparameters');
      const tronData = await tronRes.json();
      const energyFee = tronData?.chainParameter?.find((p: any) => p.key === 'getEnergyFee')?.value || 420;
      results.tron = {
        low: Math.round(energyFee * 0.8),
        standard: energyFee,
        fast: Math.round(energyFee * 1.3),
        instant: Math.round(energyFee * 1.8),
        unit: 'Energy',
      };
    } catch { results.tron = { low: 340, standard: 420, fast: 550, instant: 750, unit: 'Energy' }; }

    // Polygon gas from PolygonScan
    try {
      const polyRes = await fetch('https://api.polygonscan.com/api?module=gastracker&action=gasoracle');
      const polyData = await polyRes.json();
      if (polyData.status === '1' && polyData.result) {
        results.polygon = {
          low: parseInt(polyData.result.SafeGasPrice),
          standard: parseInt(polyData.result.ProposeGasPrice),
          fast: parseInt(polyData.result.FastGasPrice),
          instant: Math.ceil(parseInt(polyData.result.FastGasPrice) * 1.5),
          unit: 'Gwei',
        };
      }
    } catch { results.polygon = { low: 30, standard: 50, fast: 80, instant: 120, unit: 'Gwei' }; }

    res.setHeader('Cache-Control', 's-maxage=15, stale-while-revalidate');
    res.status(200).json(results);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}
