// Browser-local stand-in for the backend. Swap these functions for API calls once the
// backend has league/member endpoints; the pages only talk to this module.
import { useEffect, useState } from 'react'
import type { League, Position, Session } from '../types'

export const POSITIONS: Position[] = ['QB', 'RB', 'WR', 'TE', 'K', 'DEF']
export const defaultMultipliers = (): Record<Position, number> => ({ QB: 1, RB: 1, WR: 1, TE: 1, K: 1, DEF: 1 })

function useLocalState<T>(key: string, initial: T) {
  const [value, setValue] = useState<T>(() => {
    try {
      const raw = localStorage.getItem(key)
      return raw ? (JSON.parse(raw) as T) : initial
    } catch {
      return initial
    }
  })
  useEffect(() => { localStorage.setItem(key, JSON.stringify(value)) }, [key, value])
  return [value, setValue] as const
}

const randomId = (prefix: string) =>
  prefix + '-' + Array.from({ length: 6 }, () => 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'[Math.floor(Math.random() * 32)]).join('')

// One stable player id per browser, created on first use.
export function getPlayerId(): string {
  let id = localStorage.getItem('uf.playerId')
  if (!id) { id = randomId('P'); localStorage.setItem('uf.playerId', id) }
  return id
}

export const useSession = () => useLocalState<Session | null>('uf.session', null)
export const useLeagues = () => useLocalState<League[]>('uf.leagues', [])
export const useCoach = () => useLocalState<string | null>('uf.coach', null)

export const newLeague = (adminId: string, name = 'My New League'): League => ({
  id: randomId('L'), name, adminId, members: [], multipliers: defaultMultipliers(),
})

// Leagues a user can see: ones they administer plus ones they were added to.
export const leaguesFor = (leagues: League[], playerId: string) =>
  leagues.filter((l) => l.adminId === playerId || l.members.includes(playerId))
