import { 
  users, type User, type InsertUser,
  categories, type Category, type InsertCategory,
  tasks, type Task, type InsertTask,
  subtasks, type Subtask, type InsertSubtask,
  notes, type Note, type InsertNote,
} from "../shared/schema.js";
import { db } from "./db.js";
import { eq, and, lt } from "drizzle-orm";

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
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
  
  // Subtasks
  getSubtasks(taskId: string): Promise<Subtask[]>;
  createSubtask(subtask: InsertSubtask): Promise<Subtask>;
  updateSubtask(id: string, updates: Partial<Pick<Subtask, 'title' | 'completed' | 'deadline'>>): Promise<Subtask | undefined>;
  deleteSubtask(id: string): Promise<void>;
  
  // Notes
  getNotes(): Promise<(Note & { categoryName?: string })[]>;
  getNote(id: string): Promise<Note | undefined>;
  createNote(note: InsertNote): Promise<Note>;
  updateNote(id: string, updates: Partial<Pick<Note, 'title' | 'content' | 'categoryId'>>): Promise<Note | undefined>;
  deleteNote(id: string): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  // Users
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

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
    const allTasks = await db.select().from(tasks);
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
    const [task] = await db.insert(tasks).values(insertTask).returning();
    return task;
  }

  async updateTask(id: string, updates: Partial<Pick<Task, 'title' | 'completed' | 'refreshType' | 'categoryId' | 'lastRefreshed' | 'deadline'>>): Promise<Task | undefined> {
    const [task] = await db.update(tasks).set(updates).where(eq(tasks.id, id)).returning();
    return task || undefined;
  }

  async deleteTask(id: string): Promise<void> {
    await db.delete(tasks).where(eq(tasks.id, id));
  }

  async resetDailyTasks(): Promise<void> {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 7, 0, 0);
    
    await db.update(tasks)
      .set({ completed: false, lastRefreshed: new Date() })
      .where(
        and(
          eq(tasks.refreshType, "daily"),
          eq(tasks.completed, true)
        )
      );
  }

  async resetWeeklyTasks(): Promise<void> {
    await db.update(tasks)
      .set({ completed: false, lastRefreshed: new Date() })
      .where(
        and(
          eq(tasks.refreshType, "weekly"),
          eq(tasks.completed, true)
        )
      );
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
    const [subtask] = await db.update(subtasks).set(updates).where(eq(subtasks.id, id)).returning();
    return subtask || undefined;
  }

  async deleteSubtask(id: string): Promise<void> {
    await db.delete(subtasks).where(eq(subtasks.id, id));
  }

  // Notes
  async getNotes(): Promise<(Note & { categoryName?: string })[]> {
    const allNotes = await db.select().from(notes);
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
    const [note] = await db.insert(notes).values(insertNote).returning();
    return note;
  }

  async updateNote(id: string, updates: Partial<Pick<Note, 'title' | 'content' | 'categoryId'>>): Promise<Note | undefined> {
    const [note] = await db.update(notes).set(updates).where(eq(notes.id, id)).returning();
    return note || undefined;
  }

  async deleteNote(id: string): Promise<void> {
    await db.delete(notes).where(eq(notes.id, id));
  }
}

export const storage = new DatabaseStorage();
