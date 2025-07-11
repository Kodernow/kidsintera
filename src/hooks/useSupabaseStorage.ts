import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

interface UseSupabaseStorageOptions {
  table: string;
  key?: string;
  defaultValue?: any;
  isAdminData?: boolean;
}

export const useSupabaseStorage = <T>({
  table,
  key,
  defaultValue,
  isAdminData = false
}: UseSupabaseStorageOptions) => {
  const [data, setData] = useState<T>(defaultValue);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  // Load data from Supabase
  const loadData = async () => {
    if (!user && !isAdminData) {
      setData(defaultValue);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      if (isAdminData) {
        // Load admin data
        const { data: adminData, error } = await supabase
          .from('admin_data')
          .select('data_value')
          .eq('data_type', table)
          .eq('data_key', key || 'default');

        if (error) throw error;

        if (adminData && adminData.length > 0) {
          setData(adminData[0].data_value);
        } else {
          setData(defaultValue);
        }
      } else {
        // Load user data
        const { data: userData, error } = await supabase
          .from(table)
          .select('*')
          .eq('user_id', user?.id);

        if (error) throw error;
        setData(userData || defaultValue);
      }
    } catch (err: any) {
      console.error(`Error loading data from ${table}:`, err);
      setError(err.message);
      
      // Fallback to localStorage if Supabase fails
      try {
        const fallbackKey = isAdminData ? `admin_${table}` : table;
        const fallbackData = localStorage.getItem(fallbackKey);
        if (fallbackData) {
          setData(JSON.parse(fallbackData));
          toast.error('Using offline data. Please check your connection.');
        } else {
          setData(defaultValue);
        }
      } catch {
        setData(defaultValue);
      }
    } finally {
      setLoading(false);
    }
  };

  // Save data to Supabase
  const saveData = async (newData: T) => {
    if (!user && !isAdminData) {
      toast.error('Please sign in to save data');
      return;
    }

    try {
      if (isAdminData) {
        // Save admin data
        const { error } = await supabase
          .from('admin_data')
          .upsert({
            data_type: table,
            data_key: key || 'default',
            data_value: newData
          });

        if (error) throw error;
      } else {
        // For user data, handle different table structures
        if (table === 'todos') {
          // Todos are handled differently - they're individual records
          return;
        } else if (table === 'user_preferences') {
          // Save user preferences
          const { error } = await supabase
            .from('user_preferences')
            .upsert({
              user_id: user?.id,
              ...newData as any
            });

          if (error) throw error;
        }
      }

      setData(newData);
      
      // Also save to localStorage as backup
      const backupKey = isAdminData ? `admin_${table}` : table;
      localStorage.setItem(backupKey, JSON.stringify(newData));
      
    } catch (err: any) {
      console.error(`Error saving data to ${table}:`, err);
      toast.error(`Failed to save data: ${err.message}`);
      
      // Save to localStorage as fallback
      try {
        const fallbackKey = isAdminData ? `admin_${table}` : table;
        localStorage.setItem(fallbackKey, JSON.stringify(newData));
        setData(newData);
        toast.warning('Data saved locally. Will sync when connection is restored.');
      } catch {
        toast.error('Failed to save data');
      }
    }
  };

  // Migrate localStorage data to Supabase
  const migrateFromLocalStorage = async () => {
    if (!user && !isAdminData) return;

    try {
      const localKey = isAdminData ? `admin_${table}` : table;
      const localData = localStorage.getItem(localKey);
      
      if (localData) {
        const parsedData = JSON.parse(localData);
        await saveData(parsedData);
        
        // Remove from localStorage after successful migration
        localStorage.removeItem(localKey);
        toast.success(`Migrated ${table} data to cloud storage`);
      }
    } catch (err) {
      console.error(`Error migrating ${table} from localStorage:`, err);
    }
  };

  useEffect(() => {
    loadData();
  }, [user, table, key]);

  // Auto-migrate on first load
  useEffect(() => {
    if (!loading && user) {
      migrateFromLocalStorage();
    }
  }, [loading, user]);

  return {
    data,
    loading,
    error,
    saveData,
    loadData,
    migrateFromLocalStorage
  };
};