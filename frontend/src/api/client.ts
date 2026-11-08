// Thin wrapper around the Flask API (see backend/app/routes). Requests go through the Vite proxy.
// With ALLOW_AUTH_BYPASS=true on the backend, no auth header is needed. Add a Bearer token here later.
import type { ApiError, CurrentMatchup, Stadium, TriviaQuestion, TriviaResult, UpgradeType } from '../types'

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch('/api/v1' + path, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  })
  const body = await res.json().catch(() => ({}))
  if (!res.ok) throw Object.assign(new Error(body.error || body.message || res.statusText), { status: res.status, body }) as ApiError
  return body
}

export const getCurrentMatchup = () => request<CurrentMatchup>('/matchups/current')
export const getStadium = (teamId: string) => request<Stadium>(`/teams/${teamId}/stadium`)
export const upgradeStadium = (teamId: string, upgrade_type: UpgradeType = 'TURF', points_to_spend = 25) =>
  request<unknown>(`/teams/${teamId}/stadium/upgrade`, { method: 'POST', body: JSON.stringify({ upgrade_type, points_to_spend }) })
export const getTriviaQuestion = () => request<TriviaQuestion>('/trivia/question')
export const submitTrivia = (question_id: number, selected_option_index: number) =>
  request<TriviaResult>('/trivia/submit', { method: 'POST', body: JSON.stringify({ question_id, selected_option_index }) })
