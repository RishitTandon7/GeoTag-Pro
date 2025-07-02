import React, { useState } from 'react';
import { Grid, Columns, Filter, Search, MapPin, Tag, Info, Download, Share2, Edit, Image, MoreVertical } from 'lucide-react';

const GalleryPage = () => {
  const [viewMode, setViewMode] = useState('grid');
  const [selectedImage, setSelectedImage] = useState<number | null>(null);
  
  // Mock data for the gallery photos
  const galleryPhotos = Array.from({ length: 12 }).map((_, index) => ({
    id: index + 1,
    imageUrl: `https://images.pexels.com/photos/${1000000 + index * 10}/pexels-photo-${1000000 + index * 10}.jpeg?auto=compress&cs=tinysrgb&w=600`,
    title: `Photo ${index + 1}`,
    location: ['Paris, France', 'Tokyo, Japan', 'New York, USA', 'Bali, Indonesia', 'Cape Town, South Africa'][index % 5],
    date: new Date(2023, index % 12, (index % 28) + 1).toLocaleDateString(),
    tags: ['travel', 'landscape', 'urban', 'nature', 'architecture'].slice(0, (index % 3) + 1),
    coordinates: ['48.8566° N, 2.3522° E', '35.6762° N, 139.6503° E', '40.7128° N, 74.0060° W', '8.3405° S, 115.0920° E', '33.9249° S, 18.4241° E'][index % 5]
  }));

  const handleImageClick = (id: number) => {
    setSelectedImage(id);
  };

  const closeImageDetail = () => {
    setSelectedImage(null);
  };

  // Find the selected image details
  const selectedImageDetails = selectedImage !== null 
    ? galleryPhotos.find(photo => photo.id === selectedImage) 
    : null;

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {/* Gallery Header */}
          <div className="p-4 border-b border-gray-200 flex flex-col md:flex-row md:items-center md:justify-between">
            <h1 className="text-2xl font-bold text-gray-900 mb-4 md:mb-0">
              <Image className="h-5 w-5 inline-block mr-2 text-blue-600" />
              Photo Gallery
            </h1>
            
            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search photos or locations..."
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
                  className={`px-4 py-2 rounded-md ${viewMode === 'grid' ? 'bg-blue-600 text-white' : ''}`}
                  onClick={() => setViewMode('grid')}
                >
                  <Grid className="h-4 w-4 inline-block" />
                </button>
                <button 
                  className={`px-4 py-2 rounded-md ${viewMode === 'columns' ? 'bg-blue-600 text-white' : ''}`}
                  onClick={() => setViewMode('columns')}
                >
                  <Columns className="h-4 w-4 inline-block" />
                </button>
              </div>
            </div>
          </div>
          
          {/* Gallery Content */}
          <div className="p-4 sm:p-6">
            {viewMode === 'grid' ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {galleryPhotos.map((photo) => (
                  <div 
                    key={photo.id} 
                    className="group relative overflow-hidden rounded-lg shadow-sm hover:shadow-md transition cursor-pointer"
                    onClick={() => handleImageClick(photo.id)}
                  >
                    <div className="relative aspect-square overflow-hidden">
                      <img 
                        src={photo.imageUrl} 
                        alt={photo.title}
                        onError={(e) => {
                          // If image fails to load, use a fallback
                          e.currentTarget.src = "https://images.pexels.com/photos/1266810/pexels-photo-1266810.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2";
                        }}
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                      />
                      
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-3">
                        <div className="flex justify-between items-end">
                          <div>
                            <h3 className="text-white font-medium truncate">{photo.title}</h3>
                            <p className="text-white/80 text-sm flex items-center">
                              <MapPin className="h-3 w-3 mr-1" />
                              {photo.location}
                            </p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button className="p-1 bg-black/30 rounded-full text-white hover:bg-black/50">
                          <MoreVertical className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-8">
                {galleryPhotos.map((photo) => (
                  <div key={photo.id} className="flex flex-col md:flex-row gap-4 border-b border-gray-200 pb-6">
                    <div 
                      className="md:w-1/3 aspect-video relative rounded-lg overflow-hidden shadow-sm cursor-pointer"
                      onClick={() => handleImageClick(photo.id)}
                    >
                      <img 
                        src={photo.imageUrl} 
                        alt={photo.title}
                        onError={(e) => {
                          // If image fails to load, use a fallback
                          e.currentTarget.src = "https://images.pexels.com/photos/1266810/pexels-photo-1266810.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2";
                        }}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute bottom-2 right-2 bg-white rounded px-2 py-1 text-xs font-medium shadow-sm flex items-center">
                        <MapPin className="h-3 w-3 mr-1 text-blue-600" />
                        <span>{photo.location}</span>
                      </div>
                    </div>
                    <div className="md:w-2/3 space-y-2">
                      <div className="flex justify-between">
                        <h3 className="text-lg font-semibold text-gray-900">{photo.title}</h3>
                        <div className="flex space-x-2">
                          <button className="p-1 rounded-full text-gray-500 hover:text-blue-600 hover:bg-blue-50">
                            <Edit className="h-5 w-5" />
                          </button>
                          <button className="p-1 rounded-full text-gray-500 hover:text-blue-600 hover:bg-blue-50">
                            <Share2 className="h-5 w-5" />
                          </button>
                          <button className="p-1 rounded-full text-gray-500 hover:text-blue-600 hover:bg-blue-50">
                            <Download className="h-5 w-5" />
                          </button>
                        </div>
                      </div>
                      <p className="text-gray-500">
                        <span className="flex items-center text-sm mb-1">
                          <MapPin className="h-4 w-4 mr-1 text-blue-600" />
                          {photo.location} • {photo.coordinates}
                        </span>
                        Taken on {photo.date}
                      </p>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {photo.tags.map((tag, index) => (
                          <span key={index} className="px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded-md flex items-center">
                            <Tag className="h-3 w-3 mr-1" />
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Image Detail Modal */}
      {selectedImage !== null && selectedImageDetails && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg overflow-hidden max-w-4xl w-full max-h-[90vh] flex flex-col">
            <div className="flex justify-between items-center p-4 border-b border-gray-200">
              <h3 className="text-xl font-semibold text-gray-900">{selectedImageDetails.title}</h3>
              <button 
                onClick={closeImageDetail}
                className="p-1 rounded-full text-gray-500 hover:text-gray-700 hover:bg-gray-100"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <div className="flex-grow overflow-auto flex flex-col md:flex-row">
              <div className="md:w-2/3 relative">
                <img 
                  src={selectedImageDetails.imageUrl} 
                  alt={selectedImageDetails.title}
                  onError={(e) => {
                    // If image fails to load, use a fallback
                    e.currentTarget.src = "https://images.pexels.com/photos/1266810/pexels-photo-1266810.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2";
                  }}
                  className="w-full h-full object-contain"
                />
                <div className="absolute bottom-2 right-2 bg-white/70 py-1 px-3 rounded flex items-center shadow-sm">
                  <MapPin className="h-4 w-4 text-blue-600 mr-1" />
                  <span className="text-sm font-medium text-gray-900">GeoTag Pro • {selectedImageDetails.coordinates}</span>
                </div>
              </div>
              
              <div className="md:w-1/3 p-4 border-t md:border-t-0 md:border-l border-gray-200">
                <div className="space-y-6">
                  <div>
                    <h4 className="text-sm font-medium text-gray-500 uppercase">Location</h4>
                    <p className="mt-1 flex items-start">
                      <MapPin className="h-5 w-5 text-blue-600 mr-2 mt-0.5" />
                      <span>
                        <span className="font-medium">{selectedImageDetails.location}</span><br />
                        <span className="text-sm text-gray-500">{selectedImageDetails.coordinates}</span>
                      </span>
                    </p>
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-medium text-gray-500 uppercase">Date Taken</h4>
                    <p className="mt-1 text-gray-900">{selectedImageDetails.date}</p>
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-medium text-gray-500 uppercase">Tags</h4>
                    <div className="mt-1 flex flex-wrap gap-2">
                      {selectedImageDetails.tags.map((tag, index) => (
                        <span key={index} className="px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded-md flex items-center">
                          <Tag className="h-3 w-3 mr-1" />
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                  
                  <div className="pt-4 border-t border-gray-200">
                    <h4 className="text-sm font-medium text-gray-500 uppercase mb-2">Actions</h4>
                    <div className="flex flex-col space-y-2">
                      <button className="w-full flex items-center justify-center px-4 py-2 border border-blue-600 text-blue-600 rounded-md hover:bg-blue-50">
                        <Edit className="h-4 w-4 mr-2" />
                        Edit Metadata
                      </button>
                      <button className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50">
                        <Share2 className="h-4 w-4 mr-2" />
                        Share Photo
                      </button>
                      <button className="w-full flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
                        <Download className="h-4 w-4 mr-2" />
                        Download
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GalleryPage;