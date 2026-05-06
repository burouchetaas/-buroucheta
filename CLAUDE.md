# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development

Serve locally with Python (port 3000 matches `.claude/launch.json`):
```bash
python3 -m http.server 3000
```

Deploy: push to `main` branch → Netlify auto-deploys to `zapis.бюроучета.рф`.

## Architecture

The entire app is a single `index.html` — no build step, no bundler. React 18 + Babel standalone run in the browser. Structure of the file (top to bottom):

1. **CSS** (lines ~1–1490) — design tokens, component styles, responsive breakpoints. Brand: olive `#BAAD52`, coral `#E97553`, cream `#FFFDFA`. Fonts: Halvar Breit (headings), Helvetica Neue Cyr (body), Corvetta (script).

2. **TweaksPanel** (`<script type="text/babel">`, lines ~1500–1920) — dev-only floating panel for toggling flow (`modal` vs `inline`) and hero size. Loaded first so other scripts can use `useTweaks`, `TweaksPanel`, `TweakRadio`, etc.

3. **Shared data + helpers** (second `<script type="text/babel">`, lines ~1925–2090):
   - `SPECIALISTS` array — source of truth for both the landing and booking modal. Each specialist has `id`, `name`, `role`, `bio`, `credentials[]`, `expYears`, `pricePerHour`, `workHours`, `portrait`.
   - `sendToBitrix24()` — async function, fires on booking submit, creates a CRM lead via incoming webhook.
   - Helper functions: `generateSlots`, `fmtPrice`, `fmtDate`, `buildGoogleCalUrl`, `Portrait`, `MiniAvatar`.
   - All exported to `window` via `Object.assign(window, {...})` so the next script tag can use them.

4. **Landing + booking UI** (third `<script type="text/babel">`, lines ~2090–end):
   - `App` — root; owns `open`/`initialSpec` state, renders all sections + `BookingModal`.
   - `Header`, `Hero`, `Specialists`, `Included`, `Reviews`, `MetaBand`, `Footer` — pure presentational sections.
   - `BookingModal` — 4-step wizard: `BookingStepSpecialist` → `BookingStepWhen` (calendar) → `BookingStepContact` → `BookingConfirm`. Calls `sendToBitrix24` on step 2→3 transition.
   - `InlineBooking` — alternative single-page flow, toggled via TweaksPanel.
   - `BookingConfirm` — shows receipt + Google Calendar link.

## Key integrations

- **Bitrix24 CRM**: webhook `https://buroucheta.bitrix24.ru/rest/1/wiy3yl4rurdhjmhu/` — creates a lead (`crm.lead.add`) with name, phone, specialist, date/time, Telegram, comment.
- **Google Calendar**: `buildGoogleCalUrl()` generates a deep-link shown on the confirmation screen.

## Assets

- `assets/anastasia.JPG` — colour photo of Анастасия Сергеева (specialist 1)
- `assets/olga.JPG` — B&W photo of Ольга Смагина (specialist 2)
- `assets/logo-full.png`, `assets/logo-mark.png`, `assets/telegram-qr.png`
- `fonts/` — HalvarBreit-Rg.ttf, HalvarBreit-Md.ttf, Corvetta.ttf (licensed, do not replace)
