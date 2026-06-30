import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { VocabCard, Language } from '../types';

interface FlashCardProps {
  card: VocabCard;
  language: Language;
  reverse?: boolean;
  onResult: (correct: boolean) => void;
}

function displayTarget(card: VocabCard, language: Language): string {
  return language === 'japanese' && card.pronunciation ? card.pronunciation : card.target;
}

export default function FlashCard({ card, language, reverse = false, onResult }: FlashCardProps) {
  const [flipped, setFlipped] = useState(false);
  const [answered, setAnswered] = useState<'correct' | 'wrong' | null>(null);

  // Reset when card changes
  useEffect(() => {
    setFlipped(false);
    setAnswered(null);
  }, [card.id]);

  function handleFlip() {
    if (!flipped) setFlipped(true);
  }

  function handleAnswer(correct: boolean) {
    setAnswered(correct ? 'correct' : 'wrong');
    setTimeout(() => {
      onResult(correct);
    }, 600);
  }

  const categoryColors: Record<string, string> = {
    greetings: 'bg-blue-500/30 text-blue-300',
    numbers: 'bg-purple-500/30 text-purple-300',
    colors: 'bg-pink-500/30 text-pink-300',
    food: 'bg-orange-500/30 text-orange-300',
    animals: 'bg-green-500/30 text-green-300',
    verbs: 'bg-red-500/30 text-red-300',
    family: 'bg-yellow-500/30 text-yellow-300',
    time: 'bg-teal-500/30 text-teal-300',
    body: 'bg-rose-500/30 text-rose-300',
    places: 'bg-indigo-500/30 text-indigo-300',
  };
  const catColor = categoryColors[card.category] ?? 'bg-white/10 text-white/60';

  return (
    <div className="flex flex-col items-center justify-center w-full max-w-md mx-auto px-4">
      {/* The card */}
      <div
        className="w-full cursor-pointer"
        style={{ perspective: 1200 }}
        onClick={handleFlip}
      >
        <motion.div
          animate={{
            rotateY: flipped ? 180 : 0,
            scale: answered === 'correct' ? 1.04 : answered === 'wrong' ? 0.96 : 1,
          }}
          transition={{ type: 'spring', stiffness: 200, damping: 22 }}
          style={{ transformStyle: 'preserve-3d', position: 'relative', minHeight: 260 }}
          className={`w-full rounded-3xl ${
            answered === 'correct'
              ? 'ring-2 ring-green-400 shadow-lg shadow-green-500/30'
              : answered === 'wrong'
              ? 'ring-2 ring-red-400 shadow-lg shadow-red-500/30'
              : ''
          }`}
        >
          {/* Front */}
          <div
            className="absolute inset-0 rounded-3xl border border-white/20 flex flex-col items-center justify-center p-6 gap-4 overflow-hidden"
            style={{ backfaceVisibility: 'hidden', background: 'rgba(30, 16, 64, 0.97)' }}
          >
            <span className={`text-xs font-semibold uppercase tracking-widest px-3 py-1 rounded-full ${catColor}`}>
              {card.category}
            </span>
            {reverse ? (
              <p className="font-bold text-white text-center leading-tight" style={{ fontSize: displayTarget(card, language).length > 20 ? '1.4rem' : displayTarget(card, language).length > 10 ? '2rem' : '2.8rem' }}>{displayTarget(card, language)}</p>
            ) : (
              <p className="font-bold text-white text-center" style={{ fontSize: card.english.length > 30 ? '1.3rem' : card.english.length > 15 ? '1.8rem' : '2.2rem' }}>{card.english}</p>
            )}
            {!flipped && (
              <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }} className="text-white/30 text-sm mt-2">
                Tap to reveal
              </motion.p>
            )}
          </div>

          {/* Back */}
          <div
            className="absolute inset-0 rounded-3xl border border-white/20 flex flex-col items-center justify-center p-6 gap-3 overflow-hidden"
            style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)', background: 'rgba(30, 16, 64, 0.97)' }}
          >
            <span className={`text-xs font-semibold uppercase tracking-widest px-3 py-1 rounded-full shrink-0 ${catColor}`}>
              {card.category}
            </span>
            {reverse ? (
              <p className="font-bold text-white text-center" style={{ fontSize: card.english.length > 30 ? '1.3rem' : card.english.length > 15 ? '1.8rem' : '2.2rem' }}>{card.english}</p>
            ) : (
              <p className="font-bold text-white text-center leading-tight" style={{ fontSize: displayTarget(card, language).length > 20 ? '1.4rem' : displayTarget(card, language).length > 10 ? '2rem' : '2.8rem' }}>{displayTarget(card, language)}</p>
            )}
            <p className="text-white/40 text-sm">{reverse ? displayTarget(card, language) : card.english}</p>
          </div>
        </motion.div>
      </div>

      {/* Grammar note — shown below card after flip */}
      <AnimatePresence>
        {flipped && card.note && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 28, delay: 0.15 }}
            className="w-full mt-4 rounded-xl border border-amber-400/20 px-4 py-3"
            style={{ background: 'rgba(251,191,36,0.08)' }}
          >
            <p className="text-amber-300/80 text-xs leading-relaxed">{card.note}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Action buttons appear after flip */}
      <AnimatePresence>
        {flipped && !answered && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25, delay: 0.1 }}
            className="flex gap-4 mt-4 w-full"
          >
            <motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleAnswer(false)}
              className="flex-1 min-h-14 rounded-2xl bg-red-500/20 border border-red-400/40 text-red-300 font-bold text-lg hover:bg-red-500/30 transition-colors"
            >
              Try again ✗
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleAnswer(true)}
              className="flex-1 min-h-14 rounded-2xl bg-green-500/20 border border-green-400/40 text-green-300 font-bold text-lg hover:bg-green-500/30 transition-colors"
            >
              Got it ✓
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hint to flip if not yet flipped */}
      {!flipped && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="text-white/25 text-xs mt-4"
        >
          Tap the card to flip
        </motion.p>
      )}
    </div>
  );
}
