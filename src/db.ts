import Dexie, { type EntityTable } from 'dexie'
import type { Capture, DayPlan, Interruption, ResetPreferences, ResetSession, SyncChange, SyncSettings, Task } from './types'

export const db = new Dexie('SeraDayboard') as Dexie & {
  tasks: EntityTable<Task, 'id'>; captures: EntityTable<Capture, 'id'>;
  interruptions: EntityTable<Interruption, 'id'>; dayPlans: EntityTable<DayPlan, 'date'>;
  resetPreferences: EntityTable<ResetPreferences, 'id'>; resetSessions: EntityTable<ResetSession, 'id'>;
  syncChanges: EntityTable<SyncChange, 'id'>; syncSettings: EntityTable<SyncSettings, 'id'>
}
db.version(1).stores({ tasks: 'id,status,order', captures: 'id,createdAt,handled', interruptions: 'id,taskId,interruptedAt', dayPlans: 'date' })
db.version(2).stores({ tasks: 'id,status,order', captures: 'id,createdAt,handled', interruptions: 'id,taskId,interruptedAt', dayPlans: 'date', resetPreferences: 'id', resetSessions: 'id,taskId,startedAt' })
db.version(3).stores({ tasks: 'id,status,order', captures: 'id,createdAt,handled', interruptions: 'id,taskId,interruptedAt', dayPlans: 'date', resetPreferences: 'id', resetSessions: 'id,taskId,startedAt', syncChanges: 'id,entityType,entityId,changedAt', syncSettings: 'id' })
export const todayKey = () => new Date().toLocaleDateString('en-CA')
export const tomorrowKey = () => { const date = new Date(); date.setDate(date.getDate() + 1); return date.toLocaleDateString('en-CA') }
export const uid = () => crypto.randomUUID()

export async function markSyncChange(entityType: SyncChange['entityType'], entityId: string) {
  await db.syncChanges.add({ id: uid(), entityType, entityId, changedAt: new Date().toISOString() })
}

export async function seedDemo() {
  if (await db.tasks.count()) return
  const tasks: Task[] = [
    { id: uid(), title: 'Choose today’s main goal', category: 'Planning', status: 'planned', order: 0, priority: 'high', plannedStart: '09:00', estimatedMinutes: 15, notes: 'Write down one outcome that would make today feel useful.' },
    { id: uid(), title: 'Focus on one important task', category: 'Focus', status: 'planned', order: 1, priority: 'medium', plannedStart: '09:30', estimatedMinutes: 45, notes: '' },
    { id: uid(), title: 'Reply to two messages', category: 'Communication', status: 'planned', order: 2, priority: 'medium', plannedStart: '10:30', estimatedMinutes: 20, notes: '' },
    { id: uid(), title: 'Choose tomorrow’s first step', category: 'Planning', status: 'planned', order: 3, priority: 'low', plannedStart: '16:20', estimatedMinutes: 10, notes: '' }
  ]
  await db.transaction('rw', db.tasks, db.dayPlans, async () => { await db.tasks.bulkAdd(tasks); await db.dayPlans.add({ date: todayKey(), workWins: '', taskIds: tasks.map(t => t.id) }) })
}
