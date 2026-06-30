import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'

const {
  mockAddDoc,
  mockUpdateDoc,
  mockGetDoc,
} = vi.hoisted(() => ({
  mockAddDoc: vi.fn(),
  mockUpdateDoc: vi.fn(),
  mockGetDoc: vi.fn(),
}))

vi.mock('firebase/firestore', () => ({
  getFirestore: vi.fn(() => ({})),
  collection: vi.fn((_db: any, path: string, ...segments: string[]) => ({
    path: segments.length > 0 ? `${path}/${segments.join('/')}` : path,
    _db,
  })),
  doc: vi.fn((_db: any, path: string, ...segments: string[]) => ({
    path: segments.length > 0 ? `${path}/${segments.join('/')}` : path,
  })),
  addDoc: (...args: any[]) => mockAddDoc(...args),
  updateDoc: (...args: any[]) => mockUpdateDoc(...args),
  getDoc: (...args: any[]) => mockGetDoc(...args),
  Timestamp: { now: vi.fn(() => ({ seconds: 1000, nanoseconds: 0 })) },
  query: vi.fn(),
  where: vi.fn(),
  orderBy: vi.fn(),
}))

vi.mock('../services/firebase', () => ({
  db: {},
  auth: { currentUser: { uid: 'test' } },
  app: {},
}))

import { useCheckout } from '../hooks/useCheckout'

describe('useCheckout', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('deve criar sessão de checkout', async () => {
    mockAddDoc.mockResolvedValue({ id: 'checkout-1' })
    mockGetDoc.mockResolvedValue({
      exists: () => true,
      data: () => ({ name: 'Minha Clínica' }),
    })

    const { result } = renderHook(() => useCheckout())

    let sessionId: string | null = null
    await act(async () => {
      sessionId = await result.current.createCheckoutSession('clinic-1', 'professional', 197)
    })

    expect(sessionId).toBe('checkout-1')
    expect(mockAddDoc).toHaveBeenCalled()
    const args = mockAddDoc.mock.calls[0]
    expect(args[0]).toHaveProperty('path')
    expect(args[0].path).toContain('clinics/clinic-1/checkouts')
    expect(args[1]).toMatchObject({
      plan: 'professional',
      price: 197,
      clinicId: 'clinic-1',
    })
  })

  it('deve completar checkout', async () => {
    mockUpdateDoc.mockResolvedValue(undefined)

    const { result } = renderHook(() => useCheckout())

    await act(async () => {
      await result.current.completeCheckout('clinic-1', 'checkout-1', 'credit_card')
    })

    expect(mockUpdateDoc).toHaveBeenCalledWith(
      expect.objectContaining({ path: 'clinics/clinic-1/checkouts/checkout-1' }),
      expect.objectContaining({
        status: 'completed',
        paymentMethod: 'credit_card',
        paidAt: expect.anything(),
      })
    )
  })
})
