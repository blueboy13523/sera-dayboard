import { db, todayKey, uid } from './db'
import type { Capture, Priority, Task } from './types'

export async function orderedTasks() { return db.tasks.orderBy('order').toArray() }
export async function startTask(id: string) { await db.tasks.update(id, { status: 'active', actualStart: new Date().toISOString() }) }
export async function nextAvailable(exclude?: string) { return (await orderedTasks()).find(t => t.id !== exclude && t.status === 'planned') }
export async function completeTask(task: Task) {
  await db.transaction('rw', db.tasks, async () => {
    await db.tasks.update(task.id, { status: 'completed', actualEnd: new Date().toISOString() })
    const next = await nextAvailable(task.id); if (next) await db.tasks.update(next.id, { status: 'active', actualStart: next.actualStart ?? new Date().toISOString() })
  })
}
export async function interruptTask(task: Task, note?: string) {
  await db.transaction('rw', db.tasks, db.interruptions, async () => { await db.tasks.update(task.id, { status: 'interrupted' }); await db.interruptions.add({ id: uid(), taskId: task.id, interruptedAt: new Date().toISOString(), note }) })
}
export async function resumeTask(task: Task) {
  const item = await db.interruptions.where('taskId').equals(task.id).reverse().first()
  await db.transaction('rw', db.tasks, db.interruptions, async () => { await db.tasks.update(task.id, { status: 'active' }); if (item) await db.interruptions.update(item.id, { resumedAt: new Date().toISOString() }) })
}
export async function blockTask(task: Task, note?: string) {
  await db.transaction('rw', db.tasks, async () => { await db.tasks.update(task.id, { status: 'blocked', notes: note ? [task.notes, `Blocker: ${note}`].filter(Boolean).join('\n') : task.notes }); const next = await nextAvailable(task.id); if (next) await db.tasks.update(next.id, { status: 'active', actualStart: next.actualStart ?? new Date().toISOString() }) })
}
export async function addCapture(text: string): Promise<Capture> { const capture = { id: uid(), text, createdAt: new Date().toISOString(), handled: false }; await db.captures.add(capture); return capture }
export async function createTask(data: { title: string; category: string; priority: Priority; estimatedMinutes: number; plannedStart?: string; notes?: string }) {
  const all = await orderedTasks(); const task: Task = { id: uid(), status: 'planned', order: all.length, notes: data.notes ?? '', ...data }; await db.tasks.add(task)
  const day = await db.dayPlans.get(todayKey()); await db.dayPlans.put({ date: todayKey(), workWins: day?.workWins ?? '', taskIds: [...(day?.taskIds ?? []), task.id] }); return task
}
