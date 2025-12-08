-- Task-Flow Database Schema
-- Run this in Supabase SQL Editor to create all tables

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  username TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL
);

-- Categories table
CREATE TABLE IF NOT EXISTS categories (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL
);

-- Tasks table
CREATE TABLE IF NOT EXISTS tasks (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  completed BOOLEAN NOT NULL DEFAULT false,
  refresh_type TEXT NOT NULL DEFAULT 'none',
  category_id VARCHAR REFERENCES categories(id) ON DELETE SET NULL,
  last_refreshed TIMESTAMP
);

-- Subtasks table
CREATE TABLE IF NOT EXISTS subtasks (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  completed BOOLEAN NOT NULL DEFAULT false,
  task_id VARCHAR NOT NULL REFERENCES tasks(id) ON DELETE CASCADE
);

-- Notes table
CREATE TABLE IF NOT EXISTS notes (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  content TEXT NOT NULL DEFAULT '',
  category_id VARCHAR REFERENCES categories(id) ON DELETE SET NULL
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_tasks_category_id ON tasks(category_id);
CREATE INDEX IF NOT EXISTS idx_subtasks_task_id ON subtasks(task_id);
CREATE INDEX IF NOT EXISTS idx_notes_category_id ON notes(category_id);

