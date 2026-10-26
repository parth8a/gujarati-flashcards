import { speak, useGujaratiVoice } from '../lib/speech'

/** Hidden entirely when the device has no Gujarati voice. */
export default function AudioButton({ text }: { text: string }) {
  const voice = useGujaratiVoice()
  if (!voice) return null
  return (
    <button
      className="icon-btn"
      aria-label="Play audio"
      onClick={(e) => {
        e.stopPropagation()
        speak(text, voice)
      }}
    >
      🔊
    </button>
  )
}
