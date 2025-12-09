# Task-Flow

Task-Flow is a modern, comprehensive task management application designed to help you organize your life and work efficiently. Built with a focus on user experience and performance, it offers a robust set of features wrapped in a clean, responsive interface.

## ✨ Features

### 📋 Task Management
-   **Create, Read, Update, Delete**: Full control over your tasks.
-   **Recurring Tasks**: Set tasks to automatically reset daily or weekly.
-   **Deadlines**: meaningful deadline tracking to keep you on schedule.
-   **Completion Tracking**: Visual progress indicators.

### 🧩 Subtasks
-   **Granular Control**: Break down complex tasks into manageable subtasks.
-   **Independent Deadlines**: Set specific deadlines for individual subtasks.
-   **Progress Monitoring**: Task completion status updates automatically as subtasks are finished.

### 🗂️ Organization
-   **Categories**: Group your tasks and notes into custom categories for better organization.
-   **Filtering**: Easily view tasks by category.

### 📝 Notes
-   **Integrated Note-Taking**: Keep your thoughts and reference materials alongside your tasks.
-   **Category Linking**: Associate notes with specific categories.

### 📱 Progressive Web App (PWA)
-   **Installable**: Install Task-Flow on your desktop or mobile device for a native app-like experience.
-   **Offline Capabilities**: Designed to work reliably even with unstable network connections.
-   **Mobile First**: Fully responsive design that looks great on any screen size.

## 🛠️ Tech Stack

**Frontend:**
-   [React](https://react.dev/) - UI Library
-   [TypeScript](https://www.typescriptlang.org/) - Type Safety
-   [Vite](https://vitejs.dev/) - Build Tool
-   [Tailwind CSS](https://tailwindcss.com/) - Styling
-   [Shadcn UI](https://ui.shadcn.com/) & [Radix UI](https://www.radix-ui.com/) - Components
-   [TanStack Query](https://tanstack.com/query/latest) - Data Fetching
-   [Wouter](https://github.com/molefrog/wouter) - Routing

**Backend:**
-   [Node.js](https://nodejs.org/) & [Express](https://expressjs.com/) - Server
-   [Drizzle ORM](https://orm.drizzle.team/) - Database ORM
-   [PostgreSQL](https://www.postgresql.org/) - Database

## 🚀 Getting Started

### Prerequisites
-   Node.js (v18 or later recommended)
-   PostgreSQL database

### Installation

1.  **Clone the repository:**
    ```bash
    git clone <repository-url>
    cd Task-Flow
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Environment Setup:**
    Create a `.env` file in the root directory (copy from `.env.example` if available) and configure your database connection:
    ```env
    DATABASE_URL=postgres://user:password@host:port/dbname
    ```

4.  **Database Migration:**
    Push the schema to your database:
    ```bash
    npm run db:push
    ```

### Running the Application

Start the development server:
```bash
npm run dev
```
The application will be available at `http://localhost:5000`.

## 📜 Available Scripts

-   `npm run dev`: Start the development server (Client & Server).
-   `npm run build`: Build the application for production.
-   `npm run db:push`: Push Drizzle schema changes to the database.
-   `npm run db:migrate`: Run database migrations.
-   `npm run check`: Run TypeScript type checking.

## 📂 Project Structure

-   `client/`: Frontend React application.
-   `server/`: Backend Express server.
-   `shared/`: Shared TypeScript schemas and types.
-   `migrations/`: SQL migration files.
-   `script/`: Utility scripts for maintenance and testing.

## 📚 Additional Documentation

-   [Deployment Guide](DEPLOY.md)
-   [PWA Setup Guide](PWA_SETUP.md)
-   [Supabase Setup](SUPABASE_SETUP.md)
-   [Design Guidelines](design_guidelines.md)


