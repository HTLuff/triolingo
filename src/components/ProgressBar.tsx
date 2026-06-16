import { motion } from 'framer-motion';

interface ProgressBarProps {
  current: number;
  total: number;
  onBack: () => void;
}

export default function ProgressBar({ current, total, onBack }: ProgressBarProps) {
  const pct = total > 0 ? (current / total) * 100 : 0;

  return (
    <div className="fixed top-0 left-0 right-0 z-50 px-4 pt-3 pb-2 bg-indigo-950/80 backdrop-blur-sm border-b border-white/10">
      <div className="max-w-md mx-auto flex items-center gap-3">
        {/* Back button */}
        <button
          onClick={onBack}
          className="shrink-0 text-white/40 hover:text-white/80 transition-colors text-xl leading-none"
          aria-label="Back to menu"
        >
          ✕
        </button>

        {/* Progress bar */}
        <div className="flex-1 h-3 bg-white/10 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-green-400 to-emerald-500 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ type: 'spring', stiffness: 80, damping: 20 }}
          />
        </div>

        {/* Count */}
        <span className="text-white/60 text-sm font-medium shrink-0">
          {current}/{total}
        </span>
      </div>
    </div>
  );
}
