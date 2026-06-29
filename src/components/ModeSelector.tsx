import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Language, Mode, SessionFilters } from '../types';

interface ModeSelectorProps {
  language: Language;
  dueCount: number;
  availableCategories: string[];
  availableTenses: string[];
  filters: SessionFilters;
  onFiltersChange: (f: SessionFilters) => void;
  categoryProgress: Record<string, { total: number; mastered: number }>;
  onSelect: (mode: Mode) => void;
  onBack: () => void;
}

const modes = [
  { id: 'flashcard' as Mode, icon: '🃏', title: 'Flashcards', desc: 'Flip to reveal', color: 'from-blue-500/20 to-indigo-500/20', border: 'border-blue-400/30' },
  { id: 'multiple-choice' as Mode, icon: '✏️', title: 'Multiple Choice', desc: 'Pick the translation', color: 'from-emerald-500/20 to-teal-500/20', border: 'border-emerald-400/30' },
  { id: 'cloze' as Mode, icon: '🔤', title: 'Fill the Blank', desc: 'Complete the sentence', color: 'from-violet-500/20 to-purple-500/20', border: 'border-violet-400/30' },
  { id: 'typing' as Mode, icon: '⌨️', title: 'Type It Out', desc: 'Produce the full translation', color: 'from-rose-500/20 to-pink-500/20', border: 'border-rose-400/30' },
];

const tenseLabels: Record<string, string> = {
  'present': 'Present',
  'present-continuous': 'Pres. cont.',
  'present-perfect': 'Pres. perfect',
  'preterite': 'Preterite',
  'imperfect': 'Imperfect',
  'future': 'Ir a...',
  'future-simple': 'Future',
  'conditional': 'Conditional',
  'imperative': 'Imperative',
  'expression': 'Expressions',
};

const langLabel: Record<Language, string> = { spanish: '🇪🇸 Español', japanese: '🇯🇵 日本語', czech: '🇨🇿 Čeština' };

export default function ModeSelector({
  language, dueCount, availableCategories, availableTenses,
  filters, onFiltersChange, categoryProgress, onSelect, onBack,
}: ModeSelectorProps) {
  const [showFilters, setShowFilters] = useState(false);

  function toggleCategory(cat: string) {
    const next = filters.categories.includes(cat)
      ? filters.categories.filter(c => c !== cat)
      : [...filters.categories, cat];
    onFiltersChange({ ...filters, categories: next });
  }

  function toggleTense(tense: string) {
    const next = filters.tenses.includes(tense)
      ? filters.tenses.filter(t => t !== tense)
      : [...filters.tenses, tense];
    onFiltersChange({ ...filters, tenses: next });
  }

  const activeFilterCount = filters.categories.length + filters.tenses.length + (filters.reverse ? 1 : 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-purple-900 to-slate-900 flex flex-col items-center justify-start px-4 py-10 overflow-y-auto">
      {/* Back */}
      <div className="w-full max-w-md mb-6">
        <motion.button
          initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} whileTap={{ scale: 0.95 }}
          onClick={onBack}
          className="flex items-center gap-2 text-white/50 hover:text-white/80 transition-colors text-sm"
        >
          <span className="text-lg">←</span> Back
        </motion.button>
      </div>

      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-6 w-full max-w-md">
        <div className="text-4xl mb-2">{language === 'spanish' ? '🇪🇸' : language === 'japanese' ? '🇯🇵' : '🇨🇿'}</div>
        <h2 className="text-2xl font-bold text-white">{langLabel[language]}</h2>
        <p className="text-white/50 text-sm mt-2">Choose your study mode</p>
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.2 }}
          className="mt-3 inline-flex items-center gap-2 bg-amber-500/20 border border-amber-400/30 rounded-full px-4 py-1.5"
        >
          <span className="text-amber-400 text-sm font-semibold">
            {dueCount > 0 ? `${dueCount} card${dueCount !== 1 ? 's' : ''} due for review` : 'No cards due — learning new words!'}
          </span>
        </motion.div>
      </motion.div>

      {/* Modes */}
      <div className="w-full max-w-md flex flex-col gap-3 mb-5">
        {modes.map((mode, i) => (
          <motion.button
            key={mode.id}
            initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 + i * 0.1, ease: 'easeOut' }}
            whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
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

      {/* Filter toggle */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.45 }} className="w-full max-w-md">
        <button
          onClick={() => setShowFilters(v => !v)}
          className="w-full flex items-center justify-between px-4 py-3 rounded-2xl border border-white/10 bg-white/5 hover:bg-white/8 transition-colors"
        >
          <span className="text-white/70 font-medium text-sm flex items-center gap-2">
            Customize session
            {activeFilterCount > 0 && (
              <span className="bg-violet-500/50 text-violet-200 text-xs px-2 py-0.5 rounded-full">{activeFilterCount}</span>
            )}
          </span>
          <span className="text-white/40 text-lg">{showFilters ? '↑' : '↓'}</span>
        </button>

        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.25 }}
              className="overflow-hidden"
            >
              <div className="pt-4 flex flex-col gap-5">

                {/* Reverse mode */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-white/60 text-xs font-semibold uppercase tracking-wider">Direction</span>
                  </div>
                  <button
                    onClick={() => onFiltersChange({ ...filters, reverse: !filters.reverse })}
                    className={`px-4 py-2 rounded-xl border text-sm font-medium transition-colors ${
                      filters.reverse
                        ? 'bg-violet-500/30 border-violet-400/50 text-violet-200'
                        : 'bg-white/5 border-white/15 text-white/50'
                    }`}
                  >
                    {filters.reverse ? '⇄ Reverse (target → English)' : '→ Forward (English → target)'}
                  </button>
                </div>

                {/* Categories */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-white/60 text-xs font-semibold uppercase tracking-wider">Categories</span>
                    {filters.categories.length > 0 && (
                      <button onClick={() => onFiltersChange({ ...filters, categories: [] })} className="text-white/30 text-xs hover:text-white/60">clear</button>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {availableCategories.map(cat => {
                      const prog = categoryProgress[cat];
                      const pct = prog ? Math.round((prog.mastered / prog.total) * 100) : 0;
                      const active = filters.categories.includes(cat);
                      return (
                        <button
                          key={cat}
                          onClick={() => toggleCategory(cat)}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-medium transition-colors ${
                            active ? 'bg-blue-500/30 border-blue-400/50 text-blue-200' : 'bg-white/5 border-white/15 text-white/50 hover:text-white/70'
                          }`}
                        >
                          <span>{cat}</span>
                          {prog && (
                            <span className={`text-xs ${pct >= 70 ? 'text-green-400' : pct >= 30 ? 'text-amber-400' : 'text-white/30'}`}>
                              {pct}%
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Tenses (Spanish only) */}
                {availableTenses.length > 0 && (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-white/60 text-xs font-semibold uppercase tracking-wider">Tense focus</span>
                      {filters.tenses.length > 0 && (
                        <button onClick={() => onFiltersChange({ ...filters, tenses: [] })} className="text-white/30 text-xs hover:text-white/60">clear</button>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {availableTenses.map(tense => {
                        const active = filters.tenses.includes(tense);
                        return (
                          <button
                            key={tense}
                            onClick={() => toggleTense(tense)}
                            className={`px-3 py-1.5 rounded-xl border text-xs font-medium transition-colors ${
                              active ? 'bg-emerald-500/30 border-emerald-400/50 text-emerald-200' : 'bg-white/5 border-white/15 text-white/50 hover:text-white/70'
                            }`}
                          >
                            {tenseLabels[tense] ?? tense}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Category progress bars */}
                {Object.keys(categoryProgress).length > 0 && (
                  <div>
                    <span className="text-white/60 text-xs font-semibold uppercase tracking-wider block mb-2">Progress</span>
                    <div className="flex flex-col gap-2">
                      {availableCategories.map(cat => {
                        const prog = categoryProgress[cat];
                        if (!prog) return null;
                        const pct = Math.round((prog.mastered / prog.total) * 100);
                        return (
                          <div key={cat} className="flex items-center gap-3">
                            <span className="text-white/40 text-xs w-24 shrink-0 capitalize">{cat}</span>
                            <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
                              <motion.div
                                className="h-full rounded-full"
                                style={{ background: pct >= 70 ? 'rgb(74 222 128)' : pct >= 30 ? 'rgb(251 191 36)' : 'rgb(139 92 246)' }}
                                initial={{ width: 0 }}
                                animate={{ width: `${pct}%` }}
                                transition={{ duration: 0.6, ease: 'easeOut' }}
                              />
                            </div>
                            <span className="text-white/30 text-xs w-12 text-right shrink-0">{prog.mastered}/{prog.total}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
