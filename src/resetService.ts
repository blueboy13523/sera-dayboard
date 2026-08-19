import { db, uid } from './db'
import type { ResetDuration, ResetPreferences, ResetSession } from './types'

export const defaultResetPreferences: ResetPreferences = {
  id: 'reset', preferredDuration: 1, audioChoice: 'none', ambientVolume: 0.35, cueVolume: 0.45
}

export async function getResetPreferences() {
  return (await db.resetPreferences.get('reset')) ?? defaultResetPreferences
}

export async function saveResetPreferences(preferences: ResetPreferences) {
  await db.resetPreferences.put(preferences)
}

export async function startResetSession(taskId: string | undefined, durationMinutes: ResetDuration) {
  const session: ResetSession = { id: uid(), taskId, startedAt: new Date().toISOString(), durationMinutes, completed: false, endedEarly: false }
  await db.resetSessions.add(session)
  return session
}

export async function finishResetSession(id: string, completed: boolean) {
  await db.resetSessions.update(id, { completed, endedEarly: !completed, endedAt: new Date().toISOString() })
}
