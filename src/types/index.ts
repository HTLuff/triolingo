export type Language = 'spanish' | 'japanese' | 'czech' | 'german';
export type Mode =
  | 'flashcard' | 'multiple-choice' | 'cloze' | 'typing' | 'sentence-builder'
  | 'story' | 'quickfire' | 'noun-gender' | 'cases';
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
  | 'quickfire-setup' | 'rapid-round' | 'rapid-summary';

/**
 * Tense and person ids are plain strings because each language brings its own set
 * — Spanish has `present`/`yo`, German has `praesens`/`ich`. The labels and the
 * available ids live in the language config, so adding a language is data, not code.
 */
export type VerbTenseId = string;
export type VerbPersonId = string;

/** How the verb behaves. Drives the regular/tricky filter on the setup screen. */
export type VerbKind =
  | 'regular' | 'spelling' | 'stem' | 'irregular'   // Spanish
  | 'strong' | 'mixed' | 'modal' | 'separable';     // German
/** Which slice of the verb list a round draws from. */
export type VerbFocus = 'all' | 'tricky' | 'regular';

export interface Verb {
  infinitive: string;
  english: string;
  kind: VerbKind;
  conjugations: Record<VerbTenseId, Record<VerbPersonId, string>>;
}

/** A German noun, for the der/die/das drill. */
export interface Noun {
  word: string;
  english: string;
  gender: 'der' | 'die' | 'das';
  plural: string;
  category: string;
}

/** One fill-the-article frame, for the case drill. */
export interface CaseFrame {
  id: string;
  sentence: string;        // contains ___ where the article goes
  english: string;
  answer: string;
  case: 'nominative' | 'accusative' | 'dative';
  trigger?: string;        // the preposition or verb that forces the case
}

/**
 * One question in a timed round. Verbs, noun gender and case frames all reduce to
 * this shape, so the round and summary screens don't care which drill produced it.
 */
export interface RapidPrompt {
  id: string;
  main: string;            // the big text: an infinitive, a noun, a sentence frame
  sub?: string;            // English gloss under it
  chips: string[];         // context pills: person, tense, case…
  answer: string;
  options: string[];
  note?: string;           // extra detail revealed after answering (plural, trigger word)
}

export interface RapidAnswer {
  prompt: RapidPrompt;
  chosen: string;
  correct: boolean;
}

export interface QuickfireConfig {
  tenses: VerbTenseId[];
  focus: VerbFocus;
}

export interface SessionResult {
  card: VocabCard;
  correct: boolean;
  timeMs: number;
}
