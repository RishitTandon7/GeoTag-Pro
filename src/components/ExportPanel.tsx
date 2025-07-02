import React, { useState } from 'react';
import { Download, AlertTriangle, Zap, Award, Heart, Lock } from 'lucide-react';
import { useImageStore } from '../store/imageStore';
import { useAuthStore } from '../store/authStore';

interface ExportPanelProps {
  onExport: () => void;
  onCancel: () => void;
  isDownloading: boolean;
}

const ExportPanel: React.FC<ExportPanelProps> = ({ 
  onExport,
  onCancel,
  isDownloading
}) => {
  const [format, setFormat] = useState('jpeg');
  const [quality, setQuality] = useState('high');
  const [showPreview, setShowPreview] = useState(false);
  
  const { getRemainingEdits, getImageLimit, editedImages } = useImageStore();
  const { user } = useAuthStore();

  // Get usage stats
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

  return (
    <div className="p-6 bg-gray-900 text-white rounded-xl max-w-md w-full mx-auto shadow-2xl">
      <div className="flex flex-col items-center mb-8">
        <div className="w-20 h-20 bg-purple-900/50 rounded-full flex items-center justify-center mb-4">
          <div className="w-10 h-10 animate-pulse">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-purple-400">
              <path d="M13 10V3L4 14H11V21L20 10H13Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
        </div>
        <h2 className="text-2xl font-bold mb-1">Ready to Export!</h2>
        <p className="text-gray-400 text-sm text-center">
          Your photo is ready to be exported with the location watermark.
        </p>
      </div>

      {/* Download Limit Counter - Prominently displayed */}
      <div className={`mb-6 p-4 rounded-lg ${
        hasReachedLimit 
          ? 'bg-red-900/30 border border-red-800/30' 
          : isRunningLow
            ? 'bg-yellow-900/30 border border-yellow-800/30' 
            : 'bg-gray-800 border border-gray-700'
      }`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <PlanIcon className={`h-5 w-5 mr-2 ${
              userPlan.color === 'purple' ? 'text-purple-400' :
              userPlan.color === 'pink' ? 'text-pink-400' :
              'text-blue-400'
            }`} />
            <span className="text-sm font-medium">{userPlan.name} Plan</span>
          </div>
          
          {hasReachedLimit && (
            <div className="px-2 py-1 bg-red-900/50 text-red-300 text-xs font-medium rounded-full">
              Limit Reached
            </div>
          )}
          
          {isRunningLow && !hasReachedLimit && (
            <div className="px-2 py-1 bg-yellow-900/50 text-yellow-300 text-xs font-medium rounded-full">
              Running Low
            </div>
          )}
        </div>
        
        <div className="mt-3 flex items-center justify-between">
          <span className="text-sm text-gray-300">
            {isUnlimited 
              ? "Unlimited downloads" 
              : `${remainingEdits} of ${imageLimit} downloads remaining`
            }
          </span>
          <span className={`text-2xl font-bold ${
            hasReachedLimit 
              ? 'text-red-400' 
              : isRunningLow
                ? 'text-yellow-400'
                : 'text-green-400'
          }`}>
            {isUnlimited ? '∞' : remainingEdits}
          </span>
        </div>
        
        {!isUnlimited && (
          <div className="mt-2 w-full h-2 bg-gray-700 rounded-full overflow-hidden">
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
        )}

        {hasReachedLimit && (
          <div className="mt-3 flex items-start text-xs text-red-300">
            <AlertTriangle className="h-4 w-4 mr-1 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium">You've reached your download limit</p>
              {!user 
                ? <p className="mt-1">Sign up for free to get 15 downloads.</p>
                : <p className="mt-1">Upgrade to Premium for unlimited downloads.</p>
              }
            </div>
          </div>
        )}
      </div>

      {/* Export Options */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Export Format
          </label>
          <select 
            value={format}
            onChange={(e) => setFormat(e.target.value)}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg p-2.5 text-white"
          >
            <option value="jpeg">JPEG (Default)</option>
            <option value="png">PNG</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Quality
          </label>
          <select 
            value={quality}
            onChange={(e) => setQuality(e.target.value)}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg p-2.5 text-white"
          >
            <option value="high">High (Default)</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>
      </div>
      
      {/* Preview button */}
      <button
        onClick={() => setShowPreview(!showPreview)}
        className="w-full py-3 px-4 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors mb-4 flex justify-center items-center"
      >
        <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" className="mr-2"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect><line x1="8" y1="21" x2="16" y2="21"></line><line x1="12" y1="17" x2="12" y2="21"></line></svg>
        Preview Watermark
      </button>
      
      {/* Download button */}
      <button
        onClick={onExport}
        disabled={isDownloading || hasReachedLimit}
        className={`w-full py-3 px-4 rounded-lg font-medium flex items-center justify-center transition-colors ${
          hasReachedLimit
            ? "bg-gray-700 text-gray-500 cursor-not-allowed"
            : isDownloading
              ? "bg-purple-700 text-white"
              : "bg-purple-600 text-white hover:bg-purple-700"
        }`}
      >
        {hasReachedLimit ? (
          <>
            <Lock className="h-5 w-5 mr-2" />
            Limit Reached
          </>
        ) : isDownloading ? (
          <>
            <div className="animate-spin h-5 w-5 mr-2 border-2 border-white border-t-transparent rounded-full"></div>
            Downloading...
          </>
        ) : (
          <>
            <Download className="h-5 w-5 mr-2" />
            Download Photo {!isUnlimited && `(${remainingEdits} left)`}
          </>
        )}
      </button>
      
      <button
        onClick={onCancel}
        className="w-full mt-3 py-2 px-4 bg-transparent border border-gray-700 text-gray-300 rounded-lg hover:bg-gray-800 transition-colors"
      >
        Cancel
      </button>
      
      {/* Upgrade prompt for users with limited downloads */}
      {!isUnlimited && !hasReachedLimit && (
        <div className="mt-6 pt-6 border-t border-gray-700">
          <div className="text-xs text-gray-400 mb-2">Want unlimited downloads?</div>
          <a
            href="/pricing"
            className="w-full py-2 px-4 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-md hover:from-purple-700 hover:to-indigo-700 transition-colors text-center block text-sm"
          >
            <Zap className="h-4 w-4 inline-block mr-1" />
            Upgrade to Premium
          </a>
        </div>
      )}
    </div>
  );
};

export default ExportPanel;