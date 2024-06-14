import React from 'react';
import { BrowserRouter } from 'react-router-dom'
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import { Provider } from 'react-redux'
import { store } from './redux/reducers/reducers'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createWeb3Modal } from '@web3modal/wagmi/react'
import { defaultWagmiConfig } from '@web3modal/wagmi/react/config'
import { WagmiProvider, cookieStorage, createStorage } from 'wagmi'

const chains = [{
  id: 111000,
  name: `Siberium Testnet`,
  network: `siberiumtestnet`,
  nativeCurrency: {
      decimals: 18,
      name: `SIBR`,
      symbol: `SIBR`
  },
  rpcUrls: {
      default: {
          http: [`https://rpc.test.siberium.net`],
      }
  },
  blockExplorers: {
      default: {
          name: `Blockscout`,
          url: `https://explorer.test.siberium.net/`
      }
  }
}] 

const queryClient = new QueryClient();

const root = ReactDOM.createRoot(document.getElementById('root'));

const wagmiConfig = defaultWagmiConfig({
  chains,
  projectId: process.env.REACT_APP_WALLETCONNECT_ID,
  metadata: {
    name: `Web3Modal`,
    description: `Web3Modal Example`,
    url: `https://web3modal.com`,
    icons: [`https://avatars.githubusercontent.com/u/37784886`]
  },
  ssr: true,
  storage: createStorage({
    storage: cookieStorage
  }),
  enableWalletConnect: true,
  enableInjected: true,
  enableEIP6963: true,
  enableCoinbase: true,
})

createWeb3Modal({
  wagmiConfig,
  projectId: process.env.REACT_APP_WALLETCONNECT_ID,
  chains,
  enableAnalytics: true,
  themeMode: `light`
});

root.render(
  <WagmiProvider config={wagmiConfig}>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Provider Provider store={store}>
          <App />
        </Provider>
      </BrowserRouter>
    </QueryClientProvider>
  </WagmiProvider>
);
