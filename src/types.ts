export type TaskStatus = 'planned' | 'active' | 'interrupted' | 'completed' | 'blocked'
export type Priority = 'low' | 'medium' | 'high'
export interface Task { id: string; title: string; category: string; status: TaskStatus; order: number; priority: Priority; plannedStart?: string; plannedDate?: string; sourceTaskId?: string; estimatedMinutes: number; actualStart?: string; actualEnd?: string; notes: string }
export interface Capture { id: string; text: string; createdAt: string; handled: boolean }
export interface Interruption { id: string; taskId: string; interruptedAt: string; resumedAt?: string; note?: string }
export interface DayPlan { date: string; workWins: string; taskIds: string[]; endOfDayNote?: string; savedAt?: string }
export type ResetDuration = 1 | 3 | 5
export type ResetAudioChoice = 'none' | 'ambient' | 'cues' | 'ambient-cues'
export interface ResetPreferences { id: 'reset'; preferredDuration: ResetDuration; audioChoice: ResetAudioChoice; ambientVolume: number; cueVolume: number }
export interface ResetSession { id: string; taskId?: string; startedAt: string; durationMinutes: ResetDuration; completed: boolean; endedEarly: boolean; endedAt?: string }
export type SyncEntityType = 'task' | 'capture' | 'interruption' | 'reset' | 'dayPlan'
export interface SyncChange { id: string; entityType: SyncEntityType; entityId: string; changedAt: string }
export interface SyncSettings { id: 'sera'; endpoint: string; token: string; lastSuccessfulSync?: string; lastReachable?: boolean }
