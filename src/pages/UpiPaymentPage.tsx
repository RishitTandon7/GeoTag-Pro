import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Copy, CheckCircle, AlertTriangle, ArrowLeft, ArrowRight, Loader, QrCode, Smartphone, Upload, Info } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';
import QRCode from 'qrcode.react';
import SubscriptionDebug from '../components/SubscriptionDebug';

const UpiPaymentPage = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });
  const [upiId, setUpiId] = useState('kingrishit1-1@okaxis');
  const [paymentVerified, setPaymentVerified] = useState(false);
  const [verificationStep, setVerificationStep] = useState<'waiting' | 'verifying' | 'submitted' | 'completed' | 'failed'>('waiting');
  const [isVerifying, setIsVerifying] = useState(false);
  const [referenceId, setReferenceId] = useState('');
  const [paymentAmount, setPaymentAmount] = useState(50);
  const [isYearly, setIsYearly] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showQrCode, setShowQrCode] = useState(true);
  const [uploadedScreenshot, setUploadedScreenshot] = useState<string | null>(null);
  const [transactionIdInput, setTransactionIdInput] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [showDebug, setShowDebug] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const timerRef = useRef<number | null>(null);
  const qrRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const plan = searchParams.get('plan');
    if (plan === 'yearly') {
      setIsYearly(true);
      setPaymentAmount(480);
    } else {
      setIsYearly(false);
      setPaymentAmount(50);
    }

    // Generate a unique reference ID for this payment
    const uniqueId = Math.random().toString(36).substring(2, 10).toUpperCase();
    setReferenceId(`GTP${uniqueId}`);
  }, [location]);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e: MediaQueryListEvent) => {
      setIsDarkMode(e.matches);
    };
    
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  const generateUpiUrl = () => {
    const upiUrl = `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent("GeoTag Pro")}&am=${paymentAmount}&cu=INR&tn=${encodeURIComponent(`${isYearly ? "Yearly" : "Monthly"} Subscription`)}&tr=${referenceId}`;
    return upiUrl;
  };

  const handleOpenUpiApp = () => {
    window.location.href = generateUpiUrl();
    
    // Set a timeout to show the verification prompt
    setTimeout(() => {
      setVerificationStep('waiting');
    }, 3000);
  };

  const handleCopyUpiId = () => {
    navigator.clipboard.writeText(upiId);
    setCopied(true);
    toast.success('UPI ID copied to clipboard');
    
    // Reset copied status after 3 seconds
    setTimeout(() => {
      setCopied(false);
    }, 3000);
  };

  const handleScreenshotUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setIsUploading(true);
    
    const reader = new FileReader();
    reader.onloadend = () => {
      setUploadedScreenshot(reader.result as string);
      setIsUploading(false);
    };
    
    reader.onerror = () => {
      toast.error('Error uploading screenshot');
      setIsUploading(false);
    };
    
    reader.readAsDataURL(file);
  };

  const triggerFileUpload = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleVerifyPayment = async () => {
    if (!user) {
      toast.error('You must be logged in to verify payment');
      navigate('/login');
      return;
    }

    // Validate transaction ID is entered
    if (!transactionIdInput.trim()) {
      toast.error('Please enter your transaction ID');
      return;
    }

    // Validate screenshot is uploaded (for better UX)
    if (!uploadedScreenshot) {
      toast.error('Please upload a payment screenshot for verification');
      return;
    }
    
    setVerificationStep('verifying');
    setIsVerifying(true);
    setErrorMessage(null);
    
    try {
      // Upload the screenshot to Supabase Storage
      let screenshotUrl = null;
      if (uploadedScreenshot) {
        // Convert base64 to blob
        const base64Response = await fetch(uploadedScreenshot);
        const blob = await base64Response.blob();
        
        const fileExt = 'jpg'; // Assuming it's a JPG, you might want to determine this dynamically
        const fileName = `payment-${user.id}-${Date.now()}.${fileExt}`;
        const filePath = `payment-screenshots/${fileName}`;
        
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('payment-proofs')
          .upload(filePath, blob);
        
        if (uploadError) {
          console.error('Error uploading screenshot:', uploadError);
          throw new Error('Failed to upload payment screenshot');
        }
        
        // Get the public URL of the uploaded screenshot
        const { data: publicUrlData } = supabase.storage
          .from('payment-proofs')
          .getPublicUrl(filePath);
          
        screenshotUrl = publicUrlData.publicUrl;
      }
      
      console.log('Creating subscription request with:', {
        user_id: user.id,
        transaction_id: transactionIdInput.trim(),
        amount: paymentAmount,
        plan_type: isYearly ? 'yearly' : 'monthly',
        screenshot_url: screenshotUrl
      });
      
      // Create a subscription request
      const { data: requestData, error: requestError } = await supabase
        .from('subscription_requests')
        .insert({
          user_id: user.id,
          transaction_id: transactionIdInput.trim(),
          amount: paymentAmount,
          status: 'pending',
          plan_type: isYearly ? 'yearly' : 'monthly',
          screenshot_url: screenshotUrl
        })
        .select()
        .single();
      
      if (requestError) {
        setErrorMessage(`Database error: ${requestError.message}`);
        throw requestError;
      }
      
      console.log('Subscription request created:', requestData);
      
      setVerificationStep('submitted');
      toast.success('Payment verification request submitted for admin approval');
      
      // Set a timer to redirect to success page with upi=true parameter
      timerRef.current = window.setTimeout(() => {
        navigate('/payment/success?upi=true');
      }, 5000);
      
    } catch (error: any) {
      console.error('Payment verification error:', error);
      setVerificationStep('failed');
      toast.error('Failed to submit verification request. Please contact support with your reference ID.');
    } finally {
      setIsVerifying(false);
    }
  };

  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-gradient-to-br from-gray-900 to-purple-900' : 'bg-gradient-to-br from-purple-50 to-indigo-100'} transition-all duration-500`}>
      <div className="max-w-md mx-auto pt-12 px-4">
        <div className={`rounded-2xl shadow-2xl overflow-hidden transform hover:scale-[1.01] transition-all duration-300 ${
          isDarkMode ? 'bg-gray-800/80 backdrop-blur-sm' : 'bg-white/90 backdrop-blur-sm'
        }`}>
          <div className="p-5 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <h1 className={`text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r ${
                isDarkMode ? 'from-purple-400 to-pink-300' : 'from-purple-600 to-indigo-600'
              }`}>
                UPI Payment
              </h1>
              <div className={`rounded-full px-3 py-1 text-xs font-medium ${
                isDarkMode ? 'bg-purple-900/50 text-purple-300 border border-purple-700/50' : 'bg-purple-100 text-purple-800 border border-purple-200'
              }`}>
                {isYearly ? 'Yearly Plan' : 'Monthly Plan'}
              </div>
            </div>
          </div>
          
          <div className="p-6">
            {/* Amount display */}
            <div className="text-center mb-6 transform hover:scale-105 transition-transform">
              <div className={`inline-block rounded-xl p-4 ${
                isDarkMode ? 'bg-gray-700/50' : 'bg-purple-50'
              }`}>
                <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Amount to pay:</p>
                <div className={`text-3xl font-bold ${
                  isDarkMode ? 'text-white' : 'text-gray-900'
                }`}>
                  ₹{paymentAmount}
                  <span className={`text-sm ml-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    {isYearly ? '/year' : '/month'}
                  </span>
                </div>
              </div>
            </div>
            
            {/* Payment options toggle */}
            <div className="flex justify-center mb-6">
              <div className={`p-1 rounded-full shadow-inner ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'}`}>
                <button
                  onClick={() => setShowQrCode(true)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                    showQrCode
                      ? isDarkMode 
                        ? 'bg-gradient-to-r from-purple-600 to-purple-500 text-white shadow-lg' 
                        : 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg'
                      : isDarkMode 
                        ? 'text-gray-300 hover:text-white' 
                        : 'text-gray-700 hover:text-gray-900'
                  }`}
                >
                  <QrCode className="h-4 w-4 inline mr-1" />
                  Scan QR
                </button>
                <button
                  onClick={() => setShowQrCode(false)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                    !showQrCode
                      ? isDarkMode 
                        ? 'bg-gradient-to-r from-purple-600 to-purple-500 text-white shadow-lg' 
                        : 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg'
                      : isDarkMode 
                        ? 'text-gray-300 hover:text-white' 
                        : 'text-gray-700 hover:text-gray-900'
                  }`}
                >
                  <Smartphone className="h-4 w-4 inline mr-1" />
                  UPI App
                </button>
              </div>
            </div>
            
            {showQrCode ? (
              /* QR Code section */
              <div className="mb-6 text-center" ref={qrRef}>
                <div className={`inline-block p-4 rounded-2xl ${
                  isDarkMode ? 'bg-white shadow-[0_0_15px_rgba(255,255,255,0.2)]' : 'bg-white shadow-lg'
                } transform hover:scale-105 transition-all duration-300`}>
                  <QRCode 
                    value={generateUpiUrl()} 
                    size={200}
                    level="H"
                    renderAs="svg"
                    bgColor={"#FFFFFF"}
                    fgColor={isDarkMode ? "#6D28D9" : "#4F46E5"}
                    imageSettings={{
                      src: "https://upload.wikimedia.org/wikipedia/commons/e/e1/UPI-Logo-vector.svg",
                      height: 40,
                      width: 40,
                      excavate: true,
                    }}
                  />
                </div>
                <p className={`mt-3 text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                  Scan this QR code with any UPI app
                </p>
                
                <div className="mt-3 flex justify-center space-x-3">
                  <img src="https://upload.wikimedia.org/wikipedia/commons/f/f3/GooglePay_mark_800_gray.svg" className="h-6 opacity-70 hover:opacity-100 transition-opacity" alt="Google Pay" />
                  <img src="https://upload.wikimedia.org/wikipedia/commons/8/89/Phonepe_logo.svg" className="h-6 opacity-70 hover:opacity-100 transition-opacity" alt="PhonePe" />
                  <img src="https://upload.wikimedia.org/wikipedia/commons/c/cd/Aadhaar_Logo.svg" className="h-6 opacity-70 hover:opacity-100 transition-opacity" alt="BHIM" />
                  <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/2/24/Paytm_Logo_%28standalone%29.svg/2560px-Paytm_Logo_%28standalone%29.svg.png" className="h-6 opacity-70 hover:opacity-100 transition-opacity" alt="Paytm" />
                </div>
              </div>
            ) : (
              /* UPI ID section */
              <div className="mb-6">
                <div className="mb-4">
                  <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    UPI ID
                  </label>
                  <div className="flex">
                    <input
                      type="text"
                      value={upiId}
                      readOnly
                      className={`flex-1 px-3 py-2 border rounded-l-md ${
                        isDarkMode 
                          ? 'bg-gray-700 border-gray-600 text-white' 
                          : 'bg-gray-100 border-gray-300 text-gray-900'
                      } focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500`}
                    />
                    <button
                      onClick={handleCopyUpiId}
                      className={`px-3 py-2 rounded-r-md transition-all ${
                        isDarkMode 
                          ? 'bg-gray-700 hover:bg-gray-600 border-l-0 border border-gray-600' 
                          : 'bg-gray-100 hover:bg-gray-200 border-l-0 border border-gray-300'
                      }`}
                    >
                      {copied ? 
                        <CheckCircle className="h-5 w-5 text-green-500" /> :
                        <Copy className={`h-5 w-5 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`} />
                      }
                    </button>
                  </div>
                </div>
                <button
                  onClick={handleOpenUpiApp}
                  className={`w-full py-2 px-4 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 font-medium transition-all transform hover:translate-y-[-2px] ${
                    isDarkMode 
                      ? 'bg-gradient-to-r from-purple-600 to-indigo-700 text-white shadow-lg shadow-purple-700/30'
                      : 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg shadow-indigo-700/20'
                  }`}
                >
                  <Smartphone className="h-5 w-5 inline mr-2" />
                  Pay with UPI App
                </button>
              </div>
            )}
            
            {/* Reference ID */}
            <div className="mb-6">
              <p className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Reference ID:
              </p>
              <p className={`font-mono text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                {referenceId}
              </p>
              <p className={`mt-1 text-xs ${isDarkMode ? 'text-amber-400' : 'text-amber-700'}`}>
                <AlertTriangle className="h-3 w-3 inline mr-1" />
                Include this reference ID when making your payment
              </p>
            </div>
            
            {/* Error display if any */}
            {errorMessage && (
              <div className={`mb-4 p-3 rounded-lg ${
                isDarkMode ? 'bg-red-900/30 text-red-300 border border-red-800/30' : 'bg-red-50 text-red-700 border border-red-200'
              }`}>
                <div className="flex">
                  <AlertTriangle className="h-5 w-5 mt-0.5 mr-2 flex-shrink-0" />
                  <div>
                    <p className="font-medium">Error submitting payment</p>
                    <p className="mt-1 text-sm">{errorMessage}</p>
                  </div>
                </div>
              </div>
            )}
            
            {/* Verification section */}
            <div className="mt-8">
              <h3 className={`text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                Payment Verification
              </h3>
              
              {verificationStep === 'waiting' && (
                <div className={`p-4 rounded-xl ${isDarkMode ? 'bg-gray-700/50' : 'bg-gray-100/80'} space-y-4 transform hover:scale-[1.02] transition-all duration-300`}>
                  <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    After completing the payment, please provide your payment details for verification:
                  </p>
                  
                  <div className="space-y-3">
                    <div>
                      <label className={`block text-xs font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        Transaction ID / UPI Reference Number
                      </label>
                      <input 
                        type="text" 
                        value={transactionIdInput}
                        onChange={(e) => setTransactionIdInput(e.target.value)}
                        placeholder="e.g., 123456789012"
                        className={`mt-1 w-full px-3 py-2 rounded-lg ${
                          isDarkMode 
                            ? 'bg-gray-800 border border-gray-700 text-white placeholder-gray-500' 
                            : 'bg-white border border-gray-300 text-gray-900 placeholder-gray-400'
                        } focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors`}
                      />
                    </div>
                    
                    <div>
                      <label className={`block text-xs font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        Payment Screenshot
                      </label>
                      <input 
                        type="file"
                        ref={fileInputRef}
                        accept="image/*"
                        onChange={handleScreenshotUpload}
                        className="hidden"
                      />
                      
                      {!uploadedScreenshot ? (
                        <button
                          onClick={triggerFileUpload}
                          className={`mt-1 w-full h-24 rounded-lg border-2 border-dashed flex flex-col items-center justify-center ${
                            isDarkMode 
                              ? 'border-gray-600 hover:border-purple-500 bg-gray-800/50' 
                              : 'border-gray-300 hover:border-purple-500 bg-gray-50'
                          } transition-colors`}
                        >
                          {isUploading ? (
                            <Loader className={`h-6 w-6 animate-spin ${isDarkMode ? 'text-purple-400' : 'text-purple-600'}`} />
                          ) : (
                            <>
                              <Upload className={`h-6 w-6 mb-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                              <span className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                Click to upload screenshot
                              </span>
                            </>
                          )}
                        </button>
                      ) : (
                        <div className="mt-1 relative">
                          <img 
                            src={uploadedScreenshot} 
                            alt="Payment screenshot" 
                            className="w-full h-32 object-cover rounded-lg"
                          />
                          <button 
                            onClick={() => setUploadedScreenshot(null)}
                            className="absolute top-2 right-2 p-1 rounded-full bg-red-500 text-white hover:bg-red-600"
                          >
                            ✕
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <button
                    onClick={handleVerifyPayment}
                    disabled={isVerifying || !transactionIdInput.trim() || !uploadedScreenshot}
                    className={`w-full py-2 px-4 rounded-lg font-medium flex items-center justify-center transition-all duration-300 ${
                      isVerifying || !transactionIdInput.trim() || !uploadedScreenshot
                        ? 'bg-gray-400 text-gray-700 cursor-not-allowed opacity-70'
                        : isDarkMode
                          ? 'bg-gradient-to-r from-purple-500 to-indigo-600 text-white shadow-lg hover:shadow-xl shadow-purple-700/30'
                          : 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg hover:shadow-xl shadow-indigo-700/20'
                    }`}
                  >
                    {isVerifying ? (
                      <>
                        <Loader className="h-4 w-4 animate-spin mr-2" />
                        Processing...
                      </>
                    ) : (
                      'Submit Payment for Verification'
                    )}
                  </button>
                  
                  <div className={`p-3 rounded-lg ${isDarkMode ? 'bg-purple-900/20' : 'bg-purple-50'} text-xs`}>
                    <Info className={`h-4 w-4 inline-block mr-1 ${isDarkMode ? 'text-purple-400' : 'text-purple-600'}`} />
                    <span className={isDarkMode ? 'text-purple-300' : 'text-purple-700'}>
                      Your payment will be verified by an admin before your account is upgraded.
                    </span>
                  </div>
                </div>
              )}
              
              {verificationStep === 'verifying' && (
                <div className={`p-6 rounded-xl ${isDarkMode ? 'bg-gray-700/50' : 'bg-gray-100/80'}`}>
                  <div className="flex flex-col items-center justify-center">
                    <div className={`w-16 h-16 rounded-full ${
                      isDarkMode ? 'bg-purple-900/50' : 'bg-purple-100'
                    } flex items-center justify-center mb-4`}>
                      <Loader className={`h-8 w-8 animate-spin ${isDarkMode ? 'text-purple-400' : 'text-purple-600'}`} />
                    </div>
                    <p className={`text-base font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                      Verifying your payment...
                    </p>
                    <p className={`mt-2 text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      Please wait while we process your request.
                    </p>
                  </div>
                </div>
              )}
              
              {verificationStep === 'submitted' && (
                <div className={`p-6 rounded-xl ${isDarkMode ? 'bg-green-900/20' : 'bg-green-50'} transform hover:scale-[1.02] transition-all duration-300`}>
                  <div className="flex items-center space-x-4">
                    <div className={`p-3 rounded-full ${
                      isDarkMode ? 'bg-green-900/50' : 'bg-green-100'
                    }`}>
                      <CheckCircle className={`h-6 w-6 ${isDarkMode ? 'text-green-400' : 'text-green-600'}`} />
                    </div>
                    <div className="flex-1">
                      <p className={`text-base font-medium ${isDarkMode ? 'text-green-300' : 'text-green-800'}`}>
                        Verification Request Submitted
                      </p>
                      <p className={`mt-1 text-sm ${isDarkMode ? 'text-green-400/80' : 'text-green-700'}`}>
                        An administrator will review your payment and update your account status soon.
                      </p>
                      <div className="mt-4 w-full bg-gray-300 rounded-full h-2">
                        <div className="bg-green-600 h-2 rounded-full animate-pulse" style={{ width: '100%' }}></div>
                      </div>
                      <p className={`mt-1 text-xs text-right ${isDarkMode ? 'text-green-400/80' : 'text-green-700'}`}>
                        Redirecting to your profile...
                      </p>
                    </div>
                  </div>
                </div>
              )}
              
              {verificationStep === 'failed' && (
                <div className={`p-4 rounded-xl ${isDarkMode ? 'bg-red-900/20' : 'bg-red-50'} transform hover:scale-[1.02] transition-all duration-300`}>
                  <div className="flex items-start">
                    <div className={`p-3 rounded-full ${
                      isDarkMode ? 'bg-red-900/50' : 'bg-red-100'
                    }`}>
                      <AlertTriangle className={`h-6 w-6 ${isDarkMode ? 'text-red-400' : 'text-red-600'}`} />
                    </div>
                    <div className="ml-4 flex-1">
                      <p className={`text-base font-medium ${isDarkMode ? 'text-red-400' : 'text-red-800'}`}>
                        Verification Request Failed
                      </p>
                      <p className={`mt-1 text-sm ${isDarkMode ? 'text-red-300' : 'text-red-700'}`}>
                        We couldn't submit your verification request. If you've already paid, please contact support with reference ID: {referenceId}
                      </p>
                      <button
                        onClick={() => setVerificationStep('waiting')}
                        className={`mt-3 px-4 py-2 rounded-lg ${
                          isDarkMode 
                            ? 'bg-gray-700 hover:bg-gray-600 text-white' 
                            : 'bg-white hover:bg-gray-100 text-gray-900 border border-gray-300'
                        }`}
                      >
                        Try Again
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            {/* Debug toggle */}
            <div className="mt-6 mb-2 flex justify-end">
              <button 
                onClick={() => setShowDebug(!showDebug)}
                className={`text-xs px-2 py-1 rounded-md ${
                  isDarkMode 
                    ? 'bg-gray-700 hover:bg-gray-600 text-gray-300' 
                    : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                }`}
              >
                {showDebug ? 'Hide Debug' : 'Debug Tools'}
              </button>
            </div>
            
            {showDebug && (
              <SubscriptionDebug isDarkMode={isDarkMode} />
            )}
          </div>
          
          <div className={`p-4 border-t ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
            <div className="flex justify-between">
              <button
                onClick={() => navigate('/pricing')}
                className={`flex items-center text-sm px-3 py-1.5 rounded-lg transition-all duration-300 ${
                  isDarkMode 
                    ? 'text-gray-300 hover:text-white hover:bg-gray-700' 
                    : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                <ArrowLeft className="h-4 w-4 mr-1" />
                Back
              </button>
              
              {verificationStep !== 'submitted' && verificationStep !== 'completed' && (
                <button
                  onClick={() => navigate('/pricing')}
                  className={`flex items-center text-sm px-3 py-1.5 rounded-lg transition-all duration-300 ${
                    isDarkMode 
                      ? 'text-gray-300 hover:text-white hover:bg-gray-700' 
                      : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  Cancel
                  <ArrowRight className="h-4 w-4 ml-1" />
                </button>
              )}
            </div>
          </div>
        </div>
        
        {/* Important instructions */}
        <div className={`mt-6 p-5 rounded-2xl shadow-lg transform hover:scale-[1.01] transition-all duration-300 ${
          isDarkMode ? 'bg-amber-900/30 border border-amber-800/30' : 'bg-gradient-to-br from-amber-50 to-amber-100 border border-amber-200'
        }`}>
          <h3 className={`text-base font-medium mb-2 flex items-center ${isDarkMode ? 'text-amber-300' : 'text-amber-800'}`}>
            <AlertTriangle className="h-5 w-5 mr-2" />
            Important Notes
          </h3>
          <ul className={`ml-6 list-disc space-y-2 ${isDarkMode ? 'text-amber-300' : 'text-amber-700'} text-sm`}>
            <li>Include the reference ID ({referenceId}) in your payment remarks</li>
            <li>After payment, take a screenshot of the completed transaction</li>
            <li>Your verification request will be reviewed by our admin team</li>
            <li>Approval usually takes less than 24 hours</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default UpiPaymentPage;