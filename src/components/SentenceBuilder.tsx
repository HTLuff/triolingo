import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { VocabCard } from '../types';

interface Tile {
  id: number;
  word: string;
}

interface SentenceBuilderProps {
  card: VocabCard;
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

function makeTiles(target: string): Tile[] {
  return target.split(' ').map((word, i) => ({ id: i, word }));
}

export default function SentenceBuilder({ card, onResult }: SentenceBuilderProps) {
  const [bankTiles, setBankTiles] = useState<Tile[]>(() => shuffle(makeTiles(card.target)));
  const [answerTiles, setAnswerTiles] = useState<Tile[]>([]);
  const [checked, setChecked] = useState(false);
  const [correct, setCorrect] = useState(false);
  const startRef = useRef(Date.now());

  useEffect(() => {
    setBankTiles(shuffle(makeTiles(card.target)));
    setAnswerTiles([]);
    setChecked(false);
    setCorrect(false);
    startRef.current = Date.now();
  }, [card.id]); // eslint-disable-line react-hooks/exhaustive-deps

  function tapBank(tile: Tile) {
    if (checked) return;
    setBankTiles(prev => prev.filter(t => t.id !== tile.id));
    setAnswerTiles(prev => [...prev, tile]);
  }

  function tapAnswer(tile: Tile) {
    if (checked) return;
    setAnswerTiles(prev => prev.filter(t => t.id !== tile.id));
    setBankTiles(prev => [...prev, tile]);
  }

  function handleCheck() {
    const answer = answerTiles.map(t => t.word).join(' ');
    const isCorrect = answer === card.target;
    setCorrect(isCorrect);
    setChecked(true);
  }

  function handleContinue() {
    onResult(correct, Date.now() - startRef.current);
  }

  const allPlaced = bankTiles.length === 0;

  return (
    <div className="flex flex-col items-center w-full max-w-md mx-auto px-4 gap-5">
      {/* Prompt */}
      <motion.div
        key={card.id}
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full text-center"
      >
        <p className="text-white/50 text-sm mb-2">Build the sentence in Spanish</p>
        <p className="text-3xl font-bold text-white">{card.english}</p>
      </motion.div>

      {/* Answer area */}
      <motion.div
        className={`w-full min-h-20 rounded-2xl border-2 p-4 transition-all duration-300 ${
          !checked
            ? 'border-dashed border-white/20 bg-white/5'
            : correct
            ? 'border-green-400/60 bg-green-500/10'
            : 'border-red-400/60 bg-red-500/10'
        }`}
        animate={checked && !correct ? { x: [0, -8, 8, -6, 6, 0] } : {}}
        transition={{ duration: 0.4 }}
      >
        {answerTiles.length === 0 ? (
          <p className="text-white/25 text-sm text-center select-none">Tap words below to build the sentence</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            <AnimatePresence>
              {answerTiles.map(tile => (
                <motion.button
                  key={tile.id}
                  layout
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 28 }}
                  whileTap={checked ? {} : { scale: 0.92 }}
                  onClick={() => tapAnswer(tile)}
                  disabled={checked}
                  className={`px-3 py-2 rounded-xl border text-sm font-semibold transition-colors ${
                    checked
                      ? correct
                        ? 'bg-green-500/25 border-green-400/50 text-green-200 cursor-default'
                        : 'bg-red-500/20 border-red-400/40 text-red-200 cursor-default'
                      : 'bg-indigo-500/30 border-indigo-400/50 text-indigo-100 hover:bg-indigo-500/40 cursor-pointer'
                  }`}
                >
                  {tile.word}
                </motion.button>
              ))}
            </AnimatePresence>
          </div>
        )}
      </motion.div>

      {/* Correct answer (shown on wrong) */}
      <AnimatePresence>
        {checked && !correct && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10"
          >
            <p className="text-white/40 text-xs mb-1">Correct answer</p>
            <p className="text-white font-semibold text-sm">{card.target}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Note */}
      <AnimatePresence>
        {checked && card.note && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full px-4 py-3 rounded-xl bg-amber-500/10 border border-amber-400/20"
          >
            <p className="text-amber-300/80 text-xs">{card.note}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Word bank */}
      <div className="w-full">
        <div className="flex flex-wrap gap-2 justify-center min-h-12">
          <AnimatePresence>
            {bankTiles.map(tile => (
              <motion.button
                key={tile.id}
                layout
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ type: 'spring', stiffness: 400, damping: 28 }}
                whileTap={{ scale: 0.92 }}
                onClick={() => tapBank(tile)}
                className="px-3 py-2 rounded-xl border text-sm font-semibold bg-white/10 border-white/20 text-white hover:bg-white/15 cursor-pointer transition-colors"
              >
                {tile.word}
              </motion.button>
            ))}
          </AnimatePresence>
        </div>
      </div>

      {/* Check / Continue */}
      <AnimatePresence mode="wait">
        {!checked ? (
          <motion.button
            key="check"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            whileHover={allPlaced ? { scale: 1.03 } : {}}
            whileTap={allPlaced ? { scale: 0.97 } : {}}
            onClick={handleCheck}
            disabled={!allPlaced}
            className={`w-full min-h-14 rounded-2xl border font-bold text-lg transition-all ${
              allPlaced
                ? 'bg-violet-500/30 border-violet-400/50 text-violet-200 hover:bg-violet-500/40 cursor-pointer'
                : 'bg-white/5 border-white/10 text-white/25 cursor-not-allowed'
            }`}
          >
            Check
          </motion.button>
        ) : (
          <motion.button
            key="continue"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={handleContinue}
            className={`w-full min-h-14 rounded-2xl border font-bold text-lg transition-colors cursor-pointer ${
              correct
                ? 'bg-green-500/25 border-green-400/50 text-green-200 hover:bg-green-500/35'
                : 'bg-violet-500/30 border-violet-400/50 text-violet-200 hover:bg-violet-500/40'
            }`}
          >
            {correct ? '✓ Continue' : 'Continue →'}
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}
