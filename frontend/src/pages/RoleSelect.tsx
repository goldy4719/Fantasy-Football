import type { Role } from '../types'

export default function RoleSelect({ onPick }: { onPick: (role: Role) => void }) {
  return (
    <div className="login">
      <div className="role-box">
        <div className="brand big">ULTIMATE <span>FANTASY</span></div>
        <h2>How do you want to play?</h2>
        <div className="role-grid">
          <button className="role-card" onClick={() => onPick('player')}>
            <strong>Player</strong>
            <span className="sub">Get a player ID and join leagues you are invited to.</span>
          </button>
          <button className="role-card" onClick={() => onPick('admin')}>
            <strong>League Manager</strong>
            <span className="sub">Create and run a league: add or kick players and tune multipliers.</span>
          </button>
        </div>
      </div>
    </div>
  )
}
