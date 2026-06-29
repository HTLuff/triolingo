import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { VocabCard } from '../types';

interface TypingCardProps {
  card: VocabCard;
  reverse: boolean;
  onResult: (correct: boolean, timeMs: number) => void;
}

function normalize(s: string): string {
  return s.trim().toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/^[¿¡]+|[.,!?¿¡]+$/g, '');
}

export default function TypingCard({ card, reverse, onResult }: TypingCardProps) {
  const [typed, setTyped] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [correct, setCorrect] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const startRef = useRef(Date.now());

  const prompt = reverse ? card.target : card.english;
  const answer = reverse ? card.english : card.target;

  useEffect(() => {
    setTyped('');
    setSubmitted(false);
    startRef.current = Date.now();
    setTimeout(() => inputRef.current?.focus(), 50);
  }, [card.id]);

  function handleSubmit() {
    if (!typed.trim() || submitted) return;
    setCorrect(normalize(typed) === normalize(answer));
    setSubmitted(true);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') {
      if (submitted) onResult(correct, Date.now() - startRef.current);
      else handleSubmit();
    }
  }

  return (
    <div className="flex flex-col items-center w-full max-w-md mx-auto px-4 gap-5">
      {/* Prompt */}
      <motion.div key={card.id} initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="w-full text-center">
        <p className="text-white/50 text-sm mb-2">Type the translation</p>
        <p className="text-2xl font-bold text-white">{prompt}</p>
        {reverse && card.pronunciation && (
          <p className="text-white/40 text-sm mt-1">{card.pronunciation}</p>
        )}
      </motion.div>

      {/* Input */}
      <input
        ref={inputRef}
        type="text"
        value={typed}
        onChange={e => setTyped(e.target.value)}
        onKeyDown={handleKeyDown}
        disabled={submitted}
        placeholder="Type your answer…"
        className={`w-full px-5 py-4 rounded-2xl border text-white text-lg font-medium outline-none transition-all placeholder:text-white/25 ${
          submitted
            ? correct
              ? 'bg-green-500/15 border-green-400/60 text-green-200'
              : 'bg-red-500/15 border-red-400/60 text-red-200 line-through opacity-70'
            : 'bg-white/10 border-white/20 focus:border-violet-400/60 focus:bg-white/[0.12]'
        }`}
      />

      {/* Result */}
      <AnimatePresence>
        {submitted && (
          <motion.div
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            className={`w-full rounded-2xl border px-5 py-4 ${correct ? 'bg-green-500/15 border-green-400/30' : 'bg-red-500/15 border-red-400/30'}`}
          >
            {correct ? (
              <p className="text-green-300 font-semibold text-lg">Correct ✓</p>
            ) : (
              <>
                <p className="text-red-300/70 text-xs font-semibold mb-1 uppercase tracking-wide">Correct answer</p>
                <p className="text-white font-bold text-xl">{answer}</p>
                {card.pronunciation && !reverse && (
                  <p className="text-white/40 text-xs mt-1">{card.pronunciation}</p>
                )}
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Grammar note */}
      <AnimatePresence>
        {submitted && card.note && (
          <motion.div
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            className="w-full rounded-xl border border-amber-400/20 px-4 py-3"
            style={{ background: 'rgba(251, 191, 36, 0.08)' }}
          >
            <p className="text-amber-300/80 text-xs leading-relaxed">{card.note}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Action button */}
      {!submitted ? (
        <motion.button
          whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
          onClick={handleSubmit}
          disabled={!typed.trim()}
          className="w-full min-h-14 rounded-2xl bg-violet-500/30 border border-violet-400/50 text-violet-200 font-bold text-lg hover:bg-violet-500/40 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        >
          Check →
        </motion.button>
      ) : (
        <motion.button
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
          onClick={() => onResult(correct, Date.now() - startRef.current)}
          className="w-full min-h-14 rounded-2xl bg-violet-500/30 border border-violet-400/50 text-violet-200 font-bold text-lg hover:bg-violet-500/40 transition-colors"
        >
          Continue →
        </motion.button>
      )}
    </div>
  );
}
