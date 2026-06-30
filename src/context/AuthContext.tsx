import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  sendEmailVerification,
  EmailAuthProvider,
  reauthenticateWithCredential,
  deleteUser,
  type User as FirebaseUser
} from 'firebase/auth';
import { doc, setDoc, updateDoc, getDoc, deleteDoc, Timestamp } from 'firebase/firestore';
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
  sendVerificationEmail: () => Promise<void>;
  deleteAccount: (password: string) => Promise<void>;
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
            const verified = firebaseUser.emailVerified;
            if (userData.emailVerified !== verified) {
              await updateDoc(doc(db, 'users', firebaseUser.uid), { emailVerified: verified });
            }
            setUser({ ...userData, uid: firebaseUser.uid, emailVerified: verified });
          } else {
            setUser({
              uid: firebaseUser.uid,
              email: firebaseUser.email || '',
              displayName: firebaseUser.displayName || '',
              role: 'client',
              createdAt: Timestamp.now(),
              emailVerified: firebaseUser.emailVerified
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
    await sendEmailVerification(firebaseUser);
    
    const userData: User = {
      uid: firebaseUser.uid,
      email,
      displayName: name,
      role,
      createdAt: Timestamp.now(),
      emailVerified: false
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

  const sendVerificationEmail = async () => {
    if (auth.currentUser) {
      await sendEmailVerification(auth.currentUser);
    }
  };

  const deleteAccount = async (password: string) => {
    const fbUser = auth.currentUser;
    if (!fbUser || !fbUser.email) throw new Error('Usuário não autenticado');
    const credential = EmailAuthProvider.credential(fbUser.email, password);
    await reauthenticateWithCredential(fbUser, credential);
    await deleteDoc(doc(db, 'users', fbUser.uid));
    await deleteUser(fbUser);
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
      logout,
      sendVerificationEmail,
      deleteAccount
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