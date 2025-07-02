import React, { useState, useEffect } from 'react';
import { 
  Check, 
  X, 
  Loader, 
  Search, 
  Filter,
  RefreshCw,
  AlertTriangle,
  Clock,
  CheckCircle,
  XCircle,
  Eye,
  Image,
  Download,
  Calendar,
  Info
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';
import FixSubscriptionButton from '../components/FixSubscriptionButton';

interface PendingSubscription {
  id: string;
  user_id: string;
  created_at: string;
  transaction_id: string;
  amount: number;
  status: 'pending' | 'approved' | 'rejected';
  user_name: string;
  user_email: string;
  screenshot_url?: string;
  plan_type?: 'monthly' | 'yearly';
  notes?: string;
}

const ApproveSubscriptionsPage = () => {
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });
  const [isLoading, setIsLoading] = useState(true);
  const [pendingSubscriptions, setPendingSubscriptions] = useState<PendingSubscription[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [selectedSubscription, setSelectedSubscription] = useState<PendingSubscription | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [isApproving, setIsApproving] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);
  const [debugInfo, setDebugInfo] = useState<string | null>(null);
  const { user } = useAuthStore();

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e: MediaQueryListEvent) => {
      setIsDarkMode(e.matches);
    };
    
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  const loadSubscriptions = async () => {
    setIsLoading(true);
    setDebugInfo(null);
    
    try {
      // Log the current user's email
      setDebugInfo(`Logged in as: ${user?.email || 'Not logged in'}`);

      const { data, error } = await supabase
        .from('subscription_requests')
        .select(`
          *,
          profiles (
            email,
            full_name
          )
        `)
        .order('created_at', { ascending: false });

      if (error) {
        setDebugInfo(`Error: ${error.message}`);
        throw error;
      }

      if (!data || data.length === 0) {
        setDebugInfo(`No subscription requests found. Data: ${JSON.stringify(data)}`);
      } else {
        setDebugInfo(`Found ${data.length} subscription requests`);
      }

      const enhancedData = data?.map(item => {
        return {
          ...item,
          user_email: item.profiles?.email || '',
          user_name: item.profiles?.full_name || item.profiles?.email || '',
          screenshot_url: item.screenshot_url || undefined
        };
      }) || [];

      setPendingSubscriptions(enhancedData);
    } catch (error) {
      console.error('Error loading subscriptions:', error);
      toast.error('Failed to load subscription requests');
      setDebugInfo(`Failed to load data: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Check if user is admin
    if (user) {
      const isAdmin = user.email === 'rishit@example.com' || user.email === 'rishittandon7@gmail.com';
      if (!isAdmin) {
        setDebugInfo(`User ${user.email} is not an admin. Admin access required.`);
        toast.error('Only admins can view payment requests');
      } else {
        loadSubscriptions();
      }
    } else {
      setDebugInfo('User not logged in');
    }
    
    // Subscribe to real-time changes
    const subscription = supabase
      .channel('subscription_requests_channel')
      .on(
        'postgres_changes',
        { 
          event: '*', 
          schema: 'public', 
          table: 'subscription_requests' 
        },
        (payload) => {
          console.log('Real-time update:', payload);
          loadSubscriptions();
        }
      )
      .subscribe();
      
    return () => {
      subscription.unsubscribe();
    };
  }, [user]);

  const handleApprove = async (subscriptionId: string, userId: string) => {
    if (isApproving || isRejecting) return;
    
    setIsApproving(true);
    try {
      // First update subscription request status
      const { error: updateError } = await supabase
        .from('subscription_requests')
        .update({ status: 'approved' })
        .eq('id', subscriptionId);

      if (updateError) throw updateError;

      toast.success('Subscription approved successfully');
      
      // Show animation of approved status
      const updatedSubs = pendingSubscriptions.map(sub => {
        if (sub.id === subscriptionId) {
          return { ...sub, status: 'approved' as 'approved' };
        }
        return sub;
      });
      setPendingSubscriptions(updatedSubs);
      
      // If details modal is open for this subscription, update it
      if (selectedSubscription?.id === subscriptionId) {
        setSelectedSubscription({ ...selectedSubscription, status: 'approved' });
      }
      
      // Directly call the fix user subscription function to ensure it works
      try {
        const subscription = pendingSubscriptions.find(sub => sub.id === subscriptionId);
        if (subscription) {
          const { data, error } = await supabase.rpc('fix_user_subscription', {
            user_email: subscription.user_email,
            new_tier: 'premium',
            new_status: 'active',
            duration_months: subscription.plan_type === 'yearly' ? 12 : 1
          });
          
          if (error) {
            console.error('Error using fix_user_subscription function:', error);
            setDebugInfo(`Error using fix_user_subscription: ${error.message}`);
          } else {
            setDebugInfo(`Fixed subscription using SQL function: ${data}`);
          }
        }
      } catch (fixError) {
        console.error('Error fixing subscription:', fixError);
      }
      
      // Refresh the list after a short delay to show the status change animation
      setTimeout(() => {
        loadSubscriptions();
      }, 1000);
      
    } catch (error) {
      console.error('Error approving subscription:', error);
      toast.error('Failed to approve subscription');
    } finally {
      setIsApproving(false);
    }
  };

  const handleReject = async (subscriptionId: string) => {
    if (isApproving || isRejecting) return;
    
    setIsRejecting(true);
    try {
      const { error } = await supabase
        .from('subscription_requests')
        .update({ status: 'rejected' })
        .eq('id', subscriptionId);

      if (error) throw error;

      toast.success('Subscription rejected');
      
      // Show animation of rejected status
      const updatedSubs = pendingSubscriptions.map(sub => {
        if (sub.id === subscriptionId) {
          return { ...sub, status: 'rejected' as 'rejected' };
        }
        return sub;
      });
      setPendingSubscriptions(updatedSubs);
      
      // If details modal is open for this subscription, update it
      if (selectedSubscription?.id === subscriptionId) {
        setSelectedSubscription({ ...selectedSubscription, status: 'rejected' });
      }
      
      // Refresh the list after a short delay to show the status change animation
      setTimeout(() => {
        loadSubscriptions();
      }, 1000);
      
    } catch (error) {
      console.error('Error rejecting subscription:', error);
      toast.error('Failed to reject subscription');
    } finally {
      setIsRejecting(false);
    }
  };

  const handleViewDetails = (subscription: PendingSubscription) => {
    setSelectedSubscription(subscription);
    setShowDetails(true);
  };

  const filteredSubscriptions = pendingSubscriptions.filter(sub => {
    const matchesSearch = 
      sub.user_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sub.user_email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sub.transaction_id.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesFilter = 
      filterStatus === 'all' || 
      sub.status === filterStatus;

    return matchesSearch && matchesFilter;
  });

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-gradient-to-br from-gray-900 to-purple-900' : 'bg-gradient-to-br from-purple-50 to-blue-100'} transition-colors duration-500`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className={`text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            Approve Subscriptions
          </h1>
          <p className={`mt-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
            Review and manage subscription requests
          </p>
        </div>

        {debugInfo && (
          <div className={`mb-4 p-4 rounded-lg border ${
            isDarkMode 
              ? 'bg-blue-900/30 border-blue-800/30 text-blue-300' 
              : 'bg-blue-50 border-blue-200 text-blue-800'
          }`}>
            <div className="flex items-start">
              <Info className="h-5 w-5 mr-2 mt-0.5" />
              <div className="flex-1">
                <p className="font-medium">Diagnostic Information</p>
                <pre className="mt-1 text-sm whitespace-pre-wrap">{debugInfo}</pre>
                <button 
                  onClick={loadSubscriptions}
                  className={`mt-2 text-sm font-medium px-3 py-1 rounded-md ${
                    isDarkMode 
                      ? 'bg-blue-800/50 hover:bg-blue-700/50' 
                      : 'bg-blue-100 hover:bg-blue-200'
                  }`}
                >
                  <RefreshCw className="h-3 w-3 inline mr-1" />
                  Reload Data
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Filters and Search */}
        <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="relative w-full sm:w-64">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <Search className={`h-5 w-5 ${isDarkMode ? 'text-gray-400' : 'text-gray-400'}`} />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`block w-full pl-10 pr-4 py-2 border rounded-lg ${
                isDarkMode
                  ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-400 focus:border-purple-500'
                  : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:border-purple-500'
              } focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors duration-200`}
              placeholder="Search by name, email, or ID..."
            />
          </div>
          
          <div className="flex flex-wrap gap-2 w-full sm:w-auto">
            <div className="flex rounded-lg shadow-sm overflow-hidden">
              <button
                onClick={() => setFilterStatus('all')}
                className={`px-4 py-2 text-sm transition-colors duration-300 ${
                  filterStatus === 'all'
                    ? isDarkMode
                      ? 'bg-purple-700 text-white border-purple-600'
                      : 'bg-purple-600 text-white border-purple-600'
                    : isDarkMode
                      ? 'bg-gray-700 text-gray-200 border-gray-600 hover:bg-gray-600'
                      : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                } border border-r-0 rounded-l-lg`}
              >
                All
              </button>
              <button
                onClick={() => setFilterStatus('pending')}
                className={`px-4 py-2 text-sm transition-colors duration-300 ${
                  filterStatus === 'pending'
                    ? isDarkMode
                      ? 'bg-purple-700 text-white border-purple-600'
                      : 'bg-purple-600 text-white border-purple-600'
                    : isDarkMode
                      ? 'bg-gray-700 text-gray-200 border-gray-600 hover:bg-gray-600'
                      : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                } border`}
              >
                <Clock className="h-3.5 w-3.5 inline-block mr-1" />
                Pending
              </button>
              <button
                onClick={() => setFilterStatus('approved')}
                className={`px-4 py-2 text-sm transition-colors duration-300 ${
                  filterStatus === 'approved'
                    ? isDarkMode
                      ? 'bg-purple-700 text-white border-purple-600'
                      : 'bg-purple-600 text-white border-purple-600'
                    : isDarkMode
                      ? 'bg-gray-700 text-gray-200 border-gray-600 hover:bg-gray-600'
                      : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                } border`}
              >
                <CheckCircle className="h-3.5 w-3.5 inline-block mr-1" />
                Approved
              </button>
              <button
                onClick={() => setFilterStatus('rejected')}
                className={`px-4 py-2 text-sm transition-colors duration-300 ${
                  filterStatus === 'rejected'
                    ? isDarkMode
                      ? 'bg-purple-700 text-white border-purple-600'
                      : 'bg-purple-600 text-white border-purple-600'
                    : isDarkMode
                      ? 'bg-gray-700 text-gray-200 border-gray-600 hover:bg-gray-600'
                      : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                } border border-l-0 rounded-r-lg`}
              >
                <XCircle className="h-3.5 w-3.5 inline-block mr-1" />
                Rejected
              </button>
            </div>
            
            <button
              onClick={loadSubscriptions}
              className={`p-2 rounded-lg transition-colors duration-300 ${
                isDarkMode
                  ? 'bg-gray-700 hover:bg-gray-600 text-gray-200'
                  : 'bg-white hover:bg-gray-100 text-gray-700 border border-gray-300'
              }`}
              aria-label="Refresh"
            >
              <RefreshCw className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Subscriptions Table */}
        <div className={`rounded-xl shadow-xl overflow-hidden transform transition-all hover:shadow-2xl ${
          isDarkMode ? 'bg-gray-800/80 backdrop-blur-sm border border-gray-700' : 'bg-white border border-gray-200'
        }`}>
          {isLoading ? (
            <div className="flex items-center justify-center p-8">
              <div className="flex flex-col items-center">
                <Loader className="h-12 w-12 animate-spin text-purple-600 mb-4" />
                <span className="text-lg">Loading subscription requests...</span>
              </div>
            </div>
          ) : filteredSubscriptions.length === 0 ? (
            <div className="p-12 text-center">
              <div className={`h-20 w-20 rounded-full mx-auto mb-6 flex items-center justify-center ${
                isDarkMode ? 'bg-gray-700' : 'bg-gray-100'
              }`}>
                <AlertTriangle className={`h-10 w-10 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`} />
              </div>
              <p className={`text-xl font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-500'}`}>
                No subscription requests found
              </p>
              <p className={`mt-2 text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'} max-w-md mx-auto`}>
                {searchQuery || filterStatus !== 'all'
                  ? 'Try adjusting your search criteria or filters'
                  : 'When users submit payment verification requests, they will appear here for your approval'}
              </p>
              <button 
                onClick={loadSubscriptions}
                className={`mt-4 px-4 py-2 rounded-lg ${
                  isDarkMode 
                    ? 'bg-purple-700 hover:bg-purple-600 text-white' 
                    : 'bg-purple-600 hover:bg-purple-700 text-white'
                }`}
              >
                <RefreshCw className="h-4 w-4 inline-block mr-2" />
                Refresh Data
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className={`${isDarkMode ? 'bg-gray-700/70 text-gray-200' : 'bg-gray-50 text-gray-600'}`}>
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                      User
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                      Transaction ID
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                      Amount
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                      Status
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                      Requested
                    </th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className={`divide-y ${isDarkMode ? 'divide-gray-700' : 'divide-gray-200'}`}>
                  {filteredSubscriptions.map((subscription) => (
                    <tr 
                      key={subscription.id} 
                      className={`${
                        subscription.status === 'approved' 
                          ? isDarkMode ? 'bg-green-900/10' : 'bg-green-50'
                          : subscription.status === 'rejected'
                            ? isDarkMode ? 'bg-red-900/10' : 'bg-red-50'
                            : ''
                      } transition-colors duration-200 hover:${isDarkMode ? 'bg-gray-700/50' : 'bg-gray-50'}`}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                            {subscription.user_name}
                          </div>
                          <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                            {subscription.user_email}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`font-mono text-sm ${isDarkMode ? 'text-purple-400' : 'text-purple-600'}`}>
                          {subscription.transaction_id}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                          ₹{subscription.amount}
                        </span>
                        <span className={`ml-1 text-xs ${
                          isDarkMode ? 'text-gray-400' : 'text-gray-500'
                        }`}>
                          {subscription.amount >= 400 || subscription.plan_type === 'yearly' ? '/year' : '/month'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                          subscription.status === 'approved'
                            ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                            : subscription.status === 'rejected'
                              ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                              : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                        } transition-all duration-500 transform ${subscription.status !== 'pending' ? 'animate-pulse' : ''}`}>
                          {subscription.status === 'approved' && <CheckCircle className="h-3 w-3 mr-1" />}
                          {subscription.status === 'rejected' && <XCircle className="h-3 w-3 mr-1" />}
                          {subscription.status === 'pending' && <Clock className="h-3 w-3 mr-1" />}
                          {subscription.status.charAt(0).toUpperCase() + subscription.status.slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <div className="flex items-center">
                          <Calendar className={`h-4 w-4 mr-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                          <span>{new Date(subscription.created_at).toLocaleString()}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                        <div className="flex justify-end space-x-2">
                          <button
                            onClick={() => handleViewDetails(subscription)}
                            className={`p-1.5 rounded-lg transition-colors ${
                              isDarkMode 
                                ? 'text-blue-400 hover:bg-blue-900/30' 
                                : 'text-blue-600 hover:bg-blue-100'
                            }`}
                            title="View details"
                          >
                            <Eye className="h-5 w-5" />
                          </button>
                          
                          {subscription.status === 'pending' && (
                            <>
                              <button
                                onClick={() => handleApprove(subscription.id, subscription.user_id)}
                                disabled={isApproving || isRejecting}
                                className={`p-1.5 rounded-lg transition-colors ${
                                  isDarkMode 
                                    ? 'text-green-400 hover:bg-green-900/30' 
                                    : 'text-green-600 hover:bg-green-100'
                                } ${(isApproving || isRejecting) ? 'opacity-50 cursor-not-allowed' : ''}`}
                                title="Approve subscription"
                              >
                                {isApproving && selectedSubscription?.id === subscription.id ? (
                                  <Loader className="h-5 w-5 animate-spin" />
                                ) : (
                                  <Check className="h-5 w-5" />
                                )}
                              </button>
                              <button
                                onClick={() => handleReject(subscription.id)}
                                disabled={isApproving || isRejecting}
                                className={`p-1.5 rounded-lg transition-colors ${
                                  isDarkMode 
                                    ? 'text-red-400 hover:bg-red-900/30' 
                                    : 'text-red-600 hover:bg-red-100'
                                } ${(isApproving || isRejecting) ? 'opacity-50 cursor-not-allowed' : ''}`}
                                title="Reject subscription"
                              >
                                {isRejecting && selectedSubscription?.id === subscription.id ? (
                                  <Loader className="h-5 w-5 animate-spin" />
                                ) : (
                                  <X className="h-5 w-5" />
                                )}
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Subscription Details Modal */}
      {showDetails && selectedSubscription && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div 
            className={`w-full max-w-2xl rounded-xl shadow-2xl overflow-hidden ${
              isDarkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white'
            } transform transition-all duration-300`}
          >
            <div className={`flex justify-between items-center p-6 border-b ${
              isDarkMode ? 'border-gray-700' : 'border-gray-200'
            }`}>
              <h2 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                Subscription Request Details
              </h2>
              <button
                onClick={() => setShowDetails(false)}
                className={`p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700`}
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className={`text-sm font-medium mb-2 ${
                    isDarkMode ? 'text-gray-400' : 'text-gray-500'
                  }`}>User Information</h3>
                  <div className={`p-4 rounded-lg ${
                    isDarkMode ? 'bg-gray-700' : 'bg-gray-50'
                  }`}>
                    <p className={`${isDarkMode ? 'text-white' : 'text-gray-900'} font-medium`}>{selectedSubscription.user_name}</p>
                    <p className={`${isDarkMode ? 'text-gray-300' : 'text-gray-600'} text-sm mt-1`}>{selectedSubscription.user_email}</p>
                    
                    {/* Add manual fix button to fix user subscription if approved but not activated */}
                    {selectedSubscription.status === 'approved' && (
                      <div className="mt-3 pt-3 border-t border-gray-600">
                        <div className="flex items-center justify-between mb-1">
                          <span className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                            Manual Fix:
                          </span>
                          <FixSubscriptionButton 
                            isDarkMode={isDarkMode} 
                            email={selectedSubscription.user_email}
                          />
                        </div>
                        <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                          Use this if the user's subscription isn't showing as premium.
                        </p>
                      </div>
                    )}
                  </div>
                  
                  <h3 className={`text-sm font-medium mb-2 mt-4 ${
                    isDarkMode ? 'text-gray-400' : 'text-gray-500'
                  }`}>Transaction Information</h3>
                  <div className={`p-4 rounded-lg ${
                    isDarkMode ? 'bg-gray-700' : 'bg-gray-50'
                  }`}>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-500'} text-xs`}>Transaction ID</p>
                        <p className={`${isDarkMode ? 'text-white' : 'text-gray-900'} font-mono`}>{selectedSubscription.transaction_id}</p>
                      </div>
                      <div>
                        <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-500'} text-xs`}>Amount</p>
                        <p className={`${isDarkMode ? 'text-white' : 'text-gray-900'} font-medium`}>
                          ₹{selectedSubscription.amount}
                          <span className={`ml-1 text-xs ${
                            isDarkMode ? 'text-gray-400' : 'text-gray-500'
                          }`}>
                            {selectedSubscription.amount >= 400 || selectedSubscription.plan_type === 'yearly' ? '/year' : '/month'}
                          </span>
                        </p>
                      </div>
                      <div>
                        <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-500'} text-xs`}>Requested On</p>
                        <p className={`${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                          {new Date(selectedSubscription.created_at).toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-500'} text-xs`}>Status</p>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          selectedSubscription.status === 'approved'
                            ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                            : selectedSubscription.status === 'rejected'
                              ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                              : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                        }`}>
                          {selectedSubscription.status === 'approved' && <CheckCircle className="h-3 w-3 mr-1" />}
                          {selectedSubscription.status === 'rejected' && <XCircle className="h-3 w-3 mr-1" />}
                          {selectedSubscription.status === 'pending' && <Clock className="h-3 w-3 mr-1" />}
                          {selectedSubscription.status.charAt(0).toUpperCase() + selectedSubscription.status.slice(1)}
                        </span>
                      </div>
                    </div>
                    
                    {selectedSubscription.notes && (
                      <div className="mt-3 pt-3 border-t border-gray-600">
                        <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-500'} text-xs`}>Notes</p>
                        <p className={`${isDarkMode ? 'text-white' : 'text-gray-900'} text-sm mt-1`}>{selectedSubscription.notes}</p>
                      </div>
                    )}
                  </div>
                </div>
                
                <div>
                  <h3 className={`text-sm font-medium mb-2 ${
                    isDarkMode ? 'text-gray-400' : 'text-gray-500'
                  }`}>Payment Screenshot</h3>
                  
                  {selectedSubscription.screenshot_url ? (
                    <div className="relative">
                      <img 
                        src={selectedSubscription.screenshot_url} 
                        alt="Payment screenshot" 
                        className="w-full h-48 object-cover object-top rounded-lg shadow-md"
                      />
                      <button 
                        onClick={() => window.open(selectedSubscription.screenshot_url, '_blank')}
                        className={`absolute bottom-2 right-2 p-1.5 rounded-lg ${
                          isDarkMode ? 'bg-gray-800/80 text-white' : 'bg-white/80 text-gray-900'
                        } backdrop-blur-sm shadow-sm`}
                      >
                        <Download className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <div className={`flex flex-col items-center justify-center h-48 rounded-lg ${
                      isDarkMode ? 'bg-gray-700' : 'bg-gray-100'
                    }`}>
                      <Image className={`h-12 w-12 mb-2 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`} />
                      <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        No screenshot provided
                      </p>
                    </div>
                  )}
                </div>
              </div>
              
              {selectedSubscription.status === 'pending' && (
                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    onClick={() => handleReject(selectedSubscription.id)}
                    disabled={isApproving || isRejecting}
                    className={`px-4 py-2 rounded-lg flex items-center ${
                      isDarkMode 
                        ? 'bg-red-900/30 text-red-300 hover:bg-red-900/50' 
                        : 'bg-red-50 text-red-700 hover:bg-red-100'
                    } transition-colors ${(isApproving || isRejecting) ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    {isRejecting ? (
                      <Loader className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <X className="h-4 w-4 mr-2" />
                    )}
                    Reject Request
                  </button>
                  <button
                    onClick={() => handleApprove(selectedSubscription.id, selectedSubscription.user_id)}
                    disabled={isApproving || isRejecting}
                    className={`px-4 py-2 rounded-lg flex items-center ${
                      isDarkMode 
                        ? 'bg-green-900/30 text-green-300 hover:bg-green-900/50' 
                        : 'bg-green-600 text-white hover:bg-green-700'
                    } transition-colors ${(isApproving || isRejecting) ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    {isApproving ? (
                      <Loader className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <Check className="h-4 w-4 mr-2" />
                    )}
                    Approve & Activate
                  </button>
                </div>
              )}
              
              {selectedSubscription.status !== 'pending' && (
                <div className={`mt-6 p-4 rounded-lg ${
                  selectedSubscription.status === 'approved'
                    ? isDarkMode ? 'bg-green-900/20 border border-green-800/30' : 'bg-green-50 border border-green-200'
                    : isDarkMode ? 'bg-red-900/20 border border-red-800/30' : 'bg-red-50 border border-red-200'
                }`}>
                  <div className="flex items-start">
                    {selectedSubscription.status === 'approved' ? (
                      <CheckCircle className={`h-5 w-5 mt-0.5 ${isDarkMode ? 'text-green-400' : 'text-green-600'}`} />
                    ) : (
                      <XCircle className={`h-5 w-5 mt-0.5 ${isDarkMode ? 'text-red-400' : 'text-red-600'}`} />
                    )}
                    <div className="ml-3">
                      <p className={`text-sm font-medium ${
                        selectedSubscription.status === 'approved'
                          ? isDarkMode ? 'text-green-300' : 'text-green-800'
                          : isDarkMode ? 'text-red-300' : 'text-red-800'
                      }`}>
                        {selectedSubscription.status === 'approved' 
                          ? 'This subscription has been approved' 
                          : 'This subscription has been rejected'}
                      </p>
                      <p className={`mt-1 text-xs ${
                        selectedSubscription.status === 'approved'
                          ? isDarkMode ? 'text-green-400/70' : 'text-green-700'
                          : isDarkMode ? 'text-red-400/70' : 'text-red-700'
                      }`}>
                        {selectedSubscription.status === 'approved'
                          ? "The user's account has been upgraded to Premium status."
                          : "The user has been notified of the rejection."}
                      </p>
                      
                      {selectedSubscription.status === 'approved' && (
                        <div className="mt-3 pt-3 border-t border-green-800/30 dark:border-green-700/30">
                          <FixSubscriptionButton 
                            isDarkMode={isDarkMode} 
                            email={selectedSubscription.user_email}
                          />
                          <p className={`mt-1 text-xs ${isDarkMode ? 'text-green-400/70' : 'text-green-600'}`}>
                            If the user reports their subscription isn't active, use this to fix it manually.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            <div className={`flex justify-end p-4 border-t ${
              isDarkMode ? 'border-gray-700' : 'border-gray-200'
            }`}>
              <button
                onClick={() => setShowDetails(false)}
                className={`px-4 py-2 rounded-lg ${
                  isDarkMode 
                    ? 'bg-gray-700 hover:bg-gray-600 text-gray-200' 
                    : 'bg-gray-100 hover:bg-gray-200 text-gray-800'
                }`}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ApproveSubscriptionsPage;