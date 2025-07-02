import React, { useState, useEffect } from 'react';
import { MapPin, X, ArrowLeft } from 'lucide-react';
import LocationSearch from './LocationSearch';
import MapView from './MapView';

interface Location {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
}

interface LocationPickerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectLocation: (location: Location) => void;
}

const LocationPicker: React.FC<LocationPickerProps> = ({
  isOpen,
  onClose,
  onSelectLocation
}) => {
  const [showMap, setShowMap] = useState(false);
  const [showInstructionsModal, setShowInstructionsModal] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setShowInstructionsModal(true);
      // Auto-hide instructions after 5 seconds
      const timer = setTimeout(() => {
        setShowInstructionsModal(false);
      }, 5000);
      
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  const handleLocationSelect = (location: any) => {
    const formattedLocation: Location = {
      id: location.id,
      name: location.name,
      address: location.location,
      latitude: location.lat,
      longitude: location.lng
    };
    onSelectLocation(formattedLocation);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-start justify-center pt-8 sm:pt-16 z-50 overflow-y-auto p-4 fade-in">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md relative border border-gray-200 dark:border-gray-700 transform hover:scale-[1.01] transition-all duration-300">
        <div className="p-5 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
            <MapPin className="h-5 w-5 mr-2 text-purple-600" />
            {showMap ? 'Select on Map' : 'Search Location'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-200"
          >
            <X className="h-5 w-5 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        <div className="p-5">
          {showMap ? (
            <>
              <button
                onClick={() => setShowMap(false)}
                className="flex items-center text-purple-600 dark:text-purple-400 mb-4 hover:text-purple-700 dark:hover:text-purple-300 transition-colors"
              >
                <ArrowLeft className="h-4 w-4 mr-1" />
                Back to search
              </button>
              <MapView onSelectLocation={handleLocationSelect} onBack={() => setShowMap(false)} />
            </>
          ) : (
            <>
              <LocationSearch onSelectLocation={handleLocationSelect} />
              <div className="mt-4 text-center">
                <button
                  onClick={() => setShowMap(true)}
                  className="px-4 py-2 bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-lg shadow-md hover:shadow-lg transition-all duration-300 transform hover:-translate-y-0.5"
                >
                  Or select location on map
                </button>
              </div>
            </>
          )}
        </div>
        
        {showInstructionsModal && (
          <div className="absolute bottom-4 left-4 right-4 p-4 bg-purple-600/90 dark:bg-purple-700/90 backdrop-blur-sm text-white rounded-xl shadow-lg slide-up">
            <button 
              onClick={() => setShowInstructionsModal(false)}
              className="absolute top-2 right-2 p-1 rounded-full hover:bg-white/20"
            >
              <X className="h-4 w-4" />
            </button>
            <h3 className="text-base font-semibold mb-1">Find Your Perfect Location</h3>
            <p className="text-sm text-purple-100">
              Search by name, address, or landmark. You can also select directly from the map for precise coordinates.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default LocationPicker;