export type Language = 'spanish' | 'japanese';
export type Mode = 'flashcard' | 'multiple-choice' | 'cloze';
export type UserGender = 'male' | 'female';

export interface VocabCard {
  id: string;
  english: string;
  target: string;
  pronunciation?: string;
  category: string;
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

export type AppScreen = 'home' | 'gender' | 'mode' | 'session' | 'summary';

export interface SessionResult {
  card: VocabCard;
  correct: boolean;
  timeMs: number;
}
