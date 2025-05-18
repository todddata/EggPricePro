import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { type StoreWithPrices, type Price } from "@shared/schema";
import { formatDate } from "@/lib/price-utils";

interface PriceHistoryChartProps {
  stores: StoreWithPrices[];
  selectedStoreId: string;
  eggType: string;
}

interface ChartDataPoint {
  date: string;
  [key: string]: string | number;
}

export default function PriceHistoryChart({ stores, selectedStoreId, eggType }: PriceHistoryChartProps) {
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  
  // If "all" is selected, we'll display average prices
  // Otherwise, fetch history for the specific store
  const { data: specificStoreHistory } = useQuery<Price[]>({
    queryKey: [`/api/stores/${selectedStoreId}/prices?eggType=${eggType}`],
    enabled: selectedStoreId !== "all",
  });
  
  // Process and format the chart data
  useEffect(() => {
    if (selectedStoreId === "all") {
      // Calculate average price per day across all stores
      const pricesByDate = new Map<string, number[]>();
      
      // Collect all prices by date
      stores.forEach(store => {
        if (store.priceHistory) {
          store.priceHistory
            .filter(price => price.eggType === eggType)
            .forEach(price => {
              const date = formatDate(new Date(price.recordedAt));
              const priceValue = Number(price.price);
              
              if (!pricesByDate.has(date)) {
                pricesByDate.set(date, []);
              }
              
              pricesByDate.get(date)?.push(priceValue);
            });
        }
      });
      
      // Calculate averages and format data for the chart
      const formattedData: ChartDataPoint[] = Array.from(pricesByDate.entries())
        .map(([date, prices]) => {
          const avgPrice = prices.reduce((sum, price) => sum + price, 0) / prices.length;
          return {
            date,
            'Average Price': parseFloat(avgPrice.toFixed(2))
          };
        })
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      
      setChartData(formattedData);
    } else if (specificStoreHistory) {
      // Format data for a specific store
      const selectedStore = stores.find(s => s.id === Number(selectedStoreId));
      
      if (selectedStore) {
        const formattedData = specificStoreHistory
          .map(price => ({
            date: formatDate(new Date(price.recordedAt)),
            [selectedStore.name]: Number(price.price)
          }))
          .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        
        setChartData(formattedData);
      }
    }
  }, [stores, selectedStoreId, specificStoreHistory, eggType]);
  
  if (chartData.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-gray-500">
        No price history data available.
      </div>
    );
  }
  
  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" />
          <YAxis 
            tickFormatter={(value) => `$${value.toFixed(2)}`}
            domain={['auto', 'auto']}
          />
          <Tooltip 
            formatter={(value: number) => [`$${value.toFixed(2)}`, selectedStoreId === "all" ? "Average Price" : stores.find(s => s.id === Number(selectedStoreId))?.name || "Price"]}
            labelFormatter={(label) => `Date: ${label}`}
          />
          <Legend />
          
          {selectedStoreId === "all" ? (
            <Line 
              type="monotone" 
              dataKey="Average Price" 
              stroke="#3B82F6" 
              activeDot={{ r: 8 }}
              strokeWidth={2}
            />
          ) : (
            <Line 
              type="monotone" 
              dataKey={stores.find(s => s.id === Number(selectedStoreId))?.name || "Price"} 
              stroke="#3B82F6" 
              activeDot={{ r: 8 }}
              strokeWidth={2}
            />
          )}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
