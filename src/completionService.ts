import { db } from './db'
import type { CompletionPersonality, CompletionPreferences, Task } from './types'

export const defaultCompletionPreferences: CompletionPreferences = { id: 'completion', personality: 'quiet', sound: true, voice: false, animation: true, volume: .25, majorCelebrations: true }
export const getCompletionPreferences = async () => (await db.completionPreferences.get('completion')) ?? defaultCompletionPreferences
export const saveCompletionPreferences = async (preferences: CompletionPreferences) => db.completionPreferences.put(preferences)

const lines: Record<CompletionPersonality, string[]> = {
  quiet: ['Done.', 'Complete.', 'Nicely done.', 'That’s handled.'],
  'bravo-zulu': ['Bravo Zulu.', 'Objective complete.', 'Well executed.', 'Mission accomplished.', 'Task secured.', 'Good work. Carry on.'],
  achievement: ['Achievement unlocked: Task complete.', 'Objective cleared.', 'Mission complete.', 'Progress saved.', 'Milestone reached.', 'Quest item resolved.'],
  absurdity: [
    'NEW ACHIEVEMENT: THE THING HAS BEEN DONE.', 'BRAVO ZULU. OBJECTIVE ANNIHILATED.', 'TASK COMPLETE. THE LIST HAS ONE FEWER VICTIM.',
    'ACHIEVEMENT UNLOCKED: YOU ACTUALLY FINISHED IT.', 'OBJECTIVE COMPLETE. BUREAUCRACY TREMBLES.', 'THE TASK HAS BEEN DEFEATED IN SINGLE COMBAT.',
    'PRODUCTIVITY EVENT DETECTED. WITNESSES ARE STUNNED.', 'THE CHECKBOX HAS ACCEPTED ITS DESTINY.', 'TASK VANQUISHED. THE ARCHIVES SHALL REMEMBER THIS.',
    'A SMALL BUT DECISIVE VICTORY HAS OCCURRED.', 'THE OBJECTIVE IS NOW A FORMER OBJECTIVE.', 'DOCUMENTED EVIDENCE OF COMPLETION HAS BEEN DISCOVERED.',
    'THE DAYBOARD REPORTS AN UNEXPECTED OUTBREAK OF PROGRESS.', 'TASK COMPLETE. CONFETTI DEPARTMENT NOTIFIED.', 'THE ADMINISTRATIVE HYDRA HAS LOST A HEAD.',
    'ANOTHER OBLIGATION HAS BEEN RETURNED TO THE VOID.', 'THE QUEUE HAS BEEN LIGHTENED BY FORCE.', 'COMPLETION CONFIRMED. DRAMATIC MUSIC WOULD BE APPROPRIATE.',
    'THE PLAN SURVIVES CONTACT WITH REALITY.', 'ONE TASK DOWN. THE CALENDAR LOOKS NERVOUS.', 'OBJECTIVE CLEARED WITH SUSPICIOUS COMPETENCE.',
    'THE CHECKMARK DESCENDS. ORDER IS RESTORED.', 'TASK COMPLETE. THE COUNCIL NODS APPROVINGLY.', 'A PRODUCTIVE DISTURBANCE HAS BEEN RECORDED.',
    'VICTORY ACHIEVED. PAPERWORK MAY ATTEMPT A COUNTERATTACK.', 'THE TASK HAS CEASED TO BE YOUR PROBLEM.', 'OPERATION GET-IT-DONE HAS CONCLUDED SUCCESSFULLY.',
    'THE LIST GROWS SHORTER. LEGENDS GROW LONGER.'
  ]
}
const categoryLines: Record<string,string[]> = {
  household: ['DOMESTIC OBJECTIVE COMPLETE.', 'THE LAUNDRY HAS BEEN FORCED INTO SUBMISSION.', 'THE DISHES HAVE LOST THIS ROUND.'],
  work: ['BRAVO ZULU. WORK OBJECTIVE COMPLETE.', 'TASK COMPLETE. THE QUEUE HAS BEEN REDUCED BY ONE.', 'PROFESSIONAL OBJECTIVE SECURED.'],
  vehicle: ['MECHANICAL VICTORY.', 'ONE FEWER COMPONENT STANDS BETWEEN THIS MACHINE AND GLORY.', 'THE MACHINE ACKNOWLEDGES YOUR SERVICE.'],
  writing: ['THE SCRIBE PREVAILS.', 'ANOTHER PAGE HAS BEEN BEATEN INTO CANONICAL SUBMISSION.', 'WORDS DEPLOYED. THE BLANK PAGE RETREATS.'],
  sera: ['SYSTEM OBJECTIVE COMPLETE.', 'THE MACHINES APPROVE.', 'PROCESS COMPLETE. LOGIC APPLAUDS QUIETLY.'],
  ai: ['SYSTEM OBJECTIVE COMPLETE.', 'THE MACHINES APPROVE.', 'PROCESS COMPLETE. LOGIC APPLAUDS QUIETLY.']
}
let lastMessage = ''
export function completionMessage(task: Task, personality: CompletionPersonality) {
  const category = task.category.toLowerCase(); const categoryBank = Object.entries(categoryLines).find(([key])=>category.includes(key))?.[1]
  const bank = personality === 'absurdity' && categoryBank && Math.random() < .45 ? [...lines.absurdity,...categoryBank,...categoryBank] : lines[personality]
  const choices = bank.filter(line=>line!==lastMessage); const selected = choices[Math.floor(Math.random()*choices.length)] ?? bank[0]; lastMessage = selected; return selected
}

export function playCompletionSound(volume: number, major: boolean) { try { const context = new AudioContext(); const gain = context.createGain(); gain.connect(context.destination); const now=context.currentTime; gain.gain.setValueAtTime(Math.max(.001,volume*.12),now); gain.gain.exponentialRampToValueAtTime(.001,now+(major ? .8 : .45)); const notes=major?[523,659,784]:[659]; notes.forEach((frequency,index)=>{const oscillator=context.createOscillator();oscillator.type='sine';oscillator.frequency.value=frequency;oscillator.connect(gain);oscillator.start(now+index*.1);oscillator.stop(now+.5+index*.1)}); window.setTimeout(()=>void context.close(),1200) } catch { /* completion never depends on audio */ } }
export function speakCompletion(message: string, volume: number) { try { if (!('speechSynthesis' in window)) return; const utterance=new SpeechSynthesisUtterance(message);utterance.volume=volume;utterance.rate=1.02;window.speechSynthesis.speak(utterance) } catch { /* completion never depends on speech */ } }
