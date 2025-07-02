import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CreditCard, Calendar, CheckCircle, AlertTriangle, Lock, Award, Heart, Zap, Loader, Smartphone } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';
import SubscriptionDebug from '../components/SubscriptionDebug';
import FixSubscriptionButton from '../components/FixSubscriptionButton';

const SubscriptionPage = () => {
  const { user } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  const [isCanceling, setIsCanceling] = useState(false);
  const [isYearly, setIsYearly] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });
  const navigate = useNavigate();

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e: MediaQueryListEvent) => {
      setIsDarkMode(e.matches);
    };
    
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  const handleCheckout = () => {
    if (!user) {
      toast.error('You must be logged in to subscribe');
      navigate('/login');
      return;
    }
    
    if (user.profile?.subscription_tier === 'premium') {
      toast.info('You already have a premium subscription');
      return;
    }
    
    // Navigate to UPI payment page
    navigate(`/upi-payment?plan=${isYearly ? 'yearly' : 'monthly'}`);
  };

  const handleCancelSubscription = async () => {
    if (!user || !user.profile?.subscription_id) {
      toast.error('No active subscription to cancel');
      return;
    }
    
    setIsCanceling(true);
    
    try {
      // Call your backend to cancel the subscription
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/cancel-razorpay-subscription`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
        },
        body: JSON.stringify({
          subscriptionId: user.profile.subscription_id
        })
      });
      
      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }
      
      toast.success(data.message || 'Subscription canceled successfully');
      
      // Refresh user data
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();
        
        // This would be handled by your auth store in a real app
        // For this example, we'll navigate to the profile page to reload the data
        navigate('/profile');
      }
    } catch (error: any) {
      toast.error(error.message || 'Error canceling subscription');
      console.error('Error canceling subscription:', error);
    } finally {
      setIsCanceling(false);
    }
  };

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="mb-8">
          <h1 className={`text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Subscription</h1>
          <p className={`mt-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
            Manage your GeoTag Pro subscription
          </p>
        </div>
        
        {/* Current Plan */}
        <div className={`rounded-lg shadow-md overflow-hidden mb-8 ${
          isDarkMode ? 'bg-gray-800' : 'bg-white'
        }`}>
          <div className={`p-6 border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
            <h2 className={`text-xl font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              Current Plan
            </h2>
          </div>
          
          <div className="p-6">
            <div className={`p-4 rounded-lg mb-6 ${
              user?.profile?.subscription_tier === 'premium'
                ? isDarkMode ? 'bg-purple-900/20' : 'bg-purple-50'
                : user?.profile?.subscription_tier === 'friend'
                  ? isDarkMode ? 'bg-pink-900/20' : 'bg-pink-50'
                  : isDarkMode ? 'bg-gray-700' : 'bg-gray-100'
            }`}>
              <div className="flex items-start">
                {user?.profile?.subscription_tier === 'premium' ? (
                  <Award className={`h-6 w-6 ${isDarkMode ? 'text-purple-400' : 'text-purple-600'}`} />
                ) : user?.profile?.subscription_tier === 'friend' ? (
                  <Heart className={`h-6 w-6 ${isDarkMode ? 'text-pink-400' : 'text-pink-600'}`} />
                ) : (
                  <Zap className={`h-6 w-6 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`} />
                )}
                
                <div className="ml-4 flex-1">
                  <h3 className={`text-lg font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    {user?.profile?.subscription_tier === 'premium'
                      ? 'Premium Plan'
                      : user?.profile?.subscription_tier === 'friend'
                        ? 'Friend Plan'
                        : 'Free Plan'}
                  </h3>
                  
                  {user?.profile?.subscription_tier === 'premium' && (
                    <div className="mt-1 space-y-2">
                      <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                        <Calendar className="h-4 w-4 inline mr-1" />
                        {user.profile?.subscription_status === 'active'
                          ? `Renews on ${user.profile?.subscription_end_date 
                              ? new Date(user.profile.subscription_end_date).toLocaleDateString() 
                              : 'N/A'}`
                          : 'Canceled'}
                      </p>
                      
                      <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                        <Smartphone className="h-4 w-4 inline mr-1" />
                        Payment Method: UPI
                      </p>
                      
                      <div className="mt-4">
                        {user.profile?.subscription_status === 'active' ? (
                          <button
                            onClick={handleCancelSubscription}
                            disabled={isCanceling}
                            className={`px-4 py-2 border rounded-md text-sm font-medium ${
                              isDarkMode
                                ? 'border-gray-600 text-gray-300 hover:bg-gray-700'
                                : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                            }`}
                          >
                            {isCanceling ? (
                              <>
                                <Loader className="animate-spin h-4 w-4 inline mr-1" />
                                Canceling...
                              </>
                            ) : (
                              'Cancel Subscription'
                            )}
                          </button>
                        ) : (
                          <div className={`text-sm font-medium ${isDarkMode ? 'text-amber-400' : 'text-amber-600'}`}>
                            <AlertTriangle className="h-4 w-4 inline mr-1" />
                            Your subscription will end on {user.profile?.subscription_end_date 
                              ? new Date(user.profile.subscription_end_date).toLocaleDateString() 
                              : 'N/A'}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                  
                  {user?.profile?.subscription_tier === 'friend' && (
                    <div className="mt-1">
                      <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                        You have special friend access. Enjoy all premium features for free!
                      </p>
                    </div>
                  )}
                  
                  {user?.profile?.subscription_tier === 'free' && (
                    <div className="mt-1">
                      <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                        Basic features with limited functionality
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            {user?.profile?.subscription_tier !== 'premium' && (
              <div className="mb-6">
                <div className="text-center inline-flex items-center p-1 bg-purple-100 dark:bg-gray-800 rounded-full w-full max-w-xs mx-auto">
                  <button
                    onClick={() => setIsYearly(false)}
                    className={`py-2 px-4 rounded-full text-sm font-medium transition-colors flex-1 ${
                      !isYearly 
                        ? 'bg-purple-600 text-white' 
                        : 'text-purple-700 dark:text-gray-300'
                    }`}
                  >
                    Monthly
                  </button>
                  <button
                    onClick={() => setIsYearly(true)}
                    className={`py-2 px-4 rounded-full text-sm font-medium transition-colors flex-1 ${
                      isYearly 
                        ? 'bg-purple-600 text-white' 
                        : 'text-purple-700 dark:text-gray-300'
                    }`}
                  >
                    Yearly <span className="text-xs font-bold ml-1 opacity-90">Save 20%</span>
                  </button>
                </div>
              </div>
            )}
            
            {user?.profile?.subscription_tier === 'free' && (
              <div className={`rounded-lg border ${isDarkMode ? 'border-gray-700' : 'border-purple-200'} overflow-hidden mb-6`}>
                <div className={`p-6 ${isDarkMode ? 'bg-purple-900/10' : 'bg-purple-50'}`}>
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className={`text-xl font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                        Premium Plan
                      </h3>
                      <p className={`mt-1 text-sm ${isDarkMode ? 'text-purple-300' : 'text-purple-700'}`}>
                        Unlock all premium features
                      </p>
                    </div>
                    <div className="text-right">
                      <div className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                        ₹{isYearly ? '480' : '50'}
                      </div>
                      <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        {isYearly ? 'per year' : 'per month'}
                      </div>
                      {isYearly && (
                        <div className="text-sm text-green-600 font-medium mt-1">
                          Save ₹120 yearly
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="p-6">
                  <ul className="space-y-3">
                    <li className="flex items-start">
                      <CheckCircle className={`h-5 w-5 mt-0.5 ${isDarkMode ? 'text-purple-400' : 'text-purple-600'}`} />
                      <span className={`ml-3 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                        Unlimited photo uploads
                      </span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className={`h-5 w-5 mt-0.5 ${isDarkMode ? 'text-purple-400' : 'text-purple-600'}`} />
                      <span className={`ml-3 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                        Advanced watermark options
                      </span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className={`h-5 w-5 mt-0.5 ${isDarkMode ? 'text-purple-400' : 'text-purple-600'}`} />
                      <span className={`ml-3 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                        Priority support
                      </span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className={`h-5 w-5 mt-0.5 ${isDarkMode ? 'text-purple-400' : 'text-purple-600'}`} />
                      <span className={`ml-3 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                        No GeoTag Pro logo on exports
                      </span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className={`h-5 w-5 mt-0.5 ${isDarkMode ? 'text-purple-400' : 'text-purple-600'}`} />
                      <span className={`ml-3 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                        API access for developers
                      </span>
                    </li>
                  </ul>
                  
                  <div className="mt-6">
                    <button
                      onClick={handleCheckout}
                      disabled={isLoading}
                      className="w-full py-2 px-4 bg-purple-600 hover:bg-purple-700 text-white rounded-md flex items-center justify-center"
                    >
                      {isLoading ? (
                        <>
                          <Loader className="animate-spin h-4 w-4 mr-2" />
                          Processing...
                        </>
                      ) : (
                        <>
                          <Smartphone className="h-4 w-4 mr-2" />
                          Pay with UPI
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )}
            
            {user?.profile?.subscription_tier === 'friend' && (
              <div className={`rounded-lg border ${isDarkMode ? 'border-gray-700' : 'border-pink-200'} overflow-hidden mb-6`}>
                <div className={`p-6 ${isDarkMode ? 'bg-pink-900/10' : 'bg-pink-50'}`}>
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className={`text-xl font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                        Friend Plan
                      </h3>
                      <p className={`mt-1 text-sm ${isDarkMode ? 'text-pink-300' : 'text-pink-700'}`}>
                        Special access for friends
                      </p>
                    </div>
                    <div className="text-right">
                      <div className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                        ₹0
                      </div>
                      <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        Forever free
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="p-6">
                  <ul className="space-y-3">
                    <li className="flex items-start">
                      <CheckCircle className={`h-5 w-5 mt-0.5 ${isDarkMode ? 'text-pink-400' : 'text-pink-600'}`} />
                      <span className={`ml-3 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                        All premium features included
                      </span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className={`h-5 w-5 mt-0.5 ${isDarkMode ? 'text-pink-400' : 'text-pink-600'}`} />
                      <span className={`ml-3 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                        Friend-only support
                      </span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className={`h-5 w-5 mt-0.5 ${isDarkMode ? 'text-pink-400' : 'text-pink-600'}`} />
                      <span className={`ml-3 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                        No credit card required
                      </span>
                    </li>
                  </ul>
                  
                  <div className={`mt-6 p-4 rounded-md ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                    <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      <Heart className="h-4 w-4 inline mr-1 text-pink-500" />
                      Thanks for being a friend of Rishit Tandon! Your special access is already activated.
                    </p>
                  </div>
                </div>
              </div>
            )}
            
            {/* UPI Payment Info */}
            <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-blue-900/20 border border-blue-800' : 'bg-blue-50 border border-blue-200'}`}>
              <h3 className={`text-sm font-medium ${isDarkMode ? 'text-blue-300' : 'text-blue-800'}`}>
                Direct UPI Payment
              </h3>
              <p className={`mt-2 text-xs ${isDarkMode ? 'text-blue-400' : 'text-blue-700'}`}>
                We use direct UPI integration which is perfect for students and small projects. No payment gateway fees or business verification required.
              </p>
            </div>
            
            {/* Subscription Debug Component */}
            <SubscriptionDebug isDarkMode={isDarkMode} />
          </div>
        </div>
        
        {/* Payment History */}
        {user?.profile?.subscription_tier === 'premium' && (
          <div className={`rounded-lg shadow-md overflow-hidden ${
            isDarkMode ? 'bg-gray-800' : 'bg-white'
          }`}>
            <div className={`p-6 border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
              <h2 className={`text-xl font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                Payment History
              </h2>
              <p className={`mt-1 text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                View your payment history
              </p>
            </div>
            
            <div className="p-6">
              <div className={`p-4 rounded-lg border ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                <div className="flex justify-between items-center">
                  <div className="flex items-center">
                    <div className={`h-10 w-10 rounded-md ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'} flex items-center justify-center`}>
                      <Smartphone className={`h-6 w-6 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`} />
                    </div>
                    <div className="ml-3">
                      <p className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                        UPI Payment
                      </p>
                      <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        {user?.profile?.subscription_start_date
                          ? new Date(user.profile?.subscription_start_date).toLocaleDateString()
                          : 'Recent payment'}
                      </p>
                    </div>
                  </div>
                  <div className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    ₹{user?.profile?.price_id === 'yearly' ? '480.00' : '50.00'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SubscriptionPage;