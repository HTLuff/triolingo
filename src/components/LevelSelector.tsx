import { motion } from 'framer-motion';

interface LevelSelectorProps {
  onSelect: (level: number) => void;
  onBack: () => void;
}

const levels = [
  {
    id: 1,
    label: 'Level 1',
    sublabel: 'A1 / A2',
    desc: 'Present, preterite, everyday phrases',
    color: 'from-emerald-500/20 to-teal-500/20',
    border: 'border-emerald-400/30',
    dot: 'bg-emerald-400',
  },
  {
    id: 2,
    label: 'Level 2',
    sublabel: 'B1',
    desc: 'Imperfect, conditional, future, perfect',
    color: 'from-violet-500/20 to-purple-500/20',
    border: 'border-violet-400/30',
    dot: 'bg-violet-400',
  },
];

export default function LevelSelector({ onSelect, onBack }: LevelSelectorProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-purple-900 to-slate-900 flex flex-col items-center justify-start px-4 py-10">
      <div className="w-full max-w-md mb-6">
        <motion.button
          initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} whileTap={{ scale: 0.95 }}
          onClick={onBack}
          className="flex items-center gap-2 text-white/50 hover:text-white/80 transition-colors text-sm"
        >
          <span className="text-lg">←</span> Back
        </motion.button>
      </div>

      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-8 w-full max-w-md">
        <div className="text-4xl mb-2">🇪🇸</div>
        <h2 className="text-2xl font-bold text-white">Choose your level</h2>
        <p className="text-white/50 text-sm mt-2">Pick where you're at</p>
      </motion.div>

      <div className="w-full max-w-md flex flex-col gap-3">
        {levels.map((level, i) => (
          <motion.button
            key={level.id}
            initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 + i * 0.1, ease: 'easeOut' }}
            whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
            onClick={() => onSelect(level.id)}
            className={`w-full p-5 rounded-2xl bg-gradient-to-br ${level.color} border ${level.border} backdrop-blur-sm flex items-center gap-4 text-left cursor-pointer`}
          >
            <div className={`w-3 h-3 rounded-full ${level.dot} shrink-0`} />
            <div>
              <div className="flex items-baseline gap-2">
                <span className="text-lg font-bold text-white">{level.label}</span>
                <span className="text-white/40 text-sm font-medium">{level.sublabel}</span>
              </div>
              <div className="text-white/50 text-sm">{level.desc}</div>
            </div>
            <span className="ml-auto text-white/30 text-xl">›</span>
          </motion.button>
        ))}
      </div>
    </div>
  );
}
