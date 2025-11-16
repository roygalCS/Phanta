import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Buffer } from 'buffer'
import './index.css'
import App from './App.jsx'
import { WalletProvider } from './WalletContext.jsx'
import ErrorBoundary from './components/ErrorBoundary.jsx'

// Polyfill Buffer for browser
window.Buffer = Buffer
globalThis.Buffer = Buffer

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <WalletProvider>
        <App />
      </WalletProvider>
    </ErrorBoundary>
  </StrictMode>,
)
