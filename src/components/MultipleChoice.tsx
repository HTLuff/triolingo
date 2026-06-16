import { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { VocabCard, Language } from '../types';

interface MultipleChoiceProps {
  card: VocabCard;
  allCards: VocabCard[];
  language: Language;
  onResult: (correct: boolean, timeMs: number) => void;
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function MultipleChoice({ card, allCards, language, onResult }: MultipleChoiceProps) {
  const [selected, setSelected] = useState<string | null>(null);
  const [canContinue, setCanContinue] = useState(false);
  const startRef = useRef(Date.now());

  // Build options: 1 correct + 3 random wrong
  const options = useMemo(() => {
    const wrong = allCards
      .filter(c => c.id !== card.id)
      .sort(() => Math.random() - 0.5)
      .slice(0, 3);
    return shuffle([card, ...wrong]);
  }, [card.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Reset on card change
  useEffect(() => {
    setSelected(null);
    setCanContinue(false);
    startRef.current = Date.now();
  }, [card.id]);

  function handleSelect(optionId: string) {
    if (selected !== null) return; // already answered
    setSelected(optionId);
    setCanContinue(true);
  }

  function handleContinue() {
    if (!selected) return;
    const correct = selected === card.id;
    const timeMs = Date.now() - startRef.current;
    onResult(correct, timeMs);
  }

  function getOptionStyle(opt: VocabCard) {
    if (!selected) {
      return 'bg-white/10 border-white/20 text-white hover:bg-white/15 cursor-pointer';
    }
    if (opt.id === card.id) {
      return 'bg-green-500/25 border-green-400/60 text-green-200 ring-1 ring-green-400';
    }
    if (opt.id === selected) {
      return 'bg-red-500/25 border-red-400/60 text-red-200 ring-1 ring-red-400';
    }
    return 'bg-white/5 border-white/10 text-white/30';
  }

  const langLabel: Record<Language, string> = {
    spanish: 'Spanish',
    japanese: 'Japanese',
  };

  return (
    <div className="flex flex-col items-center w-full max-w-md mx-auto px-4 gap-5">
      {/* Question */}
      <motion.div
        key={card.id}
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full text-center"
      >
        <p className="text-white/50 text-sm mb-2">Translate into {langLabel[language]}</p>
        <p className="text-3xl font-bold text-white">{card.english}</p>
      </motion.div>

      {/* Options */}
      <div className="w-full flex flex-col gap-3">
        {options.map((opt, i) => {
          const isWrongSelected = !!selected && opt.id === selected && selected !== card.id;
          const animateProps = isWrongSelected
            ? { opacity: 1, x: [0, -8, 8, -6, 6, 0] }
            : { opacity: 1, x: 0 };
          const transitionProps = isWrongSelected
            ? { duration: 0.4 }
            : { delay: selected ? 0 : i * 0.07, type: 'spring' as const, stiffness: 300, damping: 25 };

          return (
          <motion.button
            key={opt.id}
            initial={{ opacity: 0, x: -20 }}
            animate={animateProps}
            transition={transitionProps}
            onClick={() => handleSelect(opt.id)}
            className={`w-full min-h-16 px-5 py-3 rounded-2xl border font-semibold text-left flex items-center justify-between transition-all ${getOptionStyle(opt)}`}
            disabled={!!selected}
          >
            <span className="flex flex-col gap-0.5">
              <span style={{ fontSize: '1rem' }} className="leading-snug">
                {opt.target}
              </span>
              {opt.pronunciation && (
                <span className="text-xs font-normal opacity-60">{opt.pronunciation}</span>
              )}
            </span>
            <AnimatePresence>
              {selected && opt.id === card.id && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="text-green-400 text-xl"
                >
                  ✓
                </motion.span>
              )}
              {selected && opt.id === selected && selected !== card.id && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="text-red-400 text-xl"
                >
                  ✗
                </motion.span>
              )}
            </AnimatePresence>
          </motion.button>
          );
        })}
      </div>

      {/* Continue */}
      <AnimatePresence>
        {canContinue && (
          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={handleContinue}
            className="w-full min-h-14 rounded-2xl bg-violet-500/30 border border-violet-400/50 text-violet-200 font-bold text-lg hover:bg-violet-500/40 transition-colors"
          >
            Continue →
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}
