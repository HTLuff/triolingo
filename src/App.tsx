import { useState, useCallback, useMemo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import type { Language, Mode, AppScreen, SessionResult, VocabCard, UserGender, SessionFilters } from './types';
import { useSRS } from './hooks/useSRS';
import { useLocalStorage } from './hooks/useLocalStorage';
import LanguageSelector from './components/LanguageSelector';
import ModeSelector from './components/ModeSelector';
import GenderSelector from './components/GenderSelector';
import FlashCard from './components/FlashCard';
import MultipleChoice from './components/MultipleChoice';
import ClozeCard from './components/ClozeCard';
import TypingCard from './components/TypingCard';
import ProgressBar from './components/ProgressBar';
import ReviewSummary from './components/ReviewSummary';

import spanishData from './data/spanish.json';
import japaneseData from './data/japanese.json';
import czechData from './data/czech.json';

const vocabMap: Record<Language, VocabCard[]> = {
  spanish: spanishData as VocabCard[],
  japanese: japaneseData as VocabCard[],
  czech: czechData as VocabCard[],
};

const SESSION_SIZE = 10;

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function App() {
  const [screen, setScreen] = useState<AppScreen>('home');
  const [language, setLanguage] = useState<Language>('spanish');
  const [mode, setMode] = useState<Mode>('flashcard');
  const [filters, setFilters] = useState<SessionFilters>({ categories: [], tenses: [], reverse: false });

  // Session state
  const [sessionCards, setSessionCards] = useState<VocabCard[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [results, setResults] = useState<SessionResult[]>([]);
  const [cardStartTime, setCardStartTime] = useState(Date.now());

  // Persistence
  const [streak, setStreak] = useLocalStorage<number>('triolingo_streak', 0);
  const [lastPracticed, setLastPracticed] = useLocalStorage<string>('triolingo_last_practiced', '');
  const [, setTotalLearned] = useLocalStorage<number>('triolingo_total_learned', 0);
  const [userGender, setUserGender] = useLocalStorage<UserGender>('triolingo_gender', 'male');

  void streak;

  const srs = useSRS(language);

  const allCards = useMemo(() => vocabMap[language], [language]);

  function applyFilters(cards: VocabCard[], gender: UserGender, f: SessionFilters, m: Mode): VocabCard[] {
    let filtered = cards.filter(c =>
      (!c.gender || c.gender === 'all' || c.gender === gender) &&
      (f.categories.length === 0 || f.categories.includes(c.category)) &&
      (f.tenses.length === 0 || !c.tense || f.tenses.includes(c.tense))
    );
    if (m === 'cloze') filtered = filtered.filter(c => !!c.cloze);
    return filtered;
  }

  const buildSession = useCallback((lang: Language, currentSrs: ReturnType<typeof useSRS>, gender: UserGender, f: SessionFilters, m: Mode): VocabCard[] => {
    const cards = vocabMap[lang];
    const filteredCards = applyFilters(cards, gender, f, m);
    if (filteredCards.length === 0) return shuffle(applyFilters(cards, gender, { categories: [], tenses: [], reverse: f.reverse }, m)).slice(0, SESSION_SIZE);
    const due = currentSrs.getDueCards(filteredCards);
    const deck = due.length > 0 ? shuffle(due).slice(0, SESSION_SIZE) : shuffle(filteredCards).slice(0, SESSION_SIZE);
    return deck;
  }, []);

  function handleSelectLanguage(lang: Language) {
    setLanguage(lang);
    setFilters({ categories: [], tenses: [], reverse: false });
    if (lang === 'japanese') setScreen('gender');
    else setScreen('mode');
  }

  function handleSelectGender(gender: UserGender) {
    setUserGender(gender);
    setScreen('mode');
  }

  function handleSelectMode(m: Mode) {
    setMode(m);
    const deck = buildSession(language, srs, userGender, filters, m);
    setSessionCards(deck);
    setCurrentIdx(0);
    setResults([]);
    setCardStartTime(Date.now());
    setScreen('session');
  }

  function updateStreak() {
    const today = new Date().toDateString();
    const yesterday = new Date(Date.now() - 86400000).toDateString();
    if (lastPracticed === today) return;
    setStreak(prev => (lastPracticed === yesterday ? prev + 1 : 1));
    setLastPracticed(today);
  }

  function advanceSession(newResults: SessionResult[], correct: boolean) {
    if (correct) setTotalLearned(t => t + 1);
    setResults(newResults);
    if (currentIdx + 1 >= sessionCards.length) {
      updateStreak();
      setScreen('summary');
    } else {
      setCurrentIdx(i => i + 1);
      setCardStartTime(Date.now());
    }
  }

  function handleFlashcardResult(correct: boolean) {
    const card = sessionCards[currentIdx];
    srs.recordAnswer(card.id, correct ? 4 : 1);
    advanceSession([...results, { card, correct, timeMs: Date.now() - cardStartTime }], correct);
  }

  function handleMCResult(correct: boolean, timeMs: number) {
    const card = sessionCards[currentIdx];
    srs.recordAnswer(card.id, correct ? (timeMs < 5000 ? 5 : 4) : 1);
    advanceSession([...results, { card, correct, timeMs }], correct);
  }

  function handleClozeResult(correct: boolean, timeMs: number) {
    const card = sessionCards[currentIdx];
    srs.recordAnswer(card.id, correct ? (timeMs < 5000 ? 5 : 4) : 1);
    advanceSession([...results, { card, correct, timeMs }], correct);
  }

  function handleTypingResult(correct: boolean, timeMs: number) {
    const card = sessionCards[currentIdx];
    srs.recordAnswer(card.id, correct ? (timeMs < 8000 ? 5 : 4) : 1);
    advanceSession([...results, { card, correct, timeMs }], correct);
  }

  function handleRestart() {
    const deck = buildSession(language, srs, userGender, filters, mode);
    setSessionCards(deck);
    setCurrentIdx(0);
    setResults([]);
    setCardStartTime(Date.now());
    setScreen('session');
  }

  const dueCount = useMemo(() => {
    const cards = vocabMap[language];
    const filteredCards = applyFilters(cards, userGender, filters, mode);
    return srs.getDueCards(filteredCards.length > 0 ? filteredCards : cards.filter(c => !c.gender || c.gender === 'all' || c.gender === userGender)).length;
  }, [language, srs, userGender, filters, mode]);

  const availableCategories = useMemo(() => {
    const cards = vocabMap[language].filter(c => !c.gender || c.gender === 'all' || c.gender === userGender);
    return [...new Set(cards.map(c => c.category))].sort();
  }, [language, userGender]);

  const availableTenses = useMemo(() => {
    if (language !== 'spanish') return [];
    const cards = vocabMap[language];
    return [...new Set(cards.map(c => c.tense).filter(Boolean) as string[])].sort();
  }, [language]);

  const categoryProgress = useMemo(() => {
    const cards = vocabMap[language].filter(c => !c.gender || c.gender === 'all' || c.gender === userGender);
    return srs.getCategoryProgress(cards);
  }, [language, userGender, srs]);

  const currentCard = sessionCards[currentIdx];

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-purple-900 to-slate-900">
      <AnimatePresence mode="wait">
        {screen === 'home' && (
          <motion.div key="home" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, x: -40 }}>
            <LanguageSelector onSelect={handleSelectLanguage} />
          </motion.div>
        )}

        {screen === 'gender' && (
          <motion.div key="gender" initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }}>
            <GenderSelector onSelect={handleSelectGender} onBack={() => setScreen('home')} />
          </motion.div>
        )}

        {screen === 'mode' && (
          <motion.div key="mode" initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }}>
            <ModeSelector
              language={language}
              dueCount={dueCount}
              availableCategories={availableCategories}
              availableTenses={availableTenses}
              filters={filters}
              onFiltersChange={setFilters}
              categoryProgress={categoryProgress}
              onSelect={handleSelectMode}
              onBack={() => language === 'japanese' ? setScreen('gender') : setScreen('home')}
            />
          </motion.div>
        )}

        {screen === 'session' && currentCard && (
          <motion.div
            key="session"
            initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }}
            className="min-h-screen flex flex-col"
          >
            <ProgressBar current={currentIdx} total={sessionCards.length} onBack={() => setScreen('mode')} />
            <div className="flex-1 flex flex-col items-center justify-start pt-24 pb-8">
              <AnimatePresence mode="wait">
                {mode === 'flashcard' ? (
                  <motion.div
                    key={`fc-${currentCard.id}`}
                    initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.88, x: -30 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 28 }}
                    className="w-full max-w-md px-0"
                  >
                    <FlashCard card={currentCard} language={language} reverse={filters.reverse} onResult={handleFlashcardResult} />
                  </motion.div>
                ) : mode === 'multiple-choice' ? (
                  <motion.div
                    key={`mc-${currentCard.id}`}
                    initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.88, x: -30 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 28 }}
                    className="w-full max-w-md"
                  >
                    <MultipleChoice card={currentCard} allCards={allCards} language={language} reverse={filters.reverse} onResult={handleMCResult} />
                  </motion.div>
                ) : mode === 'cloze' ? (
                  <motion.div
                    key={`cz-${currentCard.id}`}
                    initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.88, x: -30 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 28 }}
                    className="w-full max-w-md"
                  >
                    <ClozeCard card={currentCard} allCards={allCards} language={language} onResult={handleClozeResult} />
                  </motion.div>
                ) : (
                  <motion.div
                    key={`ty-${currentCard.id}`}
                    initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.88, x: -30 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 28 }}
                    className="w-full max-w-md"
                  >
                    <TypingCard card={currentCard} reverse={filters.reverse} onResult={handleTypingResult} />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}

        {screen === 'summary' && (
          <motion.div key="summary" initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}>
            <ReviewSummary results={results} onRestart={handleRestart} onHome={() => setScreen('home')} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
