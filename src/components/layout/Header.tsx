import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { MapPin, Menu, X, Upload, User, Search, Heart, LogOut, Shield, BarChart3, Clipboard, Crown } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { supabase } from '../../lib/supabase';
import toast from 'react-hot-toast';

interface HeaderProps {
  isDarkMode?: boolean;
}

const Header = ({ isDarkMode = false }: HeaderProps) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [localDarkMode, setLocalDarkMode] = useState(isDarkMode);
  const { user, setUser, setIsLoading } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    setLocalDarkMode(isDarkMode);
  }, [isDarkMode]);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e: MediaQueryListEvent) => {
      setLocalDarkMode(e.matches);
    };
    
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  const handleSignOut = async () => {
    try {
      setIsLoading(true);
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        throw error;
      }
      
      // Clear user state
      setUser(null);
      
      // Close menus
      setIsUserMenuOpen(false);
      setIsMenuOpen(false);
      
      // Show success message
      toast.success('Signed out successfully');
      
      // Navigate to home page
      navigate('/');
    } catch (error: any) {
      console.error('Error signing out:', error);
      toast.error('Error signing out');
    } finally {
      setIsLoading(false);
    }
  };

  // Check if user is admin (Rishit's or Koushani's account)
  const isAdmin = user && (
    user.email === 'rishit@example.com' || 
    user.email === 'rishittandon7@gmail.com' ||
    user.email === 'koushani.nath@queen.com'
  );

  // Check if user is the queen
  const isQueen = user && user.email === 'koushani.nath@queen.com';

  return (
    <header className={`sticky top-0 z-50 border-b ${localDarkMode 
      ? 'bg-gray-800 border-gray-700' 
      : 'bg-neutral-50 border-neutral-200'} shadow-sm transition-colors duration-200`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex-shrink-0 flex items-center mr-2">
              <div className="h-9 w-9 bg-gradient-to-br from-primary to-primary-dark rounded-lg flex items-center justify-center shadow-md">
                <MapPin className="h-5 w-5 text-neutral-50" />
              </div>
              <span className={`ml-2 text-xl font-bold hidden sm:block ${localDarkMode ? 'text-white' : 'text-primary'}`}>GeoTag Pro</span>
            </Link>
            <nav className="hidden md:ml-6 md:flex md:space-x-8">
              <Link to="/editor" className={`px-3 py-2 text-sm font-medium ${localDarkMode 
                ? 'text-gray-300 hover:text-purple-400' 
                : 'text-primary hover:text-accent'} transition-colors`}>
                Editor
              </Link>
              <Link to="/pricing" className={`px-3 py-2 text-sm font-medium ${localDarkMode 
                ? 'text-gray-300 hover:text-purple-400' 
                : 'text-primary hover:text-accent'} transition-colors flex items-center`}>
                <span>Pricing</span>
                <Heart className="ml-1 h-3 w-3 text-purple-500" />
              </Link>
              {isAdmin && (
                <>
                  <Link to="/admin" className={`px-3 py-2 text-sm font-medium ${localDarkMode 
                    ? 'text-gray-300 hover:text-purple-400' 
                    : 'text-primary hover:text-accent'} transition-colors flex items-center`}>
                    <span>Admin</span>
                    {isQueen ? (
                      <Crown className="ml-1 h-3 w-3 text-yellow-500" />
                    ) : (
                      <Shield className="ml-1 h-3 w-3 text-purple-500" />
                    )}
                  </Link>
                  <Link to="/dashboard" className={`px-3 py-2 text-sm font-medium ${localDarkMode 
                    ? 'text-gray-300 hover:text-purple-400' 
                    : 'text-primary hover:text-accent'} transition-colors flex items-center`}>
                    <span>Dashboard</span>
                    <BarChart3 className="ml-1 h-3 w-3 text-purple-500" />
                  </Link>
                  <Link to="/approve-subscriptions" className={`px-3 py-2 text-sm font-medium ${localDarkMode 
                    ? 'text-gray-300 hover:text-purple-400' 
                    : 'text-primary hover:text-accent'} transition-colors flex items-center`}>
                    <span>Approve Subscriptions</span>
                    <Clipboard className="ml-1 h-3 w-3 text-purple-500" />
                  </Link>
                </>
              )}
            </nav>
          </div>
          <div className="hidden md:flex items-center">
            <button className={`p-1 rounded-full ${localDarkMode 
              ? 'text-gray-300 hover:text-purple-400' 
              : 'text-primary hover:text-accent'} transition-colors focus:outline-none`}>
              <Search className="h-6 w-6" />
            </button>
            
            {user ? (
              <div className="ml-4 relative">
                <button 
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className={`flex items-center focus:outline-none ${localDarkMode 
                    ? 'text-gray-300 hover:text-purple-400' 
                    : 'text-primary hover:text-accent'}`}
                >
                  <div className={`h-10 w-10 rounded-full overflow-hidden ${
                    isQueen ? 'bg-yellow-500' : 'bg-purple-600'
                  } flex items-center justify-center text-white`}>
                    {user.profile?.avatar_url ? (
                      <img src={user.profile.avatar_url} alt={user.email || ''} className="h-full w-full object-cover" />
                    ) : isQueen ? (
                      <Crown className="h-6 w-6 text-white" />
                    ) : (
                      <span className="text-lg font-semibold">
                        {user.email?.charAt(0).toUpperCase() || 'U'}
                      </span>
                    )}
                  </div>
                  <span className="ml-2 font-medium hidden lg:block">
                    {user.profile?.full_name || user.email?.split('@')[0] || 'User'}
                  </span>
                </button>
                
                {isUserMenuOpen && (
                  <div className={`absolute right-0 mt-2 w-48 rounded-md shadow-lg py-1 z-10 ${
                    localDarkMode ? 'bg-gray-700' : 'bg-white'
                  } ring-1 ring-black ring-opacity-5`}>
                    <div className={`px-4 py-2 text-sm ${localDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                      <p className="font-medium truncate">{user.email}</p>
                      <p className={`text-xs ${localDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        {user.profile?.subscription_tier === 'premium' 
                          ? '✨ Premium' 
                          : user.profile?.subscription_tier === 'friend'
                            ? '❤️ Friend' 
                            : 'Free Plan'}
                      </p>
                    </div>
                    <hr className={localDarkMode ? 'border-gray-600' : 'border-gray-200'} />
                    {isAdmin && (
                      <>
                        <Link 
                          to="/admin" 
                          className={`block px-4 py-2 text-sm ${localDarkMode 
                            ? 'text-gray-300 hover:bg-gray-600' 
                            : 'text-gray-700 hover:bg-gray-100'}`}
                          onClick={() => setIsUserMenuOpen(false)}
                        >
                          {isQueen ? (
                            <Crown className="h-4 w-4 inline mr-1 text-yellow-500" />
                          ) : (
                            <Shield className="h-4 w-4 inline mr-1" />
                          )}
                          Admin Panel
                        </Link>
                        <Link
                          to="/dashboard"
                          className={`block px-4 py-2 text-sm ${
                            localDarkMode 
                              ? 'text-gray-300 hover:bg-gray-600' 
                              : 'text-gray-700 hover:bg-gray-100'
                          }`}
                          onClick={() => setIsUserMenuOpen(false)}
                        >
                          <BarChart3 className="h-4 w-4 inline mr-1" />
                          Dashboard
                        </Link>
                        <Link
                          to="/approve-subscriptions"
                          className={`block px-4 py-2 text-sm ${
                            localDarkMode 
                              ? 'text-gray-300 hover:bg-gray-600' 
                              : 'text-gray-700 hover:bg-gray-100'
                          }`}
                          onClick={() => setIsUserMenuOpen(false)}
                        >
                          <Clipboard className="h-4 w-4 inline mr-1" />
                          Approve Subscriptions
                        </Link>
                      </>
                    )}
                    <Link 
                      to="/profile" 
                      className={`block px-4 py-2 text-sm ${localDarkMode 
                        ? 'text-gray-300 hover:bg-gray-600' 
                        : 'text-gray-700 hover:bg-gray-100'}`}
                      onClick={() => setIsUserMenuOpen(false)}
                    >
                      Your Profile
                    </Link>
                    <Link 
                      to="/subscription" 
                      className={`block px-4 py-2 text-sm ${localDarkMode 
                        ? 'text-gray-300 hover:bg-gray-600' 
                        : 'text-gray-700 hover:bg-gray-100'}`}
                      onClick={() => setIsUserMenuOpen(false)}
                    >
                      Subscription
                    </Link>
                    <button
                      onClick={handleSignOut}
                      className={`block w-full text-left px-4 py-2 text-sm ${localDarkMode 
                        ? 'text-gray-300 hover:bg-gray-600' 
                        : 'text-gray-700 hover:bg-gray-100'}`}
                    >
                      <LogOut className="h-4 w-4 inline mr-1" />
                      Sign out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="ml-4 flex space-x-2">
                <Link 
                  to="/login"
                  className={`px-4 py-2 rounded-md text-sm font-medium ${localDarkMode 
                    ? 'bg-gray-700 text-white hover:bg-gray-600' 
                    : 'bg-gray-200 text-gray-800 hover:bg-gray-300'}`}
                >
                  Log in
                </Link>
                <Link 
                  to="/register"
                  className="px-4 py-2 rounded-md text-sm font-medium text-white bg-purple-600 hover:bg-purple-700"
                >
                  Sign up
                </Link>
              </div>
            )}
          </div>
          <div className="-mr-2 flex items-center md:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className={`p-2 rounded-md ${isDarkMode 
                ? 'text-gray-300 hover:text-purple-400' 
                : 'text-primary hover:text-accent'} transition-colors focus:outline-none`}
            >
              {isMenuOpen ? (
                <X className="h-6 w-6" aria-hidden="true" />
              ) : (
                <Menu className="h-6 w-6" aria-hidden="true" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isMenuOpen && (
        <div className={`fixed inset-0 z-50 md:hidden ${localDarkMode ? 'bg-gray-800' : 'bg-neutral-50'}`}>
          <div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-700">
            <Link to="/" className="flex items-center" onClick={() => setIsMenuOpen(false)}>
              <div className="h-9 w-9 bg-gradient-to-br from-primary to-primary-dark rounded-lg flex items-center justify-center shadow-md">
                <MapPin className="h-5 w-5 text-neutral-50" />
              </div>
              <span className={`ml-2 text-xl font-bold ${localDarkMode ? 'text-white' : 'text-primary'}`}>GeoTag Pro</span>
            </Link>
            <button
              onClick={() => setIsMenuOpen(false)}
              className={`p-2 rounded-md ${localDarkMode ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-600 hover:bg-gray-100'}`}
            >
              <X className="h-6 w-6" />
            </button>
          </div>
          
          <div className="px-2 pt-2 pb-3 space-y-2 sm:px-3">
            <Link
              to="/editor"
              className={`block px-3 py-2 rounded-md text-base font-medium ${localDarkMode 
                ? 'text-gray-300 hover:bg-gray-700' 
                : 'text-primary hover:bg-neutral-100'} transition-colors`}
              onClick={() => setIsMenuOpen(false)}
            >
              Editor
            </Link>
            <Link
              to="/pricing"
              className={`block px-3 py-2 rounded-md text-base font-medium ${localDarkMode 
                ? 'text-gray-300 hover:bg-gray-700' 
                : 'text-primary hover:bg-neutral-100'} transition-colors flex items-center`}
              onClick={() => setIsMenuOpen(false)}
            >
              <span>Pricing</span>
              <Heart className="ml-1 h-3 w-3 text-purple-500" />
            </Link>
            {isAdmin && (
              <>
                <Link
                  to="/admin"
                  className={`block px-3 py-2 rounded-md text-base font-medium ${localDarkMode 
                    ? 'text-gray-300 hover:bg-gray-700' 
                    : 'text-primary hover:bg-neutral-100'} transition-colors flex items-center`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  <span>Admin</span>
                  {isQueen ? (
                    <Crown className="ml-1 h-3 w-3 text-yellow-500" />
                  ) : (
                    <Shield className="ml-1 h-3 w-3 text-purple-500" />
                  )}
                </Link>
                <Link
                  to="/dashboard"
                  className={`block px-3 py-2 rounded-md text-base font-medium ${localDarkMode 
                    ? 'text-gray-300 hover:bg-gray-700' 
                    : 'text-primary hover:bg-neutral-100'} transition-colors flex items-center`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  <span>Dashboard</span>
                  <BarChart3 className="ml-1 h-3 w-3 text-purple-500" />
                </Link>
                <Link
                  to="/approve-subscriptions"
                  className={`block px-3 py-2 rounded-md text-base font-medium ${localDarkMode 
                    ? 'text-gray-300 hover:bg-gray-700' 
                    : 'text-primary hover:bg-neutral-100'} transition-colors flex items-center`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  <span>Approve Subscriptions</span>
                  <Clipboard className="ml-1 h-3 w-3 text-purple-500" />
                </Link>
              </>
            )}
          </div>
          
          {/* Add login/signup buttons for mobile */}
          {!user ? (
            <div className="fixed bottom-0 left-0 right-0 p-4 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 space-y-2">
              <Link
                to="/login"
                className={`block w-full px-3 py-2 rounded-md text-center font-medium ${
                  isDarkMode
                    ? 'bg-gray-700 text-white hover:bg-gray-600'
                    : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                }`}
                onClick={() => setIsMenuOpen(false)}
              >
                Log in
              </Link>
              <Link
                to="/register"
                className={`block w-full px-3 py-2 rounded-md text-center font-medium ${
                  isDarkMode
                    ? 'bg-purple-600 text-white hover:bg-purple-700'
                    : 'bg-purple-600 text-white hover:bg-purple-700'
                }`}
                onClick={() => setIsMenuOpen(false)}
              >
                Sign up
              </Link>
            </div>
          ) : (
            <div className="pt-4 pb-3 border-t border-gray-200 dark:border-gray-700">
              <div className="flex items-center px-5 py-2">
                <div className={`h-10 w-10 rounded-full overflow-hidden ${
                  isQueen ? 'bg-yellow-500' : 'bg-purple-600'
                } flex items-center justify-center text-white`}>
                  {user.profile?.avatar_url ? (
                    <img src={user.profile.avatar_url} alt={user.email || ''} className="h-full w-full object-cover" />
                  ) : isQueen ? (
                    <Crown className="h-6 w-6 text-white" />
                  ) : (
                    <span className="text-lg font-semibold">
                      {user.email?.charAt(0).toUpperCase() || 'U'}
                    </span>
                  )}
                </div>
                <div className="ml-3">
                  <p className={`text-base font-medium ${localDarkMode ? 'text-white' : 'text-gray-800'}`}>
                    {user.profile?.full_name || user.email?.split('@')[0] || 'User'}
                  </p>
                  <p className={`text-sm ${localDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    {user.email}
                  </p>
                </div>
              </div>
              <div className="mt-3 px-2 space-y-1">
                {isAdmin && (
                  <>
                    <Link
                      to="/admin"
                      className={`block px-3 py-2 rounded-md text-base font-medium ${localDarkMode 
                        ? 'text-gray-300 hover:bg-gray-700' 
                        : 'text-gray-700 hover:bg-gray-100'}`}
                      onClick={() => setIsMenuOpen(false)}
                    >
                      {isQueen ? (
                        <Crown className="h-4 w-4 inline mr-1 text-yellow-500" />
                      ) : (
                        <Shield className="h-4 w-4 inline mr-1" />
                      )}
                      Admin Panel
                    </Link>
                    <Link
                      to="/dashboard"
                      className={`block px-3 py-2 rounded-md text-base font-medium ${localDarkMode 
                        ? 'text-gray-300 hover:bg-gray-700' 
                        : 'text-gray-700 hover:bg-gray-100'}`}
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <BarChart3 className="h-4 w-4 inline mr-1" />
                      Dashboard
                    </Link>
                    <Link
                      to="/approve-subscriptions"
                      className={`block px-3 py-2 rounded-md text-base font-medium ${localDarkMode 
                        ? 'text-gray-300 hover:bg-gray-700' 
                        : 'text-gray-700 hover:bg-gray-100'}`}
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <Clipboard className="h-4 w-4 inline mr-1" />
                      Approve Subscriptions
                    </Link>
                  </>
                )}
                <Link
                  to="/profile"
                  className={`block px-3 py-2 rounded-md text-base font-medium ${localDarkMode 
                    ? 'text-gray-300 hover:bg-gray-700' 
                    : 'text-gray-700 hover:bg-gray-100'}`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  Your Profile
                </Link>
                <Link
                  to="/subscription"
                  className={`block px-3 py-2 rounded-md text-base font-medium ${localDarkMode 
                    ? 'text-gray-300 hover:bg-gray-700' 
                    : 'text-gray-700 hover:bg-gray-100'}`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  Subscription
                </Link>
                <button
                  onClick={handleSignOut}
                  className={`block w-full text-left px-3 py-2 rounded-md text-base font-medium ${localDarkMode 
                    ? 'text-gray-300 hover:bg-gray-700' 
                    : 'text-gray-700 hover:bg-gray-100'}`}
                >
                  <LogOut className="h-4 w-4 inline mr-1" />
                  Sign out
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </header>
  );
};

export default Header;