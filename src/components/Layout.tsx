import { Link, NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export function Layout() {
  const { user, logOut, configured } = useAuth()

  return (
    <div className="shell">
      <header className="topbar">
        <Link to="/" className="brand">
          Leaflet
        </Link>
        <nav className="nav">
          <NavLink to="/" end>
            Feed
          </NavLink>
          <NavLink to="/browse">Browse</NavLink>
          {user ? <NavLink to="/me">My orgs</NavLink> : null}
        </nav>
        <div className="topbar__actions">
          {!configured ? <span className="setup-chip">Missing .env</span> : null}
          {user ? (
            <>
              <span className="user-chip">{user.displayName || user.email}</span>
              <button type="button" className="btn btn--ghost" onClick={() => void logOut()}>
                Log out
              </button>
              <Link className="btn" to="/orgs/new">
                Post
              </Link>
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
      <footer className="footer">
        <p>Share one link. Skip the mailing-list mess.</p>
      </footer>
    </div>
  )
}
