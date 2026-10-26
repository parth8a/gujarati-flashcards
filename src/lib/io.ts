import { toDevanagari } from './gujarati.js'
import { replaceAll, update } from './store'
import { bundledIds } from './deck'
import type { AppData, Card } from './types'

const APP_ID = 'gujarati-flashcards'

// ---------- saving files ----------

/**
 * Save a file. In the installed iOS/Android app a plain download link often does
 * nothing, so on touch devices we prefer the share sheet ("Save to Files").
 */
export async function saveFile(name: string, content: string, type: string) {
  const blob = new Blob([content], { type })
  const file = new File([blob], name, { type })
  const touch = window.matchMedia('(pointer: coarse)').matches
  if (touch && navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: name })
      return
    } catch (e) {
      if ((e as DOMException).name === 'AbortError') return
      // Fall through to a normal download.
    }
  }
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = name
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 10_000)
}

export function stamp() {
  return new Date().toISOString().slice(0, 10)
}

// ---------- importing a sentence batch ----------

const REQUIRED_STRINGS = ['id', 'gu', 'en', 'hi', 'new_item', 'new_item_meaning', 'grammar_note'] as const

export interface ImportResult {
  added: number
  updated: number
  rejected: string[]
}

function normaliseCard(raw: unknown, index: number): Card | string {
  if (!raw || typeof raw !== 'object') return `#${index + 1}: not an object`
  const r = raw as Record<string, unknown>
  for (const f of REQUIRED_STRINGS) {
    if (typeof r[f] !== 'string' || !(r[f] as string).trim()) return `#${index + 1} (${r.id ?? 'no id'}): missing "${f}"`
  }
  const unit = Number(r.unit)
  if (!Number.isInteger(unit) || unit < 1) return `#${index + 1} (${r.id}): "unit" must be a positive whole number`
  const gu = (r.gu as string).trim()
  const newItem = (r.new_item as string).trim()
  return {
    id: (r.id as string).trim(),
    unit,
    gu,
    translit_hi: toDevanagari(gu),
    en: r.en as string,
    hi: r.hi as string,
    new_item: newItem,
    new_item_translit: toDevanagari(newItem),
    new_item_meaning: r.new_item_meaning as string,
    ...(typeof r.new_item_form === 'string' ? { new_item_form: r.new_item_form } : {}),
    new_tokens: Array.isArray(r.new_tokens) ? r.new_tokens.filter((t): t is string => typeof t === 'string') : [],
    grammar_note: r.grammar_note as string,
    needs_review: typeof r.needs_review === 'boolean' ? r.needs_review : true,
  }
}

/** Merge a JSON batch (array of cards, or {cards: [...]}) into the imported cards by id. */
export function importBatch(text: string): ImportResult {
  const parsed = JSON.parse(text)
  const list: unknown[] = Array.isArray(parsed) ? parsed : Array.isArray(parsed?.cards) ? parsed.cards : []
  if (!list.length) throw new Error('No cards found. Expected a JSON array of cards.')
  const result: ImportResult = { added: 0, updated: 0, rejected: [] }
  const incoming: Card[] = []
  list.forEach((raw, i) => {
    const card = normaliseCard(raw, i)
    if (typeof card === 'string') result.rejected.push(card)
    else incoming.push(card)
  })
  update((s) => {
    const byId = new Map(s.imported.map((c) => [c.id, c]))
    for (const c of incoming) {
      if (byId.has(c.id) || bundledIds.has(c.id)) result.updated++
      else result.added++
      byId.set(c.id, c)
    }
    return { imported: [...byId.values()] }
  })
  return result
}

// ---------- backup / restore ----------

export function backupJson(data: AppData): string {
  return JSON.stringify({ app: APP_ID, kind: 'backup', version: 1, exportedAt: new Date().toISOString(), data }, null, 2)
}

export function restoreBackup(text: string): AppData {
  const parsed = JSON.parse(text)
  if (parsed?.app !== APP_ID || parsed?.kind !== 'backup' || typeof parsed.data !== 'object') {
    throw new Error('This is not a Gujarati Flashcards backup file.')
  }
  const d = parsed.data as Partial<AppData>
  const data: AppData = {
    progress: d.progress ?? {},
    edits: d.edits ?? {},
    flags: d.flags ?? {},
    imported: d.imported ?? [],
    settings: d.settings ?? { newPerDay: 10, theme: 'auto' },
    daily: d.daily ?? { day: '', newIds: [] },
  }
  replaceAll(data)
  return data
}

// ---------- Anki CSV ----------

function csvCell(v: string) {
  return `"${v.replace(/"/g, '""')}"`
}

function escapeHtml(s: string) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

/**
 * CSV with Anki's header lines (Anki 2.1.55+ reads them automatically). The
 * Gujarati field marks the new item in bold.
 */
export function ankiCsv(cards: Card[], highlight: (c: Card) => { text: string; hit: boolean }[]): string {
  const columns = [
    'id', 'Gujarati', 'Devanagari', 'English', 'Hindi', 'NewItem', 'NewItemDevanagari',
    'Meaning', 'Form', 'GrammarNote', 'Tags',
  ]
  const lines = ['#separator:Comma', '#html:true', `#columns:${columns.join(',')}`, `#tags column:${columns.length}`]
  for (const c of cards) {
    const guHtml = highlight(c)
      .map((p) => (p.hit ? `<b>${escapeHtml(p.text)}</b>` : escapeHtml(p.text)))
      .join('')
    const row = [
      c.id, guHtml, c.translit_hi, c.en, c.hi, c.new_item, c.new_item_translit,
      c.new_item_meaning, c.new_item_form ?? '', c.grammar_note, `gujarati unit${String(c.unit).padStart(2, '0')}`,
    ]
    lines.push(row.map((v) => csvCell(String(v))).join(','))
  }
  return lines.join('\n') + '\n'
}
