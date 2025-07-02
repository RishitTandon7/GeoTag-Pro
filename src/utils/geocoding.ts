const NOMINATIM_BASE_URL = 'https://nominatim.openstreetmap.org';

export const searchLocations = async (query: string) => {
  try {
    const searchQuery = !query.toLowerCase().includes('india') ? `${query}, India` : query;
    const response = await fetch(
      `${NOMINATIM_BASE_URL}/search?` + 
      new URLSearchParams({
        q: searchQuery,
        format: 'json',
        countrycodes: 'in',
        limit: '15',
        'accept-language': 'en'
      })
    );
    
    if (!response.ok) throw new Error('Network response was not ok');
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error searching locations:', error);
    throw error;
  }
};

export const reverseGeocode = async (lat: number, lon: number) => {
  try {
    const response = await fetch(
      `${NOMINATIM_BASE_URL}/reverse?` + 
      new URLSearchParams({
        lat: lat.toString(),
        lon: lon.toString(),
        format: 'json',
        zoom: '18',
        addressdetails: '1',
        countrycodes: 'in',
        'accept-language': 'en'
      })
    );
    
    if (!response.ok) throw new Error('Network response was not ok');
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error reverse geocoding:', error);
    throw error;
  }
};

// Cache for geocoding results
const geocodingCache = new Map<string, any>();

export const getCachedGeocodingResults = (key: string) => {
  return geocodingCache.get(key);
};

export const setCachedGeocodingResults = (key: string, results: any) => {
  geocodingCache.set(key, results);
  // Limit cache size to prevent memory issues
  if (geocodingCache.size > 100) {
    const firstKey = geocodingCache.keys().next().value;
    geocodingCache.delete(firstKey);
  }
};