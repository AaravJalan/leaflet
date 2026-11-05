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
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { auth, isFirebaseConfigured } from '../lib/firebase'
import { getUserProfile, setAccountType as saveAccountType, upsertUserProfile } from '../services/users'
import type { AccountType, UserProfile } from '../types'

type AuthContextValue = {
  user: User | null
  profile: UserProfile | null
  loading: boolean
  configured: boolean
  signUp: (email: string, password: string, displayName: string) => Promise<void>
  signIn: (email: string, password: string) => Promise<void>
  signInWithGoogle: () => Promise<void>
  logOut: () => Promise<void>
  chooseAccountType: (type: AccountType) => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)
const googleProvider = new GoogleAuthProvider()

async function syncProfile(user: User) {
  const existing = await getUserProfile(user.uid)
  await upsertUserProfile({
    uid: user.uid,
    email: (user.email || existing?.email || '').toLowerCase(),
    displayName: user.displayName || existing?.displayName || user.email?.split('@')[0] || 'User',
    createdAt: existing?.createdAt ?? Date.now(),
  })
  return getUserProfile(user.uid)
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(isFirebaseConfigured)

  useEffect(() => {
    if (!auth) {
      setLoading(false)
      return
    }

    return onAuthStateChanged(auth, (next) => {
      setUser(next)
      if (!next) {
        setProfile(null)
        setLoading(false)
        return
      }
      void syncProfile(next)
        .then(setProfile)
        .catch(() => setProfile(null))
        .finally(() => setLoading(false))
    })
  }, [])

  const chooseAccountType = useCallback(
    async (type: AccountType) => {
      if (!user) throw new Error('Sign in first.')
      await saveAccountType(user.uid, type)
      setProfile((current) =>
        current
          ? { ...current, accountType: type }
          : {
              uid: user.uid,
              email: (user.email || '').toLowerCase(),
              displayName: user.displayName || user.email?.split('@')[0] || 'User',
              createdAt: Date.now(),
              accountType: type,
            },
      )
    },
    [user],
  )

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      profile,
      loading,
      configured: isFirebaseConfigured,
      async signUp(email, password, displayName) {
        if (!auth) throw new Error('Firebase is not configured.')
        const cred = await createUserWithEmailAndPassword(auth, email, password)
        await updateProfile(cred.user, { displayName })
        setProfile(await syncProfile(cred.user))
      },
      async signIn(email, password) {
        if (!auth) throw new Error('Firebase is not configured.')
        await signInWithEmailAndPassword(auth, email, password)
      },
      async signInWithGoogle() {
        if (!auth) throw new Error('Firebase is not configured.')
        const cred = await signInWithPopup(auth, googleProvider)
        setProfile(await syncProfile(cred.user))
      },
      async logOut() {
        if (!auth) throw new Error('Firebase is not configured.')
        await signOut(auth)
      },
      chooseAccountType,
    }),
    [user, profile, loading, chooseAccountType],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
