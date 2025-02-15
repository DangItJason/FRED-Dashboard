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
    console.log(`Fetching data for series: ${seriesId}`); // Debug log
    
    // Get current date in YYYY-MM-DD format, using local timezone
    const now = new Date();
    const today = now.getFullYear() + '-' + 
                 String(now.getMonth() + 1).padStart(2, '0') + '-' + 
                 String(now.getDate()).padStart(2, '0');
    
    // Base parameters
    const params = new URLSearchParams({
      series_id: seriesId,
      api_key: FRED_API_KEY,
      file_type: 'json',
      observation_start: observationStart,
      sort_order: 'asc',
    });

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
    console.log(`Making request to: ${url.replace(FRED_API_KEY, 'API_KEY_HIDDEN')}`); // Debug log without exposing API key

    const response = await axios.get(url, {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
    });

    console.log(`Response status for ${seriesId}:`, response.status); // Debug log

    if (response.data && response.data.observations) {
      console.log(`Got ${response.data.observations.length} observations for ${seriesId}`);
      return response.data.observations;
    } else {
      console.error(`No observations found for ${seriesId}`, response.data);
      throw new Error(`No data available for ${seriesId}`);
    }
  } catch (error) {
    if (axios.isAxiosError(error)) {
      if (error.response) {
        // The request was made and the server responded with a status code outside 2xx
        console.error(`API Error for ${seriesId}:`, {
          status: error.response.status,
          data: error.response.data,
          headers: error.response.headers,
          url: error.config?.url?.replace(FRED_API_KEY, 'API_KEY_HIDDEN'),
        });
        const errorMessage = error.response.data?.error_message || 
                           `API Error (${error.response.status}): ${error.message}`;
        throw new Error(errorMessage);
      } else if (error.request) {
        // The request was made but no response was received
        console.error(`Network Error for ${seriesId}:`, {
          error: error.message,
          request: error.request,
          url: error.config?.url?.replace(FRED_API_KEY, 'API_KEY_HIDDEN'),
        });
        throw new Error(`Network error: Unable to connect to FRED API. Check the console for details.`);
      } else {
        console.error(`Request Setup Error for ${seriesId}:`, error.message);
        throw new Error(`Request error: ${error.message}`);
      }
    }
    console.error('Unknown error:', error);
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