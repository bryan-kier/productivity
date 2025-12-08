# Setting up Supabase Database

Follow these steps to connect your Task-Flow application to a Supabase PostgreSQL database.

## 1. Create a Supabase Project

1. Go to [Supabase](https://supabase.com/) and sign up or log in.
2. Click **"New Project"**.
3. Choose your organization, enter a name (e.g., `Task-Flow`), set a strong database password, and choose a region close to you.
4. Click **"Create new project"** and wait for the database to provision.

## 2. Get the Connection String

1. Once your project is ready, go to **Project Settings** (gear icon) -> **Database**.
2. Under **Connection parameters**, look for **Connection Pooling** (recommended for serverless environments like Vercel).
   - If you don't see "Connection Pooling", go to the "Pooler" section in the menu to enable it.
   - Using the pooler prevents running out of connections in serverless environments.
3. Copy the **URI** (Connection String).
   - It should look like: `postgres://[db-user]:[db-password]@aws-0-[region].pooler.supabase.com:6543/[db-name]?pgbouncer=true`
   - **Important:** Ensure `Mode` is set to `Transaction` for port 6543.
4. Replace `[db-password]` with the password you created in Step 1.

## 3. Configure Environment Variables

### Local Development
1. Create a `.env` file in the root directory:
   ```bash
   touch .env
   ```

2. Add your Supabase connection string to the `.env` file:
   ```bash
   DATABASE_URL="postgres://postgres.xxxx:password@aws-0-region.pooler.supabase.com:6543/postgres?pgbouncer=true"
   ```
   
   **Important:** Replace:
   - `xxxx` with your actual project reference
   - `password` with your database password (the one you set when creating the project)
   - `region` with your actual region (e.g., `us-east-1`)
   
   Example:
   ```bash
   DATABASE_URL="postgres://postgres.abcdefghijklmnop:MySecurePassword123@aws-0-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true"
   ```

### Vercel Deployment
1. Go to your Vercel project settings.
2. Navigate to **Environment Variables**.
3. Add a new variable:
   - Key: `DATABASE_URL`
   - Value: Your Supabase connection string.

## 4. Push the Database Schema

You have two options to create the tables in your new Supabase database:

### Option A: Using Drizzle Kit (Recommended)
Since the project is already set up with Drizzle, you can push the schema directly from your terminal:

1. Ensure your `DATABASE_URL` is set in your environment.
2. Run the push command:
   ```bash
   npm run db:push
   ```
   This will read `shared/schema.ts` and create the necessary tables in Supabase.

### Option B: Using SQL Editor
If you prefer to run the SQL manually:

1. Copy the contents of the `SUPABASE_SCHEMA.sql` file in this repository.
2. Go to your Supabase project dashboard -> **SQL Editor**.
3. Paste the SQL and click **Run**.

## 5. Verify the Connection

We've included a test script to verify everything is working:

```bash
npm run test:db
```

If successful, you'll see a green success message and a list of your tables.
