import React, { useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { supabase } from '../lib/supabase';
import { Loader, User, Shield, AlertTriangle, CheckCircle, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import FixSubscriptionButton from './FixSubscriptionButton';

interface SubscriptionDebugProps {
  isDarkMode?: boolean;
}

const SubscriptionDebug: React.FC<SubscriptionDebugProps> = ({ isDarkMode = false }) => {
  const { user, refreshUserProfile } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  const [debugInfo, setDebugInfo] = useState<any>(null);
  
  const fetchSubscriptionDetails = async () => {
    if (!user) {
      toast.error('You must be logged in');
      return;
    }
    
    setIsLoading(true);
    try {
      // Get the user profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      
      if (profileError) throw profileError;
      
      // Get subscription requests for this user
      const { data: requests, error: requestsError } = await supabase
        .from('subscription_requests')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      if (requestsError) throw requestsError;
      
      // Combine data for display
      setDebugInfo({
        profile,
        requests: requests || [],
      });
      
      // Try to refresh the user profile in the auth store
      await refreshUserProfile();
      
    } catch (error) {
      console.error('Error fetching subscription details:', error);
      toast.error('Error loading subscription data');
    } finally {
      setIsLoading(false);
    }
  };
  
  const refreshProfileManually = async () => {
    try {
      await refreshUserProfile();
      toast.success('User profile refreshed');
    } catch (error) {
      toast.error('Failed to refresh user profile');
    }
  };

  return (
    <div className={`mt-4 p-4 rounded-lg border ${
      isDarkMode 
        ? 'bg-gray-800/80 border-gray-700' 
        : 'bg-white/90 border-gray-200'
    }`}>
      <div className="flex justify-between items-center mb-4">
        <h3 className={`text-base font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
          <Shield className="h-4 w-4 inline-block mr-1" />
          Subscription Diagnostic
        </h3>
        <div className="flex space-x-2">
          <button
            onClick={refreshProfileManually}
            className={`p-1.5 rounded-md ${
              isDarkMode ? 'bg-blue-900/30 text-blue-400' : 'bg-blue-100 text-blue-700'
            } transition-colors hover:opacity-80`}
            title="Refresh auth store"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
          <button
            onClick={fetchSubscriptionDetails}
            disabled={isLoading}
            className={`px-3 py-1.5 rounded-md ${
              isDarkMode 
                ? 'bg-purple-900/30 text-purple-400 hover:bg-purple-900/50' 
                : 'bg-purple-100 text-purple-700 hover:bg-purple-200'
            } transition-colors`}
          >
            {isLoading ? (
              <Loader className="h-4 w-4 animate-spin" />
            ) : (
              'Check Details'
            )}
          </button>
        </div>
      </div>
      
      {user ? (
        <div>
          <div className="flex items-center mb-2">
            <User className={`h-4 w-4 mr-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} />
            <span className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              {user.email} (ID: {user.id.substring(0, 8)}...)
            </span>
          </div>
          
          <div className="flex items-center mb-3">
            <span className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              Current Subscription (Auth Store): 
            </span>
            <span className={`ml-2 px-2 py-0.5 text-xs font-medium rounded-full ${
              user.profile?.subscription_tier === 'premium'
                ? isDarkMode ? 'bg-purple-900/30 text-purple-400' : 'bg-purple-100 text-purple-700'
                : user.profile?.subscription_tier === 'friend'
                  ? isDarkMode ? 'bg-pink-900/30 text-pink-400' : 'bg-pink-100 text-pink-700'
                  : isDarkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-700'
            }`}>
              {user.profile?.subscription_tier || 'unknown'} / {user.profile?.subscription_status || 'unknown'}
            </span>
          </div>
          
          {/* Add the fix subscription button */}
          <div className="mt-3 mb-3">
            <FixSubscriptionButton isDarkMode={isDarkMode} />
          </div>
        </div>
      ) : (
        <div className={`p-3 rounded-lg ${
          isDarkMode ? 'bg-amber-900/20 text-amber-300' : 'bg-amber-50 text-amber-700'
        } flex items-center`}>
          <AlertTriangle className="h-4 w-4 mr-2" />
          <span className="text-sm">Not logged in</span>
        </div>
      )}
      
      {debugInfo && (
        <div className="mt-4 space-y-4">
          <div>
            <h4 className={`text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              Database Profile Details:
            </h4>
            <div className={`p-3 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'} text-sm font-mono overflow-x-auto`}>
              <pre className={`${isDarkMode ? 'text-gray-300' : 'text-gray-700'} whitespace-pre-wrap`}>
                {JSON.stringify({
                  subscription_tier: debugInfo.profile.subscription_tier,
                  subscription_status: debugInfo.profile.subscription_status,
                  start_date: debugInfo.profile.subscription_start_date,
                  end_date: debugInfo.profile.subscription_end_date
                }, null, 2)}
              </pre>
            </div>
          </div>
          
          <div>
            <h4 className={`text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              Subscription Requests:
            </h4>
            {debugInfo.requests.length > 0 ? (
              <div className={`p-3 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                {debugInfo.requests.map((request: any, index: number) => (
                  <div key={index} className={`mb-2 p-2 rounded ${
                    request.status === 'approved'
                      ? isDarkMode ? 'bg-green-900/30' : 'bg-green-50'
                      : request.status === 'rejected'
                        ? isDarkMode ? 'bg-red-900/30' : 'bg-red-50'
                        : isDarkMode ? 'bg-yellow-900/30' : 'bg-yellow-50'
                  }`}>
                    <div className="flex items-center">
                      {request.status === 'approved' ? (
                        <CheckCircle className={`h-4 w-4 ${isDarkMode ? 'text-green-400' : 'text-green-600'}`} />
                      ) : request.status === 'rejected' ? (
                        <AlertTriangle className={`h-4 w-4 ${isDarkMode ? 'text-red-400' : 'text-red-600'}`} />
                      ) : (
                        <Loader className={`h-4 w-4 ${isDarkMode ? 'text-yellow-400' : 'text-yellow-600'}`} />
                      )}
                      <span className={`ml-1 text-sm font-medium capitalize ${
                        request.status === 'approved'
                          ? isDarkMode ? 'text-green-400' : 'text-green-600'
                          : request.status === 'rejected'
                            ? isDarkMode ? 'text-red-400' : 'text-red-600'
                            : isDarkMode ? 'text-yellow-400' : 'text-yellow-600'
                      }`}>
                        {request.status}
                      </span>
                      <span className={`ml-2 text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        {new Date(request.created_at).toLocaleString()}
                      </span>
                    </div>
                    <div className={`mt-1 text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'} font-mono`}>
                      {`ID: ${request.id.substring(0, 8)}... | Amount: ₹${request.amount} | Plan: ${request.plan_type || 'monthly'}`}
                    </div>
                    {request.notes && (
                      <div className={`mt-1 text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        <span className="font-medium">Notes: </span>{request.notes}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className={`p-3 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'} text-sm`}>
                <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>No subscription requests found</p>
              </div>
            )}
          </div>
          
          <div className={`p-3 rounded-lg ${
            isDarkMode ? 'bg-blue-900/20 border border-blue-800/30' : 'bg-blue-50 border border-blue-200'
          }`}>
            <p className={`text-xs ${isDarkMode ? 'text-blue-300' : 'text-blue-700'}`}>
              <AlertTriangle className="h-3 w-3 inline-block mr-1" />
              If your subscription status doesn't match approved requests, use the "Fix Subscription" button
              or contact the administrator for assistance.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default SubscriptionDebug;