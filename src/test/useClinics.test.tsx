import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'

const {
  mockGetDocs,
  mockCollection,
  mockQuery,
  mockWhere,
  mockOrderBy,
  mockLimit,
} = vi.hoisted(() => ({
  mockGetDocs: vi.fn(),
  mockCollection: vi.fn((_db: any, path: string) => ({ path })),
  mockQuery: vi.fn((...args: any[]) => ({ type: 'query', args })),
  mockWhere: vi.fn((field: string, op: string, value: any) => ({ type: 'where', field, op, value })),
  mockOrderBy: vi.fn((field: string, dir?: string) => ({ type: 'orderBy', field, dir })),
  mockLimit: vi.fn((n: number) => ({ type: 'limit', n })),
}))

vi.mock('firebase/firestore', () => ({
  getFirestore: vi.fn(() => ({})),
  collection: (...args: any[]) => mockCollection(...args),
  query: (...args: any[]) => mockQuery(...args),
  where: (...args: any[]) => mockWhere(...args),
  orderBy: (...args: any[]) => mockOrderBy(...args),
  limit: (...args: any[]) => mockLimit(...args),
  getDocs: (...args: any[]) => mockGetDocs(...args),
  Timestamp: { now: vi.fn(() => ({ seconds: 1000, nanoseconds: 0 })) },
}))

vi.mock('../services/firebase', () => ({
  db: {},
  auth: { currentUser: { uid: 'test' } },
  app: {},
}))

import { useClinics } from '../hooks/useClinics'

describe('useClinics', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('deve buscar clínicas aprovadas ordenadas por rating', async () => {
    const clinics = [
      { id: 'c1', name: 'Clínica A', status: 'approved', rating: 4.5, logoUrl: '' },
      { id: 'c2', name: 'Clínica B', status: 'approved', rating: 4.0, logoUrl: '' },
    ]
    mockGetDocs.mockResolvedValue({
      docs: clinics.map(c => ({ id: c.id, data: () => c, exists: () => true })),
    })

    const { result } = renderHook(() => useClinics())

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.clinics).toHaveLength(2)
  })

  it('deve filtrar por status', async () => {
    mockGetDocs.mockResolvedValue({
      docs: [],
    })

    const { result } = renderHook(() => useClinics('pending'))

    await waitFor(() => {
      expect(result.current.clinics).toHaveLength(0)
    })

    expect(mockWhere).toHaveBeenCalledWith('status', '==', 'pending')
  })
})
