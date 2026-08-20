import { useEffect, useState } from 'react'
import { Check, Flag } from 'lucide-react'
import { completionMessage, getCompletionPreferences, playCompletionSound, speakCompletion } from '../completionService'
import type { CompletionPreferences, Task } from '../types'

export function CompletionCelebration({ task, onFinished }: { task: Task; onFinished: () => void }) {
  const [prefs,setPrefs]=useState<CompletionPreferences>(); const [message,setMessage]=useState('Done.')
  useEffect(()=>{getCompletionPreferences().then(settings=>{setPrefs(settings);const text=completionMessage(task,settings.personality);setMessage(text);const major=Boolean(task.majorObjective&&settings.majorCelebrations);if(settings.sound)playCompletionSound(settings.volume,major);if(settings.voice)speakCompletion(text,settings.volume)})},[task])
  useEffect(()=>{if(!prefs)return;const major=Boolean(task.majorObjective&&prefs.majorCelebrations);const timer=setTimeout(onFinished,major?2800:1800);return()=>clearTimeout(timer)},[prefs,task,onFinished])
  if(!prefs)return null;const major=Boolean(task.majorObjective&&prefs.majorCelebrations)
  return <div className={`celebration ${major?'major ':''}${prefs.animation?'animated':''}`} role="status" aria-live="polite"><div>{major?<Flag/>:<Check/>}<p>{major&&<span>MAJOR OBJECTIVE COMPLETE</span>}<strong>{message}</strong><small>{task.title}</small></p></div></div>
}
