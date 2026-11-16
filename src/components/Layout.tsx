import { Link, NavLink, Outlet } from 'react-router-dom'
import { useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { useDemo } from '../context/DemoContext'
import { listSubscriptions } from '../services/subscriptions'

export function Layout() {
  const { user, profile, logOut, configured } = useAuth()
  const demo = useDemo()

  useEffect(() => {
    if (!user) return
    void listSubscriptions(user.uid)
      .then((subs) => {
        for (const sub of subs) demo.setFollowing(sub.orgId, true)
      })
      .catch(() => {
        // Sample follows still work if this read is blocked.
      })
    // Only when the signed-in user changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  return (
    <div className="shell">
      <header className="topbar">
        <Link to="/" className="brand">
          <img className="brand__logo" src="/logo.png" alt="" />
          Leaflet
        </Link>
        <nav className="nav">
          <NavLink to="/" end>
            Feed
          </NavLink>
          <NavLink to="/orgs">Orgs</NavLink>
        </nav>
        <nav className="nav nav--end">
          <NavLink to="/account">Home</NavLink>
        </nav>
        <div className="topbar__actions">
          {!configured ? <span className="setup-chip">Missing .env</span> : null}
          {user ? (
            <>
              <Link className="user-chip" to="/settings">
                {profile?.accountType ? profile.displayName || user.email : 'Set account type'}
              </Link>
              <button type="button" className="btn btn--ghost" onClick={() => void logOut()}>
                Log out
              </button>
            </>
          ) : (
            <Link className="btn" to="/auth">
              Sign in
            </Link>
          )}
        </div>
      </header>
      <main className="main">
        <Outlet />
      </main>
    </div>
  )
}
