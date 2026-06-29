import { motion } from 'framer-motion';
import type { Language } from '../types';
import { useLocalStorage } from '../hooks/useLocalStorage';

interface LanguageSelectorProps {
  onSelect: (lang: Language) => void;
}

function LangCard({ lang, delay, onSelect }: {
  lang: { id: Language; flag: string; name: string; count: string; desc: string; bg: string; border: string; countColor: string };
  delay: number;
  onSelect: (l: Language) => void;
}) {
  return (
    <motion.button
      initial={{ opacity: 0, x: -40 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay, duration: 0.5, ease: 'easeOut' }}
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.97 }}
      onClick={() => onSelect(lang.id)}
      style={{ background: lang.bg, border: lang.border }}
      className="w-full p-5 rounded-2xl backdrop-blur-sm flex items-center gap-4 text-left cursor-pointer transition-shadow hover:shadow-xl hover:shadow-purple-900/40"
    >
      <span className="text-5xl">{lang.flag}</span>
      <div className="flex-1">
        <div className="text-2xl font-bold text-white">{lang.name}</div>
        <div className="text-white/60 text-sm">{lang.desc}</div>
      </div>
      <div className="text-right">
        <div className={`text-sm font-semibold ${lang.countColor}`}>{lang.count}</div>
        <div className="text-white/40 text-xs mt-0.5">to learn</div>
      </div>
    </motion.button>
  );
}

const languages = [
  { id: 'spanish' as Language, flag: '🇪🇸', name: 'Español', count: '95 sentences', desc: 'Spanish', bg: 'linear-gradient(135deg, rgba(239,68,68,0.35) 0%, rgba(234,179,8,0.28) 100%)', border: '1.5px solid rgba(250,204,21,0.55)', countColor: 'text-yellow-300' },
  { id: 'japanese' as Language, flag: '🇯🇵', name: '日本語', count: '100 sentences', desc: 'Japanese', bg: 'linear-gradient(135deg, rgba(239,68,68,0.35) 0%, rgba(244,114,182,0.22) 100%)', border: '1.5px solid rgba(248,113,113,0.55)', countColor: 'text-red-300' },
  { id: 'czech' as Language, flag: '🇨🇿', name: 'Čeština', count: '3 sentences', desc: 'Czech', bg: 'linear-gradient(135deg, rgba(30,64,175,0.35) 0%, rgba(220,38,38,0.22) 100%)', border: '1.5px solid rgba(96,165,250,0.55)', countColor: 'text-blue-300' },
];

export default function LanguageSelector({ onSelect }: LanguageSelectorProps) {
  const [streak] = useLocalStorage<number>('triolingo_streak', 0);
  const [totalLearned] = useLocalStorage<number>('triolingo_total_learned', 0);
  const [lastPracticed] = useLocalStorage<string>('triolingo_last_practiced', '');

  const today = new Date().toDateString();
  const yesterday = new Date(Date.now() - 86400000).toDateString();
  const validStreak = lastPracticed === today || lastPracticed === yesterday ? streak : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-purple-900 to-slate-900 flex flex-col items-center justify-center px-4 py-10">
      {/* Title */}
      <motion.div
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="text-center mb-10"
      >
        <h1 className="text-5xl font-black bg-gradient-to-r from-violet-400 via-pink-400 to-amber-400 bg-clip-text text-transparent mb-2 tracking-tight">
          Triolingo
        </h1>
        <p className="text-white/60 text-lg">Learn with your brain, not just your eyes</p>
      </motion.div>

      {/* Language cards */}
      <div className="w-full max-w-md flex flex-col gap-4">
        {languages.map((lang, i) => (
          <LangCard key={lang.id} lang={lang} delay={i * 0.15} onSelect={onSelect} />
        ))}
      </div>

      {/* Stats */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.5 }}
        className="mt-8 w-full max-w-md grid grid-cols-2 gap-3"
      >
        <div className="bg-white/5 border border-white/10 rounded-2xl p-4 text-center">
          <div className="text-3xl font-black text-orange-400">{validStreak}</div>
          <div className="text-white/50 text-sm mt-1">day streak 🔥</div>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-2xl p-4 text-center">
          <div className="text-3xl font-black text-violet-400">{totalLearned}</div>
          <div className="text-white/50 text-sm mt-1">cards learned ✨</div>
        </div>
      </motion.div>
    </div>
  );
}
