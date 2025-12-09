import { sql, relations } from "drizzle-orm";
import { pgTable, text, varchar, boolean, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users table (existing)
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Categories table
export const categories = pgTable("categories", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
});

export const categoriesRelations = relations(categories, ({ many }) => ({
  tasks: many(tasks),
  notes: many(notes),
}));

export const insertCategorySchema = createInsertSchema(categories).pick({
  name: true,
});

export type InsertCategory = z.infer<typeof insertCategorySchema>;
export type Category = typeof categories.$inferSelect;

// Tasks table
export const tasks = pgTable("tasks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  completed: boolean("completed").notNull().default(false),
  completedAt: timestamp("completed_at"),
  refreshType: text("refresh_type").notNull().default("none"), // "none" | "daily" | "weekly"
  categoryId: varchar("category_id").references(() => categories.id, { onDelete: "set null" }),
  lastRefreshed: timestamp("last_refreshed"),
  deadline: timestamp("deadline"),
  order: integer("order").default(0),
});

export const tasksRelations = relations(tasks, ({ one, many }) => ({
  category: one(categories, {
    fields: [tasks.categoryId],
    references: [categories.id],
  }),
  subtasks: many(subtasks),
}));

const baseTaskSchema = createInsertSchema(tasks).pick({
  title: true,
  refreshType: true,
  categoryId: true,
});

export const insertTaskSchema = baseTaskSchema.extend({
  deadline: z.preprocess((val) => {
    if (val === null || val === undefined || val === "") return null;
    if (val instanceof Date) return val;
    if (typeof val === "string") {
      const date = new Date(val);
      return isNaN(date.getTime()) ? null : date;
    }
    return null;
  }, z.date().nullable().optional()),
});

export type InsertTask = z.infer<typeof insertTaskSchema>;
export type Task = typeof tasks.$inferSelect;

// Subtasks table
export const subtasks = pgTable("subtasks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  completed: boolean("completed").notNull().default(false),
  completedAt: timestamp("completed_at"),
  taskId: varchar("task_id").notNull().references(() => tasks.id, { onDelete: "cascade" }),
  deadline: timestamp("deadline"),
});

export const subtasksRelations = relations(subtasks, ({ one }) => ({
  task: one(tasks, {
    fields: [subtasks.taskId],
    references: [tasks.id],
  }),
}));

const baseSubtaskSchema = createInsertSchema(subtasks).pick({
  title: true,
  taskId: true,
});

export const insertSubtaskSchema = baseSubtaskSchema.extend({
  deadline: z.preprocess((val) => {
    if (val === null || val === undefined || val === "") return null;
    if (val instanceof Date) return val;
    if (typeof val === "string") {
      const date = new Date(val);
      return isNaN(date.getTime()) ? null : date;
    }
    return null;
  }, z.date().nullable().optional()),
});

export type InsertSubtask = z.infer<typeof insertSubtaskSchema>;
export type Subtask = typeof subtasks.$inferSelect;

// Notes table
export const notes = pgTable("notes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  content: text("content").notNull().default(""),
  categoryId: varchar("category_id").references(() => categories.id, { onDelete: "set null" }),
  order: integer("order").default(0),
});

export const notesRelations = relations(notes, ({ one }) => ({
  category: one(categories, {
    fields: [notes.categoryId],
    references: [categories.id],
  }),
}));

export const insertNoteSchema = createInsertSchema(notes).pick({
  title: true,
  content: true,
  categoryId: true,
});

export type InsertNote = z.infer<typeof insertNoteSchema>;
export type Note = typeof notes.$inferSelect;
