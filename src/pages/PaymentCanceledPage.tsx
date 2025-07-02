import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { XCircle, ArrowLeft, AlertTriangle } from 'lucide-react';

const PaymentCanceledPage = () => {
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e: MediaQueryListEvent) => {
      setIsDarkMode(e.matches);
    };
    
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  return (
    <div className={`min-h-screen flex items-center justify-center transition-all duration-300 ${
      isDarkMode 
        ? 'bg-gradient-to-br from-gray-900 to-purple-900' 
        : 'bg-gradient-to-br from-purple-50 to-indigo-100'
    }`}>
      <div className={`max-w-md w-full ${
        isDarkMode ? 'bg-gray-800/80 backdrop-blur-sm' : 'bg-white/90 backdrop-blur-sm'
      } rounded-2xl shadow-2xl p-8 text-center transform hover:scale-[1.01] transition-all duration-300`}>
        <div className="mb-6 relative">
          <div className={`mx-auto h-16 w-16 flex items-center justify-center rounded-full ${
            isDarkMode ? 'bg-red-900/50' : 'bg-red-100'
          } animate-pulse`}>
            <XCircle className={`h-10 w-10 ${
              isDarkMode ? 'text-red-500' : 'text-red-600'
            }`} />
          </div>
        </div>
        
        <h1 className={`text-2xl font-bold mb-2 ${
          isDarkMode ? 'text-white' : 'text-gray-900'
        }`}>
          Payment Canceled
        </h1>
        
        <p className={`mb-6 ${
          isDarkMode ? 'text-gray-300' : 'text-gray-600'
        }`}>
          Your payment was not completed. No changes have been made to your subscription.
        </p>
        
        <div className={`p-4 rounded-xl mb-6 ${
          isDarkMode ? 'bg-amber-900/30 border border-amber-800/30' : 'bg-amber-50 border border-amber-200'
        }`}>
          <div className="flex items-start">
            <AlertTriangle className={`h-5 w-5 mt-0.5 ${isDarkMode ? 'text-amber-400' : 'text-amber-600'} flex-shrink-0`} />
            <p className={`text-sm ml-3 ${
              isDarkMode ? 'text-amber-300' : 'text-amber-700'
            }`}>
              If you encountered any issues during the payment process, please try again or contact our support team for assistance.
            </p>
          </div>
        </div>
        
        <div className="space-y-4">
          <Link 
            to="/subscription"
            className={`block w-full py-3 rounded-xl font-medium flex items-center justify-center transition-all duration-300 transform hover:translate-y-[-2px] ${
              isDarkMode
                ? 'bg-gradient-to-r from-purple-600 to-indigo-700 text-white shadow-lg shadow-purple-700/30'
                : 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg shadow-indigo-700/20'
            }`}
          >
            Try Again
          </Link>
          
          <Link 
            to="/"
            className={`block w-full py-3 rounded-xl font-medium flex items-center justify-center transition-colors ${
              isDarkMode
                ? 'bg-gray-700 hover:bg-gray-600 text-gray-200'
                : 'bg-gray-100 hover:bg-gray-200 text-gray-800'
            }`}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
};

export default PaymentCanceledPage;