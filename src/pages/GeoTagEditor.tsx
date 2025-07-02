import React, { useState, useEffect, useRef } from 'react';
import { Camera, MapPin, Calendar, Clock, Edit, Download, Share2, Image, Map as MapIcon, Info, Upload, X, Search, Globe, Sun, Moon, Palette, Sparkles, Zap, ArrowRight, ArrowLeft} from 'lucide-react';
import LocationPicker from '../components/LocationPicker';
import MapThumbnail from '../components/MapThumbnail';
import Tips from '../components/Tips';
import * as htmlToImage from 'html-to-image';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { useImageStore } from '../store/imageStore';
import { useAuthStore } from '../store/authStore';
import toast from 'react-hot-toast';
import LoadingScreen from '../components/LoadingScreen';

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

// Create a custom marker icon for leaflet
const createMarkerIcon = () => {
  return L.divIcon({
    html: `<div class="h-5 w-5 bg-purple-600 rounded-full flex items-center justify-center text-white p-1 shadow-lg shadow-purple-700/30 animate-pulse">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-map-pin"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
          </div>`,
    className: '',
    iconSize: [20, 20],
    iconAnchor: [10, 10]
  });
};

const GeoTagEditor = () => {
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });
  
  // Loading state
  const [initialLoading, setInitialLoading] = useState(true);

  // Editor state
  const [activeTab, setActiveTab] = useState<'location' | 'date' | 'watermark' | 'export'>('location');
  
  useEffect(() => {
    // Simulate loading for 1.5 seconds for a better UX
    setTimeout(() => {
      setInitialLoading(false);
    }, 1500);
    
    document.documentElement.classList.toggle('dark', isDarkMode);
  }, [isDarkMode]);

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

  // UI state
  const [colorTheme, setColorTheme] = useState<'purple' | 'blue' | 'green' | 'amber'>('purple');
  const [isEditing, setIsEditing] = useState(true);
  const [editedData, setEditedData] = useState<PhotoData>(photoData);
  const [allFieldsFilled, setAllFieldsFilled] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [isLocationPickerOpen, setIsLocationPickerOpen] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [hasUploadedImage, setHasUploadedImage] = useState(false);
  const [compressionProgress, setCompressionProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user } = useAuthStore();
  const { canEditMoreImages, getRemainingEdits, getImageLimit, addGeneratedImage } = useImageStore();
  const imageContainerRef = useRef<HTMLDivElement>(null);
  const markerIcon = createMarkerIcon();

  // Color theme classes
  const themeColors = {
    purple: {
      primary: isDarkMode ? 'from-purple-600 to-purple-400' : 'from-purple-600 to-purple-400',
      button: isDarkMode ? 'bg-purple-600 hover:bg-purple-700 text-white' : 'bg-purple-600 hover:bg-purple-700 text-white',
      bgLight: 'bg-purple-50',
      textLight: 'text-purple-600',
      textDark: 'text-purple-400',
      border: isDarkMode ? 'border-purple-800' : 'border-purple-200',
      icon: isDarkMode ? 'text-purple-400' : 'text-purple-600'
    },
    blue: {
      primary: isDarkMode ? 'from-blue-600 to-blue-400' : 'from-blue-600 to-blue-400',
      button: isDarkMode ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-blue-600 hover:bg-blue-700 text-white',
      bgLight: 'bg-blue-50',
      textLight: 'text-blue-600',
      textDark: 'text-blue-400',
      border: isDarkMode ? 'border-blue-800' : 'border-blue-200',
      icon: isDarkMode ? 'text-blue-400' : 'text-blue-600'
    },
    green: {
      primary: isDarkMode ? 'from-green-600 to-green-400' : 'from-green-600 to-green-400',
      button: isDarkMode ? 'bg-green-600 hover:bg-green-700 text-white' : 'bg-green-600 hover:bg-green-700 text-white',
      bgLight: 'bg-green-50',
      textLight: 'text-green-600',
      textDark: 'text-green-400',
      border: isDarkMode ? 'border-green-800' : 'border-green-200',
      icon: isDarkMode ? 'text-green-400' : 'text-green-600'
    },
    amber: {
      primary: isDarkMode ? 'from-amber-600 to-amber-400' : 'from-amber-600 to-amber-400',
      button: isDarkMode ? 'bg-amber-600 hover:bg-amber-700 text-white' : 'bg-amber-600 hover:bg-amber-700 text-white',
      bgLight: 'bg-amber-50',
      textLight: 'text-amber-600',
      textDark: 'text-amber-400',
      border: isDarkMode ? 'border-amber-800' : 'border-amber-200',
      icon: isDarkMode ? 'text-amber-400' : 'text-amber-600'
    }
  };
  
  const currentTheme = themeColors[colorTheme];

  // Check if all fields are filled
  useEffect(() => {
    const data = isEditing ? editedData : photoData;
    const hasRequiredFields = 
      data.location.name.trim() !== '' &&
      data.location.address.trim() !== '' &&
      data.location.latitude !== 0 &&
      data.location.longitude !== 0;
    
    setAllFieldsFilled(hasRequiredFields);
    
    // Automatically show preview when all fields are filled
    if (hasRequiredFields && isEditing) {
      setShowPreview(true);
    }
  }, [photoData, editedData, isEditing, hasUploadedImage]);

  const handleEditToggle = () => {
    if (isEditing) {
      // Save changes
      setPhotoData(editedData);
      setIsEditing(false);
      setShowPreview(true);
    } else {
      // Start editing
      setEditedData({...photoData});
      setIsEditing(true);
      setHasUploadedImage(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    if (name.startsWith('location.')) {
      const locationField = name.split('.')[1];
      setEditedData({
        ...editedData,
        location: {
          ...editedData.location,
          [locationField]: locationField === 'latitude' || locationField === 'longitude' 
            ? parseFloat(value) || 0 // Ensure we always have a number, defaulting to 0 if parsing fails
            : value
        }
      });
    } else if (name === 'date') {
      setEditedData({
        ...editedData,
        date: new Date(value)
      });
    } else {
      setEditedData({
        ...editedData,
        [name]: value
      });
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleString('en-US', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
      timeZoneName: 'short'
    });
  };

  const formatISODate = (date: Date) => {
    const tzOffset = date.getTimezoneOffset() * 60000;
    const localISOTime = (new Date(date.getTime() - tzOffset)).toISOString().slice(0, 16);
    return localISOTime;
  };

  const triggerFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadError('');
    setIsUploading(true);
    setCompressionProgress(0);
    
    try {
      // Validate file type
      if (!file.type.match('image.*')) {
        throw new Error('Only image files are allowed');
      }
      
      let imageFile = file;
      
      // Create a new FileReader instance
      const reader = new FileReader();
      
      // Setting up promise to handle async FileReader
      const finalImageUrl = await new Promise<string>((resolve, reject) => {
        reader.onloadend = () => {
          if (typeof reader.result === 'string') {
            resolve(reader.result);
          } else {
            reject(new Error('Failed to read image file'));
          }
        };
        
        reader.onerror = () => {
          reject(new Error('Failed to read image file'));
        };
        
        reader.readAsDataURL(file);
      });
      
      // Update the image in state
      setEditedData({
        ...editedData,
        imageUrl: finalImageUrl
      });
      
      setHasUploadedImage(true);
      
    } catch (error: any) {
      setUploadError(error.message || 'Failed to upload image');
      toast.error(error.message || 'Failed to upload image');
      console.error('Error uploading image:', error);
    } finally {
      setIsUploading(false);
      setCompressionProgress(0);
    }
  };

  const removeUploadedImage = () => {
    // Reset to a default image
    setEditedData({
      ...editedData,
      imageUrl: 'https://images.pexels.com/photos/2662116/pexels-photo-2662116.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2'
    });
    setHasUploadedImage(false);
    
    // Clear the file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handlePreviewWatermark = () => {
    setShowPreview(true);
  };

  // Function to check if individual field is valid
  const isFieldValid = (field: string) => {
    if (field === 'location.name') {
      return editedData.location.name.trim() !== '';
    } else if (field === 'location.address') {
      return editedData.location.address.trim() !== '';
    } else if (field === 'location.latitude') {
      return editedData.location.latitude !== 0;
    } else if (field === 'location.longitude') {
      return editedData.location.longitude !== 0;
    }
    return true;
  };

  // Function to determine if the image is from an external URL or data URL
  const isDataUrl = (url: string) => {
    return url.startsWith('data:');
  };

  const openLocationPicker = () => {
    setIsLocationPickerOpen(true);
  };

  const handleSelectLocation = (location: { name: string; address: string; latitude: number; longitude: number; }) => {
    setEditedData({
      ...editedData,
      location: {
        name: location.name,
        address: location.address,
        latitude: location.latitude,
        longitude: location.longitude
      }
    });

    // Show preview after updating location
    setShowPreview(true);
    
    // Set active tab to 'date' after selecting location
    setActiveTab('date');
  };

  // Download the image with watermark
  const handleDownloadImage = async () => {
    if (!imageContainerRef.current) return;

    // Check if we can generate another image
    if (!addGeneratedImage()) {
      const limit = getImageLimit();
      if (!user) {
        toast.error('Please log in to generate more images. Free users are limited to 1 image.');
        return;
      }
      toast.error(`You've reached your limit of ${limit} images. Please upgrade to generate more.`);
      return;
    }
    
    try {
      setIsDownloading(true);
      setShowPreview(true);
      
      // Small delay to ensure watermark is rendered
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const dataUrl = await htmlToImage.toJpeg(imageContainerRef.current, {
        quality: 0.95,
        backgroundColor: '#fff'
      });
      
      // Create a download link and trigger it
      const link = document.createElement('a');
      const locationName = (isEditing ? editedData : photoData).location.name;
      const filename = locationName 
        ? `geotag-${locationName.replace(/[^a-z0-9]/gi, '-').toLowerCase()}.jpg`
        : 'geotagged-photo.jpg';
      
      link.download = filename;
      link.href = dataUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success('Image downloaded successfully!');
      
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

  // Helper function to safely format coordinates
  const formatCoordinate = (value: number | undefined): string => {
    if (value === undefined || value === null || isNaN(value)) {
      return '0.0000';
    }
    return value.toFixed(4);
  };

  const getThemeClass = (themeName: 'purple' | 'blue' | 'green' | 'amber') => {
    return themeName === colorTheme ? 'ring-2 ring-offset-2 ring-white scale-110' : '';
  };

  // Render loading screen
  if (initialLoading) {
    return <LoadingScreen isLoading={initialLoading} message="Loading Editor..." />;
  }

  return (
    <div className={`min-h-screen transition-all duration-500 ${
      isDarkMode 
        ? 'bg-gradient-to-br from-gray-900 to-purple-900'
        : `bg-gradient-to-br from-${colorTheme}-50 to-indigo-100`
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Editor Section */}
          <div className="lg:col-span-2">
            <div className={`rounded-xl overflow-hidden transition-all duration-300 transform hover:shadow-2xl ${
              isDarkMode 
                ? 'bg-gray-800/80 backdrop-blur-sm border border-gray-700 shadow-xl' 
                : 'bg-white/90 backdrop-blur-sm border border-gray-200 shadow-xl'
            }`}>
              {/* Editor Header */}
              <div className={`p-5 border-b flex flex-col sm:flex-row sm:items-center sm:justify-between ${
                isDarkMode ? 'border-gray-700' : 'border-gray-200'
              }`}>
                <h1 className={`text-2xl font-bold mb-4 sm:mb-0 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  <div className={`inline-flex items-center justify-center p-2 rounded-lg bg-gradient-to-r ${currentTheme.primary} mr-2`}>
                    <Camera className="h-6 w-6 text-white" />
                  </div>
                  GeoTag Photo Editor
                </h1>
                
                <div className="flex flex-wrap gap-2">
                  <button 
                    onClick={handleDownloadImage}
                    disabled={isDownloading || !allFieldsFilled}
                    className={`px-4 py-2 rounded-lg flex items-center relative transition-all duration-300 transform hover:translate-y-[-2px] ${
                      allFieldsFilled && !isDownloading && canEditMoreImages()
                        ? `bg-gradient-to-r ${currentTheme.primary} text-white shadow-lg shadow-${colorTheme}-600/20`
                        : `${isDarkMode ? 'bg-gray-700 text-gray-400' : 'bg-gray-300 text-gray-500'} cursor-not-allowed`
                    }`}
                    title={!canEditMoreImages() ? `Image limit reached (${getImageLimit()} images)` : ''}
                  >
                    {/* Show remaining images count */}
                    {user && (
                      <span className="absolute -top-8 left-1/2 transform -translate-x-1/2 whitespace-nowrap text-xs bg-gray-800 text-white px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                        {getRemainingEdits()} image{getRemainingEdits() !== 1 ? 's' : ''} remaining
                      </span>
                    )}
                    {isDownloading ? (
                      <>
                        <div className="animate-spin h-4 w-4 mr-2 border-2 border-white border-t-transparent rounded-full"></div>
                        Downloading...
                      </>
                    ) : (
                      <>
                        <Download className="h-4 w-4 mr-2" />
                        Download
                      </>
                    )}
                    {!user && (
                      <span className="absolute -top-8 left-1/2 transform -translate-x-1/2 whitespace-nowrap text-xs bg-gray-800 text-white px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                        1 image limit for free users
                      </span>
                    )}
                  </button>
                  
                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => setColorTheme('purple')}
                      className={`w-6 h-6 rounded-full bg-gradient-to-r from-purple-600 to-purple-400 transition-all duration-300 ${getThemeClass('purple')}`}
                      aria-label="Purple theme"
                    ></button>
                    <button
                      onClick={() => setColorTheme('blue')}
                      className={`w-6 h-6 rounded-full bg-gradient-to-r from-blue-600 to-blue-400 transition-all duration-300 ${getThemeClass('blue')}`}
                      aria-label="Blue theme"
                    ></button>
                    <button
                      onClick={() => setColorTheme('green')}
                      className={`w-6 h-6 rounded-full bg-gradient-to-r from-green-600 to-green-400 transition-all duration-300 ${getThemeClass('green')}`}
                      aria-label="Green theme"
                    ></button>
                    <button
                      onClick={() => setColorTheme('amber')}
                      className={`w-6 h-6 rounded-full bg-gradient-to-r from-amber-600 to-amber-400 transition-all duration-300 ${getThemeClass('amber')}`}
                      aria-label="Amber theme"
                    ></button>
                  </div>
                  
                  <button
                    onClick={() => setIsDarkMode(!isDarkMode)}
                    className={`p-2 rounded-lg transition-all duration-300 transform hover:scale-110 ${
                      isDarkMode 
                        ? 'bg-gray-700 hover:bg-gray-600 text-gray-200' 
                        : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                    }`}
                    aria-label={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
                  >
                    {isDarkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              {/* Image Preview */}
              <div className="relative">
                {/* Hidden file input */}
                <input 
                  ref={fileInputRef}
                  type="file" 
                  accept="image/*" 
                  onChange={handleImageUpload}
                  className="hidden"
                />

                <div ref={imageContainerRef} className="relative w-full flex items-center justify-center min-h-[400px]">
                  <img 
                    src={isEditing ? editedData.imageUrl : photoData.imageUrl} 
                    alt="Preview" 
                    className="max-w-full h-auto object-contain shadow-lg rounded-sm"
                    onError={(e) => {
                      e.currentTarget.src = "https://images.pexels.com/photos/1266810/pexels-photo-1266810.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2";
                    }}
                  />
                  
                  {/* Watermark */}
                  {((isEditing ? editedData.showWatermark : photoData.showWatermark) && 
                    allFieldsFilled && 
                    (showPreview || !isEditing)) && (
                    <div className="watermark">
                      <div className="watermark-logo">
                        <span className="watermark-logo-text">GPS Map Camera</span>
                      </div>
                      <div className="flex flex-wrap items-start">
                        {/* Only render MapThumbnail if we have valid coordinates */}
                        {(isEditing ? editedData : photoData).location.latitude !== 0 && 
                         (isEditing ? editedData : photoData).location.longitude !== 0 && (
                          <div className="gps-map-container">
                            <MapThumbnail 
                              latitude={isEditing ? editedData.location.latitude : photoData.location.latitude}
                              longitude={isEditing ? editedData.location.longitude : photoData.location.longitude}
                              width={80}
                              height={80}
                              className="w-full h-full"
                            />
                          </div>
                        )}
                        <div className="flex-1 min-w-0 ml-3">
                          <h3 className="watermark-title text-xl font-bold text-white truncate">
                            {isEditing ? editedData.location.name : photoData.location.name}
                          </h3>
                          <p className="watermark-text text-sm text-white truncate">
                            {isEditing ? editedData.location.address : photoData.location.address}
                          </p>
                          <p className="watermark-text text-sm text-white">
                            Lat {formatCoordinate(isEditing ? editedData.location.latitude : photoData.location.latitude)}° • Long {formatCoordinate(isEditing ? editedData.location.longitude : photoData.location.longitude)}°
                          </p>
                          <p className="watermark-text text-sm text-white">
                            {isEditing 
                              ? formatDate(editedData.date) 
                              : formatDate(photoData.date)
                            }
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Upload button - only visible when editing, not previewing, and no image uploaded */}
                {isEditing && !showPreview && !hasUploadedImage && (
                  <button 
                    onClick={triggerFileInput}
                    className="absolute top-4 right-4 bg-black/50 p-2 rounded-lg hover:bg-black/70 transition-colors focus:outline-none group z-10"
                    title="Upload new photo"
                  >
                    <Upload className="h-6 w-6 text-white group-hover:text-purple-200" />
                  </button>
                )}

                {/* Remove image button - only visible when an image has been uploaded */}
                {isEditing && hasUploadedImage && (
                  <button
                    onClick={removeUploadedImage}
                    className="absolute top-4 right-4 bg-red-500/50 p-2 rounded-lg hover:bg-red-500/70 transition-colors focus:outline-none group z-10"
                    title="Remove uploaded image"
                  >
                    <X className="h-6 w-6 text-white group-hover:text-red-200" />
                  </button>
                )}

                {/* Loading overlay for image uploading/compression */}
                {isUploading && (
                  <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center z-20">
                    <div className="animate-spin rounded-full h-12 w-12 border-4 border-white border-t-transparent"></div>
                    <p className="text-white mt-4 text-center">
                      {compressionProgress > 0 
                        ? `Compressing image: ${Math.round(compressionProgress)}%` 
                        : 'Processing image...'}
                    </p>
                  </div>
                )}
              </div>

              {/* Editor Tabs */}
              <div className={`border-t ${isDarkMode ? 'border-gray-700' : 'border-gray-200'} px-6 pt-4`}>
                <div className="flex space-x-1 overflow-x-auto">
                  <button
                    onClick={() => setActiveTab('location')}
                    className={`px-4 py-2 rounded-t-lg text-sm font-medium transition-all ${
                      activeTab === 'location'
                        ? `border-b-2 border-${colorTheme}-500 ${currentTheme.textLight} dark:${currentTheme.textDark}`
                        : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                    }`}
                  >
                    <MapPin className="h-4 w-4 inline-block mr-1" />
                    Location
                  </button>
                  <button
                    onClick={() => setActiveTab('date')}
                    className={`px-4 py-2 rounded-t-lg text-sm font-medium transition-all ${
                      activeTab === 'date'
                        ? `border-b-2 border-${colorTheme}-500 ${currentTheme.textLight} dark:${currentTheme.textDark}`
                        : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                    }`}
                  >
                    <Calendar className="h-4 w-4 inline-block mr-1" />
                    Date & Time
                  </button>
                  <button
                    onClick={() => setActiveTab('watermark')}
                    className={`px-4 py-2 rounded-t-lg text-sm font-medium transition-all ${
                      activeTab === 'watermark'
                        ? `border-b-2 border-${colorTheme}-500 ${currentTheme.textLight} dark:${currentTheme.textDark}`
                        : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                    }`}
                  >
                    <Image className="h-4 w-4 inline-block mr-1" />
                    Watermark
                  </button>
                  <button
                    onClick={() => setActiveTab('export')}
                    className={`px-4 py-2 rounded-t-lg text-sm font-medium transition-all ${
                      activeTab === 'export'
                        ? `border-b-2 border-${colorTheme}-500 ${currentTheme.textLight} dark:${currentTheme.textDark}`
                        : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                    }`}
                  >
                    <Download className="h-4 w-4 inline-block mr-1" />
                    Export
                  </button>
                </div>
              </div>

              {/* Editor Panel Content */}
              <div className={`p-6 border-t ${isDarkMode ? 'border-gray-700/50' : 'border-gray-100'}`}>
                {isEditing && activeTab === 'location' && (
                  <div className="space-y-4 slide-up">
                    <div className="flex items-center justify-between">
                      <h3 className={`text-lg font-semibold flex items-center ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                        <MapPin className={`h-5 w-5 mr-2 ${currentTheme.icon}`} />
                        Location Information
                      </h3>
                      
                      {allFieldsFilled && (
                        <span className={`px-2 py-1 text-xs rounded-full bg-gradient-to-r ${currentTheme.primary} text-white`}>
                          Complete
                        </span>
                      )}
                    </div>
                    
                    {/* Search location button */}
                    <button 
                      onClick={openLocationPicker}
                      className={`w-full py-3 px-4 flex items-center justify-between border rounded-lg text-left mb-4 transition-all duration-300 transform hover:scale-[1.01] shadow-sm hover:shadow ${
                        isDarkMode 
                          ? 'border-gray-600 bg-gray-700 hover:bg-gray-600' 
                          : 'border-gray-300 bg-white hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center">
                        <Search className={`h-5 w-5 mr-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-400'}`} />
                        <span className={isDarkMode ? 'text-gray-300' : 'text-gray-500'}>
                          {editedData.location.name || 'Search for a location...'}
                        </span>
                      </div>
                      <MapPin className={currentTheme.icon} />
                    </button>

                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div>
                        <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                          Latitude <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="number"
                          step="0.000001"
                          name="location.latitude"
                          value={editedData.location.latitude || ''}
                          onChange={handleInputChange}
                          className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-${colorTheme}-500 transition-all duration-200 ${
                            isDarkMode 
                              ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                              : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
                          }`}
                          placeholder="e.g. 13.0827"
                        />
                      </div>
                      <div>
                        <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                          Longitude <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="number"
                          step="0.000001"
                          name="location.longitude"
                          value={editedData.location.longitude || ''}
                          onChange={handleInputChange}
                          className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-${colorTheme}-500 transition-all duration-200 ${
                            isDarkMode 
                              ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                              : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
                          }`}
                          placeholder="e.g. 80.2707"
                        />
                      </div>
                    </div>

                    <div>
                      <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        Location Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="location.name"
                        value={editedData.location.name}
                        onChange={handleInputChange}
                        className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-${colorTheme}-500 mb-4 transition-all duration-200 ${
                          isDarkMode 
                            ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                            : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
                        }`}
                        placeholder="e.g. Chennai, Tamil Nadu, India"
                      />
                    </div>
                    
                    <div>
                      <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        Address <span className="text-red-500">*</span>
                      </label>
                      <textarea
                        name="location.address"
                        value={editedData.location.address}
                        onChange={handleInputChange}
                        rows={2}
                        className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-${colorTheme}-500 transition-all duration-200 ${
                          isDarkMode 
                            ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                            : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
                        }`}
                        placeholder="e.g. Chennai, Tamil Nadu 600001, India"
                      />
                    </div>
                    
                    <div className="flex justify-end mt-4">
                      <button 
                        onClick={() => setActiveTab('date')} 
                        disabled={!isFieldValid('location.name') || !isFieldValid('location.address') || 
                                 !isFieldValid('location.latitude') || !isFieldValid('location.longitude')}
                        className={`px-4 py-2 rounded-lg transition-all duration-300 transform hover:translate-y-[-2px] flex items-center ${
                          isFieldValid('location.name') && isFieldValid('location.address') &&
                          isFieldValid('location.latitude') && isFieldValid('location.longitude')
                            ? `${currentTheme.button} shadow-md hover:shadow-lg`
                            : 'bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                        }`}
                      >
                        Next: Date & Time
                        <ArrowRight className="h-4 w-4 ml-2" />
                      </button>
                    </div>
                  </div>
                )}
                
                {isEditing && activeTab === 'date' && (
                  <div className="space-y-4 slide-up">
                    <div className="flex items-center justify-between">
                      <h3 className={`text-lg font-semibold flex items-center ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                        <Calendar className={`h-5 w-5 mr-2 ${currentTheme.icon}`} />
                        Date & Time
                      </h3>
                    </div>
                    
                    <div className={`p-4 rounded-lg border ${currentTheme.border} ${
                      isDarkMode ? 'bg-gray-700/50' : currentTheme.bgLight
                    }`}>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                            Date
                          </label>
                          <input
                            type="date"
                            name="date"
                            value={formatISODate(editedData.date).split('T')[0]}
                            onChange={handleInputChange}
                            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-${colorTheme}-500 transition-all duration-200 ${
                              isDarkMode 
                                ? 'bg-gray-700 border-gray-600 text-white' 
                                : 'bg-white border-gray-300 text-gray-900'
                            }`}
                          />
                        </div>
                        
                        <div>
                          <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                            Time
                          </label>
                          <input
                            type="time"
                            name="time"
                            value={formatISODate(editedData.date).split('T')[1]}
                            onChange={(e) => {
                              const [hours, minutes] = e.target.value.split(':');
                              const newDate = new Date(editedData.date);
                              newDate.setHours(parseInt(hours, 10));
                              newDate.setMinutes(parseInt(minutes, 10));
                              setEditedData({
                                ...editedData,
                                date: newDate
                              });
                            }}
                            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-${colorTheme}-500 transition-all duration-200 ${
                              isDarkMode 
                                ? 'bg-gray-700 border-gray-600 text-white' 
                                : 'bg-white border-gray-300 text-gray-900'
                            }`}
                          />
                        </div>
                      </div>
                      
                      <div className="mt-4">
                        <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                          Current selection: {formatDate(editedData.date)}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex justify-between mt-4">
                      <button 
                        onClick={() => setActiveTab('location')}
                        className={`px-4 py-2 rounded-lg transition-all duration-300 flex items-center ${
                          isDarkMode 
                            ? 'bg-gray-700 hover:bg-gray-600 text-gray-200' 
                            : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                        }`}
                      >
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Back: Location
                      </button>
                      
                      <button 
                        onClick={() => setActiveTab('watermark')}
                        className={`px-4 py-2 rounded-lg transition-all duration-300 transform hover:translate-y-[-2px] flex items-center ${currentTheme.button} shadow-md hover:shadow-lg`}
                      >
                        Next: Watermark
                        <ArrowRight className="h-4 w-4 ml-2" />
                      </button>
                    </div>
                  </div>
                )}
                
                {isEditing && activeTab === 'watermark' && (
                  <div className="space-y-4 slide-up">
                    <div className="flex items-center justify-between">
                      <h3 className={`text-lg font-semibold flex items-center ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                        <Image className={`h-5 w-5 mr-2 ${currentTheme.icon}`} />
                        Watermark Options
                      </h3>
                    </div>
                    
                    <div className={`p-4 rounded-lg border ${currentTheme.border} ${
                      isDarkMode ? 'bg-gray-700/50' : currentTheme.bgLight
                    }`}>
                      <div className="space-y-4">
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            id="showWatermark"
                            checked={editedData.showWatermark}
                            onChange={() => setEditedData({...editedData, showWatermark: !editedData.showWatermark})}
                            className={`h-4 w-4 text-${colorTheme}-600 focus:ring-${colorTheme}-500 border-gray-300 rounded`}
                          />
                          <label htmlFor="showWatermark" className={`ml-2 block text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-900'}`}>
                            Show watermark on image
                          </label>
                        </div>
                        
                        <div>
                          <p className={`text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                            Watermark Style
                          </p>
                          <div className="grid grid-cols-2 gap-2">
                            <div className={`p-3 border rounded-lg cursor-pointer transition-all duration-200 ${
                              isDarkMode 
                                ? 'bg-gray-800 border-gray-600 hover:border-purple-500' 
                                : 'bg-white border-gray-300 hover:border-purple-500'
                            }`}>
                              <div className="flex items-center">
                                <input
                                  type="radio"
                                  id="style1"
                                  name="watermarkStyle"
                                  checked={true}
                                  className={`h-4 w-4 text-${colorTheme}-600`}
                                />
                                <label htmlFor="style1" className={`ml-2 block text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-900'}`}>
                                  Modern (Default)
                                </label>
                              </div>
                              <div className={`mt-2 h-8 w-full rounded-md bg-black`}>
                                <div className="h-full px-2 flex items-center">
                                  <div className="h-4 w-4 rounded-sm bg-gray-600"></div>
                                  <div className="h-1 w-12 ml-1 bg-white rounded"></div>
                                </div>
                              </div>
                            </div>
                            
                            <div className={`p-3 border rounded-lg cursor-pointer transition-all duration-200 ${
                              isDarkMode 
                                ? 'bg-gray-800 border-gray-600 opacity-50 hover:opacity-75' 
                                : 'bg-white border-gray-300 opacity-50 hover:opacity-75'
                            }`}>
                              <div className="flex items-center">
                                <input
                                  type="radio"
                                  id="style2"
                                  name="watermarkStyle"
                                  disabled={true}
                                  className={`h-4 w-4 text-${colorTheme}-600`}
                                />
                                <label htmlFor="style2" className={`ml-2 block text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-900'}`}>
                                  Classic <span className="text-xs">(Premium)</span>
                                </label>
                              </div>
                              <div className={`mt-2 h-8 w-full rounded-md bg-black flex items-center justify-center`}>
                                <div className="text-xs text-white">Classic Style</div>
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        <div>
                          <p className={`text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                            Watermark Position
                          </p>
                          <select
                            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-${colorTheme}-500 transition-all duration-200 ${
                              isDarkMode 
                                ? 'bg-gray-700 border-gray-600 text-white' 
                                : 'bg-white border-gray-300 text-gray-900'
                            }`}
                            disabled={true}
                          >
                            <option>Bottom (Default)</option>
                            <option disabled>Top (Premium)</option>
                            <option disabled>Custom (Premium)</option>
                          </select>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex justify-between mt-4">
                      <button 
                        onClick={() => setActiveTab('date')}
                        className={`px-4 py-2 rounded-lg transition-all duration-300 flex items-center ${
                          isDarkMode 
                            ? 'bg-gray-700 hover:bg-gray-600 text-gray-200' 
                            : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                        }`}
                      >
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Back: Date & Time
                      </button>
                      
                      <button 
                        onClick={() => setActiveTab('export')}
                        className={`px-4 py-2 rounded-lg transition-all duration-300 transform hover:translate-y-[-2px] flex items-center ${currentTheme.button} shadow-md hover:shadow-lg`}
                      >
                        Next: Export
                        <ArrowRight className="h-4 w-4 ml-2" />
                      </button>
                    </div>
                  </div>
                )}
                
                {isEditing && activeTab === 'export' && (
                  <div className="space-y-4 slide-up">
                    <div className="flex items-center justify-between">
                      <h3 className={`text-lg font-semibold flex items-center ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                        <Download className={`h-5 w-5 mr-2 ${currentTheme.icon}`} />
                        Export Options
                      </h3>
                    </div>
                    
                    <div className={`p-5 rounded-lg border ${currentTheme.border} ${
                      isDarkMode ? 'bg-gray-700/50' : currentTheme.bgLight
                    }`}>
                      <div className="text-center">
                        <div className={`inline-flex items-center justify-center h-16 w-16 rounded-full mb-4 ${
                          isDarkMode ? `bg-${colorTheme}-900/30` : `bg-${colorTheme}-100`
                        }`}>
                          <Zap className={`h-8 w-8 ${currentTheme.icon}`} />
                        </div>
                        
                        <h4 className={`text-lg font-semibold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                          Ready to Export!
                        </h4>
                        
                        <p className={`mb-4 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                          Your photo is ready to be exported with the location watermark.
                        </p>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className={`p-4 rounded-lg ${
                            isDarkMode ? 'bg-gray-800' : 'bg-white'
                          } border ${currentTheme.border} text-left`}>
                            <p className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                              Export Format
                            </p>
                            <select 
                              className={`mt-1 w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-${colorTheme}-500 transition-all duration-200 ${
                                isDarkMode 
                                  ? 'bg-gray-700 border-gray-600 text-white' 
                                  : 'bg-white border-gray-300 text-gray-900'
                              }`}
                              disabled={true}
                            >
                              <option>JPEG (Default)</option>
                              <option disabled>PNG (Premium)</option>
                              <option disabled>TIFF (Premium)</option>
                            </select>
                          </div>
                          
                          <div className={`p-4 rounded-lg ${
                            isDarkMode ? 'bg-gray-800' : 'bg-white'
                          } border ${currentTheme.border} text-left`}>
                            <p className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                              Quality
                            </p>
                            <select 
                              className={`mt-1 w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-${colorTheme}-500 transition-all duration-200 ${
                                isDarkMode 
                                  ? 'bg-gray-700 border-gray-600 text-white' 
                                  : 'bg-white border-gray-300 text-gray-900'
                              }`}
                              disabled={true}
                            >
                              <option>High (Default)</option>
                              <option disabled>Maximum (Premium)</option>
                            </select>
                          </div>
                        </div>
                        
                        <button
                          onClick={handlePreviewWatermark}
                          className={`w-full mt-4 px-6 py-3 rounded-lg transition-all duration-300 flex items-center justify-center ${
                            isDarkMode 
                              ? 'bg-gray-800 hover:bg-gray-700 text-gray-200' 
                              : 'bg-white hover:bg-gray-100 text-gray-800 border border-gray-200'
                          }`}
                        >
                          <Image className="h-4 w-4 mr-2" />
                          Preview Watermark
                        </button>
                        
                        <button 
                          onClick={handleDownloadImage}
                          disabled={isDownloading || !allFieldsFilled || !canEditMoreImages()}
                          className={`w-full mt-4 px-6 py-3 rounded-lg transition-all duration-300 transform hover:translate-y-[-2px] flex items-center justify-center ${
                            allFieldsFilled && !isDownloading && canEditMoreImages()
                              ? `bg-gradient-to-r ${currentTheme.primary} text-white shadow-lg shadow-${colorTheme}-600/20`
                              : `${isDarkMode ? 'bg-gray-700 text-gray-400' : 'bg-gray-300 text-gray-500'} cursor-not-allowed`
                          }`}
                        >
                          {isDownloading ? (
                            <>
                              <div className="animate-spin h-4 w-4 mr-2 border-2 border-white border-t-transparent rounded-full"></div>
                              Downloading...
                            </>
                          ) : (
                            <>
                              <Download className="h-4 w-4 mr-2" />
                              Download Photo
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                    
                    <div className="flex justify-between mt-4">
                      <button 
                        onClick={() => setActiveTab('watermark')}
                        className={`px-4 py-2 rounded-lg transition-all duration-300 flex items-center ${
                          isDarkMode 
                            ? 'bg-gray-700 hover:bg-gray-600 text-gray-200' 
                            : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                        }`}
                      >
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Back: Watermark
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {/* Tips Section */}
          <div className="lg:col-span-1">
            <div className={`rounded-xl p-8 border shadow-xl transform hover:shadow-2xl transition-all duration-300 ${
              isDarkMode 
                ? 'bg-gray-800/80 backdrop-blur-sm border-gray-700 text-gray-200' 
                : 'bg-white/90 backdrop-blur-sm border-gray-200 text-gray-800'
            }`}>
              <div className="flex items-center mb-8">
                <div className={`bg-gradient-to-r ${currentTheme.primary} p-3 rounded-xl shadow-lg`}>
                  <Info className="h-6 w-6 text-white" />
                </div>
                <h2 className={`ml-4 text-xl font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  Quick Tips
                </h2>
              </div>
              
              <div className="space-y-6">
                <div className="group">
                  <div className="flex items-start space-x-4">
                    <div className={`p-3 rounded-xl group-hover:bg-gradient-to-r ${currentTheme.primary} transition-all duration-300 ${
                      isDarkMode ? 'bg-gray-700' : currentTheme.bgLight
                    }`}>
                      <Search className={`h-5 w-5 ${
                        isDarkMode 
                          ? `text-gray-300 group-hover:text-white` 
                          : `${currentTheme.textLight} group-hover:text-white`
                      }`} />
                    </div>
                    <div className="flex-1">
                      <h3 className={`font-semibold group-hover:${currentTheme.textLight} dark:group-hover:${currentTheme.textDark} transition-colors ${
                        isDarkMode ? 'text-white' : 'text-gray-900'
                      }`}>
                        Search Locations
                      </h3>
                      <p className={`mt-2 text-sm leading-relaxed ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        Use the location search to find any place in India. Results appear as you type.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="group">
                  <div className="flex items-start space-x-4">
                    <div className={`p-3 rounded-xl group-hover:bg-gradient-to-r ${currentTheme.primary} transition-all duration-300 ${
                      isDarkMode ? 'bg-gray-700' : currentTheme.bgLight
                    }`}>
                      <Upload className={`h-5 w-5 ${
                        isDarkMode 
                          ? `text-gray-300 group-hover:text-white` 
                          : `${currentTheme.textLight} group-hover:text-white`
                      }`} />
                    </div>
                    <div className="flex-1">
                      <h3 className={`font-semibold group-hover:${currentTheme.textLight} dark:group-hover:${currentTheme.textDark} transition-colors ${
                        isDarkMode ? 'text-white' : 'text-gray-900'
                      }`}>
                        Upload Photos
                      </h3>
                      <p className={`mt-2 text-sm leading-relaxed ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        Click the upload button in the top right of the image preview to upload your own photo.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="group">
                  <div className="flex items-start space-x-4">
                    <div className={`p-3 rounded-xl group-hover:bg-gradient-to-r ${currentTheme.primary} transition-all duration-300 ${
                      isDarkMode ? 'bg-gray-700' : currentTheme.bgLight
                    }`}>
                      <Download className={`h-5 w-5 ${
                        isDarkMode 
                          ? `text-gray-300 group-hover:text-white` 
                          : `${currentTheme.textLight} group-hover:text-white`
                      }`} />
                    </div>
                    <div className="flex-1">
                      <h3 className={`font-semibold group-hover:${currentTheme.textLight} dark:group-hover:${currentTheme.textDark} transition-colors ${
                        isDarkMode ? 'text-white' : 'text-gray-900'
                      }`}>
                        Download Images
                      </h3>
                      <p className={`mt-2 text-sm leading-relaxed ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        After adding location data, download your geo-tagged photos with beautiful watermarks.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
                  <div className={`rounded-xl p-6 shadow-lg ${
                    isDarkMode 
                      ? 'bg-gradient-to-br from-gray-700 to-gray-800 border border-gray-600' 
                      : 'bg-gradient-to-br from-purple-50 to-indigo-50 border border-purple-100'
                  }`}>
                    <div className="flex items-start space-x-3">
                      <div className={`p-2 rounded-lg ${
                        isDarkMode ? 'bg-gray-600' : 'bg-purple-100'
                      }`}>
                        <Sparkles className={currentTheme.icon} />
                      </div>
                      <div>
                        <h4 className={`font-semibold ${
                          isDarkMode ? 'text-white' : `${currentTheme.textLight}`
                        }`}>Pro Tip</h4>
                        <p className={`mt-1 text-sm leading-relaxed ${
                          isDarkMode ? 'text-gray-300' : 'text-gray-700'
                        }`}>
                          Try different color themes using the color buttons in the top right corner for a personalized experience.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Location Picker Modal */}
      <LocationPicker 
        isOpen={isLocationPickerOpen}
        onClose={() => setIsLocationPickerOpen(false)}
        onSelectLocation={handleSelectLocation}
      />
    </div>
  );
};

export default GeoTagEditor;