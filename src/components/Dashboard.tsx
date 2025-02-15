import React, { useEffect, useState } from 'react';
import { 
  Box, 
  Container, 
  Heading, 
  useToast, 
  Flex,
  VStack,
  Button,
  Text,
  ButtonGroup,
} from '@chakra-ui/react';
import EconomicChart from './EconomicChart';
import { fetchFredData, SERIES_IDS, FredObservation } from '../services/fredApi';

interface ChartData {
  [key: string]: {
    data: FredObservation[];
    isLoading: boolean;
    error?: string;
  };
}

type TimeRange = '1Y' | '5Y' | 'ALL';

// Add type safety for the indicator keys
type IndicatorKey = keyof typeof SERIES_IDS;

const formatTitle = (key: string): string => {
  // Special case for GDP
  if (key === 'GDP') return 'GDP';
  
  return key.replace(/_/g, ' ').split(' ').map(word => 
    word.charAt(0) + word.slice(1).toLowerCase()
  ).join(' ');
};

const getStartDate = (range: TimeRange): string => {
  const now = new Date();
  switch (range) {
    case '1Y':
      return new Date(now.setFullYear(now.getFullYear() - 1)).toISOString().split('T')[0];
    case '5Y':
      return new Date(now.setFullYear(now.getFullYear() - 5)).toISOString().split('T')[0];
    default:
      return '2020-01-01'; // Default start date for 'ALL'
  }
};

const Dashboard = () => {
  const [chartData, setChartData] = useState<ChartData>({});
  const [selectedIndicator, setSelectedIndicator] = useState<IndicatorKey>('GDP');
  const [selectedTimeRange, setSelectedTimeRange] = useState<TimeRange>('ALL');
  const toast = useToast();

  useEffect(() => {
    const fetchAllData = async () => {
      // Initialize all charts as loading
      const initialState: ChartData = {};
      Object.keys(SERIES_IDS).forEach(name => {
        initialState[name] = { data: [], isLoading: true, error: undefined };
      });
      setChartData(initialState);

      // Fetch data for each indicator
      for (const [name, seriesId] of Object.entries(SERIES_IDS)) {
        try {
          console.log(`Starting fetch for ${name}`);
          const data = await fetchFredData(seriesId, getStartDate(selectedTimeRange));
          
          if (data.length === 0) {
            throw new Error('No data available for this indicator');
          }

          console.log(`Successfully fetched ${data.length} points for ${name}`);
          setChartData(prev => ({
            ...prev,
            [name]: { data, isLoading: false, error: undefined },
          }));
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Failed to load data';
          console.error(`Error fetching ${name} data:`, error);
          
          toast({
            title: `Error Loading ${name}`,
            description: errorMessage,
            status: 'error',
            duration: 5000,
            isClosable: true,
            position: 'top-right',
          });

          setChartData(prev => ({
            ...prev,
            [name]: { 
              data: [], 
              isLoading: false, 
              error: errorMessage 
            },
          }));
        }
      }
    };

    fetchAllData();
  }, [toast, selectedTimeRange]);

  const handleTimeRangeChange = (range: TimeRange) => {
    setSelectedTimeRange(range);
    // Data will be refetched due to the useEffect dependency on selectedTimeRange
  };

  return (
    <Container maxW="container.xl" py={8}>
      <Heading as="h1" mb={8} textAlign="center">
        Macroeconomic Dashboard
      </Heading>
      <Flex gap={8}>
        {/* Sidebar */}
        <Box w="250px" borderRight="1px" borderColor="gray.200" pr={4}>
          <VStack spacing={3} align="stretch">
            <Text fontWeight="bold" mb={2}>Economic Indicators</Text>
            {Object.entries(SERIES_IDS).map(([key, _]) => (
              <Button
                key={key}
                variant={selectedIndicator === key ? "solid" : "ghost"}
                colorScheme={selectedIndicator === key ? "blue" : "gray"}
                justifyContent="flex-start"
                onClick={() => setSelectedIndicator(key as IndicatorKey)}
                leftIcon={
                  <Box w="3px" h="16px" bg={selectedIndicator === key ? "blue.500" : "transparent"} />
                }
              >
                {formatTitle(key)}
              </Button>
            ))}
          </VStack>
        </Box>

        {/* Main Content */}
        <Box flex={1}>
          <Flex mb={4} justify="flex-end">
            <ButtonGroup size="sm" isAttached variant="outline">
              <Button
                onClick={() => handleTimeRangeChange('1Y')}
                colorScheme={selectedTimeRange === '1Y' ? 'blue' : 'gray'}
              >
                1 Year
              </Button>
              <Button
                onClick={() => handleTimeRangeChange('5Y')}
                colorScheme={selectedTimeRange === '5Y' ? 'blue' : 'gray'}
              >
                5 Years
              </Button>
              <Button
                onClick={() => handleTimeRangeChange('ALL')}
                colorScheme={selectedTimeRange === 'ALL' ? 'blue' : 'gray'}
              >
                All
              </Button>
            </ButtonGroup>
          </Flex>
          <EconomicChart
            title={formatTitle(selectedIndicator)}
            data={chartData[selectedIndicator]?.data || []}
            isLoading={chartData[selectedIndicator]?.isLoading ?? true}
            error={chartData[selectedIndicator]?.error}
            seriesId={SERIES_IDS[selectedIndicator]}
            color={getChartColor(selectedIndicator)}
          />
        </Box>
      </Flex>
    </Container>
  );
};

const getChartColor = (name: string): string => {
  const colors: { [key: string]: string } = {
    GDP: '#2B6CB0',
    UNEMPLOYMENT: '#C53030',
    INFLATION: '#805AD5',
    FEDERAL_FUNDS_RATE: '#38A169',
    TREASURY_10Y: '#DD6B20',
    MORTGAGE_30Y: '#319795',
    SP500: '#3182CE',
    BITCOIN: '#E53E3E',
  };
  return colors[name] || '#2B6CB0';
};

export default Dashboard; 