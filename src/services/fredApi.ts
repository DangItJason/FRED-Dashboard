import axios from 'axios';

const FRED_API_KEY = import.meta.env.VITE_FRED_API_KEY;
if (!FRED_API_KEY) {
  throw new Error('FRED API key not found. Please check your .env file.');
}

// Use the full URL in production, proxy in development
const BASE_URL = import.meta.env.PROD 
  ? 'https://api.stlouisfed.org/fred'
  : '/fred';

export interface FredObservation {
  date: string;
  value: string;
}

export const fetchFredData = async (seriesId: string, observationStart: string = '2020-01-01'): Promise<FredObservation[]> => {
  try {
    console.log(`Fetching data for series: ${seriesId}`);
    
    // Get current date in YYYY-MM-DD format, using local timezone
    const now = new Date();
    const today = now.getFullYear() + '-' + 
                 String(now.getMonth() + 1).padStart(2, '0') + '-' + 
                 String(now.getDate()).padStart(2, '0');
    
    // Create URLSearchParams for better parameter handling
    const params = new URLSearchParams();
    params.append('series_id', seriesId);
    params.append('api_key', FRED_API_KEY);
    params.append('file_type', 'json');
    params.append('observation_start', observationStart);
    params.append('sort_order', 'asc');

    // Add frequency parameter only for GDP (which is quarterly)
    if (seriesId === 'GDPC1') {
      params.append('frequency', 'q');
    }

    // For series that need realtime dates
    if (['DGS10', 'MORTGAGE30US', 'CBBTCUSD'].includes(seriesId)) {
      params.append('realtime_start', today);
      params.append('realtime_end', today);
      params.append('output_type', '1');
    }

    // Construct the full URL with parameters
    const url = `${BASE_URL}/series/observations?${params.toString()}`;
    console.log(`Making request to: ${url.replace(FRED_API_KEY, 'API_KEY_HIDDEN')}`);

    const response = await axios.get(url, {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      // Add timeout and validateStatus
      timeout: 10000,
      validateStatus: (status) => status >= 200 && status < 300,
    });

    if (!response.data || !response.data.observations) {
      console.error(`Invalid response format for ${seriesId}:`, response.data);
      throw new Error(`Invalid response format for ${seriesId}`);
    }

    const observations = response.data.observations;
    if (observations.length === 0) {
      console.warn(`No observations found for ${seriesId}`);
      throw new Error(`No data available for ${seriesId}`);
    }

    console.log(`Successfully fetched ${observations.length} points for ${seriesId}`);
    return observations;

  } catch (error) {
    if (axios.isAxiosError(error)) {
      if (error.response) {
        // Server responded with error
        console.error(`API Error for ${seriesId}:`, {
          status: error.response.status,
          data: error.response.data,
          headers: error.response.headers,
          url: error.config?.url?.replace(FRED_API_KEY, 'API_KEY_HIDDEN'),
          params: error.config?.params
        });
        
        const errorMessage = error.response.data?.error_message || 
          `API Error (${error.response.status}): ${error.message}`;
        throw new Error(errorMessage);
      } else if (error.request) {
        // Request made but no response received
        console.error(`Network Error for ${seriesId}:`, {
          message: error.message,
          code: error.code,
          url: error.config?.url?.replace(FRED_API_KEY, 'API_KEY_HIDDEN'),
        });
        throw new Error(`Network error: Unable to connect to FRED API. Please try again later.`);
      }
    }
    // Unknown error
    console.error(`Unexpected error for ${seriesId}:`, error);
    throw error;
  }
};

// Series IDs for different economic indicators
export const SERIES_IDS = {
  GDP: 'GDPC1', // Real Gross Domestic Product (Quarterly)
  UNEMPLOYMENT: 'UNRATE', // Unemployment Rate
  INFLATION: 'CPIAUCSL', // Consumer Price Index for All Urban Consumers
  FEDERAL_FUNDS_RATE: 'FEDFUNDS', // Federal Funds Rate
  TREASURY_10Y: 'DGS10', // 10-Year Treasury Rate
  MORTGAGE_30Y: 'MORTGAGE30US', // 30-Year Fixed Rate Mortgage Average
  SP500: 'SP500', // S&P 500
  BITCOIN: 'CBBTCUSD', // Coinbase Bitcoin-USD Exchange Rate
}; 