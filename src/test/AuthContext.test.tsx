import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { type ReactNode } from 'react'

// ========================================
// Firebase mocks (hoisted before imports)
// ========================================

const {
  mockCreateUserWithEmailAndPassword,
  mockSignInWithEmailAndPassword,
  mockSignOut,
  mockOnAuthStateChanged,
  mockSendEmailVerification,
  mockUpdateProfile,
  mockGetDoc,
  mockSetDoc,
  mockUpdateDoc,
  mockDoc,
  mockTimestamp,
} = vi.hoisted(() => ({
  mockCreateUserWithEmailAndPassword: vi.fn(),
  mockSignInWithEmailAndPassword: vi.fn(),
  mockSignOut: vi.fn(),
  mockOnAuthStateChanged: vi.fn(),
  mockSendEmailVerification: vi.fn(),
  mockUpdateProfile: vi.fn(),
  mockGetDoc: vi.fn(),
  mockSetDoc: vi.fn(),
  mockUpdateDoc: vi.fn(),
  mockDoc: vi.fn((_db: any, path: string, ...segments: string[]) => ({
    path: segments.length > 0 ? `${path}/${segments.join('/')}` : path,
    _db,
  })),
  mockTimestamp: { now: vi.fn(() => ({ seconds: 0, nanoseconds: 0 })) },
}))

vi.mock('firebase/auth', () => ({
  getAuth: vi.fn(() => ({})),
  createUserWithEmailAndPassword: (...args: any[]) => mockCreateUserWithEmailAndPassword(...args),
  signInWithEmailAndPassword: (...args: any[]) => mockSignInWithEmailAndPassword(...args),
  signOut: (...args: any[]) => mockSignOut(...args),
  onAuthStateChanged: (...args: any[]) => mockOnAuthStateChanged(...args),
  sendEmailVerification: (...args: any[]) => mockSendEmailVerification(...args),
  updateProfile: (...args: any[]) => mockUpdateProfile(...args),
}))

vi.mock('firebase/firestore', () => ({
  getFirestore: vi.fn(() => ({})),
  collection: vi.fn((_db: any, path: string) => ({ path })),
  doc: (...args: any[]) => mockDoc(...args),
  getDoc: (...args: any[]) => mockGetDoc(...args),
  setDoc: (...args: any[]) => mockSetDoc(...args),
  updateDoc: (...args: any[]) => mockUpdateDoc(...args),
  Timestamp: mockTimestamp,
}))

vi.mock('../services/firebase', () => ({
  auth: { currentUser: { uid: 'test-user' } },
  db: {},
  app: {},
}))

// ========================================
// Imports
// ========================================
import { useAuth, AuthProvider } from '../context/AuthContext'

const wrapper = ({ children }: { children: ReactNode }) => (
  <AuthProvider>{children}</AuthProvider>
)

describe('AuthContext', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockOnAuthStateChanged.mockImplementation((_auth: any, cb: (u: any) => void) => {
      cb(null)
      return vi.fn()
    })
  })

  describe('register', () => {
    it('deve criar usuário no Auth + Firestore + enviar verificação', async () => {
      const mockUser = { uid: 'new-uid-456', email: 'new@test.com', emailVerified: false }
      mockCreateUserWithEmailAndPassword.mockResolvedValue({ user: mockUser })
      mockUpdateProfile.mockResolvedValue(undefined)
      mockSendEmailVerification.mockResolvedValue(undefined)
      mockSetDoc.mockResolvedValue(undefined)

      const { result } = renderHook(() => useAuth(), { wrapper })

      await act(async () => {
        await result.current.register('new@test.com', 'senha123', 'Novo Usuário', 'client')
      })

      expect(mockCreateUserWithEmailAndPassword).toHaveBeenCalledWith(
        expect.anything(),
        'new@test.com',
        'senha123'
      )
      expect(mockUpdateProfile).toHaveBeenCalledWith(mockUser, { displayName: 'Novo Usuário' })
      expect(mockSendEmailVerification).toHaveBeenCalledWith(mockUser)
      expect(mockSetDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          uid: 'new-uid-456',
          email: 'new@test.com',
          displayName: 'Novo Usuário',
          role: 'client',
        })
      )
    })

    it('deve propagar erro se createUserWithEmailAndPassword falhar', async () => {
      mockCreateUserWithEmailAndPassword.mockRejectedValue(new Error('auth/email-already-in-use'))

      const { result } = renderHook(() => useAuth(), { wrapper })

      await act(async () => {
        await expect(
          result.current.register('exists@test.com', 'senha123', 'Existing', 'client')
        ).rejects.toThrow('auth/email-already-in-use')
      })
    })
  })

  describe('login', () => {
    it('deve chamar signInWithEmailAndPassword e retornar user', async () => {
      const mockUser = { uid: 'login-uid' }
      mockSignInWithEmailAndPassword.mockResolvedValue({ user: mockUser })

      const { result } = renderHook(() => useAuth(), { wrapper })

      let user: any
      await act(async () => {
        user = await result.current.login('user@test.com', 'senha123')
      })

      expect(mockSignInWithEmailAndPassword).toHaveBeenCalledWith(
        expect.anything(),
        'user@test.com',
        'senha123'
      )
      expect(user).toEqual(mockUser)
    })

    it('deve propagar erro de login', async () => {
      mockSignInWithEmailAndPassword.mockRejectedValue(new Error('auth/wrong-password'))

      const { result } = renderHook(() => useAuth(), { wrapper })

      await act(async () => {
        await expect(
          result.current.login('user@test.com', 'errada')
        ).rejects.toThrow('auth/wrong-password')
      })
    })
  })

  describe('logout', () => {
    it('deve chamar signOut', async () => {
      mockSignOut.mockResolvedValue(undefined)

      const { result } = renderHook(() => useAuth(), { wrapper })

      await act(async () => {
        await result.current.logout()
      })

      expect(mockSignOut).toHaveBeenCalled()
    })
  })

  describe('sendVerificationEmail', () => {
    it('deve chamar sendEmailVerification', async () => {
      mockSendEmailVerification.mockResolvedValue(undefined)

      const { result } = renderHook(() => useAuth(), { wrapper })

      await act(async () => {
        await result.current.sendVerificationEmail()
      })

      expect(mockSendEmailVerification).toHaveBeenCalled()
    })
  })

  describe('onAuthStateChanged', () => {
    it('deve sincronizar emailVerified com Firestore', async () => {
      const fakeUser = { uid: 'uid-1', email: 'a@b.com', emailVerified: true }

      mockGetDoc.mockResolvedValue({
        exists: () => true,
        data: () => ({ uid: 'uid-1', role: 'client', emailVerified: false }),
      })

      mockOnAuthStateChanged.mockImplementation((_auth: any, cb: (u: any) => void) => {
        cb(fakeUser)
        return vi.fn()
      })

      const { result } = renderHook(() => useAuth(), { wrapper })

      await waitFor(() => {
        expect(result.current.user).toBeTruthy()
      })

      expect(mockUpdateDoc).toHaveBeenCalledWith(expect.anything(), { emailVerified: true })
      expect(result.current.user?.emailVerified).toBe(true)
    })

    it('deve criar fallback user se doc não existir no Firestore', async () => {
      const fakeUser = { uid: 'no-doc', email: 'nodoc@test.com', emailVerified: false }

      mockGetDoc.mockResolvedValue({ exists: () => false })

      mockOnAuthStateChanged.mockImplementation((_auth: any, cb: (u: any) => void) => {
        cb(fakeUser)
        return vi.fn()
      })

      const { result } = renderHook(() => useAuth(), { wrapper })

      await waitFor(() => {
        expect(result.current.user).toBeTruthy()
      })

      expect(result.current.user?.role).toBe('client')
      expect(result.current.user?.email).toBe('nodoc@test.com')
    })

    it('deve definir user como null quando firebaseUser for null', async () => {
      const { result } = renderHook(() => useAuth(), { wrapper })

      await waitFor(() => {
        expect(result.current.user).toBeNull()
      })
    })
  })

  describe('role flags', () => {
    const rolesMap: Array<{ role: 'client' | 'clinic' | 'admin' | 'professional'; flag: string }> = [
      { role: 'admin', flag: 'isAdmin' },
      { role: 'clinic', flag: 'isClinic' },
      { role: 'client', flag: 'isClient' },
      { role: 'professional', flag: 'isProfessional' },
    ]

    rolesMap.forEach(({ role, flag }) => {
      it(`deve retornar ${flag}=true para role=${role}`, async () => {
        const fakeUser = { uid: `uid-${role}`, email: `${role}@test.com`, emailVerified: true }

        mockGetDoc.mockResolvedValue({
          exists: () => true,
          data: () => ({ uid: `uid-${role}`, role, emailVerified: true }),
        })

        mockOnAuthStateChanged.mockImplementation((_auth: any, cb: (u: any) => void) => {
          cb(fakeUser)
          return vi.fn()
        })

        const { result } = renderHook(() => useAuth(), { wrapper })

        await waitFor(() => {
          expect(result.current.user?.role).toBe(role)
        })

        expect((result.current as any)[flag]).toBe(true)
      })
    })
  })
})
