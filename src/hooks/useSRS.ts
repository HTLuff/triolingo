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

  return { getCardState, recordAnswer, getDueCards, getNewCards, srsMap };
}
