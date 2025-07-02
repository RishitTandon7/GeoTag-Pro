import React, { useState } from 'react';
import { Search, Filter, Map as MapIcon, Image, Layers, ZoomIn, ZoomOut } from 'lucide-react';

const MapPage = () => {
  const [selectedView, setSelectedView] = useState('map');
  
  // Mock data for the demo
  const recentPhotos = [
    {
      id: 1,
      imageUrl: 'https://images.pexels.com/photos/2662116/pexels-photo-2662116.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2',
      location: 'Grand Canyon, Arizona',
      coordinates: '36.0544° N, 112.2583° W',
    },
    {
      id: 2,
      imageUrl: 'https://images.pexels.com/photos/2108845/pexels-photo-2108845.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2',
      location: 'Paris, France',
      coordinates: '48.8566° N, 2.3522° E',
    },
    {
      id: 3,
      imageUrl: 'https://images.pexels.com/photos/3225517/pexels-photo-3225517.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2',
      location: 'Tokyo, Japan',
      coordinates: '35.6762° N, 139.6503° E',
    },
  ];

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {/* Map Header */}
          <div className="p-4 border-b border-gray-200 flex flex-col md:flex-row md:items-center md:justify-between">
            <h1 className="text-2xl font-bold text-gray-900 mb-4 md:mb-0">
              <MapIcon className="h-5 w-5 inline-block mr-2 text-blue-600" />
              Explore Photo Map
            </h1>
            
            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search locations or tags..."
                  className="w-full sm:w-64 pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
                <Search className="h-5 w-5 text-gray-400 absolute left-3 top-2.5" />
              </div>
              
              <button className="flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50">
                <Filter className="h-4 w-4 mr-2" />
                Filters
              </button>
              
              <div className="bg-gray-200 rounded-md flex">
                <button 
                  className={`px-4 py-2 rounded-md ${selectedView === 'map' ? 'bg-blue-600 text-white' : ''}`}
                  onClick={() => setSelectedView('map')}
                >
                  <MapIcon className="h-4 w-4 inline-block mr-1" />
                  Map
                </button>
                <button 
                  className={`px-4 py-2 rounded-md ${selectedView === 'gallery' ? 'bg-blue-600 text-white' : ''}`}
                  onClick={() => setSelectedView('gallery')}
                >
                  <Image className="h-4 w-4 inline-block mr-1" />
                  Gallery
                </button>
              </div>
            </div>
          </div>
          
          {/* Map Container */}
          <div className="flex h-[calc(100vh-16rem)]">
            {/* Main View */}
            <div className="flex-grow relative">
              {selectedView === 'map' ? (
                <div className="w-full h-full bg-gray-200 relative">
                  {/* Mockup of a map - would be replaced with an actual map component */}
                  <div 
                    className="w-full h-full relative"
                    style={{
                      backgroundImage: "url('https://images.pexels.com/photos/2101187/pexels-photo-2101187.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2')",
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                      opacity: 0.7
                    }}
                  ></div>
                  
                  {/* Map Controls */}
                  <div className="absolute top-4 right-4 bg-white rounded-md shadow p-2 space-y-2">
                    <button className="p-2 hover:bg-gray-100 rounded">
                      <ZoomIn className="h-5 w-5 text-gray-700" />
                    </button>
                    <button className="p-2 hover:bg-gray-100 rounded">
                      <ZoomOut className="h-5 w-5 text-gray-700" />
                    </button>
                    <button className="p-2 hover:bg-gray-100 rounded">
                      <Layers className="h-5 w-5 text-gray-700" />
                    </button>
                  </div>
                  
                  {/* Simulated photo markers */}
                  <div className="absolute top-1/4 left-1/3 cursor-pointer">
                    <div className="h-6 w-6 bg-blue-600 rounded-full flex items-center justify-center p-1 ring-4 ring-blue-300">
                      <Image className="h-3 w-3 text-white" />
                    </div>
                  </div>
                  <div className="absolute top-1/2 right-1/3 cursor-pointer">
                    <div className="h-6 w-6 bg-blue-600 rounded-full flex items-center justify-center p-1 ring-4 ring-blue-300">
                      <Image className="h-3 w-3 text-white" />
                    </div>
                  </div>
                  <div className="absolute bottom-1/3 left-1/2 cursor-pointer">
                    <div className="h-10 w-10 bg-blue-600 rounded-full flex items-center justify-center ring-4 ring-blue-300">
                      <span className="text-white font-bold">5</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="w-full h-full overflow-auto p-6 bg-gray-50">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {Array.from({ length: 12 }).map((_, index) => (
                      <div key={index} className="bg-white rounded-lg shadow overflow-hidden">
                        <div className="h-48 relative">
                          <img 
                            src={`https://images.pexels.com/photos/${2000000 + index}/pexels-photo-${2000000 + index}.jpeg?auto=compress&cs=tinysrgb&w=500`} 
                            alt="Gallery photo"
                            onError={(e) => {
                              // If image fails to load, use a fallback
                              e.currentTarget.src = "https://images.pexels.com/photos/1266810/pexels-photo-1266810.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2";
                            }}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute bottom-2 right-2 bg-white rounded px-2 py-1 text-xs font-medium shadow-sm flex items-center">
                            <MapIcon className="h-3 w-3 mr-1 text-blue-600" />
                            <span>Random Location</span>
                          </div>
                        </div>
                        <div className="p-4">
                          <h3 className="font-medium text-gray-900">Photo Title #{index + 1}</h3>
                          <p className="text-sm text-gray-500">Taken on {new Date().toLocaleDateString()}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            
            {/* Sidebar */}
            <div className="w-80 border-l border-gray-200 bg-white overflow-auto hidden lg:block">
              <div className="p-4 border-b border-gray-200">
                <h2 className="font-semibold text-gray-900">Recent Photos</h2>
              </div>
              <div className="divide-y divide-gray-200">
                {recentPhotos.map((photo) => (
                  <div key={photo.id} className="p-4 hover:bg-gray-50 cursor-pointer">
                    <div className="flex space-x-4">
                      <div className="h-16 w-16 flex-shrink-0 rounded overflow-hidden">
                        <img src={photo.imageUrl} alt={photo.location} className="h-full w-full object-cover" />
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900">{photo.location}</h3>
                        <p className="text-sm text-gray-500 flex items-center">
                          <MapIcon className="h-3 w-3 mr-1 text-blue-600" />
                          {photo.coordinates}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">Taken on {new Date().toLocaleDateString()}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="p-4 border-t border-b border-gray-200">
                <h2 className="font-semibold text-gray-900">Popular Locations</h2>
              </div>
              <div className="p-4 space-y-2">
                <button className="flex items-center px-3 py-2 bg-gray-100 rounded-md w-full hover:bg-gray-200 text-left">
                  <MapIcon className="h-4 w-4 mr-2 text-blue-600" />
                  <span>Grand Canyon, USA</span>
                </button>
                <button className="flex items-center px-3 py-2 bg-gray-100 rounded-md w-full hover:bg-gray-200 text-left">
                  <MapIcon className="h-4 w-4 mr-2 text-blue-600" />
                  <span>Tokyo, Japan</span>
                </button>
                <button className="flex items-center px-3 py-2 bg-gray-100 rounded-md w-full hover:bg-gray-200 text-left">
                  <MapIcon className="h-4 w-4 mr-2 text-blue-600" />
                  <span>Paris, France</span>
                </button>
                <button className="flex items-center px-3 py-2 bg-gray-100 rounded-md w-full hover:bg-gray-200 text-left">
                  <MapIcon className="h-4 w-4 mr-2 text-blue-600" />
                  <span>Santorini, Greece</span>
                </button>
                <button className="flex items-center px-3 py-2 bg-gray-100 rounded-md w-full hover:bg-gray-200 text-left">
                  <MapIcon className="h-4 w-4 mr-2 text-blue-600" />
                  <span>Bali, Indonesia</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MapPage;