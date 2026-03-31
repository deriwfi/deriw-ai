import { usePrivy } from '@privy-io/react-auth'

export default function Header() {
  const { authenticated, logout } = usePrivy()

  return (
    <header className="header">
      <div className="header-top">
        <h1 className="header-title">DERIW DEX</h1>
        {authenticated && (
          <button className="btn btn--ghost" onClick={logout}>
            Disconnect
          </button>
        )}
      </div>
    </header>
  )
}
