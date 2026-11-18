import type { CSSProperties } from 'react'
import { Link } from 'react-router-dom'
import { FeedbackBanner } from '../components/FeedbackBanner'
import { mockAnnouncements } from '../data/mock'
import { coverImage } from '../lib/images'
import { formatWhen } from '../lib/schedule'

/** Fan layout for the flyer stack: outer cards tilt more and land last. */
const FAN = [
  { rotate: -18, delay: 0.9, z: 1 },
  { rotate: -9, delay: 0.75, z: 2 },
  { rotate: 0, delay: 0.6, z: 3 },
  { rotate: 9, delay: 0.75, z: 2 },
  { rotate: 18, delay: 0.9, z: 1 },
]

export function Landing() {
  const flyers = mockAnnouncements().slice(0, FAN.length)

  return (
    <div className="landing">
      <FeedbackBanner />
      <header className="landing__nav">
        <Link to="/" className="brand landing__brand">
          <img className="brand__logo" src="/logo.png" alt="" />
          Leaflet
        </Link>
        <div className="landing__nav-actions">
          <Link to="/feed" className="landing__nav-link">
            Browse the feed
          </Link>
          <Link to="/auth" className="btn landing__pill landing__pill--sm">
            Sign in
          </Link>
        </div>
      </header>

      <section className="landing__hero">
        <p className="landing__eyebrow rise" style={{ '--d': '0.1s' } as CSSProperties}>
          For clubs, mutual aid, and neighborhood groups
        </p>
        <h1 className="landing__title rise" style={{ '--d': '0.2s' } as CSSProperties}>
          Post it once.
          <br />
          Let your <em>neighbors</em> find it.
        </h1>
        <p className="landing__sub rise" style={{ '--d': '0.38s' } as CSSProperties}>
          Leaflet is a public board for org announcements. Add a time, a place, and the details, then
          share one link.
        </p>
        <div className="landing__ctas rise" style={{ '--d': '0.52s' } as CSSProperties}>
          <Link to="/auth" className="btn landing__pill">
            Get started
          </Link>
          <Link to="/feed" className="btn btn--ghost landing__pill">
            See what's posted
          </Link>
        </div>

        <div className="flyers" aria-label="Recent announcements">
          {flyers.map((post, i) => {
            const fan = FAN[i]
            const when = formatWhen(post)
            return (
              <div
                key={post.id}
                className="flyer-slot"
                style={
                  {
                    '--i': i - 2,
                    '--rot': `${fan.rotate}deg`,
                    '--d': `${fan.delay}s`,
                    zIndex: fan.z,
                  } as CSSProperties
                }
              >
                <Link to={`/a/${post.id}`} className="flyer">
                  <span className="flyer__pin" aria-hidden="true" />
                  <img className="flyer__cover" src={coverImage(post, 400, 260)} alt="" loading="lazy" />
                  <span className="flyer__body">
                    <span className="flyer__org">{post.orgName}</span>
                    <span className="flyer__title">{post.title}</span>
                    {when ? <span className="flyer__meta">{when}</span> : null}
                    {post.location ? <span className="flyer__meta">{post.location}</span> : null}
                  </span>
                </Link>
              </div>
            )
          })}
        </div>
      </section>
    </div>
  )
}
