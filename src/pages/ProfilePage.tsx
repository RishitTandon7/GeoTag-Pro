import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Mail, Camera, Check, AlertCircle, Loader } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

const ProfilePage = () => {
  const { user, setUser } = useAuthStore();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
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

  useEffect(() => {
    if (user) {
      setEmail(user.email || '');
      setFullName(user.profile?.full_name || '');
      setAvatarUrl(user.profile?.avatar_url || '');
    }
  }, [user]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) return;
    
    setUpdating(true);
    
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: fullName,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);
      
      if (error) {
        throw error;
      }
      
      // Update local user state
      setUser({
        ...user,
        profile: {
          ...user.profile!,
          full_name: fullName
        }
      });
      
      toast.success('Profile updated successfully');
    } catch (error: any) {
      toast.error(error.message || 'Error updating profile');
      console.error('Error updating profile:', error);
    } finally {
      setUpdating(false);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Image is too large. Maximum size is 2MB.');
      return;
    }
    
    setUploadingAvatar(true);
    
    try {
      // Upload the file to Supabase Storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}-${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
      const filePath = `avatars/${fileName}`;
      
      const { error: uploadError } = await supabase.storage
        .from('user-avatars')
        .upload(filePath, file);
      
      if (uploadError) {
        throw uploadError;
      }
      
      // Get the public URL
      const { data: publicUrlData } = supabase.storage
        .from('user-avatars')
        .getPublicUrl(filePath);
      
      // Update the user profile
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          avatar_url: publicUrlData.publicUrl,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);
      
      if (updateError) {
        throw updateError;
      }
      
      // Update local user state
      setAvatarUrl(publicUrlData.publicUrl);
      setUser({
        ...user,
        profile: {
          ...user.profile!,
          avatar_url: publicUrlData.publicUrl
        }
      });
      
      toast.success('Avatar updated successfully');
    } catch (error: any) {
      toast.error(error.message || 'Error uploading avatar');
      console.error('Error uploading avatar:', error);
    } finally {
      setUploadingAvatar(false);
    }
  };

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="mb-8">
          <h1 className={`text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Your Profile</h1>
          <p className={`mt-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
            Manage your account settings and subscription
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Sidebar */}
          <div className="col-span-1">
            <div className={`rounded-lg shadow-md overflow-hidden ${
              isDarkMode ? 'bg-gray-800' : 'bg-white'
            }`}>
              <div className={`p-6 border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                <div className="flex items-center">
                  <div className="relative">
                    <div className="h-20 w-20 rounded-full overflow-hidden bg-purple-600 flex items-center justify-center text-white">
                      {avatarUrl ? (
                        <img src={avatarUrl} alt={fullName} className="h-full w-full object-cover" />
                      ) : (
                        <span className="text-3xl font-semibold">
                          {email.charAt(0).toUpperCase()}
                        </span>
                      )}
                    </div>
                    
                    <div className="absolute bottom-0 right-0">
                      <label htmlFor="avatar-upload" className={`flex items-center justify-center h-8 w-8 rounded-full cursor-pointer ${
                        isDarkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'
                      } shadow-sm`}>
                        {uploadingAvatar ? (
                          <Loader className="h-4 w-4 animate-spin text-purple-500" />
                        ) : (
                          <Camera className="h-4 w-4 text-purple-500" />
                        )}
                      </label>
                      <input
                        id="avatar-upload"
                        type="file"
                        accept="image/*"
                        onChange={handleAvatarUpload}
                        className="hidden"
                        disabled={uploadingAvatar}
                      />
                    </div>
                  </div>
                  
                  <div className="ml-4">
                    <h2 className={`text-xl font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                      {fullName || 'User'}
                    </h2>
                    <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>{email}</p>
                    <div className="mt-2">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        user?.profile?.subscription_tier === 'premium' 
                          ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300' 
                          : user?.profile?.subscription_tier === 'friend'
                            ? 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-300'
                            : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300'
                      }`}>
                        {user?.profile?.subscription_tier === 'premium' 
                          ? '✨ Premium' 
                          : user?.profile?.subscription_tier === 'friend'
                            ? '❤️ Friend' 
                            : 'Free Plan'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="p-6">
                <h3 className={`text-lg font-medium mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Subscription Info</h3>
                
                {user?.profile?.subscription_tier === 'premium' ? (
                  <div className="space-y-3">
                    <div className={`p-3 rounded-md ${isDarkMode ? 'bg-gray-700' : 'bg-purple-50'}`}>
                      <div className="flex items-start">
                        <Check className={`h-5 w-5 mt-0.5 ${isDarkMode ? 'text-purple-400' : 'text-purple-600'}`} />
                        <div className="ml-3">
                          <p className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                            Premium Subscription Active
                          </p>
                          <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                            Renews on {user.profile?.subscription_end_date 
                              ? new Date(user.profile.subscription_end_date).toLocaleDateString() 
                              : 'N/A'}
                          </p>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => navigate('/subscription')}
                      className="w-full py-2 px-3 bg-purple-600 hover:bg-purple-700 text-white rounded-md"
                    >
                      Manage Subscription
                    </button>
                  </div>
                ) : user?.profile?.subscription_tier === 'friend' ? (
                  <div className="space-y-3">
                    <div className={`p-3 rounded-md ${isDarkMode ? 'bg-gray-700' : 'bg-pink-50'}`}>
                      <div className="flex items-start">
                        <Check className={`h-5 w-5 mt-0.5 ${isDarkMode ? 'text-pink-400' : 'text-pink-600'}`} />
                        <div className="ml-3">
                          <p className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                            Friend Plan Active
                          </p>
                          <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                            Special access granted
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className={`p-3 rounded-md ${isDarkMode ? 'bg-gray-700' : 'bg-orange-50'}`}>
                      <div className="flex items-start">
                        <AlertCircle className={`h-5 w-5 mt-0.5 ${isDarkMode ? 'text-orange-400' : 'text-orange-600'}`} />
                        <div className="ml-3">
                          <p className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                            Free Plan
                          </p>
                          <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                            Upgrade to unlock premium features
                          </p>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => navigate('/pricing')}
                      className="w-full py-2 px-3 bg-purple-600 hover:bg-purple-700 text-white rounded-md"
                    >
                      Upgrade to Premium
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {/* Main Content */}
          <div className="col-span-1 md:col-span-2">
            <div className={`rounded-lg shadow-md overflow-hidden ${
              isDarkMode ? 'bg-gray-800' : 'bg-white'
            }`}>
              <div className={`p-6 border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                <h2 className={`text-xl font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  Account Information
                </h2>
                <p className={`mt-1 text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                  Update your personal information
                </p>
              </div>
              
              <div className="p-6">
                <form onSubmit={handleUpdateProfile} className="space-y-6">
                  <div>
                    <label htmlFor="fullName" className={`block text-sm font-medium ${
                      isDarkMode ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                      Full Name
                    </label>
                    <div className="mt-1 relative rounded-md shadow-sm">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <User className={`h-5 w-5 ${isDarkMode ? 'text-gray-400' : 'text-gray-400'}`} />
                      </div>
                      <input
                        id="fullName"
                        name="fullName"
                        type="text"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className={`block w-full pl-10 pr-3 py-2 border ${
                          isDarkMode 
                            ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                            : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
                        } rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500`}
                        placeholder="John Doe"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label htmlFor="email" className={`block text-sm font-medium ${
                      isDarkMode ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                      Email Address
                    </label>
                    <div className="mt-1 relative rounded-md shadow-sm">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Mail className={`h-5 w-5 ${isDarkMode ? 'text-gray-400' : 'text-gray-400'}`} />
                      </div>
                      <input
                        id="email"
                        name="email"
                        type="email"
                        value={email}
                        disabled={true}
                        className={`block w-full pl-10 pr-3 py-2 border ${
                          isDarkMode 
                            ? 'bg-gray-700 border-gray-600 text-gray-400 cursor-not-allowed' 
                            : 'bg-gray-100 border-gray-300 text-gray-500 cursor-not-allowed'
                        } rounded-md shadow-sm`}
                      />
                    </div>
                    <p className={`mt-2 text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      Email address cannot be changed
                    </p>
                  </div>
                  
                  <div className="flex items-center justify-end">
                    <button
                      type="submit"
                      disabled={updating}
                      className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-70 flex items-center"
                    >
                      {updating ? (
                        <>
                          <Loader className="animate-spin h-4 w-4 mr-2" />
                          Updating...
                        </>
                      ) : (
                        'Update Profile'
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
            
            <div className={`mt-8 rounded-lg shadow-md overflow-hidden ${
              isDarkMode ? 'bg-gray-800' : 'bg-white'
            }`}>
              <div className={`p-6 border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                <h2 className={`text-xl font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  Payment History
                </h2>
                <p className={`mt-1 text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                  View your past payments
                </p>
              </div>
              
              <div className={`p-6 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                {user?.profile?.subscription_tier === 'premium' ? (
                  <div className="overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                      <thead className={isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}>
                        <tr>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                            Date
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                            Amount
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                            Status
                          </th>
                        </tr>
                      </thead>
                      <tbody className={`divide-y ${isDarkMode ? 'divide-gray-700' : 'divide-gray-200'}`}>
                        <tr>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            {user.profile?.subscription_start_date 
                              ? new Date(user.profile.subscription_start_date).toLocaleDateString() 
                              : 'N/A'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            ₹50.00
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                              Paid
                            </span>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-sm">No payment history available</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;