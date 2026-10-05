import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import { AuthProvider } from './auth/AuthProvider'
import { LangProvider } from './i18n/LangProvider'
import { AppRoutes, basenameFrom } from './routes/routes'

// GitHub Pages has no rewrites, so every deep link is served dist/404.html, a byte copy of
// index.html made at build time (vite.config.ts `spaFallback`). The router reads the route from
// the URL as requested. Declarative BrowserRouter: nothing needs loaders/actions.
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <LangProvider>
      <AuthProvider>
        <BrowserRouter basename={basenameFrom(import.meta.env.BASE_URL)}>
          <AppRoutes />
        </BrowserRouter>
      </AuthProvider>
    </LangProvider>
  </StrictMode>,
)
