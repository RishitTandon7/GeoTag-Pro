import React, { useState } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import { MapPin, ArrowLeft } from 'lucide-react';
import { reverseGeocode } from '../utils/geocoding';

interface MapViewProps {
  onSelectLocation: (location: any) => void;
  onBack: () => void;
}

const INDIA_CENTER: [number, number] = [20.5937, 78.9629];

const MapView: React.FC<MapViewProps> = ({ onSelectLocation, onBack }) => {
  const [selectedPosition, setSelectedPosition] = useState<[number, number] | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const MapEvents = () => {
    useMapEvents({
      click: async (e) => {
        const { lat, lng } = e.latlng;
        setSelectedPosition([lat, lng]);
        
        setIsLoading(true);
        try {
          const data = await reverseGeocode(lat, lng);
          if (data) {
            onSelectLocation({
              id: crypto.randomUUID(),
              name: data.name || data.display_name.split(',')[0],
              location: data.display_name,
              lat: lat,
              lng: lng
            });
          }
        } catch (error) {
          console.error('Error getting location details:', error);
        } finally {
          setIsLoading(false);
        }
      }
    });
    return null;
  };

  return (
    <div className="space-y-4">
      <button
        onClick={onBack}
        className="flex items-center text-purple-600 hover:text-purple-700"
      >
        <ArrowLeft className="h-4 w-4 mr-1" />
        Back to search
      </button>

      <div className="h-64 relative rounded-lg overflow-hidden border border-gray-200">
        <MapContainer
          center={INDIA_CENTER}
          zoom={5}
          style={{ height: '100%', width: '100%' }}
        >
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          <MapEvents />
          {selectedPosition && (
            <Marker position={selectedPosition}>
            </Marker>
          )}
        </MapContainer>

        {isLoading && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-purple-600 border-t-transparent"></div>
          </div>
        )}
      </div>

      <p className="text-sm text-gray-600 text-center">
        Click anywhere on the map to select a location
      </p>
    </div>
  );
};

export default MapView;