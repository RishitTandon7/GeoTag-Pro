import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Check, 
  X, 
  Plus, 
  KeyRound, 
  Copy, 
  Eye, 
  Trash2, 
  Search, 
  RefreshCw, 
  Loader, 
  Filter, 
  Download,
  ClipboardCheck
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

const AdminPage = () => {
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });
  const [adminPassword, setAdminPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [friendCodes, setFriendCodes] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isGeneratingCode, setIsGeneratingCode] = useState(false);
  const [showGenerateForm, setShowGenerateForm] = useState(false);
  const [codeFormat, setCodeFormat] = useState('FRIEND-XXXX-XXXX');
  const [codeCount, setCodeCount] = useState(1);
  const [filterActive, setFilterActive] = useState<boolean | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedCodeId, setCopiedCodeId] = useState('');
  const navigate = useNavigate();
  const { user } = useAuthStore();

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e: MediaQueryListEvent) => {
      setIsDarkMode(e.matches);
    };
    
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    if (!isAuthenticated && (user.email !== 'rishit@example.com' && user.email !== 'rishittandon7@gmail.com')) {
      toast.error('Unauthorized. Only the administrator can access this page.');
      navigate('/');
      return;
    }

    loadFriendCodes();
  }, [user, navigate]);

  const loadFriendCodes = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('friend_codes')
        .select(`
          id, 
          code, 
          created_at, 
          is_active, 
          redeemed_by, 
          redeemed_at,
          profiles:redeemed_by (
            email,
            full_name,
            subscription_status
          )
        `)
        .order('created_at', { ascending: false });
      
      if (error) {
        throw error;
      }
      
      setFriendCodes(data || []);
    } catch (error: any) {
      toast.error(`Failed to load friend codes: ${error.message}`);
      console.error('Error loading friend codes:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateCode = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (codeCount < 1 || codeCount > 50) {
      toast.error('Count must be between 1 and 50');
      return;
    }
    
    setIsGeneratingCode(true);
    
    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-friend-code`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
        },
        body: JSON.stringify({ 
          count: codeCount,
          format: codeFormat
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to generate friend code');
      }
      
      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }
      
      toast.success(`Generated ${data.count} friend code${data.count !== 1 ? 's' : ''}`);
      loadFriendCodes();
      setShowGenerateForm(false);
    } catch (error: any) {
      toast.error(error.message || 'Error generating friend code');
      console.error('Error generating friend code:', error);
    } finally {
      setIsGeneratingCode(false);
    }
  };

  const handleToggleCodeStatus = async (id: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from('friend_codes')
        .update({
          is_active: !isActive
        })
        .eq('id', id);
      
      if (error) {
        throw error;
      }
      
      toast.success(`Friend code ${isActive ? 'deactivated' : 'activated'}`);
      loadFriendCodes();
    } catch (error: any) {
      toast.error(`Failed to update code: ${error.message}`);
      console.error('Error updating code:', error);
    }
  };

  const handleDeleteCode = async (id: string) => {
    if (!confirm('Are you sure you want to delete this friend code?')) {
      return;
    }
    
    try {
      const { error } = await supabase
        .from('friend_codes')
        .delete()
        .eq('id', id);
      
      if (error) {
        throw error;
      }
      
      toast.success('Friend code deleted');
      loadFriendCodes();
    } catch (error: any) {
      toast.error(`Failed to delete code: ${error.message}`);
      console.error('Error deleting code:', error);
    }
  };

  const copyCodeToClipboard = (id: string, code: string) => {
    navigator.clipboard.writeText(code)
      .then(() => {
        setCopiedCodeId(id);
        toast.success('Code copied to clipboard');
        
        setTimeout(() => {
          setCopiedCodeId('');
        }, 3000);
      })
      .catch((error) => {
        console.error('Error copying to clipboard:', error);
        toast.error('Failed to copy code');
      });
  };

  const exportCodesToCSV = () => {
    const filteredCodes = getFilteredCodes();
    
    const csvContent = [
      ['Code', 'Created At', 'Status', 'Redeemed By', 'Redeemed At', 'Payment Status'].join(','),
      ...filteredCodes.map(code => [
        code.code,
        new Date(code.created_at).toLocaleString(),
        code.is_active ? 'Active' : 'Inactive',
        code.profiles?.email || '',
        code.redeemed_at ? new Date(code.redeemed_at).toLocaleString() : '',
        code.profiles?.subscription_status === 'active' ? 'Paid' : code.redeemed_by ? 'Pending' : 'Not Used'
      ].join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('hidden', '');
    a.setAttribute('href', url);
    a.setAttribute('download', `friend-codes-${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const getFilteredCodes = () => {
    return friendCodes.filter(code => {
      if (filterActive !== null && code.is_active !== filterActive) {
        return false;
      }
      
      if (searchQuery) {
        const lowerCaseQuery = searchQuery.toLowerCase();
        const codeMatch = code.code.toLowerCase().includes(lowerCaseQuery);
        const emailMatch = code.profiles?.email?.toLowerCase().includes(lowerCaseQuery);
        const nameMatch = code.profiles?.full_name?.toLowerCase().includes(lowerCaseQuery);
        
        return codeMatch || emailMatch || nameMatch;
      }
      
      return true;
    });
  };

  const filteredCodes = getFilteredCodes();
  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (adminPassword === 'admin123') {
      setIsAuthenticated(true);
    } else {
      toast.error('Invalid admin password');
    }
  };

  if (!isAuthenticated) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <div className={`max-w-md w-full p-8 rounded-lg shadow-lg ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
          <h2 className={`text-2xl font-bold mb-6 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Admin Login</h2>
          <form onSubmit={handleAdminLogin}>
            <div className="mb-4">
              <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Password
              </label>
              <input
                type="password"
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                className={`w-full px-3 py-2 border rounded-md ${
                  isDarkMode 
                    ? 'bg-gray-700 border-gray-600 text-white' 
                    : 'bg-white border-gray-300 text-gray-900'
                }`}
                placeholder="Enter admin password"
              />
            </div>
            <button
              type="submit"
              className="w-full bg-purple-600 text-white py-2 px-4 rounded-md hover:bg-purple-700"
            >
              Login
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h1 className={`text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            Friend Code Administration
          </h1>
          <p className={`mt-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
            Generate and manage friend codes for free premium access
          </p>
        </div>
        
        <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="relative w-full sm:w-64">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <Search className={`h-5 w-5 ${isDarkMode ? 'text-gray-400' : 'text-gray-400'}`} />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`block w-full pl-10 pr-4 py-2 border rounded-md ${
                isDarkMode
                  ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-400'
                  : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
              } focus:ring-2 focus:ring-purple-500 focus:border-purple-500`}
              placeholder="Search codes or users..."
            />
          </div>
          
          <div className="flex flex-wrap gap-2 w-full sm:w-auto">
            <div className="flex rounded-md shadow-sm">
              <button
                onClick={() => setFilterActive(null)}
                className={`px-3 py-2 text-sm border border-r-0 rounded-l-md ${
                  filterActive === null
                    ? isDarkMode
                      ? 'bg-purple-700 text-white border-purple-600'
                      : 'bg-purple-600 text-white border-purple-600'
                    : isDarkMode
                      ? 'bg-gray-700 text-gray-200 border-gray-600'
                      : 'bg-white text-gray-700 border-gray-300'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setFilterActive(true)}
                className={`px-3 py-2 text-sm border ${
                  filterActive === true
                    ? isDarkMode
                      ? 'bg-purple-700 text-white border-purple-600'
                      : 'bg-purple-600 text-white border-purple-600'
                    : isDarkMode
                      ? 'bg-gray-700 text-gray-200 border-gray-600'
                      : 'bg-white text-gray-700 border-gray-300'
                }`}
              >
                Active
              </button>
              <button
                onClick={() => setFilterActive(false)}
                className={`px-3 py-2 text-sm border border-l-0 rounded-r-md ${
                  filterActive === false
                    ? isDarkMode
                      ? 'bg-purple-700 text-white border-purple-600'
                      : 'bg-purple-600 text-white border-purple-600'
                    : isDarkMode
                      ? 'bg-gray-700 text-gray-200 border-gray-600'
                      : 'bg-white text-gray-700 border-gray-300'
                }`}
              >
                Inactive
              </button>
            </div>
            
            <button
              onClick={() => loadFriendCodes()}
              className={`px-2 py-2 rounded-md ${
                isDarkMode
                  ? 'bg-gray-700 hover:bg-gray-600 text-gray-200'
                  : 'bg-white hover:bg-gray-100 text-gray-700 border border-gray-300'
              }`}
              aria-label="Refresh"
            >
              <RefreshCw className="h-5 w-5" />
            </button>
            
            <button
              onClick={exportCodesToCSV}
              className={`px-3 py-2 rounded-md flex items-center ${
                isDarkMode
                  ? 'bg-gray-700 hover:bg-gray-600 text-gray-200'
                  : 'bg-white hover:bg-gray-100 text-gray-700 border border-gray-300'
              }`}
            >
              <Download className="h-4 w-4 mr-1" />
              <span>Export</span>
            </button>
            
            <button
              onClick={() => setShowGenerateForm(true)}
              className="px-3 py-2 rounded-md flex items-center bg-purple-600 hover:bg-purple-700 text-white"
            >
              <Plus className="h-4 w-4 mr-1" />
              <span>Generate Codes</span>
            </button>
          </div>
        </div>
        
        <div className={`overflow-hidden shadow-md border rounded-lg ${
          isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
        }`}>
          {isLoading ? (
            <div className="flex items-center justify-center p-8">
              <Loader className="h-8 w-8 animate-spin text-purple-600" />
              <span className="ml-2">Loading friend codes...</span>
            </div>
          ) : filteredCodes.length === 0 ? (
            <div className="p-8 text-center">
              <KeyRound className={`h-12 w-12 mx-auto mb-4 ${isDarkMode ? 'text-gray-600' : 'text-gray-300'}`} />
              <p className={`text-lg font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                {searchQuery || filterActive !== null
                  ? 'No friend codes match your search criteria'
                  : 'No friend codes yet'}
              </p>
              <button
                onClick={() => setShowGenerateForm(true)}
                className="mt-4 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-md flex items-center mx-auto"
              >
                <Plus className="h-4 w-4 mr-2" />
                Generate Your First Code
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className={isDarkMode ? 'bg-gray-700 text-gray-200' : 'bg-gray-50 text-gray-600'}>
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                      Code
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                      Created
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                      Status
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                      Redeemed By
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                      Redeemed On
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                      Payment Status
                    </th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className={`divide-y ${isDarkMode ? 'divide-gray-700' : 'divide-gray-200'}`}>
                  {filteredCodes.map((code) => (
                    <tr 
                      key={code.id} 
                      className={code.is_active ? "" : isDarkMode ? "bg-gray-800/50" : "bg-gray-50"}
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center">
                          <span className="font-mono">{code.code}</span>
                          <button 
                            onClick={() => copyCodeToClipboard(code.id, code.code)}
                            className="ml-2 p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"
                          >
                            {copiedCodeId === code.id ? (
                              <ClipboardCheck className="h-4 w-4 text-green-500" />
                            ) : (
                              <Copy className="h-4 w-4 text-gray-400" />
                            )}
                          </button>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {new Date(code.created_at).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          code.is_active
                            ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                            : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                        }`}>
                          {code.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {code.profiles ? (
                          <span>
                            {code.profiles.full_name || code.profiles.email}
                          </span>
                        ) : (
                          <span className="text-gray-500 dark:text-gray-400">Not redeemed</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {code.redeemed_at ? (
                          new Date(code.redeemed_at).toLocaleString()
                        ) : (
                          <span className="text-gray-500 dark:text-gray-400">—</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {code.profiles?.subscription_status === 'active' ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                            Paid
                          </span>
                        ) : code.redeemed_by ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400">
                            Pending
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400">
                            Not Used
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                        <div className="flex justify-end items-center space-x-2">
                          {code.redeemed_by ? (
                            <button 
                              className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700"
                              title="View user"
                            >
                              <Eye className="h-4 w-4 text-blue-500" />
                            </button>
                          ) : (
                            <button 
                              onClick={() => handleToggleCodeStatus(code.id, code.is_active)}
                              className={`p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 ${
                                code.is_active ? 'text-amber-500' : 'text-green-500'
                              }`}
                              title={code.is_active ? 'Deactivate code' : 'Activate code'}
                            >
                              {code.is_active ? (
                                <X className="h-4 w-4" />
                              ) : (
                                <Check className="h-4 w-4" />
                              )}
                            </button>
                          )}
                          {!code.redeemed_by && (
                            <button 
                              onClick={() => handleDeleteCode(code.id)}
                              className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 text-red-500"
                              title="Delete code"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
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

      {showGenerateForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className={`w-full max-w-md rounded-lg shadow-xl p-6 ${
            isDarkMode ? 'bg-gray-800' : 'bg-white'
          }`}>
            <div className="flex justify-between items-center mb-4">
              <h2 className={`text-xl font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                Generate Friend Codes
              </h2>
              <button 
                onClick={() => setShowGenerateForm(false)}
                className={`p-1 rounded-full ${
                  isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-200'
                }`}
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <form onSubmit={handleGenerateCode} className="space-y-4">
              <div>
                <label className={`block text-sm font-medium mb-1 ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Code Format
                </label>
                <input
                  type="text"
                  value={codeFormat}
                  onChange={(e) => setCodeFormat(e.target.value)}
                  className={`w-full px-3 py-2 rounded-md border ${
                    isDarkMode
                      ? 'bg-gray-700 border-gray-600 text-white'
                      : 'bg-white border-gray-300 text-gray-900'
                  } focus:ring-2 focus:ring-purple-500 focus:border-purple-500`}
                  placeholder="FRIEND-XXXX-XXXX"
                />
                <p className={`mt-1 text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  Use X for random characters. Example: FRIEND-XXXX-XXXX
                </p>
              </div>
              
              <div>
                <label className={`block text-sm font-medium mb-1 ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Number of Codes
                </label>
                <input
                  type="number"
                  min="1"
                  max="50"
                  value={codeCount}
                  onChange={(e) => setCodeCount(parseInt(e.target.value))}
                  className={`w-full px-3 py-2 rounded-md border ${
                    isDarkMode
                      ? 'bg-gray-700 border-gray-600 text-white'
                      : 'bg-white border-gray-300 text-gray-900'
                  } focus:ring-2 focus:ring-purple-500 focus:border-purple-500`}
                  placeholder="1"
                />
                <p className={`mt-1 text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  Generate between 1 and 50 codes at a time
                </p>
              </div>
              
              <div className="pt-4 flex justify-end">
                <button
                  type="button"
                  onClick={() => setShowGenerateForm(false)}
                  className={`px-4 py-2 rounded-md mr-2 ${
                    isDarkMode
                      ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isGeneratingCode}
                  className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-70 flex items-center"
                >
                  {isGeneratingCode ? (
                    <>
                      <Loader className="animate-spin h-4 w-4 mr-2" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <KeyRound className="h-4 w-4 mr-2" />
                      Generate
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPage;