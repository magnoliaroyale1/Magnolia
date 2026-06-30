import { BrowserRouter } from 'react-router-dom'
import { HelmetProvider } from 'react-helmet-async'
import { AuthProvider } from './context/AuthContext'
import { NavigationBar } from './components/Navbar'
import { Footer } from './components/Footer'
import { ErrorBoundary } from './components/ErrorBoundary'
import { CookieBanner } from './components/CookieBanner'
import { SEO } from './components/SEO'
import { AppRoutes } from './routes'

function App() {
  return (
    <HelmetProvider>
      <BrowserRouter>
        <ErrorBoundary>
          <AuthProvider>
            <SEO />
            <NavigationBar />
            <main style={{ paddingTop: '80px' }}>
              <AppRoutes />
            </main>
            <Footer />
            <CookieBanner />
          </AuthProvider>
        </ErrorBoundary>
      </BrowserRouter>
    </HelmetProvider>
  )
}

export default App