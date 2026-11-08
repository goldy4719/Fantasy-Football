import type { CoachTrait } from '../types'

// Hardcoded coach traits and their multipliers.
export const COACH_TRAITS: CoachTrait[] = [
  { id: 'running', name: 'Running Coach', blurb: 'Ground-and-pound. Boosts all running back points.', multiplier: 1.35, positions: ['RB'] },
  { id: 'receiver', name: 'Receiver Coach', blurb: 'Air it out. Boosts all receiver stats.', multiplier: 1.15, positions: ['WR', 'TE'] },
  { id: 'qb', name: 'QB Coach', blurb: 'Quarterback whisperer. Doubles all QB points.', multiplier: 2, positions: ['QB'] },
]
