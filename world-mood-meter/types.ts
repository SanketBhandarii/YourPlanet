export interface UserSubmission {
  thought: string;
  mood: string;
  city: string;
  state: string;
  country: string;
  continent: string;
  latitude: number;
  longitude: number;
  date: string;
  anonId: string;
}

export interface LocationData {
  city: string;
  principalSubdivision: string; // state
  countryName: string;
  continent: string;
  latitude: number;
  longitude: number;
}

export interface SummaryData {
  _id: string;
  date: string;
  summary: string;
  happiestCountry: string;
  saddestCountry: string;
  happiestContinent: string;
  saddestContinent: string;
  continentSummaries: {
    asia: string;
    europe: string;
    africa: string;
    northAmerica: String;
    southAmerica: String;
    australia: String;
    antarctica: String;
    [key: string]: any; 
  };
  happiestCityPerCountry: Record<string, string>;
  saddestCityPerCountry: Record<string, string>;
  createdAt: string;
}

export interface ApiError {
  message: string;
  error?: string;
}

export interface GeoResponse {
  city: string;
  principalSubdivision: string;
  countryName: string;
  continent: string;
}