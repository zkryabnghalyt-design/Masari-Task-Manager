import { motion, AnimatePresence } from 'motion/react';
import { Star, Trophy, Sparkles } from 'lucide-react';

interface SuccessDialogProps {
  isOpen: boolean;
  onClose: () => void;
  points: number;
  locale: string;
}

export default function SuccessDialog({ isOpen, onClose, points, locale }: SuccessDialogProps) {
  const isRtl = locale === 'ar';

  // Localized texts matching user's requested Android AlertDialog exactly
  const getTitle = () => {
    switch (locale) {
      case 'ar':
        return 'مبروك!';
      case 'fr':
        return 'Félicitations !';
      default:
        return 'Congratulations!';
    }
  };

  const getMessage = () => {
    switch (locale) {
      case 'ar':
        return `أحسنت! لقد ربحت ${points} نقاط لإكمالك هذه المهمة.`;
      case 'fr':
        return `Bien joué ! Vous avez gagné ${points} points en complétant cette tâche.`;
      default:
        return `Well done! You have earned ${points} points for completing this task.`;
    }
  };

  const getButtonText = () => {
    switch (locale) {
      case 'ar':
        return 'موافق';
      case 'fr':
        return "D'accord";
      default:
        return 'OK';
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop Blur */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-md cursor-pointer"
          />

          {/* Dialog Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 350 }}
            id="success-alert-dialog"
            dir={isRtl ? 'rtl' : 'ltr'}
            className="relative bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-6 shadow-2xl max-w-sm w-full text-center overflow-hidden z-10"
          >
            {/* Ambient Background Glows */}
            <div className="absolute -top-10 -left-10 w-32 h-32 bg-amber-400/10 rounded-full blur-2xl pointer-events-none" />
            <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />

            {/* Glowing Star Icon container (representing R.drawable.ic_star) */}
            <div className="relative mx-auto w-20 h-20 bg-linear-to-b from-amber-100 to-amber-50 dark:from-amber-950/40 dark:to-amber-900/10 rounded-full flex items-center justify-center mb-5 shadow-inner">
              <motion.div
                initial={{ rotate: -15, scale: 0.5 }}
                animate={{ rotate: 0, scale: 1 }}
                transition={{
                  type: 'spring',
                  stiffness: 260,
                  damping: 15,
                  delay: 0.1,
                }}
                className="relative"
              >
                <Star className="w-10 h-10 text-amber-500 fill-amber-400 animate-pulse" />
                <Sparkles className="w-5 h-5 text-amber-300 absolute -top-2 -right-2 animate-bounce" />
              </motion.div>
            </div>

            {/* Animated Title */}
            <motion.h3
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="text-2xl font-black text-slate-900 dark:text-white tracking-tight mb-2 flex items-center justify-center gap-1.5"
            >
              <Trophy className="w-5 h-5 text-amber-500" />
              {getTitle()}
            </motion.h3>

            {/* Animated Message */}
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-sm font-semibold text-slate-500 dark:text-slate-400 leading-relaxed mb-6"
            >
              {getMessage()}
            </motion.p>

            {/* OK Button */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
            >
              <button
                type="button"
                onClick={onClose}
                id="success-dialog-dismiss-btn"
                className="w-full py-3 bg-linear-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-extrabold text-sm rounded-2xl shadow-lg shadow-amber-500/10 hover:shadow-amber-500/20 active:scale-98 hover:scale-[1.02] transition-all cursor-pointer"
              >
                {getButtonText()}
              </button>
            </motion.div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
