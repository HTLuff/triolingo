import type { Verb, VerbFocus, Noun, CaseFrame, RapidPrompt, VerbTenseId } from '../types';
import type { LabelledId } from '../config/languages';

export const ROUND_SECONDS = 60;

/** Kinds that count as "regular" for the verb focus filter; everything else is tricky. */
const REGULAR_KINDS = ['regular', 'spelling'];

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Fill an options list up to `size` from candidates, nearest-miss first, skipping duplicates. */
function withDistractors(answer: string, candidates: string[][], size: number): string[] {
  const options = [answer];
  for (const tier of candidates) {
    for (const candidate of shuffle(tier)) {
      if (options.length >= size) break;
      if (!options.includes(candidate)) options.push(candidate);
    }
  }
  return shuffle(options);
}

/** Try up to 8 times to avoid a prompt the learner just saw. */
function fresh<T extends { id: string }>(make: () => T, recentIds: string[]): T {
  let out = make();
  for (let i = 0; i < 8 && recentIds.includes(out.id); i++) out = make();
  return out;
}

export function filterVerbs(verbs: Verb[], focus: VerbFocus): Verb[] {
  if (focus === 'regular') return verbs.filter(v => REGULAR_KINDS.includes(v.kind));
  if (focus === 'tricky') return verbs.filter(v => !REGULAR_KINDS.includes(v.kind));
  return verbs;
}

/**
 * Conjugation prompt. Distractors are drawn nearest-first — other people of the
 * same verb and tense, then the same slot in other tenses, then other verbs — so
 * the wrong options are the forms you'd actually confuse.
 */
export function buildVerbPrompt(
  verbs: Verb[],
  tenses: VerbTenseId[],
  persons: LabelledId[],
  tenseLabels: LabelledId[],
  recentIds: string[] = [],
): RapidPrompt {
  return fresh(() => {
    const verb = pick(verbs);
    const tense = pick(tenses);
    const person = pick(persons);
    const answer = verb.conjugations[tense]?.[person.id] ?? '';

    const samePersonTenses = Object.keys(verb.conjugations)
      .filter(t => t !== tense)
      .map(t => verb.conjugations[t][person.id]);

    return {
      id: `${verb.infinitive}|${tense}|${person.id}`,
      main: verb.infinitive,
      sub: verb.english,
      chips: [person.label, tenseLabels.find(t => t.id === tense)?.label ?? tense],
      answer,
      options: withDistractors(answer, [
        persons.filter(p => p.id !== person.id).map(p => verb.conjugations[tense][p.id]),
        samePersonTenses,
        shuffle(verbs).slice(0, 8).map(v => v.conjugations[tense]?.[person.id] ?? ''),
      ], 4),
    };
  }, recentIds);
}

/** der / die / das. Only three options exist, so the whole article set is always shown. */
export function buildGenderPrompt(nouns: Noun[], recentIds: string[] = []): RapidPrompt {
  return fresh(() => {
    const noun = pick(nouns);
    return {
      id: `noun|${noun.word}`,
      main: noun.word,
      sub: noun.english,
      chips: [noun.category],
      answer: noun.gender,
      options: ['der', 'die', 'das'],
      note: `${noun.gender} ${noun.word} · plural: die ${noun.plural}`,
    };
  }, recentIds);
}

const CASE_LABELS: Record<CaseFrame['case'], string> = {
  nominative: 'Nominativ',
  accusative: 'Akkusativ',
  dative: 'Dativ',
};

/**
 * Case frames come with a fixed distractor set built from the other forms of the
 * same article — the point is choosing between den/dem/der, not recognising a word.
 */
export function buildCasePrompt(frames: CaseFrame[], recentIds: string[] = []): RapidPrompt {
  return fresh(() => {
    const frame = pick(frames);
    const family = ARTICLE_FAMILIES.find(f => f.includes(frame.answer)) ?? ARTICLE_FAMILIES[0];
    return {
      id: `case|${frame.id}`,
      main: frame.sentence.replace('___', '＿'),
      sub: frame.english,
      chips: [CASE_LABELS[frame.case], ...(frame.trigger ? [frame.trigger] : [])],
      answer: frame.answer,
      options: withDistractors(frame.answer, [family.filter(a => a !== frame.answer)], 4),
      note: frame.sentence.replace('___', frame.answer),
    };
  }, recentIds);
}

/** Article sets a wrong answer plausibly comes from. */
const ARTICLE_FAMILIES: string[][] = [
  ['der', 'die', 'das', 'den', 'dem'],
  ['ein', 'eine', 'einen', 'einem', 'einer'],
  ['mein', 'meine', 'meinen', 'meinem', 'meiner'],
  ['kein', 'keine', 'keinen', 'keinem', 'keiner'],
];
