// Get user location from IP
export const getUserLocationFromIP = async () => {
  try {
    const response = await fetch('https://ipapi.co/json/');
    const data = await response.json();
    return {
      country: data.country_name,
      city: data.city,
      region: data.region,
      countryCode: data.country_code,
      dialCode: data.country_calling_code,
      location: `${data.city}, ${data.region}, ${data.country_name}`
    };
  } catch (error) {
    console.error('Failed to get location from IP:', error);
    return null;
  }
};

// Get Google Maps autocomplete suggestions
export const getLocationSuggestions = async (input: string) => {
  if (!input || input.length < 3) return [];
  
  try {
    // Using Google Places API (you'll need to add your API key)
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(input)}&key=${import.meta.env.VITE_GOOGLE_MAPS_API_KEY}`
    );
    const data = await response.json();
    return data.predictions || [];
  } catch (error) {
    console.error('Failed to get location suggestions:', error);
    return [];
  }
};

// Country codes and dial codes
export const getCountryFlag = (countryCode: string) => {
  return `https://flagcdn.com/24x18/${countryCode.toLowerCase()}.png`;
};