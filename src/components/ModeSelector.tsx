import { motion } from 'framer-motion';
import type { Language, Mode } from '../types';

interface ModeSelectorProps {
  language: Language;
  dueCount: number;
  onSelect: (mode: Mode) => void;
  onBack: () => void;
}

const modes = [
  {
    id: 'flashcard' as Mode,
    icon: '🃏',
    title: 'Flashcards',
    desc: 'Flip to reveal the answer',
    color: 'from-blue-500/20 to-indigo-500/20',
    border: 'border-blue-400/30',
  },
  {
    id: 'multiple-choice' as Mode,
    icon: '✏️',
    title: 'Multiple Choice',
    desc: 'Choose the correct translation',
    color: 'from-emerald-500/20 to-teal-500/20',
    border: 'border-emerald-400/30',
  },
];

const langLabel: Record<Language, string> = {
  spanish: '🇪🇸 Español',
  japanese: '🇯🇵 日本語',
};

export default function ModeSelector({ language, dueCount, onSelect, onBack }: ModeSelectorProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-purple-900 to-slate-900 flex flex-col items-center justify-center px-4 py-10">
      {/* Back */}
      <div className="w-full max-w-md mb-6">
        <motion.button
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          whileTap={{ scale: 0.95 }}
          onClick={onBack}
          className="flex items-center gap-2 text-white/50 hover:text-white/80 transition-colors text-sm"
        >
          <span className="text-lg">←</span> Back
        </motion.button>
      </div>

      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-8 w-full max-w-md"
      >
        <div className="text-4xl mb-2">{language === 'spanish' ? '🇪🇸' : '🇯🇵'}</div>
        <h2 className="text-2xl font-bold text-white">{langLabel[language]}</h2>
        <p className="text-white/50 text-sm mt-2">Choose your study mode</p>

        {/* Due badge */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="mt-3 inline-flex items-center gap-2 bg-amber-500/20 border border-amber-400/30 rounded-full px-4 py-1.5"
        >
          <span className="text-amber-400 text-sm font-semibold">
            {dueCount > 0
              ? `${dueCount} card${dueCount !== 1 ? 's' : ''} due for review`
              : 'No cards due — learning new words!'}
          </span>
        </motion.div>
      </motion.div>

      <div className="w-full max-w-md flex flex-col gap-4">
        {modes.map((mode, i) => (
          <motion.button
            key={mode.id}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 + i * 0.12, ease: 'easeOut' }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => onSelect(mode.id)}
            className={`w-full p-5 rounded-2xl bg-gradient-to-br ${mode.color} border ${mode.border} backdrop-blur-sm flex items-center gap-4 text-left cursor-pointer`}
          >
            <span className="text-4xl">{mode.icon}</span>
            <div>
              <div className="text-lg font-bold text-white">{mode.title}</div>
              <div className="text-white/50 text-sm">{mode.desc}</div>
            </div>
            <span className="ml-auto text-white/30 text-xl">›</span>
          </motion.button>
        ))}
      </div>
    </div>
  );
}
