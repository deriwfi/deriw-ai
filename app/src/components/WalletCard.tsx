import { useState } from 'react'
import type { ConnectedWallet } from '@privy-io/react-auth'
import { useDerivBalance } from '../hooks/useDerivBalance'

function shortenAddress(addr: string): string {
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`
}

export default function WalletCard({ wallet }: { wallet: ConnectedWallet }) {
  const isEmbedded = wallet.walletClientType === 'privy'
  const { balance, loading } = useDerivBalance(wallet.address)
  const [copied, setCopied] = useState(false)

  function copyAddress() {
    navigator.clipboard.writeText(wallet.address)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="card">
      <div className="wallet-card-header">
        <span className={`badge ${isEmbedded ? 'badge--embedded' : 'badge--external'}`}>
          {isEmbedded ? 'Embedded Wallet' : wallet.walletClientType}
        </span>
        <span className="badge badge--chain">DERIW Chain</span>
      </div>

      <div className="wallet-address-row">
        <span className="card-label">Address</span>
        <span className="wallet-address-value" title={wallet.address}>
          {shortenAddress(wallet.address)}
        </span>
        <button className="btn btn--icon" onClick={copyAddress} title="Copy address">
          {copied ? <span className="copy-success">✓</span> : '⎘'}
        </button>
      </div>

      <div className="wallet-balance-row">
        <span className="card-label">USDT Balance</span>
        {loading ? (
          <span className="balance-loading">Loading...</span>
        ) : (
          <span className="balance-value">{balance} USDT</span>
        )}
      </div>
    </div>
  )
}
