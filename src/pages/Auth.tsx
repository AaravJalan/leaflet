import { useState, type FormEvent } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { SetupBanner } from '../components/SetupBanner'
import { useAuth } from '../context/AuthContext'

export function Auth() {
  const { user, signIn, signUp, signInWithGoogle, configured } = useAuth()
  const navigate = useNavigate()
  const [mode, setMode] = useState<'signin' | 'signup'>('signin')
  const [displayName, setDisplayName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  if (user) return <Navigate to="/" replace />

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError('')
    try {
      if (mode === 'signup') {
        await signUp(email, password, displayName.trim() || email.split('@')[0])
      } else {
        await signIn(email, password)
      }
      navigate('/')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Authentication failed')
    } finally {
      setBusy(false)
    }
  }

  async function onGoogle() {
    setBusy(true)
    setError('')
    try {
      await signInWithGoogle()
      navigate('/')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Google sign-in failed')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="page page--narrow">
      <SetupBanner />
      <section className="panel auth-panel">
        <div className="auth-header">
          <h1>{mode === 'signin' ? 'Sign in' : 'Sign up'}</h1>
          <p className="lede">Organizers post. Neighbors follow.</p>
        </div>

        <div className="segmented segmented--full">
          <button
            type="button"
            className={mode === 'signin' ? 'is-active' : ''}
            onClick={() => setMode('signin')}
          >
            Sign in
          </button>
          <button
            type="button"
            className={mode === 'signup' ? 'is-active' : ''}
            onClick={() => setMode('signup')}
          >
            Sign up
          </button>
        </div>

        <button
          type="button"
          className="btn btn--google btn--block"
          disabled={busy || !configured}
          onClick={() => void onGoogle()}
        >
          Continue with Google
        </button>

        <div className="auth-divider">
          <span>or use email</span>
        </div>

        <form className="form" onSubmit={onSubmit}>
          {mode === 'signup' ? (
            <label>
              Display name
              <input
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Jordan"
                required
              />
            </label>
          ) : null}
          <label>
            Email
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </label>
          <label>
            Password
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
            />
          </label>
          {error ? <p className="error">{error}</p> : null}
          <button className="btn btn--block" type="submit" disabled={busy || !configured}>
            {busy ? 'Working…' : mode === 'signin' ? 'Sign in' : 'Create account'}
          </button>
        </form>

        <p className="auth-footer muted">
          Just browsing? <Link to="/browse">See organizations</Link>
        </p>
      </section>
    </div>
  )
}
