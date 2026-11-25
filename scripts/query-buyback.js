#!/usr/bin/env node
// Public read-only status for DER buyback, platform statistics, trading mining,
// PnL hardtop capacity, and liquidation buffer across configured contracts and client APIs.
const R = require('./lib/runtime');

async function safe(fn) {
  try { return { ok: true, data: await fn() }; }
  catch (e) { return { ok: false, error: e.shortMessage || e.message }; }
}

async function main() {
  const accountArg = process.argv[2];
  const account = accountArg ? R.address(accountArg) : null;
  const config = R.network();
  const usdt = R.contractAddress(config, 'USDT');

  const out = {
    network: config.name,
    chainId: config.chainId,
    api: {},
    onchain: {},
  };

  out.api.buybackOverview = await safe(() => R.api(config, 'GET', '/client/buyback/overview'));
  out.api.statisticsOverview = await safe(() => R.api(config, 'GET', '/client/statistics/overview'));
  out.api.foundpoolTotal = await safe(() => R.api(config, 'GET', '/client/foundpool/total'));
  if (account) {
    out.api.mintRecords = await safe(() => R.api(config, 'GET', '/client/trading_mining/mint_records', { account, page_index: 1, page_size: 20 }));
    out.api.queueRecords = await safe(() => R.api(config, 'GET', '/client/trading_mining/queue_records', { account, page_index: 1, page_size: 20 }));
  }

  const provider = await R.providerFor(config);
  try {
    const vu = await R.checkedContract(config, 'VaultUtils', provider);
    out.onchain.vaultUtilsWiring = await safe(async () => {
      const [buybackTransfer, tradingMining, liquidateBuffer] = await Promise.all([
        vu.buybackTransfer().catch(() => null),
        vu.tradingMining().catch(() => null),
        vu.liquidateBuffer().catch(() => null),
      ]);
      return { buybackTransfer, tradingMining, liquidateBuffer };
    });

    if (config.contracts.BuybackTransfer) {
      out.onchain.buybackTransfer = await safe(async () => {
        const bt = await R.checkedContract(config, 'BuybackTransfer', provider);
        const [vault, buybackPool, insuranceFund, mainPool, waterLevel, currentTier, divertRates, tiers] = await Promise.all([
          bt.vault(), bt.buybackPool(), bt.insuranceFund(), bt.mainPool(),
          bt.getH(usdt), bt.getCurrentTier(usdt), bt.getDivertRates(usdt), bt.getTiers(usdt),
        ]);
        const usdtContract = await R.checkedContract(config, 'USDT', provider);
        const buybackPoolUsdt = buybackPool !== R.ethers.ZeroAddress ? await usdtContract.balanceOf(buybackPool) : 0n;
        return {
          address: bt.target,
          vault,
          buybackPool,
          buybackPoolUsdtRaw: buybackPoolUsdt,
          buybackPoolUsdt: R.ethers.formatUnits(buybackPoolUsdt, 6),
          insuranceFund,
          mainPool,
          waterLevelRaw: waterLevel,
          waterLevelUsdt: R.ethers.formatUnits(waterLevel, 6),
          currentTier,
          divertRates: {
            tier: divertRates[0],
            buybackBps: divertRates[1],
            insuranceBps: divertRates[2],
            mainBps: divertRates[3],
          },
          tiers: tiers.map((t, i) => ({
            tier: i + 1,
            openThresholdRaw: t.openThreshold,
            closeThresholdRaw: t.closeThreshold,
            buybackBps: t.buybackBps,
            insuranceBps: t.insuranceBps,
            mainBps: t.mainBps,
          })),
        };
      });
    } else {
      out.onchain.buybackTransfer = { ok: false, error: `BuybackTransfer is not configured for ${config.name}` };
    }

    if (config.contracts.TradingMining) {
      out.onchain.tradingMining = await safe(async () => {
        const tm = await R.checkedContract(config, 'TradingMining', provider);
        const [vault, derToken, miningEnabled, snapshot, queueConfig, minHoldTime, curve] = await Promise.all([
          tm.vault(), tm.derToken(), tm.miningEnabled(), tm.getWaterLevelSnapshot(usdt),
          tm.getQueueConfig(usdt), tm.getMinHoldTime(usdt), tm.getCurveParams(usdt),
        ]);
        return {
          address: tm.target,
          vault,
          derToken,
          miningEnabled,
          waterLevelSnapshot: {
            lpRaw: snapshot[0],
            effectiveHRaw: snapshot[1],
            rate: snapshot[2],
            zone: snapshot[3],
          },
          queueConfig: {
            openCount: queueConfig.openCount,
            totalOutstandingRaw: queueConfig.totalOutstanding,
            totalQueuedRaw: queueConfig.totalQueued,
            totalPaidRaw: queueConfig.totalPaid,
          },
          minHoldTimeSeconds: minHoldTime,
          curveParams: {
            underwaterRate: curve.underwaterRate,
            flatRate: curve.flatRate,
            thresholdRaw: curve.threshold,
            decaySRaw: curve.decayS,
          },
        };
      });
    } else {
      out.onchain.tradingMining = { ok: false, error: `TradingMining is not configured for ${config.name}` };
    }

    if (config.contracts.CalculatePNL) {
      out.onchain.calculatePNL = await safe(async () => {
        const cp = await R.checkedContract(config, 'CalculatePNL', provider);
        const [hardtopRate, cap] = await Promise.all([
          cp.getHardtopRate(usdt),
          cp.getRemainingLossCapacity(usdt),
        ]);
        return {
          address: cp.target,
          hardtopRateBps: hardtopRate,
          remainingUsdRaw: cap[0],
          hardtopUsdRaw: cap[1],
          usedUsdRaw: cap[2],
        };
      });
    }

    if (config.contracts.LiquidateBuffer) {
      out.onchain.liquidateBuffer = await safe(async () => {
        const lb = await R.checkedContract(config, 'LiquidateBuffer', provider);
        const [count, configs] = await Promise.all([
          lb.getBufferCount(usdt),
          lb.getBufferConfigs(usdt),
        ]);
        return {
          address: lb.target,
          bufferCount: count,
          configs: configs.map(x => ({ positionLeverage: x.positionLeverage, bufferBps: x.bufferBps })),
        };
      });
    }
  } finally {
    provider.destroy();
  }

  R.print(out);
}

main().catch(R.fail);
