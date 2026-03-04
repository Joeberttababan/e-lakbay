interface OpenWeatherCurrentResponse {
  weather?: Array<{
    main?: string;
    description?: string;
    icon?: string;
  }>;
  main?: {
    temp?: number;
    humidity?: number;
  };
  wind?: {
    speed?: number;
  };
  name?: string;
  cod?: number | string;
  message?: string;
}

export interface CurrentWeatherData {
  tempC: number;
  condition: string;
  humidity: number | null;
  windKph: number | null;
  iconCode: string | null;
  locationName: string | null;
}

const OPEN_WEATHER_BASE_URL = 'https://api.openweathermap.org/data/2.5/weather';

// Weather cache to prevent unnecessary API calls
interface WeatherCacheEntry {
  data: CurrentWeatherData;
  timestamp: number;
}

const weatherCache = new Map<string, WeatherCacheEntry>();
const CACHE_DURATION = 10 * 60 * 1000; // 10 minutes in milliseconds

const getCacheKey = (lat?: number, lon?: number, municipality?: string): string => {
  if (municipality) {
    return `municipality:${municipality}`;
  }
  if (lat !== undefined && lon !== undefined) {
    return `coords:${lat.toFixed(4)},${lon.toFixed(4)}`;
  }
  return '';
};

const getCachedWeather = (cacheKey: string): CurrentWeatherData | null => {
  const entry = weatherCache.get(cacheKey);
  if (!entry) return null;

  const now = Date.now();
  if (now - entry.timestamp > CACHE_DURATION) {
    weatherCache.delete(cacheKey);
    return null;
  }

  console.log('🌤️ Using cached weather data for:', cacheKey);
  return entry.data;
};

const setCachedWeather = (cacheKey: string, data: CurrentWeatherData): void => {
  weatherCache.set(cacheKey, {
    data,
    timestamp: Date.now(),
  });
};

const toSentenceCase = (value: string) => {
  if (!value) return value;
  return value.charAt(0).toUpperCase() + value.slice(1);
};

const mapCurrentWeatherPayload = (payload: OpenWeatherCurrentResponse): CurrentWeatherData => {
  const weather = payload.weather?.[0];
  const tempC = typeof payload.main?.temp === 'number' ? payload.main.temp : Number.NaN;

  if (Number.isNaN(tempC)) {
    throw new Error('Weather data is incomplete.');
  }

  const weatherData = {
    tempC,
    condition: toSentenceCase(weather?.description || weather?.main || 'Unknown'),
    humidity: typeof payload.main?.humidity === 'number' ? payload.main.humidity : null,
    windKph: typeof payload.wind?.speed === 'number' ? payload.wind.speed * 3.6 : null,
    iconCode: weather?.icon || null,
    locationName: payload.name || null,
  };

  // Debug message for weather data
  console.log('🌤️ Weather API Response:', {
    location: weatherData.locationName,
    temperature: `${weatherData.tempC.toFixed(1)}°C`,
    humidity: weatherData.humidity ? `${weatherData.humidity}%` : 'N/A',
    wind: weatherData.windKph ? `${weatherData.windKph.toFixed(1)} km/h` : 'N/A',
    condition: weatherData.condition,
  });

  return weatherData;
};

const fetchWeather = async (query: URLSearchParams, signal?: AbortSignal): Promise<CurrentWeatherData> => {
  const response = await fetch(`${OPEN_WEATHER_BASE_URL}?${query.toString()}`, { signal });
  const payload = (await response.json()) as OpenWeatherCurrentResponse;

  if (!response.ok) {
    throw new Error(payload.message || 'Failed to fetch current weather.');
  }

  return mapCurrentWeatherPayload(payload);
};

const getRequiredApiKey = () => {
  const apiKey = import.meta.env.VITE_OPENWEATHER_API_KEY;

  if (!apiKey) {
    throw new Error('OpenWeather API key is missing. Set VITE_OPENWEATHER_API_KEY.');
  }

  return apiKey;
};

export const fetchCurrentWeather = async (
  lat: number,
  lon: number,
  signal?: AbortSignal,
): Promise<CurrentWeatherData> => {
  const cacheKey = getCacheKey(lat, lon);
  const cached = getCachedWeather(cacheKey);
  if (cached) return cached;

  const apiKey = getRequiredApiKey();

  const query = new URLSearchParams({
    lat: String(lat),
    lon: String(lon),
    appid: apiKey,
    units: 'metric',
    lang: 'en',
  });

  const result = await fetchWeather(query, signal);
  setCachedWeather(cacheKey, result);
  return result;
};

export const fetchCurrentWeatherByMunicipality = async (
  municipality: string,
  province = 'Ilocos Sur',
  countryCode = 'PH',
  signal?: AbortSignal,
): Promise<CurrentWeatherData> => {
  const cacheKey = getCacheKey(undefined, undefined, municipality);
  const cached = getCachedWeather(cacheKey);
  if (cached) return cached;

  const apiKey = getRequiredApiKey();
  const locationQuery = [municipality, province, countryCode].filter(Boolean).join(',');

  const query = new URLSearchParams({
    q: locationQuery,
    appid: apiKey,
    units: 'metric',
    lang: 'en',
  });

  const result = await fetchWeather(query, signal);
  setCachedWeather(cacheKey, result);
  return result;
};