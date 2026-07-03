import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Palette, Moon, Sun, Globe, Settings, Eye, Check, Sparkles } from 'lucide-react';
import { COMFORT_THEMES } from '../data/comfortThemes';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  presetTheme: string;
  secondaryTheme: string;
  onSaveThemePair: (primary: string, secondary: string) => void;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
  currentLanguage: 'en' | 'ar' | 'fr';
  onChangeLanguage: (lang: 'en' | 'ar' | 'fr') => void;
}

const SETTINGS_T = {
  en: {
    title: 'Masari Studio Settings',
    subtitle: 'Customize your daily organizer experience',
    primaryColor: 'Primary Base Color',
    secondaryColor: 'Secondary Gradient Blend',
    appThemeDesc: 'Pick a color pair to blend a custom ambient gradient across your space.',
    darkMode: 'Interface Brightness',
    language: 'App Language',
    close: 'Save & Apply Theme',
    modeDark: 'Dark Mode',
    modeLight: 'Light Mode',
    livePreview: 'Ambient Live Preview',
    previewCardTitle: 'Sample Daily Priority',
    previewCardTask: 'Morning mindful planning',
    previewCardBtn: 'Complete Plan'
  },
  ar: {
    title: 'إعدادات ستوديو مساري',
    subtitle: 'تخصيص تجربة المنظم اليومي الخاصة بك',
    primaryColor: 'اللون الأساسي الرئيسي',
    secondaryColor: 'مزج اللون الثانوي',
    appThemeDesc: 'اختر زوجاً من الألوان لمزج تدرج لوني مريح للعين في خلفية تطبيقك.',
    darkMode: 'سطوع الواجهة',
    language: 'لغة التطبيق',
    close: 'حفظ وتطبيق المظهر',
    modeDark: 'الوضع الداكن',
    modeLight: 'الوضع الفاتح',
    livePreview: 'معاينة حية ومباشرة',
    previewCardTitle: 'مهمة يومية نموذجية',
    previewCardTask: 'تخطيط الصباح الواعي',
    previewCardBtn: 'إكمال التخطيط'
  },
  fr: {
    title: 'Paramètres Masari Studio',
    subtitle: 'Personnalisez votre expérience d\'organisation',
    primaryColor: 'Couleur de Base Principale',
    secondaryColor: 'Mélange de Gradient Secondaire',
    appThemeDesc: 'Sélectionnez une paire de couleurs pour fusionner un dégradé d\'ambiance.',
    darkMode: 'Luminosité de l\'interface',
    language: 'Langue de l\'app',
    close: 'Enregistrer & Appliquer',
    modeDark: 'Mode Sombre',
    modeLight: 'Mode Clair',
    livePreview: 'Aperçu Ambiant en Direct',
    previewCardTitle: 'Priorité Quotidienne Exemple',
    previewCardTask: 'Planification matinale consciente',
    previewCardBtn: 'Terminer'
  }
};

export default function SettingsModal({
  isOpen,
  onClose,
  presetTheme,
  secondaryTheme,
  onSaveThemePair,
  isDarkMode,
  onToggleDarkMode,
  currentLanguage,
  onChangeLanguage,
}: SettingsModalProps) {
  const isRtl = currentLanguage === 'ar';
  const t = SETTINGS_T[currentLanguage] || SETTINGS_T.en;

  const [draftPrimary, setDraftPrimary] = useState(presetTheme);
  const [draftSecondary, setDraftSecondary] = useState(secondaryTheme);

  // Sync draft states when modal opens
  useEffect(() => {
    if (isOpen) {
      setDraftPrimary(presetTheme);
      setDraftSecondary(secondaryTheme);
    }
  }, [isOpen, presetTheme, secondaryTheme]);

  const draftPrimaryObj = COMFORT_THEMES.find(item => item.id === draftPrimary) || COMFORT_THEMES[0];
  const draftSecondaryObj = COMFORT_THEMES.find(item => item.id === draftSecondary) || COMFORT_THEMES[1] || COMFORT_THEMES[0];

  const handleSave = () => {
    onSaveThemePair(draftPrimary, draftSecondary);
    onClose();
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
            className="absolute inset-0 bg-slate-950/70 backdrop-blur-md cursor-pointer"
          />

          {/* Settings Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ type: 'spring', damping: 25, stiffness: 380 }}
            id="settings-dialog-container"
            dir={isRtl ? 'rtl' : 'ltr'}
            className="relative bg-[#121214] border border-slate-800/80 rounded-3xl p-6 shadow-2xl max-w-lg w-full overflow-hidden z-10 text-white"
          >
            {/* Dynamic Background Bleeds based on current DRAFT selections for rich feedback */}
            <div 
              className="absolute -top-32 -left-32 w-72 h-72 rounded-full blur-[100px] pointer-events-none opacity-25 transition-all duration-700 ease-out" 
              style={{ backgroundColor: draftPrimaryObj.hex }} 
            />
            <div 
              className="absolute -bottom-32 -right-32 w-72 h-72 rounded-full blur-[100px] pointer-events-none opacity-25 transition-all duration-700 ease-out" 
              style={{ backgroundColor: draftSecondaryObj.hex }} 
            />

            {/* Header section */}
            <div className="relative flex justify-between items-center pb-3 border-b border-slate-800/60 mb-4">
              <div className="flex items-center gap-2.5">
                <span 
                  className="p-2 rounded-xl transition-all duration-300"
                  style={{ 
                    backgroundColor: `${draftPrimaryObj.hex}20`,
                    color: draftPrimaryObj.hex
                  }}
                >
                  <Settings className="w-5 h-5 animate-spin-slow" />
                </span>
                <div>
                  <h3 className="text-base font-black text-white leading-none">
                    {t.title}
                  </h3>
                  <p className="text-[10px] text-slate-400 font-bold mt-1">
                    {t.subtitle}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                id="close-settings-modal-btn"
                className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-white rounded-xl transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Content section */}
            <div className="relative space-y-4 max-h-[70vh] overflow-y-auto pr-1">
              <p className="text-[11px] text-slate-400 font-semibold leading-relaxed">
                {t.appThemeDesc}
              </p>

              {/* LIVE PREVIEW COMPONENT */}
              <div className="space-y-1.5">
                <div className="flex items-center gap-1.5 text-[11px] font-black text-slate-400 uppercase tracking-wide">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>{t.livePreview}</span>
                </div>

                {/* Simulated Mini App viewport */}
                <div 
                  className="w-full h-36 rounded-2xl relative overflow-hidden border border-slate-800/80 transition-all duration-500 p-4 flex flex-col justify-between"
                  style={{
                    background: isDarkMode
                      ? `radial-gradient(circle at 10% 10%, ${draftPrimaryObj.hex}2a, transparent 65%), radial-gradient(circle at 90% 90%, ${draftSecondaryObj.hex}2a, transparent 65%), #09090b`
                      : `radial-gradient(circle at 10% 10%, ${draftPrimaryObj.hex}14, transparent 65%), radial-gradient(circle at 90% 90%, ${draftSecondaryObj.hex}14, transparent 65%), #f8fafc`
                  }}
                >
                  {/* Mini Header */}
                  <div className="flex justify-between items-center pb-1 border-b border-slate-800/10">
                    <span className="text-[10px] font-black text-slate-400">MASARI</span>
                    <span 
                      className="text-[8px] font-extrabold px-1.5 py-0.5 rounded-full"
                      style={{
                        backgroundColor: `${draftPrimaryObj.hex}15`,
                        color: draftPrimaryObj.hex
                      }}
                    >
                      {draftPrimaryObj.nameEn} + {draftSecondaryObj.nameEn}
                    </span>
                  </div>

                  {/* Simulated Card with auto background opacity adjustment */}
                  <div 
                    className="flex-1 my-2 rounded-lg p-2 flex items-center justify-between border transition-all"
                    style={{
                      backgroundColor: isDarkMode ? 'rgba(18, 18, 22, 0.85)' : 'rgba(255, 255, 255, 0.9)',
                      borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0,0,0,0.06)',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
                    }}
                  >
                    <div>
                      <h4 className="text-[10px] font-bold text-slate-400 leading-tight">
                        {t.previewCardTitle}
                      </h4>
                      <p className={`text-[11px] font-extrabold leading-tight mt-0.5 ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>
                        {t.previewCardTask}
                      </p>
                    </div>
                    
                    {/* Simulated Primary Button filled with dynamic gradient blend */}
                    <button
                      type="button"
                      className="text-[8px] font-black px-2.5 py-1 rounded-md text-white transition-all shadow-sm"
                      style={{
                        background: `linear-gradient(135deg, ${draftPrimaryObj.hex}, ${draftSecondaryObj.hex})`
                      }}
                    >
                      {t.previewCardBtn}
                    </button>
                  </div>
                </div>
              </div>

              {/* PRIMARY COLOR SWATCH SELECTOR */}
              <div className="space-y-2 pt-2 border-t border-slate-800/40">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-black text-slate-200 uppercase tracking-wide">
                    {t.primaryColor}
                  </span>
                  <span className="text-[10px] font-bold text-slate-400">
                    {currentLanguage === 'ar' ? draftPrimaryObj.nameAr : currentLanguage === 'fr' ? draftPrimaryObj.nameFr : draftPrimaryObj.nameEn}
                  </span>
                </div>
                
                <div className="grid grid-cols-7 gap-1.5 pt-0.5">
                  {COMFORT_THEMES.map((item) => {
                    const isActive = draftPrimary === item.id;
                    return (
                      <button
                        key={`primary-${item.id}`}
                        type="button"
                        onClick={() => setDraftPrimary(item.id)}
                        className="relative flex flex-col items-center justify-center p-0.5 cursor-pointer group focus:outline-hidden"
                        title={currentLanguage === 'ar' ? item.nameAr : currentLanguage === 'fr' ? item.nameFr : item.nameEn}
                      >
                        <span
                          className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 ease-out transform group-hover:scale-110 shadow-md ${
                            isActive ? 'scale-105' : 'hover:opacity-90'
                          }`}
                          style={{ 
                            backgroundColor: item.hex,
                            border: isActive ? '2.5px solid white' : '1px solid rgba(255,255,255,0.15)',
                            boxShadow: isActive ? `0 0 10px ${item.hex}dd` : 'none'
                          }}
                        >
                          {isActive && (
                            <Check className="w-3.5 h-3.5 text-white drop-shadow-[0_1px_1.5px_rgba(0,0,0,0.6)] stroke-[4.5]" />
                          )}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* SECONDARY COLOR SWATCH SELECTOR */}
              <div className="space-y-2 pt-2 border-t border-slate-800/40">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-black text-slate-200 uppercase tracking-wide">
                    {t.secondaryColor}
                  </span>
                  <span className="text-[10px] font-bold text-slate-400">
                    {currentLanguage === 'ar' ? draftSecondaryObj.nameAr : currentLanguage === 'fr' ? draftSecondaryObj.nameFr : draftSecondaryObj.nameEn}
                  </span>
                </div>
                
                <div className="grid grid-cols-7 gap-1.5 pt-0.5">
                  {COMFORT_THEMES.map((item) => {
                    const isActive = draftSecondary === item.id;
                    return (
                      <button
                        key={`secondary-${item.id}`}
                        type="button"
                        onClick={() => setDraftSecondary(item.id)}
                        className="relative flex flex-col items-center justify-center p-0.5 cursor-pointer group focus:outline-hidden"
                        title={currentLanguage === 'ar' ? item.nameAr : currentLanguage === 'fr' ? item.nameFr : item.nameEn}
                      >
                        <span
                          className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 ease-out transform group-hover:scale-110 shadow-md ${
                            isActive ? 'scale-105' : 'hover:opacity-90'
                          }`}
                          style={{ 
                            backgroundColor: item.hex,
                            border: isActive ? '2.5px solid white' : '1px solid rgba(255,255,255,0.15)',
                            boxShadow: isActive ? `0 0 10px ${item.hex}dd` : 'none'
                          }}
                        >
                          {isActive && (
                            <Check className="w-3.5 h-3.5 text-white drop-shadow-[0_1px_1.5px_rgba(0,0,0,0.6)] stroke-[4.5]" />
                          )}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Interface Brightness / Mode setting */}
              <div className="space-y-2 pt-3 border-t border-slate-800/60">
                <div className="flex items-center gap-1.5 text-xs font-black text-slate-200 uppercase tracking-wide">
                  <Eye className="w-3.5 h-3.5 text-amber-400" />
                  <span>{t.darkMode}</span>
                </div>
                
                <div className="flex gap-2">
                  <button
                    type="button"
                    id="settings-theme-light-btn"
                    onClick={() => { if (isDarkMode) onToggleDarkMode(); }}
                    className={`flex-1 flex items-center justify-center gap-2 p-2 rounded-xl border text-xs font-bold cursor-pointer transition-all ${
                      !isDarkMode
                        ? 'bg-amber-500/10 border-amber-500/50 text-amber-400 shadow-xs'
                        : 'bg-[#1a1a1f] border-slate-800 text-slate-400 hover:bg-[#22222a]'
                    }`}
                  >
                    <Sun className="w-4 h-4 text-amber-400" />
                    <span>{t.modeLight}</span>
                  </button>
                  <button
                    type="button"
                    id="settings-theme-dark-btn"
                    onClick={() => { if (!isDarkMode) onToggleDarkMode(); }}
                    className={`flex-1 flex items-center justify-center gap-2 p-2 rounded-xl border text-xs font-bold cursor-pointer transition-all ${
                      isDarkMode
                        ? 'shadow-xs'
                        : 'bg-[#1a1a1f] border-slate-800 text-slate-400 hover:bg-[#22222a]'
                    }`}
                    style={{
                      borderColor: isDarkMode ? draftPrimaryObj.hex : '',
                      color: isDarkMode ? draftPrimaryObj.lightTextHex : '',
                      backgroundColor: isDarkMode ? `${draftPrimaryObj.hex}20` : ''
                    }}
                  >
                    <Moon className="w-4 h-4" style={{ color: isDarkMode ? draftPrimaryObj.hex : '#94a3b8' }} />
                    <span>{t.modeDark}</span>
                  </button>
                </div>
              </div>

              {/* Language selection switcher */}
              <div className="space-y-2 pt-3 border-t border-slate-800/60">
                <div className="flex items-center gap-1.5 text-xs font-black text-slate-200 uppercase tracking-wide">
                  <Globe className="w-3.5 h-3.5 text-indigo-400" />
                  <span>{t.language}</span>
                </div>
                
                <div className="flex gap-2 p-1 bg-[#1a1a1f] border border-slate-800 rounded-xl">
                  {(['en', 'ar', 'fr'] as const).map((lang) => (
                    <button
                      key={lang}
                      type="button"
                      id={`settings-lang-${lang}`}
                      onClick={() => onChangeLanguage(lang)}
                      className="flex-1 py-1.5 text-xs font-bold rounded-lg transition-all duration-300 cursor-pointer text-center"
                      style={{
                        backgroundColor: currentLanguage === lang ? draftPrimaryObj.hex : 'transparent',
                        color: currentLanguage === lang ? '#ffffff' : '#94a3b8'
                      }}
                    >
                      {lang === 'en' ? 'English' : lang === 'ar' ? 'العربية' : 'Français'}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Close / Done Action button - dynamic background color */}
            <div className="relative mt-4 pt-3 border-t border-slate-800/60">
              <button
                type="button"
                onClick={handleSave}
                id="save-settings-btn"
                className="w-full py-3 text-white font-extrabold text-sm rounded-xl cursor-pointer active:scale-98 transition-all duration-300 flex items-center justify-center gap-2 hover:brightness-110 shadow-lg"
                style={{ 
                  background: `linear-gradient(135deg, ${draftPrimaryObj.hex}, ${draftSecondaryObj.hex})`,
                  boxShadow: `0 4px 16px ${draftPrimaryObj.hex}60`
                }}
              >
                <Check className="w-4.5 h-4.5 stroke-[2.5]" />
                <span>{t.close}</span>
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
