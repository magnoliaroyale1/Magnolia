import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'

const {
  mockGetDocs,
  mockGetDoc,
  mockAddDoc,
  mockUpdateDoc,
  mockRunTransaction,
} = vi.hoisted(() => ({
  mockGetDocs: vi.fn(),
  mockGetDoc: vi.fn(),
  mockAddDoc: vi.fn(),
  mockUpdateDoc: vi.fn(),
  mockRunTransaction: vi.fn(),
}))

vi.mock('firebase/firestore', () => ({
  getFirestore: vi.fn(() => ({})),
  collection: vi.fn((_db: any, path: string, ...segments: string[]) => ({
    path: segments.length > 0 ? `${path}/${segments.join('/')}` : path,
    _db,
  })),
  doc: vi.fn((_db: any, path: string, ...segments: string[]) => ({
    path: segments.length > 0 ? `${path}/${segments.join('/')}` : path,
    _db,
  })),
  query: vi.fn((...args: any[]) => ({ type: 'query', args })),
  where: vi.fn((field: string, op: string, value: any) => ({ type: 'where', field, op, value })),
  orderBy: vi.fn((field: string, dir?: string) => ({ type: 'orderBy', field, dir })),
  limit: vi.fn((n: number) => ({ type: 'limit', n })),
  getDocs: (...args: any[]) => mockGetDocs(...args),
  getDoc: (...args: any[]) => mockGetDoc(...args),
  addDoc: (...args: any[]) => mockAddDoc(...args),
  updateDoc: (...args: any[]) => mockUpdateDoc(...args),
  runTransaction: (...args: any[]) => mockRunTransaction(...args),
  Timestamp: { now: vi.fn(() => ({ seconds: 1000, nanoseconds: 0 })) },
}))

vi.mock('../services/firebase', () => ({
  db: {},
  auth: { currentUser: { uid: 'test' } },
  app: {},
}))

import { useReviews, useCheckCanReview, useSubmitReview } from '../hooks/useReviews'

describe('useReviews', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('deve buscar reviews da clínica', async () => {
    const reviews = [
      { id: 'r1', clinicId: 'c1', clientName: 'João', rating: 5, comment: 'Ótimo' },
    ]
    mockGetDocs.mockResolvedValue({
      docs: reviews.map(r => ({ id: r.id, data: () => r, exists: () => true })),
    })

    const { result } = renderHook(() => useReviews('c1'))

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.reviews).toHaveLength(1)
    expect(result.current.reviews[0].rating).toBe(5)
  })
})

describe('useCheckCanReview', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('deve permitir review se cliente tem appointment completed e não reviewou ainda', async () => {
    mockGetDocs
      // First call: check completed appointments
      .mockResolvedValueOnce({
        docs: [{ id: 'apt-1', data: () => ({ clientId: 'client-1', clinicId: 'c1', status: 'completed' }), exists: () => true }],
      })
      // Second call: check existing reviews
      .mockResolvedValueOnce({
        docs: [],
      })

    const { result } = renderHook(() => useCheckCanReview())

    await act(async () => {
      const canReview = await result.current.checkCanReview('c1', 'client-1')
      expect(canReview.canReview).toBe(true)
    })
  })

  it('deve bloquear review se cliente não tem appointment completed', async () => {
    mockGetDocs.mockResolvedValueOnce({ docs: [] })

    const { result } = renderHook(() => useCheckCanReview())

    await act(async () => {
      const canReview = await result.current.checkCanReview('c1', 'client-1')
      expect(canReview.canReview).toBe(false)
      expect(canReview.reason).toContain('não realizou')
    })
  })

  it('deve bloquear review duplicado', async () => {
    mockGetDocs
      .mockResolvedValueOnce({
        docs: [{ id: 'apt-1', data: () => ({ clientId: 'client-1', clinicId: 'c1', status: 'completed' }), exists: () => true }],
      })
      .mockResolvedValueOnce({
        docs: [{ id: 'r1', data: () => ({ clientId: 'client-1', clinicId: 'c1' }) }],
      })

    const { result } = renderHook(() => useCheckCanReview())

    await act(async () => {
      const canReview = await result.current.checkCanReview('c1', 'client-1')
      expect(canReview.canReview).toBe(false)
      expect(canReview.reason).toContain('já avaliou')
    })
  })
})

describe('useSubmitReview', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('deve enviar review com dados corretos', async () => {
    mockGetDocs
      // get reviews for rating recalculation - empty
      .mockResolvedValueOnce({ docs: [] })

    mockAddDoc.mockResolvedValue({ id: 'new-review' })
    mockUpdateDoc.mockResolvedValue(undefined)

    const { result } = renderHook(() => useSubmitReview())

    await act(async () => {
      await result.current.submitReview('c1', 'client-1', 'João', 5, 'Excelente!')
    })

    expect(mockAddDoc).toHaveBeenCalled()
    const callArgs = mockAddDoc.mock.calls[0]
    expect(callArgs[0]).toHaveProperty('path', 'clinics/c1/reviews')
    expect(callArgs[1]).toMatchObject({
      rating: 5,
      comment: 'Excelente!',
    })
  })
})
