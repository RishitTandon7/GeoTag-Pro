import React, { useEffect, useRef } from 'react';
import { MapPin } from 'lucide-react';
import L from 'leaflet';

interface MapThumbnailProps {
  latitude: number;
  longitude: number;
  width?: number;
  height?: number;
  className?: string;
}

const MapThumbnail: React.FC<MapThumbnailProps> = ({
  latitude,
  longitude,
  width = 80,
  height = 80,
  className = ''
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (!mapRef.current || !latitude || !longitude) return;
    
    // Clean up any previous map instance
    const mapContainer = mapRef.current;
    mapContainer.innerHTML = '';
    
    // Initialize Leaflet map
    const map = L.map(mapContainer, {
      center: [latitude, longitude],
      zoom: 13,
      attributionControl: false,
      zoomControl: false,
      dragging: false,
      scrollWheelZoom: false,
      doubleClickZoom: false,
      boxZoom: false,
      tap: false,
      keyboard: false,
      touchZoom: false
    });
    
    // Add OSM tile layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
    }).addTo(map);
    
    // Create a custom icon for the marker
    const customIcon = L.divIcon({
      html: `<div class="h-5 w-5 bg-purple-600 rounded-full flex items-center justify-center text-white p-1 shadow-lg shadow-purple-700/30 animate-pulse">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" class="w-3 h-3">
                <circle cx="12" cy="10" r="3" fill="white" stroke="none"/>
                <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" stroke="white" fill="none"/>
              </svg>
            </div>`,
      className: '',
      iconSize: [20, 20],
      iconAnchor: [10, 10]
    });
    
    // Add a marker
    L.marker([latitude, longitude], { icon: customIcon }).addTo(map);
    
    return () => {
      // Clean up function when component unmounts
      map.remove();
    };
  }, [latitude, longitude]);
  
  return (
    <div className={`relative overflow-hidden rounded-lg shadow-lg ${className}`} style={{ width, height }}>
      {(latitude && longitude) ? (
        <>
          <div
            ref={mapRef}
            className="w-full h-full"
            style={{ 
              backgroundColor: '#f1f5f9'
            }}
          />
          <div className="absolute top-1 left-1 text-xs text-white bg-purple-600 rounded px-1 z-10 shadow-sm shadow-purple-700/20">
            Maps
          </div>
          <div className="absolute bottom-1 right-1 text-xs z-10">
            <MapPin className="h-4 w-4 text-red-500 drop-shadow-sm" />
          </div>
        </>
      ) : (
        <div className="w-full h-full bg-gray-200 flex items-center justify-center">
          <MapPin className="h-6 w-6 text-gray-400" />
        </div>
      )}
    </div>
  );
};

export default MapThumbnail;