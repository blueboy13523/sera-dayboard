import { db, markSyncChange, uid } from './db'
import type { DayPlan, Task } from './types'
import type { TaskFormData } from './components/TaskForm'

export function dateKey(date: Date) { return date.toLocaleDateString('en-CA') }
export function parseDateKey(key: string) { const [year, month, day] = key.split('-').map(Number); return new Date(year, month - 1, day) }
export function startOfWeek(date = new Date()) { const result = new Date(date.getFullYear(), date.getMonth(), date.getDate()); const day = result.getDay() || 7; result.setDate(result.getDate() - day + 1); return result }
export function weekDates(anchor = new Date()) { const start = startOfWeek(anchor); return Array.from({ length: 7 }, (_, index) => { const date = new Date(start); date.setDate(start.getDate() + index); return date }) }

async function putPlan(date: string, taskIds: string[]) {
  const plan = await db.dayPlans.get(date)
  await db.dayPlans.put({ date, workWins: plan?.workWins ?? '', taskIds, endOfDayNote: plan?.endOfDayNote, savedAt: plan?.savedAt })
  await markSyncChange('dayPlan', date)
}
export async function tasksForDate(date: string) { const plan = await db.dayPlans.get(date); if (!plan) return []; const tasks = await db.tasks.bulkGet(plan.taskIds); return tasks.filter((task): task is Task => Boolean(task)).sort((a,b)=>a.order-b.order) }
export async function createWeeklyTask(date: string, data: TaskFormData) { const tasks = await tasksForDate(date); const task: Task = { id: uid(), ...data, notes: data.notes ?? '', plannedDate: date, status: 'planned', order: tasks.length, majorObjective: data.majorObjective ?? false }; await db.tasks.add(task); const plan = await db.dayPlans.get(date); await putPlan(date, [...(plan?.taskIds ?? []), task.id]); await markSyncChange('task', task.id); return task }
export async function updateWeeklyTask(id: string, data: TaskFormData) { await db.tasks.update(id, data); await markSyncChange('task', id) }
export async function deleteWeeklyTask(task: Task) { const date = task.plannedDate; await db.tasks.delete(task.id); if (date) { const plan = await db.dayPlans.get(date); if (plan) await putPlan(date, plan.taskIds.filter(id => id !== task.id)) } await markSyncChange('task', task.id) }
export async function moveTaskToDate(task: Task, targetDate: string) { const sourceDate = task.plannedDate; if (sourceDate === targetDate) return; if (sourceDate) { const source = await db.dayPlans.get(sourceDate); if (source) await putPlan(sourceDate, source.taskIds.filter(id => id !== task.id)) } const targetTasks = await tasksForDate(targetDate); const target = await db.dayPlans.get(targetDate); await putPlan(targetDate, [...(target?.taskIds ?? []), task.id]); await db.tasks.update(task.id, { plannedDate: targetDate, order: targetTasks.length }); await markSyncChange('task', task.id) }
export async function reorderWeeklyTask(date: string, task: Task, delta: number) { const tasks = await tasksForDate(date); const index = tasks.findIndex(item => item.id === task.id); const current = tasks[index], other = tasks[index + delta]; if (!current || !other) return; await db.transaction('rw', db.tasks, async () => { await db.tasks.update(current.id, { order: other.order }); await db.tasks.update(other.id, { order: current.order }) }); await markSyncChange('task', current.id); await markSyncChange('task', other.id) }
export async function plansForWeek(anchor = new Date()): Promise<DayPlan[]> { return (await db.dayPlans.bulkGet(weekDates(anchor).map(dateKey))).filter((plan): plan is DayPlan => Boolean(plan)) }
