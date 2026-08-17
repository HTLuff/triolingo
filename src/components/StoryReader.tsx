import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { StoryChapter, StoryLevel, StoryToken, Language } from '../types';
import { langConfig } from '../config/languages';

interface StoryReaderProps {
  chapter: StoryChapter;
  language: Language;
  level: StoryLevel;
  onLevelChange: (level: StoryLevel) => void;
  onComplete: (chapterId: number) => void;
  onBack: () => void;
}

const LEVEL_IDS: StoryLevel[] = ['a0', 'a1', 'a2'];

function tappable(tok: StoryToken): boolean {
  return !!(tok.r && tok.r.length) || !!(tok.g && tok.g.length);
}

function reveal(tok: StoryToken, flag: string): { label: string; value: string } | null {
  if (tok.r && tok.r.length) return { label: flag, value: tok.r };
  if (tok.g && tok.g.length) return { label: 'EN', value: tok.g };
  return null;
}

interface ActiveReveal {
  key: string;
  word: string;
  label: string;
  value: string;
}

export default function StoryReader({ chapter, language, level, onLevelChange, onComplete, onBack }: StoryReaderProps) {
  const [active, setActive] = useState<ActiveReveal | null>(null);
  const { flag, storyLevelDesc } = langConfig(language);

  // Close any open reveal when the level or chapter changes.
  useEffect(() => { setActive(null); }, [level, chapter.id]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-purple-900 to-slate-900 flex flex-col">
      {/* Top bar */}
      <div className="sticky top-0 z-40 px-4 pt-3 pb-3 bg-indigo-950/80 backdrop-blur-sm border-b border-white/10">
        <div className="max-w-md mx-auto flex items-center gap-3">
          <button
            onClick={onBack}
            className="shrink-0 text-white/40 hover:text-white/80 transition-colors text-xl leading-none"
            aria-label="Back to chapters"
          >
            ✕
          </button>
          <div className="flex-1 min-w-0">
            <div className="text-white/40 text-xs">Chapter {chapter.id}</div>
            <div className="text-white font-semibold text-sm truncate">{chapter.title}</div>
          </div>
        </div>

        {/* Level toggle */}
        <div className="max-w-md mx-auto mt-3 flex gap-1.5 p-1 bg-white/5 rounded-xl border border-white/10">
          {LEVEL_IDS.map(id => (
            <button
              key={id}
              onClick={() => onLevelChange(id)}
              className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                level === id ? 'bg-violet-500/40 text-violet-100' : 'text-white/40 hover:text-white/70'
              }`}
            >
              {id.toUpperCase()}
            </button>
          ))}
        </div>
        <p className="max-w-md mx-auto mt-1.5 text-center text-white/30 text-xs">
          {storyLevelDesc[level]} · tap a word to reveal
        </p>
      </div>

      {/* Reading area */}
      <div className="flex-1 overflow-y-auto px-4 py-6">
        <div className="max-w-md mx-auto flex flex-col gap-4 pb-28">
          {chapter.lines.map((line, li) => {
            const tokens = line[level];
            return (
              <motion.p
                key={`${chapter.id}-${li}`}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(li * 0.03, 0.4) }}
                className="text-lg leading-relaxed text-white/90 flex flex-wrap gap-x-1.5 gap-y-1 items-baseline"
              >
                {line.speaker && (
                  <span className="w-full text-violet-300/60 text-xs font-semibold uppercase tracking-wider mb-0.5">
                    {line.speaker}
                  </span>
                )}
                {tokens.map((tok, ti) => {
                  const key = `${li}-${ti}`;
                  const rev = reveal(tok, flag);
                  const canTap = tappable(tok) && rev;
                  const isOpen = active?.key === key;
                  if (!canTap || !rev) {
                    return <span key={ti} className="text-white/85">{tok.t}</span>;
                  }
                  return (
                    <button
                      key={ti}
                      onClick={() => setActive(isOpen ? null : { key, word: tok.t, label: rev.label, value: rev.value })}
                      className={`transition-colors underline decoration-dotted underline-offset-4 ${
                        isOpen
                          ? 'text-violet-200 decoration-violet-300 bg-violet-500/20 rounded-md px-0.5'
                          : 'text-white/85 hover:text-white decoration-white/30'
                      }`}
                    >
                      {tok.t}
                    </button>
                  );
                })}
              </motion.p>
            );
          })}

          {/* Finish */}
          <motion.button
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => onComplete(chapter.id)}
            className="mt-6 w-full min-h-14 rounded-2xl bg-green-500/25 border border-green-400/50 text-green-100 font-bold text-lg hover:bg-green-500/35 transition-colors cursor-pointer"
          >
            Finish chapter ✓
          </motion.button>
        </div>
      </div>

      {/* Fixed reveal bar (mobile-safe) */}
      <AnimatePresence>
        {active && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 30 }}
            transition={{ type: 'spring', stiffness: 400, damping: 32 }}
            className="fixed bottom-0 left-0 right-0 z-50 px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3 bg-violet-950/90 backdrop-blur-md border-t border-violet-400/30"
          >
            <div className="max-w-md mx-auto flex items-center gap-3">
              <div className="flex-1 min-w-0 flex items-baseline gap-2 flex-wrap">
                <span className="text-white/50 text-sm line-through decoration-white/20">{active.word.replace(/["«»—.,;:!?¿¡]/g, '')}</span>
                <span className="text-white/30">→</span>
                <span className="text-xs text-violet-300/70 font-semibold">{active.label}</span>
                <span className="text-white font-bold text-lg break-words">{active.value}</span>
              </div>
              <button
                onClick={() => setActive(null)}
                className="shrink-0 w-8 h-8 rounded-full bg-white/10 text-white/60 hover:text-white hover:bg-white/15 transition-colors flex items-center justify-center text-lg leading-none"
                aria-label="Close"
              >
                ✕
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
