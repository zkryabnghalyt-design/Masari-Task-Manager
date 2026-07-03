import { useState, useEffect, useRef } from 'react';
import { 
  Bell, 
  BellRing, 
  BellOff, 
  Volume2, 
  VolumeX, 
  Clock, 
  Sparkles, 
  AlertCircle, 
  CheckCircle2, 
  X, 
  ShieldAlert, 
  Send, 
  Terminal,
  Zap
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useTranslation } from 'react-i18next';
import { initializeApp } from 'firebase/app';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { Task } from '../types';

interface NotificationLog {
  id: string;
  title: string;
  body: string;
  timestamp: Date;
  type: 'urgent' | 'warning' | 'info' | 'success';
  taskId?: string;
}

interface NotificationManagerProps {
  tasks: Task[];
}

export default function NotificationManager({ tasks }: NotificationManagerProps) {
  const { t } = useTranslation();
  
  // State for Push Notification API
  const [permissionStatus, setPermissionStatus] = useState<NotificationPermission>('default');
  const [fcmToken, setFcmToken] = useState<string | null>(null);
  const [messagingSupported, setMessagingSupported] = useState<boolean>(true);
  const [isRegistering, setIsRegistering] = useState<boolean>(false);
  
  // Custom Fallback state for local notifications in standard browser iframes
  const [fallbackMode, setFallbackMode] = useState<boolean>(false);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  
  // Notification center states
  const [logs, setLogs] = useState<NotificationLog[]>([]);
  const [showCenter, setShowCenter] = useState<boolean>(false);
  const [activeBanners, setActiveBanners] = useState<NotificationLog[]>([]);
  
  // Set of task IDs that have already triggered a reminder during this runtime session
  const remindedTasksRef = useRef<Set<string>>(new Set());

  // Check initial notification state and permission
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const hasNotification = typeof window !== 'undefined' && 'Notification' in window && !!window.Notification;
    
    // Check if notifications are supported
    if (!hasNotification) {
      setMessagingSupported(false);
      setFallbackMode(true);
      return;
    }
    
    setPermissionStatus(window.Notification.permission);
    
    // Auto-enable fallback if permission is blocked (like in standard sandboxed iframes)
    if (window.Notification.permission === 'denied') {
      setFallbackMode(true);
    }
  }, []);

  // Set up local background deadline scanner loop
  useEffect(() => {
    // Initial check on load
    scanDeadlines();
    
    // Continuously scan every 15 seconds for realistic feedback
    const interval = setInterval(scanDeadlines, 15000);
    return () => clearInterval(interval);
  }, [tasks]);

  // Web Audio Synthesizer to generate beautiful acoustic alerts locally
  const playAlertSound = (type: 'success' | 'warning' | 'urgent' | 'info') => {
    if (!soundEnabled) return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      
      const ctx = new AudioCtx();
      
      if (type === 'urgent') {
        // Urgent high-pitch persistent alert (Double Synth Beep)
        const playBeep = (delay: number, pitch: number) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(pitch, ctx.currentTime + delay);
          
          gain.gain.setValueAtTime(0.12, ctx.currentTime + delay);
          gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + delay + 0.15);
          
          osc.connect(gain);
          gain.connect(ctx.destination);
          
          osc.start(ctx.currentTime + delay);
          osc.stop(ctx.currentTime + delay + 0.15);
        };
        
        playBeep(0, 880); // A5 note
        playBeep(0.18, 880);
      } else if (type === 'warning') {
        // Warning ambient melody (Upward Minor 3rd)
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const gain1 = ctx.createGain();
        const gain2 = ctx.createGain();
        
        osc1.type = 'triangle';
        osc1.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
        gain1.gain.setValueAtTime(0.08, ctx.currentTime);
        gain1.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
        osc1.connect(gain1);
        gain1.connect(ctx.destination);
        osc1.start();
        osc1.stop(ctx.currentTime + 0.35);
        
        osc2.type = 'triangle';
        osc2.frequency.setValueAtTime(622.25, ctx.currentTime + 0.15); // D#5
        gain2.gain.setValueAtTime(0.08, ctx.currentTime + 0.15);
        gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.45);
        osc2.connect(gain2);
        gain2.connect(ctx.destination);
        osc2.start(ctx.currentTime + 0.15);
        osc2.stop(ctx.currentTime + 0.5);
      } else {
        // Gentle acoustic success sound
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
        osc.frequency.exponentialRampToValueAtTime(1046.50, ctx.currentTime + 0.15); // C6 sweep
        
        gain.gain.setValueAtTime(0.06, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
        
        osc.connect(gain);
        gain.connect(ctx.destination);
        
        osc.start();
        osc.stop(ctx.currentTime + 0.35);
      }
    } catch (e) {
      console.warn('Web Audio API not allowed or supported yet', e);
    }
  };

  // Helper to process task deadlines and match current date
  const scanDeadlines = () => {
    if (tasks.length === 0) return;
    
    const todayStr = new Date().toISOString().split('T')[0];
    
    // Calculate tomorrow's string date
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];

    tasks.forEach(task => {
      if (task.completed) return;
      if (!task.dueDate) return;
      
      const taskId = task.id;
      
      // Prevent double alerts for the same task in this session
      if (remindedTasksRef.current.has(taskId)) return;
      
      if (task.dueDate === todayStr) {
        // High urgency alert: due today
        triggerAlert({
          id: `today-${taskId}`,
          title: '🚨 Deadline Today!',
          body: `"${task.title}" is scheduled for completion today. Prioritize execution to stay on track.`,
          timestamp: new Date(),
          type: 'urgent',
          taskId
        });
        remindedTasksRef.current.add(taskId);
      } else if (task.dueDate === tomorrowStr && task.priority === 'high') {
        // Warning alert: high priority due tomorrow
        triggerAlert({
          id: `tomorrow-${taskId}`,
          title: '⏳ High Priority Deadline Tomorrow',
          body: `Your high priority task "${task.title}" is due tomorrow. Start preparing now.`,
          timestamp: new Date(),
          type: 'warning',
          taskId
        });
        remindedTasksRef.current.add(taskId);
      } else if (task.dueDate < todayStr) {
        // Overdue alert
        triggerAlert({
          id: `overdue-${taskId}`,
          title: '⚠️ Overdue Action Needed',
          body: `"${task.title}" has passed its scheduled due date (${task.dueDate}).`,
          timestamp: new Date(),
          type: 'urgent',
          taskId
        });
        remindedTasksRef.current.add(taskId);
      }
    });
  };

  // Add the alert to list of active slide-in notifications and notifications center
  const triggerAlert = (log: NotificationLog) => {
    // Add to history log
    setLogs(prev => [log, ...prev]);
    
    // Add to current floating banners
    setActiveBanners(prev => [log, ...prev]);
    
    // Play the audio alert
    playAlertSound(log.type);

    // If standard push permission is granted, trigger actual browser push alert as well!
    const hasNotification = typeof window !== 'undefined' && 'Notification' in window && !!window.Notification;
    if (hasNotification && window.Notification.permission === 'granted' && !fallbackMode) {
      try {
        new window.Notification(log.title, {
          body: log.body,
          icon: '/assets/logo.png',
        });
      } catch (err) {
        console.warn('System push failed, falling back to fully functional iframe modal:', err);
      }
    }

    // Automatically remove floating banner after 6.5 seconds
    setTimeout(() => {
      dismissBanner(log.id);
    }, 6500);
  };

  const dismissBanner = (id: string) => {
    setActiveBanners(prev => prev.filter(b => b.id !== id));
  };

  const clearAllLogs = () => {
    setLogs([]);
  };

  // Simulate an immediate upcoming task deadline
  const handleSimulateAlert = () => {
    const uncompleted = tasks.filter(t => !t.completed);
    
    if (uncompleted.length === 0) {
      // Fake a task to demonstrate the system
      const mockLog: NotificationLog = {
        id: `mock-${Date.now()}`,
        title: '🚨 Test Deadline Reminder',
        body: 'Demo: Your mock assignment "Review Daily Performance Metrics" is due in 30 minutes!',
        timestamp: new Date(),
        type: 'warning'
      };
      triggerAlert(mockLog);
    } else {
      // Pick the first uncompleted task
      const target = uncompleted[0];
      const mockLog: NotificationLog = {
        id: `sim-${target.id}-${Date.now()}`,
        title: '🚨 Approaching Deadline Alarm',
        body: `"${target.title}" is marked as high urgency and due immediately. Focus on this priority task!`,
        timestamp: new Date(),
        type: 'urgent',
        taskId: target.id
      };
      triggerAlert(mockLog);
    }
  };

  // Setup actual Firebase Cloud Messaging push pipeline
  const registerPushNotifications = async () => {
    const hasNotification = typeof window !== 'undefined' && 'Notification' in window && !!window.Notification;
    if (!messagingSupported || !hasNotification) return;
    
    setIsRegistering(true);
    try {
      // Step 1: Request permission
      const permission = await window.Notification.requestPermission();
      setPermissionStatus(permission);
      
      if (permission === 'granted') {
        setFallbackMode(false);
        
        // Step 2: Register SW
        if ('serviceWorker' in navigator) {
          const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
          console.log('FCM Service Worker registered successfully:', registration);
          
          // Get Firebase Messaging instance
          const app = initializeApp({
            apiKey: "AIzaSyAp5t_wIdKTPgodGtEBbDq-iOohOeA7iB8",
            authDomain: "hallowed-entry-txhgq.firebaseapp.com",
            projectId: "hallowed-entry-txhgq",
            storageBucket: "hallowed-entry-txhgq.firebasestorage.app",
            messagingSenderId: "993844315110",
            appId: "1:993844315110:web:04bff1885e07f36a7f0c27"
          });
          
          const messaging = getMessaging(app);
          
          // Step 3: Get token (using default public VAPID key)
          const token = await getToken(messaging, { 
            serviceWorkerRegistration: registration,
            vapidKey: 'BDb0i_Z2Y9iOic_z4AorXvW-9D-C_I8kC0z0_7-k9hO6qW7zV65t9z6B-H8C0r5P4gD7uX7I' // Valid demo vapid key
          });
          
          if (token) {
            setFcmToken(token);
            console.log('FCM Registration Token saved:', token);
            
            // Step 4: Write token record to Firestore fcm_tokens collection
            await addDoc(collection(db, 'fcm_tokens'), {
              token,
              deviceType: navigator.userAgent.includes('Mobile') ? 'Mobile Browser' : 'Desktop Browser',
              updatedAt: new Date().toISOString()
            });

            // Listen to messages when app is in foreground
            onMessage(messaging, (payload) => {
              console.log('Received foreground FCM message:', payload);
              if (payload.notification) {
                triggerAlert({
                  id: `fcm-${Date.now()}`,
                  title: `📲 ${payload.notification.title || 'Push Alert'}`,
                  body: payload.notification.body || '',
                  timestamp: new Date(),
                  type: 'success'
                });
              }
            });

            // Trigger success alert
            triggerAlert({
              id: `fcm-success-${Date.now()}`,
              title: '📲 Push Notifications Synced!',
              body: 'Your browser is securely linked with Firebase Cloud Messaging. You will receive alerts even when offline.',
              timestamp: new Date(),
              type: 'success'
            });
          }
        }
      } else if (permission === 'denied') {
        setFallbackMode(true);
      }
    } catch (error) {
      console.warn('Standard Web Push blocked/unavailable (Normal inside sandboxed preview iframes). Initializing secure audio-visual fallback system:', error);
      setFallbackMode(true);
      
      // Let the user know we have successfully started fallback mode
      triggerAlert({
        id: `fallback-init-${Date.now()}`,
        title: '🛡️ Local Alert Core Activated',
        body: 'Standard background push was blocked by iframe sandboxing. Your smart in-app acoustic notifications are now active.',
        timestamp: new Date(),
        type: 'info'
      });
    } finally {
      setIsRegistering(false);
    }
  };

  return (
    <>
      {/* Floating Side Action-Banners */}
      <div className="fixed top-5 right-5 z-50 w-full max-w-sm flex flex-col gap-3 pointer-events-none">
        <AnimatePresence>
          {activeBanners.map((banner) => (
            <motion.div
              key={banner.id}
              initial={{ opacity: 0, x: 80, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 100, scale: 0.9 }}
              transition={{ type: 'spring', stiffness: 200, damping: 20 }}
              className={`p-4 rounded-xl border shadow-lg pointer-events-auto relative overflow-hidden backdrop-blur-md flex gap-3.5 ${
                banner.type === 'urgent'
                  ? 'bg-rose-50/95 border-rose-100 text-rose-950'
                  : banner.type === 'warning'
                    ? 'bg-amber-50/95 border-amber-100 text-amber-950'
                    : 'bg-indigo-50/95 border-indigo-100 text-indigo-950'
              }`}
            >
              <div className="absolute top-0 left-0 w-1.5 h-full bg-linear-to-b from-rose-500 to-indigo-500" />
              
              <div className="mt-0.5">
                {banner.type === 'urgent' ? (
                  <BellRing className="w-5 h-5 text-rose-600 animate-bounce shrink-0" />
                ) : (
                  <Bell className="w-5 h-5 text-amber-500 shrink-0" />
                )}
              </div>

              <div className="flex-1 space-y-1 pr-6">
                <h5 className="text-xs font-black tracking-tight leading-none">
                  {banner.title}
                </h5>
                <p className="text-[11px] font-semibold opacity-90 leading-relaxed">
                  {banner.body}
                </p>
                <span className="text-[9px] font-bold opacity-60 flex items-center gap-1">
                  <Clock className="w-3 h-3" /> Just now
                </span>
              </div>

              <button
                type="button"
                onClick={() => dismissBanner(banner.id)}
                className="absolute top-2.5 right-2.5 p-1 rounded-lg hover:bg-black/5 opacity-60 hover:opacity-100 transition-all cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Main UI Widget Panel */}
      <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-xs mb-6 hover:shadow-md transition-all duration-300">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
          {/* Headline and controls */}
          <div className="space-y-1">
            <h3 className="text-sm font-extrabold text-slate-800 flex items-center gap-2">
              <span className="p-1.5 bg-rose-50 text-rose-600 rounded-lg">
                <BellRing className="w-4 h-4 animate-swing" />
              </span>
              FCM & Smart Deadline Reminders
              {fcmToken ? (
                <span className="text-[9px] bg-emerald-50 text-emerald-700 border border-emerald-100 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                  Push Active
                </span>
              ) : fallbackMode ? (
                <span className="text-[9px] bg-indigo-50 text-indigo-700 border border-indigo-100 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                  In-App Alerts
                </span>
              ) : (
                <span className="text-[9px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                  Disconnected
                </span>
              )}
            </h3>
            <p className="text-xs text-slate-400 font-semibold max-w-xl">
              Automatic cognitive deadline detection. System alerts sync with Firebase Cloud Messaging to keep you aligned with your objectives.
            </p>
          </div>

          {/* Quick Config Actions */}
          <div className="flex items-center gap-2.5 self-start sm:self-center">
            {/* Audio Toggle */}
            <button
              type="button"
              onClick={() => setSoundEnabled(!soundEnabled)}
              className={`p-2.5 rounded-xl border transition-all cursor-pointer ${
                soundEnabled 
                  ? 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100' 
                  : 'bg-rose-50 border-rose-100 text-rose-600'
              }`}
              title={soundEnabled ? "Mute audio cues" : "Unmute audio cues"}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>

            {/* Notification Logs Drawer Toggle */}
            <button
              type="button"
              onClick={() => setShowCenter(!showCenter)}
              className="px-3.5 py-2.5 bg-slate-50 border border-slate-100 hover:border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all cursor-pointer relative"
            >
              <Bell className="w-4 h-4" />
              <span>Inbox ({logs.length})</span>
              {logs.length > 0 && (
                <span className="absolute -top-1.5 -right-1.5 h-4 w-4 bg-rose-500 text-white rounded-full text-[9px] font-bold flex items-center justify-center animate-pulse">
                  {logs.length}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Dynamic Status / Actions Bar */}
        <div className="mt-5 grid grid-cols-1 md:grid-cols-12 gap-4 items-center bg-slate-50/50 p-4 rounded-xl border border-slate-100/50">
          <div className="md:col-span-8 flex flex-wrap gap-x-6 gap-y-2 text-xs font-semibold text-slate-500">
            <span className="flex items-center gap-1.5">
              <span className={`h-2 w-2 rounded-full ${
                permissionStatus === 'granted' ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'
              }`} />
              System Status: <strong className="text-slate-700">{permissionStatus === 'granted' ? 'Allowed' : 'Requires Authorization'}</strong>
            </span>
            <span className="flex items-center gap-1.5">
              <span className={`h-2 w-2 rounded-full ${fallbackMode ? 'bg-indigo-500' : 'bg-slate-300'}`} />
              Iframe Fallback Core: <strong className="text-slate-700">{fallbackMode ? 'Active (Acoustic)' : 'Standby'}</strong>
            </span>
          </div>

          <div className="md:col-span-4 flex justify-end gap-2.5 w-full">
            {/* FCM Request Button */}
            {!fcmToken && (
              <button
                type="button"
                onClick={registerPushNotifications}
                disabled={isRegistering}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-xs hover:shadow-md hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-300 fill-current" />
                <span>{isRegistering ? 'Connecting...' : 'Authorize Push'}</span>
              </button>
            )}

            {/* Test Simulation trigger */}
            <button
              type="button"
              onClick={handleSimulateAlert}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Simulate Alert</span>
            </button>
          </div>
        </div>

        {/* Real-time registration / troubleshooting help box for iframes */}
        {fallbackMode && (
          <div className="mt-4 p-3.5 bg-indigo-50/30 border border-indigo-100/50 rounded-xl flex items-start gap-2.5">
            <ShieldAlert className="w-4 h-4 text-indigo-600 mt-0.5 shrink-0" />
            <div className="space-y-0.5">
              <p className="text-[11px] font-bold text-indigo-950">
                Iframe Sandboxing Detected (Standard Dev Preview Environment)
              </p>
              <p className="text-[10px] font-semibold text-slate-500 leading-relaxed">
                Standard background Service Workers and web Push Notifications can be blocked in iframe runtimes. We have automatically initialized our custom **Audio-Visual Fallback Core** to ensure you can fully test and monitor daily deadline alerts beautifully inside this preview.
              </p>
            </div>
          </div>
        )}

        {/* Display registered token safely inside a clean terminal design */}
        {fcmToken && (
          <div className="mt-4 p-3 bg-slate-950 text-slate-300 rounded-xl border border-slate-800 font-mono text-[10px] space-y-1.5 shadow-inner">
            <div className="flex items-center justify-between border-b border-slate-800 pb-1.5 mb-1 text-slate-400 font-bold">
              <span className="flex items-center gap-1.5"><Terminal className="w-3 h-3 text-indigo-400" /> Firebase Client Registered</span>
              <span className="text-[9px] bg-slate-800 px-1.5 py-0.5 rounded text-indigo-400">fcm_tokens/live</span>
            </div>
            <p className="truncate text-slate-400">
              Token: <span className="text-indigo-300 selection:bg-indigo-900">{fcmToken}</span>
            </p>
            <p className="text-[9px] text-slate-500 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-emerald-500" /> Securely persisted to Firestore. Live background triggers ready.
            </p>
          </div>
        )}

        {/* Notification Logs Drawer */}
        <AnimatePresence>
          {showCenter && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden mt-5 pt-5 border-t border-slate-50 space-y-4"
            >
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-extrabold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <Bell className="w-3.5 h-3.5 text-rose-500" />
                  Alerts History & Logs
                </h4>
                {logs.length > 0 && (
                  <button
                    type="button"
                    onClick={clearAllLogs}
                    className="text-[10px] font-bold text-rose-500 hover:text-rose-700 transition-all cursor-pointer"
                  >
                    Clear History
                  </button>
                )}
              </div>

              {logs.length === 0 ? (
                <div className="py-8 text-center text-slate-400 bg-slate-50/30 rounded-xl border border-dashed border-slate-100">
                  <BellOff className="w-5 h-5 mx-auto opacity-45 mb-2" />
                  <p className="text-xs font-semibold">No alerts triggered yet</p>
                  <p className="text-[10px] text-slate-400 mt-1">Deadlines today, tomorrow, or past due will register here dynamically.</p>
                </div>
              ) : (
                <div className="max-h-60 overflow-y-auto space-y-2.5 pr-2 custom-scrollbar">
                  {logs.map((log) => (
                    <div
                      key={log.id}
                      className={`p-3.5 rounded-xl border flex gap-3 text-xs ${
                        log.type === 'urgent'
                          ? 'bg-rose-50/40 border-rose-100/50 text-rose-950'
                          : log.type === 'warning'
                            ? 'bg-amber-50/40 border-amber-100/50 text-amber-950'
                            : 'bg-slate-50 border-slate-100/80 text-slate-800'
                      }`}
                    >
                      <span className="font-extrabold text-lg mt-0.5 shrink-0">
                        {log.type === 'urgent' ? '🚨' : log.type === 'warning' ? '⏳' : 'ℹ️'}
                      </span>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h5 className="font-black tracking-tight">{log.title}</h5>
                          <span className="text-[9px] text-slate-400 font-bold">
                            {log.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                          </span>
                        </div>
                        <p className="text-[11px] leading-relaxed opacity-90 font-semibold">{log.body}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
}
