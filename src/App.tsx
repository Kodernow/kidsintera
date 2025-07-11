import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

// Contexts
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { AdminProvider } from './context/AdminContext';
import { FlashcardProvider } from './context/FlashcardContext';
import { SubscriptionProvider } from './context/SubscriptionContext';
import { TodoProvider } from './context/TodoContext';

// Components & Layouts
import ProtectedRoute from './components/auth/ProtectedRoute';
import AdminRoute from './components/admin/AdminRoute';
import FeatureRoute from './components/auth/FeatureRoute';
import Layout from './components/layout/Layout';
import AdminLayout from './components/admin/AdminLayout';

// Pages
import Landing from './pages/Landing';
import SignIn from './pages/auth/SignIn';
import SignUp from './pages/auth/SignUp';
import ForgotPassword from './pages/auth/ForgotPassword';
import Dashboard from './pages/Dashboard';
import TodoBoard from './pages/TodoBoard';
import Settings from './pages/Settings';
import Profile from './pages/Profile';
import Pricing from './pages/Pricing';
import AdminDashboard from './pages/admin/AdminDashboard';
import UserManagement from './pages/admin/UserManagement';
import PlanManagement from './pages/admin/PlanManagement';
import CouponManagement from './pages/admin/CouponManagement';
import CategoryManagement from './pages/admin/CategoryManagement';
import FlashcardManagement from './pages/admin/FlashcardManagement';
import Flashcards from './pages/Flashcards';
import FlashcardCategory from './pages/FlashcardCategory';
import FlashcardSingle from './pages/FlashcardSingle';

// Assuming App.css contains global styles, if not used, it can be removed.
import './App.css';

// Define a type for route configuration for better type safety and readability
interface RouteConfig {
  path: string;
  component: React.ComponentType<any>;
  isProtected?: boolean;
  isAdmin?: boolean;
  feature?: string;
  layout?: 'user' | 'admin' | 'none';
  context?: React.ComponentType<{ children: React.ReactNode }>;
}

/**
 * Helper function to wrap components with necessary routes, layouts, and contexts.
 * This centralizes the logic for rendering a route's element, making the Routes definition cleaner.
 */
const renderRouteElement = (config: RouteConfig) => {
  let element: React.ReactNode = <config.component />;

  // Apply specific context provider if defined
  if (config.context) {
    const ContextProvider = config.context;
    element = <ContextProvider>{element}</ContextProvider>;
  }

  // Apply layout based on configuration
  if (config.layout === 'user') {
    element = <Layout>{element}</Layout>;
  } else if (config.layout === 'admin') {
    element = <AdminLayout>{element}</AdminLayout>;
  }

  // Apply feature route protection
  if (config.feature) {
    element = <FeatureRoute feature={config.feature}>{element}</FeatureRoute>;
  }

  // Apply admin route protection
  if (config.isAdmin) {
    element = <AdminRoute>{element}</AdminRoute>;
  }

  // Apply general protected route
  if (config.isProtected) {
    element = <ProtectedRoute>{element}</ProtectedRoute>;
  }

  return element;
};

// Array defining all application routes with their configurations
const appRoutesConfig: RouteConfig[] = [
  // Public routes
  { path: '/', component: Landing, layout: 'none' },
  { path: '/pricing', component: Pricing, layout: 'none' },
  { path: '/auth/signin', component: SignIn, layout: 'none' },
  { path: '/auth/signup', component: SignUp, layout: 'none' },
  { path: '/auth/forgot-password', component: ForgotPassword, layout: 'none' },

  // Admin routes
  { path: '/admin', component: AdminDashboard, isAdmin: true, layout: 'admin' },
  { path: '/admin/users', component: UserManagement, isAdmin: true, layout: 'admin' },
  { path: '/admin/plans', component: PlanManagement, isAdmin: true, layout: 'admin' },
  { path: '/admin/coupons', component: CouponManagement, isAdmin: true, layout: 'admin' },
  { path: '/admin/categories', component: CategoryManagement, isAdmin: true, layout: 'admin' },
  { path: '/admin/flashcards', component: FlashcardManagement, isAdmin: true, layout: 'admin' },
  { path: '/admin/settings', component: Settings, isAdmin: true, layout: 'admin' }, // Settings page can be shared

  // Protected user routes
  { path: '/dashboard', component: Dashboard, isProtected: true, layout: 'user' },
  { path: '/todo', component: TodoBoard, isProtected: true, feature: 'todoboardEnabled', layout: 'user' },
  { path: '/profile', component: Profile, isProtected: true, layout: 'user' },
  { path: '/settings', component: Settings, isProtected: true, layout: 'user' }, // Settings page can be shared
  { path: '/flashcards', component: Flashcards, isProtected: true, layout: 'none', context: FlashcardProvider },
  { path: '/flashcards/:categoryId', component: FlashcardCategory, isProtected: true, layout: 'none', context: FlashcardProvider },
  { path: '/flashcards/:categoryId/:flashcardId', component: FlashcardSingle, isProtected: true, layout: 'none', context: FlashcardProvider },

  // Catch all route - redirects to home if no other route matches
  { path: '*', component: () => <Navigate to="/" replace />, layout: 'none' },
];

/**
 * AppRoutes component handles the routing logic based on user authentication and roles.
 * It displays a loading spinner while authentication status is being determined.
 */
const AppRoutes: React.FC = () => {
  const { loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 dark:border-blue-400"></div>
      </div>
    );
  }

  return (
    <Routes>
      {appRoutesConfig.map((route, index) => (
        <Route
          key={index} // Using index as key is generally okay for static route configurations
          path={route.path}
          element={renderRouteElement(route)}
        />
      ))}
    </Routes>
  );
};

/**
 * Main App component that sets up all necessary context providers and the router.
 */
function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <AdminProvider>
          <FlashcardProvider>
            <SubscriptionProvider>
              <TodoProvider>
                <BrowserRouter>
                  {/* Toaster for displaying notifications */}
                  <Toaster position="top-right" />
                  <AppRoutes />
                </BrowserRouter>
              </TodoProvider>
            </SubscriptionProvider>
          </FlashcardProvider>
        </AdminProvider>
      </ThemeProvider>
    </AuthProvider>
  );
}

export default App;
