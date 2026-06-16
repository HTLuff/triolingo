import { useState, useCallback, useMemo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import type { Language, Mode, AppScreen, SessionResult, VocabCard, UserGender } from './types';
import { useSRS } from './hooks/useSRS';
import { useLocalStorage } from './hooks/useLocalStorage';
import LanguageSelector from './components/LanguageSelector';
import ModeSelector from './components/ModeSelector';
import GenderSelector from './components/GenderSelector';
import FlashCard from './components/FlashCard';
import MultipleChoice from './components/MultipleChoice';
import ProgressBar from './components/ProgressBar';
import ReviewSummary from './components/ReviewSummary';

import spanishData from './data/spanish.json';
import japaneseData from './data/japanese.json';

const vocabMap: Record<Language, VocabCard[]> = {
  spanish: spanishData as VocabCard[],
  japanese: japaneseData as VocabCard[],
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

  // Silence unused var warning — streak is read by LanguageSelector via localStorage directly
  void streak;

  const srs = useSRS(language);

  const allCards = useMemo(() => vocabMap[language], [language]);

  // Build session deck with gender filtering
  const buildSession = useCallback((lang: Language, currentSrs: ReturnType<typeof useSRS>, gender: UserGender): VocabCard[] => {
    const cards = vocabMap[lang];
    const filteredCards = cards.filter(c => !c.gender || c.gender === 'all' || c.gender === gender);
    const due = currentSrs.getDueCards(filteredCards);
    let deck: VocabCard[] = [];
    if (due.length > 0) {
      deck = shuffle(due).slice(0, SESSION_SIZE);
    } else {
      deck = shuffle(filteredCards).slice(0, SESSION_SIZE);
    }
    return deck;
  }, []);

  function handleSelectLanguage(lang: Language) {
    setLanguage(lang);
    if (lang === 'japanese') {
      setScreen('gender');
    } else {
      setScreen('mode');
    }
  }

  function handleSelectGender(gender: UserGender) {
    setUserGender(gender);
    setScreen('mode');
  }

  function handleSelectMode(m: Mode) {
    setMode(m);
    const deck = buildSession(language, srs, userGender);
    setSessionCards(deck);
    setCurrentIdx(0);
    setResults([]);
    setCardStartTime(Date.now());
    setScreen('session');
  }

  function updateStreak() {
    const today = new Date().toDateString();
    const yesterday = new Date(Date.now() - 86400000).toDateString();
    if (lastPracticed === today) return; // already counted today
    setStreak(prev => {
      if (lastPracticed === yesterday) return prev + 1;
      return 1;
    });
    setLastPracticed(today);
  }

  function advanceSession(newResults: SessionResult[], correct: boolean) {
    if (correct) {
      setTotalLearned(t => t + 1);
    }

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
    const quality = correct ? 4 : 1;
    srs.recordAnswer(card.id, quality);

    const result: SessionResult = { card, correct, timeMs: Date.now() - cardStartTime };
    advanceSession([...results, result], correct);
  }

  function handleMCResult(correct: boolean, timeMs: number) {
    const card = sessionCards[currentIdx];
    const quality = correct ? (timeMs < 5000 ? 5 : 4) : 1;
    srs.recordAnswer(card.id, quality);

    const result: SessionResult = { card, correct, timeMs };
    advanceSession([...results, result], correct);
  }

  function handleRestart() {
    const deck = buildSession(language, srs, userGender);
    setSessionCards(deck);
    setCurrentIdx(0);
    setResults([]);
    setCardStartTime(Date.now());
    setScreen('session');
  }

  // Due cards count for mode selector
  const dueCount = useMemo(() => {
    const cards = vocabMap[language];
    const filteredCards = cards.filter(c => !c.gender || c.gender === 'all' || c.gender === userGender);
    return srs.getDueCards(filteredCards).length;
  }, [language, srs, userGender]);

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
            <GenderSelector
              onSelect={handleSelectGender}
              onBack={() => setScreen('home')}
            />
          </motion.div>
        )}

        {screen === 'mode' && (
          <motion.div key="mode" initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }}>
            <ModeSelector
              language={language}
              dueCount={dueCount}
              onSelect={handleSelectMode}
              onBack={() => language === 'japanese' ? setScreen('gender') : setScreen('home')}
            />
          </motion.div>
        )}

        {screen === 'session' && currentCard && (
          <motion.div
            key="session"
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }}
            className="min-h-screen flex flex-col"
          >
            <ProgressBar current={currentIdx} total={sessionCards.length} onBack={() => setScreen('mode')} />
            <div className="flex-1 flex flex-col items-center justify-start pt-24 pb-8">
              <AnimatePresence mode="wait">
                {mode === 'flashcard' ? (
                  <motion.div
                    key={`fc-${currentCard.id}`}
                    initial={{ opacity: 0, scale: 0.92 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.88, x: -30 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 28 }}
                    className="w-full max-w-md px-0"
                  >
                    <FlashCard
                      card={currentCard}
                      language={language}
                      onResult={handleFlashcardResult}
                    />
                  </motion.div>
                ) : (
                  <motion.div
                    key={`mc-${currentCard.id}`}
                    initial={{ opacity: 0, scale: 0.92 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.88, x: -30 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 28 }}
                    className="w-full max-w-md"
                  >
                    <MultipleChoice
                      card={currentCard}
                      allCards={allCards}
                      language={language}
                      onResult={handleMCResult}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}

        {screen === 'summary' && (
          <motion.div key="summary" initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}>
            <ReviewSummary
              results={results}
              onRestart={handleRestart}
              onHome={() => setScreen('home')}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
