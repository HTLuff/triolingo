import type { SRSData } from '../types';

export function getInitialSRS(): SRSData {
  return {
    interval: 1,
    easeFactor: 2.5,
    repetitions: 0,
    dueDate: new Date().toISOString(),
  };
}

// quality: 0-5 (0-2 = fail, 3-5 = pass)
export function updateSRS(srs: SRSData, quality: number): SRSData {
  let { interval, easeFactor, repetitions } = srs;

  if (quality >= 3) {
    if (repetitions === 0) interval = 1;
    else if (repetitions === 1) interval = 6;
    else interval = Math.round(interval * easeFactor);
    repetitions += 1;
  } else {
    repetitions = 0;
    interval = 1;
  }

  easeFactor = Math.max(1.3, easeFactor + 0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));

  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + interval);

  return { interval, easeFactor, repetitions, dueDate: dueDate.toISOString() };
}

export function isDue(srs: SRSData): boolean {
  return new Date(srs.dueDate) <= new Date();
}

export function getDaysUntilDue(srs: SRSData): number {
  const now = new Date();
  const due = new Date(srs.dueDate);
  return Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}
