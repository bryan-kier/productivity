import { 
  categories, type Category, type InsertCategory,
  tasks, type Task, type InsertTask,
  subtasks, type Subtask, type InsertSubtask,
  notes, type Note, type InsertNote,
} from "../shared/schema.js";
import { db } from "./db.js";
import { eq, and, lt, asc, inArray } from "drizzle-orm";

export interface IStorage {
  // Categories
  getCategories(): Promise<Category[]>;
  getCategory(id: string): Promise<Category | undefined>;
  createCategory(category: InsertCategory): Promise<Category>;
  updateCategory(id: string, name: string): Promise<Category | undefined>;
  deleteCategory(id: string): Promise<void>;
  
  // Tasks
  getTasks(): Promise<(Task & { categoryName?: string; subtasks: Subtask[] })[]>;
  getTask(id: string): Promise<Task | undefined>;
  createTask(task: InsertTask): Promise<Task>;
  updateTask(id: string, updates: Partial<Pick<Task, 'title' | 'completed' | 'refreshType' | 'categoryId' | 'lastRefreshed' | 'deadline'>>): Promise<Task | undefined>;
  deleteTask(id: string): Promise<void>;
  resetDailyTasks(): Promise<void>;
  resetWeeklyTasks(): Promise<void>;
  deleteOldCompletedTasks(): Promise<void>;
  reorderTasks(taskIds: string[]): Promise<void>;
  
  // Subtasks
  getSubtasks(taskId: string): Promise<Subtask[]>;
  createSubtask(subtask: InsertSubtask): Promise<Subtask>;
  updateSubtask(id: string, updates: Partial<Pick<Subtask, 'title' | 'completed' | 'deadline'>>): Promise<Subtask | undefined>;
  deleteSubtask(id: string): Promise<void>;
  deleteOldCompletedSubtasks(): Promise<void>;
  
  // Notes
  getNotes(): Promise<(Note & { categoryName?: string })[]>;
  getNote(id: string): Promise<Note | undefined>;
  createNote(note: InsertNote): Promise<Note>;
  updateNote(id: string, updates: Partial<Pick<Note, 'title' | 'content' | 'categoryId'>>): Promise<Note | undefined>;
  deleteNote(id: string): Promise<void>;
  reorderNotes(noteIds: string[]): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  // Categories
  async getCategories(): Promise<Category[]> {
    return db.select().from(categories);
  }

  async getCategory(id: string): Promise<Category | undefined> {
    const [category] = await db.select().from(categories).where(eq(categories.id, id));
    return category || undefined;
  }

  async createCategory(insertCategory: InsertCategory): Promise<Category> {
    const [category] = await db.insert(categories).values(insertCategory).returning();
    return category;
  }

  async updateCategory(id: string, name: string): Promise<Category | undefined> {
    const [category] = await db.update(categories).set({ name }).where(eq(categories.id, id)).returning();
    return category || undefined;
  }

  async deleteCategory(id: string): Promise<void> {
    await db.delete(categories).where(eq(categories.id, id));
  }

  // Tasks
  async getTasks(): Promise<(Task & { categoryName?: string; subtasks: Subtask[] })[]> {
    const allTasks = await db.select().from(tasks).orderBy(asc(tasks.order), asc(tasks.id));
    // Sort to put daily tasks first, then by order
    allTasks.sort((a, b) => {
      const aIsDaily = a.refreshType === "daily";
      const bIsDaily = b.refreshType === "daily";
      if (aIsDaily && !bIsDaily) return -1;
      if (!aIsDaily && bIsDaily) return 1;
      return (a.order ?? 0) - (b.order ?? 0);
    });
    const allSubtasks = await db.select().from(subtasks);
    const allCategories = await db.select().from(categories);
    
    return allTasks.map(task => ({
      ...task,
      categoryName: allCategories.find(c => c.id === task.categoryId)?.name,
      subtasks: allSubtasks.filter(st => st.taskId === task.id),
    }));
  }

  async getTask(id: string): Promise<Task | undefined> {
    const [task] = await db.select().from(tasks).where(eq(tasks.id, id));
    return task || undefined;
  }

  async createTask(insertTask: InsertTask): Promise<Task> {
    const allTasks = await db.select().from(tasks);
    const maxOrder = allTasks.length > 0 
      ? Math.max(...allTasks.map(t => t.order ?? 0))
      : -1;
    const [task] = await db.insert(tasks).values({ ...insertTask, order: maxOrder + 1 }).returning();
    return task;
  }

  async updateTask(id: string, updates: Partial<Pick<Task, 'title' | 'completed' | 'refreshType' | 'categoryId' | 'lastRefreshed' | 'deadline'>>): Promise<Task | undefined> {
    // If marking as completed, set completedAt timestamp
    if (updates.completed === true) {
      const [existingTask] = await db.select().from(tasks).where(eq(tasks.id, id));
      if (existingTask && !existingTask.completed) {
        updates = { ...updates, completedAt: new Date() } as any;
      }
    }
    // If marking as incomplete, clear completedAt timestamp
    if (updates.completed === false) {
      updates = { ...updates, completedAt: null } as any;
    }
    const [task] = await db.update(tasks).set(updates).where(eq(tasks.id, id)).returning();
    return task || undefined;
  }

  async deleteTask(id: string): Promise<void> {
    await db.delete(tasks).where(eq(tasks.id, id));
  }

  async resetDailyTasks(): Promise<void> {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 7, 0, 0);
    
    // Get all daily task IDs
    const dailyTasks = await db.select({ id: tasks.id }).from(tasks).where(eq(tasks.refreshType, "daily"));
    const dailyTaskIds = dailyTasks.map(t => t.id);
    
    if (dailyTaskIds.length > 0) {
      // Reset all daily tasks (regardless of completion status)
      await db.update(tasks)
        .set({ completed: false, completedAt: null, lastRefreshed: new Date() })
        .where(eq(tasks.refreshType, "daily"));
      
      // Reset all subtasks for these daily tasks
      await db.update(subtasks)
        .set({ completed: false, completedAt: null })
        .where(inArray(subtasks.taskId, dailyTaskIds));
    }
  }

  async resetWeeklyTasks(): Promise<void> {
    // Get all weekly task IDs
    const weeklyTasks = await db.select({ id: tasks.id }).from(tasks).where(eq(tasks.refreshType, "weekly"));
    const weeklyTaskIds = weeklyTasks.map(t => t.id);
    
    if (weeklyTaskIds.length > 0) {
      // Reset all weekly tasks (regardless of completion status)
      await db.update(tasks)
        .set({ completed: false, completedAt: null, lastRefreshed: new Date() })
        .where(eq(tasks.refreshType, "weekly"));
      
      // Reset all subtasks for these weekly tasks
      await db.update(subtasks)
        .set({ completed: false, completedAt: null })
        .where(inArray(subtasks.taskId, weeklyTaskIds));
    }
  }

  async deleteOldCompletedTasks(): Promise<void> {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    
    await db.delete(tasks)
      .where(
        and(
          eq(tasks.completed, true),
          lt(tasks.completedAt, oneWeekAgo)
        )
      );
  }

  async deleteOldCompletedSubtasks(): Promise<void> {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    
    // Delete all subtasks that are completed and older than a week
    await db.delete(subtasks)
      .where(
        and(
          eq(subtasks.completed, true),
          lt(subtasks.completedAt, oneWeekAgo)
        )
      );
  }

  async reorderTasks(taskIds: string[]): Promise<void> {
    for (let i = 0; i < taskIds.length; i++) {
      await db.update(tasks).set({ order: i }).where(eq(tasks.id, taskIds[i]));
    }
  }

  // Subtasks
  async getSubtasks(taskId: string): Promise<Subtask[]> {
    return db.select().from(subtasks).where(eq(subtasks.taskId, taskId));
  }

  async createSubtask(insertSubtask: InsertSubtask): Promise<Subtask> {
    const [subtask] = await db.insert(subtasks).values(insertSubtask).returning();
    return subtask;
  }

  async updateSubtask(id: string, updates: Partial<Pick<Subtask, 'title' | 'completed' | 'deadline'>>): Promise<Subtask | undefined> {
    // If marking as completed, set completedAt timestamp
    if (updates.completed === true) {
      const [existingSubtask] = await db.select().from(subtasks).where(eq(subtasks.id, id));
      if (existingSubtask && !existingSubtask.completed) {
        updates = { ...updates, completedAt: new Date() } as any;
      }
    }
    // If marking as incomplete, clear completedAt timestamp
    if (updates.completed === false) {
      updates = { ...updates, completedAt: null } as any;
    }
    const [subtask] = await db.update(subtasks).set(updates).where(eq(subtasks.id, id)).returning();
    return subtask || undefined;
  }

  async deleteSubtask(id: string): Promise<void> {
    await db.delete(subtasks).where(eq(subtasks.id, id));
  }

  // Notes
  async getNotes(): Promise<(Note & { categoryName?: string })[]> {
    const allNotes = await db.select().from(notes).orderBy(asc(notes.order), asc(notes.id));
    const allCategories = await db.select().from(categories);
    
    return allNotes.map(note => ({
      ...note,
      categoryName: allCategories.find(c => c.id === note.categoryId)?.name,
    }));
  }

  async getNote(id: string): Promise<Note | undefined> {
    const [note] = await db.select().from(notes).where(eq(notes.id, id));
    return note || undefined;
  }

  async createNote(insertNote: InsertNote): Promise<Note> {
    const allNotes = await db.select().from(notes);
    const maxOrder = allNotes.length > 0 
      ? Math.max(...allNotes.map(n => n.order ?? 0))
      : -1;
    const [note] = await db.insert(notes).values({ ...insertNote, order: maxOrder + 1 }).returning();
    return note;
  }

  async updateNote(id: string, updates: Partial<Pick<Note, 'title' | 'content' | 'categoryId'>>): Promise<Note | undefined> {
    const [note] = await db.update(notes).set(updates).where(eq(notes.id, id)).returning();
    return note || undefined;
  }

  async deleteNote(id: string): Promise<void> {
    await db.delete(notes).where(eq(notes.id, id));
  }

  async reorderNotes(noteIds: string[]): Promise<void> {
    for (let i = 0; i < noteIds.length; i++) {
      await db.update(notes).set({ order: i }).where(eq(notes.id, noteIds[i]));
    }
  }
}

export const storage = new DatabaseStorage();
