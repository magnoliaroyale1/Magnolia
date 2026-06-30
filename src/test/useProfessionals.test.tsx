import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'

const {
  mockGetDocs,
  mockAddDoc,
  mockUpdateDoc,
  mockDeleteDoc,
  mockGetFunctions,
  mockHttpsCallable,
} = vi.hoisted(() => ({
  mockGetDocs: vi.fn(),
  mockAddDoc: vi.fn(),
  mockUpdateDoc: vi.fn(),
  mockDeleteDoc: vi.fn(),
  mockGetFunctions: vi.fn(() => ({})),
  mockHttpsCallable: vi.fn(),
}))

vi.mock('firebase/firestore', () => ({
  getFirestore: vi.fn(() => ({})),
  collection: vi.fn((_db: any, path: string) => ({ path })),
  doc: vi.fn((_db: any, path: string, ...segments: string[]) => ({
    path: segments.length > 0 ? `${path}/${segments.join('/')}` : path,
  })),
  query: vi.fn((...args: any[]) => ({ type: 'query', args })),
  where: vi.fn((field: string, op: string, value: any) => ({ type: 'where', field, op, value })),
  orderBy: vi.fn((field: string, dir?: string) => ({ type: 'orderBy', field, dir })),
  getDocs: (...args: any[]) => mockGetDocs(...args),
  addDoc: (...args: any[]) => mockAddDoc(...args),
  updateDoc: (...args: any[]) => mockUpdateDoc(...args),
  deleteDoc: (...args: any[]) => mockDeleteDoc(...args),
  Timestamp: { now: vi.fn(() => ({ seconds: 1000, nanoseconds: 0 })) },
}))

vi.mock('firebase/functions', () => ({
  getFunctions: (...args: any[]) => mockGetFunctions(...args),
  httpsCallable: (...args: any[]) => mockHttpsCallable(...args),
}))

vi.mock('../services/firebase', () => ({
  db: {},
  auth: { currentUser: { uid: 'test' } },
  app: {},
}))

import {
  useProfessionalsByClinic,
  useCreateProfessional,
  useUpdateProfessional,
  useDeleteProfessional,
} from '../hooks/useProfessionals'

describe('useProfessionalsByClinic', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('deve buscar profissionais da clínica', async () => {
    const professionals = [
      { id: 'p1', clinicId: 'c1', name: 'Dr. João', email: 'joao@test.com', procedures: ['Limpeza'] },
    ]
    mockGetDocs.mockResolvedValue({
      docs: professionals.map(p => ({ id: p.id, data: () => p, exists: () => true })),
    })

    const { result } = renderHook(() => useProfessionalsByClinic('c1'))

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.professionals).toHaveLength(1)
    expect(result.current.professionals[0].name).toBe('Dr. João')
  })
})

describe('useCreateProfessional', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('deve criar profissional via Cloud Function + Firestore', async () => {
    const mockCreateFn = vi.fn().mockResolvedValue({ data: { uid: 'new-uid-456' } })
    mockHttpsCallable.mockReturnValue(mockCreateFn)
    mockAddDoc.mockResolvedValue({ id: 'prof-1' })

    const { result } = renderHook(() => useCreateProfessional())

    let success = false
    await act(async () => {
      success = await result.current.createProfessional({
        clinicId: 'c1',
        name: 'Dr. Silva',
        email: 'silva@test.com',
        password: 'senha123',
        bio: 'Especialista',
        procedures: ['Limpeza', 'Clareamento'],
      })
    })

    expect(success).toBe(true)
    // Cloud Function should have been called
    expect(mockCreateFn).toHaveBeenCalledWith({
      email: 'silva@test.com',
      password: 'senha123',
      name: 'Dr. Silva',
      clinicId: 'c1',
    })
    // Then the Firestore doc should be created with the returned uid
    expect(mockAddDoc).toHaveBeenCalled()
    const addCallArgs = mockAddDoc.mock.calls[0]
    expect(addCallArgs[1]).toMatchObject({
      uid: 'new-uid-456',
      name: 'Dr. Silva',
      email: 'silva@test.com',
    })
  })

  it('deve retornar false se Cloud Function falhar', async () => {
    const mockCreateFn = vi.fn().mockRejectedValue(new Error('Network error'))
    mockHttpsCallable.mockReturnValue(mockCreateFn)

    const { result } = renderHook(() => useCreateProfessional())

    let success = true
    await act(async () => {
      success = await result.current.createProfessional({
        clinicId: 'c1',
        name: 'Dr. Silva',
        email: 'silva@test.com',
        password: 'senha123',
        bio: 'Especialista',
        procedures: ['Limpeza'],
      })
    })

    expect(success).toBe(false)
    expect(mockAddDoc).not.toHaveBeenCalled()
  })
})

describe('useUpdateProfessional', () => {
  it('deve atualizar profissional', async () => {
    mockUpdateDoc.mockResolvedValue(undefined)

    const { result } = renderHook(() => useUpdateProfessional())

    let success = false
    await act(async () => {
      success = await result.current.updateProfessional('prof-1', { name: 'Novo Nome' })
    })

    expect(success).toBe(true)
    expect(mockUpdateDoc).toHaveBeenCalledWith(
      expect.objectContaining({ path: 'professionals/prof-1' }),
      { name: 'Novo Nome' }
    )
  })
})

describe('useDeleteProfessional', () => {
  it('deve deletar profissional', async () => {
    mockDeleteDoc.mockResolvedValue(undefined)

    const { result } = renderHook(() => useDeleteProfessional())

    let success = false
    await act(async () => {
      success = await result.current.deleteProfessional('prof-1')
    })

    expect(success).toBe(true)
    expect(mockDeleteDoc).toHaveBeenCalledWith(
      expect.objectContaining({ path: 'professionals/prof-1' })
    )
  })
})
