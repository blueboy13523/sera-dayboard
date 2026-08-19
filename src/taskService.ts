import { db, markSyncChange, todayKey, uid } from './db'
import type { Capture, Priority, Task } from './types'

export async function orderedTasks() { const plan = await db.dayPlans.get(todayKey()); if (!plan) return db.tasks.orderBy('order').toArray(); const tasks = await db.tasks.bulkGet(plan.taskIds); return tasks.filter((task): task is Task => Boolean(task)).sort((a, b) => a.order - b.order) }
export async function startTask(id: string) { await db.tasks.update(id, { status: 'active', actualStart: new Date().toISOString() }); await markSyncChange('task', id) }
export async function nextAvailable(exclude?: string) { return (await orderedTasks()).find(t => t.id !== exclude && t.status === 'planned') }
export async function completeTask(task: Task) {
  let nextId: string | undefined
  await db.transaction('rw', db.tasks, db.dayPlans, async () => {
    await db.tasks.update(task.id, { status: 'completed', actualEnd: new Date().toISOString() })
    const next = await nextAvailable(task.id); if (next) { nextId = next.id; await db.tasks.update(next.id, { status: 'active', actualStart: next.actualStart ?? new Date().toISOString() }) }
  })
  await markSyncChange('task', task.id); if (nextId) await markSyncChange('task', nextId)
}
export async function interruptTask(task: Task, note?: string) {
  const interruptionId = uid(); await db.transaction('rw', db.tasks, db.interruptions, async () => { await db.tasks.update(task.id, { status: 'interrupted' }); await db.interruptions.add({ id: interruptionId, taskId: task.id, interruptedAt: new Date().toISOString(), note }) }); await markSyncChange('task', task.id); await markSyncChange('interruption', interruptionId)
}
export async function resumeTask(task: Task) {
  const item = await db.interruptions.where('taskId').equals(task.id).reverse().first()
  await db.transaction('rw', db.tasks, db.interruptions, async () => { await db.tasks.update(task.id, { status: 'active' }); if (item) await db.interruptions.update(item.id, { resumedAt: new Date().toISOString() }) })
  await markSyncChange('task', task.id); if (item) await markSyncChange('interruption', item.id)
}
export async function blockTask(task: Task, note?: string) {
  let nextId: string | undefined; await db.transaction('rw', db.tasks, db.dayPlans, async () => { await db.tasks.update(task.id, { status: 'blocked', notes: note ? [task.notes, `Blocker: ${note}`].filter(Boolean).join('\n') : task.notes }); const next = await nextAvailable(task.id); if (next) { nextId = next.id; await db.tasks.update(next.id, { status: 'active', actualStart: next.actualStart ?? new Date().toISOString() }) } }); await markSyncChange('task', task.id); if (nextId) await markSyncChange('task', nextId)
}
export async function addCapture(text: string): Promise<Capture> { const capture = { id: uid(), text, createdAt: new Date().toISOString(), handled: false }; await db.captures.add(capture); await markSyncChange('capture', capture.id); return capture }
export async function createTask(data: { title: string; category: string; priority: Priority; estimatedMinutes: number; plannedStart?: string; notes?: string }) {
  const all = await orderedTasks(); const task: Task = { id: uid(), status: 'planned', order: all.length, notes: data.notes ?? '', plannedDate: todayKey(), ...data }; await db.tasks.add(task)
  const day = await db.dayPlans.get(todayKey()); await db.dayPlans.put({ date: todayKey(), workWins: day?.workWins ?? '', taskIds: [...(day?.taskIds ?? []), task.id] }); await markSyncChange('task', task.id); await markSyncChange('dayPlan', todayKey()); return task
}
