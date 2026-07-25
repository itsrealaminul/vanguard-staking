export default async function handler(req: any, res: any) {
  try {
    const address = req.query.address;
    if (!address) return res.status(400).json({ error: 'address required' });

    const isTron = address.startsWith('T');
    const isEth = address.startsWith('0x');
    const risks: string[] = [];
    const safe: string[] = [];
    let holderCount = 0;
    let liquidityUSD = 0;
    let age = 0;
    let tokenName = 'Unknown';
    let tokenSymbol = '???';

    if (isTron) {
      try {
        const [contractRes, infoRes] = await Promise.all([
          fetch(`https://api.trongrid.io/v1/contracts/${address}`),
          fetch(`https://apilist.tronscanapi.com/api/token_trc20?contract=${address}`),
        ]);
        const contractData = await contractRes.json();
        const infoData = await infoRes.json();

        if (contractData?.data?.[0]) {
          const c = contractData.data[0];
          tokenName = c.name || 'Unknown';
          tokenSymbol = c.symbol || '???';
          if (c.verified) safe.push('Contract verified on TronScan');
          else risks.push('Contract not verified');
        }

        if (infoData?.trc20_tokens?.[0]) {
          const t = infoData.trc20_tokens[0];
          holderCount = parseInt(t.holders_count || '0');
          if (holderCount > 1000) safe.push(`${holderCount.toLocaleString()} holders`);
          else if (holderCount < 100) risks.push(`Low holder count: ${holderCount}`);
        }

        const txRes = await fetch(`https://api.trongrid.io/v1/contracts/${address}/transactions?limit=1&order_by=block_timestamp,asc`);
        const txData = await txRes.json();
        if (txData?.data?.[0]?.block_timestamp) {
          age = Math.floor((Date.now() - txData.data[0].block_timestamp) / (1000 * 60 * 60 * 24));
          if (age > 30) safe.push(`Contract age: ${age} days`);
          else risks.push(`New contract: ${age} days old`);
        }
      } catch { risks.push('Could not fetch TRC-20 data'); }
    } else if (isEth) {
      try {
        const [contractRes, holderRes] = await Promise.all([
          fetch(`https://api.etherscan.io/api?module=contract&action=getsourcecode&address=${address}`),
          fetch(`https://api.etherscan.io/api?module=token&action=tokenholdercount&contractaddress=${address}`),
        ]);
        const contractData = await contractRes.json();
        const holderData = await holderRes.json();

        if (contractData?.result?.[0]) {
          const c = contractData.result[0];
          tokenName = c.ContractName || 'Unknown';
          if (c.SourceCode) safe.push('Source code verified');
          else risks.push('Source code not verified');
          if (c.Proxy === '1') risks.push('Proxy contract detected');
        }

        if (holderData?.result) {
          holderCount = parseInt(holderData.result);
          if (holderCount > 1000) safe.push(`${holderCount.toLocaleString()} holders`);
          else if (holderCount < 100) risks.push(`Low holder count: ${holderCount}`);
        }
      } catch { risks.push('Could not fetch ERC-20 data'); }
    } else {
      return res.status(400).json({ error: 'Invalid address format. Use TRC-20 (T...) or ERC-20 (0x...)' });
    }

    let score = 50;
    score += safe.length * 12;
    score -= risks.length * 18;
    if (holderCount > 5000) score += 10;
    if (age > 180) score += 10;
    score = Math.max(5, Math.min(98, score));

    res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate');
    res.status(200).json({
      address,
      network: isTron ? 'TRON (TRC-20)' : 'Ethereum (ERC-20)',
      tokenName,
      tokenSymbol,
      score,
      risks,
      safe,
      holderCount,
      liquidityUSD,
      age,
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}
