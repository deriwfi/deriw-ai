import { useEffect } from 'react'
import { usePrivy, useWallets } from '@privy-io/react-auth'
import UserCard from './UserCard'
import WalletCard from './WalletCard'
import { DERIW_CHAIN } from '../constants'

export default function DashboardPage() {
  const { user } = usePrivy()
  const { wallets } = useWallets()

  // 确保内嵌钱包切换到 DERIW Chain
  useEffect(() => {
    for (const wallet of wallets) {
      if (wallet.walletClientType === 'privy') {
        wallet.switchChain(DERIW_CHAIN.id).catch(() => {
          // 切链失败不阻断流程
        })
      }
    }
  }, [wallets])

  return (
    <div className="dashboard-page">
      <p className="section-title">Account</p>
      {user && <UserCard user={user} />}

      <p className="section-title">Wallets</p>
      {wallets.length === 0 ? (
        <p className="text-muted">No wallets connected.</p>
      ) : (
        wallets.map((wallet) => (
          <WalletCard key={wallet.address} wallet={wallet} />
        ))
      )}
    </div>
  )
}
