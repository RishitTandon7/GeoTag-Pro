import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { MapPin, AtSign, Key, Eye, EyeOff, Loader, AlertCircle } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });
  const navigate = useNavigate();
  const { user } = useAuthStore();

  useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e: MediaQueryListEvent) => {
      setIsDarkMode(e.matches);
    };
    
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  useEffect(() => {
    if (errorMessage) {
      setErrorMessage('');
    }
  }, [email, password, errorMessage]);

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim()) {
      setEmailError('Email is required');
      return false;
    }
    if (!emailRegex.test(email)) {
      setEmailError('Please enter a valid email address');
      return false;
    }
    setEmailError('');
    return true;
  };

  const validatePassword = (password: string): boolean => {
    if (!password.trim()) {
      setPasswordError('Password is required');
      return false;
    }
    if (password.length < 6) {
      setPasswordError('Password must be at least 6 characters long');
      return false;
    }
    setPasswordError('');
    return true;
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage('');
    
    try {
      console.log('Attempting login with email:', email);
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password.trim()
      });
      
      if (error) {
        throw error;
      }
      
      if (!data.user) {
        throw new Error('Something went wrong during login. Please try again.');
      }
      
      toast.success('Logged in successfully');
      
      // Check if this is the queen admin
      if (email.trim().toLowerCase() === 'koushani.nath@queen.com') {
        console.log("Detected Queen login, setting queen flag in localStorage");
        // Set a flag in localStorage to trigger the animation after navigation
        localStorage.setItem('queen_login', 'true');
        
        // Ensure the queen_login flag is set before navigation
        setTimeout(() => {
          navigate('/');
        }, 100);
      } else {
        // For non-queen users, navigate immediately
        navigate('/');
      }
    } catch (error: any) {
      console.error('Login error details:', error);
      toast.error('Invalid email or password', { duration: 3000 });
      
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newEmail = e.target.value;
    setEmail(newEmail);
    setEmailError('');
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newPassword = e.target.value;
    setPassword(newPassword);
    setPasswordError('');
  };

  return (
    <div className={`min-h-screen flex flex-col items-center justify-center p-4 ${
      isDarkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'
    }`}>
      <div className={`w-full max-w-md ${
        isDarkMode ? 'bg-gray-800' : 'bg-white'
      } rounded-lg shadow-xl overflow-hidden`}>
        <div className="p-8">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center">
              <div className="h-12 w-12 bg-gradient-to-br from-primary to-primary-dark rounded-lg flex items-center justify-center shadow-md">
                <MapPin className="h-6 w-6 text-neutral-50" />
              </div>
            </div>
            <h1 className={`mt-4 text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              Log in to GeoTag Pro
            </h1>
            <p className={`mt-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
              Welcome back! Please enter your credentials
            </p>
          </div>
          
          {errorMessage && (
            <div className={`mb-6 p-4 rounded-md ${isDarkMode ? 'bg-red-900/30 text-red-300' : 'bg-red-50 text-red-600'} flex items-start`}>
              <AlertCircle className="h-5 w-5 mr-3 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-medium whitespace-pre-line">{errorMessage}</p>
                <div className="mt-3 space-y-2">
                  <p className="text-sm">
                    Need help? Try these options:
                  </p>
                  <div className="flex flex-col space-y-2 text-sm">
                    <Link 
                      to="/reset-password" 
                      className={`inline-flex items-center ${isDarkMode ? 'text-red-300 hover:text-red-200' : 'text-red-700 hover:text-red-800'} font-medium`}
                    >
                      → Reset your password
                    </Link>
                    <Link 
                      to="/register" 
                      className={`inline-flex items-center ${isDarkMode ? 'text-red-300 hover:text-red-200' : 'text-red-700 hover:text-red-800'} font-medium`}
                    >
                      → Create a new account
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* Admin Quick Login (Development Only) */}
          {import.meta.env.DEV && (
            <div className={`mb-6 p-4 rounded-md ${
              isDarkMode ? 'bg-purple-900/20 border border-purple-800' : 'bg-purple-50 border border-purple-200'
            }`}>
              <div className="flex flex-col space-y-2">
                <button
                  onClick={() => {
                    setEmail('rishit@example.com');
                    setPassword('admin123');
                  }}
                  className={`text-sm font-medium ${
                    isDarkMode ? 'text-purple-400 hover:text-purple-300' : 'text-purple-600 hover:text-purple-700'
                  }`}
                >
                  Quick Admin Login (Rishit)
                </button>
                <button
                  onClick={() => {
                    setEmail('koushani.nath@queen.com');
                    setPassword('queen123');
                  }}
                  className={`text-sm font-medium ${
                    isDarkMode ? 'text-pink-400 hover:text-pink-300' : 'text-pink-600 hover:text-pink-700'
                  }`}
                >
                  Queen Admin Login
                </button>
              </div>
            </div>
          )}
          
          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label htmlFor="email" className={`block text-sm font-medium ${
                isDarkMode ? 'text-gray-300' : 'text-gray-700'
              }`}>
                Email Address
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <AtSign className={`h-5 w-5 ${isDarkMode ? 'text-gray-400' : 'text-gray-400'}`} />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={handleEmailChange}
                  onBlur={() => validateEmail(email)}
                  className={`block w-full pl-10 pr-3 py-3 border ${
                    isDarkMode 
                      ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
                  } rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500 ${
                    emailError ? 'border-red-500' : ''
                  }`}
                  placeholder="your.email@example.com"
                />
              </div>
              {emailError && (
                <p className="mt-1 text-sm text-red-500">{emailError}</p>
              )}
            </div>
            
            <div>
              <label htmlFor="password" className={`block text-sm font-medium ${
                isDarkMode ? 'text-gray-300' : 'text-gray-700'
              }`}>
                Password
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Key className={`h-5 w-5 ${isDarkMode ? 'text-gray-400' : 'text-gray-400'}`} />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={handlePasswordChange}
                  onBlur={() => validatePassword(password)}
                  className={`block w-full pl-10 pr-10 py-3 border ${
                    isDarkMode 
                      ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
                  } rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500 ${
                    passwordError ? 'border-red-500' : ''
                  }`}
                  placeholder="••••••••"
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className={`${isDarkMode ? 'text-gray-400' : 'text-gray-400'} hover:text-purple-500 focus:outline-none`}
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>
              {passwordError && (
                <p className="mt-1 text-sm text-red-500">{passwordError}</p>
              )}
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                />
                <label htmlFor="remember-me" className={`ml-2 block text-sm ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Remember me
                </label>
              </div>
              
              <div className="text-sm">
                <Link to="/reset-password" className="font-medium text-purple-600 hover:text-purple-500">
                  Forgot your password?
                </Link>
              </div>
            </div>
            
            <div>
              <button
                type="submit"
                disabled={isLoading || !!emailError || !!passwordError}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <Loader className="h-5 w-5 animate-spin mr-2" />
                    Signing in...
                  </>
                ) : (
                  'Sign in'
                )}
              </button>
            </div>
          </form>
          
          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className={`w-full border-t ${isDarkMode ? 'border-gray-600' : 'border-gray-300'}`}></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className={`px-2 ${isDarkMode ? 'bg-gray-800 text-gray-400' : 'bg-white text-gray-500'}`}>
                  Don't have an account?
                </span>
              </div>
            </div>
            
            <div className="mt-6">
              <Link
                to="/register"
                className={`w-full flex justify-center py-3 px-4 border rounded-md shadow-sm font-medium ${
                  isDarkMode
                    ? 'border-gray-600 text-white hover:bg-gray-700'
                    : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                Create an account
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;