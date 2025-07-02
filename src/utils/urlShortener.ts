// URL shortening patterns
const URL_PATTERNS = {
  // Short format: lat_long (e.g., "28.6139_77.2090")
  COORDINATES: /^(-?\d+\.\d+)_(-?\d+\.\d+)$/,
  
  // Short format: @cityname (e.g., "@delhi")
  CITY: /^@([a-zA-Z]+)$/,
  
  // Short format: #locationId (e.g., "#del" for Delhi)
  LOCATION_ID: /^#([a-zA-Z0-9]+)$/
};

export const shortenLocation = (location: { name: string; latitude: number; longitude: number; id?: string }) => {
  // If location has an ID, use that
  if (location.id) {
    return `#${location.id}`;
  }
  
  // If it's a major city, use the city name
  const cityName = location.name.split(',')[0].toLowerCase().replace(/\s+/g, '');
  if (cityName.length > 3) {
    return `@${cityName}`;
  }
  
  // Default to coordinates
  return `${location.latitude}_${location.longitude}`;
};

export const expandShortUrl = (shortUrl: string) => {
  // Remove any potential URL encoding
  const decodedUrl = decodeURIComponent(shortUrl);
  
  // Check for coordinate pattern
  const coordMatch = decodedUrl.match(URL_PATTERNS.COORDINATES);
  if (coordMatch) {
    return {
      type: 'coordinates',
      latitude: parseFloat(coordMatch[1]),
      longitude: parseFloat(coordMatch[2])
    };
  }
  
  // Check for city pattern
  const cityMatch = decodedUrl.match(URL_PATTERNS.CITY);
  if (cityMatch) {
    const cityName = cityMatch[1].toLowerCase();
    // Find city in INDIAN_LOCATIONS
    const location = INDIAN_LOCATIONS.find(loc => 
      loc.name.toLowerCase().replace(/\s+/g, '') === cityName
    );
    if (location) {
      return {
        type: 'city',
        name: location.name,
        latitude: location.lat,
        longitude: location.lng,
        address: location.location
      };
    }
  }
  
  // Check for location ID pattern
  const idMatch = decodedUrl.match(URL_PATTERNS.LOCATION_ID);
  if (idMatch) {
    const locationId = idMatch[1].toLowerCase();
    const location = INDIAN_LOCATIONS.find(loc => loc.id === locationId);
    if (location) {
      return {
        type: 'location',
        name: location.name,
        latitude: location.lat,
        longitude: location.lng,
        address: location.location
      };
    }
  }
  
  return null;
};

// Examples of usage:
// Short URLs:
// - Coordinates: "28.6139_77.2090"
// - City: "@delhi"
// - Location ID: "#del"

import { INDIAN_LOCATIONS } from './indianLocations';

// Function to generate a shareable URL
export const generateShareableUrl = (location: { name: string; latitude: number; longitude: number; id?: string }) => {
  const shortCode = shortenLocation(location);
  const baseUrl = window.location.origin;
  return `${baseUrl}/location/${encodeURIComponent(shortCode)}`;
};

// Function to parse location from URL
export const parseLocationFromUrl = (url: string) => {
  try {
    // Extract the short code from the URL
    const shortCode = url.split('/location/').pop();
    if (!shortCode) return null;
    
    return expandShortUrl(shortCode);
  } catch (error) {
    console.error('Error parsing location from URL:', error);
    return null;
  }
};