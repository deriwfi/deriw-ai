export const PRIVY_APP_ID = 'cmjbazlg902k0jl0ci1fm324b'

export const DERIW_CHAIN = {
  id: 2885,
  name: 'DERIW Chain',
  rpcUrl: 'https://rpc.deriw.com',
  nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 },
  blockExplorer: 'https://scan.deriw.com',
} as const

// USDT 合约地址（6 位小数）
export const USDT_ADDRESS = '0x3B11A54514A708CC2261f4B69617910E172a90B3'

// ERC-20 balanceOf(address) function selector
export const ERC20_BALANCE_OF_SELECTOR = '0x70a08231'
