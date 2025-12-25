import { 
  categories, type Category, type InsertCategory,
  tasks, type Task, type InsertTask,
  subtasks, type Subtask, type InsertSubtask,
  notes, type Note, type InsertNote,
  announcements, type Announcement, type InsertAnnouncement,
} from "../shared/schema.js";
import { db } from "./db.js";
import { eq, and, lt, asc, inArray, desc } from "drizzle-orm";

export interface IStorage {
  // Categories
  getCategories(userId: string): Promise<Category[]>;
  getCategory(id: string, userId: string): Promise<Category | undefined>;
  createCategory(category: InsertCategory): Promise<Category>;
  updateCategory(id: string, name: string, userId: string): Promise<Category | undefined>;
  deleteCategory(id: string, userId: string): Promise<void>;
  
  // Tasks
  getTasks(userId: string): Promise<(Task & { categoryName?: string; subtasks: Subtask[] })[]>;
  getTask(id: string, userId: string): Promise<Task | undefined>;
  createTask(task: InsertTask): Promise<Task>;
  updateTask(id: string, updates: Partial<Pick<Task, 'title' | 'completed' | 'refreshType' | 'categoryId' | 'lastRefreshed' | 'deadline'>>, userId: string): Promise<Task | undefined>;
  deleteTask(id: string, userId: string): Promise<void>;
  resetDailyTasks(userId: string): Promise<void>;
  resetWeeklyTasks(userId: string): Promise<void>;
  deleteOldCompletedTasks(userId: string): Promise<void>;
  reorderTasks(taskIds: string[], userId: string): Promise<void>;
  
  // Subtasks
  getSubtasks(taskId: string, userId: string): Promise<Subtask[]>;
  createSubtask(subtask: InsertSubtask, userId: string): Promise<Subtask>;
  updateSubtask(id: string, updates: Partial<Pick<Subtask, 'title' | 'completed' | 'deadline'>>, userId: string): Promise<Subtask | undefined>;
  deleteSubtask(id: string, userId: string): Promise<void>;
  deleteOldCompletedSubtasks(userId: string): Promise<void>;
  
  // Notes
  getNotes(userId: string): Promise<(Note & { categoryName?: string })[]>;
  getNote(id: string, userId: string): Promise<Note | undefined>;
  createNote(note: InsertNote): Promise<Note>;
  updateNote(id: string, updates: Partial<Pick<Note, 'title' | 'content' | 'categoryId'>>, userId: string): Promise<Note | undefined>;
  deleteNote(id: string, userId: string): Promise<void>;
  reorderNotes(noteIds: string[], userId: string): Promise<void>;
  
  // Announcements
  getAnnouncement(userId: string): Promise<Announcement | undefined>;
  upsertAnnouncement(message: string, userId: string): Promise<Announcement>;
}

export class DatabaseStorage implements IStorage {
  // Categories
  async getCategories(userId: string): Promise<Category[]> {
    return db.select().from(categories).where(eq(categories.userId, userId));
  }

  async getCategory(id: string, userId: string): Promise<Category | undefined> {
    const [category] = await db.select().from(categories).where(and(eq(categories.id, id), eq(categories.userId, userId)));
    return category || undefined;
  }

  async createCategory(insertCategory: InsertCategory): Promise<Category> {
    const [category] = await db.insert(categories).values(insertCategory).returning();
    return category;
  }

  async updateCategory(id: string, name: string, userId: string): Promise<Category | undefined> {
    const [category] = await db.update(categories).set({ name }).where(and(eq(categories.id, id), eq(categories.userId, userId))).returning();
    return category || undefined;
  }

  async deleteCategory(id: string, userId: string): Promise<void> {
    await db.delete(categories).where(and(eq(categories.id, id), eq(categories.userId, userId)));
  }

  // Tasks
  async getTasks(userId: string): Promise<(Task & { categoryName?: string; subtasks: Subtask[] })[]> {
    const allTasks = await db.select().from(tasks).where(eq(tasks.userId, userId)).orderBy(asc(tasks.order), asc(tasks.id));
    // Sort to put daily tasks first, then by order
    allTasks.sort((a, b) => {
      const aIsDaily = a.refreshType === "daily";
      const bIsDaily = b.refreshType === "daily";
      if (aIsDaily && !bIsDaily) return -1;
      if (!aIsDaily && bIsDaily) return 1;
      return (a.order ?? 0) - (b.order ?? 0);
    });
    const taskIds = allTasks.map(t => t.id);
    const allSubtasks = taskIds.length > 0 ? await db.select().from(subtasks).where(inArray(subtasks.taskId, taskIds)) : [];
    const allCategories = await db.select().from(categories).where(eq(categories.userId, userId));
    
    return allTasks.map(task => ({
      ...task,
      categoryName: allCategories.find(c => c.id === task.categoryId)?.name,
      subtasks: allSubtasks.filter(st => st.taskId === task.id),
    }));
  }

  async getTask(id: string, userId: string): Promise<Task | undefined> {
    const [task] = await db.select().from(tasks).where(and(eq(tasks.id, id), eq(tasks.userId, userId)));
    return task || undefined;
  }

  async createTask(insertTask: InsertTask): Promise<Task> {
    const allTasks = await db.select().from(tasks).where(eq(tasks.userId, insertTask.userId));
    const maxOrder = allTasks.length > 0 
      ? Math.max(...allTasks.map(t => t.order ?? 0))
      : -1;
    const [task] = await db.insert(tasks).values({ ...insertTask, order: maxOrder + 1 }).returning();
    return task;
  }

  async updateTask(id: string, updates: Partial<Pick<Task, 'title' | 'completed' | 'refreshType' | 'categoryId' | 'lastRefreshed' | 'deadline'>>, userId: string): Promise<Task | undefined> {
    // If marking as completed, set completedAt timestamp
    if (updates.completed === true) {
      const [existingTask] = await db.select().from(tasks).where(and(eq(tasks.id, id), eq(tasks.userId, userId)));
      if (existingTask && !existingTask.completed) {
        updates = { ...updates, completedAt: new Date() } as any;
      }
    }
    // If marking as incomplete, clear completedAt timestamp
    if (updates.completed === false) {
      updates = { ...updates, completedAt: null } as any;
    }
    const [task] = await db.update(tasks).set(updates).where(and(eq(tasks.id, id), eq(tasks.userId, userId))).returning();
    return task || undefined;
  }

  async deleteTask(id: string, userId: string): Promise<void> {
    await db.delete(tasks).where(and(eq(tasks.id, id), eq(tasks.userId, userId)));
  }

  async resetDailyTasks(userId: string): Promise<void> {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 7, 0, 0);
    
    // Get all daily task IDs for this user
    const dailyTasks = await db.select({ id: tasks.id }).from(tasks).where(and(eq(tasks.refreshType, "daily"), eq(tasks.userId, userId)));
    const dailyTaskIds = dailyTasks.map(t => t.id);
    
    if (dailyTaskIds.length > 0) {
      // Reset all daily tasks (regardless of completion status)
      await db.update(tasks)
        .set({ completed: false, completedAt: null, lastRefreshed: new Date() })
        .where(and(eq(tasks.refreshType, "daily"), eq(tasks.userId, userId)));
      
      // Reset all subtasks for these daily tasks
      await db.update(subtasks)
        .set({ completed: false, completedAt: null })
        .where(inArray(subtasks.taskId, dailyTaskIds));
    }
  }

  async resetWeeklyTasks(userId: string): Promise<void> {
    // Get all weekly task IDs for this user
    const weeklyTasks = await db.select({ id: tasks.id }).from(tasks).where(and(eq(tasks.refreshType, "weekly"), eq(tasks.userId, userId)));
    const weeklyTaskIds = weeklyTasks.map(t => t.id);
    
    if (weeklyTaskIds.length > 0) {
      // Reset all weekly tasks (regardless of completion status)
      await db.update(tasks)
        .set({ completed: false, completedAt: null, lastRefreshed: new Date() })
        .where(and(eq(tasks.refreshType, "weekly"), eq(tasks.userId, userId)));
      
      // Reset all subtasks for these weekly tasks
      await db.update(subtasks)
        .set({ completed: false, completedAt: null })
        .where(inArray(subtasks.taskId, weeklyTaskIds));
    }
  }

  async deleteOldCompletedTasks(userId: string): Promise<void> {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    
    await db.delete(tasks)
      .where(
        and(
          eq(tasks.completed, true),
          lt(tasks.completedAt, oneWeekAgo),
          eq(tasks.userId, userId)
        )
      );
  }

  async deleteOldCompletedSubtasks(userId: string): Promise<void> {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    
    // Get all task IDs for this user
    const userTasks = await db.select({ id: tasks.id }).from(tasks).where(eq(tasks.userId, userId));
    const userTaskIds = userTasks.map(t => t.id);
    
    if (userTaskIds.length > 0) {
      // Delete subtasks that are completed and older than a week, belonging to this user's tasks
      await db.delete(subtasks)
        .where(
          and(
            inArray(subtasks.taskId, userTaskIds),
            eq(subtasks.completed, true),
            lt(subtasks.completedAt, oneWeekAgo)
          )
        );
    }
  }

  async reorderTasks(taskIds: string[], userId: string): Promise<void> {
    for (let i = 0; i < taskIds.length; i++) {
      await db.update(tasks).set({ order: i }).where(and(eq(tasks.id, taskIds[i]), eq(tasks.userId, userId)));
    }
  }

  // Subtasks
  async getSubtasks(taskId: string, userId: string): Promise<Subtask[]> {
    // Verify the task belongs to the user
    const task = await this.getTask(taskId, userId);
    if (!task) {
      return []; // Return empty array if task doesn't exist or doesn't belong to user
    }
    return db.select().from(subtasks).where(eq(subtasks.taskId, taskId));
  }

  async createSubtask(insertSubtask: InsertSubtask, userId: string): Promise<Subtask> {
    // Verify the task belongs to the user
    const task = await this.getTask(insertSubtask.taskId, userId);
    if (!task) {
      throw new Error("Task not found or access denied");
    }
    const [subtask] = await db.insert(subtasks).values(insertSubtask).returning();
    return subtask;
  }

  async updateSubtask(id: string, updates: Partial<Pick<Subtask, 'title' | 'completed' | 'deadline'>>, userId: string): Promise<Subtask | undefined> {
    // First verify the subtask's task belongs to the user
    const [existingSubtask] = await db.select().from(subtasks).where(eq(subtasks.id, id));
    if (!existingSubtask) {
      return undefined;
    }
    const task = await this.getTask(existingSubtask.taskId, userId);
    if (!task) {
      throw new Error("Subtask not found or access denied");
    }
    
    // If marking as completed, set completedAt timestamp
    if (updates.completed === true) {
      if (!existingSubtask.completed) {
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

  async deleteSubtask(id: string, userId: string): Promise<void> {
    // First verify the subtask's task belongs to the user
    const [existingSubtask] = await db.select().from(subtasks).where(eq(subtasks.id, id));
    if (!existingSubtask) {
      return;
    }
    const task = await this.getTask(existingSubtask.taskId, userId);
    if (!task) {
      throw new Error("Subtask not found or access denied");
    }
    await db.delete(subtasks).where(eq(subtasks.id, id));
  }

  // Notes
  async getNotes(userId: string): Promise<(Note & { categoryName?: string })[]> {
    const allNotes = await db.select().from(notes).where(eq(notes.userId, userId)).orderBy(asc(notes.order), asc(notes.id));
    const allCategories = await db.select().from(categories).where(eq(categories.userId, userId));
    
    return allNotes.map(note => ({
      ...note,
      categoryName: allCategories.find(c => c.id === note.categoryId)?.name,
    }));
  }

  async getNote(id: string, userId: string): Promise<Note | undefined> {
    const [note] = await db.select().from(notes).where(and(eq(notes.id, id), eq(notes.userId, userId)));
    return note || undefined;
  }

  async createNote(insertNote: InsertNote): Promise<Note> {
    const allNotes = await db.select().from(notes).where(eq(notes.userId, insertNote.userId));
    const maxOrder = allNotes.length > 0 
      ? Math.max(...allNotes.map(n => n.order ?? 0))
      : -1;
    const [note] = await db.insert(notes).values({ ...insertNote, order: maxOrder + 1 }).returning();
    return note;
  }

  async updateNote(id: string, updates: Partial<Pick<Note, 'title' | 'content' | 'categoryId'>>, userId: string): Promise<Note | undefined> {
    const [note] = await db.update(notes).set(updates).where(and(eq(notes.id, id), eq(notes.userId, userId))).returning();
    return note || undefined;
  }

  async deleteNote(id: string, userId: string): Promise<void> {
    await db.delete(notes).where(and(eq(notes.id, id), eq(notes.userId, userId)));
  }

  async reorderNotes(noteIds: string[], userId: string): Promise<void> {
    for (let i = 0; i < noteIds.length; i++) {
      await db.update(notes).set({ order: i }).where(and(eq(notes.id, noteIds[i]), eq(notes.userId, userId)));
    }
  }

  // Announcements
  async getAnnouncement(userId: string): Promise<Announcement | undefined> {
    // Get the most recent announcement for this user
    const [announcement] = await db.select().from(announcements).where(eq(announcements.userId, userId)).orderBy(desc(announcements.updatedAt)).limit(1);
    return announcement || undefined;
  }

  async upsertAnnouncement(message: string, userId: string): Promise<Announcement> {
    // Check if an announcement exists for this user
    const existing = await this.getAnnouncement(userId);
    
    if (existing) {
      // Update existing announcement
      const [updated] = await db
        .update(announcements)
        .set({ message, updatedAt: new Date() })
        .where(and(eq(announcements.id, existing.id), eq(announcements.userId, userId)))
        .returning();
      return updated;
    } else {
      // Create new announcement
      const [created] = await db.insert(announcements).values({ message, userId }).returning();
      return created;
    }
  }
}

export const storage = new DatabaseStorage();
