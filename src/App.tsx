import { useState, useCallback, useMemo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import type {
  Language, Mode, AppScreen, SessionResult, VocabCard, UserGender, SessionFilters,
  Story, StoryLevel, Verb, Noun, CaseFrame, QuickfireConfig, RapidAnswer, RapidPrompt,
} from './types';
import { useSRS } from './hooks/useSRS';
import { useLocalStorage } from './hooks/useLocalStorage';
import LanguageSelector from './components/LanguageSelector';
import ModeSelector from './components/ModeSelector';
import GenderSelector from './components/GenderSelector';
import LevelSelector from './components/LevelSelector';
import FlashCard from './components/FlashCard';
import MultipleChoice from './components/MultipleChoice';
import ClozeCard from './components/ClozeCard';
import TypingCard from './components/TypingCard';
import SentenceBuilder from './components/SentenceBuilder';
import StorySelect from './components/StorySelect';
import StoryReader from './components/StoryReader';
import QuickfireSetup from './components/QuickfireSetup';
import RapidRound from './components/RapidRound';
import RapidSummary from './components/RapidSummary';
import ProgressBar from './components/ProgressBar';
import ReviewSummary from './components/ReviewSummary';
import { filterVerbs, buildVerbPrompt, buildGenderPrompt, buildCasePrompt } from './utils/rapid';
import { langConfig, hasLevels } from './config/languages';

import spanishData from './data/spanish.json';
import germanData from './data/german.json';
import japaneseData from './data/japanese.json';
import czechData from './data/czech.json';
import spanishVerbs from './data/spanish-verbs.json';
import germanVerbs from './data/german-verbs.json';
import germanNouns from './data/german-nouns.json';
import germanCases from './data/german-cases.json';
import cafeMadrid from './data/stories/cafe-madrid.json';
import cafeMuenchen from './data/stories/cafe-muenchen.json';

const vocabMap: Record<Language, VocabCard[]> = {
  spanish: spanishData as VocabCard[],
  german: germanData as VocabCard[],
  japanese: japaneseData as VocabCard[],
  czech: czechData as VocabCard[],
};

const verbsMap: Partial<Record<Language, Verb[]>> = {
  spanish: spanishVerbs as Verb[],
  german: germanVerbs as Verb[],
};

const storyMap: Partial<Record<Language, Story>> = {
  spanish: cafeMadrid as Story,
  german: cafeMuenchen as Story,
};

const nouns = germanNouns as Noun[];
const caseFrames = germanCases as CaseFrame[];

/** Default drill setup per language, used until the learner changes it. */
const defaultQuickfire: Record<string, QuickfireConfig> = {
  spanish: { tenses: ['present', 'preterite'], focus: 'all' },
  german: { tenses: ['praesens', 'perfekt'], focus: 'all' },
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
  const [level, setLevel] = useState<number>(1);
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

  // Story state
  const [storyLevel, setStoryLevel] = useLocalStorage<StoryLevel>('triolingo_story_level', 'a0');
  const [storyCompleted, setStoryCompleted] = useLocalStorage<number[]>('triolingo_story_completed', []);
  const [chapterId, setChapterId] = useState<number>(1);

  // Timed-drill state (quickfire, der/die/das, cases)
  const [quickfireConfigs, setQuickfireConfigs] = useLocalStorage<Record<string, QuickfireConfig>>(
    'triolingo_quickfire_configs', defaultQuickfire,
  );
  const [rapidBests, setRapidBests] = useLocalStorage<Record<string, number>>('triolingo_quickfire_bests', {});
  const [rapidAnswers, setRapidAnswers] = useState<RapidAnswer[]>([]);
  const [rapidNewBest, setRapidNewBest] = useState(false);

  void streak;

  const srs = useSRS(language);

  const allCards = useMemo(() => vocabMap[language], [language]);

  function applyFilters(cards: VocabCard[], gender: UserGender, f: SessionFilters, m: Mode, lv?: number): VocabCard[] {
    let filtered = cards.filter(c =>
      (!c.gender || c.gender === 'all' || c.gender === gender) &&
      (lv === undefined || !c.level || c.level === lv) &&
      (f.categories.length === 0 || f.categories.includes(c.category)) &&
      (f.tenses.length === 0 || !c.tense || f.tenses.includes(c.tense))
    );
    if (m === 'cloze') filtered = filtered.filter(c => !!c.cloze);
    if (m === 'sentence-builder') filtered = filtered.filter(c => c.target.split(' ').length >= 3);
    return filtered;
  }

  const buildSession = useCallback((lang: Language, currentSrs: ReturnType<typeof useSRS>, gender: UserGender, f: SessionFilters, m: Mode, lv?: number): VocabCard[] => {
    const cards = vocabMap[lang];
    const filteredCards = applyFilters(cards, gender, f, m, lv);
    if (filteredCards.length === 0) return shuffle(applyFilters(cards, gender, { categories: [], tenses: [], reverse: f.reverse }, m, lv)).slice(0, SESSION_SIZE);
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
    if (m === 'story') {
      setScreen('story-select');
    } else if (m === 'quickfire') {
      setScreen('quickfire-setup');
    } else if (m === 'noun-gender' || m === 'cases') {
      setScreen('rapid-round');
    } else if (hasLevels(language)) {
      setScreen('level');
    } else {
      const deck = buildSession(language, srs, userGender, filters, m);
      setSessionCards(deck);
      setCurrentIdx(0);
      setResults([]);
      setCardStartTime(Date.now());
      setScreen('session');
    }
  }

  function handleSelectLevel(lv: number) {
    setLevel(lv);
    const deck = buildSession(language, srs, userGender, filters, mode, lv);
    setSessionCards(deck);
    setCurrentIdx(0);
    setResults([]);
    setCardStartTime(Date.now());
    setScreen('session');
  }

  function handleSelectChapter(id: number) {
    setChapterId(id);
    setScreen('story-reader');
  }

  function handleCompleteChapter(id: number) {
    setStoryCompleted(prev => (prev.includes(id) ? prev : [...prev, id]));
    setScreen('story-select');
  }

  const story = storyMap[language];
  const currentChapter = story?.chapters.find(c => c.id === chapterId) ?? story?.chapters[0];

  const config = langConfig(language);
  const verbs = verbsMap[language] ?? [];

  /**
   * A saved setup can name tenses the current language doesn't have (Spanish
   * 'preterite' vs German 'praeteritum'), so fall back to that language's default.
   */
  const quickfireConfig = useMemo(() => {
    const saved = quickfireConfigs[language];
    const valid = config.verbTenses.map(t => t.id);
    const tenses = (saved?.tenses ?? []).filter(t => valid.includes(t));
    if (!saved || tenses.length === 0) return defaultQuickfire[language] ?? { tenses: valid.slice(0, 2), focus: 'all' as const };
    return { ...saved, tenses };
  }, [quickfireConfigs, language, config]);

  function setQuickfireConfig(next: QuickfireConfig) {
    setQuickfireConfigs(prev => ({ ...prev, [language]: next }));
  }

  const quickfireVerbs = useMemo(() => filterVerbs(verbs, quickfireConfig.focus), [verbs, quickfireConfig.focus]);

  // Records are kept per setup — a present-only round isn't the same challenge as all six tenses.
  const rapidKey =
    mode === 'quickfire'
      ? `${language}:verbs:${quickfireConfig.focus}:${[...quickfireConfig.tenses].sort().join(',')}`
      : `${language}:${mode}`;
  const rapidBest = rapidBests[rapidKey] ?? 0;

  const makePrompt = useCallback((recentIds: string[]): RapidPrompt => {
    if (mode === 'noun-gender') return buildGenderPrompt(nouns, recentIds);
    if (mode === 'cases') return buildCasePrompt(caseFrames, recentIds);
    return buildVerbPrompt(quickfireVerbs, quickfireConfig.tenses, config.verbPersons, config.verbTenses, recentIds);
  }, [mode, quickfireVerbs, quickfireConfig.tenses, config]);

  function handleRapidFinish(answers: RapidAnswer[]) {
    const score = answers.filter(a => a.correct).length;
    const beat = score > rapidBest;
    if (beat) setRapidBests(prev => ({ ...prev, [rapidKey]: score }));
    setRapidAnswers(answers);
    setRapidNewBest(beat);
    setScreen('rapid-summary');
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

  function handleSentenceBuilderResult(correct: boolean, timeMs: number) {
    const card = sessionCards[currentIdx];
    srs.recordAnswer(card.id, correct ? (timeMs < 10000 ? 5 : 4) : 1);
    advanceSession([...results, { card, correct, timeMs }], correct);
  }

  function handleRestart() {
    const deck = buildSession(language, srs, userGender, filters, mode, hasLevels(language) ? level : undefined);
    setSessionCards(deck);
    setCurrentIdx(0);
    setResults([]);
    setCardStartTime(Date.now());
    setScreen('session');
  }

  const dueCount = useMemo(() => {
    const cards = vocabMap[language];
    const lv = hasLevels(language) ? level : undefined;
    const filteredCards = applyFilters(cards, userGender, filters, mode, lv);
    return srs.getDueCards(filteredCards.length > 0 ? filteredCards : cards.filter(c => !c.gender || c.gender === 'all' || c.gender === userGender)).length;
  }, [language, srs, userGender, filters, mode, level]);

  const availableCategories = useMemo(() => {
    const lv = hasLevels(language) ? level : undefined;
    const cards = vocabMap[language].filter(c =>
      (!c.gender || c.gender === 'all' || c.gender === userGender) &&
      (lv === undefined || !c.level || c.level === lv)
    );
    return [...new Set(cards.map(c => c.category))].sort();
  }, [language, userGender, level]);

  const availableTenses = useMemo(() => {
    if (Object.keys(config.tenseLabels).length === 0) return [];
    const cards = vocabMap[language];
    return [...new Set(cards.map(c => c.tense).filter(Boolean) as string[])].sort();
  }, [language]);

  const categoryProgress = useMemo(() => {
    const lv = hasLevels(language) ? level : undefined;
    const cards = vocabMap[language].filter(c =>
      (!c.gender || c.gender === 'all' || c.gender === userGender) &&
      (lv === undefined || !c.level || c.level === lv)
    );
    return srs.getCategoryProgress(cards);
  }, [language, userGender, srs, level]);

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

        {screen === 'level' && (
          <motion.div key="level" initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }}>
            <LevelSelector language={language} onSelect={handleSelectLevel} onBack={() => setScreen('mode')} />
          </motion.div>
        )}

        {screen === 'story-select' && story && (
          <motion.div key="story-select" initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }}>
            <StorySelect
              story={story}
              completed={storyCompleted}
              onSelectChapter={handleSelectChapter}
              onBack={() => setScreen('mode')}
            />
          </motion.div>
        )}

        {screen === 'story-reader' && story && currentChapter && (
          <motion.div key="story-reader" initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }}>
            <StoryReader
              chapter={currentChapter}
              language={language}
              level={storyLevel}
              onLevelChange={setStoryLevel}
              onComplete={handleCompleteChapter}
              onBack={() => setScreen('story-select')}
            />
          </motion.div>
        )}

        {screen === 'quickfire-setup' && (
          <motion.div key="quickfire-setup" initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }}>
            <QuickfireSetup
              language={language}
              config={quickfireConfig}
              onConfigChange={setQuickfireConfig}
              best={rapidBest}
              verbCount={quickfireVerbs.length}
              onStart={() => setScreen('rapid-round')}
              onBack={() => setScreen('mode')}
            />
          </motion.div>
        )}

        {screen === 'rapid-round' && (
          <motion.div key="rapid-round" initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}>
            <RapidRound
              key={`${language}-${mode}`}
              makePrompt={makePrompt}
              onFinish={handleRapidFinish}
              onQuit={() => setScreen(mode === 'quickfire' ? 'quickfire-setup' : 'mode')}
            />
          </motion.div>
        )}

        {screen === 'rapid-summary' && (
          <motion.div key="rapid-summary" initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}>
            <RapidSummary
              answers={rapidAnswers}
              best={rapidBest}
              isNewBest={rapidNewBest}
              settingsLabel={mode === 'quickfire' ? 'Change tenses' : undefined}
              onReplay={() => setScreen('rapid-round')}
              onSettings={mode === 'quickfire' ? () => setScreen('quickfire-setup') : undefined}
              onHome={() => setScreen('home')}
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
                ) : mode === 'typing' ? (
                  <motion.div
                    key={`ty-${currentCard.id}`}
                    initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.88, x: -30 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 28 }}
                    className="w-full max-w-md"
                  >
                    <TypingCard card={currentCard} reverse={filters.reverse} onResult={handleTypingResult} />
                  </motion.div>
                ) : (
                  <motion.div
                    key={`sb-${currentCard.id}`}
                    initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.88, x: -30 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 28 }}
                    className="w-full max-w-md"
                  >
                    <SentenceBuilder card={currentCard} language={language} onResult={handleSentenceBuilderResult} />
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
