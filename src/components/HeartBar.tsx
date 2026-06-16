import { motion, AnimatePresence } from 'framer-motion';

interface HeartBarProps {
  hearts: number;
}

export default function HeartBar({ hearts }: HeartBarProps) {
  return (
    <div className="flex gap-1">
      {Array.from({ length: 5 }).map((_, i) => (
        <AnimatePresence key={i} mode="wait">
          <motion.span
            key={`heart-${i}-${i < hearts ? 'full' : 'empty'}`}
            initial={{ scale: 1.4 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0.5, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 15 }}
            className={`text-xl ${i < hearts ? '' : 'grayscale opacity-30'}`}
          >
            ❤️
          </motion.span>
        </AnimatePresence>
      ))}
    </div>
  );
}
