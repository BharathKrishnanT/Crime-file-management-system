import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, onAuthStateChanged, signInWithPopup, GoogleAuthProvider, signOut } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';

interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  role: 'inspector' | 'asi' | 'writer' | 'constable' | 'judge' | 'admin';
  stationId?: string;
}

interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  signIn: () => Promise<void>;
  logout: () => Promise<void>;
  setUserRole: (role: UserProfile['role']) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        // Fetch user profile
        const docRef = doc(db, 'users', currentUser.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setUserProfile(docSnap.data() as UserProfile);
        } else {
          setUserProfile(null); // Profile needs to be created
        }
      } else {
        setUserProfile(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const signIn = async () => {
    const provider = new GoogleAuthProvider();
    await signInWithPopup(auth, provider);
  };

  const logout = async () => {
    await signOut(auth);
  };

  const setUserRole = async (role: UserProfile['role']) => {
    if (!user) return;
    const profile: UserProfile = {
      uid: user.uid,
      email: user.email || '',
      displayName: user.displayName || '',
      role,
      stationId: 'default-station'
    };
    await setDoc(doc(db, 'users', user.uid), profile);
    setUserProfile(profile);
  };

  return (
    <AuthContext.Provider value={{ user, userProfile, loading, signIn, logout, setUserRole }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
