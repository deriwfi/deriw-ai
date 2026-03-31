import React from 'react'
import ReactDOM from 'react-dom/client'
import { PrivyProvider } from '@privy-io/react-auth'
import App from './App'
import { PRIVY_APP_ID, DERIW_CHAIN } from './constants'
import './style.css'

const deriwChainConfig = {
  id: DERIW_CHAIN.id,
  name: DERIW_CHAIN.name,
  rpcUrls: {
    default: { http: [DERIW_CHAIN.rpcUrl] },
    public: { http: [DERIW_CHAIN.rpcUrl] },
  },
  nativeCurrency: DERIW_CHAIN.nativeCurrency,
  blockExplorers: {
    default: { name: 'DERIW Scan', url: DERIW_CHAIN.blockExplorer },
  },
} as const

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <PrivyProvider
      appId={PRIVY_APP_ID}
      config={{
        appearance: {
          theme: 'dark',
          accentColor: '#0A84FF',
        },
        loginMethods: ['google', 'twitter', 'discord', 'wallet'],
        embeddedWallets: {
          ethereum: {
            createOnLogin: 'users-without-wallets',
          },
        },
        defaultChain: deriwChainConfig,
        supportedChains: [deriwChainConfig],
      }}
    >
      <App />
    </PrivyProvider>
  </React.StrictMode>,
)
