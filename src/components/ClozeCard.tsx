import { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { VocabCard, Language } from '../types';

interface ClozeCardProps {
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

export default function ClozeCard({ card, allCards, language: _language, onResult }: ClozeCardProps) {
  const [selected, setSelected] = useState<string | null>(null);
  const [canContinue, setCanContinue] = useState(false);
  const startRef = useRef(Date.now());

  const clozeWord = card.cloze ?? '';

  // Split target around the cloze word for display
  const [before, after] = useMemo(() => {
    if (!clozeWord) return [card.target, ''];
    const idx = card.target.indexOf(clozeWord);
    if (idx === -1) return [card.target, ''];
    return [card.target.slice(0, idx), card.target.slice(idx + clozeWord.length)];
  }, [card.target, clozeWord]);

  // 4 options: correct cloze + 3 distractors from other cards with a cloze field
  const options = useMemo(() => {
    const distractors = allCards
      .filter(c => c.id !== card.id && c.cloze && c.cloze !== clozeWord)
      .sort(() => Math.random() - 0.5)
      .slice(0, 3)
      .map(c => c.cloze as string);
    return shuffle([clozeWord, ...distractors]);
  }, [card.id]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    setSelected(null);
    setCanContinue(false);
    startRef.current = Date.now();
  }, [card.id]);

  function handleSelect(word: string) {
    if (selected !== null) return;
    setSelected(word);
    setCanContinue(true);
  }

  function handleContinue() {
    if (!selected) return;
    onResult(selected === clozeWord, Date.now() - startRef.current);
  }

  function getOptionStyle(word: string) {
    if (!selected) return 'bg-white/10 border-white/20 text-white hover:bg-white/15 cursor-pointer';
    if (word === clozeWord) return 'bg-green-500/25 border-green-400/60 text-green-200 ring-1 ring-green-400';
    if (word === selected) return 'bg-red-500/25 border-red-400/60 text-red-200 ring-1 ring-red-400';
    return 'bg-white/5 border-white/10 text-white/30';
  }

  return (
    <div className="flex flex-col items-center w-full max-w-md mx-auto px-4 gap-5">
      {/* English prompt */}
      <motion.div
        key={card.id}
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full text-center"
      >
        <p className="text-white/50 text-sm mb-2">Fill in the blank</p>
        <p className="text-2xl font-bold text-white">{card.english}</p>
      </motion.div>

      {/* Target sentence with blank */}
      <div className="w-full rounded-2xl border border-white/15 px-5 py-4 text-center"
        style={{ background: 'rgba(30, 16, 64, 0.6)' }}>
        <p className="text-white leading-relaxed" style={{ fontSize: '1.1rem' }}>
          {before}
          <span
            className="inline-block mx-1 min-w-16 border-b-2 align-bottom text-center"
            style={{
              borderColor: selected ? (selected === clozeWord ? 'rgb(74 222 128)' : 'rgb(248 113 113)') : 'rgba(255,255,255,0.4)',
              color: selected ? (selected === clozeWord ? 'rgb(134 239 172)' : 'rgb(252 165 165)') : 'transparent',
              fontSize: '1rem',
            }}
          >
            {selected ?? '      '}
          </span>
          {after}
        </p>
        {card.pronunciation && selected && (
          <p className="text-white/40 text-xs mt-2">{card.pronunciation}</p>
        )}
      </div>

      {/* Options */}
      <div className="w-full grid grid-cols-2 gap-3">
        {options.map((word, i) => {
          const isWrong = !!selected && word === selected && word !== clozeWord;
          return (
            <motion.button
              key={`${word}-${i}`}
              initial={{ opacity: 0, y: 10 }}
              animate={isWrong ? { opacity: 1, x: [0, -8, 8, -6, 6, 0] } : { opacity: 1, x: 0 }}
              transition={isWrong ? { duration: 0.4 } : { delay: selected ? 0 : i * 0.07, type: 'spring', stiffness: 300, damping: 25 }}
              onClick={() => handleSelect(word)}
              disabled={!!selected}
              className={`min-h-14 px-3 py-2 rounded-2xl border font-semibold text-center transition-all flex items-center justify-center gap-2 ${getOptionStyle(word)}`}
              style={{ fontSize: '1rem' }}
            >
              <span>{word}</span>
              <AnimatePresence>
                {selected && word === clozeWord && (
                  <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} className="text-green-400">✓</motion.span>
                )}
                {selected && word === selected && word !== clozeWord && (
                  <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} className="text-red-400">✗</motion.span>
                )}
              </AnimatePresence>
            </motion.button>
          );
        })}
      </div>

      {/* Grammar note */}
      <AnimatePresence>
        {selected && card.note && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full rounded-xl border border-amber-400/20 px-4 py-3"
            style={{ background: 'rgba(251, 191, 36, 0.08)' }}
          >
            <p className="text-amber-300/80 text-xs leading-relaxed">{card.note}</p>
          </motion.div>
        )}
      </AnimatePresence>

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
