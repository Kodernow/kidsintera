import React, { createContext, useContext, useState, useEffect } from 'react';
import { Plan, UserSubscription, Coupon } from '../types';
import { useAuth } from './AuthContext';
import { useAdmin } from './AdminContext';
import { supabase, checkTableExists } from '../lib/supabase';
import toast from 'react-hot-toast';

interface SubscriptionContextType {
  currentSubscription: UserSubscription | null;
  currentPlan: Plan | null;
  availablePlans: Plan[];
  applyCoupon: (couponCode: string, planId: string) => Promise<{ discountedPrice: number; coupon: Coupon } | null>;
  upgradePlan: (planId: string, couponId?: string) => Promise<void>;
  cancelSubscription: () => Promise<void>;
  isFeatureEnabled: (feature: keyof Plan['features']) => boolean;
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

export const useSubscription = () => {
  const context = useContext(SubscriptionContext);
  if (!context) {
    throw new Error('useSubscription must be used within a SubscriptionProvider');
  }
  return context;
};

export const SubscriptionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const { plans, getCouponByCode } = useAdmin();
  const [currentSubscription, setCurrentSubscription] = useState<UserSubscription | null>(null);
  const [loading, setLoading] = useState(true);

  const availablePlans = plans.filter(plan => plan.isActive);
  
  const currentPlan = currentSubscription 
    ? plans.find(plan => plan.id === currentSubscription.planId) || null
    : plans.find(plan => plan.name === 'Free') || null; // Default to free plan

  // Load subscription from Supabase
  const loadSubscription = async () => {
    if (!user) {
      setCurrentSubscription(null);
      setLoading(false);
      return;
    }

    // Check if the table exists first
    const tableExists = await checkTableExists('user_subscriptions');
    if (!tableExists) {
      console.warn('user_subscriptions table does not exist, using localStorage');
      try {
        const savedSubscription = localStorage.getItem(`subscription_${user.id}`);
        if (savedSubscription) {
          setCurrentSubscription(JSON.parse(savedSubscription));
        } else {
          // Create default free subscription
          const freePlan = plans.find(plan => plan.name === 'Free');
          if (freePlan) {
            const defaultSubscription: UserSubscription = {
              id: `sub_${user.id}`,
              userId: user.id,
              planId: freePlan.id,
              status: 'active',
              startDate: Date.now(),
              endDate: Date.now() + (365 * 24 * 60 * 60 * 1000), // 1 year
              createdAt: Date.now(),
              updatedAt: Date.now(),
            };
            setCurrentSubscription(defaultSubscription);
            localStorage.setItem(`subscription_${user.id}`, JSON.stringify(defaultSubscription));
          }
        }
        toast('Using local subscription data. Database tables not found.', { icon: '⚠️' });
      } catch {
        // Use default free plan
        const freePlan = plans.find(plan => plan.name === 'Free');
        if (freePlan) {
          const defaultSubscription: UserSubscription = {
            id: `sub_${user.id}`,
            userId: user.id,
            planId: freePlan.id,
            status: 'active',
            startDate: Date.now(),
            endDate: Date.now() + (365 * 24 * 60 * 60 * 1000), // 1 year
            createdAt: Date.now(),
            updatedAt: Date.now(),
          };
          setCurrentSubscription(defaultSubscription);
        }
      }
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('user_subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        throw error;
      }

      if (data) {
        const subscription: UserSubscription = {
          id: data.id,
          userId: data.user_id,
          planId: data.plan_id,
          status: data.status,
          startDate: new Date(data.start_date).getTime(),
          endDate: data.end_date ? new Date(data.end_date).getTime() : Date.now() + (365 * 24 * 60 * 60 * 1000),
          createdAt: new Date(data.created_at).getTime(),
          updatedAt: new Date(data.updated_at).getTime(),
        };
        setCurrentSubscription(subscription);
      } else {
        // Create default free subscription
        const freePlan = plans.find(plan => plan.name === 'Free');
        if (freePlan) {
          const defaultSubscription: UserSubscription = {
            id: `sub_${user.id}`,
            userId: user.id,
            planId: freePlan.id,
            status: 'active',
            startDate: Date.now(),
            endDate: Date.now() + (365 * 24 * 60 * 60 * 1000), // 1 year
            createdAt: Date.now(),
            updatedAt: Date.now(),
          };
          
          // Save to Supabase
          await supabase
            .from('user_subscriptions')
            .insert({
              id: defaultSubscription.id,
              user_id: defaultSubscription.userId,
              plan_id: defaultSubscription.planId,
              status: defaultSubscription.status,
              start_date: new Date(defaultSubscription.startDate).toISOString(),
              end_date: new Date(defaultSubscription.endDate).toISOString(),
            });
          
          setCurrentSubscription(defaultSubscription);
        }
      }
    } catch (error: any) {
      console.error('Error loading subscription:', error);
      
      // Fallback to localStorage
      try {
        const savedSubscription = localStorage.getItem(`subscription_${user.id}`);
        if (savedSubscription) {
          setCurrentSubscription(JSON.parse(savedSubscription));
          toast.error('Using offline subscription data. Please check your connection.');
        } else {
          // Create default free subscription
          const freePlan = plans.find(plan => plan.name === 'Free');
          if (freePlan) {
            const defaultSubscription: UserSubscription = {
              id: `sub_${user.id}`,
              userId: user.id,
              planId: freePlan.id,
              status: 'active',
              startDate: Date.now(),
              endDate: Date.now() + (365 * 24 * 60 * 60 * 1000), // 1 year
              createdAt: Date.now(),
              updatedAt: Date.now(),
            };
            setCurrentSubscription(defaultSubscription);
            localStorage.setItem(`subscription_${user.id}`, JSON.stringify(defaultSubscription));
          }
        }
      } catch {
        // Use default free plan
        const freePlan = plans.find(plan => plan.name === 'Free');
        if (freePlan) {
          const defaultSubscription: UserSubscription = {
            id: `sub_${user.id}`,
            userId: user.id,
            planId: freePlan.id,
            status: 'active',
            startDate: Date.now(),
            endDate: Date.now() + (365 * 24 * 60 * 60 * 1000), // 1 year
            createdAt: Date.now(),
            updatedAt: Date.now(),
          };
          setCurrentSubscription(defaultSubscription);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  // Migrate localStorage subscription to Supabase
  const migrateSubscription = async () => {
    if (!user) return;

    try {
      const savedSubscription = localStorage.getItem(`subscription_${user.id}`);
      if (savedSubscription) {
        const subscription = JSON.parse(savedSubscription);
        
        await supabase
          .from('user_subscriptions')
          .upsert({
            id: subscription.id,
            user_id: subscription.userId,
            plan_id: subscription.planId,
            status: subscription.status,
            start_date: new Date(subscription.startDate).toISOString(),
            end_date: subscription.endDate ? new Date(subscription.endDate).toISOString() : null,
          });
        
        // Remove from localStorage after successful migration
        localStorage.removeItem(`subscription_${user.id}`);
        toast.success('Migrated subscription data to cloud storage');
      }
    } catch (error) {
      console.error('Error migrating subscription:', error);
    }
  };

  useEffect(() => {
    if (user) {
      loadSubscription().then(() => {
        // Auto-migrate on first load
        migrateSubscription();
      });
    } else {
      setCurrentSubscription(null);
      setLoading(false);
    }
  }, [user]);

  const applyCoupon = async (couponCode: string, planId: string) => {
    const coupon = getCouponByCode(couponCode);
    if (!coupon) {
      toast.error('Invalid or expired coupon code');
      return null;
    }

    if (!coupon.applicablePlans.includes(planId)) {
      toast.error('This coupon is not applicable to the selected plan');
      return null;
    }

    const plan = plans.find(p => p.id === planId);
    if (!plan) {
      toast.error('Plan not found');
      return null;
    }

    const discountedPrice = plan.price * (1 - coupon.discountPercentage / 100);
    toast.success(`Coupon applied! ${coupon.discountPercentage}% discount`);
    
    return { discountedPrice, coupon };
  };

  const upgradePlan = async (planId: string, couponId?: string) => {
    if (!user) {
      toast.error('Please sign in to upgrade your plan');
      return;
    }

    const plan = plans.find(p => p.id === planId);
    if (!plan) {
      toast.error('Plan not found');
      return;
    }

    try {
      // Create new subscription
      const newSubscription: UserSubscription = {
        id: `sub_${user.id}_${Date.now()}`,
        userId: user.id,
        planId: plan.id,
        status: 'active',
        startDate: Date.now(),
        endDate: Date.now() + (plan.billingPeriod === 'yearly' ? 365 : 30) * 24 * 60 * 60 * 1000,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      // Save to Supabase
      const { error } = await supabase
        .from('user_subscriptions')
        .upsert({
          id: newSubscription.id,
          user_id: newSubscription.userId,
          plan_id: newSubscription.planId,
          status: newSubscription.status,
          start_date: new Date(newSubscription.startDate).toISOString(),
          end_date: new Date(newSubscription.endDate).toISOString(),
        });

      if (error) throw error;

      setCurrentSubscription(newSubscription);
      
      // Also save to localStorage as backup
      localStorage.setItem(`subscription_${user.id}`, JSON.stringify(newSubscription));
      
      toast.success(`Successfully upgraded to ${plan.name} plan!`);
    } catch (error: any) {
      console.error('Error upgrading plan:', error);
      toast.error('Failed to upgrade plan');
    }
  };

  const cancelSubscription = async () => {
    if (!currentSubscription) return;

    try {
      const updatedSubscription = {
        ...currentSubscription,
        status: 'cancelled' as const,
        updatedAt: Date.now(),
      };

      // Update in Supabase
      const { error } = await supabase
        .from('user_subscriptions')
        .update({
          status: 'cancelled',
          updated_at: new Date().toISOString(),
        })
        .eq('id', currentSubscription.id);

      if (error) throw error;

      setCurrentSubscription(updatedSubscription);
      
      // Also save to localStorage as backup
      localStorage.setItem(`subscription_${user?.id}`, JSON.stringify(updatedSubscription));
      
      toast('Data saved locally. Will sync when connection is restored.', { icon: '⚠️' });
    } catch (error: any) {
      console.error('Error cancelling subscription:', error);
      toast.error('Failed to cancel subscription');
    }
  };

  const isFeatureEnabled = (feature: keyof Plan['features']) => {
    if (!currentPlan) return false;
    return currentPlan.features[feature];
  };

  return (
    <SubscriptionContext.Provider
      value={{
        loading,
        currentSubscription,
        currentPlan,
        availablePlans,
        applyCoupon,
        upgradePlan,
        cancelSubscription,
        isFeatureEnabled,
      }}
    >
      {children}
    </SubscriptionContext.Provider>
  );
};