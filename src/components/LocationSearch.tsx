import React, { useState, useRef, useEffect } from 'react';
import { Search, MapPin, X, AlertCircle, Navigation, Loader } from 'lucide-react';
import * as tt from '@tomtom-international/web-sdk-services';
import toast from 'react-hot-toast';

interface Location {
  id: string;
  name: string;
  location: string;
  lat: number;
  lng: number;
}

interface LocationSearchProps {
  onSelectLocation: (location: Location) => void;
  placeholder?: string;
}

const LocationSearch: React.FC<LocationSearchProps> = ({ onSelectLocation, placeholder = "Search for any location in India..." }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState<Location[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [locationError, setLocationError] = useState('');
  const [showCustomForm, setShowCustomForm] = useState(false);
  const [shareableUrl, setShareableUrl] = useState<string | null>(null);
  const [customAddress, setCustomAddress] = useState({
    name: '',
    street: '',
    city: '',
    state: '',
    pincode: '',
    lat: '',
    lng: ''
  });
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchTimeout = useRef<number>();
  const API_KEY = import.meta.env.VITE_TOMTOM_API_KEY;

  useEffect(() => {
    if (searchTimeout.current) {
      clearTimeout(searchTimeout.current);
    }
    
    if (searchTerm.trim().length >= 2 && !showCustomForm) {
      searchTimeout.current = window.setTimeout(() => {
        handleSearch();
      }, 300);
    }
    
    return () => {
      if (searchTimeout.current) {
        clearTimeout(searchTimeout.current);
      }
    };
  }, [searchTerm]);

  const handleSearch = async () => {
    setIsSearching(true);
    setResults([]);
    
    try {
      const searchResults = await tt.services.fuzzySearch({
        key: API_KEY,
        query: searchTerm,
        countrySet: ['IN'],
        limit: 10,
        idxSet: 'POI,PAD,Addr',
        center: {
          lat: 20.5937,
          lon: 78.9629
        },
        radius: 2000000 // 2000km to cover most of India
      });
      
      const formattedResults = searchResults.results.map(result => ({
        id: result.id,
        name: result.poi?.name || result.address.freeformAddress,
        location: result.address.freeformAddress,
        lat: result.position.lat,
        lng: result.position.lng || result.position.lon
      }));
      
      setResults(formattedResults);
    } catch (error) {
      console.error('Search error:', error);
      toast.error('Error searching locations');
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectLocation = (location: Location) => {
    onSelectLocation(location);
    setSearchTerm('');
    setResults([]);
  };

  const getCurrentLocation = () => {
    setIsGettingLocation(true);
    setLocationError('');

    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by your browser');
      setIsGettingLocation(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;

        // Check if coordinates are within India's boundaries
        if (latitude < 6 || latitude > 37 || longitude < 68 || longitude > 97) {
          setLocationError('Current location appears to be outside India');
          setIsGettingLocation(false);
          return;
        }

        try {
          // Use TomTom's reverseGeocode service with proper position format
          const response = await tt.services.reverseGeocode({
            key: API_KEY,
            position: {
              lat: latitude,
              lon: longitude
            }
          });
          
          if (response.addresses && response.addresses.length > 0) {
            const address = response.addresses[0];
            
            if (address.address.countryCode !== 'IN') {
              setLocationError('Current location appears to be outside India');
              setIsGettingLocation(false);
              return;
            }

            // Build a more friendly location name
            const addressParts = [];
            if (address.address.streetName) {
              addressParts.push(address.address.streetName);
            }
            if (address.address.municipality) {
              addressParts.push(address.address.municipality);
            }
            if (address.address.countrySubdivision) {
              addressParts.push(address.address.countrySubdivision);
            }

            const location: Location = {
              id: crypto.randomUUID(),
              name: addressParts.join(', ') || address.address.freeformAddress,
              location: address.address.freeformAddress || addressParts.join(', '),
              lat: latitude,
              lng: longitude
            };

            handleSelectLocation(location);
          } else {
            setLocationError('Could not find a valid Indian address for your location');
          }
        } catch (error) {
          console.error('Error getting location details:', error);
          setLocationError('Error getting location details. Please try again.');
        }
        setIsGettingLocation(false);
      },
      (error) => {
        setIsGettingLocation(false);
        switch (error.code) {
          case error.PERMISSION_DENIED:
            setLocationError('Please allow location access to use this feature');
            break;
          case error.POSITION_UNAVAILABLE:
            setLocationError('Location information is unavailable');
            break;
          case error.TIMEOUT:
            setLocationError('Location request timed out');
            break;
          default:
            setLocationError('An error occurred getting your location');
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  };

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate coordinates
    const lat = parseFloat(customAddress.lat);
    const lng = parseFloat(customAddress.lng);
    
    if (isNaN(lat) || isNaN(lng) || lat < 6 || lat > 37 || lng < 68 || lng > 97) {
      alert('Please enter valid coordinates within India (Lat: 6-37°N, Long: 68-97°E)');
      return;
    }

    // Format the custom location
    const location: Location = {
      id: crypto.randomUUID(),
      name: customAddress.name,
      location: `${customAddress.street}, ${customAddress.city}, ${customAddress.state}, ${customAddress.pincode}, India`,
      lat: lat,
      lng: lng
    };

    handleSelectLocation(location);
    setShowCustomForm(false);
    setCustomAddress({
      name: '',
      street: '',
      city: '',
      state: '',
      pincode: '',
      lat: '',
      lng: ''
    });
  };

  return (
    <div className="w-full">
      {!showCustomForm ? (
        <>
          <div className="space-y-2">
            <div className="relative">
              <input
                ref={searchInputRef}
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={placeholder}
                className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              />
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>

            <button
              onClick={getCurrentLocation}
              disabled={isGettingLocation}
              className="w-full flex items-center justify-center px-4 py-2 border border-purple-600 text-purple-600 rounded-md hover:bg-purple-50 transition-colors"
            >
              {isGettingLocation ? (
                <>
                  <Loader className="animate-spin h-5 w-5 mr-2" />
                  Getting your location...
                </>
              ) : (
                <>
                  <Navigation className="h-5 w-5 mr-2" />
                  Use My Current Location
                </>
              )}
            </button>

            {locationError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm text-red-600">{locationError}</p>
              </div>
            )}
          </div>

          {results.length > 0 ? (
            <div className="absolute z-10 mt-1 w-full bg-white rounded-md shadow-lg border border-gray-200 max-h-60 overflow-y-auto">
              {results.map((result) => (
                <div
                  key={result.id}
                  onClick={() => handleSelectLocation(result)}
                  className="p-3 hover:bg-purple-50 cursor-pointer flex items-start"
                >
                  <MapPin className="h-5 w-5 text-purple-600 mr-3 mt-0.5 flex-shrink-0" />
                  <div>
                    <div className="font-medium text-gray-900">{result.name}</div>
                    <div className="text-sm text-gray-500">{result.location}</div>
                  </div>
                </div>
              ))}
            </div>
          ) : searchTerm.length >= 2 && !isSearching ? (
            <div className="mt-4 p-4 bg-purple-50 rounded-md">
              <div className="flex items-start">
                <AlertCircle className="h-5 w-5 text-purple-600 mr-2 mt-0.5" />
                <div>
                  <p className="text-purple-700 font-medium">Location not found</p>
                  <p className="text-sm text-purple-600 mt-1">
                    Can't find "{searchTerm}"? You can{' '}
                    <button
                      onClick={() => setShowCustomForm(true)}
                      className="text-purple-700 font-medium underline hover:text-purple-800"
                    >
                      add a custom location
                    </button>
                  </p>
                </div>
              </div>
            </div>
          ) : null}
        </>
      ) : (
        <div className="bg-white rounded-md">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium text-gray-900">Add Custom Location</h3>
            <button
              onClick={() => setShowCustomForm(false)}
              className="text-gray-400 hover:text-gray-500"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          
          <form onSubmit={handleCustomSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Location Name</label>
              <input
                type="text"
                required
                value={customAddress.name}
                onChange={(e) => setCustomAddress({ ...customAddress, name: e.target.value })}
                className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-purple-500 focus:border-purple-500"
                placeholder="e.g. My Home, Office, etc."
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">Street Address</label>
              <input
                type="text"
                required
                value={customAddress.street}
                onChange={(e) => setCustomAddress({ ...customAddress, street: e.target.value })}
                className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-purple-500 focus:border-purple-500"
                placeholder="Street address"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">City</label>
                <input
                  type="text"
                  required
                  value={customAddress.city}
                  onChange={(e) => setCustomAddress({ ...customAddress, city: e.target.value })}
                  className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-purple-500 focus:border-purple-500"
                  placeholder="City"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">State</label>
                <input
                  type="text"
                  required
                  value={customAddress.state}
                  onChange={(e) => setCustomAddress({ ...customAddress, state: e.target.value })}
                  className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-purple-500 focus:border-purple-500"
                  placeholder="State"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">PIN Code</label>
              <input
                type="text"
                required
                pattern="[0-9]{6}"
                value={customAddress.pincode}
                onChange={(e) => setCustomAddress({ ...customAddress, pincode: e.target.value })}
                className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-purple-500 focus:border-purple-500"
                placeholder="6-digit PIN code"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Latitude</label>
                <input
                  type="number"
                  required
                  step="0.000001"
                  min="6"
                  max="37"
                  value={customAddress.lat}
                  onChange={(e) => setCustomAddress({ ...customAddress, lat: e.target.value })}
                  className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-purple-500 focus:border-purple-500"
                  placeholder="e.g., 28.6139"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Longitude</label>
                <input
                  type="number"
                  required
                  step="0.000001"
                  min="68"
                  max="97"
                  value={customAddress.lng}
                  onChange={(e) => setCustomAddress({ ...customAddress, lng: e.target.value })}
                  className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-purple-500 focus:border-purple-500"
                  placeholder="e.g., 77.2090"
                />
              </div>
            </div>
            
            <div className="pt-4">
              <button
                type="submit"
                className="w-full bg-purple-600 text-white py-2 px-4 rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
              >
                Add Custom Location
              </button>
            </div>
          </form>
        </div>
      )}

      {shareableUrl && (
        <div className="mt-2 p-2 bg-purple-50 rounded-md">
          <p className="text-sm text-purple-700">
            Shareable URL: <a href={shareableUrl} className="underline" target="_blank" rel="noopener noreferrer">{shareableUrl}</a>
          </p>
        </div>
      )}
    </div>
  );
};

export default LocationSearch;