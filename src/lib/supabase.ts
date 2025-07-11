import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Check if we should use localStorage fallback
const enableLocalStorageFallback = import.meta.env.VITE_ENABLE_LOCALSTORAGE_FALLBACK === 'true';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase environment variables not found. Using placeholder values for development.');
}

console.log('Connecting to Supabase at:', supabaseUrl);

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-key',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true
    },
    global: {
      fetch: (...args) => fetch(...args)
    }
  }
);

// Helper function to check if Supabase is properly configured
export const isSupabaseConfigured = () => {
  return (
    supabaseUrl && 
    supabaseAnonKey && 
    supabaseUrl !== 'https://placeholder.supabase.co' && 
    supabaseAnonKey !== 'placeholder-key'
  );
};

// Helper function to check if a table exists and handle errors gracefully
export const checkTableExists = async (tableName: string): Promise<boolean> => {
  try {
    const { data, error } = await supabase
      .from(tableName)
      .select('*')
      .limit(1)
      .maybeSingle();
    
    // If no error, table exists
    if (!error) return true;
    
    // Check for specific "relation does not exist" error
    if (error.code === '42P01' || error.message?.includes('does not exist')) {
      console.warn(`Table "${tableName}" does not exist in Supabase. Using localStorage fallback.`);
      return false;
    }
    
    // For other errors, assume table exists but there might be permission issues
    console.warn(`Error checking table "${tableName}":`, error);
    return true;
  } catch (error) {
    console.warn(`Error checking table "${tableName}":`, error);
    return false;
  }