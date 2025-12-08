# TaskFlow - Dark Mode To-Do List Application

## Overview

TaskFlow is a modern, dark-themed task management application built with React, Express, and PostgreSQL. The application provides a comprehensive solution for organizing tasks with recurring refresh capabilities (daily/weekly), hierarchical task structures with subtasks, and integrated note-taking functionality. The system is designed with a clean separation between client and server, utilizing a RESTful API architecture.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Framework & Build System**
- React 18+ with TypeScript for type-safe component development
- Vite as the build tool and development server
- Wouter for lightweight client-side routing

**UI Component System**
- shadcn/ui component library (New York style variant) with Radix UI primitives
- Tailwind CSS for utility-first styling with custom dark theme configuration
- Design system inspired by Todoist and Notion's dark modes
- Custom color palette: Primary background (#1F1F1F), Secondary background (#2D2D2D), Replit orange accent (#FF8C00)

**State Management & Data Fetching**
- TanStack Query (React Query) for server state management, caching, and synchronization
- Custom query client configured with infinite stale time and disabled auto-refetch
- Optimistic updates pattern for immediate UI feedback

**Key Features Implementation**
- Split-view layout: Tasks (60% left) + Notes (40% right)
- Fixed sidebar (240px) for category navigation
- Floating Action Button (FAB) for quick task/note creation
- Modal dialogs for CRUD operations using Radix Dialog primitives

### Backend Architecture

**Server Framework**
- Express.js with TypeScript
- HTTP server wrapped for potential WebSocket support
- Custom request logging middleware with timestamp formatting

**API Design**
- RESTful endpoints following resource-based routing
- `/api/categories`, `/api/tasks`, `/api/notes`, `/api/subtasks` namespaces
- JSON request/response format with Zod schema validation
- Error handling with appropriate HTTP status codes (400 for validation, 404 for not found, 500 for server errors)

**Database Layer**
- Drizzle ORM for type-safe database operations
- PostgreSQL as the primary database
- Schema-first approach with generated TypeScript types
- Database models: users, categories, tasks, subtasks, notes
- Relational integrity with foreign key constraints and cascade deletes

**Task Scheduling System**
- node-cron for scheduled task refresh operations
- Daily task reset: 7:00 AM EST (cron: `0 7 * * *`)
- Weekly task reset: Sundays 7:00 AM EST (cron: `0 7 * * 0`)
- Automated completion status reset for recurring tasks

**Storage Interface Pattern**
- IStorage interface defining all data operations
- DatabaseStorage implementation using Drizzle ORM
- Repository pattern for clean separation of data access logic
- Support for complex queries joining related entities (tasks with subtasks and category names)

### Data Schema

**Core Entities**
- **Users**: Basic authentication structure (id, username, password)
- **Categories**: Organizational units (id, name)
- **Tasks**: Primary task entities with fields: id, title, completed, refreshType ("none"/"daily"/"weekly"), categoryId, lastRefreshed
- **Subtasks**: Hierarchical task breakdown (id, title, completed, taskId)
- **Notes**: Text content storage (id, title, content, categoryId)

**Relationships**
- Categories → Tasks (one-to-many)
- Categories → Notes (one-to-many)
- Tasks → Subtasks (one-to-many)
- Cascade delete behavior for category removal

### Build & Deployment

**Development Mode**
- Vite dev server with HMR over custom HMR path (`/vite-hmr`)
- Express middleware integration for API proxying
- Dynamic index.html reloading with cache-busting query parameters

**Production Build**
- Client: Vite builds to `dist/public` with code splitting
- Server: esbuild bundles to `dist/index.cjs` with selective dependency bundling
- Allowlist pattern for critical dependencies (drizzle-orm, express, pg, etc.) to reduce syscalls
- Static file serving from built client assets

**Path Aliases**
- `@/` → client/src
- `@shared/` → shared (for schema and types)
- `@assets/` → attached_assets

## External Dependencies

**Database**
- PostgreSQL database required via DATABASE_URL environment variable
- connect-pg-simple for PostgreSQL-backed session storage (though sessions not actively used in current implementation)

**UI Libraries**
- Radix UI component primitives (@radix-ui/react-*) for accessible, unstyled components
- Tailwind CSS with custom configuration for dark theme
- Lucide React for icon system

**Development Tools**
- Replit-specific plugins: cartographer, dev-banner, runtime-error-modal (development only)
- TypeScript for type checking across client and server
- ESBuild and Vite for optimized bundling

**Validation & Schemas**
- Zod for runtime schema validation
- drizzle-zod for generating Zod schemas from Drizzle table definitions
- Type safety maintained across API boundaries

**Utilities**
- date-fns for date manipulation in scheduling
- clsx + tailwind-merge for conditional className composition
- nanoid for cache-busting in development