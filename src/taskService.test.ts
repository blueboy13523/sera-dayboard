import 'fake-indexeddb/auto'
import { beforeEach, describe, expect, it } from 'vitest'
import { db } from './db'
import { addCapture, completeTask, createTask, interruptTask, resumeTask, startTask } from './taskService'
import { finishResetSession, saveResetPreferences, startResetSession } from './resetService'

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
})
