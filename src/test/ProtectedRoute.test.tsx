import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'

const {
  mockUseAuth,
} = vi.hoisted(() => ({
  mockUseAuth: vi.fn(),
}))

vi.mock('../context/AuthContext', () => ({
  useAuth: () => mockUseAuth(),
}))

import { ProtectedRoute } from '../components/ProtectedRoute'

const renderProtected = (authValue: any, allowedRoles?: string[], path = '/') => {
  mockUseAuth.mockReturnValue(authValue)
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route
          path="/"
          element={
            <ProtectedRoute allowedRoles={allowedRoles as any}>
              <div data-testid="protected-content">Área Protegida</div>
            </ProtectedRoute>
          }
        />
        <Route path="/login" element={<div data-testid="login-page">Login</div>} />
        <Route path="/verify-email" element={<div data-testid="verify-page">Verify</div>} />
      </Routes>
    </MemoryRouter>
  )
}

describe('ProtectedRoute', () => {
  it('deve mostrar spinner quando loading', () => {
    renderProtected({ user: null, loading: true })
    expect(document.querySelector('.spinner-border')).toBeTruthy()
  })

  it('deve redirecionar para /login se não autenticado', () => {
    renderProtected({ user: null, loading: false })
    expect(screen.getByTestId('login-page')).toBeInTheDocument()
  })

  it('deve renderizar conteúdo se autenticado com role correta', () => {
    renderProtected(
      {
        user: { uid: '1', role: 'client', emailVerified: true },
        loading: false,
        isClient: true,
        isAdmin: false,
        isClinic: false,
        isProfessional: false,
      },
      ['client']
    )
    expect(screen.getByTestId('protected-content')).toBeInTheDocument()
  })

  it('deve redirecionar para / se role não for permitida', () => {
    renderProtected(
      {
        user: { uid: '1', role: 'client', emailVerified: true },
        loading: false,
        isClient: true,
        isAdmin: false,
        isClinic: false,
        isProfessional: false,
      },
      ['clinic']
    )
    expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument()
    // Should navigate to "/" (default redirect for wrong role)
  })

  it('deve redirecionar para /verify-email se email não verificado (não-admin)', () => {
    renderProtected(
      {
        user: { uid: '1', role: 'client', emailVerified: false },
        loading: false,
        isClient: true,
        isAdmin: false,
        isClinic: false,
        isProfessional: false,
      },
      ['client']
    )
    expect(screen.getByTestId('verify-page')).toBeInTheDocument()
  })

  it('deve liberar admin sem verificação de email', () => {
    renderProtected(
      {
        user: { uid: '1', role: 'admin', emailVerified: false },
        loading: false,
        isAdmin: true,
        isClient: false,
        isClinic: false,
        isProfessional: false,
      },
      ['admin']
    )
    expect(screen.getByTestId('protected-content')).toBeInTheDocument()
  })

  it('deve aceitar qualquer role autenticado se allowedRoles vazio', () => {
    renderProtected(
      {
        user: { uid: '1', role: 'client', emailVerified: true },
        loading: false,
        isClient: true,
        isAdmin: false,
        isClinic: false,
        isProfessional: false,
      },
      []
    )
    expect(screen.getByTestId('protected-content')).toBeInTheDocument()
  })
})
