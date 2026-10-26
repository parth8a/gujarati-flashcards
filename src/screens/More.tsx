import { useRef, useState } from 'react'
import { buildDeck } from '../lib/deck'
import { highlightParts } from '../lib/highlight'
import { ankiCsv, backupJson, importBatch, restoreBackup, saveFile, stamp } from '../lib/io'
import { useOfflineReady } from '../lib/pwa'
import { useGujaratiVoice } from '../lib/speech'
import { update, useAppData } from '../lib/store'
import type { Theme } from '../lib/types'

const THEMES: { key: Theme; label: string }[] = [
  { key: 'auto', label: 'Auto' },
  { key: 'light', label: 'Light' },
  { key: 'dark', label: 'Dark' },
]

function FilePicker({ label, onText }: { label: string; onText: (text: string) => void }) {
  const input = useRef<HTMLInputElement>(null)
  return (
    <>
      <button className="btn" onClick={() => input.current?.click()}>
        {label}
      </button>
      <input
        ref={input}
        type="file"
        accept="application/json,.json"
        hidden
        onChange={async (e) => {
          const file = e.target.files?.[0]
          e.target.value = ''
          if (file) onText(await file.text())
        }}
      />
    </>
  )
}

export default function More() {
  const data = useAppData()
  const cards = buildDeck(data)
  const voice = useGujaratiVoice()
  const offline = useOfflineReady()
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null)

  const setNewPerDay = (n: number) =>
    update((s) => ({ settings: { ...s.settings, newPerDay: Math.max(0, Math.min(100, n)) } }))

  return (
    <div className="more">
      <h1>More</h1>

      {message && (
        <p className={message.ok ? 'notice ok' : 'notice err'} role="status" onClick={() => setMessage(null)}>
          {message.text}
        </p>
      )}

      <section className="panel">
        <h2>Study</h2>
        <div className="setting">
          <span>New cards per day</span>
          <div className="stepper">
            <button className="icon-btn" aria-label="Fewer" onClick={() => setNewPerDay(data.settings.newPerDay - 5)}>
              −
            </button>
            <input
              type="number"
              inputMode="numeric"
              min={0}
              max={100}
              value={data.settings.newPerDay}
              onChange={(e) => setNewPerDay(Number(e.target.value) || 0)}
              aria-label="New cards per day"
            />
            <button className="icon-btn" aria-label="More" onClick={() => setNewPerDay(data.settings.newPerDay + 5)}>
              +
            </button>
          </div>
        </div>
        <div className="setting">
          <span>Theme</span>
          <div className="segmented">
            {THEMES.map((t) => (
              <button
                key={t.key}
                className={data.settings.theme === t.key ? 'active' : ''}
                onClick={() => update((s) => ({ settings: { ...s.settings, theme: t.key } }))}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="panel">
        <h2>Add sentences</h2>
        <p className="muted small">
          Import a JSON file with the same fields as <code>data/sentences.json</code>. Cards merge by id: new ids are added
          to the end of the deck, existing ids are updated, and your progress is kept.
        </p>
        <FilePicker
          label="Import JSON batch"
          onText={(text) => {
            try {
              const r = importBatch(text)
              setMessage({
                ok: r.rejected.length === 0,
                text: `Added ${r.added}, updated ${r.updated}.${r.rejected.length ? ` Skipped ${r.rejected.length}: ${r.rejected.slice(0, 3).join('; ')}` : ''}`,
              })
            } catch (e) {
              setMessage({ ok: false, text: `Import failed: ${(e as Error).message}` })
            }
          }}
        />
        {data.imported.length > 0 && <p className="muted small">{data.imported.length} imported cards on this device.</p>}
      </section>

      <section className="panel">
        <h2>Backup</h2>
        <p className="muted small">
          Progress, edits, flags, imported cards and settings live only on this device. Back up now and then.
        </p>
        <div className="btn-row">
          <button
            className="btn"
            onClick={() => saveFile(`gujarati-flashcards-backup-${stamp()}.json`, backupJson(data), 'application/json')}
          >
            Back up
          </button>
          <FilePicker
            label="Restore"
            onText={(text) => {
              if (!confirm('Replace everything on this device with the backup?')) return
              try {
                const d = restoreBackup(text)
                setMessage({ ok: true, text: `Restored progress for ${Object.keys(d.progress).length} cards.` })
              } catch (e) {
                setMessage({ ok: false, text: `Restore failed: ${(e as Error).message}` })
              }
            }}
          />
        </div>
      </section>

      <section className="panel">
        <h2>Export</h2>
        <p className="muted small">An Anki-ready CSV of all {cards.length} cards (with your edits). The new item is bold.</p>
        <button
          className="btn"
          onClick={() => saveFile(`gujarati-flashcards-anki-${stamp()}.csv`, ankiCsv(cards, highlightParts), 'text/csv')}
        >
          Export Anki CSV
        </button>
      </section>

      <section className="panel about">
        <h2>About</h2>
        <ul className="muted small">
          <li>{cards.length} cards in the deck</li>
          <li>Gujarati voice: {voice ? `${voice.name}` : 'none on this device (audio button hidden)'}</li>
          <li>Offline: {offline ? 'ready' : 'not yet — open once while online'}</li>
          <li>Build: {__BUILD_TIME__}</li>
        </ul>
      </section>
    </div>
  )
}
