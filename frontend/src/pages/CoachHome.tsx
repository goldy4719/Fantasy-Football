import { COACH_TRAITS } from '../store/coachTraits'

export default function CoachHome({ coach, setCoach }: { coach: string | null; setCoach: (id: string) => void }) {
  const active = COACH_TRAITS.find((c) => c.id === coach)
  return (
    <>
      <div className="banner">Choose Your Coach</div>
      <div className="coach-grid">
        {COACH_TRAITS.map((c) => (
          <button key={c.id} className={'coach-card' + (c.id === coach ? ' active' : '')} onClick={() => setCoach(c.id)}>
            <span className="mult">{c.multiplier}x</span>
            <strong>{c.name}</strong>
            <span className="sub">{c.blurb}</span>
            <span className="tag">{c.positions.join(' / ')}</span>
          </button>
        ))}
      </div>
      <p className="sub center">
        {active
          ? `Active trait: ${active.name} — ${active.multiplier}x on ${active.positions.join(' / ')} points.`
          : 'Pick a trait to set your coach.'}
      </p>
    </>
  )
}
