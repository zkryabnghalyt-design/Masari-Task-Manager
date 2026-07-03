import { 
  doc, 
  onSnapshot, 
  setDoc, 
  updateDoc, 
  getDoc 
} from 'firebase/firestore';
import { db } from '../firebase';
import { Task } from '../types';

export interface UserProfile {
  id: string;
  points: number;
  totalXp: number;
  unlockedItems: string[];
  activeTheme: string;
  streak: number;
  hasGoldenBadge: boolean;
}

const PROFILE_COLLECTION = 'tasks'; // Using the 'tasks' collection because its read/write rules are globally active
const getProfileDocId = (userId: string) => `profile_${userId}`;

let memoryDeviceId: string | null = null;

// Helper to get or create a persistent device ID for the user
export function getOrCreateDeviceId(): string {
  try {
    let deviceId = localStorage.getItem('task_manager_device_id');
    if (!deviceId) {
      deviceId = 'usr_' + Math.random().toString(36).substring(2, 11);
      localStorage.setItem('task_manager_device_id', deviceId);
    }
    return deviceId;
  } catch (err) {
    console.warn('localStorage is blocked in this environment, falling back to memory-based ID', err);
    if (!memoryDeviceId) {
      memoryDeviceId = 'usr_mem_' + Math.random().toString(36).substring(2, 11);
    }
    return memoryDeviceId;
  }
}

const DEFAULT_PROFILE = (id: string): UserProfile => ({
  id,
  points: 0,
  totalXp: 0,
  unlockedItems: ['classic'], // Classic theme is unlocked by default
  activeTheme: 'classic',
  streak: 0,
  hasGoldenBadge: false
});

/**
 * Subscribes to the user's gamification profile in Firestore.
 * If no profile exists, it creates one.
 */
export function subscribeUserProfile(
  userId: string,
  onUpdate: (profile: UserProfile) => void,
  onError: (error: Error) => void
) {
  const docRef = doc(db, PROFILE_COLLECTION, getProfileDocId(userId));

  return onSnapshot(
    docRef,
    async (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        onUpdate({
          id: userId,
          points: typeof data.points === 'number' ? data.points : 0,
          totalXp: typeof data.totalXp === 'number' ? data.totalXp : 0,
          unlockedItems: Array.isArray(data.unlockedItems) ? data.unlockedItems : ['classic'],
          activeTheme: typeof data.activeTheme === 'string' ? data.activeTheme : 'classic',
          streak: typeof data.streak === 'number' ? data.streak : 0,
          hasGoldenBadge: typeof data.hasGoldenBadge === 'boolean' ? data.hasGoldenBadge : false,
        });
      } else {
        // Create initial default profile in database
        const initial = DEFAULT_PROFILE(userId);
        try {
          await setDoc(docRef, initial);
          onUpdate(initial);
        } catch (err) {
          console.error('Error creating user profile:', err);
          onError(err as Error);
        }
      }
    },
    (error) => {
      console.error('Error listening to user profile:', error);
      onError(error);
    }
  );
}

/**
 * Updates user profile fields in Firestore.
 */
export async function updateUserProfile(userId: string, updates: Partial<UserProfile>): Promise<void> {
  const docRef = doc(db, PROFILE_COLLECTION, getProfileDocId(userId));
  await updateDoc(docRef, updates);
}

/**
 * Adjusts user points and XP when completing/uncompleting tasks.
 */
export async function adjustPoints(userId: string, pointsChange: number, xpChange: number): Promise<void> {
  const docRef = doc(db, PROFILE_COLLECTION, getProfileDocId(userId));
  const snap = await getDoc(docRef);
  
  if (snap.exists()) {
    const data = snap.data();
    const currentPoints = typeof data.points === 'number' ? data.points : 0;
    const currentXp = typeof data.totalXp === 'number' ? data.totalXp : 0;
    
    await updateDoc(docRef, {
      points: Math.max(0, currentPoints + pointsChange),
      totalXp: Math.max(0, currentXp + xpChange)
    });
  } else {
    const initial = DEFAULT_PROFILE(userId);
    initial.points = Math.max(0, initial.points + pointsChange);
    initial.totalXp = Math.max(0, initial.totalXp + xpChange);
    await setDoc(docRef, initial);
  }
}

/**
 * Helper to get current date in YYYY-MM-DD local format
 */
export function getLocalDateString(date: Date = new Date()): string {
  const offset = date.getTimezoneOffset();
  const localDate = new Date(date.getTime() - (offset * 60 * 1000));
  return localDate.toISOString().split('T')[0];
}

export interface StreakInfo {
  currentStreak: number;
  completedDays: string[];
  missedDays: string[];
  isTodayCompleted: boolean;
  hasGoldenBadge: boolean;
}

/**
 * Dynamically computes streak info from real tasks
 */
export function calculateStreak(tasks: Task[]): StreakInfo {
  const todayStr = getLocalDateString();
  
  // Group tasks by dueDate
  const tasksByDate: Record<string, Task[]> = {};
  tasks.forEach(task => {
    if (task.dueDate) {
      if (!tasksByDate[task.dueDate]) {
        tasksByDate[task.dueDate] = [];
      }
      tasksByDate[task.dueDate].push(task);
    }
  });

  const completedDaysSet = new Set<string>();
  const missedDaysSet = new Set<string>();

  Object.entries(tasksByDate).forEach(([dateStr, dayTasks]) => {
    const allCompleted = dayTasks.every(t => t.completed);
    if (allCompleted) {
      completedDaysSet.add(dateStr);
    } else {
      if (dateStr < todayStr) {
        missedDaysSet.add(dateStr);
      }
    }
  });

  // Calculate streak looking backwards day-by-day
  let currentStreak = 0;
  let checkDate = new Date();
  let daysChecked = 0;
  const maxDaysToCheck = 365;

  while (daysChecked < maxDaysToCheck) {
    const dateStr = getLocalDateString(checkDate);
    const dayTasks = tasksByDate[dateStr] || [];
    const hasTasks = dayTasks.length > 0;

    if (hasTasks) {
      const allDone = dayTasks.every(t => t.completed);
      if (allDone) {
        currentStreak++;
      } else {
        if (dateStr === todayStr) {
          // Today has incomplete tasks, but it's not over yet. Keep going back to see previous consecutive streak!
        } else {
          // Past incomplete day breaks the streak
          break;
        }
      }
    } else {
      // Free day (no tasks scheduled). Let's continue checking previous days to preserve streak!
      // However, don't increment currentStreak because no tasks were completed on this day.
    }

    checkDate.setDate(checkDate.getDate() - 1);
    daysChecked++;
  }

  return {
    currentStreak,
    completedDays: Array.from(completedDaysSet).sort(),
    missedDays: Array.from(missedDaysSet).sort(),
    isTodayCompleted: (tasksByDate[todayStr] || []).length > 0 && (tasksByDate[todayStr] || []).every(t => t.completed),
    hasGoldenBadge: currentStreak >= 30,
  };
}
