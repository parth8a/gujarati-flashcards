# Gujarati Flashcards

A mobile-first, offline flashcard app for learning Gujarati the Refold / MattvsJapan way:
**i+1 sentence cards** (exactly one new thing per sentence), recognition first, spaced
repetition with just **Fail / Pass**. Built for a Hindi speaker: transliteration is in
Devanagari and every card compares the grammar point to Hindi.

It's a PWA hosted on GitHub Pages. Install it from the browser, no app store needed.

- Live site: **https://parth8a.github.io/gujarati-flashcards/** (after the one-time setup below)
- Stack: Vite + React + TypeScript, no backend. Progress lives in your browser's `localStorage`.

---

## 1. One-time setup on GitHub

The code is in `parth8a/Gujarati-Flashcard-App`. To serve it at
`https://parth8a.github.io/gujarati-flashcards/`, do this once in the GitHub web UI:

1. **Rename the repo** to `gujarati-flashcards`: *Settings → General → Repository name*.
   (GitHub redirects the old URL, so existing clones keep working.)
2. **Make it public**: *Settings → General → Danger Zone → Change visibility*. GitHub Pages
   on a free account needs a public repo.
3. **Turn on Pages from Actions**: *Settings → Pages → Build and deployment → Source:
   **GitHub Actions***.
4. **Get the code onto `main`**: merge the `claude/gujarati-flashcard-pwa-6id9yg` branch
   into `main` (open a pull request and merge it, or push the branch to `main`).

The workflow in `.github/workflows/deploy.yml` then builds and deploys on every push to
`main`. You can follow it under the repo's **Actions** tab, and you can re-run it by hand
there with *Run workflow*.

> The workflow asks GitHub Pages for the site's path at build time, so the app works
> under whatever the repo is called (`https://parth8a.github.io/<repo>/`).
>
> GitHub only lets the **default branch** deploy to Pages. If a deploy fails with
> *"Branch main is not allowed to deploy to github-pages"*, set the default branch to
> `main` (*Settings → General → Default branch*) and make sure *Settings → Environments
> → github-pages → Deployment branches* allows `main`.

## 2. Install it on your phone

Open the site once **while online** and wait a few seconds. The first visit caches the
whole app for offline use; *More → About* shows "Offline: ready" when that's done.

**iPhone (Safari):** open the link in Safari → tap **Share** → **Add to Home Screen** → **Add**.
It has to be Safari; other iOS browsers can't install web apps on older iOS versions.

**Android (Chrome):** open the link in Chrome → tap the **⋮** menu → **Install app** (or
**Add to Home screen**) → **Install**.

After that it opens full-screen from its icon and works with no connection at all.

## 3. Updates

Push to `main` and the workflow redeploys. The next time you open the app with a
connection, it finds the new version, installs it in the background and reloads once it's
ready. It also checks whenever you switch back to the app. Your progress is untouched,
because it's stored separately from the app files.

## 4. Studying

- **Study** shows how many cards are due and how many new cards you have left today. Tap
  **Start review**.
- **Front:** the Gujarati sentence with the new item highlighted. Tap the dashed box to
  reveal the Devanagari, and 🔊 to hear it. The audio button only appears if your phone has
  a Gujarati (`gu-IN`) voice. It's never read out with a wrong-language voice.
- **Back:** the Devanagari transliteration, the new item with its transliteration, meaning
  and form, the English translation, a parallel Hindi sentence and a one-line grammar note.
- **Fail** brings the card back three cards later in the same session. **Pass** schedules
  it (the button shows when: `1d`, `6d`, …).
- On a keyboard: <kbd>Space</kbd> shows the answer, <kbd>1</kbd> = Fail, <kbd>2</kbd> /
  <kbd>Space</kbd> = Pass, <kbd>t</kbd> toggles Devanagari, <kbd>Esc</kbd> exits.
- **More → New cards per day** (default 10) and **Theme** (Auto follows the system's dark
  mode).

## 5. Browse, flag and edit

**Browse** lets you search every card (Gujarati, Devanagari, English, Hindi, notes, id) and
shows progress per unit (light bar = seen, solid bar = learned). Tap a card to:

- **⚑ Flag as wrong**, with an optional note. Flagged cards are **skipped in reviews** until
  you unflag them, so you don't drill a mistake. You can also flag from the review screen.
  The *Flagged* filter lists them all.
- **✎ Edit** its text. Only the fields you change are saved, as an overlay on top of the
  original. *Revert to original* removes it. The Devanagari is always recomputed from the
  Gujarati.
- **Reset** its progress so it comes back as a new card.

## 6. Adding sentences

New cards always merge **by id**. A new id is added to the end of the deck. An existing id
gets its text replaced and **keeps its progress**.

**Option A: in the app.** *More → Import JSON batch* takes a `.json` file that's an array of
cards in the schema below. The cards are stored on that device only (they're included in
backups). A summary shows how many were added, updated or skipped, and why.

**Option B: in the repo (shows up on every device).** Add a new file under `data/`, e.g.
`data/batch-02.json`, then:

```bash
npm run translit   # fills in translit_hi / new_item_translit from the Gujarati
npm run validate   # i+1, ids, fields and transliteration checks
git add data && git commit -m "Add batch 02" && git push   # deploys
```

Every `data/*.json` except `hindi_cognates.json` is a deck file. They're studied in this
order: `sentences.json` first, then the others alphabetically. Name batches so they sort
after the ones they build on.

### Card schema

```json
{
  "id": "u01-003",
  "unit": 1,
  "gu": "તું ઘરે છે.",
  "translit_hi": "तुं घरे छे.",
  "en": "You are at home.",
  "hi": "तू घर पर है।",
  "new_item": "તું",
  "new_item_translit": "तुं",
  "new_item_meaning": "you (informal, singular; Hindi तू)",
  "new_item_form": "2nd person singular pronoun, informal",
  "new_tokens": ["તું"],
  "grammar_note": "Like Hindi तू है, તું also takes છે.",
  "needs_review": true
}
```

- `new_tokens`: the word(s) in `gu` that are new. Write a **suffix** with a leading dash,
  e.g. `"-માં"`. Once a suffix has been introduced, any known word + that suffix counts as
  known (રૂમ + માં = રૂમમાં). Leave it empty (`[]`) when the new item is a pattern made of
  words you already know (e.g. `ના કરો`). The highlight then falls back to `new_item`.
- `new_item_form`: optional extra field (shown on the back as the item's grammatical form).
- `translit_hi` / `new_item_translit`: never write these by hand. `npm run translit`
  generates them by shifting each Gujarati character (U+0A80–U+0AFF) down by 0x180 into
  Devanagari. The in-app import computes them too.
- `needs_review`: `true` until a fluent speaker has checked the card.

## 7. Backup, restore and Anki

Everything personal (progress, edits, flags, imported cards, settings) is only in this
browser on this device. Clearing Safari's website data deletes it.

- **More → Back up** saves `gujarati-flashcards-backup-YYYY-MM-DD.json`. On a phone this opens
  the share sheet, so pick *Save to Files* / *Drive*.
- **More → Restore** replaces everything on the device with a backup file. Use this to move
  to a new phone too.
- **More → Export Anki CSV** writes all cards with your edits. It includes Anki's header
  lines, so *File → Import* in Anki 2.1.55+ picks the separator and columns automatically.
  The new item is in bold and each card is tagged `gujarati unitNN`.

## 8. Local development

```bash
npm install
npm run dev        # http://localhost:5173/gujarati-flashcards/
npm run validate   # check the deck
npm run build      # validate + type-check + production build into dist/
npm run preview    # serve dist/ (service worker active) at http://localhost:4173/gujarati-flashcards/
```

## 9. The deck

`data/sentences.json` has 200 sentences in 10 units (~20 each):

| Unit | Topic |
|---|---|
| 1 | Pronouns + present of "to be" (છું / છે / છીએ / છો), inclusive આપણે vs exclusive અમે |
| 2 | Negation (નથી, નહીં, ના) and question words |
| 3 | Simple present (habitual), plus the negative habitual (નથી પીતો) |
| 4 | Present progressive (-ઈ રહ્યો/રહી/રહ્યું છે) |
| 5 | Possessives with neuter (મારો/મારી/મારું/મારા), genitive -નો/-ની/-નું, postpositions -માં, -થી, -ને, પર, સાથે, માટે, પાસે |
| 6 | Imperatives: informal (આવ), plain (આવો), polite -જો (આવજો), negative (ના કરો), "let's" (ચાલો) |
| 7 | Future (-ઈશ / -શે / -ઈશું / -શો), negative future |
| 8 | Past of "to be" and intransitive past with gender agreement (ગયો/ગઈ/ગયું/ગયા) |
| 9 | Transitive past with ergative (મેં, તેં, તેણે, noun -એ) and object agreement |
| 10 | Modals: મારે … છે (want), પડે / પડશે (have to), -વાનું (supposed to), શકવું, ગમવું, જોઈએ, લાગવું, આવડવું, -ઈને |

`scripts/validate.js` checks every deck file:

1. ids are unique and every required field is present with the right type;
2. **i+1**: every word is in `new_tokens`, appeared in an earlier sentence, or is in
   `data/hindi_cognates.json`. Known stem + introduced suffix also counts, including the
   oblique -ા of -ું/-ો words. At most 2 new tokens per card, for multi-word items like
   `અમે … છીએ`;
3. `translit_hi` and `new_item_translit` match the computed Devanagari.

It runs as part of `npm run build`, so a broken deck never deploys. Current result: 200 cards,
0 errors, 0 warnings.

> **Please have the deck reviewed.** The sentences were machine-written, so every card
> starts with `needs_review: true`. Ask a native speaker to read through them, fix anything
> off in **Browse → Edit**, untick *needs review*, and flag anything doubtful. Points most
> worth a second look: u09-013 (the verb agreeing with a -ને object, મેં તેને જોયો), u09-019
> (ના પાડી treated as feminine), u03-015 (dropping -માં with a city name), and u07-013
> (નહીં આવું as the negative future).

## 10. Choices made where the brief was silent

- **Study day** rolls over at **4 am** local time (like Anki), so a late-night session
  counts toward the same day.
- **SRS:** SM-2 with two buttons. Pass keeps the ease (2.5 to start) and steps the interval
  1 → 6 → interval × ease days (max 365). Fail lowers the ease by 0.2 (min 1.3), counts a
  lapse, and relearns the card in the same session. A relearned card then starts again at 1 day.
- **Session order:** due reviews first (oldest first), then new cards in deck order.
- **New cards per day** counts cards graded for the first time that day, including failed ones.
- **Flagged cards are suspended** from reviews (see §5).
- **Cognates** are Hindi-recognisable nouns, adjectives, names and English loanwords.
  Function words (હા, ના, કોઈ…) and all verb forms are taught as new items even when they look
  familiar. Watch the false friends the notes point out: આપવું = *give* (not आप), મોટું = *big*,
  જો = *look!* (not जो).
- **Routing** uses the URL hash (`#/browse`), so refreshing on GitHub Pages never 404s.
- **Fonts:** none are bundled. The app uses the phone's own Gujarati/Devanagari fonts, which
  every modern iOS and Android has. That keeps the offline cache small.
- **Imported cards** are per device; put them in `data/` to share them across devices.

## Project layout

```
data/sentences.json         the 200-card deck
data/hindi_cognates.json    words treated as already known
scripts/validate.js         deck checks (npm run validate)
scripts/fill-translit.js    computes Devanagari fields (npm run translit)
src/lib/gujarati.js         transliteration + tokenizer, shared by app and scripts
src/lib/srs.ts              Pass/Fail SM-2 scheduling
src/lib/store.ts            localStorage state (progress keyed by card id)
src/lib/deck.ts             merges data files, imports and edits by id
src/screens/                Study, Review, Browse, More
public/icons/               app icons incl. apple-touch-icon
.github/workflows/deploy.yml  build + deploy to Pages on push to main
```
