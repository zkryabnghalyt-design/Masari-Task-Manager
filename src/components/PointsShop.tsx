import { ShopItem, SHOP_ITEMS } from '../data/shopItems';
import { UserProfile } from '../services/userProfile';
import { ShoppingBag, Lock, CheckCircle2, Sparkles, AlertCircle, Tv, Settings, Play, X, Coins, Check, Loader2, Volume2, VolumeX, Award, Clock } from 'lucide-react';
import { useState, useEffect } from 'react';
import { AdMobHelper } from '../services/adMobHelper';

interface PointsShopProps {
  profile: UserProfile | null;
  onPurchaseItem: (itemId: string, cost: number) => Promise<void>;
  onSelectTheme: (themeId: string) => Promise<void>;
  onEarnPoints: (amount: number) => Promise<void>;
}

export default function PointsShop({ profile, onPurchaseItem, onSelectTheme, onEarnPoints }: PointsShopProps) {
  const [purchasingId, setPurchasingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // AdMob states
  const [showAdPlayer, setShowAdPlayer] = useState(false);
  const [isDebugMode, setIsDebugMode] = useState(() => AdMobHelper.isDebugMode());
  const [adUnitId, setAdUnitId] = useState(() => AdMobHelper.getRewardedAdUnitIdSync());
  const [appId, setAppId] = useState(() => AdMobHelper.getAppIdSync());
  const [isEditingAdUnit, setIsEditingAdUnit] = useState(false);
  const [tempAdUnitId, setTempAdUnitId] = useState(adUnitId);
  const [tempAppId, setTempAppId] = useState(appId);
  const [adCooldown, setAdCooldown] = useState(0);

  // Load safe Ad Unit ID & App ID on mount and whenever debug mode state changes
  useEffect(() => {
    let isMounted = true;
    const fetchAdSettings = async () => {
      const resolvedId = await AdMobHelper.getRewardedAdUnitId();
      const resolvedAppId = await AdMobHelper.getAppId();
      if (isMounted) {
        setAdUnitId(resolvedId);
        setTempAdUnitId(resolvedId);
        setAppId(resolvedAppId);
        setTempAppId(resolvedAppId);
      }
    };
    fetchAdSettings();
    return () => {
      isMounted = false;
    };
  }, [isDebugMode]);

  // AdPlayer specific states
  const [adTimer, setAdTimer] = useState(15);
  const [adMuted, setAdMuted] = useState(false);
  const [adPhase, setAdPhase] = useState<'loading' | 'playing' | 'rewarded'>('loading');
  const [showExitWarning, setShowExitWarning] = useState(false);

  // Save Ad Unit ID & App ID changes
  const handleSaveAdUnitId = () => {
    if (!isDebugMode) {
      localStorage.setItem('admob_rewarded_unit_id', tempAdUnitId);
      localStorage.setItem('admob_app_id', tempAppId);
      setAdUnitId(tempAdUnitId);
      setAppId(tempAppId);
    }
    setIsEditingAdUnit(false);
  };

  // Start Ad Player
  const handleStartAd = () => {
    setAdTimer(15);
    setAdPhase('loading');
    setShowAdPlayer(true);
    setShowExitWarning(false);
  };

  // Cooldown counter
  useEffect(() => {
    let interval: any;
    if (adCooldown > 0) {
      interval = setInterval(() => {
        setAdCooldown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [adCooldown]);

  // Transition from loading to playing
  useEffect(() => {
    if (showAdPlayer && adPhase === 'loading') {
      const timer = setTimeout(() => {
        setAdPhase('playing');
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [showAdPlayer, adPhase]);

  // Main ad playing timer countdown
  useEffect(() => {
    let interval: any;
    if (showAdPlayer && adPhase === 'playing' && adTimer > 0 && !showExitWarning) {
      interval = setInterval(() => {
        setAdTimer((prev) => prev - 1);
      }, 1000);
    } else if (adTimer === 0 && adPhase === 'playing') {
      setAdPhase('rewarded');
    }
    return () => clearInterval(interval);
  }, [showAdPlayer, adPhase, adTimer, showExitWarning]);

  // Cancel Ad and close modal
  const handleConfirmExit = () => {
    setShowAdPlayer(false);
    setShowExitWarning(false);
  };

  // Close attempt handler
  const handleCloseAttempt = () => {
    if (adPhase === 'rewarded') {
      handleClaimReward();
    } else {
      setShowExitWarning(true);
    }
  };

  // Claim points reward
  const handleClaimReward = async () => {
    setShowAdPlayer(false);
    try {
      await onEarnPoints(15);
      setAdCooldown(15); // 15s cooldown
    } catch (err) {
      console.error('Error claiming reward points:', err);
      setError('Failed to claim reward points. Please try again.');
    }
  };

  if (!profile) return null;

  const handleBuy = async (item: ShopItem) => {
    if (profile.points < item.cost) {
      setError(`Not enough points! You need ${item.cost - profile.points} more points to unlock this.`);
      setTimeout(() => setError(null), 4000);
      return;
    }

    setPurchasingId(item.id);
    setError(null);
    try {
      await onPurchaseItem(item.id, item.cost);
    } catch (err) {
      console.error(err);
      setError('Failed to complete purchase. Please try again.');
    } finally {
      setPurchasingId(null);
    }
  };

  const isUnlocked = (itemId: string) => profile.unlockedItems.includes(itemId);
  const isActiveTheme = (themeId: string) => profile.activeTheme === themeId;

  const themes = SHOP_ITEMS.filter((item) => item.type === 'theme');
  const features = SHOP_ITEMS.filter((item) => item.type === 'feature');

  return (
    <div id="rewards-shop-section" className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-850 rounded-3xl p-6 shadow-md hover:shadow-xl transition-all duration-300 mb-6 relative overflow-hidden text-slate-800 dark:text-slate-100">
      {/* Sparkles background elements */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="flex flex-col sm:flex-row justify-between sm:items-center border-b border-slate-100 dark:border-slate-800 pb-4 mb-5 gap-3">
        <div>
          <h2 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
            <span className="p-1.5 bg-amber-50 dark:bg-amber-950/40 text-amber-500 dark:text-amber-400 rounded-xl">🛒</span>
            Gamified Level Up & Rewards Shop
          </h2>
          <p className="text-xs text-slate-400 dark:text-slate-500 font-bold mt-0.5">
            Earn points by completing tasks or viewing sponsors, and spend them to customize your layout!
          </p>
        </div>

        {/* Current Points Balance HUD */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 dark:from-amber-500/15 dark:to-orange-500/15 border border-amber-500/30 px-4 py-2 rounded-2xl flex items-center gap-2.5 shrink-0 shadow-lg shadow-amber-500/5">
            <span className="text-2xl animate-pulse">🪙</span>
            <div>
              <p className="text-[10px] text-amber-600 dark:text-amber-400 font-black uppercase tracking-wider">Your Balance</p>
              <p className="text-lg font-black text-amber-500 dark:text-amber-400 leading-none">{profile.points} Pts</p>
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 mb-4 animate-shake">
          <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Google AdMob Rewarded Ad Integration */}
      <div className="bg-gradient-to-r from-slate-900/60 via-indigo-950/20 to-slate-900/60 border border-indigo-500/30 rounded-2xl p-5 mb-6 flex flex-col md:flex-row items-center justify-between gap-4 relative overflow-hidden shadow-lg shadow-indigo-500/5">
        <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-indigo-500/5 rounded-full blur-2xl pointer-events-none" />

        <div className="flex items-center gap-3 w-full md:w-auto z-10">
          <div className="p-3.5 bg-gradient-to-br from-indigo-500 to-violet-600 text-white rounded-2xl shadow-lg shadow-indigo-500/35 shrink-0">
            <Tv className="w-6 h-6 animate-pulse" />
          </div>
          <div className="space-y-1">
            <h4 className="text-sm font-black text-white flex items-center gap-1.5 flex-wrap">
              <span>Google AdMob Rewarded Ad</span>
              {isDebugMode ? (
                <span className="text-[9px] bg-amber-500/20 text-amber-400 border border-amber-500/30 font-black px-1.5 py-0.5 rounded-md uppercase tracking-wider">⚠️ Safe Test Mode</span>
              ) : (
                <span className="text-[9px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-black px-1.5 py-0.5 rounded-md uppercase tracking-wider">Live Production</span>
              )}
            </h4>
            <div className="flex flex-col sm:flex-row sm:items-center gap-x-2.5 gap-y-1">
              <p className="text-xs text-slate-300 font-semibold">
                Watch a sponsored ad to earn <span className="text-amber-400 font-black">+15 Points</span> instantly!
              </p>
              <span className="hidden sm:inline text-slate-700">•</span>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-mono text-slate-500 bg-slate-950/40 border border-white/5 px-2 py-0.5 rounded-md" title={adUnitId}>
                  ID: {adUnitId.slice(0, 15)}...{adUnitId.slice(-4)}
                </span>
                <button
                  type="button"
                  id="edit-ad-unit-btn"
                  onClick={() => {
                    setTempAdUnitId(adUnitId);
                    setIsEditingAdUnit(true);
                  }}
                  className="text-[10px] text-indigo-400 hover:text-indigo-300 font-black flex items-center gap-0.5 cursor-pointer"
                >
                  <Settings className="w-3 h-3" /> Setup
                </button>
              </div>
            </div>
          </div>
        </div>

        <button
          type="button"
          id="watch-rewarded-ad-btn"
          onClick={handleStartAd}
          disabled={adCooldown > 0}
          className="relative overflow-hidden w-full md:w-auto px-6 py-3.5 bg-gradient-to-r from-amber-500 via-indigo-500 to-violet-600 hover:from-amber-600 hover:via-indigo-600 hover:to-violet-700 text-white font-extrabold text-xs rounded-xl shadow-[0_0_20px_rgba(99,102,241,0.35)] flex items-center justify-center gap-2 transition-all cursor-pointer hover:scale-[1.03] active:scale-[0.97] hover:shadow-[0_0_25px_rgba(245,158,11,0.5)] disabled:from-slate-800 disabled:to-slate-855 disabled:text-slate-500 disabled:shadow-none disabled:scale-100 disabled:cursor-not-allowed uppercase tracking-wider z-10"
        >
          <Play className="w-3.5 h-3.5 fill-white" />
          <span>{adCooldown > 0 ? `Cooldown (${adCooldown}s)` : 'Watch Ad (+15 Points)'}</span>
        </button>
      </div>

      {/* Edit Ad Unit ID Modal */}
      {isEditingAdUnit && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-slate-100 rounded-2xl max-w-md w-full p-6 shadow-xl animate-in fade-in zoom-in duration-200">
            <h3 className="text-base font-extrabold text-slate-800 mb-1">Safe AdMob Configuration</h3>
            <p className="text-xs text-slate-400 font-semibold mb-4 leading-relaxed font-sans">
              Set up and test your Google AdMob Rewarded Ad integration safely.
            </p>

            {/* Environment Selector Toggle */}
            <div className="space-y-3 mb-5 p-3 bg-slate-50 border border-slate-100 rounded-xl">
              <div className="flex justify-between items-center">
                <div>
                  <h4 className="text-[11px] font-black uppercase tracking-wider text-slate-500">AdMob Environment Mode</h4>
                  <p className="text-[10px] text-slate-400 font-semibold">Toggles safety-lock on Ad Unit ID</p>
                </div>
                <button
                  type="button"
                  id="toggle-admob-debug-mode-btn"
                  onClick={() => {
                    const nextValue = !isDebugMode;
                    AdMobHelper.setDebugOverride(nextValue);
                    setIsDebugMode(nextValue);
                  }}
                  className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                    isDebugMode
                      ? 'bg-amber-100 text-amber-700 border border-amber-200'
                      : 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                  }`}
                >
                  {isDebugMode ? 'DEBUG (Test ID)' : 'RELEASE (strings.xml)'}
                </button>
              </div>

              {isDebugMode ? (
                <div className="bg-amber-500/10 border border-amber-500/20 p-2.5 rounded-lg text-[10px] text-amber-700 font-semibold leading-normal">
                  ⚠️ <strong>Safe mode is ACTIVE</strong>: Google's default test ad unit ID is locked to prevent policies violation and secure your account. Your real ID will never be requested.
                </div>
              ) : (
                <div className="bg-emerald-500/10 border border-emerald-500/20 p-2.5 rounded-lg text-[10px] text-emerald-700 font-semibold leading-normal">
                  ✅ <strong>Release mode is ACTIVE</strong>: Reading production-ready Ad Unit ID dynamically from resource asset <code>strings.xml</code>.
                </div>
              )}
            </div>

            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">
                  {isDebugMode ? 'Active Test Application ID (Locked)' : 'AdMob Application ID (from strings.xml)'}
                </label>
                <input
                  type="text"
                  id="ad-app-id-input"
                  value={isDebugMode ? AdMobHelper.getTestAppId() : tempAppId}
                  disabled={isDebugMode}
                  onChange={(e) => setTempAppId(e.target.value)}
                  placeholder="ca-app-pub-xxxxxxxxxxxxxxxx~xxxxxxxxxx"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-slate-700 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:bg-white text-xs font-semibold disabled:opacity-60 disabled:cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">
                  {isDebugMode ? 'Active Test Ad Unit ID (Locked)' : 'Rewarded Ad Unit ID (from strings.xml)'}
                </label>
                <input
                  type="text"
                  id="ad-unit-input"
                  value={isDebugMode ? AdMobHelper.getTestAdUnitId() : tempAdUnitId}
                  disabled={isDebugMode}
                  onChange={(e) => setTempAdUnitId(e.target.value)}
                  placeholder="ca-app-pub-xxxxxxxxxxxxxxxx/xxxxxxxxxx"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-slate-700 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:bg-white text-xs font-semibold disabled:opacity-60 disabled:cursor-not-allowed"
                />
              </div>
            </div>

            <div className="flex gap-2 justify-end border-t border-slate-100 pt-4">
              <button
                type="button"
                id="cancel-ad-unit-edit-btn"
                onClick={() => setIsEditingAdUnit(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg text-xs font-bold cursor-pointer transition-all"
              >
                Close Settings
              </button>
              {!isDebugMode && (
                <button
                  type="button"
                  id="save-ad-unit-edit-btn"
                  onClick={handleSaveAdUnitId}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold cursor-pointer transition-all"
                >
                  Save Override
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Simulated AdMob Rewarded Ad Player */}
      {showAdPlayer && (
        <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800/80 rounded-2xl max-w-md w-full overflow-hidden shadow-2xl relative flex flex-col h-[520px] justify-between text-white animate-in fade-in zoom-in duration-300">
            
            {/* Top Info Bar */}
            <div className="p-4 border-b border-slate-800/60 bg-slate-950/60 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <span className="text-[10px] bg-amber-500 text-slate-950 font-black px-1.5 py-0.5 rounded-sm">Ad</span>
                <span className="text-xs font-bold text-slate-400 truncate max-w-[200px]">{adUnitId}</span>
              </div>
              <button
                type="button"
                id="close-ad-player-btn"
                onClick={handleCloseAttempt}
                className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg transition-all cursor-pointer"
                title="Close Ad"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Main Interactive Screen */}
            <div className="flex-1 flex flex-col items-center justify-center p-6 relative bg-gradient-to-b from-slate-900 via-indigo-950/20 to-slate-950">
              
              {/* PHASE 1: Loading */}
              {adPhase === 'loading' && (
                <div className="text-center space-y-3 animate-pulse">
                  <Loader2 className="w-10 h-10 text-indigo-500 animate-spin mx-auto" />
                  <p className="text-sm font-bold text-slate-300">Loading sponsored media...</p>
                  <p className="text-[10px] text-slate-500">Google AdMob Rewarded Connection</p>
                </div>
              )}

              {/* PHASE 2: Playing */}
              {adPhase === 'playing' && (
                <div className="w-full h-full flex flex-col justify-between items-center text-center py-4">
                  
                  {/* Top promotional graphic simulation */}
                  <div className="w-full bg-slate-950/40 border border-slate-800/40 rounded-xl p-5 space-y-3 relative overflow-hidden flex-1 flex flex-col justify-center">
                    {/* Glowing pulse aura */}
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-24 bg-indigo-500/10 rounded-full blur-xl animate-pulse pointer-events-none" />
                    
                    <span className="text-3xl">🚀</span>
                    <h4 className="text-lg font-black tracking-tight bg-gradient-to-r from-indigo-400 via-violet-400 to-amber-300 bg-clip-text text-transparent">
                      Daily Task Manager
                    </h4>
                    <p className="text-xs text-slate-400 font-semibold leading-relaxed max-w-xs mx-auto">
                      "Unleash the ultimate power of gamified scheduling. Earn XP, build custom themes, and double your task productivity!"
                    </p>
                    
                    {/* Fake Video playback progress simulation */}
                    <div className="pt-2 w-full max-w-[200px] mx-auto space-y-1">
                      <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                        <div 
                          className="bg-indigo-500 h-full transition-all duration-1000 ease-linear"
                          style={{ width: `${((15 - adTimer) / 15) * 100}%` }}
                        />
                      </div>
                      <p className="text-[9px] text-slate-500 font-mono tracking-wider">SPONSORED PROMO PREVIEW</p>
                    </div>
                  </div>

                  {/* Interactivity CTA option */}
                  <div className="mt-5 w-full">
                    <a
                      href="https://ai.studio/build"
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex w-full justify-center items-center gap-1.5 py-3 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white text-xs font-black rounded-xl shadow-lg transition-all"
                    >
                      Install App
                      <Play className="w-3 h-3 fill-white" />
                    </a>
                    <p className="text-[9px] text-slate-500 font-semibold mt-1.5">Free Download • Contains No Real Ads</p>
                  </div>
                </div>
              )}

              {/* PHASE 3: Rewarded */}
              {adPhase === 'rewarded' && (
                <div className="text-center space-y-4 animate-in zoom-in-95 duration-300">
                  <div className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-full flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/5 animate-bounce">
                    <Check className="w-8 h-8" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-lg font-black text-white">Reward Granted!</h3>
                    <p className="text-xs text-slate-400">Thank you for watching the full sponsored preview.</p>
                  </div>
                  <div className="bg-amber-500/10 border border-amber-500/20 p-3 rounded-xl inline-flex items-center gap-2">
                    <span className="text-2xl">🪙</span>
                    <div className="text-left">
                      <p className="text-[9px] text-amber-500 font-black uppercase tracking-wider">Earned Reward</p>
                      <p className="text-sm font-black text-amber-400 leading-none">+15 Points Added</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Exit Warning Popup inside Player */}
              {showExitWarning && (
                <div className="absolute inset-0 bg-slate-950/95 flex flex-col items-center justify-center p-6 text-center z-10 animate-in fade-in duration-200">
                  <span className="text-3xl mb-3">⚠️</span>
                  <h4 className="text-base font-extrabold text-white mb-1.5">Stop watching early?</h4>
                  <p className="text-xs text-slate-400 font-semibold max-w-xs mb-5 leading-relaxed">
                    If you quit now, you won't earn the <span className="text-amber-400 font-bold">15 Points</span> reward. Let the ad finish to claim your coins.
                  </p>
                  <div className="flex flex-col gap-2 w-full max-w-xs">
                    <button
                      type="button"
                      id="resume-ad-btn"
                      onClick={() => setShowExitWarning(false)}
                      className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-black cursor-pointer transition-all"
                    >
                      Resume Watching
                    </button>
                    <button
                      type="button"
                      id="exit-ad-confirm-btn"
                      onClick={handleConfirmExit}
                      className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-400 rounded-xl text-xs font-bold cursor-pointer transition-all"
                    >
                      Skip Ad & Lose Reward
                    </button>
                  </div>
                </div>
              )}

            </div>

            {/* Bottom Controls Bar */}
            <div className="p-4 border-t border-slate-800/60 bg-slate-950/60 flex justify-between items-center text-xs text-slate-400 font-semibold">
              <button
                type="button"
                id="toggle-mute-ad-btn"
                onClick={() => setAdMuted(!adMuted)}
                className="flex items-center gap-1.5 hover:text-white cursor-pointer"
              >
                {adMuted ? (
                  <>
                    <VolumeX className="w-4 h-4" />
                    <span>Unmute Ad</span>
                  </>
                ) : (
                  <>
                    <Volume2 className="w-4 h-4" />
                    <span>Mute Audio</span>
                  </>
                )}
              </button>

              <div className="flex items-center gap-1.5">
                {adPhase === 'loading' && <span>Connecting...</span>}
                {adPhase === 'playing' && (
                  <span className="font-mono text-indigo-400 font-bold bg-indigo-950/40 border border-indigo-900/40 px-2 py-0.5 rounded-md">
                    Reward in {adTimer}s
                  </span>
                )}
                {adPhase === 'rewarded' && (
                  <button
                    type="button"
                    id="claim-ad-reward-btn"
                    onClick={handleClaimReward}
                    className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-[11px] font-black cursor-pointer flex items-center gap-1 shadow-md shadow-emerald-950 animate-pulse"
                  >
                    <span>Claim Reward</span>
                    <Check className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

          </div>
        </div>
      )}

      <div className="space-y-6">
        {/* Custom Themes Row */}
        <div>
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            Custom Color Themes
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
            {/* Classic Theme (Always Unlocked) */}
            <div className={`p-4 rounded-xl border flex flex-col justify-between h-40 transition-all bg-white border-slate-200/80 ${
              isActiveTheme('classic') ? 'ring-2 ring-indigo-500/80 shadow-sm' : 'hover:border-slate-300'
            }`}>
              <div>
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-xs text-slate-800">Clean Classic Light</span>
                  <span className="text-[10px] font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">Free</span>
                </div>
                <p className="text-[10px] text-slate-400 font-semibold mt-1.5 leading-relaxed">
                  The clean default light theme styled with generous margins and royal indigo accents.
                </p>
              </div>

              <button
                type="button"
                id="apply-theme-classic-btn"
                onClick={() => onSelectTheme('classic')}
                className={`w-full py-2 rounded-lg text-[11px] font-bold cursor-pointer transition-all ${
                  isActiveTheme('classic')
                    ? 'bg-slate-100 text-slate-500 cursor-default'
                    : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                }`}
                disabled={isActiveTheme('classic')}
              >
                {isActiveTheme('classic') ? 'Active Theme' : 'Apply Theme'}
              </button>
            </div>

            {/* Custom Themes */}
            {themes.map((item) => {
              const unlocked = isUnlocked(item.id);
              const active = isActiveTheme(item.id);
              const loading = purchasingId === item.id;

              return (
                <div
                  key={item.id}
                  className={`p-4 rounded-xl border flex flex-col justify-between h-40 transition-all bg-linear-to-br ${item.gradient} ${
                    active ? 'ring-2 ring-indigo-500/80 shadow-md' : 'hover:scale-[1.01]'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-xs truncate mr-1">{item.name}</span>
                      {!unlocked && (
                        <span className="text-[10px] font-extrabold bg-amber-500/10 text-amber-600 border border-amber-500/20 px-2 py-0.5 rounded-full">
                          {item.cost} Pts
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] opacity-75 font-semibold mt-1.5 leading-relaxed line-clamp-3">
                      {item.description}
                    </p>
                  </div>

                  {unlocked ? (
                    <button
                      type="button"
                      id={`apply-theme-${item.id}-btn`}
                      onClick={() => onSelectTheme(item.id)}
                      className={`w-full py-2 rounded-lg text-[11px] font-bold cursor-pointer transition-all ${
                        active
                          ? 'bg-white/20 text-white cursor-default'
                          : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs'
                      }`}
                      disabled={active}
                    >
                      {active ? 'Active Theme' : 'Apply Theme'}
                    </button>
                  ) : (
                    <button
                      type="button"
                      id={`purchase-item-${item.id}-btn`}
                      onClick={() => handleBuy(item)}
                      disabled={loading || profile.points < item.cost}
                      className="w-full py-2 bg-slate-900/80 hover:bg-slate-900 text-white rounded-lg text-[11px] font-bold cursor-pointer flex items-center justify-center gap-1.5 transition-all disabled:opacity-50"
                    >
                      <Lock className="w-3 h-3" />
                      <span>{loading ? 'Unlocking...' : `Unlock for ${item.cost} 🪙`}</span>
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Custom Features Row */}
        <div>
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
            <ShoppingBag className="w-3.5 h-3.5 text-indigo-500" />
            Productivity Features & Boosters
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {features.map((item) => {
              const unlocked = isUnlocked(item.id);
              const loading = purchasingId === item.id;

              return (
                <div
                  key={item.id}
                  className={`p-4 rounded-xl border flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 transition-all bg-linear-to-br ${item.gradient}`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-sm">{item.name}</span>
                      {unlocked ? (
                        <span className="text-[9px] font-extrabold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 px-1.5 py-0.5 rounded-md flex items-center gap-0.5 uppercase tracking-wide shrink-0">
                          <CheckCircle2 className="w-2.5 h-2.5" /> Activated
                        </span>
                      ) : (
                        <span className="text-[10px] font-extrabold bg-amber-500/10 text-amber-600 border border-amber-500/20 px-2 py-0.5 rounded-full shrink-0">
                          {item.cost} Pts
                        </span>
                      )}
                    </div>
                    <p className="text-xs opacity-75 font-semibold leading-relaxed">
                      {item.description}
                    </p>
                  </div>

                  {unlocked ? (
                    <div className="bg-emerald-500/10 text-emerald-700 border border-emerald-500/20 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider shrink-0 w-full sm:w-auto text-center">
                      Unlocked ✅
                    </div>
                  ) : (
                    <button
                      type="button"
                      id={`purchase-item-${item.id}-btn`}
                      onClick={() => handleBuy(item)}
                      disabled={loading || profile.points < item.cost}
                      className="px-5 py-2.5 bg-slate-900 text-white hover:bg-slate-800 rounded-xl text-xs font-bold cursor-pointer flex items-center justify-center gap-1.5 transition-all w-full sm:w-auto shrink-0 disabled:opacity-50"
                    >
                      <Lock className="w-3.5 h-3.5" />
                      <span>{loading ? 'Unlocking...' : `Unlock (${item.cost} Pts)`}</span>
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
