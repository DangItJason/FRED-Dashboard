# Macroeconomic Dashboard

A beautiful and interactive dashboard that displays key macroeconomic indicators using data from the Federal Reserve Economic Data (FRED) API.

## Features

- Real-time data from FRED API
- Interactive charts for various economic indicators:
  - GDP
  - Unemployment Rate
  - Inflation Rate
  - Interest Rate
  - 10-Year Treasury Yield
  - 30-Year Fixed Mortgage Rate
  - S&P 500
  - Gold Price
  - Bitcoin Price
- Responsive design that works on desktop and mobile
- Beautiful UI using Chakra UI
- Interactive charts using Recharts

## Getting Started

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up environment variables:
   - Copy `.env.example` to `.env`
   - Add your FRED API key to the `.env` file:
     ```
     VITE_FRED_API_KEY=your_fred_api_key_here
     ```
   - You can get a FRED API key from: https://fred.stlouisfed.org/docs/api/api_key.html
4. Start the development server:
   ```bash
   npm run dev
   ```
5. Open your browser and navigate to `http://localhost:5173`

## Technologies Used

- React
- TypeScript
- Vite
- Chakra UI
- Recharts
- FRED API

## Environment Variables

The following environment variables are required:

- `VITE_FRED_API_KEY`: Your FRED API key

## Deployment

This project is automatically deployed to GitHub Pages using GitHub Actions. The deployment workflow:

1. Triggers on pushes to the main branch
2. Builds the project with environment variables
3. Deploys to GitHub Pages

You can view the live deployment at: https://dangitjason.github.io/FRED-Dashboard/

## License

MIT 