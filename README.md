# Triolingo

A mobile-first language learning app using spaced repetition and active recall. Built with React, TypeScript, Tailwind CSS, and Framer Motion.

## Features

- **Four languages** — Spanish and German (full modes), Japanese and Czech (core modes)
- **Nine study modes** — flashcards, multiple choice, timed conjugation drills, story mode,
  sentence builder, fill-the-blank, typing, plus der/die/das and case drills for German
- **Spaced repetition** — SM-2 algorithm, progress stored in localStorage
- **Pronunciation guides** — phonetic hints shown on every card
- **Japanese gendered speech** — separate casual expressions for male/female speech patterns
- **Duolingo-style animations** — shake on wrong, spring transitions, XP progress bar, heart system
- **Mobile-first** — designed for 390px viewport, works on desktop too

## Getting started

```bash
npm install
```

Copy the example vocabulary files and rename them:

```bash
cp src/data/spanish.example.json src/data/spanish.json
cp src/data/german.example.json src/data/german.json
cp src/data/japanese.example.json src/data/japanese.json
```

Then fill them with your own sentences (see structure below), and run:

```bash
npm run dev
```

## Vocabulary file structure

Each file is a JSON array of cards:

```json
[
  {
    "id": "es_001",
    "english": "The bill, please",
    "target": "La cuenta, por favor",
    "pronunciation": "lah KWEN-tah por fah-BOR",
    "category": "food"
  }
]
```

Japanese cards support a `gender` field for gendered casual speech:

```json
[
  {
    "id": "ja_001",
    "english": "Excuse me",
    "target": "すみません",
    "pronunciation": "soo-mee-mah-sen",
    "category": "basics",
    "gender": "all"
  },
  {
    "id": "ja_002",
    "english": "I'm starving (casual, male)",
    "target": "腹減った",
    "pronunciation": "hah-rah het-tah",
    "category": "expressions",
    "gender": "male"
  }
]
```

| Field | Required | Notes |
|---|---|---|
| `id` | yes | unique string |
| `english` | yes | prompt shown to the user |
| `target` | yes | translation in the target language |
| `pronunciation` | no | phonetic guide shown under the target |
| `category` | yes | groups cards (displayed as a badge) |
| `gender` | no | Japanese only: `"all"` \| `"male"` \| `"female"` |

## Languages

Spanish and German get the full set of modes; Japanese and Czech are flashcards and multiple
choice only. What a language offers lives in one place — `src/config/languages.ts` — including
its mode list, levels, tense labels and the persons/tenses its conjugation drill uses. Adding a
mode to a language is a line of config, not a new branch in the components.

German additionally has two drills Spanish doesn't need:

- **der / die / das** — noun gender against the clock, from `src/data/german-nouns.json`
- **Cases** — pick the right article for the case, from `src/data/german-cases.json`, including
  two-way prepositions so `in die Küche` (motion) contrasts with `in der Küche` (location)

All three timed drills — Quickfire, der/die/das and Cases — run on the same 60-second round
(`RapidRound`) and reduce to the same `RapidPrompt` shape, so the round and summary screens don't
know which drill produced a question.

## Generated data

Four data files are **generated**. Edit the script and regenerate — don't hand-edit the JSON:

```bash
python3 scripts/generate-verbs-es.py   # src/data/spanish-verbs.json   (73 verbs, 2190 forms)
python3 scripts/generate-verbs-de.py   # src/data/german-verbs.json    (90 verbs, 2700 forms)
python3 scripts/generate-story-de.py   # src/data/stories/cafe-muenchen.json
```

Adding a verb is usually one line in the script's `V` list. Regular endings and the predictable
spelling shifts are handled by rule; irregular verbs take small per-verb overrides, all documented
at the top of each script. Each script prints every form it produces — **read that output before
committing**, since every form is shown to a learner as a correct answer.

The `kind` field drives the verb filter on the Quickfire setup screen: `regular`/`spelling` appear
under "Regular only", everything else under "Tricky only".

The story generator is worth a note: each line is authored **once**, as tokens in German word
order, and the three reading levels are derived from it. That keeps a0's word order from drifting
away from a2's, and means a0 teaches word order before the learner meets a single German word —
"Every morning opens Lena at seven" is the verb-second rule in English clothing.

## Stack

- [Vite](https://vitejs.dev) + React 18 + TypeScript
- [Tailwind CSS v4](https://tailwindcss.com) (via `@tailwindcss/vite`)
- [Framer Motion](https://www.framer.com/motion/)
