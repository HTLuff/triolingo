import { motion } from 'framer-motion';
import type { QuickfireConfig, VerbTense, VerbFocus } from '../types';
import { ALL_TENSES, ROUND_SECONDS, tenseLabels, tenseHints } from '../utils/quickfire';

interface QuickfireSetupProps {
  config: QuickfireConfig;
  onConfigChange: (c: QuickfireConfig) => void;
  best: number;
  verbCount: number;
  onStart: () => void;
  onBack: () => void;
}

const focusOptions: { id: VerbFocus; label: string; desc: string }[] = [
  { id: 'all', label: 'All verbs', desc: 'Everything in the deck' },
  { id: 'tricky', label: 'Tricky only', desc: 'Stem-changing + irregular' },
  { id: 'regular', label: 'Regular only', desc: 'Straight endings' },
];

export default function QuickfireSetup({ config, onConfigChange, best, verbCount, onStart, onBack }: QuickfireSetupProps) {
  function toggleTense(t: VerbTense) {
    const next = config.tenses.includes(t)
      ? config.tenses.filter(x => x !== t)
      : [...config.tenses, t];
    if (next.length === 0) return; // always keep at least one tense
    onConfigChange({ ...config, tenses: next });
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-purple-900 to-slate-900 flex flex-col items-center justify-start px-4 py-10 overflow-y-auto">
      <div className="w-full max-w-md mb-6">
        <motion.button
          initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} whileTap={{ scale: 0.95 }}
          onClick={onBack}
          className="flex items-center gap-2 text-white/50 hover:text-white/80 transition-colors text-sm"
        >
          <span className="text-lg">←</span> Back
        </motion.button>
      </div>

      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-7 w-full max-w-md">
        <div className="text-4xl mb-2">⚡</div>
        <h2 className="text-2xl font-bold text-white">Quickfire</h2>
        <p className="text-white/50 text-sm mt-2">
          As many conjugations as you can in {ROUND_SECONDS} seconds
        </p>
        {best > 0 && (
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.2 }}
            className="mt-3 inline-flex items-center gap-2 bg-amber-500/20 border border-amber-400/30 rounded-full px-4 py-1.5"
          >
            <span className="text-amber-400 text-sm font-semibold">🏆 Best: {best}</span>
          </motion.div>
        )}
      </motion.div>

      {/* Tenses */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="w-full max-w-md mb-6">
        <span className="text-white/60 text-xs font-semibold uppercase tracking-wider block mb-2">Tenses</span>
        <div className="grid grid-cols-2 gap-2">
          {ALL_TENSES.map(t => {
            const active = config.tenses.includes(t);
            return (
              <button
                key={t}
                onClick={() => toggleTense(t)}
                className={`px-3 py-2.5 rounded-xl border text-left transition-colors ${
                  active
                    ? 'bg-emerald-500/25 border-emerald-400/50 text-emerald-200'
                    : 'bg-white/5 border-white/15 text-white/50 hover:text-white/70'
                }`}
              >
                <div className="text-sm font-semibold">{tenseLabels[t]}</div>
                <div className={`text-xs ${active ? 'text-emerald-300/60' : 'text-white/30'}`}>{tenseHints[t]}</div>
              </button>
            );
          })}
        </div>
      </motion.div>

      {/* Verb focus */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="w-full max-w-md mb-7">
        <span className="text-white/60 text-xs font-semibold uppercase tracking-wider block mb-2">Verbs</span>
        <div className="flex flex-col gap-2">
          {focusOptions.map(opt => {
            const active = config.focus === opt.id;
            return (
              <button
                key={opt.id}
                onClick={() => onConfigChange({ ...config, focus: opt.id })}
                className={`px-4 py-3 rounded-xl border flex items-center gap-3 text-left transition-colors ${
                  active
                    ? 'bg-blue-500/25 border-blue-400/50 text-blue-100'
                    : 'bg-white/5 border-white/15 text-white/50 hover:text-white/70'
                }`}
              >
                <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${active ? 'bg-blue-400' : 'bg-white/20'}`} />
                <div>
                  <div className="text-sm font-semibold">{opt.label}</div>
                  <div className={`text-xs ${active ? 'text-blue-200/60' : 'text-white/30'}`}>{opt.desc}</div>
                </div>
              </button>
            );
          })}
        </div>
        <p className="text-white/30 text-xs mt-2">{verbCount} verbs in this round</p>
      </motion.div>

      <motion.button
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
        whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
        onClick={onStart}
        disabled={verbCount === 0}
        className="w-full max-w-md min-h-14 rounded-2xl bg-amber-500/30 border border-amber-400/50 text-amber-100 font-bold text-lg hover:bg-amber-500/40 transition-colors disabled:opacity-30"
      >
        Start ⚡
      </motion.button>
    </div>
  );
}
