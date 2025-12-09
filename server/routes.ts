import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage.js";
import { insertCategorySchema, insertTaskSchema, insertSubtaskSchema, insertNoteSchema } from "../shared/schema.js";
import { z } from "zod";

export async function registerRoutes(
  httpServer: Server | null,
  app: Express
): Promise<Server | null> {
  
  // === Categories ===
  app.get("/api/categories", async (_req, res) => {
    try {
      const categories = await storage.getCategories();
      res.json(categories);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch categories" });
    }
  });

  app.post("/api/categories", async (req, res) => {
    try {
      const parsed = insertCategorySchema.parse(req.body);
      const category = await storage.createCategory(parsed);
      res.status(201).json(category);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: error.errors });
      } else {
        res.status(500).json({ error: "Failed to create category" });
      }
    }
  });

  app.patch("/api/categories/:id", async (req, res) => {
    try {
      const { name } = req.body;
      if (!name || typeof name !== "string") {
        return res.status(400).json({ error: "Name is required" });
      }
      const category = await storage.updateCategory(req.params.id, name);
      if (!category) {
        return res.status(404).json({ error: "Category not found" });
      }
      res.json(category);
    } catch (error) {
      res.status(500).json({ error: "Failed to update category" });
    }
  });

  app.delete("/api/categories/:id", async (req, res) => {
    try {
      await storage.deleteCategory(req.params.id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete category" });
    }
  });

  // === Tasks ===
  app.get("/api/tasks", async (_req, res) => {
    try {
      const tasks = await storage.getTasks();
      res.json(tasks);
    } catch (error) {
      res.status(500).json({ 
        error: "Failed to fetch tasks",
        details: error instanceof Error ? error.message : String(error)
      });
    }
  });

  app.post("/api/tasks", async (req, res) => {
    try {
      const parsed = insertTaskSchema.parse(req.body);
      const task = await storage.createTask(parsed);
      res.status(201).json(task);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: error.errors });
      } else {
        res.status(500).json({ error: "Failed to create task", details: error instanceof Error ? error.message : String(error) });
      }
    }
  });

  app.patch("/api/tasks/:id", async (req, res) => {
    try {
      const updates: any = { ...req.body };
      // Convert deadline ISO string to Date object if present
      if (updates.deadline !== undefined) {
        if (updates.deadline === null || updates.deadline === "") {
          updates.deadline = null;
        } else if (typeof updates.deadline === "string") {
          const date = new Date(updates.deadline);
          if (isNaN(date.getTime())) {
            return res.status(400).json({ error: "Invalid deadline date format" });
          }
          updates.deadline = date;
        } else if (updates.deadline instanceof Date) {
          // Already a Date object, use as is
          if (isNaN(updates.deadline.getTime())) {
            return res.status(400).json({ error: "Invalid deadline date" });
          }
        }
      }
      const task = await storage.updateTask(req.params.id, updates);
      if (!task) {
        return res.status(404).json({ error: "Task not found" });
      }
      res.json(task);
    } catch (error) {
      res.status(500).json({ error: "Failed to update task", details: error instanceof Error ? error.message : String(error) });
    }
  });

  app.delete("/api/tasks/:id", async (req, res) => {
    try {
      await storage.deleteTask(req.params.id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete task" });
    }
  });

  // === Subtasks ===
  app.get("/api/tasks/:taskId/subtasks", async (req, res) => {
    try {
      const subtasks = await storage.getSubtasks(req.params.taskId);
      res.json(subtasks);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch subtasks" });
    }
  });

  app.post("/api/subtasks", async (req, res) => {
    try {
      const parsed = insertSubtaskSchema.parse(req.body);
      const subtask = await storage.createSubtask(parsed);
      res.status(201).json(subtask);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: error.errors });
      } else {
        res.status(500).json({ error: "Failed to create subtask", details: error instanceof Error ? error.message : String(error) });
      }
    }
  });

  app.patch("/api/subtasks/:id", async (req, res) => {
    try {
      const updates: any = { ...req.body };
      // Convert deadline ISO string to Date object if present
      if (updates.deadline !== undefined) {
        if (updates.deadline === null || updates.deadline === "") {
          updates.deadline = null;
        } else if (typeof updates.deadline === "string") {
          const date = new Date(updates.deadline);
          if (isNaN(date.getTime())) {
            return res.status(400).json({ error: "Invalid deadline date format" });
          }
          updates.deadline = date;
        } else if (updates.deadline instanceof Date) {
          // Already a Date object, use as is
          if (isNaN(updates.deadline.getTime())) {
            return res.status(400).json({ error: "Invalid deadline date" });
          }
        }
      }
      const subtask = await storage.updateSubtask(req.params.id, updates);
      if (!subtask) {
        return res.status(404).json({ error: "Subtask not found" });
      }
      res.json(subtask);
    } catch (error) {
      res.status(500).json({ error: "Failed to update subtask", details: error instanceof Error ? error.message : String(error) });
    }
  });

  app.delete("/api/subtasks/:id", async (req, res) => {
    try {
      await storage.deleteSubtask(req.params.id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete subtask" });
    }
  });

  // === Notes ===
  app.get("/api/notes", async (_req, res) => {
    try {
      const notes = await storage.getNotes();
      res.json(notes);
    } catch (error) {
      res.status(500).json({ 
        error: "Failed to fetch notes",
        details: error instanceof Error ? error.message : String(error)
      });
    }
  });

  app.post("/api/notes", async (req, res) => {
    try {
      const parsed = insertNoteSchema.parse(req.body);
      const note = await storage.createNote(parsed);
      res.status(201).json(note);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: error.errors });
      } else {
        res.status(500).json({ error: "Failed to create note" });
      }
    }
  });

  app.patch("/api/notes/:id", async (req, res) => {
    try {
      const note = await storage.updateNote(req.params.id, req.body);
      if (!note) {
        return res.status(404).json({ error: "Note not found" });
      }
      res.json(note);
    } catch (error) {
      res.status(500).json({ error: "Failed to update note" });
    }
  });

  app.delete("/api/notes/:id", async (req, res) => {
    try {
      await storage.deleteNote(req.params.id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete note" });
    }
  });

  // === Task Refresh Endpoints (for manual trigger or cron) ===
  app.post("/api/tasks/refresh/daily", async (_req, res) => {
    try {
      await storage.resetDailyTasks();
      res.json({ message: "Daily tasks refreshed" });
    } catch (error) {
      res.status(500).json({ error: "Failed to refresh daily tasks" });
    }
  });

  app.post("/api/tasks/refresh/weekly", async (_req, res) => {
    try {
      await storage.resetWeeklyTasks();
      res.json({ message: "Weekly tasks refreshed" });
    } catch (error) {
      res.status(500).json({ error: "Failed to refresh weekly tasks" });
    }
  });

  app.post("/api/tasks/cleanup/completed", async (_req, res) => {
    try {
      await storage.deleteOldCompletedTasks();
      res.json({ message: "Old completed tasks deleted" });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete old completed tasks" });
    }
  });

  // === Health Check Endpoint ===
  app.get("/health", async (_req, res) => {
    try {
      // Test database connection
      const { testConnection } = await import("./db");
      const dbConnected = await testConnection();
      
      const health = {
        status: dbConnected ? "ok" : "degraded",
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        database: {
          connected: dbConnected,
          status: dbConnected ? "healthy" : "disconnected"
        }
      };
      
      res.status(dbConnected ? 200 : 503).json(health);
    } catch (error) {
      res.status(503).json({
        status: "error",
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        database: {
          connected: false,
          status: "error",
          error: error instanceof Error ? error.message : String(error)
        }
      });
    }
  });

  return httpServer;
}
