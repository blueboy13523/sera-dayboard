import 'fake-indexeddb/auto'
import { beforeEach, describe, expect, it } from 'vitest'
import { db, migrateV03Data } from './db'
import { addCapture, completeTask, createTask, interruptTask, resumeTask, startTask } from './taskService'
import { finishResetSession, saveResetPreferences, startResetSession } from './resetService'
import { completionMessage } from './completionService'
import { createWeeklyTask, dateKey, moveTaskToDate, reorderWeeklyTask, tasksForDate, weekDates } from './weekService'
import type { Task } from './types'

describe('core day flow', () => {
  beforeEach(async () => { await db.delete(); await db.open() })
  it('starts, interrupts, resumes, completes, advances, and captures without changing NOW', async () => {
    const first = await createTask({ title: 'First', category: 'Focus', priority: 'high', estimatedMinutes: 20 })
    const second = await createTask({ title: 'Second', category: 'Admin', priority: 'medium', estimatedMinutes: 10 })
    await startTask(first.id); let current = (await db.tasks.get(first.id))!; expect(current.actualStart).toBeTruthy()
    await interruptTask(current, 'Doorbell'); current = (await db.tasks.get(first.id))!; expect(current.status).toBe('interrupted')
    await resumeTask(current); current = (await db.tasks.get(first.id))!; expect(current.status).toBe('active'); expect((await db.interruptions.toArray())[0].resumedAt).toBeTruthy()
    await completeTask(current); expect((await db.tasks.get(first.id))?.status).toBe('completed'); expect((await db.tasks.get(second.id))?.status).toBe('active')
    await addCapture('Remember the invoice'); expect((await db.tasks.get(second.id))?.status).toBe('active'); expect(await db.captures.count()).toBe(1)
    db.close()
    await db.open()
    expect((await db.tasks.get(second.id))?.status).toBe('active')
    expect((await db.captures.toArray())[0].text).toBe('Remember the invoice')
  })
  it('records a reset without changing the active task', async () => {
    const task = await createTask({ title: 'Original task', category: 'Focus', priority: 'high', estimatedMinutes: 25 })
    await startTask(task.id)
    const before = (await db.tasks.get(task.id))!
    await saveResetPreferences({ id: 'reset', preferredDuration: 3, audioChoice: 'ambient-cues', ambientVolume: .3, cueVolume: .4 })
    const reset = await startResetSession(task.id, 3)
    await finishResetSession(reset.id, true)
    const after = (await db.tasks.get(task.id))!
    expect(after).toEqual(before)
    expect((await db.resetSessions.get(reset.id))?.completed).toBe(true)
    expect((await db.resetPreferences.get('reset'))?.preferredDuration).toBe(3)
  })
  it('keeps a seven-day plan after moving, reordering, and reopening', async () => {
    const [mon,,wed,thu,,,sun] = weekDates(new Date(2026,7,19)); const saturday=weekDates(new Date(2026,7,19))[5]
    const data=(title:string)=>({title,category:'Personal',priority:'medium' as const,estimatedMinutes:20,notes:'',majorObjective:false})
    await createWeeklyTask(dateKey(mon),data('Monday task')); const moved=await createWeeklyTask(dateKey(wed),data('Move me')); await createWeeklyTask(dateKey(saturday),data('Saturday task')); await createWeeklyTask(dateKey(sun),data('Sunday task')); const existing=await createWeeklyTask(dateKey(thu),data('Thursday first'))
    await moveTaskToDate(moved,dateKey(thu)); await reorderWeeklyTask(dateKey(thu),moved,-1)
    db.close(); await db.open()
    expect((await tasksForDate(dateKey(mon))).map(t=>t.title)).toEqual(['Monday task'])
    expect((await tasksForDate(dateKey(thu))).map(t=>t.id)).toEqual([moved.id,existing.id])
    expect((await tasksForDate(dateKey(saturday)))[0].title).toBe('Saturday task'); expect((await tasksForDate(dateKey(sun)))[0].title).toBe('Sunday task')
  })
  it('backfills planned dates without losing legacy records', async () => {
    const legacy:Task={id:'legacy',title:'Existing task',category:'Personal',status:'planned',order:0,priority:'medium',estimatedMinutes:10,notes:'legacy'}
    await db.tasks.add(legacy);await db.dayPlans.put({date:'2026-08-20',workWins:'',taskIds:[legacy.id]});await db.captures.add({id:'capture',text:'Keep me',createdAt:new Date().toISOString(),handled:false})
    await migrateV03Data();expect((await db.tasks.get('legacy'))?.plannedDate).toBe('2026-08-20');expect(await db.captures.get('capture')).toBeTruthy()
  })
  it('provides distinct original completion personalities', () => {
    const task:Task={id:'message',title:'Finish',category:'Household',status:'completed',order:0,priority:'medium',estimatedMinutes:10,notes:''}
    expect(completionMessage(task,'quiet')).toBeTruthy();expect(completionMessage(task,'bravo-zulu')).toBeTruthy();expect(completionMessage(task,'achievement')).toMatch(/Achievement|Objective|Mission|Progress|Milestone|Quest/);expect(completionMessage(task,'absurdity')).toBeTruthy()
  })
})
