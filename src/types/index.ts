export enum TodoStatus {
  TODO = 'todo',
  IN_PROGRESS = 'in_progress',
  DONE = 'done',
}

export interface Todo {
  id: string;
  title: string;
  description?: string;
  status: TodoStatus;
  createdAt: number;
  dueDate?: number;
}

export interface BackupData {
  todos: Todo[];
  lastBackupDate: number;
}

// Admin and Plan Management Types
export interface Plan {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  billingPeriod: 'monthly' | 'yearly';
  features: PlanFeatures;
  isActive: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface PlanFeatures {
  todoboardEnabled: boolean;
  customDomain: boolean;
  prioritySupport: boolean;
}

export interface Coupon {
  id: string;
  code: string;
  description: string;
  discountPercentage: number;
  applicablePlans: string[];
  isActive: boolean;
  expiresAt?: number;
  usageLimit?: number;
  usedCount: number;
  createdAt: number;
  updatedAt: number;
}

export interface UserSubscription {
  id: string;
  userId: string;
  planId: string;
  status: 'active' | 'cancelled' | 'expired';
  startDate: number;
  endDate: number;
  paymentMethod?: string;
  stripeSubscriptionId?: string;
  razorpaySubscriptionId?: string;
  createdAt: number;
  updatedAt: number;
}

export interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  isAdmin: boolean;
  subscription?: UserSubscription;
  createdAt: number;
  lastLoginAt: number;
  isActive: boolean;
}

export interface UserStats {
  totalTodos: number;
  completedTodos: number;
}

export interface PaymentIntent {
  id: string;
  userId: string;
  planId: string;
  couponId?: string;
  amount: number;
  currency: string;
  status: 'pending' | 'succeeded' | 'failed';
  paymentMethod: 'stripe' | 'razorpay';
  createdAt: number;
}

// Flashcards Types
export interface FlashcardCategory {
  id: string;
  name: string;
  description: string;
  color: string;
  icon: string;
  ageGroup: string;
  modelUrl?: string; // Optional URL for category-specific fine-tuned model
  createdAt: number;
}

export interface Flashcard {
  id: string;
  categoryId: string;
  title: string;
  description?: string;
  imageUrl: string;
  soundUrl: string;
  pronunciation?: string;
  spelling: string; // Phonetic spelling for the word (e.g., "c-a-t" for "cat")
  difficulty: 'easy' | 'medium' | 'hard';
  createdAt: number;
}

interface TodoContextType {
  todos: Todo[];
  loading: boolean;
  addTodo: (todo: Omit<Todo, 'id' | 'createdAt'>) => void;
  updateTodo: (id: string, updates: Partial<Todo>) => void;
  deleteTodo: (id: string) => void;
  getTodosByStatus: (status: TodoStatus) => Todo[];
  moveTodoToStatus: (id: string, newStatus: TodoStatus) => void;
  loadTodos: () => Promise<void>;
}

interface AdminContextType {
  loading: boolean;
  // Plans
  plans: Plan[];
}

interface SubscriptionContextType {
  loading: boolean;
  currentSubscription: UserSubscription | null;
  currentPlan: Plan | null;
  availablePlans: Plan[];
  applyCoupon: (couponCode: string, planId: string) => Promise<{ discountedPrice: number; coupon: Coupon } | null>;
  upgradePlan: (planId: string, couponId?: string) => Promise<void>;
  cancelSubscription: () => Promise<void>;
  isFeatureEnabled: (feature: keyof Plan['features']) => boolean;
}