import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Check, 
  X, 
  Heart, 
  Award, 
  Shield, 
  Zap, 
  MapPin, 
  Globe, 
  Image, 
  CloudLightning, 
  Loader,
  AlertTriangle,
  CreditCard,
  Smartphone
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

// Load Razorpay script dynamically
const loadRazorpayScript = () => {
  return new Promise<boolean>((resolve) => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

const PricingPage = () => {
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });

  const [isYearly, setIsYearly] = useState(false);
  const [showFriendsCode, setShowFriendsCode] = useState(false);
  const [friendCode, setFriendCode] = useState('');
  const [codeValid, setCodeValid] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isRedeemingCode, setIsRedeemingCode] = useState(false);
  const { user, hasSubscription, isFriend, isPremium } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e: MediaQueryListEvent) => {
      setIsDarkMode(e.matches);
    };
    
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  const handleCodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast.error('You need to be logged in to redeem a friend code');
      navigate('/login');
      return;
    }
    
    if (!friendCode) {
      toast.error('Please enter a friend code');
      return;
    }
    
    setIsRedeemingCode(true);
    
    try {
      // Call the redeem-friend-code edge function
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/redeem-friend-code`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
        },
        body: JSON.stringify({ code: friendCode })
      });
      
      const data = await response.json();
      
      if (data.error) {
        setCodeValid(false);
        toast.error(data.error);
      } else {
        setCodeValid(true);
        toast.success('Friend code redeemed successfully!');
        
        // Refresh user data to get updated subscription status
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          const { data: profileData } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();
          
          // This would be handled by your auth store
          // For this example, we'll navigate to the profile page to reload the data
          navigate('/profile');
        }
      }
    } catch (error: any) {
      setCodeValid(false);
      toast.error(error.message || 'Failed to redeem code');
      console.error('Error redeeming code:', error);
    } finally {
      setIsRedeemingCode(false);
    }
  };

  const handleCheckout = async () => {
    if (!user) {
      toast.error('You must be logged in to subscribe');
      navigate('/login');
      return;
    }
    
    if (isPremium()) {
      toast.info('You already have a premium subscription');
      navigate('/subscription');
      return;
    }
    
    // Direct to UPI payment page with plan parameter
    navigate(`/upi-payment?plan=${isYearly ? 'yearly' : 'monthly'}`);
  };

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'} transition-colors duration-200`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h1 className={`text-4xl font-bold mb-6 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            Simple, Transparent Pricing
          </h1>
          <p className={`text-xl ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
            Choose the plan that's right for you and start enhancing your photos with precise location data.
          </p>
          
          <div className="mt-8 inline-flex items-center p-1 bg-purple-100 dark:bg-gray-800 rounded-full">
            <button
              onClick={() => setIsYearly(false)}
              className={`py-2 px-6 rounded-full text-sm font-medium transition-colors ${
                !isYearly 
                  ? 'bg-purple-600 text-white' 
                  : 'text-purple-700 dark:text-gray-300'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setIsYearly(true)}
              className={`py-2 px-6 rounded-full text-sm font-medium transition-colors ${
                isYearly 
                  ? 'bg-purple-600 text-white' 
                  : 'text-purple-700 dark:text-gray-300'
              }`}
            >
              Yearly <span className="text-xs font-bold ml-1 opacity-90">Save 20%</span>
            </button>
          </div>
        </div>
        
        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {/* Free Plan - For Friends */}
          <div className={`rounded-2xl overflow-hidden ${
            isDarkMode 
              ? 'bg-gray-800 border border-gray-700' 
              : 'bg-white border border-purple-100'
          } shadow-xl transition-transform hover:scale-105`}>
            <div className="p-8">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    Friends Plan
                  </h2>
                  <p className={`mt-1 ${isDarkMode ? 'text-purple-300' : 'text-purple-600'}`}>
                    For close friends only
                  </p>
                </div>
                <div className="h-16 w-16 flex items-center justify-center bg-purple-100 dark:bg-purple-900/30 rounded-full">
                  <Heart className="h-8 w-8 text-purple-600 dark:text-purple-400" />
                </div>
              </div>
              
              <div className="mb-6">
                <span className="text-4xl font-bold">₹0</span>
                <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'} ml-2`}>
                  Forever
                </span>
              </div>
              
              <div className={`py-4 px-6 mb-6 rounded-lg ${
                isDarkMode ? 'bg-gray-700' : 'bg-purple-50'
              }`}>
                <div className="flex items-center">
                  <svg className="h-6 w-6 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className={`ml-2 text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Requires a special friend code to activate
                  </p>
                </div>
              </div>
              
              <div className="space-y-4 mb-6">
                <div className="flex items-start">
                  <Check className={`h-5 w-5 mt-0.5 ${isDarkMode ? 'text-purple-400' : 'text-purple-600'} flex-shrink-0`} />
                  <span className={`ml-3 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                    Full access to all features
                  </span>
                </div>
                <div className="flex items-start">
                  <Check className={`h-5 w-5 mt-0.5 ${isDarkMode ? 'text-purple-400' : 'text-purple-600'} flex-shrink-0`} />
                  <span className={`ml-3 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                    Unlimited photo uploads
                  </span>
                </div>
                <div className="flex items-start">
                  <Check className={`h-5 w-5 mt-0.5 ${isDarkMode ? 'text-purple-400' : 'text-purple-600'} flex-shrink-0`} />
                  <span className={`ml-3 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                    Custom watermark settings
                  </span>
                </div>
                <div className="flex items-start">
                  <Check className={`h-5 w-5 mt-0.5 ${isDarkMode ? 'text-purple-400' : 'text-purple-600'} flex-shrink-0`} />
                  <span className={`ml-3 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                    Advanced location search
                  </span>
                </div>
                <div className="flex items-start">
                  <Check className={`h-5 w-5 mt-0.5 ${isDarkMode ? 'text-purple-400' : 'text-purple-600'} flex-shrink-0`} />
                  <span className={`ml-3 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                    Friend-only support
                  </span>
                </div>
              </div>

              {isFriend() ? (
                <div className={`py-3 px-4 rounded-lg text-center font-medium ${
                  isDarkMode ? 'bg-purple-900/30 text-purple-300' : 'bg-purple-100 text-purple-700'
                }`}>
                  <Heart className="h-4 w-4 inline mr-2 animate-pulse" />
                  You're using the Friend Plan
                </div>
              ) : !showFriendsCode ? (
                <button
                  onClick={() => setShowFriendsCode(true)}
                  className="w-full py-3 px-4 rounded-lg font-medium bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300 hover:bg-purple-200 dark:hover:bg-purple-900/50 transition-colors"
                >
                  Have a Friend Code?
                </button>
              ) : (
                <form onSubmit={handleCodeSubmit} className="space-y-3">
                  <div className="relative">
                    <input
                      type="text"
                      value={friendCode}
                      onChange={(e) => setFriendCode(e.target.value)}
                      placeholder="Enter your friend code"
                      className={`w-full py-3 px-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                        isDarkMode 
                          ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                          : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
                      } border`}
                    />
                  </div>
                  {codeValid !== null && (
                    <div className={`text-sm ${codeValid ? 'text-green-500' : 'text-red-500'}`}>
                      {codeValid 
                        ? 'Valid code! You can now access the Friends Plan.' 
                        : 'Invalid code. Please try again or contact Rishit for a valid code.'}
                    </div>
                  )}
                  <button
                    type="submit"
                    disabled={isRedeemingCode}
                    className="w-full py-3 px-4 rounded-lg font-medium bg-purple-600 text-white hover:bg-purple-700 transition-colors disabled:opacity-70 flex items-center justify-center"
                  >
                    {isRedeemingCode ? (
                      <>
                        <Loader className="animate-spin h-4 w-4 mr-2" />
                        Activating...
                      </>
                    ) : (
                      'Activate Plan'
                    )}
                  </button>
                </form>
              )}
            </div>
          </div>

          {/* Premium Plan */}
          <div className={`rounded-2xl overflow-hidden ${
            isDarkMode 
              ? 'bg-gray-800 border-2 border-purple-600' 
              : 'bg-white border-2 border-purple-600'
          } shadow-xl relative transition-transform hover:scale-105`}>
            {/* Popular badge */}
            <div className="absolute top-0 right-0">
              <div className="bg-gradient-to-r from-purple-600 to-purple-400 text-white text-xs font-bold py-1 px-4 rounded-bl-lg">
                MOST POPULAR
              </div>
            </div>
            
            <div className="p-8">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    Premium Plan
                  </h2>
                  <p className={`mt-1 ${isDarkMode ? 'text-purple-300' : 'text-purple-600'}`}>
                    Enhanced features & support
                  </p>
                </div>
                <div className="h-16 w-16 flex items-center justify-center bg-purple-100 dark:bg-purple-900/30 rounded-full">
                  <Award className="h-8 w-8 text-purple-600 dark:text-purple-400" />
                </div>
              </div>
              
              <div className="mb-6">
                <span className="text-4xl font-bold">₹{isYearly ? '480' : '50'}</span>
                <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'} ml-2`}>
                  {isYearly ? '/ year' : '/ month'}
                </span>
                {isYearly && (
                  <span className="ml-2 text-sm font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 py-0.5 px-2 rounded-full">
                    Save ₹120
                  </span>
                )}
              </div>
              
              <div className={`py-4 px-6 mb-6 rounded-lg ${
                isDarkMode ? 'bg-purple-900/20' : 'bg-purple-50'
              }`}>
                <div className="flex items-center">
                  <Zap className={`h-5 w-5 ${isDarkMode ? 'text-purple-400' : 'text-purple-600'}`} />
                  <p className={`ml-2 text-sm font-medium ${isDarkMode ? 'text-purple-300' : 'text-purple-700'}`}>
                    All features unlocked, plus premium support
                  </p>
                </div>
              </div>
              
              <div className="space-y-4 mb-6">
                <div className="flex items-start">
                  <Check className={`h-5 w-5 mt-0.5 ${isDarkMode ? 'text-purple-400' : 'text-purple-600'} flex-shrink-0`} />
                  <span className={`ml-3 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                    <strong>Everything in Friends Plan</strong>, plus:
                  </span>
                </div>
                <div className="flex items-start">
                  <Check className={`h-5 w-5 mt-0.5 ${isDarkMode ? 'text-purple-400' : 'text-purple-600'} flex-shrink-0`} />
                  <span className={`ml-3 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                    Priority customer support
                  </span>
                </div>
                <div className="flex items-start">
                  <Check className={`h-5 w-5 mt-0.5 ${isDarkMode ? 'text-purple-400' : 'text-purple-600'} flex-shrink-0`} />
                  <span className={`ml-3 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                    Early access to new features
                  </span>
                </div>
                <div className="flex items-start">
                  <Check className={`h-5 w-5 mt-0.5 ${isDarkMode ? 'text-purple-400' : 'text-purple-600'} flex-shrink-0`} />
                  <span className={`ml-3 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                    Advanced watermark options
                  </span>
                </div>
                <div className="flex items-start">
                  <Check className={`h-5 w-5 mt-0.5 ${isDarkMode ? 'text-purple-400' : 'text-purple-600'} flex-shrink-0`} />
                  <span className={`ml-3 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                    No GeoTag Pro logo on exports
                  </span>
                </div>
                <div className="flex items-start">
                  <Check className={`h-5 w-5 mt-0.5 ${isDarkMode ? 'text-purple-400' : 'text-purple-600'} flex-shrink-0`} />
                  <span className={`ml-3 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                    API access for developers
                  </span>
                </div>
              </div>

              {isPremium() ? (
                <div className={`py-3 px-4 rounded-lg text-center font-medium ${
                  isDarkMode ? 'bg-purple-900/30 text-purple-300' : 'bg-purple-100 text-purple-700'
                }`}>
                  <Award className="h-4 w-4 inline mr-2" />
                  You're using the Premium Plan
                </div>
              ) : (
                <button 
                  onClick={handleCheckout}
                  disabled={isLoading || isFriend()}
                  className="w-full py-3 px-4 rounded-lg font-medium bg-purple-600 text-white hover:bg-purple-700 transition-colors disabled:opacity-70 flex items-center justify-center"
                >
                  {isLoading ? (
                    <>
                      <Loader className="animate-spin h-4 w-4 mr-2" />
                      Processing...
                    </>
                  ) : isFriend() ? (
                    <>
                      <Heart className="h-4 w-4 mr-2" />
                      Already on Friend Plan
                    </>
                  ) : (
                    <>
                      <Smartphone className="h-4 w-4 mr-2" />
                      Pay with UPI
                    </>
                  )}
                </button>
              )}

              <div className="mt-4 flex space-x-2 justify-center">
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                  isDarkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-700'
                }`}>
                  <Smartphone className="h-3 w-3 mr-1" />
                  UPI
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Direct UPI Payment Info */}
        <div className="mt-12 max-w-3xl mx-auto p-6 rounded-lg bg-blue-50 border border-blue-300 dark:bg-blue-900/20 dark:border-blue-800">
          <h3 className="text-lg font-medium text-blue-800 dark:text-blue-300 mb-3">
            Student-Friendly Direct UPI Payment
          </h3>
          <ul className="space-y-2 text-sm text-blue-700 dark:text-blue-400">
            <li className="flex items-start">
              <Check className="h-5 w-5 mt-0.5 text-green-500 flex-shrink-0" />
              <span className="ml-3">
                Pay directly via UPI without any payment gateway integration
              </span>
            </li>
            <li className="flex items-start">
              <Check className="h-5 w-5 mt-0.5 text-green-500 flex-shrink-0" />
              <span className="ml-3">
                No business account required - perfect for students
              </span>
            </li>
            <li className="flex items-start">
              <Check className="h-5 w-5 mt-0.5 text-green-500 flex-shrink-0" />
              <span className="ml-3">
                Compatible with all UPI apps - Google Pay, PhonePe, Paytm, etc.
              </span>
            </li>
            <li className="flex items-start">
              <Check className="h-5 w-5 mt-0.5 text-green-500 flex-shrink-0" />
              <span className="ml-3">
                Simple implementation with QR codes and UPI deep links
              </span>
            </li>
          </ul>
        </div>
        
        {/* Comparison Table */}
        <div className={`mt-24 max-w-5xl mx-auto rounded-xl overflow-hidden shadow-lg ${
          isDarkMode ? 'bg-gray-800' : 'bg-white'
        }`}>
          <div className={`px-6 py-4 ${isDarkMode ? 'bg-gray-700' : 'bg-purple-50'}`}>
            <h2 className="text-xl font-bold">Feature Comparison</h2>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className={`text-left ${isDarkMode ? 'bg-gray-700' : 'bg-purple-50'}`}>
                  <th className="px-6 py-3">Feature</th>
                  <th className="px-6 py-3">Friends Plan</th>
                  <th className="px-6 py-3">Premium Plan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                <tr>
                  <td className={`px-6 py-4 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Location Search</td>
                  <td className="px-6 py-4">
                    <Check className={`h-5 w-5 ${isDarkMode ? 'text-green-400' : 'text-green-500'}`} />
                  </td>
                  <td className="px-6 py-4">
                    <Check className={`h-5 w-5 ${isDarkMode ? 'text-green-400' : 'text-green-500'}`} />
                  </td>
                </tr>
                <tr>
                  <td className={`px-6 py-4 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Photo Uploads</td>
                  <td className="px-6 py-4">
                    <span className={`${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Unlimited</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Unlimited</span>
                  </td>
                </tr>
                <tr>
                  <td className={`px-6 py-4 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Download With Watermark</td>
                  <td className="px-6 py-4">
                    <Check className={`h-5 w-5 ${isDarkMode ? 'text-green-400' : 'text-green-500'}`} />
                  </td>
                  <td className="px-6 py-4">
                    <Check className={`h-5 w-5 ${isDarkMode ? 'text-green-400' : 'text-green-500'}`} />
                  </td>
                </tr>
                <tr>
                  <td className={`px-6 py-4 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Custom Watermarks</td>
                  <td className="px-6 py-4">
                    <Check className={`h-5 w-5 ${isDarkMode ? 'text-green-400' : 'text-green-500'}`} />
                  </td>
                  <td className="px-6 py-4">
                    <Check className={`h-5 w-5 ${isDarkMode ? 'text-green-400' : 'text-green-500'}`} />
                  </td>
                </tr>
                <tr>
                  <td className={`px-6 py-4 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Advanced Watermark Options</td>
                  <td className="px-6 py-4">
                    <X className={`h-5 w-5 ${isDarkMode ? 'text-red-400' : 'text-red-500'}`} />
                  </td>
                  <td className="px-6 py-4">
                    <Check className={`h-5 w-5 ${isDarkMode ? 'text-green-400' : 'text-green-500'}`} />
                  </td>
                </tr>
                <tr>
                  <td className={`px-6 py-4 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>No GeoTag Pro Logo</td>
                  <td className="px-6 py-4">
                    <X className={`h-5 w-5 ${isDarkMode ? 'text-red-400' : 'text-red-500'}`} />
                  </td>
                  <td className="px-6 py-4">
                    <Check className={`h-5 w-5 ${isDarkMode ? 'text-green-400' : 'text-green-500'}`} />
                  </td>
                </tr>
                <tr>
                  <td className={`px-6 py-4 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Priority Support</td>
                  <td className="px-6 py-4">
                    <X className={`h-5 w-5 ${isDarkMode ? 'text-red-400' : 'text-red-500'}`} />
                  </td>
                  <td className="px-6 py-4">
                    <Check className={`h-5 w-5 ${isDarkMode ? 'text-green-400' : 'text-green-500'}`} />
                  </td>
                </tr>
                <tr>
                  <td className={`px-6 py-4 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>API Access</td>
                  <td className="px-6 py-4">
                    <X className={`h-5 w-5 ${isDarkMode ? 'text-red-400' : 'text-red-500'}`} />
                  </td>
                  <td className="px-6 py-4">
                    <Check className={`h-5 w-5 ${isDarkMode ? 'text-green-400' : 'text-green-500'}`} />
                  </td>
                </tr>
                <tr>
                  <td className={`px-6 py-4 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Price</td>
                  <td className="px-6 py-4 font-medium">
                    <span className={`${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>₹0 (With friend code)</span>
                  </td>
                  <td className="px-6 py-4 font-medium">
                    <span className={`${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>₹50/month or ₹480/year</span>
                  </td>
                </tr>
                <tr>
                  <td className={`px-6 py-4 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Payment Method</td>
                  <td className="px-6 py-4">
                    <span className={`${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>-</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`${isDarkMode ? 'text-gray-300' : 'text-gray-700'} flex items-center`}>
                      <Smartphone className="h-4 w-4 mr-1 text-green-500" />
                      Direct UPI
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
        
        {/* FAQ Section */}
        <div className="mt-24 max-w-3xl mx-auto">
          <h2 className={`text-2xl font-bold mb-8 text-center ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            Frequently Asked Questions
          </h2>
          
          <div className={`space-y-6 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
            <div className={`p-6 rounded-lg ${isDarkMode ? 'bg-gray-800' : 'bg-white'} shadow-md`}>
              <h3 className={`text-lg font-semibold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                How does UPI payment work?
              </h3>
              <p>
                Our direct UPI integration lets you pay with any UPI app like Google Pay, PhonePe, or Paytm. You'll get a QR code to scan or can use the UPI ID directly. It's simple, secure, and doesn't require a payment gateway.
              </p>
            </div>
            
            <div className={`p-6 rounded-lg ${isDarkMode ? 'bg-gray-800' : 'bg-white'} shadow-md`}>
              <h3 className={`text-lg font-semibold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                How do I get a friend code?
              </h3>
              <p>
                Friend codes are exclusively provided by Rishit Tandon to close friends. If you're a friend of Rishit, reach out to him directly to request your personal friend code.
              </p>
            </div>
            
            <div className={`p-6 rounded-lg ${isDarkMode ? 'bg-gray-800' : 'bg-white'} shadow-md`}>
              <h3 className={`text-lg font-semibold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                Can I upgrade from the Friends Plan to Premium later?
              </h3>
              <p>
                Yes! You can upgrade to the Premium Plan at any time. Your settings and saved photos will be transferred automatically.
              </p>
            </div>
            
            <div className={`p-6 rounded-lg ${isDarkMode ? 'bg-gray-800' : 'bg-white'} shadow-md`}>
              <h3 className={`text-lg font-semibold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                Is my payment information secure with UPI?
              </h3>
              <p>
                Yes, UPI is a highly secure payment system regulated by the National Payments Corporation of India (NPCI). Your payment details are encrypted and protected throughout the transaction process.
              </p>
            </div>
          </div>
        </div>
        
        {/* CTA Section */}
        <div className={`mt-24 p-8 text-center rounded-2xl ${isDarkMode ? 'bg-purple-900/20' : 'bg-purple-50'} max-w-5xl mx-auto`}>
          <h2 className={`text-2xl font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            Ready to enhance your photos with location data?
          </h2>
          <p className={`text-lg mb-8 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
            Join the GeoTag Pro community today and take your photo organization to the next level.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            {user ? (
              <Link to="/editor" className="inline-flex items-center justify-center px-6 py-3 rounded-lg bg-purple-600 text-white font-medium hover:bg-purple-700 transition-colors">
                Go to Editor
              </Link>
            ) : (
              <Link to="/register" className="inline-flex items-center justify-center px-6 py-3 rounded-lg bg-purple-600 text-white font-medium hover:bg-purple-700 transition-colors">
                Sign Up Free
              </Link>
            )}
            <button onClick={() => setShowFriendsCode(true)} className={`inline-flex items-center justify-center px-6 py-3 rounded-lg ${isDarkMode ? 'bg-gray-800 text-white hover:bg-gray-700' : 'bg-white text-gray-800 hover:bg-gray-100'} font-medium border border-gray-300 dark:border-gray-700 transition-colors`}>
              <Heart className="h-4 w-4 mr-2 text-purple-500" />
              I Have a Friend Code
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PricingPage;