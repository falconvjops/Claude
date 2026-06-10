import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './monacoSetup'
import './styles.css'
import { StoreProvider } from './state/store'
import App from './App'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <StoreProvider>
      <App />
    </StoreProvider>
  </StrictMode>,
)
