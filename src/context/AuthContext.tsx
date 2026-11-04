import {
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
  type User,
} from 'firebase/auth'
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { auth, isFirebaseConfigured } from '../lib/firebase'
import { getUserProfile, upsertUserProfile } from '../services/users'

type AuthContextValue = {
  user: User | null
  loading: boolean
  configured: boolean
  signUp: (email: string, password: string, displayName: string) => Promise<void>
  signIn: (email: string, password: string) => Promise<void>
  signInWithGoogle: () => Promise<void>
  logOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)
const googleProvider = new GoogleAuthProvider()

async function syncProfile(user: User) {
  const existing = await getUserProfile(user.uid)
  await upsertUserProfile({
    uid: user.uid,
    email: user.email || '',
    displayName: user.displayName || user.email?.split('@')[0] || 'User',
    createdAt: existing?.createdAt ?? Date.now(),
  })
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(isFirebaseConfigured)

  useEffect(() => {
    if (!auth) {
      setLoading(false)
      return
    }

    return onAuthStateChanged(auth, (next) => {
      setUser(next)
      setLoading(false)
    })
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading,
      configured: isFirebaseConfigured,
      async signUp(email, password, displayName) {
        if (!auth) throw new Error('Firebase is not configured.')
        const cred = await createUserWithEmailAndPassword(auth, email, password)
        await updateProfile(cred.user, { displayName })
        await syncProfile(cred.user)
      },
      async signIn(email, password) {
        if (!auth) throw new Error('Firebase is not configured.')
        await signInWithEmailAndPassword(auth, email, password)
      },
      async signInWithGoogle() {
        if (!auth) throw new Error('Firebase is not configured.')
        const cred = await signInWithPopup(auth, googleProvider)
        await syncProfile(cred.user)
      },
      async logOut() {
        if (!auth) throw new Error('Firebase is not configured.')
        await signOut(auth)
      },
    }),
    [user, loading],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
