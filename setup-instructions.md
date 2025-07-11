# Database Setup Instructions

## Current Project Status
Your project is designed to work with **Supabase** for data storage. It uses:
- **Supabase** for todos, flashcards, admin data, and user preferences
- **localStorage** as fallback when offline
- **Supabase Auth** for user authentication (optional)

## Option 1: Run With Supabase (Recommended)
The project works best with Supabase for data storage:

1. **Create a Supabase Project:**
   - Go to [supabase.com](https://supabase.com) and sign up or log in
   - Create a new project
   - Wait for the project to be created

2. **Run the SQL Migration (IMPORTANT - Required Step):**
   - Go to the SQL Editor in your Supabase project
   - Copy the contents of `supabase/migrations/create_required_tables.sql`
   - Run the SQL in the editor
   - This step is MANDATORY - the app will not work properly without these tables

3. **Update your `.env` file:**
   ```env
   VITE_SUPABASE_URL=your-project-url
   VITE_SUPABASE_ANON_KEY=your-anon-key
   VITE_ENABLE_LOCALSTORAGE_FALLBACK=true
   ```

4. **Features that work with Supabase:**
   - ✅ Todo management with cloud sync
   - ✅ Flashcard learning with AI detection
   - ✅ Admin panel with data persistence
   - ✅ Theme settings synced across devices
   - ✅ User authentication and profiles

## Option 2: Run Without Database (Fallback)

The project can still work without Supabase by using localStorage:

1. **Update your `.env` file:**
   ```env
   VITE_SUPABASE_URL=https://placeholder.supabase.co
   VITE_SUPABASE_ANON_KEY=placeholder-key
   VITE_ENABLE_LOCALSTORAGE_FALLBACK=true
   ```

2. **Authentication fallback:**
   - Hardcoded admin login: `admin@demo.com` / `admin`
   - No user registration, but full app functionality

## Self-Hosting Supabase

This project is compatible with self-hosted Supabase instances. To set up:

1. **Set up a self-hosted Supabase instance** following the [official documentation](https://supabase.com/docs/guides/self-hosting)

2. **Run the SQL migration** in your self-hosted instance:
   - Use the SQL in `supabase/migrations/create_required_tables.sql`

3. **Update your environment variables** to point to your self-hosted instance:
   ```env
   VITE_SUPABASE_URL=your-self-hosted-url
   VITE_SUPABASE_ANON_KEY=your-anon-key
   ```

## Troubleshooting

### If you get authentication errors:
1. Check that email confirmation is disabled
2. Verify your Supabase URL and keys
3. Make sure RLS policies are set correctly

### If you get database errors:
1. Check that you've run the SQL migration
   - This is the most common issue! Make sure you've copied and run the SQL from `supabase/migrations/create_required_tables.sql`
2. Verify your Supabase URL and keys
3. Try setting `VITE_ENABLE_LOCALSTORAGE_FALLBACK=true` to use localStorage as fallback

## Troubleshooting "relation does not exist" errors

If you see errors like `relation "public.user_preferences" does not exist`, it means you haven't run the SQL migration script yet. Follow these steps:

1. Go to your Supabase project dashboard
2. Click on "SQL Editor" in the left sidebar
3. Create a new query
4. Copy the ENTIRE contents of `supabase/migrations/create_required_tables.sql`
5. Paste it into the SQL editor
6. Click "Run" to execute the SQL
7. Refresh your application

The application will automatically use localStorage as a fallback until the database tables are created.