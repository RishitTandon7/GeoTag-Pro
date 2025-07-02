// Create a comprehensive database of Indian locations
export const INDIAN_LOCATIONS = [
  // Metropolitan Cities
  { id: 'del', name: 'New Delhi', location: 'New Delhi, Delhi, India', lat: 28.6139, lng: 77.2090, type: 'metro' },
  { id: 'mum', name: 'Mumbai', location: 'Mumbai, Maharashtra, India', lat: 19.0760, lng: 72.8777, type: 'metro' },
  { id: 'kol', name: 'Kolkata', location: 'Kolkata, West Bengal, India', lat: 22.5726, lng: 88.3639, type: 'metro' },
  { id: 'che', name: 'Chennai', location: 'Chennai, Tamil Nadu, India', lat: 13.0827, lng: 80.2707, type: 'metro' },
  { id: 'ben', name: 'Bengaluru', location: 'Bengaluru, Karnataka, India', lat: 12.9716, lng: 77.5946, type: 'metro' },
  { id: 'hyd', name: 'Hyderabad', location: 'Hyderabad, Telangana, India', lat: 17.3850, lng: 78.4867, type: 'metro' },
  
  // Major Cities - North
  { id: 'luc', name: 'Lucknow', location: 'Lucknow, Uttar Pradesh, India', lat: 26.8467, lng: 80.9462, type: 'major' },
  { id: 'jai', name: 'Jaipur', location: 'Jaipur, Rajasthan, India', lat: 26.9124, lng: 75.7873, type: 'major' },
  { id: 'cha', name: 'Chandigarh', location: 'Chandigarh, India', lat: 30.7333, lng: 76.7794, type: 'major' },
  { id: 'deh', name: 'Dehradun', location: 'Dehradun, Uttarakhand, India', lat: 30.3165, lng: 78.0322, type: 'major' },
  
  // Major Cities - South
  { id: 'koc', name: 'Kochi', location: 'Kochi, Kerala, India', lat: 9.9312, lng: 76.2673, type: 'major' },
  { id: 'coi', name: 'Coimbatore', location: 'Coimbatore, Tamil Nadu, India', lat: 11.0168, lng: 76.9558, type: 'major' },
  { id: 'tri', name: 'Thiruvananthapuram', location: 'Thiruvananthapuram, Kerala, India', lat: 8.5241, lng: 76.9366, type: 'major' },
  { id: 'mys', name: 'Mysuru', location: 'Mysuru, Karnataka, India', lat: 12.2958, lng: 76.6394, type: 'major' },
  
  // Major Cities - West
  { id: 'ahm', name: 'Ahmedabad', location: 'Ahmedabad, Gujarat, India', lat: 23.0225, lng: 72.5714, type: 'major' },
  { id: 'pun', name: 'Pune', location: 'Pune, Maharashtra, India', lat: 18.5204, lng: 73.8567, type: 'major' },
  { id: 'sud', name: 'Surat', location: 'Surat, Gujarat, India', lat: 21.1702, lng: 72.8311, type: 'major' },
  { id: 'nag', name: 'Nagpur', location: 'Nagpur, Maharashtra, India', lat: 21.1458, lng: 79.0882, type: 'major' },
  
  // Major Cities - East
  { id: 'pat', name: 'Patna', location: 'Patna, Bihar, India', lat: 25.5941, lng: 85.1376, type: 'major' },
  { id: 'ran', name: 'Ranchi', location: 'Ranchi, Jharkhand, India', lat: 23.3441, lng: 85.3096, type: 'major' },
  { id: 'bhu', name: 'Bhubaneswar', location: 'Bhubaneswar, Odisha, India', lat: 20.2961, lng: 85.8245, type: 'major' },
  { id: 'guw', name: 'Guwahati', location: 'Guwahati, Assam, India', lat: 26.1445, lng: 91.7362, type: 'major' },
  
  // Major Cities - Central
  { id: 'ind', name: 'Indore', location: 'Indore, Madhya Pradesh, India', lat: 22.7196, lng: 75.8577, type: 'major' },
  { id: 'bho', name: 'Bhopal', location: 'Bhopal, Madhya Pradesh, India', lat: 23.2599, lng: 77.4126, type: 'major' },
  { id: 'rai', name: 'Raipur', location: 'Raipur, Chhattisgarh, India', lat: 21.2514, lng: 81.6296, type: 'major' },
  
  // Tourist Destinations - North
  { id: 'agr', name: 'Agra', location: 'Agra, Uttar Pradesh, India', lat: 27.1767, lng: 78.0081, type: 'tourist' },
  { id: 'var', name: 'Varanasi', location: 'Varanasi, Uttar Pradesh, India', lat: 25.3176, lng: 82.9739, type: 'tourist' },
  { id: 'shi', name: 'Shimla', location: 'Shimla, Himachal Pradesh, India', lat: 31.1048, lng: 77.1734, type: 'tourist' },
  { id: 'man', name: 'Manali', location: 'Manali, Himachal Pradesh, India', lat: 32.2396, lng: 77.1887, type: 'tourist' },
  { id: 'ris', name: 'Rishikesh', location: 'Rishikesh, Uttarakhand, India', lat: 30.0869, lng: 78.2676, type: 'tourist' },
  { id: 'amr', name: 'Amritsar', location: 'Amritsar, Punjab, India', lat: 31.6340, lng: 74.8723, type: 'tourist' },
  { id: 'srn', name: 'Srinagar', location: 'Srinagar, Jammu and Kashmir, India', lat: 34.0837, lng: 74.7973, type: 'tourist' },
  { id: 'leh', name: 'Leh', location: 'Leh, Ladakh, India', lat: 34.1526, lng: 77.5771, type: 'tourist' },
  
  // Tourist Destinations - South
  { id: 'oot', name: 'Ooty', location: 'Ooty, Tamil Nadu, India', lat: 11.4102, lng: 76.6950, type: 'tourist' },
  { id: 'kod', name: 'Kodaikanal', location: 'Kodaikanal, Tamil Nadu, India', lat: 10.2381, lng: 77.4892, type: 'tourist' },
  { id: 'mun', name: 'Munnar', location: 'Munnar, Kerala, India', lat: 10.0889, lng: 77.0595, type: 'tourist' },
  { id: 'ham', name: 'Hampi', location: 'Hampi, Karnataka, India', lat: 15.3350, lng: 76.4600, type: 'tourist' },
  
  // Tourist Destinations - West
  { id: 'uda', name: 'Udaipur', location: 'Udaipur, Rajasthan, India', lat: 24.5854, lng: 73.7125, type: 'tourist' },
  { id: 'jod', name: 'Jodhpur', location: 'Jodhpur, Rajasthan, India', lat: 26.2389, lng: 73.0243, type: 'tourist' },
  { id: 'jai', name: 'Jaisalmer', location: 'Jaisalmer, Rajasthan, India', lat: 26.9157, lng: 70.9083, type: 'tourist' },
  { id: 'goa', name: 'Panaji', location: 'Panaji, Goa, India', lat: 15.4909, lng: 73.8278, type: 'tourist' },
  
  // Tourist Destinations - East
  { id: 'dar', name: 'Darjeeling', location: 'Darjeeling, West Bengal, India', lat: 27.0410, lng: 88.2663, type: 'tourist' },
  { id: 'gan', name: 'Gangtok', location: 'Gangtok, Sikkim, India', lat: 27.3389, lng: 88.6065, type: 'tourist' },
  { id: 'shi', name: 'Shillong', location: 'Shillong, Meghalaya, India', lat: 25.5788, lng: 91.8933, type: 'tourist' },
  { id: 'kaz', name: 'Kaziranga', location: 'Kaziranga National Park, Assam, India', lat: 26.5767, lng: 93.1700, type: 'tourist' },
  
  // Tourist Destinations - Central
  { id: 'kha', name: 'Khajuraho', location: 'Khajuraho, Madhya Pradesh, India', lat: 24.8318, lng: 79.9199, type: 'tourist' },
  { id: 'ban', name: 'Bandhavgarh', location: 'Bandhavgarh National Park, Madhya Pradesh, India', lat: 23.6834, lng: 81.0268, type: 'tourist' },
  { id: 'pac', name: 'Pachmarhi', location: 'Pachmarhi, Madhya Pradesh, India', lat: 22.4675, lng: 78.4347, type: 'tourist' }
];

// Helper function to get nearby locations
export const getNearbyLocations = (lat: number, lng: number, radius: number = 50) => {
  return INDIAN_LOCATIONS.filter(location => {
    const distance = getDistance(lat, lng, location.lat, location.lng);
    return distance <= radius;
  });
};

// Calculate distance between two points using Haversine formula
const getDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const R = 6371; // Earth's radius in kilometers
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

const toRad = (value: number) => {
  return value * Math.PI / 180;
};

// Get location suggestions based on search term
export const getLocationSuggestions = (searchTerm: string) => {
  const term = searchTerm.toLowerCase().trim();
  return INDIAN_LOCATIONS.filter(location => 
    location.name.toLowerCase().includes(term) || 
    location.location.toLowerCase().includes(term)
  );
};

// Get location by coordinates
export const getLocationByCoordinates = (lat: number, lng: number) => {
  return INDIAN_LOCATIONS.find(location => 
    Math.abs(location.lat - lat) < 0.01 && 
    Math.abs(location.lng - lng) < 0.01
  );
};

// Get region name based on coordinates
export const getRegionName = (lat: number, lng: number): string => {
  if (lat > 28) return "North India";
  if (lat < 15) return "South India";
  if (lng > 85) return "East India";
  if (lng < 75) return "West India";
  return "Central India";
};

// Get state based on coordinates
export const getStateFromCoordinates = (lat: number, lng: number): string => {
  // Add logic to determine state based on coordinates
  // This is a simplified version - you would want to implement proper boundary checking
  if (lat > 28 && lng > 77) return "Delhi";
  if (lat > 18 && lng > 72 && lng < 75) return "Maharashtra";
  if (lat < 15 && lng > 75 && lng < 79) return "Tamil Nadu";
  // Add more state determinations
  return "Unknown State";
};