export interface Task {
  id: string;
  title: string;
  description?: string;
  completed: boolean;
  priority: 'low' | 'medium' | 'high';
  category: string;
  dueDate: string; // YYYY-MM-DD
  effort: number; // 1 to 10, default 5
  createdAt: string; // ISO string
  favorite?: boolean;
  difficulty: number; // 1 to 5, default 1
}

export type NewTask = Omit<Task, 'id' | 'createdAt'>;
