import { useState } from 'react'
import type { League, Position } from '../types'
import { POSITIONS } from '../store/leagues'

interface Props {
  league: League
  update: (fn: (l: League) => League) => void
  onBack: () => void
}

const ID_RE = /^P-[A-Z0-9]{6}$/

export default function LeagueManager({ league, update, onBack }: Props) {
  const [pid, setPid] = useState('')
  const [err, setErr] = useState<string | null>(null)

  const add = (e: React.FormEvent) => {
    e.preventDefault()
    const id = pid.trim().toUpperCase()
    if (!ID_RE.test(id)) return setErr('Player IDs look like P-ABC123.')
    if (id === league.adminId) return setErr('You already manage this league.')
    if (league.members.includes(id)) return setErr('That player is already in the league.')
    update((l) => ({ ...l, members: [...l.members, id] }))
    setPid(''); setErr(null)
  }
  const setMult = (pos: Position, v: number) =>
    update((l) => ({ ...l, multipliers: { ...l.multipliers, [pos]: Number.isFinite(v) ? Math.min(5, Math.max(0, v)) : 1 } }))

  return (
    <section className="card wide">
      <button className="logout" onClick={onBack}>&larr; Back to leagues</button>
      <h2 className="mgr-title">League Manager</h2>
      <label className="field">League name
        <input value={league.name} onChange={(e) => update((l) => ({ ...l, name: e.target.value }))} />
      </label>

      <h3>Players ({league.members.length})</h3>
      <form className="inline" onSubmit={add}>
        <input placeholder="Add player by ID, e.g. P-ABC123" value={pid} onChange={(e) => setPid(e.target.value)} />
        <button className="cta small" type="submit">Add</button>
      </form>
      {err && <p className="sub err">{err}</p>}
      {league.members.length === 0 && <p className="sub empty">No players yet.</p>}
      {league.members.map((m) => (
        <div className="row" key={m}>
          <span className="grow pid">{m}</span>
          <button className="logout" onClick={() => update((l) => ({ ...l, members: l.members.filter((x) => x !== m) }))}>Kick</button>
        </div>
      ))}

      <h3>Scoring multipliers</h3>
      <p className="sub">Applied league-wide per position. 1.00 = normal scoring.</p>
      <div className="mult-grid">
        {POSITIONS.map((p) => (
          <label className="field" key={p}>{p}
            <input type="number" step={0.05} min={0} max={5} value={league.multipliers[p]}
              onChange={(e) => setMult(p, parseFloat(e.target.value))} />
          </label>
        ))}
      </div>
    </section>
  )
}
