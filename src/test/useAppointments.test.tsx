import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'

const {
  mockGetDocs,
  mockAddDoc,
  mockUpdateDoc,
  mockDoc,
  mockCollection,
  mockQuery,
  mockWhere,
  mockOrderBy,
  mockLimit,
} = vi.hoisted(() => ({
  mockGetDocs: vi.fn(),
  mockAddDoc: vi.fn(),
  mockUpdateDoc: vi.fn(),
  mockDoc: vi.fn((_db: any, path: string, ...segments: string[]) => ({
    path: segments.length > 0 ? `${path}/${segments.join('/')}` : path,
    _db,
  })),
  mockCollection: vi.fn((_db: any, path: string, ...segments: string[]) => ({
    path: segments.length > 0 ? `${path}/${segments.join('/')}` : path,
    _db,
  })),
  mockQuery: vi.fn((...args: any[]) => ({ type: 'query', args })),
  mockWhere: vi.fn((field: string, op: string, value: any) => ({ type: 'where', field, op, value })),
  mockOrderBy: vi.fn((field: string, dir?: string) => ({ type: 'orderBy', field, dir })),
  mockLimit: vi.fn((n: number) => ({ type: 'limit', n })),
}))

vi.mock('firebase/firestore', () => ({
  getFirestore: vi.fn(() => ({})),
  collection: (...args: any[]) => mockCollection(...args),
  doc: (...args: any[]) => mockDoc(...args),
  query: (...args: any[]) => mockQuery(...args),
  where: (...args: any[]) => mockWhere(...args),
  orderBy: (...args: any[]) => mockOrderBy(...args),
  limit: (...args: any[]) => mockLimit(...args),
  getDocs: (...args: any[]) => mockGetDocs(...args),
  addDoc: (...args: any[]) => mockAddDoc(...args),
  updateDoc: (...args: any[]) => mockUpdateDoc(...args),
  Timestamp: { now: vi.fn(() => ({ seconds: 1000, nanoseconds: 0 })) },
}))

vi.mock('../services/firebase', () => ({
  db: {},
  auth: { currentUser: { uid: 'test' } },
  app: {},
}))

import {
  useAppointmentsByClient,
  useAppointmentsByClinic,
  useCreateAppointment,
  useUpdateAppointmentStatus,
  useCancelAppointment,
  useRescheduleAppointment,
} from '../hooks/useAppointments'

const makeAppointment = (overrides = {}) => ({
  id: 'apt-1',
  clinicId: 'clinic-1',
  clientId: 'client-1',
  clientName: 'João',
  procedure: 'Limpeza',
  date: '2026-07-01',
  time: '10:00',
  status: 'pending',
  ...overrides,
})

describe('useAppointments', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('useAppointmentsByClient', () => {
    it('deve buscar appointments do cliente', async () => {
      const appointments = [
        { id: 'a1', clinicId: 'c1', clientId: 'uid-1', procedure: 'Limpeza', status: 'pending', date: '2026-07-01', time: '10:00' },
      ]
      mockGetDocs.mockResolvedValue({
        docs: appointments.map(a => ({ id: a.id, data: () => a, exists: () => true })),
      })

      const { result } = renderHook(() => useAppointmentsByClient('uid-1'))

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(result.current.appointments).toHaveLength(1)
      expect(result.current.appointments[0].id).toBe('a1')
    })
  })

  describe('useAppointmentsByClinic', () => {
    it('deve buscar appointments da clínica', async () => {
      const appointments = [
        { id: 'a1', clinicId: 'c1', clientId: 'client-1', procedure: 'Limpeza', status: 'pending' },
      ]
      mockGetDocs.mockResolvedValue({
        docs: appointments.map(a => ({ id: a.id, data: () => a, exists: () => true })),
      })

      const { result } = renderHook(() => useAppointmentsByClinic('c1'))

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(result.current.appointments).toHaveLength(1)
    })
  })

  describe('useCreateAppointment', () => {
    it('deve criar appointment com dados corretos', async () => {
      mockAddDoc.mockResolvedValue({ id: 'new-apt' })

      const { result } = renderHook(() => useCreateAppointment())

      let success = false
      await act(async () => {
        success = await result.current.createAppointment({
          clinicId: 'c1',
          clientId: 'client-1',
          clientName: 'João',
          procedure: 'Limpeza',
          date: '2026-07-01',
          time: '10:00',
          status: 'pending',
          professionalId: 'prof-1',
          professionalName: 'Dr. Silva',
          valor: 150,
        } as any)
      })

      expect(success).toBe(true)
      expect(mockAddDoc).toHaveBeenCalled()
      const callArgs = mockAddDoc.mock.calls[0]
      expect(callArgs[0]).toHaveProperty('path', 'appointments')
      expect(callArgs[1]).toMatchObject({
        clinicId: 'c1',
        procedure: 'Limpeza',
        status: 'pending',
      })
    })
  })

  describe('useUpdateAppointmentStatus', () => {
    it('deve atualizar status do appointment', async () => {
      mockUpdateDoc.mockResolvedValue(undefined)

      const { result } = renderHook(() => useUpdateAppointmentStatus())

      await act(async () => {
        await result.current.updateStatus('apt-1', 'confirmed')
      })

      expect(mockUpdateDoc).toHaveBeenCalledWith(
        expect.objectContaining({ path: 'appointments/apt-1' }),
        expect.objectContaining({ status: 'confirmed' })
      )
    })
  })

  describe('useCancelAppointment', () => {
    it('deve cancelar appointment com motivo', async () => {
      mockUpdateDoc.mockResolvedValue(undefined)

      const { result } = renderHook(() => useCancelAppointment())

      await act(async () => {
        await result.current.cancelAppointment('apt-1', 'Mudança de planos')
      })

      expect(mockUpdateDoc).toHaveBeenCalledWith(
        expect.objectContaining({ path: 'appointments/apt-1' }),
        expect.objectContaining({
          status: 'cancelled_by_client',
          cancelReason: 'Mudança de planos',
        })
      )
    })
  })

  describe('useRescheduleAppointment', () => {
    it('deve remarcar appointment com nova data/hora', async () => {
      mockUpdateDoc.mockResolvedValue(undefined)

      const { result } = renderHook(() => useRescheduleAppointment())

      await act(async () => {
        await result.current.rescheduleAppointment('apt-1', new Date('2026-07-15'), '14:00')
      })

      expect(mockUpdateDoc).toHaveBeenCalledWith(
        expect.objectContaining({ path: 'appointments/apt-1' }),
        expect.objectContaining({
          time: '14:00',
          status: 'pending',
        })
      )
    })
  })
})
