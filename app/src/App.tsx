import { usePrivy } from '@privy-io/react-auth'
import Header from './components/Header'
import LoginPage from './components/LoginPage'
import DashboardPage from './components/DashboardPage'

export default function App() {
  const { ready, authenticated } = usePrivy()

  if (!ready) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner" />
        <span className="loading-text">Connecting...</span>
      </div>
    )
  }

  return (
    <>
      <Header />
      <main className="main-content">
        {authenticated ? <DashboardPage /> : <LoginPage />}
      </main>
    </>
  )
}
