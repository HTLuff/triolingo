import { motion } from 'framer-motion';
import type { Story } from '../types';

interface StorySelectProps {
  story: Story;
  completed: number[];        // completed chapter ids
  onSelectChapter: (chapterId: number) => void;
  onBack: () => void;
}

export default function StorySelect({ story, completed, onSelectChapter, onBack }: StorySelectProps) {
  const maxCompleted = completed.length ? Math.max(...completed) : 0;

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

      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-8 w-full max-w-md">
        <div className="text-4xl mb-2">📖</div>
        <h2 className="text-2xl font-bold text-white">{story.title}</h2>
        <p className="text-white/50 text-sm mt-3 leading-relaxed">{story.blurb}</p>
      </motion.div>

      <div className="w-full max-w-md flex flex-col gap-3">
        {story.chapters.map((ch, i) => {
          const isDone = completed.includes(ch.id);
          const isLocked = ch.id > maxCompleted + 1;
          return (
            <motion.button
              key={ch.id}
              initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + i * 0.06, ease: 'easeOut' }}
              whileHover={isLocked ? {} : { scale: 1.02 }} whileTap={isLocked ? {} : { scale: 0.97 }}
              onClick={() => !isLocked && onSelectChapter(ch.id)}
              disabled={isLocked}
              className={`w-full p-5 rounded-2xl border backdrop-blur-sm flex items-center gap-4 text-left transition-colors ${
                isLocked
                  ? 'bg-white/[0.03] border-white/10 cursor-not-allowed'
                  : isDone
                  ? 'bg-gradient-to-br from-green-500/15 to-emerald-500/15 border-green-400/30 cursor-pointer'
                  : 'bg-gradient-to-br from-violet-500/20 to-purple-500/20 border-violet-400/30 cursor-pointer'
              }`}
            >
              <div className={`w-9 h-9 rounded-full shrink-0 flex items-center justify-center text-sm font-bold ${
                isLocked ? 'bg-white/5 text-white/25' : isDone ? 'bg-green-400/25 text-green-200' : 'bg-violet-400/25 text-violet-100'
              }`}>
                {isLocked ? '🔒' : isDone ? '✓' : ch.id}
              </div>
              <div className="min-w-0">
                <div className="text-xs text-white/40">Chapter {ch.id}</div>
                <div className={`text-lg font-bold truncate ${isLocked ? 'text-white/30' : 'text-white'}`}>{ch.title}</div>
                <div className="text-white/40 text-sm">{ch.lines.length} lines</div>
              </div>
              {!isLocked && <span className="ml-auto text-white/30 text-xl">›</span>}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
