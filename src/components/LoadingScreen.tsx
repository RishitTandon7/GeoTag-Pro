import React, { useState, useEffect } from 'react';
import { MapPin, Camera, Upload, Download } from 'lucide-react';

interface LoadingScreenProps {
  message?: string;
  isLoading: boolean;
}

const LoadingScreen: React.FC<LoadingScreenProps> = ({ 
  message = "Loading...",
  isLoading
}) => {
  const [progress, setProgress] = useState(0);
  const [currentTip, setCurrentTip] = useState(0);
  
  const tips = [
    "Try uploading high-quality photos for better results",
    "You can search for any location in India",
    "Premium users get advanced watermark options",
    "Use the map view to find exact coordinates",
    "Download your geotagged photos to share on social media"
  ];
  
  useEffect(() => {
    if (!isLoading) return;
    
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        const newProgress = prev + Math.random() * 8;
        return newProgress >= 100 ? 100 : newProgress;
      });
    }, 200);
    
    const tipInterval = setInterval(() => {
      setCurrentTip(prev => (prev + 1) % tips.length);
    }, 4000);
    
    return () => {
      clearInterval(progressInterval);
      clearInterval(tipInterval);
    };
  }, [isLoading, tips.length]);
  
  if (!isLoading) return null;
  
  return (
    <div className="fixed inset-0 z-50 bg-gradient-to-br from-purple-900 to-indigo-900 flex flex-col items-center justify-center p-4 fade-in">
      <div className="max-w-md w-full">
        <div className="flex justify-center mb-8">
          <div className="relative">
            <div className="absolute inset-0 rounded-full bg-purple-600/20 animate-ping"></div>
            <div className="relative rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 p-4 shadow-xl shadow-purple-700/30">
              <Camera className="h-12 w-12 text-white" />
            </div>
          </div>
        </div>
        
        <h2 className="text-2xl font-bold text-white text-center mb-2">
          {message}
        </h2>
        
        <p className="text-purple-200 text-center mb-8 max-w-xs mx-auto">
          {tips[currentTip]}
        </p>
        
        <div className="mb-8">
          <div className="h-2 w-full bg-purple-900/50 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-purple-400 to-pink-500 transition-all duration-200 rounded-full"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          <div className="flex justify-between mt-2">
            <span className="text-xs text-purple-300">Loading resources</span>
            <span className="text-xs text-purple-300">{Math.round(progress)}%</span>
          </div>
        </div>
        
        <div className="flex justify-center space-x-8">
          <div className="flex flex-col items-center text-purple-300">
            <div className="w-10 h-10 rounded-full bg-purple-800/50 flex items-center justify-center mb-2">
              <MapPin className="h-5 w-5" />
            </div>
            <span className="text-xs">Locations</span>
          </div>
          <div className="flex flex-col items-center text-purple-300">
            <div className="w-10 h-10 rounded-full bg-purple-800/50 flex items-center justify-center mb-2">
              <Upload className="h-5 w-5" />
            </div>
            <span className="text-xs">Upload</span>
          </div>
          <div className="flex flex-col items-center text-purple-300">
            <div className="w-10 h-10 rounded-full bg-purple-800/50 flex items-center justify-center mb-2">
              <Download className="h-5 w-5" />
            </div>
            <span className="text-xs">Download</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoadingScreen;