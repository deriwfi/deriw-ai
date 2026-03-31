import { useState, useEffect } from 'react'
import { DERIW_CHAIN, USDT_ADDRESS, ERC20_BALANCE_OF_SELECTOR } from '../constants'

function encodeBalanceOfCall(address: string): string {
  const padded = address.replace(/^0x/i, '').padStart(64, '0')
  return ERC20_BALANCE_OF_SELECTOR + padded
}

function hexToUsdtAmount(hex: string): string {
  if (!hex || hex === '0x' || hex === '0x0') return '0.00'
  const raw = BigInt(hex)
  const whole = raw / 1_000_000n
  const frac = ((raw % 1_000_000n) * 100n) / 1_000_000n
  return `${whole}.${String(frac).padStart(2, '0')}`
}

export function useDerivBalance(address: string) {
  const [balance, setBalance] = useState<string>('—')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!address) {
      setLoading(false)
      return
    }

    let cancelled = false
    setLoading(true)

    fetch(DERIW_CHAIN.rpcUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'eth_call',
        params: [
          { to: USDT_ADDRESS, data: encodeBalanceOfCall(address) },
          'latest',
        ],
      }),
    })
      .then((r) => r.json())
      .then((data: { result?: string }) => {
        if (!cancelled) setBalance(hexToUsdtAmount(data.result ?? '0x0'))
      })
      .catch(() => {
        if (!cancelled) setBalance('—')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [address])

  return { balance, loading }
}
