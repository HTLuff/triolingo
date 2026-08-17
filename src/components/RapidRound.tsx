import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { RapidPrompt, RapidAnswer } from '../types';
import { ROUND_SECONDS } from '../utils/rapid';

interface RapidRoundProps {
  /** Produces the next question, avoiding anything in `recentIds`. */
  makePrompt: (recentIds: string[]) => RapidPrompt;
  onFinish: (answers: RapidAnswer[]) => void;
  onQuit: () => void;
}

const CORRECT_DELAY = 250;
const WRONG_DELAY = 1100;

/** Perfekt forms like "habe gesprochen" need to shrink to fit the option button. */
function optionSize(text: string): string {
  if (text.length > 18) return 'text-sm';
  if (text.length > 12) return 'text-base';
  return 'text-lg';
}

export default function RapidRound({ makePrompt, onFinish, onQuit }: RapidRoundProps) {
  // Both callbacks are recreated by the parent on every render. Holding them in
  // refs keeps the countdown effect out of their dependency list — otherwise the
  // interval, and with it the round, would restart on every render.
  const makeRef = useRef(makePrompt);
  const finishRef = useRef(onFinish);
  useEffect(() => { makeRef.current = makePrompt; finishRef.current = onFinish; });

  const [prompt, setPrompt] = useState<RapidPrompt>(() => makePrompt([]));
  const [chosen, setChosen] = useState<string | null>(null);
  const [answers, setAnswers] = useState<RapidAnswer[]>([]);
  const [remaining, setRemaining] = useState(ROUND_SECONDS * 1000);

  const answersRef = useRef<RapidAnswer[]>([]);
  const recentRef = useRef<string[]>([]);
  const endRef = useRef(0);   // set when the countdown starts, on mount
  const advanceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const finishedRef = useRef(false);

  const score = answers.filter(a => a.correct).length;
  const streak = (() => {
    let n = 0;
    for (let i = answers.length - 1; i >= 0 && answers[i].correct; i--) n++;
    return n;
  })();

  const finish = useCallback(() => {
    if (finishedRef.current) return;
    finishedRef.current = true;
    if (advanceRef.current) clearTimeout(advanceRef.current);
    finishRef.current(answersRef.current);
  }, []);

  // Runs once: the round's clock starts on mount and isn't restarted by re-renders.
  useEffect(() => {
    endRef.current = Date.now() + ROUND_SECONDS * 1000;
    const id = setInterval(() => {
      const left = endRef.current - Date.now();
      setRemaining(left > 0 ? left : 0);
      if (left <= 0) {
        clearInterval(id);
        finish();
      }
    }, 100);
    return () => clearInterval(id);
  }, [finish]);

  useEffect(() => () => { if (advanceRef.current) clearTimeout(advanceRef.current); }, []);

  const answer = useCallback((option: string) => {
    if (chosen !== null || finishedRef.current) return;
    const correct = option === prompt.answer;
    setChosen(option);

    const next = [...answersRef.current, { prompt, chosen: option, correct }];
    answersRef.current = next;
    setAnswers(next);
    recentRef.current = [prompt.id, ...recentRef.current].slice(0, 12);

    advanceRef.current = setTimeout(() => {
      if (finishedRef.current) return;
      setPrompt(makeRef.current(recentRef.current));
      setChosen(null);
    }, correct ? CORRECT_DELAY : WRONG_DELAY);
  }, [chosen, prompt]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const idx = Number(e.key) - 1;
      if (idx >= 0 && idx < prompt.options.length) answer(prompt.options[idx]);
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [answer, prompt.options]);

  const seconds = Math.ceil(remaining / 1000);
  const pct = (remaining / (ROUND_SECONDS * 1000)) * 100;
  const low = remaining <= 10000;
  const revealed = chosen !== null;
  const missed = revealed && chosen !== prompt.answer;

  return (
    <div className="min-h-screen flex flex-col">
      {/* Timer bar */}
      <div className="fixed top-0 left-0 right-0 z-10 bg-slate-900/60 backdrop-blur-sm">
        <div className="h-1.5 bg-white/10">
          <motion.div
            className={`h-full ${low ? 'bg-red-400' : 'bg-amber-400'}`}
            style={{ width: `${pct}%` }}
            transition={{ ease: 'linear' }}
          />
        </div>
        <div className="max-w-md mx-auto px-4 py-3 flex items-center gap-4">
          <button onClick={onQuit} className="text-white/40 hover:text-white/70 text-sm shrink-0">✕</button>
          <motion.span
            key={seconds}
            initial={low ? { scale: 1.25 } : false}
            animate={{ scale: 1 }}
            className={`font-bold tabular-nums ${low ? 'text-red-300' : 'text-white/80'}`}
          >
            {seconds}s
          </motion.span>
          <div className="ml-auto flex items-center gap-3">
            {streak >= 3 && (
              <motion.span
                initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                className="text-amber-300 text-sm font-semibold"
              >
                🔥 {streak}
              </motion.span>
            )}
            <span className="text-white font-bold tabular-nums">{score}</span>
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-4 pt-20 pb-8">
        <div className="w-full max-w-md">
          <AnimatePresence mode="wait">
            <motion.div
              key={`${prompt.id}-${answers.length}`}
              initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 12 }}
              transition={{ duration: 0.15 }}
              className="text-center mb-8"
            >
              <div className={`font-bold text-white ${prompt.main.length > 28 ? 'text-2xl' : 'text-4xl'}`}>
                {prompt.main}
              </div>
              {prompt.sub && <div className="text-white/40 text-sm mt-1">{prompt.sub}</div>}
              <div className="flex items-center justify-center gap-2 mt-4 flex-wrap">
                {prompt.chips.map((chip, i) => (
                  <span
                    key={chip}
                    className={`px-3 py-1 rounded-full text-sm font-semibold border ${
                      i === 0
                        ? 'bg-violet-500/25 border-violet-400/40 text-violet-200'
                        : 'bg-emerald-500/25 border-emerald-400/40 text-emerald-200'
                    }`}
                  >
                    {chip}
                  </span>
                ))}
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Options — three articles sit in a row, everything else in a 2×2 grid */}
          <div className={prompt.options.length === 3 ? 'grid grid-cols-3 gap-3' : 'grid grid-cols-2 gap-3'}>
            {prompt.options.map(option => {
              const isChosen = chosen === option;
              const isAnswer = option === prompt.answer;
              return (
                <motion.button
                  key={`${prompt.id}-${option}`}
                  whileTap={{ scale: revealed ? 1 : 0.96 }}
                  onClick={() => answer(option)}
                  disabled={revealed}
                  className={`min-h-16 px-3 py-3 rounded-2xl border font-semibold break-words transition-colors ${optionSize(option)} ${
                    revealed
                      ? isAnswer
                        ? 'bg-green-500/25 border-green-400/60 text-green-200'
                        : isChosen
                          ? 'bg-red-500/25 border-red-400/60 text-red-200'
                          : 'bg-white/5 border-white/10 text-white/25'
                      : 'bg-white/10 border-white/20 text-white hover:bg-white/15'
                  }`}
                >
                  {option}
                </motion.button>
              );
            })}
          </div>

          {/* Miss explainer */}
          <div className="h-14 mt-4">
            <AnimatePresence>
              {missed && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  className="text-center"
                >
                  <p className="text-white/50 text-sm">
                    {prompt.note ?? (
                      <>
                        {prompt.chips.join(' · ')} →{' '}
                        <span className="text-green-300 font-bold">{prompt.answer}</span>
                      </>
                    )}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
