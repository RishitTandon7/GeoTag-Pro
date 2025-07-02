import React, { useEffect, useState } from 'react';
import { X, Download, Award, Heart, Zap, AlertTriangle, ExternalLink } from 'lucide-react';
import { useImageStore } from '../store/imageStore';
import { useAuthStore } from '../store/authStore';

interface DownloadLimitPopupProps {
  onClose: () => void;
}

const DownloadLimitPopup: React.FC<DownloadLimitPopupProps> = ({ onClose }) => {
  const { getRemainingEdits, getImageLimit, editedImages } = useImageStore();
  const { user } = useAuthStore();
  const [isVisible, setIsVisible] = useState(true);
  
  // Get current usage stats
  const remainingEdits = getRemainingEdits();
  const imageLimit = getImageLimit();
  const usedEdits = editedImages.length;
  const isUnlimited = imageLimit === Infinity;
  const isRunningLow = !isUnlimited && remainingEdits <= 3 && remainingEdits > 0;
  const hasReachedLimit = remainingEdits === 0 && !isUnlimited;

  // Animation effect for countdown
  const [timeLeft, setTimeLeft] = useState(10);

  // Close automatically after 10 seconds
  useEffect(() => {
    if (!isVisible) return;

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          // Add a small delay before calling onClose to allow for exit animation
          setTimeout(() => setIsVisible(false), 500);
          setTimeout(onClose, 1000);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    return () => clearInterval(timer);
  }, [onClose, isVisible]);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(onClose, 300); // Allow time for exit animation
  };

  // Get user plan info
  const getUserPlan = () => {
    if (!user) return { name: 'Guest', color: 'gray', icon: Zap };
    if (user.profile?.subscription_tier === 'premium') return { name: 'Premium', color: 'purple', icon: Award };
    if (user.profile?.subscription_tier === 'friend') return { name: 'Friend', color: 'pink', icon: Heart };
    return { name: 'Free', color: 'blue', icon: Zap };
  };

  const userPlan = getUserPlan();
  const PlanIcon = userPlan.icon;

  const getProgressColor = () => {
    if (hasReachedLimit) return 'bg-red-500';
    if (isRunningLow) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  // If we've started the exit animation
  if (!isVisible) {
    return null;
  }

  return (
    <div className="fixed bottom-6 right-6 w-full max-w-md bg-gray-900 text-white rounded-xl shadow-2xl overflow-hidden z-50 transition-all duration-300 transform animate-scaleIn">
      {/* Header */}
      <div className="relative h-2 w-full bg-gray-800">
        <div 
          className="absolute left-0 top-0 h-full bg-purple-600 transition-all duration-1000 ease-linear"
          style={{ width: `${(timeLeft / 10) * 100}%` }}
        ></div>
      </div>
      
      <div className="p-5">
        <div className="flex justify-between items-start mb-5">
          <div className="flex items-center">
            <div className="h-12 w-12 rounded-full bg-purple-900/50 flex items-center justify-center mr-3">
              <Download className="h-6 w-6 text-purple-300" />
            </div>
            <div>
              <h3 className="font-bold text-xl">Download Complete!</h3>
              <p className="text-gray-400 text-sm">Your geotagged photo has been saved.</p>
            </div>
          </div>
          <button 
            onClick={handleClose}
            className="p-2 hover:bg-gray-800 rounded-full transition-colors"
            aria-label="Close"
          >
            <X className="h-5 w-5 text-gray-400" />
          </button>
        </div>
        
        {/* Plan and limits section */}
        <div className="bg-gray-800 p-4 rounded-lg mb-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center">
              <PlanIcon className={`h-5 w-5 mr-2 ${
                userPlan.color === 'purple' ? 'text-purple-400' :
                userPlan.color === 'pink' ? 'text-pink-400' :
                'text-blue-400'
              }`} />
              <span className="font-medium">{userPlan.name} Plan</span>
            </div>
            
            {hasReachedLimit && (
              <div className="px-2.5 py-1 bg-red-900/50 text-red-300 text-xs font-medium rounded-full">
                Limit Reached
              </div>
            )}
            
            {isRunningLow && !hasReachedLimit && (
              <div className="px-2.5 py-1 bg-yellow-900/50 text-yellow-300 text-xs font-medium rounded-full">
                Running Low
              </div>
            )}
          </div>
          
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm text-gray-400">Downloads</div>
            <div className="flex items-center">
              <span className="text-sm text-gray-400 mr-2">
                {isUnlimited ? "Unlimited" : `${usedEdits} of ${imageLimit} used`}
              </span>
              <span className={`text-3xl font-bold ${
                hasReachedLimit ? 'text-red-400' : 
                isRunningLow ? 'text-yellow-400' : 
                'text-green-400'
              }`}>
                {isUnlimited ? '∞' : remainingEdits}
              </span>
            </div>
          </div>
          
          {!isUnlimited && (
            <div className="w-full h-3 bg-gray-700 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-300 ${getProgressColor()}`}
                style={{ width: `${Math.max(0, Math.min(100, (usedEdits / imageLimit) * 100))}%` }}
              ></div>
            </div>
          )}
        </div>
        
        {/* Alert section for limits */}
        {(hasReachedLimit || isRunningLow) && (
          <div className={`p-4 rounded-lg mb-5 ${
            hasReachedLimit ? 'bg-red-900/20 border border-red-900/30' : 
            'bg-yellow-900/20 border border-yellow-900/30'
          }`}>
            <div className="flex items-start">
              <AlertTriangle className={`h-5 w-5 mt-0.5 mr-2 ${
                hasReachedLimit ? 'text-red-400' : 'text-yellow-400'
              }`} />
              <div>
                <p className={`text-sm font-medium ${
                  hasReachedLimit ? 'text-red-300' : 'text-yellow-300'
                }`}>
                  {hasReachedLimit ? 'You\'ve reached your download limit' : 'Running low on downloads'}
                </p>
                <p className={`mt-1 text-xs ${
                  hasReachedLimit ? 'text-red-400' : 'text-yellow-400'
                }`}>
                  {!user ? 
                    "Sign up for free to get 15 downloads, or upgrade to Premium for unlimited access." :
                    user.profile?.subscription_tier === 'free' ?
                    "Upgrade to Premium for unlimited downloads and advanced features." :
                    "Contact support if you think this is an error."}
                </p>
                
                {(hasReachedLimit || (isRunningLow && user?.profile?.subscription_tier === 'free')) && (
                  <a 
                    href={!user ? "/register" : "/pricing"}
                    className={`mt-3 inline-flex items-center px-3 py-1.5 rounded-md text-xs font-medium ${
                      hasReachedLimit ? 'bg-red-700 text-white' : 'bg-yellow-700 text-white'
                    } hover:opacity-90 transition-opacity`}
                  >
                    {!user ? "Sign Up Free" : "Upgrade Now"} 
                    <ExternalLink className="h-3 w-3 ml-1" />
                  </a>
                )}
              </div>
            </div>
          </div>
        )}
        
        {/* Actions */}
        <div className="flex space-x-3">
          <button
            onClick={handleClose}
            className="flex-1 py-2.5 px-4 bg-gray-800 text-gray-300 rounded-lg hover:bg-gray-700 transition-colors"
          >
            Close
          </button>
          <a 
            href="/pricing" 
            className={`flex-1 py-2.5 px-4 rounded-lg text-center font-medium ${
              hasReachedLimit || isRunningLow
                ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white'
                : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
            } transition-colors`}
          >
            {(hasReachedLimit || isRunningLow) ? 'Upgrade Plan' : 'View Plans'}
          </a>
        </div>
      </div>
    </div>
  );
};

export default DownloadLimitPopup;