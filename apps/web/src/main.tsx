import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './app/styles/globals.css'
import App from './app/App.tsx'
import { AppProviders } from './app/providers/AppProviders'
import { registerAuthRefreshInterceptor } from './services/http/auth-refresh'

registerAuthRefreshInterceptor()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppProviders>
      <App />
    </AppProviders>
  </StrictMode>,
)
