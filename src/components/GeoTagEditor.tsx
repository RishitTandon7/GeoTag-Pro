import React, { useState, useEffect, useRef } from 'react';
import { Camera, MapPin, Calendar, Clock, Edit, Download, Share2, Image, Map as MapIcon, Info, Upload, X, Search, Globe, Sun, Moon, AlertTriangle, Lock, Zap, Heart, Award, RefreshCw } from 'lucide-react';
import LocationPicker from '../components/LocationPicker';
import MapThumbnail from '../components/MapThumbnail';
import { toPng } from 'html-to-image';
import { useAuthStore } from '../store/authStore';
import { useImageStore } from '../store/imageStore';
import toast from 'react-hot-toast';
import { supabase } from '../lib/supabase';
import ExportPanel from './ExportPanel';
import DownloadLimitPopup from './DownloadLimitPopup';
import LicenseUsageNotification from './LicenseUsageNotification';

interface Location {
  name: string;
  address: string;
  latitude: number;
  longitude: number;
}

interface PhotoData {
  imageUrl: string;
  location: Location;
  date: Date;
  showWatermark: boolean;
}

const GeoTagEditor = () => {
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });

  const { user } = useAuthStore();
  const { 
    addEditedImage, 
    canEditMoreImages, 
    getRemainingEdits, 
    getImageLimit,
    editedImages,
    syncWithServer
  } = useImageStore();

  const [photoData, setPhotoData] = useState<PhotoData>({
    imageUrl: 'https://images.pexels.com/photos/2662116/pexels-photo-2662116.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2',
    location: {
      name: '',
      address: '',
      latitude: 0,
      longitude: 0
    },
    date: new Date(),
    showWatermark: true
  });

  const [isEditing, setIsEditing] = useState(true);
  const [editedData, setEditedData] = useState<PhotoData>(photoData);
  const [allFieldsFilled, setAllFieldsFilled] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [isLocationPickerOpen, setIsLocationPickerOpen] = useState(false);
  const [showLimitModal, setShowLimitModal] = useState(false);
  const [isSyncingUsage, setIsSyncingUsage] = useState(false);
  const [showExportPanel, setShowExportPanel] = useState(false);
  const [showDownloadPopup, setShowDownloadPopup] = useState(false);
  const [showLicenseInfo, setShowLicenseInfo] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const imageContainerRef = useRef<HTMLDivElement>(null);
  const [hasUploadedImage, setHasUploadedImage] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [imageAspect, setImageAspect] = useState(0);

  // Get current usage stats
  const remainingEdits = getRemainingEdits();
  const imageLimit = getImageLimit();
  const usedEdits = editedImages.length;
  const isUnlimited = imageLimit === Infinity;
  const isRunningLow = !isUnlimited && remainingEdits <= 3 && remainingEdits > 0;
  const hasReachedLimit = remainingEdits === 0 && !isUnlimited;

  // Get user subscription info
  const getUserPlan = () => {
    if (!user) return { name: 'Guest', color: 'gray', icon: Globe };
    if (user.profile?.subscription_tier === 'premium') return { name: 'Premium', color: 'purple', icon: Award };
    if (user.profile?.subscription_tier === 'friend') return { name: 'Friend', color: 'pink', icon: Heart };
    return { name: 'Free', color: 'blue', icon: Zap };
  };

  const userPlan = getUserPlan();

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDarkMode);
  }, [isDarkMode]);

  // Sync with server on component mount
  useEffect(() => {
    if (user) {
      // Sync usage counts with server on load
      const syncUsageData = async () => {
        setIsSyncingUsage(true);
        try {
          await syncWithServer();
        } catch (error) {
          console.error("Error syncing with server:", error);
        }
        setIsSyncingUsage(false);
      };
      
      syncUsageData();
    }
  }, [user, syncWithServer]);
  
  // Show the license info popup after a short delay
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowLicenseInfo(true);
    }, 2000);
    
    return () => clearTimeout(timer);
  }, []);

  // Check if all fields are filled
  useEffect(() => {
    const data = isEditing ? editedData : photoData;
    const hasRequiredFields =
      data.location.name.trim() !== '' &&
      data.location.address.trim() !== '' &&
      data.location.latitude !== 0 &&
      data.location.longitude !== 0;
    
    setAllFieldsFilled(hasRequiredFields);
    
    if (hasRequiredFields && isEditing) {
      setShowPreview(true);
    }
  }, [photoData, editedData, isEditing, hasUploadedImage]);

  // Cleanup camera stream when component unmounts
  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [stream]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadError('');
      setIsUploading(true);
      
      if (file.size > 5 * 1024 * 1024) {
        setUploadError('Image is too large (max 5MB)');
        setIsUploading(false);
        return;
      }
      
      if (!file.type.match('image.*')) {
        setUploadError('Only image files are allowed');
        setIsUploading(false);
        return;
      }
      
      const reader = new FileReader();
      
      reader.onloadend = () => {
        const img = new Image();
        
        img.onload = () => {
          setImageAspect(img.height / img.width);
          setEditedData({
            ...editedData,
            imageUrl: reader.result as string
          });
          setHasUploadedImage(true);
          setIsUploading(false);
        };
        
        img.src = reader.result as string;
      };
      
      reader.onerror = () => {
        setUploadError('Failed to read file');
        setIsUploading(false);
      };
      
      reader.readAsDataURL(file);
    }
  };

  const openCamera = async () => {
    try {
      setUploadError('');
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment',
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        }
      });
      
      setStream(mediaStream);
      setIsCameraOpen(true);
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        videoRef.current.play();
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      setUploadError('Could not access camera. Please make sure you have granted camera permissions.');
    }
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;
    
    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    // Set canvas dimensions to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    setImageAspect(canvas.height / canvas.width);
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Draw the video frame to the canvas
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    // Convert canvas to data URL
    const dataUrl = canvas.toDataURL('image/jpeg');
    
    // Update state with captured image
    setEditedData({
      ...editedData,
      imageUrl: dataUrl
    });
    
    setHasUploadedImage(true);
    closeCamera();
  };

  const closeCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setIsCameraOpen(false);
  };

  const triggerFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const removeUploadedImage = () => {
    setEditedData({
      ...editedData,
      imageUrl: 'https://images.pexels.com/photos/2662116/pexels-photo-2662116.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2'
    });
    setHasUploadedImage(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    setImageAspect(0);
  };

  const handleEditToggle = () => {
    if (isEditing) {
      setPhotoData(editedData);
      setIsEditing(false);
    } else {
      setEditedData({...photoData});
      setHasUploadedImage(false);
      setIsEditing(true);
      setShowPreview(false);
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleDownloadImage = async () => {
    if (!imageContainerRef.current) return;
    
    // Check if user can download more images
    if (hasReachedLimit) {
      setShowLimitModal(true);
      return;
    }

    // Instead of directly downloading, show the export panel first
    setShowExportPanel(true);
  };

  const handleExport = async () => {
    if (!imageContainerRef.current) return;
    
    try {
      setIsDownloading(true);
      setShowPreview(true);
      
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const dataUrl = await toPng(imageContainerRef.current, {
        quality: 0.95,
        style: {
          transform: 'scale(2)',
          transformOrigin: 'top left',
          width: `${imageContainerRef.current.offsetWidth}px`,
          height: `${imageContainerRef.current.offsetHeight}px`
        }
      });
      
      const link = document.createElement('a');
      const locationName = (isEditing ? editedData : photoData).location.name;
      const filename = locationName 
        ? `geotag-${locationName.replace(/[^a-z0-9]/gi, '-').toLowerCase()}.png`
        : 'geotagged-photo.png';
      
      link.download = filename;
      link.href = dataUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Track the download
      const success = addEditedImage(crypto.randomUUID());
      if (success) {
        toast.success('Image downloaded successfully!');
        
        // Show the download limit popup
        setShowDownloadPopup(true);

        // Update the server with new usage data
        if (user) {
          syncWithServer();
        }
      }

      setShowExportPanel(false);
      
    } catch (error) {
      console.error('Error downloading image:', error);
      toast.error('Failed to download image');
    } finally {
      setIsDownloading(false);
      if (isEditing) {
        setShowPreview(false);
      }
    }
  };

  const handleLocationSelect = (location: Location) => {
    setEditedData({
      ...editedData,
      location
    });
    setIsLocationPickerOpen(false);
  };

  const getProgressBarColor = () => {
    if (isUnlimited) return 'bg-purple-500';
    if (hasReachedLimit) return 'bg-red-500';
    if (isRunningLow) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getProgressPercentage = () => {
    if (isUnlimited) return 100;
    if (imageLimit === 0) return 0;
    return Math.max(0, Math.min(100, (usedEdits / imageLimit) * 100));
  };

  const forceUsageSync = async () => {
    setIsSyncingUsage(true);
    try {
      await syncWithServer();
      toast.success('Usage data synced with server');
    } catch (error) {
      console.error("Error syncing with server:", error);
      toast.error('Error syncing usage data');
    }
    setIsSyncingUsage(false);
  };

  return (
    <div className={`min-h-screen ${isDarkMode ? 'dark bg-gray-900' : 'bg-gray-100'} transition-colors duration-200`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Usage Limit Banner - Now ALWAYS VISIBLE */}
        <div className={`mb-6 rounded-xl p-4 border transition-all duration-300 animate-scaleIn ${
          hasReachedLimit 
            ? isDarkMode ? 'bg-red-900/20 border-red-800/30' : 'bg-red-50 border-red-200'
            : isRunningLow
              ? isDarkMode ? 'bg-yellow-900/20 border-yellow-800/30' : 'bg-yellow-50 border-yellow-200'
              : isDarkMode ? 'bg-gray-800/50 border-gray-700' : 'bg-white border-gray-200'
        } shadow-lg`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className={`p-2 rounded-lg ${
                hasReachedLimit 
                  ? isDarkMode ? 'bg-red-900/50' : 'bg-red-100'
                  : isRunningLow
                    ? isDarkMode ? 'bg-yellow-900/50' : 'bg-yellow-100'
                    : isDarkMode ? 'bg-gray-700' : 'bg-gray-100'
              }`}>
                {React.createElement(userPlan.icon, {
                  className: `h-5 w-5 ${
                    userPlan.color === 'purple' ? 'text-purple-600 dark:text-purple-400' :
                    userPlan.color === 'pink' ? 'text-pink-600 dark:text-pink-400' :
                    userPlan.color === 'blue' ? 'text-blue-600 dark:text-blue-400' :
                    'text-gray-600 dark:text-gray-400'
                  }`
                })}
              </div>
              <div className="flex-1">
                <div className="flex items-center space-x-2">
                  <h3 className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    {userPlan.name} Plan
                  </h3>
                  {hasReachedLimit && (
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      isDarkMode ? 'bg-red-900/50 text-red-300' : 'bg-red-100 text-red-700'
                    }`}>
                      Limit Reached
                    </span>
                  )}
                  {isRunningLow && !hasReachedLimit && (
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      isDarkMode ? 'bg-yellow-900/50 text-yellow-300' : 'bg-yellow-100 text-yellow-700'
                    }`}>
                      Running Low
                    </span>
                  )}
                </div>
                <div className="flex items-center space-x-3 mt-1">
                  <span className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                    {isUnlimited 
                      ? `Unlimited downloads • ${usedEdits} generated`
                      : `${remainingEdits} of ${imageLimit} downloads remaining`
                    }
                  </span>
                  {!isUnlimited && (
                    <div className="flex-1 max-w-32">
                      <div className={`w-full h-2 rounded-full ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'}`}>
                        <div 
                          className={`h-2 rounded-full transition-all duration-500 ${getProgressBarColor()}`}
                          style={{ width: `${getProgressPercentage()}%` }}
                        ></div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            {/* Large remaining counter with sync button */}
            <div className="text-right flex items-center">
              {user && (
                <button 
                  onClick={forceUsageSync}
                  disabled={isSyncingUsage}
                  className={`mr-3 p-2 rounded-md ${
                    isDarkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'
                  } transition-colors`}
                  title="Sync usage data with server"
                >
                  <RefreshCw className={`h-4 w-4 ${isSyncingUsage ? 'animate-spin' : ''} ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-700'
                  }`} />
                </button>
              )}
              <div>
                <div className={`text-3xl font-bold ${
                  hasReachedLimit 
                    ? isDarkMode ? 'text-red-400' : 'text-red-600'
                    : isRunningLow
                      ? isDarkMode ? 'text-yellow-400' : 'text-yellow-600'
                      : isDarkMode ? 'text-green-400' : 'text-green-600'
                }`}>
                  {isUnlimited ? '∞' : remainingEdits}
                </div>
                <div className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  {isUnlimited ? 'unlimited' : 'remaining'}
                </div>
              </div>
            </div>
          </div>

          {/* Warning messages */}
          {hasReachedLimit && (
            <div className="mt-3 p-3 rounded-lg bg-red-100 dark:bg-red-900/30 animate-fadeIn">
              <div className="flex items-start">
                <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400 mt-0.5 mr-2" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-red-800 dark:text-red-300">
                    {!user 
                      ? "You've used your 1 free download!" 
                      : "You've reached your download limit!"
                    }
                  </p>
                  <p className="text-xs text-red-700 dark:text-red-400 mt-1">
                    {!user 
                      ? "Sign up for free to get 15 downloads, or upgrade to Premium for unlimited access."
                      : user.profile?.subscription_tier === 'free'
                        ? "Upgrade to Premium for unlimited downloads and advanced features."
                        : "Contact support if you think this is an error."
                    }
                  </p>
                </div>
                <div className="ml-3">
                  {!user ? (
                    <a 
                      href="/register" 
                      className="inline-flex items-center px-3 py-1.5 bg-red-600 text-white text-xs font-medium rounded-md hover:bg-red-700 transition-colors"
                    >
                      Sign Up Free
                    </a>
                  ) : user.profile?.subscription_tier === 'free' ? (
                    <a 
                      href="/pricing" 
                      className="inline-flex items-center px-3 py-1.5 bg-red-600 text-white text-xs font-medium rounded-md hover:bg-red-700 transition-colors"
                    >
                      Upgrade Now
                    </a>
                  ) : null}
                </div>
              </div>
            </div>
          )}

          {isRunningLow && !hasReachedLimit && (
            <div className="mt-3 p-3 rounded-lg bg-yellow-100 dark:bg-yellow-900/30 animate-fadeIn">
              <div className="flex items-start">
                <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mt-0.5 mr-2" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-yellow-800 dark:text-yellow-300">
                    Running low on downloads!
                  </p>
                  <p className="text-xs text-yellow-700 dark:text-yellow-400 mt-1">
                    {user?.profile?.subscription_tier === 'free'
                      ? "Consider upgrading to Premium for unlimited downloads."
                      : "You have a few downloads left."
                    }
                  </p>
                </div>
                {user?.profile?.subscription_tier === 'free' && (
                  <div className="ml-3">
                    <a 
                      href="/pricing" 
                      className="inline-flex items-center px-3 py-1.5 bg-yellow-600 text-white text-xs font-medium rounded-md hover:bg-yellow-700 transition-colors"
                    >
                      Upgrade Now
                    </a>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow overflow-hidden transition-colors duration-200`}>
              <div className={`p-4 border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'} flex flex-col sm:flex-row sm:items-center sm:justify-between`}>
                <h1 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'} mb-4 sm:mb-0 flex items-center`}>
                  <Camera className="h-6 w-6 mr-2 text-purple-600" />
                  GeoTag Photo Editor
                </h1>
                
                <div className="flex flex-wrap gap-2">
                  <div className="relative group">
                    <button 
                      onClick={handleDownloadImage}
                      disabled={isDownloading || !allFieldsFilled || hasReachedLimit}
                      className={`px-4 py-2 rounded-md flex items-center transition-all duration-200 ${
                        hasReachedLimit
                          ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                          : allFieldsFilled && !isDownloading
                            ? "bg-purple-600 text-white hover:bg-purple-700"
                            : "bg-gray-300 text-gray-500 cursor-not-allowed"
                      }`}
                      title={hasReachedLimit ? "Download limit reached" : "Download geotagged image"}
                    >
                      {hasReachedLimit ? (
                        <>
                          <Lock className="h-4 w-4 mr-2" />
                          Limit Reached
                        </>
                      ) : isDownloading ? (
                        <>
                          <div className="animate-spin h-4 w-4 mr-2 border-2 border-white border-t-transparent rounded-full"></div>
                          Downloading...
                        </>
                      ) : (
                        <>
                          <Download className="h-4 w-4 mr-2" />
                          Export
                        </>
                      )}
                    </button>
                    
                    {/* Download Counter Badge */}
                    <div className={`absolute -top-3 -right-3 px-2 py-1 rounded-full text-xs font-bold shadow-md border 
                      ${hasReachedLimit 
                        ? 'bg-red-600 text-white border-red-700'
                        : isRunningLow
                          ? 'bg-yellow-500 text-white border-yellow-600'
                          : isUnlimited
                            ? 'bg-purple-600 text-white border-purple-700'
                            : 'bg-green-500 text-white border-green-600'
                      }`}>
                      {isUnlimited ? '∞' : remainingEdits}
                    </div>
                  </div>
                  
                  <button
                    onClick={() => setIsDarkMode(!isDarkMode)}
                    className={`p-2 rounded-md ${isDarkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'} transition-colors duration-200`}
                    aria-label={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
                  >
                    {isDarkMode ? <Sun className="h-5 w-5 text-gray-200" /> : <Moon className="h-5 w-5 text-gray-700" />}
                  </button>
                  <button 
                    onClick={() => setShowLicenseInfo(true)}
                    className={`p-2 rounded-md ${
                      isDarkMode ? 'bg-blue-700 hover:bg-blue-600' : 'bg-blue-100 hover:bg-blue-200'
                    } transition-colors duration-200`}
                    aria-label="License information"
                    title="View license usage information"
                  >
                    <Info className={`h-5 w-5 ${isDarkMode ? 'text-blue-200' : 'text-blue-600'}`} />
                  </button>
                </div>
              </div>

              <div className="relative">
                <input 
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />

                {/* Camera UI */}
                {isCameraOpen && (
                  <div className="relative bg-black w-full">
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      className="w-full h-auto"
                      style={{ maxHeight: '80vh' }}
                    ></video>
                    <canvas ref={canvasRef} className="hidden"></canvas>
                    
                    <div className="absolute bottom-4 left-0 right-0 flex justify-center space-x-4">
                      <button
                        onClick={closeCamera}
                        className="p-3 bg-red-500 rounded-full text-white"
                      >
                        <X className="h-6 w-6" />
                      </button>
                      <button
                        onClick={capturePhoto}
                        className="p-3 bg-white rounded-full"
                      >
                        <Camera className="h-6 w-6 text-black" />
                      </button>
                    </div>
                  </div>
                )}

                {/* Image Preview */}
                {!isCameraOpen && (
                  <div ref={imageContainerRef} className="relative bg-black">
                    <div className="w-full h-auto">
                      <img 
                        src={isEditing ? editedData.imageUrl : photoData.imageUrl} 
                        alt="Preview" 
                        className="w-full h-auto object-contain"
                        style={imageAspect ? { aspectRatio: `1/${imageAspect}` } : undefined}
                        onError={(e) => {
                          e.currentTarget.src = "https://images.pexels.com/photos/1266810/pexels-photo-1266810.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2";
                        }}
                        onLoad={(e) => {
                          if (!imageAspect) {
                            const img = e.currentTarget;
                            setImageAspect(img.naturalHeight / img.naturalWidth);
                          }
                        }}
                      />
                    </div>
                    
                    {((isEditing ? editedData.showWatermark : photoData.showWatermark) && 
                      allFieldsFilled && 
                      (showPreview || !isEditing)) && (
                      <div className="absolute bottom-0 left-0 right-0 bg-black/80 text-white p-2">
                        <div className="flex items-center">
                          <div className="mr-2 flex-shrink-0">
                            <MapThumbnail 
                              latitude={isEditing ? editedData.location.latitude : photoData.location.latitude}
                              longitude={isEditing ? editedData.location.longitude : photoData.location.longitude}
                              width={60}
                              height={60}
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-base font-bold truncate">
                              {isEditing ? editedData.location.name : photoData.location.name}
                            </div>
                            <div className="text-xs truncate">
                              {isEditing ? editedData.location.address : photoData.location.address}
                            </div>
                            <div className="text-xs">
                              Lat {isEditing ? editedData.location.latitude.toFixed(4) : photoData.location.latitude.toFixed(4)}° 
                              Long {isEditing ? editedData.location.longitude.toFixed(4) : photoData.location.longitude.toFixed(4)}°
                            </div>
                          </div>
                          <div className="absolute top-1 right-2 p-1 bg-white/80 rounded">
                            <span className="text-black text-xs font-bold">GPS Map Camera</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
                
                {isEditing && !showPreview && !hasUploadedImage && !isCameraOpen && (
                  <div className="absolute top-4 right-4 flex space-x-2 z-10">
                    <button 
                      onClick={triggerFileInput}
                      className="bg-black/50 p-2 rounded-lg hover:bg-black/70 transition-colors focus:outline-none group"
                      title="Choose from gallery"
                    >
                      <Image className="h-6 w-6 text-white group-hover:text-purple-200" />
                    </button>
                    <button 
                      onClick={openCamera}
                      className="bg-black/50 p-2 rounded-lg hover:bg-black/70 transition-colors focus:outline-none group"
                      title="Take a photo"
                    >
                      <Camera className="h-6 w-6 text-white group-hover:text-purple-200" />
                    </button>
                  </div>
                )}

                {isEditing && hasUploadedImage && !isCameraOpen && (
                  <button
                    onClick={removeUploadedImage}
                    className="absolute top-4 right-4 bg-red-500/50 p-2 rounded-lg hover:bg-red-500/70 transition-colors focus:outline-none group z-10"
                    title="Remove uploaded image"
                  >
                    <X className="h-6 w-6 text-white group-hover:text-red-200" />
                  </button>
                )}
                
                {uploadError && (
                  <div className="mt-2 p-3 bg-red-100 border border-red-200 rounded-md text-red-600 text-sm">
                    <AlertTriangle className="inline-block h-4 w-4 mr-1" />
                    {uploadError}
                  </div>
                )}
              </div>

              <div className={`p-6 border-t ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                {isEditing && (
                  <div className="mb-6">
                    <h3 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'} mb-3 flex items-center`}>
                      <MapPin className="h-5 w-5 mr-2 text-purple-600" />
                      Location Information
                    </h3>
                    
                    {!allFieldsFilled && (
                      <div className={`mb-4 p-3 rounded-md ${isDarkMode ? 'bg-blue-900/20 text-blue-300' : 'bg-blue-50 text-blue-700'}`}>
                        <Info className="h-4 w-4 inline mr-1" />
                        Click the button below to search and add location information to your photo.
                      </div>
                    )}
                    
                    <button
                      onClick={() => setIsLocationPickerOpen(true)}
                      className="w-full py-3 px-4 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors flex items-center justify-center"
                    >
                      <Search className="h-5 w-5 mr-2" />
                      {allFieldsFilled ? 'Change Location' : 'Add Location'}
                    </button>
                    
                    {allFieldsFilled && (
                      <div className={`mt-4 p-4 rounded-md ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                        <h4 className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'} mb-2`}>Selected Location:</h4>
                        <p className={`${isDarkMode ? 'text-gray-300' : 'text-gray-700'} font-semibold`}>{editedData.location.name}</p>
                        <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'} text-sm`}>{editedData.location.address}</p>
                        <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'} text-xs mt-1`}>
                          Latitude: {editedData.location.latitude.toFixed(6)}°, Longitude: {editedData.location.longitude.toFixed(6)}°
                        </p>
                      </div>
                    )}
                  </div>
                )}
                
                {/* Export Control with License Counter */}
                <div className="mt-4">
                  <div className={`rounded-lg border ${
                    hasReachedLimit
                      ? isDarkMode ? 'border-red-800/50 bg-red-900/20' : 'border-red-200 bg-red-50'
                      : isDarkMode ? 'border-gray-700 bg-gray-800/60' : 'border-gray-200 bg-gray-50'
                  } p-4`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <Download className={`h-5 w-5 mr-2 ${
                          hasReachedLimit
                            ? 'text-red-500 dark:text-red-400'
                            : 'text-purple-600 dark:text-purple-400'
                        }`} />
                        <span className={`font-medium ${
                          hasReachedLimit
                            ? 'text-red-700 dark:text-red-300'
                            : isDarkMode ? 'text-white' : 'text-gray-900'
                        }`}>
                          Export Options
                        </span>
                      </div>
                      
                      {/* Installation Counter */}
                      <div className="flex items-center space-x-2">
                        <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                          Installations Left:
                        </span>
                        <div className={`px-3 py-1 rounded-lg font-bold ${
                          hasReachedLimit
                            ? 'bg-red-600 text-white'
                            : isRunningLow
                              ? 'bg-yellow-500 text-white'
                              : isUnlimited
                                ? 'bg-purple-600 text-white'
                                : 'bg-green-500 text-white'
                        }`}>
                          {isUnlimited ? '∞' : remainingEdits}
                        </div>
                      </div>
                    </div>
                    
                    <div className="mt-3 flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-3">
                      <button
                        onClick={handleDownloadImage}
                        disabled={isDownloading || !allFieldsFilled || hasReachedLimit}
                        className={`flex-1 flex items-center justify-center px-4 py-2 rounded-lg ${
                          hasReachedLimit
                            ? "bg-gray-400 text-gray-600 cursor-not-allowed"
                            : allFieldsFilled && !isDownloading
                              ? "bg-purple-600 text-white hover:bg-purple-700"
                              : "bg-gray-400 text-gray-600 cursor-not-allowed"
                        } transition-all duration-200`}
                      >
                        {hasReachedLimit ? (
                          <>
                            <Lock className="h-4 w-4 mr-2" />
                            Limit Reached
                          </>
                        ) : isDownloading ? (
                          <>
                            <div className="animate-spin h-4 w-4 mr-2 border-2 border-white border-t-transparent rounded-full"></div>
                            Downloading...
                          </>
                        ) : (
                          <>
                            <Download className="h-4 w-4 mr-2" />
                            Download Image
                          </>
                        )}
                      </button>
                      
                      {!isUnlimited && !hasReachedLimit && (
                        <div className={`flex-1 py-2 px-4 rounded-lg ${
                          isDarkMode ? 'bg-gray-700' : 'bg-white'
                        } relative overflow-hidden`}>
                          <div className="flex justify-between items-center relative z-10">
                            <span className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                              Used:
                            </span>
                            <span className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                              {usedEdits}/{imageLimit}
                            </span>
                          </div>
                          <div className={`absolute bottom-0 left-0 h-1 ${
                            hasReachedLimit ? 'bg-red-500' : 
                            isRunningLow ? 'bg-yellow-500' : 
                            'bg-green-500'
                          } transition-all duration-500`} style={{ width: `${getProgressPercentage()}%` }}>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar with usage stats */}
          <div className="lg:col-span-1">
            <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow p-6 mb-6 animate-fadeIn`}>
              <h3 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'} mb-4 flex items-center`}>
                <Download className="h-5 w-5 mr-2 text-purple-600" />
                Download Usage
              </h3>
              
              <div className="space-y-4">
                <div className={`p-3 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                  <div className="flex justify-between items-center mb-2">
                    <span className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>Downloads Used</span>
                    <span className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                      {usedEdits}
                    </span>
                  </div>
                </div>
                
                <div className={`p-3 rounded-lg ${
                  hasReachedLimit
                    ? isDarkMode ? 'bg-red-900/30' : 'bg-red-50'
                    : isRunningLow
                      ? isDarkMode ? 'bg-yellow-900/30' : 'bg-yellow-50'
                      : isDarkMode ? 'bg-gray-700' : 'bg-gray-50'
                }`}>
                  <div className="flex justify-between items-center mb-2">
                    <span className={`text-sm ${
                      hasReachedLimit
                        ? isDarkMode ? 'text-red-300' : 'text-red-600'
                        : isRunningLow
                          ? isDarkMode ? 'text-yellow-300' : 'text-yellow-600'
                          : isDarkMode ? 'text-gray-300' : 'text-gray-600'
                    }`}>Remaining Downloads</span>
                    <span className={`text-2xl font-bold ${
                      hasReachedLimit 
                        ? isDarkMode ? 'text-red-400' : 'text-red-600'
                        : isRunningLow
                          ? isDarkMode ? 'text-yellow-400' : 'text-yellow-600'
                          : isDarkMode ? 'text-green-400' : 'text-green-600'
                    }`}>
                      {isUnlimited ? '∞' : remainingEdits}
                    </span>
                  </div>
                  {!isUnlimited && (
                    <div className={`w-full h-3 rounded-full ${isDarkMode ? 'bg-gray-600' : 'bg-gray-200'} mt-2`}>
                      <div 
                        className={`h-3 rounded-full transition-all duration-500 ${getProgressBarColor()}`}
                        style={{ width: `${getProgressPercentage()}%` }}
                      ></div>
                    </div>
                  )}
                </div>
                
                <div className={`p-4 rounded-lg ${
                  userPlan.color === 'purple' 
                    ? isDarkMode ? 'bg-purple-900/20 border border-purple-800/20' : 'bg-purple-50 border border-purple-200'
                    : userPlan.color === 'pink'
                      ? isDarkMode ? 'bg-pink-900/20 border border-pink-800/20' : 'bg-pink-50 border border-pink-200'
                      : userPlan.color === 'blue'
                        ? isDarkMode ? 'bg-blue-900/20 border border-blue-800/20' : 'bg-blue-50 border border-blue-200'
                        : isDarkMode ? 'bg-gray-700 border border-gray-600' : 'bg-gray-50 border border-gray-200'
                }`}>
                  <div className="flex items-center">
                    {React.createElement(userPlan.icon, {
                      className: `h-5 w-5 ${
                        userPlan.color === 'purple' ? 'text-purple-600 dark:text-purple-400' :
                        userPlan.color === 'pink' ? 'text-pink-600 dark:text-pink-400' :
                        userPlan.color === 'blue' ? 'text-blue-600 dark:text-blue-400' :
                        'text-gray-600 dark:text-gray-400'
                      }`
                    })}
                    <span className={`ml-2 font-medium ${
                      userPlan.color === 'purple' ? 'text-purple-700 dark:text-purple-300' :
                      userPlan.color === 'pink' ? 'text-pink-700 dark:text-pink-300' :
                      userPlan.color === 'blue' ? 'text-blue-700 dark:text-blue-300' :
                      'text-gray-700 dark:text-gray-300'
                    }`}>
                      {userPlan.name} Plan
                    </span>
                  </div>
                  
                  <p className={`mt-2 text-sm ${
                    userPlan.color === 'purple' ? 'text-purple-600 dark:text-purple-400' :
                    userPlan.color === 'pink' ? 'text-pink-600 dark:text-pink-400' :
                    userPlan.color === 'blue' ? 'text-blue-600 dark:text-blue-400' :
                    'text-gray-600 dark:text-gray-400'
                  }`}>
                    {isUnlimited 
                      ? "Enjoy unlimited downloads with your premium subscription."
                      : !user
                        ? "Sign up for free to get 15 downloads."
                        : `You have ${remainingEdits} of ${imageLimit} downloads remaining.`
                    }
                  </p>
                </div>
              </div>
              
              {!isUnlimited && (
                <div className="mt-4">
                  {!user ? (
                    <a 
                      href="/register" 
                      className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-2 px-4 rounded-md hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 flex items-center justify-center"
                    >
                      <Zap className="h-4 w-4 mr-2" />
                      Sign Up for 15 Free Downloads
                    </a>
                  ) : user.profile?.subscription_tier === 'free' ? (
                    <a 
                      href="/pricing" 
                      className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white py-2 px-4 rounded-md hover:from-purple-700 hover:to-indigo-700 transition-all duration-200 flex items-center justify-center"
                    >
                      <Zap className="h-4 w-4 mr-2" />
                      Upgrade for Unlimited Downloads
                    </a>
                  ) : null}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Location Picker Modal */}
      <LocationPicker
        isOpen={isLocationPickerOpen}
        onClose={() => setIsLocationPickerOpen(false)}
        onSelectLocation={handleLocationSelect}
      />

      {/* Limit Reached Modal */}
      {showLimitModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className={`max-w-md w-full rounded-xl shadow-2xl overflow-hidden animate-scaleIn ${
            isDarkMode ? 'bg-gray-800' : 'bg-white'
          }`}>
            <div className="p-6">
              <div className="flex items-center mb-4">
                <div className="h-12 w-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                  <Lock className="h-6 w-6 text-red-600 dark:text-red-400" />
                </div>
                <h3 className={`ml-4 text-lg font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  Download Limit Reached
                </h3>
              </div>
              
              <p className={`mb-6 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                {!user 
                  ? "You've used your 1 free download. Sign up for free to get 15 downloads, or upgrade to Premium for unlimited access."
                  : user.profile?.subscription_tier === 'free'
                    ? "You've used all 15 of your free downloads. Upgrade to Premium for unlimited downloads and advanced features."
                    : "You've reached your download limit. Contact support if you think this is an error."
                }
              </p>
              
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowLimitModal(false)}
                  className={`flex-1 py-2 px-4 rounded-md border ${
                    isDarkMode 
                      ? 'border-gray-600 text-gray-300 hover:bg-gray-700' 
                      : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  Close
                </button>
                {!user ? (
                  <a 
                    href="/register" 
                    className="flex-1 py-2 px-4 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors text-center"
                  >
                    Sign Up Free
                  </a>
                ) : user.profile?.subscription_tier === 'free' ? (
                  <a 
                    href="/pricing" 
                    className="flex-1 py-2 px-4 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors text-center"
                  >
                    Upgrade Now
                  </a>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Export Panel Modal */}
      {showExportPanel && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="max-w-md w-full animate-scaleIn">
            <ExportPanel 
              onExport={handleExport}
              onCancel={() => setShowExportPanel(false)}
              isDownloading={isDownloading}
            />
          </div>
        </div>
      )}
      
      {/* Post-download Popup */}
      {showDownloadPopup && (
        <DownloadLimitPopup onClose={() => setShowDownloadPopup(false)} />
      )}
      
      {/* License Usage Info Popup */}
      {showLicenseInfo && (
        <LicenseUsageNotification onClose={() => setShowLicenseInfo(false)} />
      )}
    </div>
  );
};

export default GeoTagEditor;