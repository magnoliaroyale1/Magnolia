import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  type User as FirebaseUser
} from 'firebase/auth';
import { doc, setDoc, getDoc, Timestamp } from 'firebase/firestore';
import { auth, db } from '../services/firebase';
import type { User } from '../types';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAdmin: boolean;
  isClinic: boolean;
  isClient: boolean;
  isProfessional: boolean;
  register: (email: string, password: string, name: string, role: 'client' | 'clinic' | 'admin' | 'professional') => Promise<void>;
  login: (email: string, password: string) => Promise<FirebaseUser>;
  logout: () => Promise<void>;
}

// ✅ Corrigido: removido << extra
const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
      if (firebaseUser) {
        try {
          const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data() as User;
            setUser({ ...userData, uid: firebaseUser.uid });
          } else {
            setUser({
              uid: firebaseUser.uid,
              email: firebaseUser.email || '',
              displayName: firebaseUser.displayName || '',
              role: 'client',
              createdAt: Timestamp.now()
            });
          }
        } catch (error) {
          console.error('Erro ao buscar usuário:', error);
          setUser(null);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const register = async (email: string, password: string, name: string, role: 'client' | 'clinic' | 'admin' | 'professional') => {
    const { user: firebaseUser } = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(firebaseUser, { displayName: name });
    
    const userData: User = {
      uid: firebaseUser.uid,
      email,
      displayName: name,
      role,
      createdAt: Timestamp.now()
    };
    
    await setDoc(doc(db, 'users', firebaseUser.uid), userData);
    setUser(userData);
  };

  const login = async (email: string, password: string) => {
    const result = await signInWithEmailAndPassword(auth, email, password);
    return result.user;
  };

  const logout = async () => {
    await signOut(auth);
    setUser(null);
  };

  const isAdmin = user?.role === 'admin';
  const isClinic = user?.role === 'clinic';
  const isClient = user?.role === 'client';
  const isProfessional = user?.role === 'professional';

  return (
    <AuthContext.Provider value={{ 
      user, 
      loading, 
      isAdmin, 
      isClinic, 
      isClient,
      isProfessional,
      register, 
      login, 
      logout 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};