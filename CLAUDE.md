# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development

Serve locally with Python (port 3000 matches `.claude/launch.json`):
```bash
python3 -m http.server 3000
```

Deploy: push to `main` branch → Cloudflare Workers auto-deploys to `buroucheta.burouchetaas.workers.dev` (and `zapis.бюроучета.рф` once DNS transfer from reg.ru to Cloudflare is complete).

## Architecture

The entire app is a single `index.html` — no build step, no bundler. React 18 + Babel standalone run in the browser. Structure of the file (top to bottom):

1. **CSS** (lines ~1–1490) — design tokens, component styles, responsive breakpoints. Brand: olive `#BAAD52`, coral `#E97553`, cream `#FFFDFA`. Fonts: Halvar Breit (headings), Helvetica Neue Cyr (body), Corvetta (script).

2. **TweaksPanel** (`<script type="text/babel">`, lines ~1500–1920) — dev-only floating panel for toggling flow (`modal` vs `inline`) and hero size. Loaded first so other scripts can use `useTweaks`, `TweaksPanel`, `TweakRadio`, etc.

3. **Shared data + helpers** (second `<script type="text/babel">`, lines ~1925–2120):
   - `APPS_SCRIPT_URL` — Google Apps Script web app URL for real-time calendar slot fetching.
   - `SPECIALISTS` array — source of truth for both the landing and booking modal. Each specialist has `id`, `name`, `role`, `bio`, `credentials[]`, `expYears`, `pricePerHour`, `workHours`, `portrait`.
   - `fetchSlots(specialistId, dateStr)` — async, calls Apps Script `?action=slots` to get free hours from Google Calendar. Falls back to all work hours if URL not set.
   - `bookOnCalendar({ specialist, date, hour, form })` — async, calls Apps Script `?action=book` to create an event on the specialist's Google Calendar.
   - `sendToBitrix24()` — async, fires on booking submit, creates a CRM lead via incoming webhook.
   - Helper functions: `generateSlots`, `fmtPrice`, `fmtDate`, `buildGoogleCalUrl`, `Portrait`, `MiniAvatar`.
   - All exported to `window` via `Object.assign(window, {...})`.

4. **Landing + booking UI** (third `<script type="text/babel">`, lines ~2120–end):
   - `App` — root; owns `open`/`initialSpec` state, renders all sections + `BookingModal`.
   - `Header`, `Hero`, `Specialists`, `Included`, `Reviews`, `MetaBand`, `Footer` — pure presentational sections.
   - `BookingModal` — 4-step wizard: `BookingStepSpecialist` → `BookingStepWhen` → `BookingStepContact` → `BookingConfirm`. On submit calls `Promise.all([sendToBitrix24, bookOnCalendar])`.
   - `BookingStepWhen` — owns `slots` + `slotsLoading` state internally; fetches via `fetchSlots()` in a `useEffect` when `date` changes.
   - `InlineBooking` — alternative single-page flow, toggled via TweaksPanel.
   - `BookingConfirm` — shows receipt + Google Calendar link.

## Key integrations

- **Google Apps Script** (`apps-script/Code.gs`): Web app deployed at `APPS_SCRIPT_URL`. Two actions via `doGet`: `action=slots` returns free hour numbers for a specialist+date by checking their Google Calendar; `action=book` creates a calendar event. Specialist calendar IDs and work hours are hardcoded in the script. To update the deployed script: edit `Code.gs` in script.google.com → Развернуть → Управление → Новая версия.
- **Bitrix24 CRM**: webhook `https://buroucheta.bitrix24.ru/rest/1/wiy3yl4rurdhjmhu/` — creates a lead (`crm.lead.add`).
- **Google Calendar** (client-side): `buildGoogleCalUrl()` generates a deep-link for the confirmation screen.

## Making changes to large strings

`index.html` is too large for the Edit tool's token limits. Use Python string replacement:
```python
path = "/path/to/index.html"
with open(path, "r", encoding="utf-8") as f: src = f.read()
src = src.replace(old, new, 1)
with open(path, "w", encoding="utf-8") as f: f.write(src)
```

## Assets

- `assets/anastasia.JPG` — colour photo of Анастасия Сергеева (specialist 1)
- `assets/olga.JPG` — B&W photo of Ольга Смагина (specialist 2)
- `assets/logo-full.png`, `assets/logo-mark.png`, `assets/telegram-qr.png`
- `fonts/` — HalvarBreit-Rg.ttf, HalvarBreit-Md.ttf, Corvetta.ttf (licensed, do not replace)
- `oferta.html` — standalone public offer page, linked from footer
- `apps-script/Code.gs` — Google Apps Script source (not auto-deployed; must be pasted into script.google.com manually)
