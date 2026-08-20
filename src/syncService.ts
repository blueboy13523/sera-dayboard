import { db, markSyncChange, todayKey, tomorrowKey } from './db'
import type { DayPlan, SyncSettings, Task } from './types'
import { plansForWeek } from './weekService'

export const defaultSyncSettings: SyncSettings = { id: 'sera', endpoint: '', token: '' }
export const getSyncSettings = async () => (await db.syncSettings.get('sera')) ?? defaultSyncSettings
export const saveSyncSettings = async (settings: SyncSettings) => db.syncSettings.put(settings)

export async function buildSyncPayload() {
  const today = await db.dayPlans.get(todayKey()); const tomorrow = await db.dayPlans.get(tomorrowKey()); const weekPlans = await plansForWeek()
  const taskIds = new Set([...(today?.taskIds ?? []), ...(tomorrow?.taskIds ?? []), ...weekPlans.flatMap(plan=>plan.taskIds)])
  const tasks = (await db.tasks.bulkGet([...taskIds])).filter((task): task is Task => Boolean(task))
  const interruptions = taskIds.size ? await db.interruptions.where('taskId').anyOf([...taskIds]).toArray() : []
  const start = `${todayKey()}T00:00:00`; const end = `${tomorrowKey()}T23:59:59`
  const captures = (await db.captures.toArray()).filter(item => item.createdAt >= start && item.createdAt <= end)
  const resets = (await db.resetSessions.toArray()).filter(item => item.startedAt >= start && item.startedAt <= end)
  return { schemaVersion: 2, clientId: 'sera-dayboard-tablet', sentAt: new Date().toISOString(), today, tomorrow, weekPlans, tasks, captures, interruptions, resets, endOfDayNote: today?.endOfDayNote ?? '' }
}

export async function syncHome(settings: SyncSettings) {
  const controller = new AbortController(); const timeout = window.setTimeout(() => controller.abort(), 12000)
  try {
    const response = await fetch(`${settings.endpoint.replace(/\/$/, '')}/api/sync`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${settings.token}` }, body: JSON.stringify(await buildSyncPayload()), signal: controller.signal })
    if (!response.ok) throw new Error(`Sera returned ${response.status}`)
    const result = await response.json() as { syncedAt?: string; dayPlan?: DayPlan; weekPlans?: DayPlan[]; tasks?: Task[] }
    await db.transaction('rw', db.tasks, db.dayPlans, db.syncChanges, db.syncSettings, async () => {
      if (result.tasks?.length) await db.tasks.bulkPut(result.tasks)
      if (result.dayPlan) await db.dayPlans.put(result.dayPlan)
      if (result.weekPlans?.length) await db.dayPlans.bulkPut(result.weekPlans)
      await db.syncChanges.clear()
      await db.syncSettings.put({ ...settings, lastReachable: true, lastSuccessfulSync: result.syncedAt ?? new Date().toISOString() })
    })
    return result
  } catch (error) {
    await db.syncSettings.put({ ...settings, lastReachable: false })
    throw error
  } finally { clearTimeout(timeout) }
}

export async function saveTomorrowPlan(note: string) {
  const today = await db.dayPlans.get(todayKey())
  await db.dayPlans.put({ date: todayKey(), workWins: today?.workWins ?? '', taskIds: today?.taskIds ?? [], endOfDayNote: note, savedAt: new Date().toISOString() })
  await markSyncChange('dayPlan', todayKey())
}
