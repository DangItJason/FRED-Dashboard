import React from 'react';
import { Box, Heading, Spinner, Text } from '@chakra-ui/react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Label,
} from 'recharts';
import { FredObservation } from '../services/fredApi';

interface EconomicChartProps {
  title: string;
  data: FredObservation[];
  isLoading: boolean;
  error?: string;
  color?: string;
  seriesId: string;
}

const formatDate = (dateStr: string) => {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    year: 'numeric'
  });
};

const formatValue = (value: number, seriesId: string) => {
  const config = getYAxisConfig(seriesId);
  return config.formatter(value);
};

const getYAxisConfig = (seriesId: string) => {
  const configs: { [key: string]: { label: string, formatter: (value: number) => string } } = {
    'GDPC1': {
      label: 'Billions of Dollars',
      formatter: (value: number) => `$${value.toLocaleString(undefined, { maximumFractionDigits: 0 })}B`,
    },
    'UNRATE': {
      label: 'Percent',
      formatter: (value: number) => `${value.toFixed(1)}%`,
    },
    'CPIAUCSL': {
      label: 'Consumer Price Index\n(1982-1984 Base Period = 100)',
      formatter: (value: number) => value.toFixed(1),
    },
    'FEDFUNDS': {
      label: 'Percent',
      formatter: (value: number) => `${value.toFixed(2)}%`,
    },
    'DGS10': {
      label: 'Percent',
      formatter: (value: number) => `${value.toFixed(2)}%`,
    },
    'MORTGAGE30US': {
      label: 'Percent',
      formatter: (value: number) => `${value.toFixed(2)}%`,
    },
    'SP500': {
      label: 'Index',
      formatter: (value: number) => value.toLocaleString(undefined, { maximumFractionDigits: 0 }),
    },
    'CBBTCUSD': {
      label: 'USD',
      formatter: (value: number) => `$${value.toLocaleString(undefined, { maximumFractionDigits: 0 })}`,
    },
  };
  return configs[seriesId] || { label: 'Value', formatter: (value: number) => value.toFixed(2) };
};

const calculateYAxisDomain = (data: FredObservation[], seriesId: string): [number, number] => {
  if (data.length === 0) return [0, 100];

  const values = data.map(item => parseFloat(item.value));
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min;

  // Different padding strategies based on the type of data
  let padding: number;
  switch (seriesId) {
    case 'UNRATE':
    case 'FEDFUNDS':
    case 'DGS10':
    case 'MORTGAGE30US':
      // For percentage values, use smaller padding
      padding = range * 0.1;
      break;
    case 'GDPC1':
      // For GDP, use very small padding as changes are significant
      padding = range * 0.05;
      break;
    case 'SP500':
    case 'CBBTCUSD':
      // For market prices, use moderate padding
      padding = range * 0.15;
      break;
    default:
      padding = range * 0.1;
  }

  return [
    Math.max(0, min - padding), // Don't go below 0 for most metrics
    max + padding
  ];
};

const EconomicChart = ({ title, data, isLoading, error, color = '#2B6CB0', seriesId }: EconomicChartProps) => {
  if (isLoading) {
    return (
      <Box p={4} borderWidth="1px" borderRadius="lg" transition="all 0.2s">
        <Heading size="md" mb={4}>{title}</Heading>
        <Box display="flex" justifyContent="center" alignItems="center" h="300px">
          <Spinner size="xl" />
        </Box>
      </Box>
    );
  }

  if (error) {
    return (
      <Box p={4} borderWidth="1px" borderRadius="lg" transition="all 0.2s">
        <Heading size="md" mb={4}>{title}</Heading>
        <Box display="flex" justifyContent="center" alignItems="center" h="300px" color="red.500">
          <Text>{error}</Text>
        </Box>
      </Box>
    );
  }

  const chartData = data.map(item => ({
    date: formatDate(item.date),
    value: parseFloat(item.value),
  }));

  const yAxisConfig = getYAxisConfig(seriesId);
  const yAxisDomain = calculateYAxisDomain(data, seriesId);

  return (
    <Box p={4} borderWidth="1px" borderRadius="lg" transition="all 0.2s">
      <Heading size="md" mb={4}>{title}</Heading>
      <Box h="300px">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 12 }}
              interval="preserveEnd"
              tickMargin={10}
            />
            <YAxis 
              tick={{ fontSize: 12 }}
              tickFormatter={(value) => formatValue(value, seriesId)}
              tickMargin={35}
              width={80}
            >
              <Label
                value={yAxisConfig.label}
                angle={-90}
                position="insideLeft"
                style={{ textAnchor: 'middle', fontSize: '12px' }}
                offset={-20}
              />
            </YAxis>
            <Tooltip 
              formatter={(value: number) => [formatValue(value, seriesId), title]}
              labelFormatter={(label) => `Date: ${label}`}
            />
            <Line
              type="monotone"
              dataKey="value"
              stroke={color}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 6 }}
              isAnimationActive={true}
              animationDuration={200}
              animationBegin={0}
            />
          </LineChart>
        </ResponsiveContainer>
      </Box>
    </Box>
  );
};

export default EconomicChart; 