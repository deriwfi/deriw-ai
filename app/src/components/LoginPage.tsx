import { usePrivy } from '@privy-io/react-auth'

export default function LoginPage() {
  const { login } = usePrivy()

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-logo">
          <div className="login-logo-icon">⚡</div>
        </div>
        <h2 className="login-title">Welcome to DERIW DEX</h2>
        <p className="login-subtitle">
          Trade perpetuals on DERIW Chain.<br />
          Sign in with social or connect your wallet.
        </p>
        <button className="btn btn--primary btn--lg" onClick={login}>
          Connect / Login
        </button>
        <p className="login-hint">
          Supports Google · Twitter · Discord · MetaMask · WalletConnect
        </p>
      </div>
    </div>
  )
}
