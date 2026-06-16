# Triolingo

A mobile-first language learning app using spaced repetition and active recall. Built with React, TypeScript, Tailwind CSS, and Framer Motion.

## Features

- **Two modes** — flashcard (3D flip) and multiple choice
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

## Stack

- [Vite](https://vitejs.dev) + React 18 + TypeScript
- [Tailwind CSS v4](https://tailwindcss.com) (via `@tailwindcss/vite`)
- [Framer Motion](https://www.framer.com/motion/)
