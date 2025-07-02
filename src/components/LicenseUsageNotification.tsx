import React, { useState, useEffect } from 'react';
import { X, Download, Award, Heart, Zap, Info, Check, RefreshCw } from 'lucide-react';
import { useImageStore } from '../store/imageStore';
import { useAuthStore } from '../store/authStore';

interface LicenseUsageNotificationProps {
  onClose: () => void;
}

const LicenseUsageNotification: React.FC<LicenseUsageNotificationProps> = ({ onClose }) => {
  const { getRemainingEdits, getImageLimit, editedImages, syncWithServer } = useImageStore();
  const { user } = useAuthStore();
  const [isSyncing, setIsSyncing] = useState(false);
  const [fadeOut, setFadeOut] = useState(false);
  
  // Get current usage stats
  const remainingEdits = getRemainingEdits();
  const imageLimit = getImageLimit();
  const usedEdits = editedImages.length;
  const isUnlimited = imageLimit === Infinity;
  const isRunningLow = !isUnlimited && remainingEdits <= 3 && remainingEdits > 0;
  const hasReachedLimit = remainingEdits === 0 && !isUnlimited;

  // Get user plan info
  const getUserPlan = () => {
    if (!user) return { name: 'Guest', color: 'gray', icon: Zap };
    if (user.profile?.subscription_tier === 'premium') return { name: 'Premium', color: 'purple', icon: Award };
    if (user.profile?.subscription_tier === 'friend') return { name: 'Friend', color: 'pink', icon: Heart };
    return { name: 'Free', color: 'blue', icon: Zap };
  };

  const userPlan = getUserPlan();
  const PlanIcon = userPlan.icon;

  const handleClose = () => {
    setFadeOut(true);
    setTimeout(() => {
      onClose();
    }, 300);
  };

  const handleSync = async () => {
    setIsSyncing(true);
    try {
      await syncWithServer();
    } catch (error) {
      console.error("Error syncing usage data:", error);
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className={`fixed bottom-6 right-6 w-full max-w-md bg-gray-900 text-white rounded-xl shadow-2xl overflow-hidden z-50 transition-all duration-300 transform ${fadeOut ? 'opacity-0 translate-y-4' : 'opacity-100'}`}>
      <div className="p-5">
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center">
            <div className="h-10 w-10 rounded-full bg-blue-900/50 flex items-center justify-center mr-3">
              <Info className="h-5 w-5 text-blue-300" />
            </div>
            <div>
              <h3 className="font-bold text-lg">License Usage Information</h3>
              <p className="text-gray-400 text-sm">Track your downloads and remaining usage</p>
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
        <div className="bg-gray-800 p-4 rounded-lg mb-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center">
              <PlanIcon className={`h-5 w-5 mr-2 ${
                userPlan.color === 'purple' ? 'text-purple-400' :
                userPlan.color === 'pink' ? 'text-pink-400' :
                'text-blue-400'
              }`} />
              <span className="font-medium">{userPlan.name} Plan</span>
            </div>
            
            <div className="flex items-center">
              <button
                onClick={handleSync}
                disabled={isSyncing}
                className="p-1.5 rounded bg-gray-700 hover:bg-gray-600 mr-2 transition-colors"
                title="Sync usage data"
              >
                <RefreshCw className={`h-3.5 w-3.5 text-gray-300 ${isSyncing ? 'animate-spin' : ''}`} />
              </button>
              
              <span className={`text-2xl font-bold ${
                hasReachedLimit ? 'text-red-400' : 
                isRunningLow ? 'text-yellow-400' : 
                'text-green-400'
              }`}>
                {isUnlimited ? '∞' : remainingEdits}
              </span>
            </div>
          </div>
          
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm text-gray-400">Current Usage</div>
            <div className="text-sm text-gray-300">
              {isUnlimited 
                ? `${usedEdits} downloads used (unlimited remaining)` 
                : `${usedEdits} of ${imageLimit} downloads used`
              }
            </div>
          </div>
          
          {!isUnlimited && (
            <div className="w-full h-2 bg-gray-700 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-300 ${
                  hasReachedLimit ? 'bg-red-500' : 
                  isRunningLow ? 'bg-yellow-500' : 
                  'bg-green-500'
                }`}
                style={{ width: `${Math.max(0, Math.min(100, (usedEdits / imageLimit) * 100))}%` }}
              ></div>
            </div>
          )}
        </div>
        
        {/* Instructions */}
        <div className="mb-4">
          <h4 className="font-medium text-sm mb-2 text-gray-300">How to check your license usage:</h4>
          <ul className="space-y-2 text-sm text-gray-400">
            <li className="flex items-start">
              <div className="h-5 w-5 rounded-full bg-gray-800 flex items-center justify-center mr-2 mt-0.5">
                <span className="text-xs">1</span>
              </div>
              <span>The usage bar at the top of the editor shows your current download count and remaining downloads</span>
            </li>
            <li className="flex items-start">
              <div className="h-5 w-5 rounded-full bg-gray-800 flex items-center justify-center mr-2 mt-0.5">
                <span className="text-xs">2</span>
              </div>
              <span>Click the <RefreshCw className="h-3.5 w-3.5 inline mx-1" /> sync button to update your usage from the server</span>
            </li>
            <li className="flex items-start">
              <div className="h-5 w-5 rounded-full bg-gray-800 flex items-center justify-center mr-2 mt-0.5">
                <span className="text-xs">3</span>
              </div>
              <span>When exporting, the remaining downloads are shown in the export dialog</span>
            </li>
          </ul>
        </div>
        
        {/* Actions */}
        <div className="flex justify-between">
          <button
            onClick={handleClose}
            className="py-2 px-4 bg-gray-800 text-gray-300 rounded-lg hover:bg-gray-700 transition-colors"
          >
            Got it!
          </button>
          
          {!isUnlimited && (
            <a 
              href="/pricing"
              className="py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              View Plans
            </a>
          )}
        </div>
      </div>
    </div>
  );
};

export default LicenseUsageNotification;