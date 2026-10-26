import { useEffect, useState } from 'react'

function findGujaratiVoice(): SpeechSynthesisVoice | null {
  if (!('speechSynthesis' in window)) return null
  return speechSynthesis.getVoices().find((v) => v.lang.toLowerCase().replace('_', '-').startsWith('gu')) ?? null
}

/** The device's Gujarati voice, or null. Never falls back to another language. */
export function useGujaratiVoice(): SpeechSynthesisVoice | null {
  const [voice, setVoice] = useState(findGujaratiVoice)
  useEffect(() => {
    if (!('speechSynthesis' in window)) return
    const refresh = () => setVoice(findGujaratiVoice())
    speechSynthesis.addEventListener('voiceschanged', refresh)
    refresh()
    return () => speechSynthesis.removeEventListener('voiceschanged', refresh)
  }, [])
  return voice
}

export function speak(text: string, voice: SpeechSynthesisVoice) {
  speechSynthesis.cancel()
  const u = new SpeechSynthesisUtterance(text)
  u.voice = voice
  u.lang = voice.lang
  u.rate = 0.85
  speechSynthesis.speak(u)
}
