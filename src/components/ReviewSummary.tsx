import { motion } from 'framer-motion';
import type { SessionResult } from '../types';

interface ReviewSummaryProps {
  results: SessionResult[];
  onRestart: () => void;
  onHome: () => void;
}

export default function ReviewSummary({ results, onRestart, onHome }: ReviewSummaryProps) {
  const correct = results.filter(r => r.correct).length;
  const total = results.length;
  const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0;
  const xp = correct * 10 + (accuracy === 100 ? 25 : 0);

  const message =
    accuracy === 100
      ? 'Perfect score! 🎉'
      : accuracy >= 80
      ? 'Nice work! 🌟'
      : accuracy >= 60
      ? 'Keep going! 💪'
      : 'Practice makes perfect! 🔄';

  const accuracyColor =
    accuracy >= 80 ? 'text-green-400' : accuracy >= 60 ? 'text-yellow-400' : 'text-red-400';

  const categoryColors: Record<string, string> = {
    greetings: 'bg-blue-500/20 text-blue-300',
    numbers: 'bg-purple-500/20 text-purple-300',
    colors: 'bg-pink-500/20 text-pink-300',
    food: 'bg-orange-500/20 text-orange-300',
    animals: 'bg-green-500/20 text-green-300',
    verbs: 'bg-red-500/20 text-red-300',
    family: 'bg-yellow-500/20 text-yellow-300',
    time: 'bg-teal-500/20 text-teal-300',
    body: 'bg-rose-500/20 text-rose-300',
    places: 'bg-indigo-500/20 text-indigo-300',
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-purple-900 to-slate-900 flex flex-col items-center justify-start px-4 py-10 overflow-y-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 20 }}
        className="text-center mb-6"
      >
        <p className="text-5xl mb-2">{accuracy === 100 ? '🏆' : accuracy >= 80 ? '⭐' : accuracy >= 60 ? '👍' : '📖'}</p>
        <h2 className="text-2xl font-bold text-white">{message}</h2>
      </motion.div>

      {/* Score card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="w-full max-w-md bg-white/10 border border-white/20 rounded-2xl p-5 mb-4"
      >
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-3xl font-black text-white">{correct}/{total}</div>
            <div className="text-white/40 text-xs mt-1">correct</div>
          </div>
          <div>
            <div className={`text-3xl font-black ${accuracyColor}`}>{accuracy}%</div>
            <div className="text-white/40 text-xs mt-1">accuracy</div>
          </div>
          <div>
            <div className="text-3xl font-black text-amber-400">+{xp}</div>
            <div className="text-white/40 text-xs mt-1">XP earned</div>
          </div>
        </div>
      </motion.div>

      {/* Card list */}
      <div className="w-full max-w-md flex flex-col gap-2 mb-6">
        {results.map((result, i) => (
          <motion.div
            key={result.card.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 + i * 0.06 }}
            className={`flex items-center gap-3 p-3 rounded-xl border ${
              result.correct
                ? 'bg-green-500/10 border-green-400/20'
                : 'bg-red-500/10 border-red-400/20'
            }`}
          >
            <span className="text-lg">{result.correct ? '✅' : '❌'}</span>
            <span className="text-white font-medium flex-1">{result.card.english}</span>
            <span className="text-white/60 text-sm mr-1">{result.card.target}</span>
            <span className={`text-xs px-2 py-0.5 rounded-full ${categoryColors[result.card.category] ?? 'bg-white/10 text-white/40'}`}>
              {result.card.category}
            </span>
          </motion.div>
        ))}
      </div>

      {/* Buttons */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 + results.length * 0.06 }}
        className="w-full max-w-md flex flex-col gap-3"
      >
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          onClick={onRestart}
          className="w-full min-h-14 rounded-2xl bg-violet-500/30 border border-violet-400/50 text-violet-200 font-bold text-lg hover:bg-violet-500/40 transition-colors"
        >
          Practice again 🔄
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          onClick={onHome}
          className="w-full min-h-14 rounded-2xl bg-white/5 border border-white/15 text-white/70 font-semibold text-lg hover:bg-white/10 transition-colors"
        >
          Home
        </motion.button>
      </motion.div>
    </div>
  );
}
