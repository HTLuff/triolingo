import type { Language, Mode, StoryLevel, VerbTenseId, VerbPersonId } from '../types';

/** A level of the sentence deck (Spanish and German split their cards by level). */
export interface LevelInfo {
  id: number;
  label: string;
  sublabel: string;
  desc: string;
  color: string;
  border: string;
  dot: string;
}

export interface LabelledId<T extends string = string> {
  id: T;
  label: string;
  hint?: string;
}

export interface LanguageConfig {
  id: Language;
  flag: string;
  /** Native name, shown as the heading. */
  name: string;
  /** English name, used in instructions like "Translate into German". */
  english: string;
  /** Card styling on the home screen. */
  home: { count: string; bg: string; border: string; countColor: string };
  /** Modes offered for this language, in display order. */
  modes: Mode[];
  levels: LevelInfo[];
  /** Labels for the `tense` field on vocab cards, used by the session filters. */
  tenseLabels: Record<string, string>;
  /** Reading-level descriptions in story mode. */
  storyLevelDesc: Record<StoryLevel, string>;
  /** Conjugation drill setup — empty when the language has no verb data. */
  verbTenses: LabelledId<VerbTenseId>[];
  verbPersons: LabelledId<VerbPersonId>[];
}

const CORE_MODES: Mode[] = ['flashcard', 'multiple-choice'];

const FULL_MODES: Mode[] = [
  'flashcard', 'multiple-choice', 'quickfire', 'story',
  'sentence-builder', 'cloze', 'typing',
];

export const LANGUAGES: Record<Language, LanguageConfig> = {
  spanish: {
    id: 'spanish',
    flag: '🇪🇸',
    name: 'Español',
    english: 'Spanish',
    home: {
      count: '95 sentences',
      bg: 'linear-gradient(135deg, rgba(239,68,68,0.35) 0%, rgba(234,179,8,0.28) 100%)',
      border: '1.5px solid rgba(250,204,21,0.55)',
      countColor: 'text-yellow-300',
    },
    modes: FULL_MODES,
    levels: [
      { id: 1, label: 'Level 1', sublabel: 'A1 / A2', desc: 'Present, preterite, everyday phrases',
        color: 'from-emerald-500/20 to-teal-500/20', border: 'border-emerald-400/30', dot: 'bg-emerald-400' },
      { id: 2, label: 'Level 2', sublabel: 'B1', desc: 'Imperfect, conditional, future, perfect',
        color: 'from-violet-500/20 to-purple-500/20', border: 'border-violet-400/30', dot: 'bg-violet-400' },
    ],
    tenseLabels: {
      'present': 'Present',
      'present-continuous': 'Pres. cont.',
      'present-perfect': 'Pres. perfect',
      'preterite': 'Preterite',
      'imperfect': 'Imperfect',
      'future': 'Ir a...',
      'future-simple': 'Future',
      'conditional': 'Conditional',
      'imperative': 'Imperative',
      'expression': 'Expressions',
    },
    storyLevelDesc: {
      a0: 'English words, Spanish order',
      a1: 'Key words in Spanish',
      a2: 'Real Spanish',
    },
    verbTenses: [
      { id: 'present', label: 'Present', hint: 'I speak' },
      { id: 'preterite', label: 'Preterite', hint: 'I spoke' },
      { id: 'imperfect', label: 'Imperfect', hint: 'I used to speak' },
      { id: 'future', label: 'Future', hint: 'I will speak' },
      { id: 'conditional', label: 'Conditional', hint: 'I would speak' },
      { id: 'subjunctive', label: 'Subjunctive', hint: '…that I speak' },
    ],
    verbPersons: [
      { id: 'yo', label: 'yo' },
      { id: 'tu', label: 'tú' },
      { id: 'el', label: 'él / ella' },
      { id: 'nosotros', label: 'nosotros' },
      { id: 'ellos', label: 'ellos / ellas' },
    ],
  },

  german: {
    id: 'german',
    flag: '🇩🇪',
    name: 'Deutsch',
    english: 'German',
    home: {
      count: '100 sentences',
      bg: 'linear-gradient(135deg, rgba(24,24,27,0.55) 0%, rgba(234,179,8,0.28) 100%)',
      border: '1.5px solid rgba(250,204,21,0.5)',
      countColor: 'text-amber-300',
    },
    // der/die/das and the case drill are German-only, and sit next to Quickfire
    modes: [
      'flashcard', 'multiple-choice', 'quickfire', 'noun-gender', 'cases',
      'story', 'sentence-builder', 'cloze', 'typing',
    ],
    levels: [
      { id: 1, label: 'Level 1', sublabel: 'A1 / A2', desc: 'Präsens, Perfekt, everyday phrases',
        color: 'from-emerald-500/20 to-teal-500/20', border: 'border-emerald-400/30', dot: 'bg-emerald-400' },
      { id: 2, label: 'Level 2', sublabel: 'B1', desc: 'Präteritum, Konjunktiv II, modals, cases',
        color: 'from-violet-500/20 to-purple-500/20', border: 'border-violet-400/30', dot: 'bg-violet-400' },
    ],
    tenseLabels: {
      'present': 'Präsens',
      'perfect': 'Perfekt',
      'preterite': 'Präteritum',
      'future': 'Futur',
      'conditional': 'Konjunktiv II',
      'imperative': 'Imperativ',
      'modal': 'Modals',
      'expression': 'Expressions',
    },
    storyLevelDesc: {
      a0: 'English words, German order',
      a1: 'Key words in German',
      a2: 'Real German',
    },
    verbTenses: [
      { id: 'praesens', label: 'Präsens', hint: 'ich spreche' },
      { id: 'praeteritum', label: 'Präteritum', hint: 'ich sprach' },
      { id: 'perfekt', label: 'Perfekt', hint: 'ich habe gesprochen' },
      { id: 'futur', label: 'Futur I', hint: 'ich werde sprechen' },
      { id: 'konjunktiv2', label: 'Konjunktiv II', hint: 'ich würde sprechen' },
    ],
    verbPersons: [
      { id: 'ich', label: 'ich' },
      { id: 'du', label: 'du' },
      { id: 'er', label: 'er / sie / es' },
      { id: 'wir', label: 'wir' },
      { id: 'ihr', label: 'ihr' },
      { id: 'sie', label: 'sie / Sie' },
    ],
  },

  japanese: {
    id: 'japanese',
    flag: '🇯🇵',
    name: '日本語',
    english: 'Japanese',
    home: {
      count: '100 sentences',
      bg: 'linear-gradient(135deg, rgba(239,68,68,0.35) 0%, rgba(244,114,182,0.22) 100%)',
      border: '1.5px solid rgba(248,113,113,0.55)',
      countColor: 'text-red-300',
    },
    modes: CORE_MODES,
    levels: [],
    tenseLabels: {},
    storyLevelDesc: { a0: 'English words, Japanese order', a1: 'Key words in Japanese', a2: 'Real Japanese' },
    verbTenses: [],
    verbPersons: [],
  },

  czech: {
    id: 'czech',
    flag: '🇨🇿',
    name: 'Čeština',
    english: 'Czech',
    home: {
      count: '3 sentences',
      bg: 'linear-gradient(135deg, rgba(30,64,175,0.35) 0%, rgba(220,38,38,0.22) 100%)',
      border: '1.5px solid rgba(96,165,250,0.55)',
      countColor: 'text-blue-300',
    },
    modes: CORE_MODES,
    levels: [],
    tenseLabels: {},
    storyLevelDesc: { a0: 'English words, Czech order', a1: 'Key words in Czech', a2: 'Real Czech' },
    verbTenses: [],
    verbPersons: [],
  },
};

/** Home screen order. */
export const LANGUAGE_ORDER: Language[] = ['spanish', 'german', 'japanese', 'czech'];

export function langConfig(language: Language): LanguageConfig {
  return LANGUAGES[language];
}

export function hasLevels(language: Language): boolean {
  return LANGUAGES[language].levels.length > 0;
}
