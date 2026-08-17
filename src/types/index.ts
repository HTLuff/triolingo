export type Language = 'spanish' | 'japanese' | 'czech';
export type Mode = 'flashcard' | 'multiple-choice' | 'cloze' | 'typing' | 'sentence-builder' | 'story' | 'quickfire';
export type UserGender = 'male' | 'female';
export type StoryLevel = 'a0' | 'a1' | 'a2';

/** One word/punctuation unit in a story line. */
export interface StoryToken {
  t: string;   // display text at this level
  r?: string;  // Spanish reveal (content words on a0/a1)
  g?: string;  // English gloss (Spanish words on a2)
}

export interface StoryLine {
  speaker?: string;
  en: string;              // natural English meaning of the whole line
  a0: StoryToken[];        // English words, Spanish word order
  a1: StoryToken[];        // key nouns/verbs in Spanish, rest English
  a2: StoryToken[];        // real Spanish
}

export interface StoryChapter {
  id: number;
  title: string;
  lines: StoryLine[];
}

export interface Story {
  id: string;
  title: string;
  blurb: string;
  chapters: StoryChapter[];
}

export interface VocabCard {
  id: string;
  english: string;
  target: string;
  pronunciation?: string;
  category: string;
  level?: number;
  gender?: 'all' | 'male' | 'female';
  cloze?: string;
  tense?: string;
  pronoun?: string;
  note?: string;
}

export interface SessionFilters {
  categories: string[];
  tenses: string[];
  reverse: boolean;
}

export interface SRSData {
  interval: number;       // days until next review
  easeFactor: number;     // 1.3-2.5
  repetitions: number;
  dueDate: string;        // ISO date string
}

export interface CardState extends VocabCard {
  srs: SRSData;
}

export type AppScreen =
  | 'home' | 'gender' | 'mode' | 'level' | 'session' | 'summary'
  | 'story-select' | 'story-reader'
  | 'quickfire-setup' | 'quickfire' | 'quickfire-summary';

export type VerbTense = 'present' | 'preterite' | 'imperfect' | 'future' | 'conditional' | 'subjunctive';
export type VerbPerson = 'yo' | 'tu' | 'el' | 'nosotros' | 'ellos';
/** How the verb behaves: regular, spelling-only change, stem-changing, or fully irregular. */
export type VerbKind = 'regular' | 'spelling' | 'stem' | 'irregular';
/** Which slice of the verb list a quickfire round draws from. */
export type VerbFocus = 'all' | 'tricky' | 'regular';

export interface Verb {
  infinitive: string;
  english: string;
  kind: VerbKind;
  conjugations: Record<VerbTense, Record<VerbPerson, string>>;
}

export interface QuickfirePrompt {
  verb: Verb;
  tense: VerbTense;
  person: VerbPerson;
  answer: string;
  options: string[];
}

export interface QuickfireAnswer {
  prompt: QuickfirePrompt;
  chosen: string;
  correct: boolean;
}

export interface QuickfireConfig {
  tenses: VerbTense[];
  focus: VerbFocus;
}

export interface SessionResult {
  card: VocabCard;
  correct: boolean;
  timeMs: number;
}
