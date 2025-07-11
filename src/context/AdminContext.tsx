import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase, checkTableExists } from '../lib/supabase';
import { useAuth } from './AuthContext'; // Keep this import
import { Plan, Coupon, UserProfile, UserStats, FlashcardCategory, Flashcard } from '../types';
import { v4 as uuidv4 } from 'uuid';
import toast from 'react-hot-toast';

interface AdminContextType {
  // Plans
  plans: Plan[];
  addPlan: (plan: Omit<Plan, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updatePlan: (id: string, updates: Partial<Plan>) => void;
  deletePlan: (id: string) => void;
  getPlanById: (id: string) => Plan | undefined;
  
  // Coupons
  coupons: Coupon[];
  addCoupon: (coupon: Omit<Coupon, 'id' | 'createdAt' | 'updatedAt' | 'usedCount'>) => void;
  updateCoupon: (id: string, updates: Partial<Coupon>) => void;
  deleteCoupon: (id: string) => void;
  getCouponByCode: (code: string) => Coupon | undefined;
  
  // Flashcard Categories
  categories: FlashcardCategory[];
  addCategory: (category: Omit<FlashcardCategory, 'id' | 'createdAt'>) => void;
  updateCategory: (id: string, updates: Partial<FlashcardCategory>) => void;
  deleteCategory: (id: string) => void;
  getCategoryById: (id: string) => FlashcardCategory | undefined;
  
  // Flashcards
  flashcards: Flashcard[];
  addFlashcard: (flashcard: Omit<Flashcard, 'id' | 'createdAt'>) => void;
  updateFlashcard: (id: string, updates: Partial<Flashcard>) => void;
  deleteFlashcard: (id: string) => void;
  getFlashcardById: (id: string) => Flashcard | undefined;
  getFlashcardsByCategory: (categoryId: string) => Flashcard[];
  
  // Users
  users: UserProfile[];
  getUserStats: (userId: string) => UserStats;
  updateUserStatus: (userId: string, isActive: boolean) => void;
  resetUserPassword: (userId: string, newPassword: string) => void;
  
  // Admin verification
  isAdmin: (email: string) => boolean;
}

const AdminContext = createContext<AdminContextType | undefined>(undefined);

export const useAdmin = () => {
  const context = useContext(AdminContext);
  if (!context) {
    throw new Error('useAdmin must be used within an AdminProvider');
  }
  return context;
};

export const AdminProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [categories, setCategories] = useState<FlashcardCategory[]>([]);
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [loading, setLoading] = useState(true);

  // Default data
  const getDefaultPlans = (): Plan[] => [
      {
        id: uuidv4(),
        name: 'Free',
        description: 'Perfect for getting started',
        price: 0,
        currency: 'USD',
        billingPeriod: 'monthly',
        features: {
          todoboardEnabled: true,
          customDomain: false,
          prioritySupport: false,
        },
        isActive: true,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
      {
        id: uuidv4(),
        name: 'Pro',
        description: 'For professional users',
        price: 29,
        currency: 'USD',
        billingPeriod: 'monthly',
        features: {
          todoboardEnabled: true,
          customDomain: true,
          prioritySupport: true,
        },
        isActive: true,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
      {
        id: uuidv4(),
        name: 'Enterprise',
        description: 'For teams and organizations',
        price: 99,
        currency: 'USD',
        billingPeriod: 'monthly',
        features: {
          todoboardEnabled: true,
          customDomain: true,
          prioritySupport: true,
        },
        isActive: true,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
    ];

  const getDefaultCategories = (): FlashcardCategory[] => [
      {
        id: 'animals',
        name: 'Animals',
        description: 'Learn about different animals and their sounds',
        color: '#10B981',
        icon: '🐾',
        ageGroup: '3-4 years',
        modelUrl: 'https://example.com/models/animals-model.json', // Example fine-tuned model
        createdAt: Date.now(),
      },
      {
        id: 'colors',
        name: 'Colors',
        description: 'Discover beautiful colors around us',
        color: '#8B5CF6',
        icon: '🎨',
        ageGroup: '3-4 years',
        createdAt: Date.now(),
      },
      {
        id: 'shapes',
        name: 'Shapes',
        description: 'Learn basic shapes and geometry',
        color: '#F59E0B',
        icon: '🔷',
        ageGroup: '3-4 years',
        createdAt: Date.now(),
      },
      {
        id: 'numbers',
        name: 'Numbers',
        description: 'Count and learn numbers 1-10',
        color: '#EF4444',
        icon: '🔢',
        ageGroup: '3-4 years',
        createdAt: Date.now(),
      },
    ];

  const getDefaultFlashcards = (): Flashcard[] => [
      // Animals
      {
        id: 'cat',
        categoryId: 'animals',
        title: 'Cat',
        description: 'A cute furry pet that says meow',
        imageUrl: 'https://images.pexels.com/photos/45201/kitty-cat-kitten-pet-45201.jpeg?auto=compress&cs=tinysrgb&w=400',
        soundUrl: '/sounds/cat-meow.mp3',
        pronunciation: 'kat',
        spelling: 'c-a-t',
        difficulty: 'easy',
        createdAt: Date.now(),
      },
      {
        id: 'dog',
        categoryId: 'animals',
        title: 'Dog',
        description: 'A loyal friend that says woof',
        imageUrl: 'https://images.pexels.com/photos/1108099/pexels-photo-1108099.jpeg?auto=compress&cs=tinysrgb&w=400',
        soundUrl: '/sounds/dog-bark.mp3',
        pronunciation: 'dawg',
        spelling: 'd-o-g',
        difficulty: 'easy',
        createdAt: Date.now(),
      },
      {
        id: 'cow',
        categoryId: 'animals',
        title: 'Cow',
        description: 'A farm animal that says moo',
        imageUrl: 'https://images.pexels.com/photos/422218/pexels-photo-422218.jpeg?auto=compress&cs=tinysrgb&w=400',
        soundUrl: '/sounds/cow-moo.mp3',
        pronunciation: 'kow',
        spelling: 'c-o-w',
        difficulty: 'easy',
        createdAt: Date.now(),
      },
      {
        id: 'duck',
        categoryId: 'animals',
        title: 'Duck',
        description: 'A water bird that says quack',
        imageUrl: 'https://images.pexels.com/photos/133459/pexels-photo-133459.jpeg?auto=compress&cs=tinysrgb&w=400',
        soundUrl: '/sounds/duck-quack.mp3',
        pronunciation: 'duhk',
        spelling: 'd-u-c-k',
        difficulty: 'easy',
        createdAt: Date.now(),
      },
      
      // Colors
      {
        id: 'red',
        categoryId: 'colors',
        title: 'Red',
        description: 'The color of apples and fire trucks',
        imageUrl: 'https://images.pexels.com/photos/209439/pexels-photo-209439.jpeg?auto=compress&cs=tinysrgb&w=400',
        soundUrl: '/sounds/red.mp3',
        pronunciation: 'red',
        spelling: 'r-e-d',
        difficulty: 'easy',
        createdAt: Date.now(),
      },
      {
        id: 'blue',
        categoryId: 'colors',
        title: 'Blue',
        description: 'The color of the sky and ocean',
        imageUrl: 'https://images.pexels.com/photos/531880/pexels-photo-531880.jpeg?auto=compress&cs=tinysrgb&w=400',
        soundUrl: '/sounds/blue.mp3',
        pronunciation: 'bloo',
        spelling: 'b-l-u-e',
        difficulty: 'easy',
        createdAt: Date.now(),
      },
      {
        id: 'yellow',
        categoryId: 'colors',
        title: 'Yellow',
        description: 'The color of the sun and bananas',
        imageUrl: 'https://images.pexels.com/photos/1435735/pexels-photo-1435735.jpeg?auto=compress&cs=tinysrgb&w=400',
        soundUrl: '/sounds/yellow.mp3',
        pronunciation: 'yel-oh',
        spelling: 'y-e-l-l-o-w',
        difficulty: 'easy',
        createdAt: Date.now(),
      },
      {
        id: 'green',
        categoryId: 'colors',
        title: 'Green',
        description: 'The color of grass and leaves',
        imageUrl: 'https://images.pexels.com/photos/1072179/pexels-photo-1072179.jpeg?auto=compress&cs=tinysrgb&w=400',
        soundUrl: '/sounds/green.mp3',
        pronunciation: 'green',
        spelling: 'g-r-e-e-n',
        difficulty: 'easy',
        createdAt: Date.now(),
      },
      
      // Shapes
      {
        id: 'circle',
        categoryId: 'shapes',
        title: 'Circle',
        description: 'A round shape with no corners',
        imageUrl: 'https://images.pexels.com/photos/207962/pexels-photo-207962.jpeg?auto=compress&cs=tinysrgb&w=400',
        soundUrl: '/sounds/circle.mp3',
        pronunciation: 'sur-kul',
        spelling: 'c-i-r-c-l-e',
        difficulty: 'easy',
        createdAt: Date.now(),
      },
      {
        id: 'square',
        categoryId: 'shapes',
        title: 'Square',
        description: 'A shape with four equal sides',
        imageUrl: 'https://images.pexels.com/photos/1029604/pexels-photo-1029604.jpeg?auto=compress&cs=tinysrgb&w=400',
        soundUrl: '/sounds/square.mp3',
        pronunciation: 'skwair',
        spelling: 's-q-u-a-r-e',
        difficulty: 'easy',
        createdAt: Date.now(),
      },
      {
        id: 'triangle',
        categoryId: 'shapes',
        title: 'Triangle',
        description: 'A shape with three sides',
        imageUrl: 'https://images.pexels.com/photos/1029624/pexels-photo-1029624.jpeg?auto=compress&cs=tinysrgb&w=400',
        soundUrl: '/sounds/triangle.mp3',
        pronunciation: 'try-ang-gul',
        spelling: 't-r-i-a-n-g-l-e',
        difficulty: 'medium',
        createdAt: Date.now(),
      },
      {
        id: 'star',
        categoryId: 'shapes',
        title: 'Star',
        description: 'A shape with five points',
        imageUrl: 'https://images.pexels.com/photos/1252814/pexels-photo-1252814.jpeg?auto=compress&cs=tinysrgb&w=400',
        soundUrl: '/sounds/star.mp3',
        pronunciation: 'star',
        spelling: 's-t-a-r',
        difficulty: 'medium',
        createdAt: Date.now(),
      },
      
      // Numbers
      {
        id: 'one',
        categoryId: 'numbers',
        title: 'One',
        description: 'The number 1',
        imageUrl: 'https://images.pexels.com/photos/1329296/pexels-photo-1329296.jpeg?auto=compress&cs=tinysrgb&w=400',
        soundUrl: '/sounds/one.mp3',
        pronunciation: 'wuhn',
        spelling: 'o-n-e',
        difficulty: 'easy',
        createdAt: Date.now(),
      },
      {
        id: 'two',
        categoryId: 'numbers',
        title: 'Two',
        description: 'The number 2',
        imageUrl: 'https://images.pexels.com/photos/1329297/pexels-photo-1329297.jpeg?auto=compress&cs=tinysrgb&w=400',
        soundUrl: '/sounds/two.mp3',
        pronunciation: 'too',
        spelling: 't-w-o',
        difficulty: 'easy',
        createdAt: Date.now(),
      },
      {
        id: 'three',
        categoryId: 'numbers',
        title: 'Three',
        description: 'The number 3',
        imageUrl: 'https://images.pexels.com/photos/1329298/pexels-photo-1329298.jpeg?auto=compress&cs=tinysrgb&w=400',
        soundUrl: '/sounds/three.mp3',
        pronunciation: 'three',
        spelling: 't-h-r-e-e',
        difficulty: 'easy',
        createdAt: Date.now(),
      },
      {
        id: 'four',
        categoryId: 'numbers',
        title: 'Four',
        description: 'The number 4',
        imageUrl: 'https://images.pexels.com/photos/1329299/pexels-photo-1329299.jpeg?auto=compress&cs=tinysrgb&w=400',
        soundUrl: '/sounds/four.mp3',
        pronunciation: 'for',
        spelling: 'f-o-u-r',
        difficulty: 'easy',
        createdAt: Date.now(),
      },
    ];

  // Save admin data to Supabase
  const saveGenericAdminData = async (dataType: string, data: any, tableName: string) => {
    if (!user || !isAdmin(user.email || '')) return;

    // Check if the table exists first
    const tableExists = await checkTableExists('admin_data');
    if (!tableExists) {
      // Save to localStorage only
      localStorage.setItem(`admin_${dataType}`, JSON.stringify(data));
      return;
    }

    try {
      const { error } = await supabase
        .from(tableName)
        .upsert({
          data_type: dataType,
          data_key: 'default',
          data_value: data
        });

      if (error) throw error;

      // Also save to localStorage as backup
      localStorage.setItem(`admin_${dataType}`, JSON.stringify(data));
    } catch (error: any) {
      console.error(`Error saving ${dataType}:`, error);
      
      // Save to localStorage as fallback
      localStorage.setItem(`admin_${dataType}`, JSON.stringify(data));
      toast('Data saved locally. Will sync when connection is restored.', { icon: '⚠️' });
    }
  };


  // Helper function to save categories to their dedicated table
  const saveCategoriesToSupabase = async (data: FlashcardCategory[]) => {
    if (!user || !isAdmin(user.email || '')) return;

    const tableExists = await checkTableExists('flashcard_categories');
    if (!tableExists) {
      localStorage.setItem('admin_categories', JSON.stringify(data));
      return;
    }

    try {
      // Delete existing and insert new to handle updates/deletes simply for now
      // In a real app, you'd do more granular upserts/deletes
      await supabase.from('flashcard_categories').delete().neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all
      const { error } = await supabase.from('flashcard_categories').insert(data.map(c => ({
          id: c.id,
          name: c.name,
          description: c.description,
          color: c.color,
          icon: c.icon,
          age_group: c.ageGroup,
          model_url: c.modelUrl,
          created_at: new Date(c.createdAt).toISOString()
      })));

      if (error) throw error;
      localStorage.setItem('admin_categories', JSON.stringify(data));
    } catch (error: any) {
      console.error('Error saving categories:', error);
      localStorage.setItem('admin_categories', JSON.stringify(data));
      toast('Categories saved locally. Will sync when connection is restored.', { icon: '⚠️' });
    }
  };

  // Helper function to save flashcards to their dedicated table
  const saveFlashcardsToSupabase = async (data: Flashcard[]) => {
    if (!user || !isAdmin(user.email || '')) return;

    const tableExists = await checkTableExists('flashcards');
    if (!tableExists) {
      // Save to localStorage only
      localStorage.setItem('admin_flashcards', JSON.stringify(data));
      return;
    }

    try {
      const { error } = await supabase
        .from('flashcards')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all
      if (error) throw error;

      const { error: insertError } = await supabase.from('flashcards').insert(data.map(f => ({
          id: f.id,
          category_id: f.categoryId,
          title: f.title,
          description: f.description,
          image_url: f.imageUrl,
          sound_url: f.soundUrl,
          pronunciation: f.pronunciation,
          spelling: f.spelling,
          difficulty: f.difficulty,
          created_at: new Date(f.createdAt).toISOString()
      })));

      if (insertError) throw insertError;
      localStorage.setItem('admin_flashcards', JSON.stringify(data));
    } catch (error: any) {
      console.error('Error saving flashcards:', error);
      localStorage.setItem('admin_flashcards', JSON.stringify(data));
      toast('Flashcards saved locally. Will sync when connection is restored.', { icon: '⚠️' });
    }
  };

  // Generic save function (now calls specific helpers)
  const saveAdminData = async (dataType: string, data: any) => { // This function will now dispatch to specific save functions
    if (dataType === 'categories') {
      await saveCategoriesToSupabase(data);
    } else if (dataType === 'flashcards') {
      await saveFlashcardsToSupabase(data);
    } else if (dataType === 'plans') {
      await savePlansToSupabase(data);
    } else if (dataType === 'coupons') {
      await saveCouponsToSupabase(data);
    } else {
      await saveGenericAdminData(dataType, data);
    }
  };

  // Helper to load data from localStorage
  const loadFromLocalStorage = (key: string, defaultValue: any) => {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : defaultValue;
  };

  // Load admin data from Supabase
  const loadAdminData = async () => {
    if (!user || !isAdmin(user.email || '')) {
      setLoading(false);
      // Set default data for non-admin users or when not logged in
      setPlans(getDefaultPlans());
      setCategories(getDefaultCategories());
      setFlashcards(getDefaultFlashcards());
      return;
    }

    try {
      setLoading(true);
      const adminDataTableExists = await checkTableExists('admin_data');
      if (!adminDataTableExists) {
        console.warn('admin_data table does not exist, using localStorage');
        const savedPlans = localStorage.getItem('admin_plans');
        const savedCoupons = localStorage.getItem('admin_coupons');
        const savedUsers = localStorage.getItem('admin_users');
        const savedCategories = localStorage.getItem('admin_categories');
        const savedFlashcards = localStorage.getItem('admin_flashcards');

        setPlans(savedPlans ? JSON.parse(savedPlans) : getDefaultPlans());
        setCoupons(savedCoupons ? JSON.parse(savedCoupons) : []);
        setUsers(savedUsers ? JSON.parse(savedUsers) : []);
        setCategories(savedCategories ? JSON.parse(savedCategories) : getDefaultCategories());
        setFlashcards(savedFlashcards ? JSON.parse(savedFlashcards) : getDefaultFlashcards());
        toast('Using local data. Database tables not found.', { icon: '⚠️' });
        setLoading(false);
        return;
      }

      // Load plans from dedicated table
      const plansTableExists = await checkTableExists('plans');
      if (plansTableExists) {
        const { data: loadedPlans, error: plansError } = await supabase
          .from('plans')
          .select('*');
        if (plansError) throw plansError;
        setPlans(loadedPlans.map(p => ({
          id: p.id,
          name: p.name,
          description: p.description,
          price: p.price,
          currency: p.currency,
          billingPeriod: p.billing_period,
          features: p.features,
          isActive: p.is_active,
          createdAt: new Date(p.created_at).getTime(),
          updatedAt: new Date(p.updated_at).getTime(),
        })) || getDefaultPlans());
      } else {
        setPlans(loadFromLocalStorage('admin_plans', getDefaultPlans()));
      }

      // Load coupons from dedicated table
      const couponsTableExists = await checkTableExists('coupons');
      if (couponsTableExists) {
        const { data: loadedCoupons, error: couponsError } = await supabase
          .from('coupons')
          .select('*');
        if (couponsError) throw couponsError;
        setCoupons(loadedCoupons.map(c => ({
          id: c.id,
          code: c.code,
          description: c.description,
          discountPercentage: c.discount_percentage,
          applicablePlans: c.applicable_plans,
          isActive: c.is_active,
          expiresAt: c.expires_at ? new Date(c.expires_at).getTime() : undefined,
          usageLimit: c.usage_limit,
          usedCount: c.used_count,
          createdAt: new Date(c.created_at).getTime(),
          updatedAt: new Date(c.updated_at).getTime(),
        })) || []);
      } else {
        setCoupons(loadFromLocalStorage('admin_coupons', []));
      }

      // Load users from admin_data (still generic for now)
      const { data: loadedUsers, error: usersError } = await supabase.from('admin_data').select('*').eq('data_type', 'users');
      if (usersError) throw usersError;
      setUsers(loadedUsers?.[0]?.data_value || []);

      // Load categories from dedicated table
      const categoriesTableExists = await checkTableExists('flashcard_categories');
      if (categoriesTableExists) {
        const { data: loadedCategories, error: categoriesError } = await supabase
          .from('flashcard_categories')
          .select('*');
        if (categoriesError) throw categoriesError;
        setCategories(loadedCategories.map(c => ({
          id: c.id,
          name: c.name,
          description: c.description,
          color: c.color,
          icon: c.icon,
          ageGroup: c.age_group,
          modelUrl: c.model_url,
          createdAt: new Date(c.created_at).getTime()
        })) || getDefaultCategories());
      } else {
        setCategories(loadFromLocalStorage('admin_categories', getDefaultCategories()));
      }

      // Load flashcards from dedicated table
      const flashcardsTableExists = await checkTableExists('flashcards');
      if (flashcardsTableExists) {
        const { data: loadedFlashcards, error: flashcardsError } = await supabase
          .from('flashcards')
          .select('*');
        if (flashcardsError) throw flashcardsError;
        setFlashcards(loadedFlashcards.map(f => ({
          id: f.id,
          categoryId: f.category_id,
          title: f.title,
          description: f.description,
          imageUrl: f.image_url,
          soundUrl: f.sound_url,
          pronunciation: f.pronunciation,
          spelling: f.spelling,
          difficulty: f.difficulty,
          createdAt: new Date(f.created_at).getTime()
        })) || getDefaultFlashcards());
      } else {
        setFlashcards(loadFromLocalStorage('admin_flashcards', getDefaultFlashcards()));
      }
    }

    try {
      setLoading(true);

      // Load all admin data
      const adminDataTableExists = await checkTableExists('admin_data');
      const loadedPlans = adminDataTableExists ? (await supabase.from('admin_data').select('*').eq('data_type', 'plans')).data?.[0]?.data_value || getDefaultPlans() : loadFromLocalStorage('admin_plans', getDefaultPlans());
      const loadedCoupons = adminDataTableExists ? (await supabase.from('admin_data').select('*').eq('data_type', 'coupons')).data?.[0]?.data_value || [] : loadFromLocalStorage('admin_coupons', []);
      const loadedUsers = adminDataTableExists ? (await supabase.from('admin_data').select('*').eq('data_type', 'users')).data?.[0]?.data_value || [] : loadFromLocalStorage('admin_users', []);

      setPlans(loadedPlans);
      setCoupons(loadedCoupons);
      setUsers(loadedUsers);

      // Load categories from dedicated table
      const categoriesTableExists = await checkTableExists('flashcard_categories');
      if (categoriesTableExists) {
        const { data: loadedCategories, error: categoriesError } = await supabase
          .from('flashcard_categories')
          .select('*');
        if (categoriesError) throw categoriesError;
        setCategories(loadedCategories.map(c => ({
          id: c.id,
          name: c.name,
          description: c.description,
          color: c.color,
          icon: c.icon,
          ageGroup: c.age_group,
          modelUrl: c.model_url,
          createdAt: new Date(c.created_at).getTime()
        })) || getDefaultCategories());
      } else {
        setCategories(loadFromLocalStorage('admin_categories', getDefaultCategories()));
      }

      // Load flashcards from dedicated table
      const flashcardsTableExists = await checkTableExists('flashcards');
      if (flashcardsTableExists) {
        const { data: loadedFlashcards, error: flashcardsError } = await supabase
          .from('flashcards')
          .select('*');
        if (flashcardsError) throw flashcardsError;
        setFlashcards(loadedFlashcards.map(f => ({
          id: f.id,
          categoryId: f.category_id,
          title: f.title,
          description: f.description,
          imageUrl: f.image_url,
          soundUrl: f.sound_url,
          pronunciation: f.pronunciation,
          spelling: f.spelling,
          difficulty: f.difficulty,
          createdAt: new Date(f.created_at).getTime()
        })) || getDefaultFlashcards());
      } else {
        setFlashcards(loadFromLocalStorage('admin_flashcards', getDefaultFlashcards()));
      }
    } catch (error: any) {
      console.error('Error loading admin data:', error);
      
      // Fallback to localStorage
      setPlans(loadFromLocalStorage('admin_plans', getDefaultPlans()));
      setCoupons(loadFromLocalStorage('admin_coupons', []));
      setUsers(loadFromLocalStorage('admin_users', []));
      setCategories(loadFromLocalStorage('admin_categories', getDefaultCategories()));
      setFlashcards(loadFromLocalStorage('admin_flashcards', getDefaultFlashcards()));
      toast.error('Using offline admin data. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  // Migrate localStorage data to Supabase
  const migrateAdminData = async () => {
    if (!user || !isAdmin(user.email || '')) return;
  
    try {
      const migrations = [
        { key: 'admin_users', dataType: 'users', data: users, tableName: 'admin_data' }, // Users still in admin_data
      ];
  
      // Check if plans table exists before attempting to migrate plans
      const plansTableExists = await checkTableExists('plans');
      const couponsTableExists = await checkTableExists('coupons');

      for (const migration of migrations) {
        const localData = localStorage.getItem(migration.key);
        if (localData) {
          const parsedData = JSON.parse(localData);
          await saveGenericAdminData(migration.dataType, parsedData);
          localStorage.removeItem(migration.key);
        }
      }
  
      // Migrate plans
      if (plansTableExists) {
        const localPlans = localStorage.getItem('admin_plans');
        if (localPlans) {
          const parsedPlans = JSON.parse(localPlans);
          await savePlansToSupabase(parsedPlans);
          localStorage.removeItem('admin_plans');
        }
      }
      if (couponsTableExists) {
        const localCoupons = localStorage.getItem('admin_coupons');
        if (localCoupons) {
          const parsedCoupons = JSON.parse(localCoupons);
          await saveCouponsToSupabase(parsedCoupons);
          localStorage.removeItem('admin_coupons');
        }
      }
      
      // Migrate categories
      const localCategories = localStorage.getItem('admin_categories');
      if (localCategories) {
        const parsedCategories = JSON.parse(localCategories);
        await saveCategoriesToSupabase(parsedCategories);
        localStorage.removeItem('admin_categories');
      }

      // Migrate flashcards
      const localFlashcards = localStorage.getItem('admin_flashcards');
      if (localFlashcards) {
        const parsedFlashcards = JSON.parse(localFlashcards);
        await saveFlashcardsToSupabase(parsedFlashcards);
        localStorage.removeItem('admin_flashcards');
      }
      toast.success('Migrated admin data to cloud storage');
    } catch (error) {
      console.error('Error migrating admin data:', error);
    }
  };

  useEffect(() => {
    if (user && isAdmin(user.email || '')) {
      loadAdminData().then(() => {
        // Auto-migrate on first load
        migrateAdminData();
      });
    } else {
      setLoading(false);
    }
  }, [user]);

  // Helper function to save plans to their dedicated table
  const savePlansToSupabase = async (data: Plan[]) => {
    if (!user || !isAdmin(user.email || '')) return;
    const tableExists = await checkTableExists('plans');
    if (!tableExists) {
      localStorage.setItem('admin_plans', JSON.stringify(data));
      return;
    }
    try {
      await supabase.from('plans').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      const { error } = await supabase.from('plans').insert(data.map(p => ({
        id: p.id, name: p.name, description: p.description, price: p.price, currency: p.currency,
        billing_period: p.billingPeriod, features: p.features, is_active: p.isActive,
        created_at: new Date(p.createdAt).toISOString(), updated_at: new Date(p.updatedAt).toISOString()
      })));
      if (error) throw error;
      localStorage.setItem('admin_plans', JSON.stringify(data));
    } catch (error: any) {
      console.error('Error saving plans:', error);
      localStorage.setItem('admin_plans', JSON.stringify(data));
      toast('Plans saved locally. Will sync when connection is restored.', { icon: '⚠️' });
    }
  };

  const addPlan = (plan: Omit<Plan, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newPlan: Plan = {
      ...plan,
      id: uuidv4(),
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    const updatedPlans = [...plans, newPlan]; // Update local state
    setPlans(updatedPlans); 
    savePlansToSupabase(updatedPlans); // Persist to Supabase
    toast.success('Plan added successfully');
  };

  const updatePlan = (id: string, updates: Partial<Plan>) => {
    const updatedPlans = plans.map(plan =>
        plan.id === id ? { ...plan, ...updates, updatedAt: Date.now() } : plan
    ); // Update local state
    setPlans(updatedPlans); 
    savePlansToSupabase(updatedPlans); // Persist to Supabase
    toast.success('Plan updated successfully');
  };

  const deletePlan = (id: string) => {
    const updatedPlans = plans.filter(plan => plan.id !== id); // Update local state
    setPlans(updatedPlans); 
    savePlansToSupabase(updatedPlans); // Persist to Supabase
    toast.success('Plan deleted successfully');
  };

  const getPlanById = (id: string) => {
    return plans.find(plan => plan.id === id);
  };

  // Helper function to save coupons to their dedicated table
  const saveCouponsToSupabase = async (data: Coupon[]) => {
    if (!user || !isAdmin(user.email || '')) return;
    const tableExists = await checkTableExists('coupons');
    if (!tableExists) {
      localStorage.setItem('admin_coupons', JSON.stringify(data));
      return;
    }
    try {
      await supabase.from('coupons').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      const { error } = await supabase.from('coupons').insert(data.map(c => ({
        id: c.id, code: c.code, description: c.description, discount_percentage: c.discountPercentage,
        applicable_plans: c.applicablePlans, is_active: c.isActive, expires_at: c.expiresAt ? new Date(c.expiresAt).toISOString() : null,
        usage_limit: c.usageLimit, used_count: c.usedCount,
        created_at: new Date(c.createdAt).toISOString(), updated_at: new Date(c.updatedAt).toISOString()
      })));
      if (error) throw error;
      localStorage.setItem('admin_coupons', JSON.stringify(data));
    } catch (error: any) {
      console.error('Error saving coupons:', error);
      localStorage.setItem('admin_coupons', JSON.stringify(data));
      toast('Coupons saved locally. Will sync when connection is restored.', { icon: '⚠️' });
    }
  };

  const addCoupon = (coupon: Omit<Coupon, 'id' | 'createdAt' | 'updatedAt' | 'usedCount'>) => {
    const newCoupon: Coupon = {
      ...coupon,
      id: uuidv4(),
      usedCount: 0,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }; // Update local state
    const updatedCoupons = [...coupons, newCoupon]; 
    setCoupons(updatedCoupons); 
    saveCouponsToSupabase(updatedCoupons); // Persist to Supabase
    toast.success('Coupon added successfully');
  };

  const updateCoupon = (id: string, updates: Partial<Coupon>) => {
    const updatedCoupons = coupons.map(coupon =>
        coupon.id === id ? { ...coupon, ...updates, updatedAt: Date.now() } : coupon
    ); // Update local state
    setCoupons(updatedCoupons); 
    saveCouponsToSupabase(updatedCoupons); // Persist to Supabase
    toast.success('Coupon updated successfully');
  };

  const deleteCoupon = (id: string) => {
    const updatedCoupons = coupons.filter(coupon => coupon.id !== id); // Update local state
    setCoupons(updatedCoupons); 
    saveCouponsToSupabase(updatedCoupons); // Persist to Supabase
    toast.success('Coupon deleted successfully');
  };

  const getCouponByCode = (code: string) => {
    return coupons.find(coupon => 
      coupon.code.toLowerCase() === code.toLowerCase() && 
      coupon.isActive &&
      (!coupon.expiresAt || coupon.expiresAt > Date.now()) &&
      (!coupon.usageLimit || coupon.usedCount < coupon.usageLimit)
    );
  };

  // Category management functions
  const addCategory = (category: Omit<FlashcardCategory, 'id' | 'createdAt'>) => {
    const newCategory: FlashcardCategory = {
      ...category,
      id: uuidv4(),
      createdAt: Date.now(),
    };
    const updatedCategories = [...categories, newCategory];
    setCategories(updatedCategories); // Update local state
    saveCategoriesToSupabase(updatedCategories); // Persist to Supabase
    toast.success('Category added successfully');
  };

  const updateCategory = (id: string, updates: Partial<FlashcardCategory>) => {
    const updatedCategories = categories.map(category =>
        category.id === id ? { ...category, ...updates } : category
    );
    setCategories(updatedCategories); // Update local state
    saveCategoriesToSupabase(updatedCategories); // Persist to Supabase
    toast.success('Category updated successfully');
  };

  const deleteCategory = async (id: string) => { // Make async to await flashcard deletion
    // Delete all flashcards in this category first
    const flashcardsTableExists = await checkTableExists('flashcards');
    if (flashcardsTableExists) {
        await supabase.from('flashcards').delete().eq('category_id', id);
    }

    // Also delete all flashcards in this category
    const updatedFlashcards = flashcards.filter(flashcard => flashcard.categoryId !== id);
    const updatedCategories = categories.filter(category => category.id !== id);
    
    setFlashcards(updatedFlashcards); // Update local state
    setCategories(updatedCategories); // Update local state
    saveFlashcardsToSupabase(updatedFlashcards); // Persist to Supabase
    saveCategoriesToSupabase(updatedCategories); // Persist to Supabase
    toast.success('Category and associated flashcards deleted successfully');
  };

  const getCategoryById = (id: string) => {
    return categories.find(category => category.id === id);
  };

  // Flashcard management functions
  const addFlashcard = (flashcard: Omit<Flashcard, 'id' | 'createdAt'>) => {
    const newFlashcard: Flashcard = {
      ...flashcard,
      id: uuidv4(),
      createdAt: Date.now(),
    };
    const updatedFlashcards = [...flashcards, newFlashcard]; // Update local state
    setFlashcards(updatedFlashcards); 
    saveFlashcardsToSupabase(updatedFlashcards); // Persist to Supabase
    toast.success('Flashcard added successfully');
  };

  const updateFlashcard = (id: string, updates: Partial<Flashcard>) => {
    const updatedFlashcards = flashcards.map(flashcard =>
        flashcard.id === id ? { ...flashcard, ...updates } : flashcard
    );
    setFlashcards(updatedFlashcards); // Update local state
    saveFlashcardsToSupabase(updatedFlashcards); // Persist to Supabase
    toast.success('Flashcard updated successfully');
  };

  const deleteFlashcard = (id: string) => {
    const updatedFlashcards = flashcards.filter(flashcard => flashcard.id !== id);
    setFlashcards(updatedFlashcards); // Update local state
    saveFlashcardsToSupabase(updatedFlashcards); // Persist to Supabase
    toast.success('Flashcard deleted successfully');
  };

  const getFlashcardById = (id: string) => {
    return flashcards.find(flashcard => flashcard.id === id);
  };

  const getFlashcardsByCategory = (categoryId: string) => {
    return flashcards.filter(flashcard => flashcard.categoryId === categoryId);
  };
  const getUserStats = (userId: string): UserStats => {
    // This would typically fetch from a database
    // For now, return mock data
    return {
      totalTodos: 15,
      completedTodos: 10,
    };
  };

  const updateUserStatus = (userId: string, isActive: boolean) => {
    const updatedUsers = users.map(user =>
        user.id === userId ? { ...user, isActive } : user
    );
    setUsers(updatedUsers);
    saveAdminData('users', updatedUsers);
    toast.success(`User ${isActive ? 'activated' : 'deactivated'} successfully`);
  };

  const resetUserPassword = (userId: string, newPassword: string) => {
    // This would typically call an API to reset the password
    toast.success('Password reset successfully');
  };

  const isAdmin = (email: string) => {
    return email === 'admin@admin.com' || email === 'admin@demo.com' || email === 'admin@example.com';
  };

  return (
    <AdminContext.Provider
      value={{
        loading,
        plans,
        addPlan,
        updatePlan,
        deletePlan,
        getPlanById,
        coupons,
        addCoupon,
        updateCoupon,
        deleteCoupon,
        getCouponByCode,
        categories,
        addCategory,
        updateCategory,
        deleteCategory,
        getCategoryById,
        flashcards,
        addFlashcard,
        updateFlashcard,
        deleteFlashcard,
        getFlashcardById,
        getFlashcardsByCategory,
        users,
        getUserStats,
        updateUserStatus,
        resetUserPassword,
        isAdmin,
      }}
    >
      {children}
    </AdminContext.Provider>
  );
};