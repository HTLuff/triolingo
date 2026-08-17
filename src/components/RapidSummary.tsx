import { motion } from 'framer-motion';
import type { RapidAnswer } from '../types';

interface RapidSummaryProps {
  answers: RapidAnswer[];
  best: number;
  isNewBest: boolean;
  /** Label for the setup button, e.g. "Change tenses". Hidden when there's nothing to configure. */
  settingsLabel?: string;
  onReplay: () => void;
  onSettings?: () => void;
  onHome: () => void;
}

export default function RapidSummary({
  answers, best, isNewBest, settingsLabel, onReplay, onSettings, onHome,
}: RapidSummaryProps) {
  const score = answers.filter(a => a.correct).length;
  const total = answers.length;
  const accuracy = total > 0 ? Math.round((score / total) * 100) : 0;

  let longest = 0, run = 0;
  for (const a of answers) {
    run = a.correct ? run + 1 : 0;
    if (run > longest) longest = run;
  }

  const missed = answers.filter(a => !a.correct);

  const message = isNewBest
    ? 'New best! 🏆'
    : accuracy >= 90 ? 'Sharp. ⚡'
    : accuracy >= 70 ? 'Solid round 🌟'
    : 'Those endings are coming 💪';

  const accuracyColor = accuracy >= 80 ? 'text-green-400' : accuracy >= 60 ? 'text-yellow-400' : 'text-red-400';

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-purple-900 to-slate-900 flex flex-col items-center justify-start px-4 py-10 overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 20 }}
        className="text-center mb-6"
      >
        <p className="text-5xl mb-2">{isNewBest ? '🏆' : '⚡'}</p>
        <h2 className="text-2xl font-bold text-white">{message}</h2>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
        className="w-full max-w-md bg-white/10 border border-white/20 rounded-2xl p-5 mb-4"
      >
        <div className="grid grid-cols-4 gap-3 text-center">
          <div>
            <div className="text-3xl font-black text-white">{score}</div>
            <div className="text-white/40 text-xs mt-1">correct</div>
          </div>
          <div>
            <div className={`text-3xl font-black ${accuracyColor}`}>{accuracy}%</div>
            <div className="text-white/40 text-xs mt-1">accuracy</div>
          </div>
          <div>
            <div className="text-3xl font-black text-amber-400">{longest}</div>
            <div className="text-white/40 text-xs mt-1">best streak</div>
          </div>
          <div>
            <div className="text-3xl font-black text-violet-300">{best}</div>
            <div className="text-white/40 text-xs mt-1">record</div>
          </div>
        </div>
      </motion.div>

      {missed.length > 0 && (
        <div className="w-full max-w-md mb-6">
          <span className="text-white/60 text-xs font-semibold uppercase tracking-wider block mb-2">
            Worth another look
          </span>
          <div className="flex flex-col gap-2">
            {missed.map((a, i) => (
              <motion.div
                key={`${a.prompt.id}-${i}`}
                initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 + i * 0.05 }}
                className="flex items-center gap-3 p-3 rounded-xl border bg-red-500/10 border-red-400/20"
              >
                <div className="flex-1 min-w-0">
                  <div className="text-white font-medium truncate">{a.prompt.main}</div>
                  <div className="text-white/40 text-xs truncate">{a.prompt.chips.join(' · ')}</div>
                </div>
                <div className="text-right shrink-0 max-w-[45%]">
                  <div className="text-green-300 font-bold break-words">{a.prompt.answer}</div>
                  <div className="text-red-300/60 text-xs line-through break-words">{a.chosen}</div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      <motion.div
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
        className="w-full max-w-md flex flex-col gap-3"
      >
        <motion.button
          whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
          onClick={onReplay}
          className="w-full min-h-14 rounded-2xl bg-amber-500/30 border border-amber-400/50 text-amber-100 font-bold text-lg hover:bg-amber-500/40 transition-colors"
        >
          Go again ⚡
        </motion.button>
        {onSettings && settingsLabel && (
          <motion.button
            whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
            onClick={onSettings}
            className="w-full min-h-14 rounded-2xl bg-white/5 border border-white/15 text-white/70 font-semibold text-lg hover:bg-white/10 transition-colors"
          >
            {settingsLabel}
          </motion.button>
        )}
        <motion.button
          whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
          onClick={onHome}
          className="w-full min-h-14 rounded-2xl bg-white/5 border border-white/15 text-white/70 font-semibold text-lg hover:bg-white/10 transition-colors"
        >
          Home
        </motion.button>
      </motion.div>
    </div>
  );
}
