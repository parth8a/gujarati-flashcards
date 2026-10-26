/** One sentence card, as stored in data/*.json and in imported batches. */
export interface Card {
  id: string
  unit: number
  gu: string
  translit_hi: string
  en: string
  hi: string
  new_item: string
  new_item_translit: string
  new_item_meaning: string
  new_item_form?: string
  new_tokens: string[]
  grammar_note: string
  needs_review: boolean
}

/** Fields the user can change from the Browse screen. */
export type EditableField =
  | 'gu'
  | 'en'
  | 'hi'
  | 'new_item'
  | 'new_item_meaning'
  | 'new_item_form'
  | 'new_tokens'
  | 'grammar_note'
  | 'needs_review'

export type CardEdit = Partial<Pick<Card, EditableField>>

/** SRS state for one card, keyed by card id. */
export interface Progress {
  /** Study day (YYYY-MM-DD) the card is next due. */
  due: string
  /** Current interval in days; 0 while still learning. */
  interval: number
  ease: number
  /** Successful reviews in a row. */
  reps: number
  lapses: number
  /** Timestamp of the last grading. */
  last: number
}

export interface Flag {
  note: string
  at: number
}

export type Theme = 'auto' | 'light' | 'dark'

export interface Settings {
  newPerDay: number
  theme: Theme
}

export interface Daily {
  day: string
  /** Ids of new cards first graded on `day` (counts against newPerDay). */
  newIds: string[]
  /** Extra new cards allowed on `day` on top of newPerDay ("+5 more"). */
  extra?: number
}

export interface AppData {
  progress: Record<string, Progress>
  edits: Record<string, CardEdit>
  flags: Record<string, Flag>
  imported: Card[]
  settings: Settings
  daily: Daily
}
