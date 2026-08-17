import type { Verb, VerbTense, VerbPerson, VerbFocus, QuickfirePrompt } from '../types';

export const PERSONS: VerbPerson[] = ['yo', 'tu', 'el', 'nosotros', 'ellos'];

export const personLabels: Record<VerbPerson, string> = {
  yo: 'yo',
  tu: 'tú',
  el: 'él / ella',
  nosotros: 'nosotros',
  ellos: 'ellos / ellas',
};

export const tenseLabels: Record<VerbTense, string> = {
  present: 'Present',
  preterite: 'Preterite',
  imperfect: 'Imperfect',
  future: 'Future',
  conditional: 'Conditional',
  subjunctive: 'Subjunctive',
};

export const tenseHints: Record<VerbTense, string> = {
  present: 'I speak',
  preterite: 'I spoke',
  imperfect: 'I used to speak',
  future: 'I will speak',
  conditional: 'I would speak',
  subjunctive: '…that I speak',
};

export const ALL_TENSES: VerbTense[] = ['present', 'preterite', 'imperfect', 'future', 'conditional', 'subjunctive'];

export const ROUND_SECONDS = 60;

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

export function filterVerbs(verbs: Verb[], focus: VerbFocus): Verb[] {
  if (focus === 'tricky') return verbs.filter(v => v.kind === 'stem' || v.kind === 'irregular');
  if (focus === 'regular') return verbs.filter(v => v.kind === 'regular' || v.kind === 'spelling');
  return verbs;
}

/**
 * Build one prompt. Distractors are drawn nearest-first — other people of the same
 * verb+tense, then the same slot in other tenses, then other verbs — so the wrong
 * options are the forms you'd actually confuse, not random noise.
 */
export function buildPrompt(verbs: Verb[], tenses: VerbTense[], recentIds: string[] = []): QuickfirePrompt {
  const pool = verbs.length > 0 ? verbs : [];
  let verb = pick(pool);
  let tense = pick(tenses);
  let person = pick(PERSONS);

  // avoid immediate repeats while there's enough variety to do so
  for (let tries = 0; tries < 8 && recentIds.includes(`${verb.infinitive}|${tense}|${person}`); tries++) {
    verb = pick(pool);
    tense = pick(tenses);
    person = pick(PERSONS);
  }

  const answer = verb.conjugations[tense][person];

  const nearMisses = PERSONS.filter(p => p !== person).map(p => verb.conjugations[tense][p]);
  const otherTenses = ALL_TENSES.filter(t => t !== tense).map(t => verb.conjugations[t][person]);
  const otherVerbs = shuffle(pool).slice(0, 8).map(v => v.conjugations[tense][person]);

  const options = [answer];
  for (const candidate of [...shuffle(nearMisses), ...shuffle(otherTenses), ...otherVerbs]) {
    if (options.length >= 4) break;
    if (!options.includes(candidate)) options.push(candidate);
  }

  return { verb, tense, person, answer, options: shuffle(options) };
}
