import { useState, FormEvent } from 'react';
import { NewTask } from '../types';
import { Plus, Tag, Calendar } from 'lucide-react';
import { motion } from 'motion/react';
import { useTranslation } from 'react-i18next';

interface AddTaskFormProps {
  onAdd: (task: NewTask) => Promise<void>;
}

const CATEGORIES = ['Work', 'Personal', 'Fitness', 'Study', 'Finance', 'Shopping'];

export default function AddTaskForm({ onAdd }: AddTaskFormProps) {
  const { t, i18n } = useTranslation();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [effort, setEffort] = useState(5);
  const [category, setCategory] = useState('Personal');
  const [customCategory, setCustomCategory] = useState('');
  const [showCustomCat, setShowCustomCat] = useState(false);
  const [dueDate, setDueDate] = useState(() => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [difficulty, setDifficulty] = useState(1);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;

    setIsSubmitting(true);
    try {
      const finalCategory = showCustomCat && customCategory.trim() 
        ? customCategory.trim() 
        : category;

      await onAdd({
        title: title.trim(),
        description: description.trim(),
        completed: false,
        priority,
        category: finalCategory,
        dueDate,
        effort,
        favorite: false,
        difficulty,
      });

      // Reset form
      setTitle('');
      setDescription('');
      setPriority('medium');
      setEffort(5);
      setCustomCategory('');
      setShowCustomCat(false);
      setDifficulty(1);
      setIsExpanded(false);
    } catch (error) {
      console.error('Error adding task in form:', error);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-xs mb-6 hover:shadow-md transition-shadow duration-300">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Compact view input */}
        <div className="flex gap-2 items-center">
          <input
            type="text"
            id="task-title-input"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={t('input_placeholder')}
            required
            className="flex-1 px-4 py-3 bg-slate-50 border-0 rounded-xl text-slate-700 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:bg-white transition-all text-sm font-medium"
            onFocus={() => setIsExpanded(true)}
          />

          {!isExpanded && (
            <button
              type="button"
              id="expand-form-btn"
              onClick={() => setIsExpanded(true)}
              className="px-4 py-3 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-xl font-semibold text-sm transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
            >
              <Plus className="w-4 h-4" /> {t('add_btn')}
            </button>
          )}
        </div>

        {/* Expanded options */}
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            transition={{ duration: 0.25 }}
            className="space-y-4 pt-2 border-t border-slate-50"
          >
            {/* Description */}
            <div className="space-y-1">
              <label htmlFor="task-desc-input" className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{t('description_label')}</label>
              <textarea
                id="task-desc-input"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={t('description_placeholder')}
                rows={2}
                className="w-full px-4 py-2.5 bg-slate-50 border-0 rounded-xl text-slate-700 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:bg-white transition-all text-sm resize-none"
              />
            </div>

            {/* Selection Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              {/* Priority Selection */}
              <div className="space-y-1.5">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">{t('priority_label')}</span>
                <div className="flex gap-2">
                  {(['low', 'medium', 'high'] as const).map((p) => {
                    const active = priority === p;
                    const colors = {
                      low: active ? 'bg-slate-100 text-slate-700 border-slate-300' : 'bg-slate-50 text-slate-400 border-transparent hover:bg-slate-100',
                      medium: active ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-slate-50 text-slate-400 border-transparent hover:bg-slate-100',
                      high: active ? 'bg-rose-50 text-rose-700 border-rose-200' : 'bg-slate-50 text-slate-400 border-transparent hover:bg-slate-100',
                    };
                    return (
                      <button
                        key={p}
                        type="button"
                        id={`priority-${p}-btn`}
                        onClick={() => setPriority(p)}
                        className={`flex-1 py-1.5 rounded-lg border text-xs font-semibold capitalize transition-all cursor-pointer ${colors[p]}`}
                      >
                        {t(`priority_${p}`)}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Due Date selection */}
              <div className="space-y-1.5">
                <label htmlFor="due-date-input" className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" /> {t('due_date_label')}
                </label>
                <input
                  type="date"
                  id="due-date-input"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-50 border-0 rounded-lg text-slate-600 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:bg-white transition-all text-xs font-medium"
                />
              </div>

              {/* Effort / Energy selection */}
              <div className="space-y-1.5">
                <label htmlFor="task-effort-input" className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex justify-between">
                  <span>{t('effort_label')}</span>
                  <span className="text-indigo-600 font-bold bg-indigo-50 px-1.5 py-0.2 rounded">{effort}</span>
                </label>
                <input
                  type="range"
                  id="task-effort-input"
                  min="1"
                  max="10"
                  value={effort}
                  onChange={(e) => setEffort(Number(e.target.value))}
                  className="w-full accent-indigo-600 h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer mt-3"
                />
                <span className="text-[10px] text-slate-400 font-semibold block text-center">
                  {effort <= 3 ? t('energy_low') : effort <= 7 ? t('energy_medium') : t('energy_high')}
                </span>
              </div>

              {/* Difficulty Level Selection */}
              <div className="space-y-1.5">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Difficulty (Points)</span>
                <div className="flex gap-1">
                  {([1, 2, 3, 4, 5] as const).map((level) => {
                    const active = difficulty === level;
                    const activeColors = [
                      '',
                      'bg-emerald-500 text-white border-emerald-500 hover:bg-emerald-600',
                      'bg-teal-500 text-white border-teal-500 hover:bg-teal-600',
                      'bg-amber-500 text-white border-amber-500 hover:bg-amber-600',
                      'bg-orange-500 text-white border-orange-500 hover:bg-orange-600',
                      'bg-rose-500 text-white border-rose-500 hover:bg-rose-600'
                    ];
                    return (
                      <button
                        key={level}
                        type="button"
                        id={`difficulty-${level}-btn`}
                        onClick={() => setDifficulty(level)}
                        className={`flex-1 py-1 rounded-lg border text-xs font-extrabold transition-all cursor-pointer ${
                          active
                            ? activeColors[level]
                            : 'bg-slate-50 text-slate-400 border-transparent hover:bg-slate-100 hover:text-slate-700'
                        }`}
                        title={`Difficulty level ${level} (${level * 10} XP/Points)`}
                      >
                        {level}
                      </button>
                    );
                  })}
                </div>
                <span className="text-[10px] text-slate-400 font-semibold block text-center">
                  Awards {difficulty * 10} XP / Points
                </span>
              </div>
            </div>

            {/* Category selection */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                  <Tag className="w-3.5 h-3.5 text-slate-400" /> {t('category_label')}
                </span>
                <button
                  type="button"
                  id="toggle-custom-category-btn"
                  onClick={() => setShowCustomCat(!showCustomCat)}
                  className="text-xs text-indigo-600 hover:text-indigo-700 font-semibold cursor-pointer"
                >
                  {showCustomCat ? t('select_preset_cat') : t('add_custom_cat')}
                </button>
              </div>

              {showCustomCat ? (
                <input
                  type="text"
                  id="custom-category-input"
                  value={customCategory}
                  onChange={(e) => setCustomCategory(e.target.value)}
                  placeholder={t('custom_cat_placeholder')}
                  className="w-full px-4 py-2 bg-slate-50 border-0 rounded-xl text-slate-700 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:bg-white transition-all text-xs font-medium"
                />
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {CATEGORIES.map((cat) => {
                    const active = category === cat;
                    return (
                      <button
                        key={cat}
                        type="button"
                        id={`category-preset-${cat.toLowerCase()}-btn`}
                        onClick={() => setCategory(cat)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                          active
                            ? 'bg-indigo-600 text-white shadow-xs'
                            : 'bg-slate-50 text-slate-500 hover:bg-slate-100 hover:text-slate-700'
                        }`}
                      >
                        {t(`cat_${cat.toLowerCase()}`)}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Action buttons */}
            <div className="flex gap-2 justify-end pt-2">
              <button
                type="button"
                id="cancel-form-btn"
                onClick={() => {
                  setIsExpanded(false);
                  setTitle('');
                  setDescription('');
                }}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl font-semibold text-xs transition-all cursor-pointer"
              >
                {t('cancel_btn')}
              </button>
              <button
                type="submit"
                id="submit-task-btn"
                disabled={isSubmitting || !title.trim()}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white disabled:opacity-50 rounded-xl font-semibold text-xs shadow-md shadow-indigo-100 flex items-center gap-1.5 transition-all cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <svg className="animate-spin h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    {t('creating_btn')}
                  </>
                ) : (
                  <>
                    <Plus className="w-3.5 h-3.5" /> {t('save_task_btn')}
                  </>
                )}
              </button>
            </div>
          </motion.div>
        )}
      </form>
    </div>
  );
}
