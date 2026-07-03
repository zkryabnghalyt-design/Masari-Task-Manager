import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  onSnapshot, 
  query, 
  orderBy 
} from 'firebase/firestore';
import { db } from '../firebase';
import { Task, NewTask } from '../types';

const TASKS_COLLECTION = 'tasks';

/**
 * Subscribes to tasks collection in real-time, sorted by creation date descending.
 */
export function subscribeTasks(
  onUpdate: (tasks: Task[]) => void,
  onError: (error: Error) => void
) {
  const tasksRef = collection(db, TASKS_COLLECTION);
  const q = query(tasksRef, orderBy('createdAt', 'desc'));

  return onSnapshot(
    q,
    (snapshot) => {
      const tasks: Task[] = [];
      snapshot.forEach((docSnap) => {
        if (docSnap.id.startsWith('profile_')) return; // Skip profile data stored in tasks collection
        const data = docSnap.data();
        tasks.push({
          id: docSnap.id,
          title: data.title || '',
          description: data.description || '',
          completed: !!data.completed,
          priority: data.priority || 'medium',
          category: data.category || 'General',
          dueDate: data.dueDate || '',
          effort: typeof data.effort === 'number' ? data.effort : 5,
          createdAt: data.createdAt || new Date().toISOString(),
          favorite: !!data.favorite,
          difficulty: typeof data.difficulty === 'number' ? data.difficulty : 1,
        } as Task);
      });
      onUpdate(tasks);
    },
    (error) => {
      console.error('Error listening to tasks:', error);
      onError(error);
    }
  );
}

/**
 * Adds a new task to Firestore.
 */
export async function addTask(task: NewTask): Promise<string> {
  const tasksRef = collection(db, TASKS_COLLECTION);
  const docRef = await addDoc(tasksRef, {
    ...task,
    createdAt: new Date().toISOString(),
  });
  return docRef.id;
}

/**
 * Updates an existing task in Firestore.
 */
export async function updateTask(id: string, updates: Partial<Task>): Promise<void> {
  const docRef = doc(db, TASKS_COLLECTION, id);
  await updateDoc(docRef, updates);
}

/**
 * Deletes a task from Firestore.
 */
export async function deleteTask(id: string): Promise<void> {
  const docRef = doc(db, TASKS_COLLECTION, id);
  await deleteDoc(docRef);
}
