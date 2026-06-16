import { motion } from 'framer-motion';
import type { UserGender } from '../types';

interface GenderSelectorProps {
  onSelect: (gender: UserGender) => void;
  onBack: () => void;
}

const cards = [
  {
    id: 'male' as UserGender,
    kanji: '男性',
    reading: 'だんせい',
    label: 'Masculine speech',
    examples: ['腹減った', 'ちょっと待てよ'],
    borderColor: 'rgba(59,130,246,0.25)',
    bgGradient: 'linear-gradient(135deg, rgba(59,130,246,0.15) 0%, rgba(99,102,241,0.10) 100%)',
    accentColor: '#93c5fd',
  },
  {
    id: 'female' as UserGender,
    kanji: '女性',
    reading: 'じょせい',
    label: 'Feminine speech',
    examples: ['お腹空いた', 'ちょっと待ってよ'],
    borderColor: 'rgba(236,72,153,0.25)',
    bgGradient: 'linear-gradient(135deg, rgba(236,72,153,0.15) 0%, rgba(168,85,247,0.10) 100%)',
    accentColor: '#f9a8d4',
  },
];

export default function GenderSelector({ onSelect, onBack }: GenderSelectorProps) {
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

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, x: 40 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="text-center mb-8 w-full max-w-md"
      >
        <div className="text-4xl mb-3">🇯🇵</div>
        <h2 className="text-2xl font-bold text-white mb-2">How would you like to speak Japanese?</h2>
        <p className="text-white/50 text-sm">Japanese has different casual speech for men and women</p>
      </motion.div>

      {/* Cards side by side */}
      <div className="w-full max-w-md flex flex-row gap-4">
        {cards.map((card, i) => (
          <motion.button
            key={card.id}
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 + i * 0.12, duration: 0.4, ease: 'easeOut' }}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => onSelect(card.id)}
            style={{
              background: card.bgGradient,
              border: `1.5px solid ${card.borderColor}`,
            }}
            className="flex-1 p-5 rounded-2xl backdrop-blur-sm flex flex-col items-center text-center gap-3 cursor-pointer transition-shadow hover:shadow-xl hover:shadow-purple-900/40"
          >
            <div className="text-3xl font-black" style={{ color: card.accentColor }}>
              {card.kanji}
            </div>
            <div className="text-white/50 text-xs">{card.reading}</div>
            <div className="text-white font-semibold text-sm">{card.label}</div>
            <div className="flex flex-col gap-1 mt-1">
              {card.examples.map(ex => (
                <div key={ex} className="text-white/40 text-xs font-mono">{ex}</div>
              ))}
            </div>
          </motion.button>
        ))}
      </div>

      {/* Note */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="text-white/30 text-xs text-center mt-6 w-full max-w-md leading-relaxed"
      >
        Formal speech (です/ます) is the same for everyone — this only affects casual expressions
      </motion.p>
    </div>
  );
}
