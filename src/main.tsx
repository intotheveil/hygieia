import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import { AuthProvider } from './auth/AuthProvider'
import { LangProvider } from './i18n/LangProvider'
import { AppRoutes, basenameFrom } from './routes/routes'
import { startTelemetry } from './telemetry'

// Fleet telemetry first, before anything renders, so a failure during the first paint is caught.
// A no-op unless all three VITE_FLEET_* names are set (src/telemetry.ts); never throws.
startTelemetry()

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
