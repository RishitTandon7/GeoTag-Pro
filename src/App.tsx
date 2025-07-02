import React, { useState, useEffect, useRef } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Header from './components/layout/Header';
import Footer from './components/layout/Footer';
import GeoTagEditor from './pages/GeoTagEditor';
import PricingPage from './pages/PricingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ProfilePage from './pages/ProfilePage';
import SubscriptionPage from './pages/SubscriptionPage';
import { useAuthStore } from './store/authStore';
import { supabase } from './lib/supabase';
import { v4 as uuidv4 } from 'uuid';
import PaymentSuccessPage from './pages/PaymentSuccessPage';
import PaymentCanceledPage from './pages/PaymentCanceledPage';
import AdminPage from './pages/AdminPage';
import DashboardPage from './pages/DashboardPage';
import ApproveSubscriptionsPage from './pages/ApproveSubscriptionsPage';
import UpiPaymentPage from './pages/UpiPaymentPage';
import SupabaseDiagnostic from './components/SupabaseDiagnostic';
import DownloadLimitIndicator from './components/DownloadLimitIndicator';
import QueenAnimation from './components/QueenAnimation';

// Get or create session ID
const getSessionId = () => {
  let sessionId = localStorage.getItem('session_id');
  if (!sessionId) {
    sessionId = uuidv4();
    localStorage.setItem('session_id', sessionId);
  }
  return sessionId;
};

// Create a wrapper component to use hooks outside of Router
function AppContent() {
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });
  const { user, setUser, isLoading, setIsLoading } = useAuthStore();
  const location = useLocation();
  const [showQueenAnimation, setShowQueenAnimation] = useState(false);
  const animationShownRef = useRef(false);
  const lastPathRef = useRef(location.pathname);
  
  // To prevent animation from showing twice in one session
  const [queenAnimationShownThisSession, setQueenAnimationShownThisSession] = useState(false);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDarkMode);
    
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e: MediaQueryListEvent) => {
      setIsDarkMode(e.matches);
      document.documentElement.classList.toggle('dark', e.matches);
    };
    
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [isDarkMode]);

  // Check for queen login from localStorage (for initial login)
  useEffect(() => {
    const queenLoginFlag = localStorage.getItem('queen_login');
    
    if (queenLoginFlag === 'true' && !queenAnimationShownThisSession) {
      console.log("Found queen_login flag in localStorage, will show animation");
      localStorage.removeItem('queen_login'); // Remove flag to prevent duplicate shows
      setQueenAnimationShownThisSession(true);
      
      // Small delay to ensure everything is loaded
      setTimeout(() => {
        setShowQueenAnimation(true);
      }, 300);
    }
  }, [queenAnimationShownThisSession]);

  // Check for queen user and route changes (for page reloads while logged in)
  useEffect(() => {
    // Only trigger on actual route changes or first load
    const isNewPath = lastPathRef.current !== location.pathname;
    lastPathRef.current = location.pathname;
    
    if (user && !isLoading && isNewPath) {
      const isQueenUser = user.email === 'koushani.nath@queen.com';
      
      if (isQueenUser && !queenAnimationShownThisSession) {
        console.log("Queen user detected on path change or reload:", location.pathname);
        setQueenAnimationShownThisSession(true);
        
        setTimeout(() => {
          setShowQueenAnimation(true);
        }, 300);
      }
    }
  }, [user, isLoading, location.pathname, queenAnimationShownThisSession]);

  // Reset animation shown flag when user changes or logs out
  useEffect(() => {
    if (!user) {
      setQueenAnimationShownThisSession(false);
    }
  }, [user]);

  // Handle animation completion
  const handleAnimationComplete = () => {
    console.log("Queen animation complete, hiding component");
    setShowQueenAnimation(false);
    animationShownRef.current = true;
  };

  useEffect(() => {
    const initializeAuth = async () => {
      setIsLoading(true);
      try {
        // Get initial session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) throw sessionError;

        // Set up auth state change listener
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
          console.log('Auth state changed:', event, session ? 'Session exists' : 'No session');
          
          if (session?.user) {
            try {
              // Fetch the user profile data
              const { data: profileData, error: profileError } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', session.user.id)
                .single();
              
              if (profileError) {
                console.error('Error fetching profile after auth change:', profileError);
              }
              
              setUser({ 
                ...session.user,
                profile: profileData || undefined
              });
            } catch (error) {
              console.error('Error handling auth state change:', error);
            }
          } else {
            setUser(null);
          }
        });

        // If there's an initial session, fetch the profile
        if (session?.user) {
          const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();
          
          if (profileError) {
            console.error('Error fetching initial profile:', profileError);
          }
          
          setUser({ 
            ...session.user,
            profile: profileData || undefined
          });
        }

        return () => {
          subscription.unsubscribe();
        };
      } catch (error) {
        console.error('Error initializing auth:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, [setUser, setIsLoading]);

  // Track page views
  useEffect(() => {
    const trackPageView = async () => {
      // Get browser and OS info
      const userAgent = navigator.userAgent;
      const browser = getBrowser(userAgent);
      const os = getOS(userAgent);
      const device = getDevice(userAgent);
      
      try {
        await supabase.from('traffic_analytics')
          .insert({
            page: location.pathname,
            user_id: user?.id,
            session_id: getSessionId(),
            referrer: document.referrer,
            browser,
            os,
            device
          });
      } catch (error) {
        console.error('Error tracking page view:', error);
      }
    };

    trackPageView();
  }, [location, user]);

  // Helper functions for user agent parsing
  const getBrowser = (ua: string): string => {
    if (ua.includes('Firefox')) return 'Firefox';
    if (ua.includes('Chrome')) return 'Chrome';
    if (ua.includes('Safari')) return 'Safari';
    if (ua.includes('Edge')) return 'Edge';
    if (ua.includes('Opera')) return 'Opera';
    return 'Other';
  };

  const getOS = (ua: string): string => {
    if (ua.includes('Windows')) return 'Windows';
    if (ua.includes('Mac')) return 'macOS';
    if (ua.includes('Linux')) return 'Linux';
    if (ua.includes('Android')) return 'Android';
    if (ua.includes('iOS')) return 'iOS';
    return 'Other';
  };

  const getDevice = (ua: string): string => {
    if (ua.includes('Mobile')) return 'Mobile';
    if (ua.includes('Tablet')) return 'Tablet';
    return 'Desktop';
  };

  // Protected route wrapper
  const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
    if (isLoading) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-600"></div>
        </div>
      );
    }
    
    if (!user) {
      return <Navigate to="/login" replace />;
    }
    
    return <>{children}</>;
  };

  // Admin route wrapper
  const AdminRoute = ({ children }: { children: React.ReactNode }) => {
    if (isLoading) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-600"></div>
        </div>
      );
    }
    
    if (!user) {
      return <Navigate to="/login" replace />;
    }
    
    // For simplicity, we're checking if the user is admin based on email
    // In a real app, you'd use a more robust authorization system
    if (user.email !== 'rishit@example.com' && user.email !== 'rishittandon7@gmail.com' && user.email !== 'koushani.nath@queen.com') {
      return <Navigate to="/" replace />;
    }
    
    return <>{children}</>;
  };

  return (
    <div className={`flex flex-col min-h-screen ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'} transition-colors duration-200`}>
      <Header isDarkMode={isDarkMode} />
      <main className="flex-grow">
        <Routes>
          <Route path="/" element={<GeoTagEditor />} />
          <Route path="/pricing" element={<PricingPage />} />
          <Route path="/editor" element={<GeoTagEditor />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/diagnostic" element={<SupabaseDiagnostic />} />
          <Route path="/upi-payment" element={
            <ProtectedRoute>
              <UpiPaymentPage />
            </ProtectedRoute>
          } />
          <Route path="/payment/success" element={
            <ProtectedRoute>
              <PaymentSuccessPage />
            </ProtectedRoute>
          } />
          <Route path="/payment/canceled" element={
            <ProtectedRoute>
              <PaymentCanceledPage />
            </ProtectedRoute>
          } />
          <Route path="/profile" element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          } />
          <Route path="/subscription" element={
            <ProtectedRoute>
              <SubscriptionPage />
            </ProtectedRoute>
          } />
          <Route path="/admin" element={
            <AdminRoute>
              <AdminPage />
            </AdminRoute>
          } />
          <Route path="/dashboard" element={
            <AdminRoute>
              <DashboardPage />
            </AdminRoute>
          } />
          <Route path="/approve-subscriptions" element={
            <AdminRoute>
              <ApproveSubscriptionsPage />
            </AdminRoute>
          } />
        </Routes>
      </main>
      <Footer />
      <Toaster position="bottom-right" />
      
      {/* Fixed Download Limit Indicator */}
      <DownloadLimitIndicator />
      
      {/* Queen Animation */}
      {showQueenAnimation && (
        <QueenAnimation onComplete={handleAnimationComplete} />
      )}
    </div>
  );
}

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;