import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';
import toast from 'react-hot-toast';

type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [theme, setTheme] = useState<Theme>('light');
  const [themeLoaded, setThemeLoaded] = useState(false);

  // Load theme from Supabase or localStorage
  const loadTheme = async () => {
    if (user) {
      try {
        const { data, error } = await supabase
          .from('user_preferences')
          .select('theme')
          .eq('user_id', user.id)
          .single();

        if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
          throw error;
        }

        if (data?.theme) {
          setTheme(data.theme as Theme);
        } else {
          // Use system preference as default
          const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
          setTheme(systemTheme);
        }
      } catch (error: any) {
        console.error('Error loading theme:', error);
        toast('Using local theme settings', { icon: 'ℹ️' });
        
        // Fallback to localStorage
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme === 'light' || savedTheme === 'dark') {
          setTheme(savedTheme);
        } else {
          const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
          setTheme(systemTheme);
        }
      }
    } else {
      // For non-authenticated users, use localStorage or system preference
      const savedTheme = localStorage.getItem('theme');
      if (savedTheme === 'light' || savedTheme === 'dark') {
        setTheme(savedTheme);
      } else {
        const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
        setTheme(systemTheme);
      }
    }
    setThemeLoaded(true);
  };

  // Save theme to Supabase and localStorage
  const saveTheme = async (newTheme: Theme) => {
    if (user) {
      try {
        await supabase
          .from('user_preferences')
          .upsert({
            user_id: user.id,
            theme: newTheme,
          });
      } catch (error: any) {
        console.error('Error saving theme:', error);
      }
    }
    
    // Always save to localStorage as backup
    localStorage.setItem('theme', newTheme);
  };

  useEffect(() => {
    loadTheme();
  }, [user]);

  useEffect(() => {
    if (themeLoaded) {
      document.body.classList.remove('light-theme', 'dark-theme');
      document.body.classList.add(`${theme}-theme`);
      saveTheme(theme);
    }
  }, [theme, themeLoaded]);

  const toggleTheme = () => {
    setTheme(prevTheme => (prevTheme === 'light' ? 'dark' : 'light'));
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};