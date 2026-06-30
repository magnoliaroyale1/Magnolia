import { vi } from 'vitest'

// ============================================
// Firebase Auth Mock
// ============================================
const mockFirebaseUser = {
  uid: 'test-uid-123',
  email: 'test@example.com',
  displayName: 'Test User',
  emailVerified: true,
  toJSON: () => ({}),
}

export const mockAuth = {
  currentUser: null,
}

export const mockCreateUserWithEmailAndPassword = vi.fn()
export const mockSignInWithEmailAndPassword = vi.fn()
export const mockSignOut = vi.fn()
export const mockOnAuthStateChanged = vi.fn()
export const mockSendEmailVerification = vi.fn()
export const mockUpdateProfile = vi.fn()
export const mockSendPasswordResetEmail = vi.fn()

vi.mock('firebase/auth', () => ({
  getAuth: vi.fn(() => mockAuth),
  createUserWithEmailAndPassword: (...args: any[]) => mockCreateUserWithEmailAndPassword(...args),
  signInWithEmailAndPassword: (...args: any[]) => mockSignInWithEmailAndPassword(...args),
  signOut: (...args: any[]) => mockSignOut(...args),
  onAuthStateChanged: (...args: any[]) => mockOnAuthStateChanged(...args),
  sendEmailVerification: (...args: any[]) => mockSendEmailVerification(...args),
  updateProfile: (...args: any[]) => mockUpdateProfile(...args),
  sendPasswordResetEmail: (...args: any[]) => mockSendPasswordResetEmail(...args),
  type: { User: {} },
}))

// ============================================
// Firebase Firestore Mock
// ============================================
type MockDoc = { id: string; data: Record<string, any>; path?: string }

let mockStore: MockDoc[] = []

export const resetMockStore = () => { mockStore = [] }
export const addMockDoc = (path: string, id: string, data: Record<string, any>) => {
  const existing = mockStore.find(d => d.path === `${path}/${id}`)
  if (existing) {
    existing.data = { ...existing.data, ...data }
  } else {
    mockStore.push({ id, data, path: `${path}/${id}` })
  }
}

// Timestamp mock
class MockTimestamp {
  constructor(public seconds: number, public nanoseconds: number) {}
  toDate() { return new Date(this.seconds * 1000) }
  toMillis() { return this.seconds * 1000 }
  isEqual(other: MockTimestamp) { return this.seconds === other.seconds }
  valueOf() { return this.seconds * 1000 }
}

export const mockTimestamp = {
  now: vi.fn(() => new MockTimestamp(Math.floor(Date.now() / 1000), 0)),
  fromDate: vi.fn((d: Date) => new MockTimestamp(Math.floor(d.getTime() / 1000), 0)),
  fromMillis: vi.fn((millis: number) => new MockTimestamp(Math.floor(millis / 1000), 0)),
}

export const mockCollection = vi.fn((db: any, path: string) => ({
  path,
  _db: db,
}))

export const mockDoc = vi.fn((db: any, path: string, ...segments: string[]) => ({
  path: segments.length > 0 ? `${path}/${segments.join('/')}` : path,
  _db: db,
}))

export const mockQuery = vi.fn((...args: any[]) => ({ _type: 'query', _args: args }))

export const mockWhere = vi.fn((field: string, op: string, value: any) => ({
  _type: 'where', field, op, value
}))

export const mockOrderBy = vi.fn((field: string, dir?: 'asc' | 'desc') => ({
  _type: 'orderBy', field, dir
}))

export const mockGetDocs = vi.fn()
export const mockGetDoc = vi.fn()
export const mockAddDoc = vi.fn()
export const mockSetDoc = vi.fn()
export const mockUpdateDoc = vi.fn()
export const mockDeleteDoc = vi.fn()
export const mockOnSnapshot = vi.fn()

export const mockDb = { _type: 'db' }

vi.mock('firebase/firestore', () => ({
  getFirestore: vi.fn(() => mockDb),
  collection: (...args: any[]) => mockCollection(...args),
  doc: (...args: any[]) => mockDoc(...args),
  query: (...args: any[]) => mockQuery(...args),
  where: (...args: any[]) => mockWhere(...args),
  orderBy: (...args: any[]) => mockOrderBy(...args),
  getDocs: (...args: any[]) => mockGetDocs(...args),
  getDoc: (...args: any[]) => mockGetDoc(...args),
  addDoc: (...args: any[]) => mockAddDoc(...args),
  setDoc: (...args: any[]) => mockSetDoc(...args),
  updateDoc: (...args: any[]) => mockUpdateDoc(...args),
  deleteDoc: (...args: any[]) => mockDeleteDoc(...args),
  onSnapshot: (...args: any[]) => mockOnSnapshot(...args),
  Timestamp: mockTimestamp,
}))

// ============================================
// Firebase Functions Mock
// ============================================
export const mockGetFunctions = vi.fn()
export const mockHttpsCallable = vi.fn()

vi.mock('firebase/functions', () => ({
  getFunctions: (...args: any[]) => mockGetFunctions(...args),
  httpsCallable: (...args: any[]) => mockHttpsCallable(...args),
}))

// ============================================
// Firebase Storage Mock
// ============================================
vi.mock('firebase/storage', () => ({
  getStorage: vi.fn(),
  ref: vi.fn(),
  uploadBytesResumable: vi.fn(),
  getDownloadURL: vi.fn(),
  deleteObject: vi.fn(),
}))

// ============================================
// Firebase App Mock (default export for services/firebase.ts)
// ============================================
export const mockFirebaseApp = { _type: 'app', name: '[DEFAULT]' }

vi.mock('../services/firebase', () => ({
  app: mockFirebaseApp,
  auth: mockAuth,
  db: mockDb,
  storage: {},
}))

// ============================================
// Reset helper
// ============================================
export const resetAllMocks = () => {
  resetMockStore()
  vi.clearAllMocks()
  mockAuth.currentUser = null
  mockGetDocs.mockReset()
  mockGetDoc.mockReset()
  mockAddDoc.mockReset()
  mockSetDoc.mockReset()
  mockUpdateDoc.mockReset()
  mockDeleteDoc.mockReset()
  mockOnSnapshot.mockReset()
  mockOnAuthStateChanged.mockReset()
  mockCreateUserWithEmailAndPassword.mockReset()
  mockSignInWithEmailAndPassword.mockReset()
  mockSignOut.mockReset()
  mockSendEmailVerification.mockReset()
  mockUpdateProfile.mockReset()
  mockHttpsCallable.mockReset()
}
