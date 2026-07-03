import { useState } from 'react';
import { 
  Sparkles, 
  Brain, 
  Clock, 
  CheckCircle2, 
  Coffee, 
  AlertCircle, 
  RefreshCw,
  Lightbulb,
  Check,
  CalendarDays,
  Flame,
  Zap,
  ChevronRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useTranslation } from 'react-i18next';
import { Task } from '../types';

interface ScheduleItem {
  timeSlot: string;
  taskId: string | null;
  title: string;
  reason: string;
  priority: 'high' | 'medium' | 'low' | 'break';
}

interface GeminiScheduleResponse {
  analysis: string;
  schedule: ScheduleItem[];
  tips: string[];
}

interface GeminiSchedulerProps {
  tasks: Task[];
  energyLevel: number;
  onToggleTask: (id: string, completed: boolean) => Promise<void>;
}

export default function GeminiScheduler({ tasks, energyLevel, onToggleTask }: GeminiSchedulerProps) {
  const { t, i18n } = useTranslation();
  const currentLang = i18n.language || 'en';
  const isRtl = currentLang === 'ar';

  const [scheduleData, setScheduleData] = useState<GeminiScheduleResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function generateSchedule() {
    setLoading(true);
    setError(null);

    // Only send non-completed tasks to make sure schedule is focused on upcoming work
    const activeTasks = tasks.filter(task => !task.completed);

    try {
      const response = await fetch('/api/schedule', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tasks: activeTasks.length > 0 ? activeTasks : tasks, // Fallback to all tasks if no active ones
          energyLevel,
          locale: currentLang
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate schedule from Gemini API.');
      }

      const data: GeminiScheduleResponse = await response.json();
      setScheduleData(data);
    } catch (err: any) {
      console.error('Error generating AI schedule:', err);
      setError(err.message || 'Could not connect to Gemini API. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  // Helper to find the original task from the taskId
  const getTaskById = (id: string | null) => {
    if (!id) return null;
    return tasks.find(t => t.id === id);
  };

  return (
    <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-xs mb-6 hover:shadow-md transition-all duration-300 relative overflow-hidden">
      {/* Subtle futuristic cognitive network background decoration */}
      <div className="absolute top-0 right-0 w-40 h-40 bg-indigo-50/40 rounded-full blur-3xl -mr-12 -mt-12 pointer-events-none" />

      {/* Header section */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 border-b border-slate-50 pb-5 mb-5">
        <div className="space-y-1">
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <span className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg shadow-xs">
              <Brain className="w-4 h-4" />
            </span>
            {t('gemini_schedule_title')}
            <span className="text-[9px] uppercase tracking-wider font-extrabold px-1.5 py-0.5 rounded-md bg-linear-to-r from-indigo-500 to-purple-500 text-white animate-pulse">
              Gemini AI
            </span>
          </h2>
          <p className="text-xs text-slate-400 font-semibold max-w-xl">
            {t('gemini_schedule_desc')}
          </p>
        </div>

        <button
          type="button"
          id="generate-schedule-btn"
          onClick={generateSchedule}
          disabled={loading}
          className="self-start sm:self-center px-4 py-2.5 bg-linear-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl text-xs font-bold shadow-sm shadow-indigo-100 hover:shadow-indigo-200 hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center gap-2 cursor-pointer disabled:opacity-75 disabled:cursor-not-allowed"
        >
          {loading ? (
            <RefreshCw className="w-4 h-4 animate-spin" />
          ) : (
            <Sparkles className="w-4 h-4 text-amber-300 fill-current" />
          )}
          <span>{scheduleData ? t('regenerate_schedule') : t('generate_schedule_btn')}</span>
        </button>
      </div>

      {/* Error banner */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-rose-50 border border-rose-100 text-rose-700 p-4 rounded-xl mb-5 text-xs font-semibold flex items-start gap-2.5 shadow-xs"
          >
            <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p>{error}</p>
            </div>
            <button 
              type="button"
              id="clear-scheduler-error"
              onClick={() => setError(null)} 
              className="text-rose-400 hover:text-rose-600 font-bold ml-auto cursor-pointer"
            >
              ×
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Content states */}
      <AnimatePresence mode="wait">
        {loading ? (
          /* High quality skeleton loader for loading state */
          <motion.div
            key="loading-skeleton"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-6 py-6"
          >
            <div className="flex items-center gap-3 p-4 bg-slate-50/80 rounded-xl border border-slate-100/50">
              <RefreshCw className="w-5 h-5 text-indigo-500 animate-spin shrink-0" />
              <div className="space-y-1 flex-1">
                <div className="h-4 bg-slate-200/80 rounded-sm w-3/4 animate-pulse" />
                <div className="h-3 bg-slate-200/50 rounded-sm w-1/2 animate-pulse" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-2 space-y-4">
                <div className="h-5 bg-slate-200 rounded-sm w-1/4 animate-pulse" />
                {[1, 2, 3].map((n) => (
                  <div key={n} className="flex gap-4 items-start">
                    <div className="w-16 h-8 bg-slate-200 rounded-lg animate-pulse" />
                    <div className="flex-1 p-4 bg-slate-50 border border-slate-100 rounded-xl space-y-2">
                      <div className="h-4 bg-slate-200 rounded-sm w-1/3 animate-pulse" />
                      <div className="h-3 bg-slate-200/80 rounded-sm w-2/3 animate-pulse" />
                    </div>
                  </div>
                ))}
              </div>
              <div className="space-y-4 bg-slate-50/50 p-4 rounded-xl border border-slate-100">
                <div className="h-4 bg-slate-200 rounded-sm w-1/2 animate-pulse" />
                <div className="h-3 bg-slate-200 rounded-sm w-full animate-pulse" />
                <div className="h-3 bg-slate-200 rounded-sm w-5/6 animate-pulse" />
              </div>
            </div>
          </motion.div>
        ) : scheduleData ? (
          /* Actual Interactive Schedule Data */
          <motion.div
            key="schedule-content"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* AI Cognitive Analysis */}
            <div className="bg-linear-to-br from-indigo-50/40 via-purple-50/20 to-slate-50/50 border border-indigo-100/30 p-5 rounded-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-100/20 rounded-full blur-xl pointer-events-none" />
              <h3 className="text-sm font-extrabold text-indigo-950 flex items-center gap-1.5 mb-2.5">
                <Sparkles className="w-4 h-4 text-indigo-600 fill-current animate-pulse" />
                {t('gemini_analysis_title')}
              </h3>
              <p className="text-xs font-semibold text-slate-600 leading-relaxed">
                {scheduleData.analysis}
              </p>
            </div>

            {/* Layout Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
              {/* Timeline list */}
              <div className="md:col-span-2 space-y-4">
                <h4 className="text-xs font-extrabold text-slate-400 uppercase tracking-widest flex items-center gap-2 mb-2">
                  <CalendarDays className="w-4 h-4 text-slate-400" />
                  Suggested Daily Timeline
                </h4>

                <div className="relative border-l-2 border-slate-100 pl-4 sm:pl-6 space-y-5 ml-2.5">
                  {scheduleData.schedule.map((item, idx) => {
                    const matchedTask = getTaskById(item.taskId);
                    const isBreak = item.priority === 'break';
                    const isHigh = item.priority === 'high';

                    return (
                      <motion.div
                        key={idx}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        className="relative"
                      >
                        {/* Chronological timeline bullet */}
                        <div className={`absolute -left-[25px] sm:-left-[33px] top-1.5 w-4 h-4 rounded-full border-2 bg-white flex items-center justify-center transition-all ${
                          isBreak 
                            ? 'border-teal-400 text-teal-400' 
                            : isHigh 
                              ? 'border-indigo-600 text-indigo-600' 
                              : 'border-slate-300 text-slate-300'
                        }`}>
                          <div className={`w-1.5 h-1.5 rounded-full ${
                            isBreak 
                              ? 'bg-teal-400 animate-pulse' 
                              : isHigh 
                                ? 'bg-indigo-600' 
                                : 'bg-slate-300'
                          }`} />
                        </div>

                        {/* Schedule block card */}
                        <div className={`p-4 rounded-xl border transition-all ${
                          isBreak
                            ? 'bg-teal-50/20 border-teal-100/50 hover:bg-teal-50/40'
                            : matchedTask?.completed
                              ? 'bg-slate-50/30 border-slate-100 opacity-75'
                              : 'bg-white border-slate-100 hover:border-indigo-100/60 hover:shadow-xs'
                        }`}>
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            {/* Time Slot and Title */}
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <span className={`inline-flex items-center gap-1 text-[10px] font-extrabold px-2 py-0.5 rounded-md ${
                                  isBreak
                                    ? 'bg-teal-50 text-teal-700 border border-teal-100/50'
                                    : 'bg-slate-100 text-slate-700'
                                }`}>
                                  <Clock className="w-3 h-3" />
                                  {item.timeSlot}
                                </span>

                                <span className={`text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded-sm ${
                                  item.priority === 'high'
                                    ? 'bg-rose-50 text-rose-700 border border-rose-100'
                                    : item.priority === 'medium'
                                      ? 'bg-amber-50 text-amber-700 border border-amber-100'
                                      : item.priority === 'low'
                                        ? 'bg-slate-100 text-slate-600'
                                        : 'bg-teal-50 text-teal-700 border border-teal-100/50'
                                }`}>
                                  {item.priority}
                                </span>
                              </div>

                              <h5 className={`text-sm font-bold tracking-tight leading-snug ${
                                matchedTask?.completed ? 'line-through text-slate-400' : 'text-slate-800'
                              }`}>
                                {item.title}
                              </h5>
                            </div>

                            {/* Task Mapping Checkbox Action */}
                            {matchedTask && (
                              <button
                                type="button"
                                id={`timeline-toggle-${matchedTask.id}`}
                                onClick={() => onToggleTask(matchedTask.id, !matchedTask.completed)}
                                className={`self-start sm:self-center p-1.5 rounded-xl border transition-all flex items-center gap-1 cursor-pointer ${
                                  matchedTask.completed
                                    ? 'bg-emerald-50 border-emerald-100 text-emerald-600 hover:bg-emerald-100'
                                    : 'border-slate-200 hover:border-indigo-200 hover:bg-indigo-50/20 text-slate-400 hover:text-indigo-600'
                                }`}
                                title={matchedTask.completed ? "Mark incomplete" : "Mark completed"}
                              >
                                {matchedTask.completed ? (
                                  <CheckCircle2 className="w-4 h-4 fill-current" />
                                ) : (
                                  <Check className="w-4 h-4" />
                                )}
                                <span className="text-[10px] font-bold sm:inline hidden">
                                  {matchedTask.completed ? "Done" : "Mark Done"}
                                </span>
                              </button>
                            )}
                          </div>

                          {/* Coach comment reasoning */}
                          <p className="text-xs text-slate-500 font-medium mt-2 leading-relaxed bg-slate-50/50 px-3 py-1.5 rounded-lg border border-slate-100/30">
                            {item.reason}
                          </p>

                          {/* Associated original task info card */}
                          {matchedTask && (
                            <div className="mt-2.5 flex items-center justify-between text-[10px] text-slate-400 font-semibold border-t border-slate-50 pt-2">
                              <span className="flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                                {t('schedule_mapped_task')}: <span className="font-bold text-slate-600">{matchedTask.category}</span>
                              </span>
                              <span className="flex items-center gap-1 bg-slate-100 px-1.5 py-0.5 rounded-md text-[9px] font-bold text-slate-500">
                                <Zap className="w-2.5 h-2.5 text-amber-500 fill-current" /> Effort: {matchedTask.effort || 5}
                              </span>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>

              {/* Actionable Tips Column */}
              <div className="space-y-4">
                <h4 className="text-xs font-extrabold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <Lightbulb className="w-4 h-4 text-amber-500" />
                  {t('gemini_tips_title')}
                </h4>

                <div className="space-y-3">
                  {scheduleData.tips.map((tip, idx) => (
                    <motion.div
                      key={idx}
                      whileHover={{ scale: 1.01 }}
                      className="p-4 bg-slate-50 border border-slate-100 rounded-xl flex gap-2.5 items-start relative overflow-hidden"
                    >
                      <div className="absolute top-0 right-0 w-12 h-12 bg-linear-to-bl from-amber-200/10 to-transparent pointer-events-none" />
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-amber-50 border border-amber-100 text-amber-600 text-xs font-bold">
                        {idx + 1}
                      </span>
                      <p className="text-xs text-slate-600 font-semibold leading-relaxed">
                        {tip}
                      </p>
                    </motion.div>
                  ))}
                </div>

                {/* Cognitive State Info Card */}
                <div className="bg-linear-to-br from-indigo-900 to-slate-900 text-white p-5 rounded-xl border border-slate-800 space-y-3 shadow-md relative overflow-hidden">
                  <div className="absolute -bottom-6 -left-6 w-20 h-20 bg-indigo-500/20 rounded-full blur-xl pointer-events-none" />
                  <div className="flex items-center gap-1.5">
                    <Flame className="w-4 h-4 text-amber-400 fill-current" />
                    <span className="text-[10px] uppercase tracking-wider font-extrabold text-slate-300">Cognitive Load</span>
                  </div>
                  <div>
                    <h5 className="text-xs font-extrabold text-white">Daily Target Balance</h5>
                    <p className="text-[11px] text-slate-300 font-semibold mt-1 leading-snug">
                      Your energy level is set to <strong className="text-amber-400">{energyLevel}/10</strong>. High-effort tasks (effort &gt;= 7) are balanced to align precisely with peak cognitive slots.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        ) : (
          /* Empty / Initial State */
          <motion.div
            key="empty-state"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="py-12 text-center border-2 border-dashed border-slate-100 rounded-2xl flex flex-col items-center justify-center"
          >
            <div className="p-3.5 bg-indigo-50 text-indigo-600 rounded-full inline-block mb-3.5 shadow-xs">
              <Brain className="w-6 h-6 animate-pulse" />
            </div>
            <h3 className="text-sm font-bold text-slate-700">{t('gemini_schedule_title')}</h3>
            <p className="text-xs text-slate-400 mt-1.5 max-w-sm mx-auto leading-relaxed">
              {t('no_schedule_yet')}
            </p>
            <button
              type="button"
              id="generate-schedule-empty-btn"
              onClick={generateSchedule}
              className="mt-4 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-xs hover:shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-300 fill-current" />
              <span>{t('generate_schedule_btn')}</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
