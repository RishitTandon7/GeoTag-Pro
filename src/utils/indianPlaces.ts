import { search } from 'fast-fuzzy';

// Interface for Indian administrative regions
interface AdminRegion {
  name: string;
  type: 'state' | 'union_territory';
  capital: string;
  districts: string[];
}

// Comprehensive list of Indian states and union territories
export const INDIAN_ADMIN_REGIONS: AdminRegion[] = [
  {
    name: 'Andhra Pradesh',
    type: 'state',
    capital: 'Amaravati',
    districts: ['Anantapur', 'Chittoor', 'East Godavari', 'Guntur', 'Krishna', 'Kurnool', 'Prakasam', 'Srikakulam', 'Visakhapatnam', 'Vizianagaram', 'West Godavari', 'YSR Kadapa']
  },
  {
    name: 'Karnataka',
    type: 'state',
    capital: 'Bengaluru',
    districts: ['Bagalkot', 'Bangalore Rural', 'Bangalore Urban', 'Belgaum', 'Bellary', 'Bidar', 'Chamarajanagar', 'Chikkaballapur', 'Chikkamagaluru', 'Chitradurga', 'Dakshina Kannada', 'Davanagere', 'Dharwad', 'Gadag', 'Gulbarga', 'Hassan', 'Haveri', 'Kodagu', 'Kolar', 'Koppal', 'Mandya', 'Mysore', 'Raichur', 'Ramanagara', 'Shimoga', 'Tumkur', 'Udupi', 'Uttara Kannada', 'Vijayapura', 'Yadgir']
  },
  // Add more states and UTs...
];

// Interface for location types
interface LocationType {
  id: string;
  name: string;
  keywords: string[];
}

// Common location types in India
export const LOCATION_TYPES: LocationType[] = [
  { id: 'temple', name: 'Temple', keywords: ['temple', 'mandir', 'kovil', 'devasthanam'] },
  { id: 'mosque', name: 'Mosque', keywords: ['mosque', 'masjid', 'dargah'] },
  { id: 'church', name: 'Church', keywords: ['church', 'cathedral', 'chapel'] },
  { id: 'market', name: 'Market', keywords: ['market', 'bazaar', 'mandi', 'shopping'] },
  { id: 'park', name: 'Park', keywords: ['park', 'garden', 'udyan', 'bagh'] },
  { id: 'lake', name: 'Lake', keywords: ['lake', 'sarovar', 'tal'] },
  { id: 'hill', name: 'Hill', keywords: ['hill', 'pahar', 'malai', 'giri'] },
  { id: 'beach', name: 'Beach', keywords: ['beach', 'samudra', 'kadal', 'coast'] },
  // Add more types...
];

// Enhanced search function using fast-fuzzy
export const searchIndianPlaces = (query: string) => {
  const searchOptions = {
    threshold: 0.6,
    returnMatchData: true
  };

  // Search in admin regions
  const adminResults = search(query, INDIAN_ADMIN_REGIONS, {
    ...searchOptions,
    keySelector: (obj) => [obj.name, obj.capital, ...obj.districts].join(' ')
  });

  // Search in location database
  const locationResults = search(query, INDIAN_LOCATIONS, {
    ...searchOptions,
    keySelector: (obj) => [obj.name, obj.location].join(' ')
  });

  // Combine and sort results
  return {
    adminRegions: adminResults.map(result => ({
      ...result.item,
      score: result.score
    })),
    locations: locationResults.map(result => ({
      ...result.item,
      score: result.score
    }))
  };
};

// Get popular locations by type
export const getLocationsByType = (type: string) => {
  return INDIAN_LOCATIONS.filter(location => 
    location.type === type
  );
};

// Get locations in a state
export const getLocationsInState = (stateName: string) => {
  return INDIAN_LOCATIONS.filter(location => 
    location.location.includes(stateName)
  );
};

// Get locations by region
export const getLocationsByRegion = (region: 'North' | 'South' | 'East' | 'West' | 'Central') => {
  const regionBounds = {
    North: { minLat: 28, maxLat: 37, minLng: 72, maxLng: 80 },
    South: { minLat: 8, maxLat: 15, minLng: 74, maxLng: 85 },
    East: { minLat: 21, maxLat: 28, minLng: 85, maxLng: 97 },
    West: { minLat: 15, maxLat: 24, minLng: 68, maxLng: 76 },
    Central: { minLat: 21, maxLat: 26, minLng: 76, maxLng: 85 }
  };

  const bounds = regionBounds[region];
  return INDIAN_LOCATIONS.filter(location => 
    location.lat >= bounds.minLat &&
    location.lat <= bounds.maxLat &&
    location.lng >= bounds.minLng &&
    location.lng <= bounds.maxLng
  );
};

// Get district suggestions
export const getDistrictSuggestions = (stateName: string, query: string) => {
  const state = INDIAN_ADMIN_REGIONS.find(region => 
    region.name.toLowerCase() === stateName.toLowerCase()
  );

  if (!state) return [];

  return search(query, state.districts, {
    threshold: 0.6,
    returnMatchData: true
  }).map(result => ({
    name: result.item,
    score: result.score,
    state: state.name
  }));
};

// Format address components
export const formatAddress = (components: any) => {
  const parts = [];
  if (components.district) parts.push(components.district);
  if (components.state) parts.push(components.state);
  if (components.postcode) parts.push(components.postcode);
  parts.push('India');
  return parts.join(', ');
};

// Get location type from keywords
export const getLocationType = (name: string): string => {
  const lowercaseName = name.toLowerCase();
  for (const type of LOCATION_TYPES) {
    if (type.keywords.some(keyword => lowercaseName.includes(keyword))) {
      return type.name;
    }
  }
  return 'Other';
};

// Export existing INDIAN_LOCATIONS from indianLocations.ts
export { INDIAN_LOCATIONS } from './indianLocations';