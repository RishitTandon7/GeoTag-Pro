import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/authStore';
import { Loader, Zap } from 'lucide-react';
import toast from 'react-hot-toast';

interface FixSubscriptionButtonProps {
  isDarkMode?: boolean;
  userId?: string;
  email?: string;
}

const FixSubscriptionButton: React.FC<FixSubscriptionButtonProps> = ({ 
  isDarkMode = false, 
  userId,
  email
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const { user, refreshUserProfile } = useAuthStore();
  
  // Use provided user ID/email or fall back to current user
  const targetEmail = email || user?.email;
  
  const handleFixSubscription = async () => {
    if (!targetEmail) {
      toast.error('No user email available');
      return;
    }
    
    setIsLoading(true);
    try {
      // First try direct RPC function call
      console.log('Fixing subscription for:', targetEmail);
      
      // Call the database function to fix the user's subscription
      const { data, error } = await supabase.rpc('fix_user_subscription', {
        user_email: targetEmail,
        new_tier: 'premium',
        new_status: 'active',
        duration_months: 1
      });
      
      if (error) {
        console.error('Error from RPC function:', error);
        
        // Fallback to direct update if RPC function fails
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('id')
          .eq('email', targetEmail)
          .single();
          
        if (profileError) throw profileError;
        
        const userId = profileData.id;
        
        // Calculate dates
        const startDate = new Date();
        const endDate = new Date();
        endDate.setMonth(endDate.getMonth() + 1);
        
        // Update profile directly
        const { error: updateError } = await supabase
          .from('profiles')
          .update({
            subscription_tier: 'premium',
            subscription_status: 'active',
            subscription_start_date: startDate.toISOString(),
            subscription_end_date: endDate.toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('id', userId);
          
        if (updateError) throw updateError;
        
        toast.success('Subscription fixed using direct update');
      } else {
        // Show success message
        toast.success('Subscription fixed successfully');
        console.log('Fix result:', data);
      }
      
      // Refresh user profile if this is the current user
      if (user?.email === targetEmail) {
        await refreshUserProfile();
      }
      
    } catch (error: any) {
      console.error('Error fixing subscription:', error);
      toast.error(`Failed to fix subscription: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <button
      onClick={handleFixSubscription}
      disabled={isLoading || !targetEmail}
      className={`px-3 py-1.5 text-sm rounded-md flex items-center ${
        isDarkMode 
          ? 'bg-purple-700 hover:bg-purple-600 text-white' 
          : 'bg-purple-600 hover:bg-purple-700 text-white'
      } transition-colors disabled:opacity-50 disabled:cursor-not-allowed`}
    >
      {isLoading ? (
        <Loader className="h-3 w-3 mr-2 animate-spin" />
      ) : (
        <Zap className="h-3 w-3 mr-2" />
      )}
      Fix Subscription
    </button>
  );
};

export default FixSubscriptionButton;