import { useState } from 'react'
import type { Priority, Task } from '../types'
export type TaskFormData = { title: string; category: string; priority: Priority; estimatedMinutes: number; plannedStart?: string; notes?: string }
export function TaskForm({ task, submitLabel = 'Add to today', onSubmit, onCancel }: { task?: Task; submitLabel?: string; onSubmit: (d: TaskFormData) => void; onCancel: () => void }) {
  const [data, setData] = useState<TaskFormData>({ title: task?.title ?? '', category: task?.category ?? 'Deep work', priority: task?.priority ?? 'medium', estimatedMinutes: task?.estimatedMinutes ?? 30, plannedStart: task?.plannedStart ?? '', notes: task?.notes ?? '' })
  return <form onSubmit={e => { e.preventDefault(); if (data.title.trim()) onSubmit({ ...data, title: data.title.trim() }) }}>
    <label>Task name<input autoFocus required value={data.title} onChange={e => setData({ ...data, title: e.target.value })} placeholder="What needs your attention?" /></label>
    <div className="form-row"><label>Category<input value={data.category} onChange={e => setData({ ...data, category: e.target.value })} /></label><label>Priority<select value={data.priority} onChange={e => setData({ ...data, priority: e.target.value as Priority })}><option value="high">High</option><option value="medium">Medium</option><option value="low">Low</option></select></label></div>
    <div className="form-row"><label>Estimated minutes<input type="number" min="5" step="5" value={data.estimatedMinutes} onChange={e => setData({ ...data, estimatedMinutes: Number(e.target.value) })} /></label><label>Gentle start time<input type="time" value={data.plannedStart} onChange={e => setData({ ...data, plannedStart: e.target.value })} /></label></div>
    <label>Notes<textarea rows={3} value={data.notes} onChange={e => setData({ ...data, notes: e.target.value })} placeholder="Optional context" /></label>
    <div className="form-actions"><button type="button" className="button ghost" onClick={onCancel}>Cancel</button><button className="button primary" type="submit">{submitLabel}</button></div>
  </form>
}
