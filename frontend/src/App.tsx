import type React from 'react'
import { useState, useEffect } from 'react'
import { schedule } from './data'
import { getCurrentMatchup, getStadium, upgradeStadium, getTriviaQuestion, submitTrivia } from './api/client'
import type { ApiError, MatchupTeam, TriviaResult, League, Role } from './types'
import { useSession, useLeagues, useCoach, getPlayerId, newLeague } from './store/leagues'
import RoleSelect from './pages/RoleSelect'
import Leagues from './pages/Leagues'
import LeagueManager from './pages/LeagueManager'
import CoachHome from './pages/CoachHome'

// Small hook: load once, expose { data, error, loading, reload }.
function useApi<T>(fn: () => Promise<T>, deps: unknown[] = []) {
  const [state, setState] = useState<{ data: T | null; error: Error | null; loading: boolean }>({ data: null, error: null, loading: true })
  const [tick, setTick] = useState(0)
  useEffect(() => {
    let live = true
    setState((s) => ({ ...s, loading: true }))
    fn().then((data) => live && setState({ data, error: null, loading: false }))
        .catch((error) => live && setState({ data: null, error, loading: false }))
    return () => { live = false }
  }, [...deps, tick])
  return { ...state, reload: () => setTick((t) => t + 1) }
}

const Status = ({ loading, error }: { loading: boolean; error: Error | null }) =>
  loading ? <p className="sub">Loading…</p> : error ? <p className="sub">Error: {error.message}</p> : null

// Matches the backend's current week; falls back to the schedule's first entry.
let currentWeek = schedule[0].week


function TeamPanel({ team, side }: { team: MatchupTeam; side: 'left' | 'right' }) {
  return (
    <section className={'team ' + side}>
      <div className="team-head">
        <div className="logo">{team.name[0]}</div>
        <div>
          <h2>{team.name}</h2>
        </div>
        <div className="total">{Number(team.score ?? 0).toFixed(1)}</div>
      </div>
      <ul className="players">
        {team.roster.map((p) => (
          <li key={p.id}>
            <span className="pos">{p.position}</span>
            <span className="pname">{p.player_name}<small>{p.college}</small></span>
            <span className="pts">{p.final_score}</span>
          </li>
        ))}
      </ul>
    </section>
  )
}

function MyTeam() {
  const { data, error, loading } = useApi(getCurrentMatchup)
  if (!data) return <Status loading={loading} error={error} />
  currentWeek = data.week
  return (
    <>
      <div className="banner">Week {data.week} Matchup</div>
      <div className="split">
        <TeamPanel team={data.home_team} side="left" />
        <div className="vs">VS</div>
        <TeamPanel team={data.away_team} side="right" />
      </div>
    </>
  )
}

function Schedule() {
  return (
    <section className="card">
      <h2>Upcoming Schedule</h2>
      {schedule.map((s) => (
        <div className={'row' + (s.week === currentWeek ? ' now' : '')} key={s.week}>
          <span className="wk">Week {s.week}</span>
          <span className="grow">vs {s.opp}</span>
          <span className="sub">{s.date}</span>
        </div>
      ))}
    </section>
  )
}

function Trivia() {
  const { data: q, error, loading } = useApi(getTriviaQuestion)
  const [result, setResult] = useState<TriviaResult | null>(null)
  const [err, setErr] = useState<string | null>(null)
  if (!q) return <section className="card"><h2>Daily Trivia</h2><Status loading={loading} error={error} /></section>
  const answer = (i: number) =>
    submitTrivia(q.id, i).then(setResult).catch((e: ApiError) => setErr(e.body?.error || e.message))
  return (
    <section className="card">
      <h2>Daily Trivia</h2>
      <p>{q.question}</p>
      <div className="options">
        {q.options.map((o, i) => (
          <button key={o} disabled={!!result}
            className={result ? (i === result.correct_option_index ? 'active' : '') : ''}
            onClick={() => answer(i)}>{o}</button>
        ))}
      </div>
      {result && <p className="sub">{result.is_correct ? `Correct! +${result.points_awarded} upgrade points.` : 'Not quite.'}</p>}
      {err && <p className="sub">{err}</p>}
      <p className="sub">Correct answers earn {q.points_reward} upgrade points.</p>
    </section>
  )
}

function Stadium() {
  // The backend has no "my team" endpoint yet, so use the home team of the current matchup.
  const { data: m, error: e1, loading: l1 } = useApi(getCurrentMatchup)
  const teamId = m?.home_team.id
  const { data: st, error: e2, loading: l2, reload } = useApi(() => (teamId ? getStadium(teamId) : Promise.resolve(null)), [teamId])
  const [msg, setMsg] = useState<string | null>(null)
  if (!st) return <section className="card"><h2>Home Stadium</h2><Status loading={l1 || l2} error={e1 || e2} /></section>
  const meters: [string, number][] = [
    ['Stadium Condition', st.stadium_quality],
    ['Player Attrition', Math.round(st.player_attrition * 100)],
  ]
  const upgrade = () =>
    upgradeStadium(teamId!, 'MEDICAL').then(() => { setMsg(null); reload() }).catch((e: ApiError) => setMsg(e.body?.error || e.message))
  return (
    <section className="card">
      <h2>{st.stadium_name}</h2>
      {meters.map(([label, v]) => (
        <div className="meter" key={label}>
          <div className="meter-label"><span>{label}</span><span>{v}%</span></div>
          <div className="bar"><div style={{ width: v + '%' }} /></div>
        </div>
      ))}
      <button className="cta" onClick={upgrade}>Upgrade Training Facility (25 pts)</button>
      {msg && <p className="sub">{msg}</p>}
      <p className="sub">Upgrade points: {st.upgrade_points}. A better training facility keeps players from declining over the season.</p>
    </section>
  )
}

function Login({ onLogin }: { onLogin: () => void }) {
  return (
    <div className="login">
      <form onSubmit={(e) => { e.preventDefault(); onLogin() }}>
        <div className="brand big">ULTIMATE <span>FANTASY</span></div>
        <input placeholder="Username" defaultValue="epayne" />
        <input placeholder="Password" type="password" defaultValue="password" />
        <button className="cta" type="submit">Sign In</button>
      </form>
    </div>
  )
}

const pages: Record<string, () => React.JSX.Element> = { 'My Team': MyTeam, Schedule, Trivia, Stadium }

export default function App() {
  const [loggedIn, setLoggedIn] = useState(false)
  const [session, setSession] = useSession()
  const [leagues, setLeagues] = useLeagues()
  const [coach, setCoach] = useCoach()
  const [page, setPage] = useState('Leagues')
  const [managing, setManaging] = useState<string | null>(null)

  if (!loggedIn) return <Login onLogin={() => setLoggedIn(true)} />

  const pickRole = (role: Role) => {
    const playerId = getPlayerId()
    setSession({ role, playerId })
    // A new league manager starts with an empty league they administer.
    if (role === 'admin' && !leagues.some((l) => l.adminId === playerId)) {
      setLeagues((prev) => [...prev, newLeague(playerId)])
    }
    setPage('Leagues')
  }
  if (!session) return <RoleSelect onPick={pickRole} />

  const signOut = () => { setSession(null); setLoggedIn(false); setManaging(null) }
  const league = leagues.find((l) => l.id === managing && l.adminId === session.playerId)
  const updateLeague = (fn: (l: League) => League) =>
    setLeagues((prev) => prev.map((l) => (l.id === managing ? fn(l) : l)))
  const tabs = ['Home', ...Object.keys(pages), 'Leagues']
  const Page = pages[page]

  return (
    <div className="app">
      <header>
        <div className="brand">ULTIMATE <span>FANTASY</span></div>
        <nav>
          {tabs.map((p) => (
            <button key={p} className={p === page ? 'active' : ''} onClick={() => { setPage(p); setManaging(null) }}>{p}</button>
          ))}
        </nav>
        <button className="logout" onClick={signOut}>Sign Out</button>
      </header>
      <main>
        {page === 'Home' && <CoachHome coach={coach} setCoach={setCoach} />}
        {page === 'Leagues' && (league
          ? <LeagueManager league={league} update={updateLeague} onBack={() => setManaging(null)} />
          : <Leagues session={session} leagues={leagues} setLeagues={setLeagues} onOpen={setManaging} />)}
        {Page && <Page />}
      </main>
    </div>
  )
}
