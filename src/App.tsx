import { useState, useEffect, useMemo } from 'react';
import { Task, NewTask } from './types';
import { subscribeTasks, addTask, updateTask, deleteTask } from './services/tasks';
import { 
  getOrCreateDeviceId, 
  subscribeUserProfile, 
  updateUserProfile, 
  adjustPoints, 
  UserProfile,
  calculateStreak 
} from './services/userProfile';
import TaskStats from './components/TaskStats';
import AddTaskForm from './components/AddTaskForm';
import TaskItem from './components/TaskItem';
import ProductivityTips from './components/ProductivityTips';
import GeminiScheduler from './components/GeminiScheduler';
import NotificationManager from './components/NotificationManager';
import PointsShop from './components/PointsShop';
import Soundscapes from './components/Soundscapes';
import GeminiCheerleader from './components/GeminiCheerleader';
import StreakTracker from './components/StreakTracker';
import SuccessDialog from './components/SuccessDialog';
import SettingsModal from './components/SettingsModal';
import { COMFORT_THEMES } from './data/comfortThemes';
import { 
  Search, 
  Sparkles, 
  ListTodo, 
  RefreshCw, 
  SlidersHorizontal,
  FolderKanban,
  AlertCircle,
  Globe,
  Heart,
  Trophy,
  ArrowRight,
  Sun,
  Moon,
  Settings,
  Route,
  Compass
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useTranslation } from 'react-i18next';

const THEME_STYLES: Record<string, {
  body: string;
  card: string;
  text: string;
  accent: string;
  button: string;
  title: string;
  label: string;
  border: string;
}> = {
  classic: {
    body: 'bg-[#F8FAFC]',
    card: 'bg-white border-slate-100/80',
    text: 'text-slate-800',
    accent: 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-100',
    button: 'bg-indigo-50 text-indigo-700 border-indigo-100/50 hover:bg-indigo-100',
    title: 'text-slate-900',
    label: 'text-slate-500',
    border: 'border-slate-100'
  },
  cyberpunk: {
    body: 'bg-[#090B10]',
    card: 'bg-[#101423] border-[#FF007F]/30 shadow-[0_0_15px_rgba(255,0,127,0.05)]',
    text: 'text-[#E2E8F0]',
    accent: 'bg-[#FF007F] hover:bg-[#ff1a8c] text-white shadow-[0_0_10px_rgba(255,0,127,0.3)]',
    button: 'bg-[#00F2FE]/10 text-[#00F2FE] border-[#00F2FE]/30 hover:bg-[#00F2FE]/20',
    title: 'text-[#00F2FE] drop-shadow-[0_0_8px_rgba(0,242,254,0.4)] font-semibold',
    label: 'text-[#FF007F]/90',
    border: 'border-[#FF007F]/30'
  },
  emerald: {
    body: 'bg-[#EFF5F1]',
    card: 'bg-white border-emerald-100 shadow-sm',
    text: 'text-[#1B3B2B]',
    accent: 'bg-[#1E5631] hover:bg-[#143B21] text-white shadow-emerald-100',
    button: 'bg-[#E2ECE6] text-[#1E5631] border-emerald-100 hover:bg-[#D5E4DB]',
    title: 'text-[#132A1F]',
    label: 'text-[#2D5A42]',
    border: 'border-emerald-100'
  },
  cosmic: {
    body: 'bg-[#030712]',
    card: 'bg-[#0F172A] border-violet-950/40 shadow-sm',
    text: 'text-slate-200',
    accent: 'bg-violet-600 hover:bg-violet-700 text-white shadow-violet-950/40',
    button: 'bg-violet-950/40 text-violet-300 border-violet-900/40 hover:bg-violet-900/40',
    title: 'text-white font-semibold',
    label: 'text-violet-400',
    border: 'border-violet-950/40'
  },
  sunset: {
    body: 'bg-[#FFF9F6]',
    card: 'bg-white border-orange-100/80 shadow-xs',
    text: 'text-slate-800',
    accent: 'bg-orange-500 hover:bg-orange-600 text-white shadow-orange-100',
    button: 'bg-orange-50 text-orange-700 border-orange-100/50 hover:bg-orange-100',
    title: 'text-orange-950',
    label: 'text-orange-600',
    border: 'border-orange-100'
  }
};

export default function App() {
  const { t, i18n } = useTranslation();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter & Search states
  const [activeTab, setActiveTab] = useState<'all' | 'active' | 'completed'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPriority, setSelectedPriority] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [showOnlyFavorites, setShowOnlyFavorites] = useState(false);

  // Energy & Effort matching state
  const [energy, setEnergy] = useState<number>(5);

  // Success AlertDialog state for completed tasks
  const [completionReward, setCompletionReward] = useState<{ show: boolean; points: number } | null>(null);

  // Gamification profile state
  const [profile, setProfile] = useState<UserProfile | null>(null);

  // App Theme Settings (Comfort Palettes)
  const [presetTheme, setPresetTheme] = useState<string>(() => {
    try {
      return localStorage.getItem('preset_theme') || 'blue';
    } catch {
      return 'blue';
    }
  });

  const [secondaryTheme, setSecondaryTheme] = useState<string>(() => {
    try {
      return localStorage.getItem('preset_theme_secondary') || 'purple';
    } catch {
      return 'purple';
    }
  });

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Dynamic comfort color preset helper mapping
  const c = useMemo(() => {
    const active = COMFORT_THEMES.find(t => t.id === presetTheme) || COMFORT_THEMES[0];
    const col = active.colorName;
    return {
      primary: `${col}-600`,
      bgLight: `bg-${col}-50`,
      textDark: `text-${col}-700`,
      border: `border-${col}-100`,
      bgLightHover: `bg-${col}-100`,
      shadow: `shadow-${col}-100`,
      headerGlow: `from-${col}-500/10`
    };
  }, [presetTheme]);

  // Dedicated Global Dark Mode state
  const [isDarkMode, setIsDarkMode] = useState(() => {
    try {
      const stored = localStorage.getItem('theme_mode');
      return stored === null ? true : stored === 'dark';
    } catch {
      return true;
    }
  });

  // Sync dark mode class to document element and save preference
  useEffect(() => {
    try {
      if (isDarkMode) {
        document.documentElement.classList.add('dark');
        localStorage.setItem('theme_mode', 'dark');
      } else {
        document.documentElement.classList.remove('dark');
        localStorage.setItem('theme_mode', 'light');
      }
    } catch (err) {
      console.warn('LocalStorage blocked', err);
    }
  }, [isDarkMode]);

  function handleToggleDarkMode() {
    setIsDarkMode(prev => !prev);
  }

  // Subscribe to gamification profile in Firestore
  useEffect(() => {
    const pId = getOrCreateDeviceId();
    const unsubscribeProfile = subscribeUserProfile(
      pId,
      (loadedProfile) => {
        setProfile(loadedProfile);
      },
      (err) => {
        console.error('Error listening to user profile:', err);
      }
    );
    return () => unsubscribeProfile();
  }, []);

  // Dynamically calculate streak info from real tasks
  const streakInfo = useMemo(() => {
    return calculateStreak(tasks);
  }, [tasks]);

  // Sync calculated streak to user profile document in Firestore
  useEffect(() => {
    if (profile) {
      const calculatedStreak = streakInfo.currentStreak;
      const calculatedBadge = streakInfo.hasGoldenBadge;
      if (profile.streak !== calculatedStreak || profile.hasGoldenBadge !== calculatedBadge) {
        updateUserProfile(profile.id, {
          streak: calculatedStreak,
          hasGoldenBadge: calculatedBadge
        }).catch(err => console.error('Error syncing streak to profile:', err));
      }
    }
  }, [profile, streakInfo]);

  const currentLanguage = i18n.language || 'en';
  const isRtl = currentLanguage === 'ar';

  // Subscribe to real-time changes in Firestore tasks
  useEffect(() => {
    setLoading(true);
    const unsubscribe = subscribeTasks(
      (loadedTasks) => {
        setTasks(loadedTasks);
        setLoading(false);
        setError(null);
      },
      () => {
        setError(t('error_suffix'));
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [t]);

  // Suggest a task based on the current energy level matching the task's effort requirement.
  const suggestedTask = useMemo(() => {
    const activeTasks = tasks.filter(t => !t.completed);
    if (activeTasks.length === 0) return null;

    // Find active tasks where effort is closest to current energy level (difference <= 2)
    const suitable = activeTasks.filter(t => Math.abs((t.effort || 5) - energy) <= 2);

    // If we have matches, sort by highest priority or take the first one
    if (suitable.length > 0) {
      return suitable[0];
    }

    // Fallback to first active task
    return activeTasks[0];
  }, [tasks, energy]);

  // Handlers for Firestore operations
  async function handleAddTask(newTask: NewTask) {
    try {
      await addTask(newTask);
    } catch (err) {
      console.error('Error adding task:', err);
      setError('Could not save task to database.');
    }
  }

  async function handleToggleTask(id: string, completed: boolean) {
    try {
      const task = tasks.find(t => t.id === id);
      if (task && profile) {
        const difficulty = task.difficulty || 1;
        const pts = difficulty * 10;
        if (completed) {
          await adjustPoints(profile.id, pts, pts);
          setCompletionReward({ show: true, points: pts });
        } else {
          await adjustPoints(profile.id, -pts, -pts);
        }
      }
      await updateTask(id, { completed });
    } catch (err) {
      console.error('Error toggling task:', err);
      setError('Failed to update task.');
    }
  }

  async function handleUpdateTask(id: string, updates: Partial<Task>) {
    try {
      await updateTask(id, updates);
    } catch (err) {
      console.error('Error updating task:', err);
      setError('Failed to update task.');
    }
  }

  async function handleDeleteTask(id: string) {
    try {
      await deleteTask(id);
    } catch (err) {
      console.error('Error deleting task:', err);
      setError('Failed to delete task.');
    }
  }

  // Gamification Shop handlers
  async function handlePurchaseItem(itemId: string, cost: number) {
    if (!profile) return;
    const currentPoints = profile.points;
    const currentUnlocked = [...profile.unlockedItems];
    
    if (currentPoints < cost) {
      throw new Error("Insufficient points");
    }
    
    const updatedUnlocked = [...currentUnlocked, itemId];
    await updateUserProfile(profile.id, {
      points: currentPoints - cost,
      unlockedItems: updatedUnlocked
    });
  }

  async function handleSelectTheme(themeId: string) {
    if (!profile) return;
    await updateUserProfile(profile.id, {
      activeTheme: themeId
    });
  }

  async function handleEarnPoints(amount: number) {
    if (!profile) return;
    await adjustPoints(profile.id, amount, amount);
  }

  // Get list of unique categories for the filters
  const categoriesList = useMemo(() => {
    const list = new Set<string>();
    tasks.forEach(t => {
      if (t.category) list.add(t.category);
    });
    return Array.from(list);
  }, [tasks]);

  // Filter tasks based on all active criteria
  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      // 1. Tab filter
      if (activeTab === 'active' && task.completed) return false;
      if (activeTab === 'completed' && !task.completed) return false;

      // 2. Search query filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesTitle = task.title.toLowerCase().includes(query);
        const matchesDesc = task.description?.toLowerCase().includes(query);
        if (!matchesTitle && !matchesDesc) return false;
      }

      // 3. Priority filter
      if (selectedPriority !== 'all' && task.priority !== selectedPriority) return false;

      // 4. Category filter
      if (selectedCategory !== 'all' && task.category !== selectedCategory) return false;

      // 5. Favorites filter
      if (showOnlyFavorites && !task.favorite) return false;

      return true;
    });
  }, [tasks, activeTab, searchQuery, selectedPriority, selectedCategory, showOnlyFavorites]);

  // Current date formatted beautifully based on chosen language
  const formattedDate = useMemo(() => {
    const options: Intl.DateTimeFormatOptions = { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    };
    const localeMap: Record<string, string> = {
      en: 'en-US',
      ar: 'ar-EG',
      fr: 'fr-FR'
    };
    return new Intl.DateTimeFormat(localeMap[currentLanguage] || 'en-US', options).format(new Date());
  }, [currentLanguage]);

  const activeThemeId = profile?.activeTheme || 'classic';
  const themeStyles = useMemo(() => {
    const isDark = isDarkMode;
    const active = COMFORT_THEMES.find(t => t.id === presetTheme) || COMFORT_THEMES[0];
    const col = active.colorName;

    if (activeThemeId === 'classic') {
      return {
        body: 'app-custom-bg',
        card: 'custom-card-style',
        text: isDark ? 'text-slate-100' : 'text-slate-800',
        accent: 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-md',
        button: isDark
          ? 'bg-slate-800 text-slate-200 border-slate-700 hover:bg-slate-700'
          : 'bg-indigo-50 text-indigo-700 border-indigo-100/50 hover:bg-indigo-100',
        title: isDark ? 'text-white' : 'text-slate-900',
        label: isDark ? 'text-indigo-400' : 'text-indigo-600',
        border: isDark ? 'border-slate-800' : 'border-indigo-100',
        accentGlow: 'from-indigo-50'
      };
    }
    
    const standard = THEME_STYLES[activeThemeId] || THEME_STYLES.classic;
    return {
      ...standard,
      accentGlow: activeThemeId === 'cyberpunk'
        ? 'from-[#FF007F]/10'
        : activeThemeId === 'cosmic'
          ? 'from-violet-950/25'
          : activeThemeId === 'emerald'
            ? 'from-emerald-500/10'
            : activeThemeId === 'sunset'
              ? 'from-orange-500/10'
              : 'from-indigo-50'
    };
  }, [activeThemeId, presetTheme, isDarkMode]);

  // CSS overrides for the dynamic primary and secondary custom gradient pairs
  const dynamicStyles = useMemo(() => {
    const p = COMFORT_THEMES.find(t => t.id === presetTheme) || COMFORT_THEMES[0];
    const s = COMFORT_THEMES.find(t => t.id === secondaryTheme) || COMFORT_THEMES[1] || COMFORT_THEMES[0];
    const isDark = isDarkMode;

    // Responsive surface colors that adjust opacity for readability of content
    const cardBg = isDark ? 'rgba(18, 18, 22, 0.85)' : 'rgba(255, 255, 255, 0.9)';
    const cardBorder = isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)';

    return `
      /* Dynamic Ambient Background Gradient Bleeds */
      .app-custom-bg {
        background: ${isDark 
          ? `radial-gradient(circle at 10% 10%, ${p.hex}22, transparent 55%), radial-gradient(circle at 90% 90%, ${s.hex}22, transparent 55%), #09090b` 
          : `radial-gradient(circle at 10% 10%, ${p.hex}0f, transparent 55%), radial-gradient(circle at 90% 90%, ${s.hex}0f, transparent 55%), #f8fafc`
        } !important;
        transition: background 0.6s ease;
      }

      /* Translucent glassmorphism cards that preserve high contrast */
      .custom-card-style {
        background: ${cardBg} !important;
        border: 1px solid ${cardBorder} !important;
        backdrop-filter: blur(16px) saturate(120%) !important;
        -webkit-backdrop-filter: blur(16px) saturate(120%) !important;
        box-shadow: ${isDark ? '0 10px 30px -10px rgba(0, 0, 0, 0.5)' : '0 10px 30px -10px rgba(0, 0, 0, 0.03)'} !important;
        transition: all 0.3s ease;
      }
      .custom-card-style:hover {
        border-color: ${p.hex}33 !important;
        box-shadow: ${isDark ? `0 12px 40px -10px ${p.hex}15` : `0 12px 40px -10px ${p.hex}0a`} !important;
      }

      /* Custom Overrides mapping Tailwind indigo classes to Primary Accent */
      .text-indigo-600 { color: ${p.hex} !important; }
      .hover\\:text-indigo-600:hover { color: ${p.hex} !important; }
      .text-indigo-700 { color: ${p.darkHex} !important; }
      
      /* Vivid Multi-color Gradient primary button */
      .bg-indigo-600 { 
        background: linear-gradient(135deg, ${p.hex}, ${s.hex}) !important; 
        color: #ffffff !important;
        border: none !important;
        box-shadow: 0 4px 14px ${p.hex}40 !important;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
      }
      .bg-indigo-600:hover { 
        background: linear-gradient(135deg, ${p.darkHex}, ${s.darkHex}) !important;
        box-shadow: 0 6px 18px ${p.hex}55 !important;
        transform: translateY(-1px);
      }
      .hover\\:bg-indigo-600:hover {
        background: linear-gradient(135deg, ${p.hex}, ${s.hex}) !important;
      }
      .hover\\:bg-indigo-700:hover { 
        background: linear-gradient(135deg, ${p.darkHex}, ${s.darkHex}) !important;
      }
      
      /* Panels and status tags */
      .bg-indigo-50 { 
        background-color: ${isDark ? `${p.hex}18` : p.lightHex} !important; 
        color: ${isDark ? p.lightTextHex : p.hex} !important;
      }
      .bg-indigo-50\\/50 { 
        background-color: ${isDark ? `${p.hex}0f` : p.lightHexHalf} !important; 
      }
      .hover\\:bg-indigo-100:hover { 
        background-color: ${isDark ? `${p.hex}22` : p.lightHexHover} !important; 
      }
      
      /* Dynamic low-contrast borders */
      .border-indigo-100 { 
        border-color: ${isDark ? `${p.hex}25` : p.lightHexHover} !important; 
      }
      .border-indigo-100\\/50 { 
        border-color: ${isDark ? `${p.hex}15` : p.lightHexHoverHalf} !important; 
      }
      
      /* Interactive items ring and focus */
      .accent-indigo-600 { accent-color: ${p.hex} !important; }
      .focus\\:ring-indigo-500\\/20:focus { 
        --tw-ring-color: ${p.glowHex} !important; 
        box-shadow: 0 0 0 2px ${p.glowHex} !important; 
      }
      .shadow-indigo-100 { 
        --tw-shadow-color: ${p.glowHex} !important; 
      }
      .hover\\:border-indigo-500:hover { 
        border-color: ${p.hex} !important; 
      }
      .hover\\:bg-indigo-50\\/30:hover { 
        background-color: ${isDark ? `${p.hex}12` : p.lightHexThird} !important; 
      }
      
      .dark .text-indigo-600 { color: ${p.lightTextHex} !important; }
      .dark .text-indigo-700 { color: ${p.lightTextHex} !important; }
      .dark .bg-indigo-50 { 
        background-color: ${p.darkLightBgHex} !important; 
        color: ${p.lightTextHex} !important; 
      }
    `;
  }, [presetTheme, secondaryTheme, isDarkMode]);

  const activeThemeObj = COMFORT_THEMES.find(t => t.id === presetTheme) || COMFORT_THEMES[0];

  return (
    <div dir={isRtl ? 'rtl' : 'ltr'} className={`min-h-screen ${isDarkMode ? 'dark bg-slate-950 text-slate-100' : ''} preset-theme-${presetTheme} ${themeStyles.body} ${themeStyles.text} font-sans antialiased pb-12 transition-all duration-300`}>
      {/* Decorative Comfort Theme Override Styles */}
      <style>{dynamicStyles}</style>

      {/* Decorative header gradient with ambient bleed */}
      <div 
        className="absolute top-0 left-0 right-0 h-[32rem] pointer-events-none -z-10 transition-all duration-700 ease-out" 
        style={{
          background: isDarkMode 
            ? `radial-gradient(ellipse at top, ${activeThemeObj.hex}1c, transparent 60%)`
            : `radial-gradient(ellipse at top, ${activeThemeObj.hex}0f, transparent 60%)`
        }}
      />

      <header className="max-w-4xl mx-auto px-4 pt-12 pb-6">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <span className="p-1.5 bg-linear-to-tr from-indigo-500 to-violet-600 text-white rounded-xl shadow-md shadow-indigo-500/10 flex items-center justify-center border border-white/10">
                <Route className="w-5 h-5 text-white stroke-[2.5]" />
              </span>
              <h1 className="text-3xl font-black tracking-tight text-white font-sans">
                Masari
              </h1>
            </div>
            <p className="text-xs font-bold text-slate-400 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
              {formattedDate}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 self-start sm:self-center">
            {/* Simple Level HUD on Header, full details inside glassmorphism card */}
            {profile && (
              <div className="flex items-center gap-2 bg-slate-900/60 border border-white/5 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-300">
                <span className="text-indigo-400">LVL {Math.floor((profile.totalXp || 0) / 100) + 1}</span>
                <span className="text-slate-600">•</span>
                <span className="text-amber-400">{profile.totalXp % 100}/100 XP</span>
              </div>
            )}

            {/* Unified Settings Menu Button */}
            <button
              type="button"
              id="settings-menu-toggle-btn"
              onClick={() => setIsSettingsOpen(true)}
              className={`p-2 bg-slate-900 border border-slate-800 rounded-xl shadow-xs text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-all cursor-pointer flex items-center justify-center shrink-0 w-9 h-9`}
              title="Open Settings"
            >
              <Settings className="w-4 h-4 text-indigo-400" />
            </button>

            {loading && (
              <span className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-full shadow-xs">
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-indigo-400" />
                {t('syncing')}
              </span>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4">
        {/* Error Notification Banner */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="bg-rose-50 border border-rose-100 text-rose-700 p-4 rounded-2xl mb-6 text-sm font-semibold flex items-start gap-2.5 shadow-sm"
            >
              <AlertCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
              <div className="flex-1">
                <p>{error}</p>
              </div>
              <button 
                type="button"
                id="clear-error-btn"
                onClick={() => setError(null)} 
                className="text-rose-400 hover:text-rose-600 font-bold ml-auto cursor-pointer"
              >
                ×
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Sleek Glassmorphism Dashboard Card */}
        {profile && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative overflow-hidden rounded-3xl border border-white/10 bg-slate-900/60 backdrop-blur-xl p-6 mb-6 shadow-[0_8px_32px_0_rgba(0,0,0,0.37)] text-white"
          >
            {/* Soft glowing ambient gradients */}
            <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-br from-indigo-500/15 to-purple-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-10 -left-10 w-48 h-48 bg-gradient-to-tr from-amber-500/15 to-orange-500/10 rounded-full blur-3xl pointer-events-none" />

            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative z-10">
              {/* Left Column: Points Balance */}
              <div className="space-y-1.5">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                  Total Points Balance
                </p>
                <div className="flex items-baseline gap-2">
                  <span className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-amber-400 to-amber-500 tracking-tight drop-shadow-sm font-sans">
                    {profile.points}
                  </span>
                  <span className="text-sm font-black text-amber-400 tracking-wider uppercase font-mono">Pts</span>
                </div>
                <p className="text-xs text-slate-400 font-semibold">
                  Spend your accumulated points on premium themes and boosters in the rewards shop below.
                </p>
              </div>

              {/* Right Column: Mini Stats Level & Streak */}
              <div className="flex flex-wrap gap-4 w-full md:w-auto">
                {/* Level Card */}
                <div className="flex-1 min-w-[140px] md:flex-none bg-slate-950/40 border border-white/5 p-4 rounded-2xl flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-600 text-white flex items-center justify-center font-black text-sm shadow-md shadow-indigo-900/30">
                    LVL
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Current Level</p>
                    <p className="text-base font-black text-white">{Math.floor((profile.totalXp || 0) / 100) + 1}</p>
                  </div>
                </div>

                {/* Streak Card */}
                <div className="flex-1 min-w-[140px] md:flex-none bg-slate-950/40 border border-white/5 p-4 rounded-2xl flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 text-slate-950 flex items-center justify-center font-black text-lg shadow-md shadow-amber-900/10">
                    🔥
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Daily Streak</p>
                    <p className="text-base font-black text-white">{profile.streak || 0} Days</p>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Bottom Progress Bar: level progression */}
            <div className="mt-6 pt-5 border-t border-white/5 space-y-2">
              <div className="flex justify-between items-center text-xs font-bold">
                <span className="text-slate-400 flex items-center gap-1">
                  <Compass className="w-3.5 h-3.5 text-indigo-400" />
                  Level Progress
                </span>
                <span className="text-indigo-300 font-mono">{profile.totalXp % 100}% towards next rank</span>
              </div>
              <div className="w-full bg-slate-950/60 rounded-full h-2.5 p-0.5 border border-white/5">
                <div 
                  className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 h-1.5 rounded-full shadow-inner transition-all duration-500" 
                  style={{ width: `${profile.totalXp % 100}%` }}
                />
              </div>
            </div>
          </motion.div>
        )}

        {/* Dynamic Bento Stats Grid */}
        <TaskStats tasks={tasks} />

        {/* Energy Coordinator Section */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`${themeStyles.card} rounded-2xl p-6 shadow-xs mb-6 hover:shadow-md transition-all duration-300 relative overflow-hidden animate-in`}
        >
          {/* Subtle background decoration */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50/40 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none" />

          <div className="flex flex-col md:flex-row gap-6 items-stretch">
            {/* Energy Slider Column */}
            <div className="flex-1 space-y-4">
              <div>
                <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                  <span className="p-1 bg-indigo-50 text-indigo-600 rounded-lg">⚡</span>
                  {t('coordinator_title')}
                </h2>
                <p className="text-xs text-slate-400 font-semibold mt-1">
                  {t('coordinator_desc')}
                </p>
              </div>

              <div className="space-y-2 bg-slate-50/50 p-4 rounded-xl border border-slate-100">
                <div className="flex justify-between items-center text-xs font-bold text-slate-500">
                  <span>{t('energy_level')}</span>
                  <span className="text-indigo-600 text-lg font-extrabold">{energy} / 10</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={energy}
                  onChange={(e) => setEnergy(Number(e.target.value))}
                  className="w-full accent-indigo-600 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer my-2"
                />
                <div className="flex justify-between text-[10px] text-slate-400 font-bold">
                  <span>{t('energy_low')}</span>
                  <span>{t('energy_medium')}</span>
                  <span>{t('energy_high')}</span>
                </div>
              </div>
            </div>

            {/* Suggested Task Column */}
            <div className="flex-1 bg-linear-to-br from-indigo-50/30 to-slate-50/30 rounded-xl p-5 border border-slate-100 flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-extrabold text-indigo-600 uppercase tracking-widest block mb-2">
                  {t('suggested_task')}
                </span>

                {suggestedTask ? (
                  <div className="space-y-2">
                    <h3 className="text-base font-bold text-slate-800 tracking-tight leading-tight">
                      {suggestedTask.title}
                    </h3>
                    {suggestedTask.description && (
                      <p className="text-xs text-slate-500 line-clamp-2">
                        {suggestedTask.description}
                      </p>
                    )}
                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      <span className="text-[10px] font-bold bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-md border border-indigo-100/50">
                        ⚡ Effort: {suggestedTask.effort || 5}
                      </span>
                      <span className="text-[10px] font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md">
                        {t(`cat_${suggestedTask.category.toLowerCase()}`).startsWith('cat_') ? suggestedTask.category : t(`cat_${suggestedTask.category.toLowerCase()}`)}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="py-4 text-center">
                    <p className="text-xs font-semibold text-slate-400">
                      {t('no_suggestions')}
                    </p>
                  </div>
                )}
              </div>

              {suggestedTask && (
                <div className="mt-4 pt-3 border-t border-slate-100 flex justify-end">
                  <button
                    type="button"
                    onClick={() => handleToggleTask(suggestedTask.id, true)}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold shadow-sm shadow-indigo-100 transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <span>{t('complete_task')}</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </motion.div>

        {/* Unlocked Focus Soundscapes Feature */}
        {profile && profile.unlockedItems.includes('music') && (
          <Soundscapes />
        )}

        {/* Unlocked AI Gemini Cheerleader Companion Feature */}
        {profile && profile.unlockedItems.includes('motivation') && (
          <GeminiCheerleader
            completedCount={tasks.filter(t => t.completed).length}
            activeCount={tasks.filter(t => !t.completed).length}
            level={Math.floor((profile.totalXp || 0) / 100) + 1}
            points={profile.points}
            locale={currentLanguage}
          />
        )}

        {/* 30-Day Productivity Streak Tracker */}
        <StreakTracker streakInfo={streakInfo} locale={currentLanguage} />

        {/* Task Creation Module */}
        <AddTaskForm onAdd={handleAddTask} />

        {/* Firebase Cloud Messaging & Deadline Reminders Widget */}
        <NotificationManager tasks={tasks} />

        {/* Gemini AI Daily Schedule Planner */}
        <GeminiScheduler 
          tasks={tasks} 
          energyLevel={energy} 
          onToggleTask={async (id, completed) => {
            await handleToggleTask(id, completed);
          }} 
        />

        {/* Gamified Points and Rewards Shop */}
        <PointsShop
          profile={profile}
          onPurchaseItem={handlePurchaseItem}
          onSelectTheme={handleSelectTheme}
          onEarnPoints={handleEarnPoints}
        />

        {/* Task Section Header & Filter Toolbar */}
        <div className={`${themeStyles.card} rounded-2xl shadow-xs overflow-hidden mb-6`}>
          {/* Main Tabs and Filter Trigger */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-50 p-4 gap-4">
            <div className="flex gap-1.5 bg-slate-100/80 p-1 rounded-xl self-start">
              {(['all', 'active', 'completed'] as const).map((tab) => {
                const count = tab === 'all' 
                  ? tasks.length 
                  : tab === 'active' 
                    ? tasks.filter(t => !t.completed).length 
                    : tasks.filter(t => t.completed).length;

                return (
                  <button
                    key={tab}
                    type="button"
                    id={`tab-${tab}-btn`}
                    onClick={() => setActiveTab(tab)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all cursor-pointer flex items-center gap-1.5 ${
                      activeTab === tab
                        ? 'bg-white text-indigo-700 shadow-xs'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    {t(`tab_${tab}`)}
                    <span className={`px-1.5 py-0.5 rounded-md text-[10px] font-bold ${
                      activeTab === tab 
                        ? 'bg-indigo-50 text-indigo-700' 
                        : 'bg-slate-200 text-slate-600'
                    }`}>
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Search and Filters buttons */}
            <div className="flex items-center gap-2 w-full sm:w-auto">
              {/* Search Container */}
              <div className="relative flex-1 sm:flex-initial">
                <Search className={`absolute ${isRtl ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400`} />
                <input
                  type="text"
                  id="task-search-input"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t('search_placeholder')}
                  className={`w-full sm:w-48 ${isRtl ? 'pr-9 pl-4' : 'pl-9 pr-4'} py-2 bg-slate-50 border-0 rounded-xl text-xs font-medium placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/10 focus:bg-white transition-all`}
                />
              </div>

              {/* Toggle filters button */}
              <button
                type="button"
                id="toggle-filters-btn"
                onClick={() => setShowFilters(!showFilters)}
                className={`p-2 rounded-xl border transition-all cursor-pointer flex items-center justify-center ${
                  showFilters || selectedCategory !== 'all' || selectedPriority !== 'all'
                    ? 'border-indigo-100 bg-indigo-50/50 text-indigo-600'
                    : 'border-slate-100 hover:bg-slate-50 text-slate-500'
                }`}
                title="Filters"
              >
                <SlidersHorizontal className="w-4 h-4" />
              </button>

              {/* Toggle favorites filter button */}
              <button
                type="button"
                id="toggle-favorites-filter-btn"
                onClick={() => setShowOnlyFavorites(!showOnlyFavorites)}
                className={`p-2 rounded-xl border transition-all cursor-pointer flex items-center justify-center ${
                  showOnlyFavorites
                    ? 'border-rose-100 bg-rose-50/70 text-rose-600'
                    : 'border-slate-100 hover:bg-slate-50 text-slate-500'
                }`}
                title={showOnlyFavorites ? "Showing only favorites" : "Show only favorites"}
              >
                <Heart className={`w-4 h-4 ${showOnlyFavorites ? 'fill-rose-500 text-rose-500' : ''}`} />
              </button>
            </div>
          </div>

          {/* Expandable Advanced Filters Box */}
          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden bg-slate-50/50 border-b border-slate-50"
              >
                <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-semibold">
                  {/* Priority Filter Selection */}
                  <div className="space-y-1.5">
                    <span className="text-slate-400 uppercase tracking-wider block">{t('filter_priority_title')}</span>
                    <div className="flex gap-1.5 flex-wrap">
                      {['all', 'low', 'medium', 'high'].map((p) => (
                        <button
                          key={p}
                          type="button"
                          id={`filter-priority-${p}-btn`}
                          onClick={() => setSelectedPriority(p)}
                          className={`px-3 py-1.5 rounded-lg border capitalize transition-all cursor-pointer ${
                            selectedPriority === p
                              ? 'bg-indigo-600 border-indigo-600 text-white shadow-xs'
                              : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                          }`}
                        >
                          {p === 'all' ? t('tab_all') : t(`priority_${p}`)}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Category Filter Selection */}
                  <div className="space-y-1.5">
                    <span className="text-slate-400 uppercase tracking-wider block">{t('filter_category_title')}</span>
                    <select
                      id="filter-category-select"
                      value={selectedCategory}
                      onChange={(e) => setSelectedCategory(e.target.value)}
                      className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-700 font-medium focus:outline-hidden"
                    >
                      <option value="all">{t('all_categories')}</option>
                      {categoriesList.map((cat) => (
                        <option key={cat} value={cat}>
                          {t(`cat_${cat.toLowerCase()}`).startsWith('cat_') ? cat : t(`cat_${cat.toLowerCase()}`)}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Active Filter Badges */}
          {(selectedCategory !== 'all' || selectedPriority !== 'all' || showOnlyFavorites) && (
            <div className="px-4 py-2 bg-indigo-50/20 border-b border-slate-50 flex flex-wrap gap-2 items-center">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-600">{t('active_filters_label')}</span>
              
              {showOnlyFavorites && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-rose-50 border border-rose-100 text-rose-700 text-xs font-semibold">
                  <Heart className="w-3 h-3 fill-rose-500 text-rose-500" />
                  <span>Favorites</span>
                  <button 
                    type="button"
                    id="clear-favorites-filter-btn"
                    onClick={() => setShowOnlyFavorites(false)} 
                    className="hover:text-rose-900 ml-1 mr-1 font-bold cursor-pointer"
                  >
                    ×
                  </button>
                </span>
              )}

              {selectedPriority !== 'all' && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-semibold">
                  {t('priority_label')}: <span className="capitalize">{t(`priority_${selectedPriority}`)}</span>
                  <button 
                    type="button"
                    id="clear-priority-filter-btn"
                    onClick={() => setSelectedPriority('all')} 
                    className="hover:text-indigo-900 ml-1 mr-1 font-bold cursor-pointer"
                  >
                    ×
                  </button>
                </span>
              )}

              {selectedCategory !== 'all' && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-semibold">
                  {t('category_label')}: {t(`cat_${selectedCategory.toLowerCase()}`).startsWith('cat_') ? selectedCategory : t(`cat_${selectedCategory.toLowerCase()}`)}
                  <button 
                    type="button"
                    id="clear-category-filter-btn"
                    onClick={() => setSelectedCategory('all')} 
                    className="hover:text-indigo-900 ml-1 mr-1 font-bold cursor-pointer"
                  >
                    ×
                  </button>
                </span>
              )}

              <button
                type="button"
                id="reset-all-filters-btn"
                onClick={() => {
                  setSelectedPriority('all');
                  setSelectedCategory('all');
                  setShowOnlyFavorites(false);
                }}
                className={`${isRtl ? 'mr-auto' : 'ml-auto'} text-[10px] font-bold text-slate-400 hover:text-indigo-600 transition-colors cursor-pointer`}
              >
                {t('reset_all')}
              </button>
            </div>
          )}

          {/* Task Feed / List rendering */}
          <div className="p-4 bg-slate-50/20">
            {loading ? (
              /* Loading Spinner / Skeletons */
              <div className="space-y-3 py-8 text-center flex flex-col items-center justify-center">
                <RefreshCw className="w-8 h-8 text-indigo-500 animate-spin mb-2" />
                <p className="text-sm font-semibold text-slate-400">Loading your tasks...</p>
              </div>
            ) : filteredTasks.length === 0 ? (
              /* Empty state rendering */
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="py-12 px-4 text-center border-2 border-dashed border-slate-100 rounded-xl"
              >
                <div className="p-3 bg-slate-100 rounded-full inline-block text-slate-400 mb-3">
                  <FolderKanban className="w-6 h-6" />
                </div>
                <h3 className="text-sm font-bold text-slate-700">{t('no_tasks_found')}</h3>
                <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
                  {tasks.length === 0 
                    ? t('get_started_desc')
                    : t('no_matches_desc')}
                </p>
                {(selectedCategory !== 'all' || selectedPriority !== 'all' || searchQuery) && (
                  <button
                    type="button"
                    id="clear-filters-empty-btn"
                    onClick={() => {
                      setSelectedPriority('all');
                      setSelectedCategory('all');
                      setSearchQuery('');
                    }}
                    className="mt-3 text-xs font-semibold text-indigo-600 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-lg transition-all cursor-pointer"
                  >
                    {t('clear_filters_btn')}
                  </button>
                )}
              </motion.div>
            ) : (
              /* Interactive Tasks list with entrance animations */
              <div className="space-y-3">
                <AnimatePresence mode="popLayout">
                  {filteredTasks.map((task) => (
                    <TaskItem
                      key={task.id}
                      task={task}
                      onToggle={handleToggleTask}
                      onDelete={handleDeleteTask}
                      onUpdate={handleUpdateTask}
                    />
                  ))}
                </AnimatePresence>
              </div>
            )}
          </div>
        </div>

        {/* Productivity Tips Component */}
        <ProductivityTips />
      </main>

      {/* Dynamic Success AlertDialog for Task Completion */}
      <SuccessDialog
        isOpen={!!completionReward?.show}
        onClose={() => setCompletionReward(null)}
        points={completionReward?.points || 10}
        locale={currentLanguage}
      />

      {/* App Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        presetTheme={presetTheme}
        secondaryTheme={secondaryTheme}
        onSaveThemePair={(primary, secondary) => {
          setPresetTheme(primary);
          setSecondaryTheme(secondary);
          try {
            localStorage.setItem('preset_theme', primary);
            localStorage.setItem('preset_theme_secondary', secondary);
          } catch (err) {
            console.warn(err);
          }
        }}
        isDarkMode={isDarkMode}
        onToggleDarkMode={handleToggleDarkMode}
        currentLanguage={currentLanguage as 'en' | 'ar' | 'fr'}
        onChangeLanguage={(lang) => i18n.changeLanguage(lang)}
      />
    </div>
  );
}
