import { useAuth } from '../context/AuthContext'

export function SetupBanner() {
  const { configured } = useAuth()
  if (configured) return null

  return (
    <div className="banner">
      Missing Firebase config. Copy <code>.env.example</code> to <code>.env</code> and restart.
    </div>
  )
}
