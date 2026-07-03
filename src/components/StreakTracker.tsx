import { Flame, Trophy, Award, CheckCircle2, AlertCircle, Info, Calendar } from 'lucide-react';
import { motion } from 'motion/react';
import { StreakInfo } from '../services/userProfile';

interface StreakTrackerProps {
  streakInfo: StreakInfo;
  locale: string;
}

export default function StreakTracker({ streakInfo, locale }: StreakTrackerProps) {
  const { currentStreak, completedDays, missedDays, isTodayCompleted, hasGoldenBadge } = streakInfo;

  // Localized texts
  const t = {
    en: {
      title: '30-Day Productivity Streak',
      subtitle: 'Complete all your scheduled tasks daily to build your momentum.',
      currentStreak: 'Current Streak',
      consecutiveDays: 'consecutive days',
      goldenBadgeProgress: 'Golden Badge Progress',
      daysToGo: (days: number) => `${days} more days to unlock Golden Badge!`,
      badgeUnlocked: '🏆 Golden Badge Unlocked!',
      badgeUnlockedDesc: 'You reached the legendary 30-Day productivity peak!',
      days: 'Days',
      statusToday: 'Today\'s Status',
      completed: 'Completed',
      noTasksScheduled: 'No tasks scheduled yet',
      pending: 'Pending tasks to complete today',
      howItWorks: 'How it works: Each day with tasks scheduled must be 100% completed to increase your streak. Days with no tasks won\'t break your streak. Miss a day, and it resets to 0!',
    },
    ar: {
      title: 'تحدي استمرار الإنتاجية لـ 30 يوماً',
      subtitle: 'أكمل جميع مهامك المجدولة يومياً لبناء حماسك المتواصل.',
      currentStreak: 'الاستمرار الحالي',
      consecutiveDays: 'أيام متتالية',
      goldenBadgeProgress: 'التقدم نحو الشارة الذهبية',
      daysToGo: (days: number) => `تبقّى ${days} أيام إضافية للحصول على الشارة الذهبية!`,
      badgeUnlocked: '🏆 تم فتح الشارة الذهبية!',
      badgeUnlockedDesc: 'لقد وصلت إلى ذروة الإنتاجية الأسطورية لمدة 30 يوماً!',
      days: 'أيام',
      statusToday: 'حالة اليوم',
      completed: 'مكتمل',
      noTasksScheduled: 'لا توجد مهام مجدولة اليوم',
      pending: 'مهام معلقة بانتظار الإكمال اليوم',
      howItWorks: 'كيف يعمل التحدي: كل يوم به مهام مجدولة يجب إكمالها بنسبة 100% لزيادة عدد أيام الاستمرار. الأيام الخالية من المهام لن تقطع تقدمك. تفويت يوم يعيد العداد إلى 0!',
    },
    fr: {
      title: 'Série de Productivité de 30 Jours',
      subtitle: 'Complétez toutes vos tâches planifiées quotidiennement pour créer un élan.',
      currentStreak: 'Série Actuelle',
      consecutiveDays: 'jours consécutifs',
      goldenBadgeProgress: 'Progrès du Badge d\'Or',
      daysToGo: (days: number) => `Encore ${days} jours pour débloquer le Badge d'Or !`,
      badgeUnlocked: '🏆 Badge d\'Or Débloqué !',
      badgeUnlockedDesc: 'Vous avez atteint le sommet légendaire de 30 jours de productivité !',
      days: 'Jours',
      statusToday: 'Statut d\'aujourd\'hui',
      completed: 'Complété',
      noTasksScheduled: 'Aucune tâche planifiée',
      pending: 'Tâches en attente d\'être complétées aujourd\'hui',
      howItWorks: 'Comment ça marche : Chaque jour avec des tâches planifiées doit être complété à 100% pour augmenter votre série. Les jours sans tâches ne brisent pas votre série. Manquez un jour, et elle revient à 0 !',
    }
  }[locale as 'en' | 'ar' | 'fr'] || {
    title: '30-Day Productivity Streak',
    subtitle: 'Complete all your scheduled tasks daily to build your momentum.',
    currentStreak: 'Current Streak',
    consecutiveDays: 'consecutive days',
    goldenBadgeProgress: 'Golden Badge Progress',
    daysToGo: (days: number) => `${days} more days to unlock Golden Badge!`,
    badgeUnlocked: '🏆 Golden Badge Unlocked!',
    badgeUnlockedDesc: 'You reached the legendary 30-Day productivity peak!',
    days: 'Days',
    statusToday: 'Today\'s Status',
    completed: 'Completed',
    noTasksScheduled: 'No tasks scheduled yet',
    pending: 'Pending tasks to complete today',
    howItWorks: 'How it works: Each day with tasks scheduled must be 100% completed to increase your streak. Days with no tasks won\'t break your streak. Miss a day, and it resets to 0!',
  };

  const isRtl = locale === 'ar';
  const progressPercent = Math.min(100, (currentStreak / 30) * 100);
  const remainingDays = Math.max(0, 30 - currentStreak);

  // SVG parameters for the circular progress indicator
  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progressPercent / 100) * circumference;

  return (
    <div id="streak-tracker-widget" className={`bg-white border border-slate-100 rounded-2xl p-6 shadow-xs hover:shadow-md transition-all duration-300 mb-6 relative overflow-hidden ${
      hasGoldenBadge ? 'ring-2 ring-amber-400 bg-linear-to-br from-white to-amber-50/10' : ''
    }`}>
      {/* Background radial soft light for unlocked badge */}
      {hasGoldenBadge && (
        <div className="absolute top-0 right-0 w-32 h-32 bg-amber-200/20 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none" />
      )}

      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-50 pb-4 mb-5 gap-4">
        <div>
          <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
            <span className={`p-1 bg-amber-50 text-amber-600 rounded-lg ${hasGoldenBadge ? 'animate-bounce' : ''}`}>
              <Flame className="w-4 h-4 fill-amber-500 text-amber-500" />
            </span>
            {t.title}
          </h2>
          <p className="text-xs text-slate-400 font-semibold mt-0.5">
            {t.subtitle}
          </p>
        </div>

        {/* Status indicator pill */}
        <div className="flex items-center gap-2 self-start md:self-center">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{t.statusToday}:</span>
          <span className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full border flex items-center gap-1 ${
            isTodayCompleted
              ? 'bg-emerald-50 border-emerald-100 text-emerald-700'
              : 'bg-slate-50 border-slate-100 text-slate-500'
          }`}>
            <span className={`w-1.5 h-1.5 rounded-full ${isTodayCompleted ? 'bg-emerald-500' : 'bg-slate-300'}`} />
            {isTodayCompleted ? t.completed : t.pending}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
        {/* Left Side: Circular HUD and Golden Badge state */}
        <div className="lg:col-span-5 flex flex-col sm:flex-row items-center gap-5 justify-center lg:justify-start border-r border-slate-50/80 pr-4">
          
          {/* SVG Circular Progress */}
          <div className="relative w-28 h-28 flex-shrink-0">
            <svg className="w-full h-full transform -rotate-90">
              {/* Back track */}
              <circle
                cx="56"
                cy="56"
                r={radius}
                className="stroke-slate-100 fill-none"
                strokeWidth="8"
              />
              {/* Glowing gradient if active */}
              <circle
                cx="56"
                cy="56"
                r={radius}
                className="stroke-amber-500 fill-none transition-all duration-1000 ease-out"
                strokeWidth="8"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <span className="text-2xl font-black text-slate-800 tracking-tight leading-none">
                {currentStreak}
              </span>
              <span className="text-[9px] text-slate-400 font-extrabold uppercase mt-1">
                {t.days}
              </span>
            </div>
          </div>

          <div className="text-center sm:text-left space-y-2">
            <div>
              <p className="text-xs text-slate-400 font-extrabold uppercase tracking-wide">{t.currentStreak}</p>
              <h3 className="text-lg font-black text-slate-800 leading-tight">
                {currentStreak} {t.consecutiveDays}
              </h3>
            </div>

            {hasGoldenBadge ? (
              <motion.div 
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="inline-flex items-center gap-1.5 bg-amber-50 border border-amber-200/50 text-amber-700 text-xs font-black px-3 py-1.5 rounded-xl shadow-xs"
              >
                <Award className="w-4 h-4 fill-amber-500 text-amber-600 animate-pulse" />
                <span>{t.badgeUnlocked}</span>
              </motion.div>
            ) : (
              <p className="text-xs text-slate-500 font-semibold">
                🎯 {t.daysToGo(remainingDays)}
              </p>
            )}
          </div>
        </div>

        {/* Right Side: 30-day streak milestones grid map */}
        <div className="lg:col-span-7 space-y-3">
          <p className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5 text-indigo-500" />
            {t.goldenBadgeProgress}
          </p>

          <div className="grid grid-cols-6 sm:grid-cols-10 gap-2">
            {Array.from({ length: 30 }).map((_, i) => {
              const dayNum = i + 1;
              const isPassed = dayNum <= currentStreak;
              const isMilestone = dayNum % 5 === 0;

              return (
                <div
                  key={dayNum}
                  title={`Day ${dayNum} ${isPassed ? '(Achieved)' : ''}`}
                  className={`aspect-square rounded-lg flex flex-col items-center justify-center text-[10px] font-black border transition-all relative ${
                    isPassed
                      ? 'bg-linear-to-br from-amber-400 to-amber-500 border-amber-500 text-slate-950 shadow-xs'
                      : isMilestone
                        ? 'bg-slate-50 border-indigo-200/60 text-indigo-700'
                        : 'bg-slate-50/50 border-slate-100 text-slate-300'
                  }`}
                >
                  {isMilestone && !isPassed && (
                    <span className="absolute -top-1 -right-1 text-[8px] bg-indigo-50 text-indigo-600 px-0.75 rounded-md scale-90 border border-indigo-100">★</span>
                  )}
                  {dayNum === 30 && isPassed ? (
                    <Award className="w-4 h-4 text-slate-950 animate-bounce" />
                  ) : dayNum === 30 ? (
                    <Trophy className="w-3.5 h-3.5 text-slate-300" />
                  ) : (
                    <span>{dayNum}</span>
                  )}
                </div>
              );
            })}
          </div>

          {/* Tips or explainers */}
          <div className="bg-slate-50/60 border border-slate-100 p-3 rounded-xl flex items-start gap-2 text-[10px] text-slate-500 font-semibold leading-relaxed">
            <Info className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
            <p>{t.howItWorks}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
