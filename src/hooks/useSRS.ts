import { useCallback } from 'react';
import type { VocabCard, SRSData, CardState } from '../types';
import { getInitialSRS, updateSRS, isDue } from '../utils/srs';
import { useLocalStorage } from './useLocalStorage';

export function useSRS(language: string) {
  const [srsMap, setSrsMap] = useLocalStorage<Record<string, SRSData>>(
    `triolingo_srs_${language}`,
    {}
  );

  const getCardState = useCallback((card: VocabCard): CardState => {
    return {
      ...card,
      srs: srsMap[card.id] ?? getInitialSRS(),
    };
  }, [srsMap]);

  const recordAnswer = useCallback((cardId: string, quality: number) => {
    setSrsMap(prev => {
      const current = prev[cardId] ?? getInitialSRS();
      return { ...prev, [cardId]: updateSRS(current, quality) };
    });
  }, [setSrsMap]);

  const getDueCards = useCallback((cards: VocabCard[]): VocabCard[] => {
    return cards.filter(card => {
      const srs = srsMap[card.id];
      if (!srs) return true; // new card
      return isDue(srs);
    });
  }, [srsMap]);

  const getNewCards = useCallback((cards: VocabCard[]): VocabCard[] => {
    return cards.filter(card => !srsMap[card.id]);
  }, [srsMap]);

  const getCategoryProgress = useCallback((cards: VocabCard[]) => {
    const progress: Record<string, { total: number; mastered: number }> = {};
    cards.forEach(card => {
      if (!progress[card.category]) progress[card.category] = { total: 0, mastered: 0 };
      progress[card.category].total++;
      const srs = srsMap[card.id];
      if (srs && srs.interval >= 7) progress[card.category].mastered++;
    });
    return progress;
  }, [srsMap]);

  return { getCardState, recordAnswer, getDueCards, getNewCards, srsMap, getCategoryProgress };
}
