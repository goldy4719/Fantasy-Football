import type { League, Session } from '../types'
import { leaguesFor, newLeague } from '../store/leagues'

interface Props {
  session: Session
  leagues: League[]
  setLeagues: (fn: (prev: League[]) => League[]) => void
  onOpen: (id: string) => void
}

export default function Leagues({ session, leagues, setLeagues, onOpen }: Props) {
  const mine = leaguesFor(leagues, session.playerId)
  const isAdmin = session.role === 'admin'
  return (
    <section className="card wide">
      <h2>Leagues</h2>
      <p className="sub">
        Your player ID: <span className="pid">{session.playerId}</span>
        {!isAdmin && ' — give this to a league manager so they can add you.'}
      </p>
      {mine.length === 0 && <p className="sub empty">You have not been added to any leagues yet.</p>}
      {mine.map((l) => {
        const manager = l.adminId === session.playerId
        return (
          <div className="row" key={l.id}>
            <div className="grow">
              {l.name}
              <div className="sub">{l.id} &middot; {l.members.length} player{l.members.length === 1 ? '' : 's'}</div>
            </div>
            {manager && <span className="tag">Admin</span>}
            {manager && isAdmin
              ? <button className="cta small" onClick={() => onOpen(l.id)}>Manage</button>
              : <span className="sub">Member</span>}
          </div>
        )
      })}
      {isAdmin && (
        <button className="cta" onClick={() => setLeagues((p) => [...p, newLeague(session.playerId)])}>+ New League</button>
      )}
    </section>
  )
}
