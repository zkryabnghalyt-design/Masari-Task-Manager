import { Task } from '../types';
import { CheckCircle, Circle, Award } from 'lucide-react';
import { motion } from 'motion/react';
import { useTranslation } from 'react-i18next';

interface TaskStatsProps {
  tasks: Task[];
}

export default function TaskStats({ tasks }: TaskStatsProps) {
  const { t } = useTranslation();
  const total = tasks.length;
  const completed = tasks.filter(t => t.completed).length;
  const active = total - completed;
  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

  // Stagger animation container
  const containerVariants = {
    hidden: { opacity: 0, y: 10 },
    show: {
      opacity: 1,
      y: 0,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    show: { opacity: 1, y: 0 },
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6"
    >
      {/* Percentage card */}
      <motion.div
        variants={itemVariants}
        className="bg-white border border-slate-100 rounded-2xl p-5 shadow-xs flex items-center gap-4 hover:shadow-md transition-shadow duration-300"
      >
        <div className="p-3 bg-emerald-50 rounded-xl text-emerald-600">
          <Award className="w-6 h-6" />
        </div>
        <div className="flex-1">
          <div className="text-xs font-semibold text-slate-400 tracking-wider uppercase">{t('completion_rate')}</div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-slate-800 tracking-tight">{percentage}%</span>
            <span className="text-xs text-slate-500">{t('daily_goals')}</span>
          </div>
          {/* Progress bar */}
          <div className="w-full bg-slate-100 h-2 rounded-full mt-3 overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${percentage}%` }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
              className="bg-emerald-500 h-full rounded-full"
            />
          </div>
        </div>
      </motion.div>

      {/* Active tasks card */}
      <motion.div
        variants={itemVariants}
        className="bg-white border border-slate-100 rounded-2xl p-5 shadow-xs flex items-center gap-4 hover:shadow-md transition-shadow duration-300"
      >
        <div className="p-3 bg-indigo-50 rounded-xl text-indigo-600">
          <Circle className="w-6 h-6" />
        </div>
        <div>
          <div className="text-xs font-semibold text-slate-400 tracking-wider uppercase">{t('pending_tasks')}</div>
          <div className="text-3xl font-bold text-slate-800 tracking-tight">{active}</div>
          <div className="text-xs text-slate-500 mt-1">{t('todo_today')}</div>
        </div>
      </motion.div>

      {/* Completed tasks card */}
      <motion.div
        variants={itemVariants}
        className="bg-white border border-slate-100 rounded-2xl p-5 shadow-xs flex items-center gap-4 hover:shadow-md transition-shadow duration-300"
      >
        <div className="p-3 bg-sky-50 rounded-xl text-sky-600">
          <CheckCircle className="w-6 h-6" />
        </div>
        <div>
          <div className="text-xs font-semibold text-slate-400 tracking-wider uppercase">{t('finished_tasks')}</div>
          <div className="text-3xl font-bold text-slate-800 tracking-tight">{completed}</div>
          <div className="text-xs text-slate-500 mt-1">{t('completed_successfully')}</div>
        </div>
      </motion.div>
    </motion.div>
  );
}
