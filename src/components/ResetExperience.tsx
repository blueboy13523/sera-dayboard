import { useEffect, useRef, useState } from 'react'
import { Play, X } from 'lucide-react'
import type { ResetAudioChoice, ResetDuration, ResetPreferences, Task } from '../types'
import { defaultResetPreferences, finishResetSession, getResetPreferences, saveResetPreferences, startResetSession } from '../resetService'

type Stage = 'setup' | 'breathing' | 'return'
const presets: { duration: ResetDuration; name: string; detail: string }[] = [
  { duration: 1, name: 'Quick Reset', detail: '1 minute' },
  { duration: 3, name: 'Calm Reset', detail: '3 minutes' },
  { duration: 5, name: 'Deep Reset', detail: '5 minutes' }
]

export function ResetExperience({ task, fromInterruption, initialDuration, startImmediately = false, onCancel, onResume }: { task?: Task; fromInterruption: boolean; initialDuration?: ResetDuration; startImmediately?: boolean; onCancel: () => void; onResume: () => void | Promise<void> }) {
  const [stage, setStage] = useState<Stage>('setup')
  const [prefs, setPrefs] = useState<ResetPreferences>({ ...defaultResetPreferences, preferredDuration: initialDuration ?? 1 })
  const [startedAt, setStartedAt] = useState(0)
  const [now, setNow] = useState(0)
  const [sessionId, setSessionId] = useState<string>()
  const finished = useRef(false)
  const autoStarted = useRef(false)
  const audio = useRef<{ context: AudioContext; nodes: AudioNode[] } | undefined>(undefined)

  const totalSeconds = prefs.preferredDuration * 60
  const elapsedSeconds = stage === 'breathing' ? Math.max(0, (now - startedAt) / 1000) : 0
  const remaining = Math.max(0, Math.ceil(totalSeconds - elapsedSeconds))
  const cyclePosition = elapsedSeconds % 10
  const phase = cyclePosition < 4 ? 'inhale' : 'exhale'
  const phaseSeconds = phase === 'inhale' ? 4 : 6

  const stopAudio = () => { const active = audio.current; audio.current = undefined; active?.nodes.forEach(node => { try { node.disconnect() } catch { /* already disconnected */ } }); if (active && active.context.state !== 'closed') void active.context.close() }
  const beginAudio = (choice: ResetAudioChoice, volume: number) => {
    if (choice === 'none') return
    const context = new AudioContext(); const nodes: AudioNode[] = []
    if (choice === 'ambient' || choice === 'ambient-cues') {
      const master = context.createGain(); master.gain.value = volume * 0.055; master.connect(context.destination); nodes.push(master)
      ;[174, 261].forEach((frequency, index) => { const oscillator = context.createOscillator(); const gain = context.createGain(); oscillator.type = 'sine'; oscillator.frequency.value = frequency; gain.gain.value = index ? 0.32 : 0.55; oscillator.connect(gain).connect(master); oscillator.start(); nodes.push(oscillator, gain) })
    }
    audio.current = { context, nodes }
    void context.resume()
  }
  const playCue = (nextPhase: 'inhale' | 'exhale') => {
    if (!audio.current || (prefs.audioChoice !== 'cues' && prefs.audioChoice !== 'ambient-cues')) return
    const { context } = audio.current; const oscillator = context.createOscillator(); const gain = context.createGain(); const start = context.currentTime
    oscillator.type = 'sine'; oscillator.frequency.setValueAtTime(nextPhase === 'inhale' ? 523 : 392, start); gain.gain.setValueAtTime(Math.max(.001, prefs.cueVolume * .09), start); gain.gain.exponentialRampToValueAtTime(.001, start + .45); oscillator.connect(gain).connect(context.destination); oscillator.start(start); oscillator.stop(start + .5)
  }
  const begin = async (selected = prefs) => {
    setPrefs(selected); beginAudio(selected.audioChoice, selected.ambientVolume)
    await saveResetPreferences(selected)
    const session = await startResetSession(task?.id, selected.preferredDuration)
    finished.current = false; setSessionId(session.id); const start = Date.now(); setStartedAt(start); setNow(start); setStage('breathing')
  }
  useEffect(() => { getResetPreferences().then(saved => { const selected={...saved,preferredDuration:initialDuration??saved.preferredDuration};setPrefs(selected);if(startImmediately&&!autoStarted.current){autoStarted.current=true;void begin(selected)} }) }, [initialDuration,startImmediately])
  const finish = async (completed: boolean) => {
    if (finished.current) return; finished.current = true; stopAudio(); if (sessionId) await finishResetSession(sessionId, completed); setStage('return')
  }
  useEffect(() => { if (stage !== 'breathing') return; const timer = window.setInterval(() => setNow(Date.now()), 100); return () => clearInterval(timer) }, [stage])
  useEffect(() => { if (stage === 'breathing' && remaining <= 0) void finish(true) }, [remaining, stage])
  useEffect(() => { if (stage === 'breathing') playCue(phase) }, [phase])
  useEffect(() => () => stopAudio(), [])
  const timeLabel = `${Math.floor(remaining / 60)}:${(remaining % 60).toString().padStart(2, '0')}`

  return <div className={`reset-screen reset-${stage}`} role="dialog" aria-modal="true" aria-label="Guided reset">
    {stage === 'setup' && <div className="reset-setup"><button className="reset-close" onClick={onCancel} aria-label="Close reset"><X /></button><p className="reset-kicker">RESET</p><h1>Take a little space.</h1><p className="reset-lead">Breathe in for 4. Breathe out for 6. No holding, no pressure.</p>
      <div className="reset-presets">{presets.map(p => <button key={p.duration} className={prefs.preferredDuration === p.duration ? 'selected' : ''} onClick={() => setPrefs({ ...prefs, preferredDuration: p.duration })}><strong>{p.name}</strong><span>{p.detail}</span></button>)}</div>
      <div className="audio-settings"><label>Sound<select value={prefs.audioChoice} onChange={e => setPrefs({ ...prefs, audioChoice: e.target.value as ResetAudioChoice })}><option value="none">No audio</option><option value="ambient">Soft ambient tone</option><option value="cues">Breathing cues only</option><option value="ambient-cues">Ambient + cues</option></select></label>
        <label>Ambient volume<input type="range" min="0" max="1" step="0.05" value={prefs.ambientVolume} disabled={!prefs.audioChoice.includes('ambient')} onChange={e => setPrefs({ ...prefs, ambientVolume: Number(e.target.value) })} /></label>
        <label>Cue volume<input type="range" min="0" max="1" step="0.05" value={prefs.cueVolume} disabled={!prefs.audioChoice.includes('cues')} onChange={e => setPrefs({ ...prefs, cueVolume: Number(e.target.value) })} /></label></div>
      <button className="button reset-begin" onClick={() => void begin()}><Play fill="currentColor" /> Begin {prefs.preferredDuration}-minute reset</button></div>}
    {stage === 'breathing' && <div className="breathing-routine"><div className="breathing-top"><span>RESET</span><button onClick={() => void finish(false)}>End early</button></div><div className="breathing-center"><div className={`breathing-orb ${phase}`} style={{ transitionDuration: `${phaseSeconds}s` }}><div /></div><p className="breath-phase">{phase.toUpperCase()}</p><p className="breath-count">{phase === 'inhale' ? 'Gently fill the space' : 'Let it soften away'}</p></div><div className="reset-time"><strong>{timeLabel}</strong><span>remaining</span></div></div>}
    {stage === 'return' && <div className="reset-return"><div className="return-icon">✓</div><p className="reset-kicker">READY TO CONTINUE</p><h1>Come back gently.</h1>{task&&<div className="return-task"><span>NOW</span><strong>{task.title}</strong><small>{fromInterruption ? 'Your place is still saved.' : 'Your task stayed right where you left it.'}</small></div>}<button className="button resume-task" onClick={() => void onResume()}><Play fill="currentColor" /> {task?'Resume task':'Return to today'}</button></div>}
  </div>
}
