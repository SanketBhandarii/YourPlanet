import { SummaryData, UserSubmission, LocationData } from '../types';

const API_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';

export const fetchLatestSummary = async (): Promise<SummaryData | null> => {
  try {
    const res = await fetch(`${API_URL}/latest`);
    if (!res.ok) {
      if (res.status === 404) return null;
      throw new Error('Failed to fetch summary');
    }
    return await res.json();
  } catch (error) {
    console.error("Error fetching summary:", error);
    return null;
  }
};

export const submitThought = async (
  thought: string,
  location: LocationData
): Promise<UserSubmission> => {
  const payload = {
    thought,
    latitude: location.latitude,
    longitude: location.longitude,
    continent: location.continent || "Unknown",
    country: location.countryName || "Unknown",
    state: location.principalSubdivision || "Unknown",
    city: location.city || "Unknown",
  };

  const res = await fetch(`${API_URL}/give/thought`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.res || 'Failed to submit thought');
  }

  const data = await res.json();
  return data.res;
};

export const reverseGeocode = async (lat: number, lng: number): Promise<Partial<LocationData>> => {
  try {
    const res = await fetch(
      `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=en`
    );
    const data = await res.json();

    return {
      city: data.city || data.locality || "",
      principalSubdivision: data.principalSubdivision || "",
      countryName: data.countryName || "",
      continent: data.continent || "",
    };
  } catch (e) {
    console.warn("Geocoding failed", e);
    return {
      city: "Unknown",
      principalSubdivision: "Unknown",
      countryName: "Unknown",
      continent: "Unknown"
    };
  }
};