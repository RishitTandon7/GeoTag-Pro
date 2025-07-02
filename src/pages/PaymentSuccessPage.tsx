import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { CheckCircle, ArrowRight, Clock, Shield, Zap, RefreshCw, AlertTriangle } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { supabase } from '../lib/supabase';
import { toast } from 'react-hot-toast';
import SubscriptionDebug from '../components/SubscriptionDebug';

const PaymentSuccessPage = () => {
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });
  const { user, setUser, setIsLoading, refreshUserProfile } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const sessionId = searchParams.get('session_id');
  const isUpiPayment = searchParams.get('upi') === 'true';
  const [paymentStatus, setPaymentStatus] = useState<'pending' | 'approved' | 'rejected'>('pending');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showDebug, setShowDebug] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e: MediaQueryListEvent) => {
      setLocalDarkMode(e.matches);
    };
    
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  useEffect(() => {
    const checkPaymentStatus = async () => {
      if (!user) return;

      try {
        // Check if the subscription request exists and has been approved
        const { data: subscriptionRequest, error } = await supabase
          .from('subscription_requests')
          .select('status')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        if (error) {
          console.error('Error checking subscription status:', error);
          return;
        }

        if (subscriptionRequest) {
          setPaymentStatus(subscriptionRequest.status as any);
          
          // If approved, refresh user profile
          if (subscriptionRequest.status === 'approved') {
            await refreshUserProfile();
          }
        }
      } catch (error) {
        console.error('Error checking payment status:', error);
      }
    };

    checkPaymentStatus();
    
    // Set up polling to check status periodically
    const interval = setInterval(checkPaymentStatus, 10000); // Check every 10 seconds
    
    // Set up real-time subscription for updates
    const subscription = supabase
      .channel('subscription-status-changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'subscription_requests',
          filter: `user_id=eq.${user?.id}`
        },
        (payload) => {
          console.log('Change received!', payload);
          if (payload.new && 'status' in payload.new) {
            setPaymentStatus(payload.new.status as any);
            
            // If approved, refresh user profile and show success message
            if (payload.new.status === 'approved') {
              refreshUserProfile();
              toast.success('Your subscription has been approved!');
            } else if (payload.new.status === 'rejected') {
              toast.error('Your subscription request was rejected. Please contact support.');
            }
          }
        }
      )
      .subscribe();
    
    return () => {
      clearInterval(interval);
      subscription.unsubscribe();
    };
  }, [user, refreshUserProfile]);

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refreshUserProfile();
      toast.success('Profile refreshed from database');
    } catch (error) {
      console.error('Error refreshing profile:', error);
      toast.error('Failed to refresh profile');
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <div className={`min-h-screen flex items-center justify-center transition-all duration-300 ${
      isDarkMode 
        ? 'bg-gradient-to-br from-gray-900 to-purple-900' 
        : 'bg-gradient-to-br from-purple-50 to-indigo-100'
    }`}>
      <div className={`max-w-md w-full ${
        isDarkMode ? 'bg-gray-800/80 backdrop-blur-sm' : 'bg-white/90 backdrop-blur-sm'
      } rounded-2xl shadow-2xl p-8 text-center transform hover:scale-[1.01] transition-all duration-300`}>
        <div className="mb-6 relative">
          {paymentStatus === 'pending' && (
            <div className={`absolute inset-0 flex items-center justify-center`}>
              <div className={`w-16 h-16 rounded-full ${
                isDarkMode ? 'bg-yellow-900/50' : 'bg-yellow-100'
              } flex items-center justify-center animate-pulse`}>
                <Clock className={`h-8 w-8 ${
                  isDarkMode ? 'text-yellow-500' : 'text-yellow-600'
                }`} />
              </div>
            </div>
          )}
          
          {paymentStatus === 'approved' && (
            <div className={`absolute inset-0 flex items-center justify-center`}>
              <div className={`w-16 h-16 rounded-full ${
                isDarkMode ? 'bg-green-900/50' : 'bg-green-100'
              } flex items-center justify-center animate-bounce`}>
                <CheckCircle className={`h-8 w-8 ${
                  isDarkMode ? 'text-green-500' : 'text-green-600'
                }`} />
              </div>
            </div>
          )}
          
          {paymentStatus === 'rejected' && (
            <div className={`absolute inset-0 flex items-center justify-center`}>
              <div className={`w-16 h-16 rounded-full ${
                isDarkMode ? 'bg-red-900/50' : 'bg-red-100'
              } flex items-center justify-center`}>
                <Shield className={`h-8 w-8 ${
                  isDarkMode ? 'text-red-500' : 'text-red-600'
                }`} />
              </div>
            </div>
          )}
          
          <div className={`mx-auto h-16 w-16 opacity-0`}>
            {/* Spaceholder for the absolute positioned status icon */}
            <div className="h-full w-full rounded-full"></div>
          </div>
        </div>
        
        <h1 className={`text-2xl font-bold mb-2 ${
          isDarkMode ? 'text-white' : 'text-gray-900'
        }`}>
          {paymentStatus === 'pending' && 'Payment Processing'}
          {paymentStatus === 'approved' && 'Payment Approved!'}
          {paymentStatus === 'rejected' && 'Payment Rejected'}
        </h1>
        
        <div className={`mt-2 mb-4 inline-block px-3 py-1 rounded-full ${
          paymentStatus === 'pending'
            ? isDarkMode ? 'bg-yellow-900/30 text-yellow-300 border border-yellow-800/30' : 'bg-yellow-100 text-yellow-800 border border-yellow-200'
            : paymentStatus === 'approved'
              ? isDarkMode ? 'bg-green-900/30 text-green-300 border border-green-800/30' : 'bg-green-100 text-green-800 border border-green-200'
              : isDarkMode ? 'bg-red-900/30 text-red-300 border border-red-800/30' : 'bg-red-100 text-red-800 border border-red-200'
        }`}>
          <span className="text-sm font-medium flex items-center">
            {paymentStatus === 'pending' && (
              <>
                <Clock className="h-4 w-4 mr-1 animate-pulse" />
                Admin Review Pending
              </>
            )}
            {paymentStatus === 'approved' && (
              <>
                <Zap className="h-4 w-4 mr-1" />
                Premium Activated
              </>
            )}
            {paymentStatus === 'rejected' && (
              <>
                <Shield className="h-4 w-4 mr-1" />
                Verification Failed
              </>
            )}
          </span>
        </div>
        
        <p className={`mb-6 ${
          isDarkMode ? 'text-gray-300' : 'text-gray-600'
        }`}>
          {paymentStatus === 'pending' && 
            'Your payment has been received and is awaiting admin verification. This usually takes less than 24 hours.'}
          {paymentStatus === 'approved' && 
            'Your payment has been verified and your premium subscription is now active.'}
          {paymentStatus === 'rejected' && 
            'Your payment verification was rejected. Please contact support for assistance.'}
        </p>
        
        <div className={`p-4 rounded-lg mb-6 ${
          paymentStatus === 'pending'
            ? isDarkMode ? 'bg-gray-700' : 'bg-gray-50 border border-gray-200'
            : paymentStatus === 'approved'
              ? isDarkMode ? 'bg-green-900/30 border border-green-800/20' : 'bg-green-50 border border-green-200'
              : isDarkMode ? 'bg-red-900/30 border border-red-800/20' : 'bg-red-50 border border-red-200'
        }`}>
          {paymentStatus === 'pending' && (
            <>
              <div className="flex items-center justify-between mb-2">
                <span className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Verification Status:
                </span>
                <span className="inline-flex items-center text-yellow-500">
                  <Clock className="h-3 w-3 mr-1 animate-pulse" />
                  Pending
                </span>
              </div>
              <div className="w-full bg-gray-300 dark:bg-gray-600 h-2 rounded-full overflow-hidden">
                <div className="bg-yellow-500 h-full rounded-full animate-pulse" style={{ width: '30%' }}></div>
              </div>
              <p className={`mt-3 text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                We've received your payment details. An administrator will review and verify your payment shortly.
              </p>
            </>
          )}
          
          {paymentStatus === 'approved' && (
            <div className="space-y-4">
              <p className={`text-sm ${
                isDarkMode ? 'text-gray-300' : 'text-gray-700'
              }`}>
                Your subscription details have been updated. You now have access to all premium features.
              </p>
              
              <div className="flex items-center justify-between">
                <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  Current Profile Status:
                </span>
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                  user?.profile?.subscription_tier === 'premium'
                    ? isDarkMode ? 'bg-green-900/30 text-green-300' : 'bg-green-100 text-green-800'
                    : isDarkMode ? 'bg-yellow-900/30 text-yellow-300' : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {user?.profile?.subscription_tier === 'premium' 
                    ? 'Premium Active' 
                    : 'Status Mismatch'}
                </span>
              </div>
              
              {user?.profile?.subscription_tier !== 'premium' && (
                <div className={`p-3 rounded-md ${
                  isDarkMode ? 'bg-yellow-900/30 border border-yellow-800/30' : 'bg-yellow-50 border border-yellow-200'
                }`}>
                  <div className="flex items-start">
                    <AlertTriangle className={`h-4 w-4 mt-0.5 ${isDarkMode ? 'text-yellow-400' : 'text-yellow-600'} flex-shrink-0`} />
                    <div className="ml-2">
                      <p className={`text-xs ${isDarkMode ? 'text-yellow-300' : 'text-yellow-700'}`}>
                        Your profile hasn't been updated yet. Try refreshing your profile data:
                      </p>
                      <button 
                        onClick={handleManualRefresh}
                        disabled={isRefreshing}
                        className={`mt-2 text-xs flex items-center px-3 py-1 rounded-md ${
                          isDarkMode 
                            ? 'bg-yellow-900/40 hover:bg-yellow-900/60 text-yellow-300' 
                            : 'bg-yellow-200 hover:bg-yellow-300 text-yellow-800'
                        }`}
                      >
                        {isRefreshing ? (
                          <>
                            <Loader className="h-3 w-3 mr-1 animate-spin" />
                            Refreshing...
                          </>
                        ) : (
                          <>
                            <RefreshCw className="h-3 w-3 mr-1" />
                            Refresh Profile
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
          
          {paymentStatus === 'rejected' && (
            <p className={`text-sm ${
              isDarkMode ? 'text-gray-300' : 'text-gray-700'
            }`}>
              If you believe this is an error, please contact our support team with your transaction ID.
            </p>
          )}
        </div>
        
        {/* Debug toggle */}
        <div className="mb-4">
          <button 
            onClick={() => setShowDebug(!showDebug)}
            className={`text-xs px-2 py-1 rounded-md ${
              isDarkMode 
                ? 'bg-gray-700 hover:bg-gray-600 text-gray-300' 
                : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
            }`}
          >
            {showDebug ? 'Hide Details' : 'Show Details'}
          </button>
        </div>
        
        {showDebug && (
          <SubscriptionDebug isDarkMode={isDarkMode} />
        )}
        
        <div className="space-y-4">
          <Link 
            to="/profile"
            className={`block w-full py-3 rounded-xl font-medium flex items-center justify-center transition-all duration-300 transform hover:translate-y-[-2px] ${
              isDarkMode
                ? 'bg-gradient-to-r from-purple-600 to-indigo-700 text-white shadow-lg shadow-purple-700/30'
                : 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg shadow-indigo-700/20'
            }`}
          >
            View Subscription Details
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
          
          <Link 
            to="/"
            className={`block w-full py-3 rounded-xl font-medium transition-colors ${
              isDarkMode
                ? 'bg-gray-700 hover:bg-gray-600 text-gray-200'
                : 'bg-gray-100 hover:bg-gray-200 text-gray-800'
            }`}
          >
            Go to Editor
          </Link>
        </div>
      </div>
    </div>
  );
};

export default PaymentSuccessPage;