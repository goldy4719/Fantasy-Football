// Shapes returned by the Flask API (backend/app/routes, models.py).
export interface RosterEntry {
  id: number | string
  player_id: string
  player_name: string | null
  position: string | null
  college: string | null
  starter: boolean
  base_score: number
  multiplier: number
  final_score: number
}

export interface MatchupTeam {
  id: string
  name: string
  score: number
  roster: RosterEntry[]
}

export interface CurrentMatchup {
  matchup_id: string
  week: number
  season: number
  status: string
  home_team: MatchupTeam
  away_team: MatchupTeam
}

export interface Stadium {
  team_id: string
  team_name: string
  upgrade_points: number
  stadium_name: string
  stadium_quality: number
  player_attrition: number
}

export type UpgradeType = 'TURF' | 'MEDICAL' | 'FACILITIES'

export interface TriviaQuestion {
  id: number
  question: string
  options: string[]
  points_reward: number
}

export interface TriviaResult {
  is_correct: boolean
  points_awarded: number
  correct_option_index: number
}

export interface ApiError extends Error {
  status: number
  body: { error?: string; message?: string }
}

// ---- Leagues / roles / coach traits (frontend-only for now; no backend endpoints yet) ----
export type Role = 'player' | 'admin'
export type Position = 'QB' | 'RB' | 'WR' | 'TE' | 'K' | 'DEF'

export interface Session {
  role: Role
  playerId: string
}

export interface League {
  id: string
  name: string
  adminId: string
  members: string[] // player ids (does not include the admin unless added)
  multipliers: Record<Position, number> // league-wide scoring multipliers
}

export interface CoachTrait {
  id: 'running' | 'receiver' | 'qb'
  name: string
  blurb: string
  multiplier: number
  positions: Position[] // positions the multiplier applies to
}
