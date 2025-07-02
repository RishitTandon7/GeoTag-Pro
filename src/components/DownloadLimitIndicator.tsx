import React, { useState, useEffect } from 'react';
import { Download, X, Zap, Award, Heart, AlertTriangle, Lock, Info } from 'lucide-react';
import { useImageStore } from '../store/imageStore';
import { useAuthStore } from '../store/authStore';
import { useLocation } from 'react-router-dom';

const DownloadLimitIndicator: React.FC = () => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });

  const location = useLocation();
  const { getRemainingEdits, getImageLimit, editedImages } = useImageStore();
  const { user } = useAuthStore();

  // Get current usage stats
  const remainingEdits = getRemainingEdits();
  const imageLimit = getImageLimit();
  const usedEdits = editedImages.length;
  const isUnlimited = imageLimit === Infinity;
  const isRunningLow = !isUnlimited && remainingEdits <= 3 && remainingEdits > 0;
  const hasReachedLimit = remainingEdits === 0 && !isUnlimited;

  // Get user subscription info
  const getUserPlan = () => {
    if (!user) return { name: 'Guest', color: 'gray', icon: Zap };
    if (user.profile?.subscription_tier === 'premium') return { name: 'Premium', color: 'purple', icon: Award };
    if (user.profile?.subscription_tier === 'friend') return { name: 'Friend', color: 'pink', icon: Heart };
    return { name: 'Free', color: 'blue', icon: Zap };
  };

  const userPlan = getUserPlan();
  const PlanIcon = userPlan.icon;

  useEffect(() => {
    // Update dark mode preference when system preference changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e: MediaQueryListEvent) => {
      setIsDarkMode(e.matches);
    };
    
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  // Show expanded view by default if user is running low or reached limit
  useEffect(() => {
    if (isRunningLow || hasReachedLimit) {
      setIsExpanded(true);
      
      // Auto-collapse after 5 seconds if running low but not at limit
      if (isRunningLow && !hasReachedLimit) {
        const timer = setTimeout(() => {
          setIsExpanded(false);
        }, 5000);
        
        return () => clearTimeout(timer);
      }
    }
  }, [isRunningLow, hasReachedLimit]);

  // Hide on certain pages
  useEffect(() => {
    const hideOnPaths = ['/login', '/register', '/pricing', '/subscription'];
    setIsVisible(!hideOnPaths.includes(location.pathname));
  }, [location]);

  if (!isVisible) return null;

  return (
    <div 
      className={`fixed z-40 transition-all duration-300 ${
        isExpanded ? 'bottom-6 right-6' : 'bottom-6 right-6'
      }`}
    >
      {isExpanded ? (
        <div className={`rounded-lg shadow-lg overflow-hidden transition-all duration-300 transform ${
          isDarkMode 
            ? 'bg-gray-800/95 border border-gray-700' 
            : 'bg-white/95 border border-gray-200'
        } max-w-xs animate-scaleIn backdrop-blur-sm`}>
          <div className="p-4">
            <div className="flex justify-between items-start">
              <div className="flex items-center">
                <div className={`rounded-full p-2 ${
                  hasReachedLimit 
                    ? isDarkMode ? 'bg-red-900/30' : 'bg-red-100' 
                    : isRunningLow 
                      ? isDarkMode ? 'bg-yellow-900/30' : 'bg-yellow-100'
                      : isDarkMode ? 'bg-blue-900/30' : 'bg-blue-100'
                }`}>
                  {hasReachedLimit ? (
                    <Lock className={`h-4 w-4 ${isDarkMode ? 'text-red-400' : 'text-red-500'}`} />
                  ) : (
                    <Download className={`h-4 w-4 ${
                      isRunningLow
                        ? isDarkMode ? 'text-yellow-400' : 'text-yellow-500'
                        : isDarkMode ? 'text-blue-400' : 'text-blue-500'
                    }`} />
                  )}
                </div>
                <div className="ml-3">
                  <div className="font-medium flex items-center">
                    Downloads {isUnlimited ? 'Available' : 'Remaining'}
                    <div className={`ml-2 px-1.5 py-0.5 text-xs rounded-full ${
                      hasReachedLimit 
                        ? isDarkMode ? 'bg-red-900/40 text-red-300' : 'bg-red-100 text-red-700'
                        : isRunningLow
                          ? isDarkMode ? 'bg-yellow-900/40 text-yellow-300' : 'bg-yellow-100 text-yellow-700'
                          : isDarkMode ? 'bg-blue-900/40 text-blue-300' : 'bg-blue-100 text-blue-700'
                    }`}>
                      {hasReachedLimit ? 'Limit Reached' : isRunningLow ? 'Running Low' : 'Active'}
                    </div>
                  </div>
                </div>
              </div>
              
              <button 
                onClick={() => setIsExpanded(false)}
                className={`p-1 rounded-full ${
                  isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-200'
                }`}
                aria-label="Minimize"
              >
                <X className={`h-4 w-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} />
              </button>
            </div>
            
            <div className="mt-3 flex items-center justify-between">
              <div className="flex items-center">
                <PlanIcon className={`h-4 w-4 mr-1.5 ${
                  userPlan.color === 'purple' ? isDarkMode ? 'text-purple-400' : 'text-purple-600' :
                  userPlan.color === 'pink' ? isDarkMode ? 'text-pink-400' : 'text-pink-600' :
                  isDarkMode ? 'text-blue-400' : 'text-blue-600'
                }`} />
                <span className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>{userPlan.name} Plan</span>
              </div>
              
              <span className={`text-2xl font-bold ${
                hasReachedLimit 
                  ? isDarkMode ? 'text-red-400' : 'text-red-600'
                  : isRunningLow
                    ? isDarkMode ? 'text-yellow-400' : 'text-yellow-600'
                    : isDarkMode ? 'text-green-400' : 'text-green-600'
              }`}>
                {isUnlimited ? '∞' : remainingEdits}
              </span>
            </div>
            
            {!isUnlimited && (
              <div className="mt-2">
                <div className="flex justify-between items-center text-xs mb-1">
                  <span className={isDarkMode ? 'text-gray-400' : 'text-gray-500'}>
                    {usedEdits} of {imageLimit} used
                  </span>
                  <span className={isDarkMode ? 'text-gray-400' : 'text-gray-500'}>
                    {Math.round((usedEdits / imageLimit) * 100)}%
                  </span>
                </div>
                
                <div className={`w-full h-1.5 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'} rounded-full overflow-hidden`}>
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${
                      hasReachedLimit 
                        ? 'bg-red-500' 
                        : isRunningLow
                          ? 'bg-yellow-500'
                          : 'bg-green-500'
                    }`}
                    style={{ width: `${Math.max(0, Math.min(100, (usedEdits / imageLimit) * 100))}%` }}
                  ></div>
                </div>
              </div>
            )}
            
            {hasReachedLimit && (
              <div className="mt-3 text-xs">
                <div className="flex items-start">
                  <AlertTriangle className={`h-3.5 w-3.5 mt-0.5 mr-1.5 flex-shrink-0 ${
                    isDarkMode ? 'text-red-400' : 'text-red-500'
                  }`} />
                  <span className={isDarkMode ? 'text-gray-300' : 'text-gray-600'}>
                    {user?.profile?.subscription_tier === 'free' 
                      ? 'Upgrade to Premium for unlimited downloads'
                      : !user 
                        ? 'Sign up for more downloads'
                        : 'Contact support if needed'
                    }
                  </span>
                </div>
              </div>
            )}
            
            {!hasReachedLimit && !isUnlimited && (
              <div className="mt-2 text-xs flex justify-end">
                <a 
                  href="/pricing"
                  className={`${
                    isRunningLow
                      ? isDarkMode 
                        ? 'text-yellow-400 hover:text-yellow-300' 
                        : 'text-yellow-700 hover:text-yellow-800'
                      : isDarkMode 
                        ? 'text-gray-400 hover:text-gray-300' 
                        : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  {isRunningLow ? 'Upgrade for unlimited' : 'View plans →'}
                </a>
              </div>
            )}
          </div>
        </div>
      ) : (
        <button
          onClick={() => setIsExpanded(true)}
          className={`rounded-full p-3 shadow-lg flex items-center justify-center transition-all duration-300 ${
            hasReachedLimit 
              ? isDarkMode ? 'bg-red-900 text-red-100' : 'bg-red-500 text-white' 
              : isRunningLow 
                ? isDarkMode ? 'bg-yellow-900 text-yellow-100' : 'bg-yellow-500 text-white'
                : isDarkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-800'
          } hover:scale-105`}
        >
          <div className="relative">
            {hasReachedLimit ? (
              <Lock className="h-5 w-5" />
            ) : (
              <Download className="h-5 w-5" />
            )}
            
            {/* Badge counter */}
            {!isUnlimited && (
              <div className={`absolute -top-2 -right-2 rounded-full h-4 min-w-4 px-1 flex items-center justify-center text-xs font-bold ${
                hasReachedLimit 
                  ? 'bg-red-700 text-white' 
                  : isRunningLow
                    ? 'bg-yellow-300 text-yellow-800'
                    : 'bg-green-500 text-white'
              }`}>
                {remainingEdits}
              </div>
            )}
          </div>
        </button>
      )}
    </div>
  );
};

export default DownloadLimitIndicator;