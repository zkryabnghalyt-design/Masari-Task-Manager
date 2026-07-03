import { useState } from 'react';
import { Task } from '../types';
import { Trash2, Edit2, Calendar, Tag, Check, ChevronDown, ChevronUp, Heart } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useTranslation } from 'react-i18next';

interface TaskItemProps {
  task: Task;
  onToggle: (id: string, completed: boolean) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onUpdate: (id: string, updates: Partial<Task>) => Promise<void>;
}

export default function TaskItem({ task, onToggle, onDelete, onUpdate }: TaskItemProps) {
  const { t } = useTranslation();
  const [isEditing, setIsEditing] = useState(false);
  const [editedTitle, setEditedTitle] = useState(task.title);
  const [editedDescription, setEditedDescription] = useState(task.description || '');
  const [editedPriority, setEditedPriority] = useState(task.priority);
  const [editedCategory, setEditedCategory] = useState(task.category);
  const [editedEffort, setEditedEffort] = useState(task.effort || 5);
  const [editedDifficulty, setEditedDifficulty] = useState(task.difficulty || 1);
  const [isSaving, setIsSaving] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  // Style mappings
  const priorityColor = {
    low: {
      bar: 'bg-slate-300',
      badge: 'bg-slate-100 text-slate-600',
    },
    medium: {
      bar: 'bg-amber-400',
      badge: 'bg-amber-50 text-amber-700 border-amber-100',
    },
    high: {
      bar: 'bg-rose-500',
      badge: 'bg-rose-50 text-rose-700 border-rose-100',
    },
  };

  async function handleSave() {
    if (!editedTitle.trim()) return;
    setIsSaving(true);
    try {
      await onUpdate(task.id, {
        title: editedTitle.trim(),
        description: editedDescription.trim(),
        priority: editedPriority,
        category: editedCategory.trim(),
        effort: editedEffort,
        difficulty: editedDifficulty,
      });
      setIsEditing(false);
    } catch (error) {
      console.error('Error saving updated task:', error);
    } finally {
      setIsSaving(false);
    }
  }

  // Get displayed translated category
  const displayCategory = (() => {
    const key = `cat_${task.category.toLowerCase()}`;
    const trans = t(key);
    // If translation key doesn't exist, it returns the key or same value. Let's make sure if we get cat_... back we fall back to raw
    return trans.startsWith('cat_') ? task.category : trans;
  })();

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.2 }}
      className={`relative bg-white border border-slate-100 rounded-xl overflow-hidden shadow-xs hover:shadow-md transition-shadow duration-300 ${
        task.completed ? 'opacity-70' : ''
      }`}
    >
      {/* Priority accent bar on left/right depending on RTL */}
      <div className="absolute top-0 bottom-0 w-1 bg-slate-300 ltr:left-0 rtl:right-0" style={{ backgroundColor: priorityColor[task.priority].bar === 'bg-slate-300' ? '#cbd5e1' : priorityColor[task.priority].bar === 'bg-amber-400' ? '#fbbf24' : '#f43f5e' }} />

      <div className="p-4 pl-5 pr-5">
        {isEditing ? (
          /* Inline Editing Mode */
          <div className="space-y-3">
            <div className="space-y-1">
              <label htmlFor={`edit-title-${task.id}`} className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{t('edit_title')}</label>
              <input
                type="text"
                id={`edit-title-${task.id}`}
                value={editedTitle}
                onChange={(e) => setEditedTitle(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 text-sm font-medium focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:bg-white"
              />
            </div>

            <div className="space-y-1">
              <label htmlFor={`edit-desc-${task.id}`} className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{t('edit_notes')}</label>
              <textarea
                id={`edit-desc-${task.id}`}
                value={editedDescription}
                onChange={(e) => setEditedDescription(e.target.value)}
                rows={2}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 text-xs focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:bg-white"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div className="space-y-1">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">{t('priority_label')}</span>
                <select
                  id={`edit-priority-${task.id}`}
                  value={editedPriority}
                  onChange={(e) => setEditedPriority(e.target.value as 'low' | 'medium' | 'high')}
                  className="w-full px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 text-xs font-medium"
                >
                  <option value="low">{t('priority_low')}</option>
                  <option value="medium">{t('priority_medium')}</option>
                  <option value="high">{t('priority_high')}</option>
                </select>
              </div>

              <div className="space-y-1">
                <label htmlFor={`edit-cat-${task.id}`} className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">{t('category_label')}</label>
                <input
                  type="text"
                  id={`edit-cat-${task.id}`}
                  value={editedCategory}
                  onChange={(e) => setEditedCategory(e.target.value)}
                  className="w-full px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 text-xs font-medium"
                />
              </div>

              <div className="space-y-1">
                <label htmlFor={`edit-effort-${task.id}`} className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex justify-between">
                  <span>{t('effort_label')}</span>
                  <span className="text-indigo-600 font-bold">{editedEffort}</span>
                </label>
                <input
                  type="range"
                  id={`edit-effort-${task.id}`}
                  min="1"
                  max="10"
                  value={editedEffort}
                  onChange={(e) => setEditedEffort(Number(e.target.value))}
                  className="w-full accent-indigo-600 h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer mt-1.5"
                />
              </div>

              <div className="space-y-1">
                <label htmlFor={`edit-difficulty-${task.id}`} className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Difficulty</label>
                <select
                  id={`edit-difficulty-${task.id}`}
                  value={editedDifficulty}
                  onChange={(e) => setEditedDifficulty(Number(e.target.value))}
                  className="w-full px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 text-xs font-medium"
                >
                  <option value={1}>1 (Easy - 10 pts)</option>
                  <option value={2}>2 (Medium - 20 pts)</option>
                  <option value={3}>3 (Hard - 30 pts)</option>
                  <option value={4}>4 (Expert - 40 pts)</option>
                  <option value={5}>5 (Legendary - 50 pts)</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                id={`cancel-edit-${task.id}-btn`}
                onClick={() => {
                  setIsEditing(false);
                  setEditedTitle(task.title);
                  setEditedDescription(task.description || '');
                  setEditedPriority(task.priority);
                  setEditedCategory(task.category);
                  setEditedEffort(task.effort || 5);
                  setEditedDifficulty(task.difficulty || 1);
                }}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg font-semibold text-xs transition-all cursor-pointer"
              >
                {t('cancel_btn')}
              </button>
              <button
                type="button"
                id={`save-edit-${task.id}-btn`}
                onClick={handleSave}
                disabled={isSaving || !editedTitle.trim()}
                className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold text-xs transition-all cursor-pointer"
              >
                {isSaving ? t('saving_loader') : t('save_task_btn')}
              </button>
            </div>
          </div>
        ) : (
          /* Normal Display Mode */
          <div>
            <div className="flex items-start gap-3">
              {/* Custom Checkbox circle */}
              <button
                type="button"
                id={`toggle-task-${task.id}-btn`}
                onClick={() => onToggle(task.id, !task.completed)}
                className={`mt-0.5 w-5 h-5 flex items-center justify-center rounded-full border transition-all cursor-pointer shrink-0 ${
                  task.completed
                    ? 'bg-emerald-500 border-emerald-500 text-white'
                    : 'border-slate-300 hover:border-indigo-500 hover:bg-indigo-50/30'
                }`}
              >
                {task.completed && <Check className="w-3.5 h-3.5 stroke-[3px]" />}
              </button>

              {/* Task info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <h3
                    id={`task-title-text-${task.id}`}
                    onClick={() => setIsExpanded(!isExpanded)}
                    className={`text-sm font-semibold text-slate-800 break-words cursor-pointer ${
                      task.completed ? 'line-through text-slate-400 font-normal' : ''
                    }`}
                  >
                    {task.title}
                  </h3>
                  
                  {/* Action buttons */}
                  <div className="flex items-center gap-1 opacity-60 hover:opacity-100 transition-opacity">
                    <button
                      type="button"
                      id={`favorite-task-btn-${task.id}`}
                      onClick={() => onUpdate(task.id, { favorite: !task.favorite })}
                      className={`p-1 rounded-md transition-colors cursor-pointer ${
                        task.favorite 
                          ? 'text-rose-500 hover:text-rose-600 hover:bg-rose-50/50' 
                          : 'text-slate-400 hover:text-rose-500 hover:bg-slate-50'
                      }`}
                      title={task.favorite ? "Remove from favorites" : "Add to favorites"}
                    >
                      <Heart className={`w-3.5 h-3.5 ${task.favorite ? 'fill-rose-500 text-rose-500' : ''}`} />
                    </button>
                    <button
                      type="button"
                      id={`edit-task-btn-${task.id}`}
                      onClick={() => setIsEditing(true)}
                      className="p-1 text-slate-400 hover:text-indigo-600 rounded-md hover:bg-slate-50 transition-colors cursor-pointer"
                      title="Edit task"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      id={`delete-task-btn-${task.id}`}
                      onClick={() => onDelete(task.id)}
                      className="p-1 text-slate-400 hover:text-rose-600 rounded-md hover:bg-slate-50 transition-colors cursor-pointer"
                      title="Delete task"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                    {task.description && (
                      <button
                        type="button"
                        id={`toggle-expand-btn-${task.id}`}
                        onClick={() => setIsExpanded(!isExpanded)}
                        className="p-1 text-slate-400 hover:text-slate-600 rounded-md hover:bg-slate-50 transition-colors cursor-pointer"
                      >
                        {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                      </button>
                    )}
                  </div>
                </div>

                {/* Sub-details (badges & meta) */}
                <div className="flex flex-wrap items-center gap-2 mt-2 text-xs font-semibold text-slate-400">
                  {/* Priority */}
                  <span className={`px-2 py-0.5 rounded-md border text-[10px] uppercase tracking-wider font-bold ${priorityColor[task.priority].badge}`}>
                    {t(`priority_${task.priority}`)}
                  </span>

                  {/* Category */}
                  <span className="flex items-center gap-1 bg-slate-50 text-slate-600 px-2 py-0.5 rounded-md border border-slate-100">
                    <Tag className="w-3 h-3 text-slate-400" />
                    {displayCategory}
                  </span>

                  {/* Effort */}
                  <span className="inline-flex items-center gap-1 bg-indigo-50/50 text-indigo-700 px-2 py-0.5 rounded-md border border-indigo-100/50 font-bold text-[10px]">
                    ⚡ {task.effort || 5}/10 {t('priority_low') === 'منخفضة' ? 'الجهد' : 'Effort'}
                  </span>

                  {/* Difficulty (Points) */}
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md border font-extrabold text-[10px] ${
                    task.difficulty === 5
                      ? 'bg-rose-50 border-rose-100 text-rose-700'
                      : task.difficulty === 4
                        ? 'bg-orange-50 border-orange-100 text-orange-700'
                        : task.difficulty === 3
                          ? 'bg-amber-50 border-amber-100 text-amber-700'
                          : task.difficulty === 2
                            ? 'bg-teal-50 border-teal-100 text-teal-700'
                            : 'bg-emerald-50 border-emerald-100 text-emerald-700'
                  }`}>
                    🎯 Diff: {task.difficulty || 1} ({(task.difficulty || 1) * 10} Pts)
                  </span>

                  {/* Due Date */}
                  {task.dueDate && (
                    <span className="flex items-center gap-1 text-slate-500">
                      <Calendar className="w-3 h-3" />
                      {task.dueDate}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Description expandable container */}
            <AnimatePresence>
              {isExpanded && task.description && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                  className="mt-3 pl-8 pr-8 text-xs text-slate-500 leading-relaxed border-l-2 border-slate-100 rtl:border-l-0 rtl:border-r-2"
                >
                  {task.description}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>
    </motion.div>
  );
}
