import { type ReactElement } from 'react'
import { render, type RenderResult } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { HelmetProvider } from 'react-helmet-async'
import { vi } from 'vitest'
import { resetAllMocks } from './mocks/firebase'

// Mock AuthContext to avoid importing the real one
import { createContext, useContext, type ReactNode } from 'react'

export interface MockUser {
  uid: string
  email: string
  displayName: string
  role: 'client' | 'clinic' | 'admin' | 'professional'
  emailVerified?: boolean
  clinicId?: string
  photoURL?: string
  createdAt?: any
}

interface MockAuthContextType {
  user: MockUser | null
  loading: boolean
  isAdmin: boolean
  isClinic: boolean
  isClient: boolean
  isProfessional: boolean
  login: ReturnType<typeof vi.fn>
  logout: ReturnType<typeof vi.fn>
  register: ReturnType<typeof vi.fn>
  sendVerificationEmail: ReturnType<typeof vi.fn>
}

const defaultAuthValue: MockAuthContextType = {
  user: null,
  loading: false,
  isAdmin: false,
  isClinic: false,
  isClient: false,
  isProfessional: false,
  login: vi.fn(),
  logout: vi.fn(),
  register: vi.fn(),
  sendVerificationEmail: vi.fn(),
}

const MockAuthContext = createContext<MockAuthContextType>(defaultAuthValue)

export const useMockAuth = () => useContext(MockAuthContext)

export const createMockUser = (overrides: Partial<MockUser> = {}): MockUser => ({
  uid: 'test-uid-123',
  email: 'test@example.com',
  displayName: 'Test User',
  role: 'client',
  emailVerified: true,
  ...overrides,
})

interface TestProvidersProps {
  children: ReactNode
  authValue?: Partial<MockAuthContextType>
}

export const TestProviders = ({ children, authValue }: TestProvidersProps) => {
  const mergedAuth = { ...defaultAuthValue, ...authValue }

  return (
    <HelmetProvider>
      <BrowserRouter>
        <MockAuthContext.Provider value={mergedAuth}>
          {children}
        </MockAuthContext.Provider>
      </BrowserRouter>
    </HelmetProvider>
  )
}

export const renderWithProviders = (
  ui: ReactElement,
  { authValue, ...renderOptions }: { authValue?: Partial<MockAuthContextType> } = {}
): RenderResult => {
  const Wrapper = ({ children }: { children: ReactNode }) => (
    <TestProviders authValue={authValue}>{children}</TestProviders>
  )
  return render(ui, { wrapper: Wrapper, ...renderOptions })
}

// Re-export everything from testing-library
export { render, screen, waitFor, act } from '@testing-library/react'
export { default as userEvent } from '@testing-library/user-event'
export { resetAllMocks }
