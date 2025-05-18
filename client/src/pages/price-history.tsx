import { useQuery } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import { useState } from "react";
import { type Store, type Price } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, MapPin, Phone, Globe, Clock, AlertCircle } from "lucide-react";
import { getGoogleMapsDirectionsUrl } from "@/lib/map-utils";
import { formatDate } from "@/lib/price-utils";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

export default function PriceHistory() {
  const { storeId } = useParams();
  const [eggType, setEggType] = useState<"brown" | "white">("brown");
  
  // Query store details
  const { data: storeData, isLoading: storeLoading, isError: storeError } = useQuery<Store & { prices: { brown: number | null, white: number | null } }>({
    queryKey: [`/api/stores/${storeId}`],
  });
  
  // Query price history
  const { data: priceHistory, isLoading: historyLoading, isError: historyError } = useQuery<Price[]>({
    queryKey: [`/api/stores/${storeId}/prices?eggType=${eggType}`],
  });
  
  // Format price history data for the chart
  const chartData = priceHistory?.map(price => ({
    date: formatDate(new Date(price.recordedAt)),
    price: Number(price.price)
  })) || [];
  
  // Find min and max prices
  const prices = chartData.map(data => data.price);
  const minPrice = prices.length > 0 ? Math.min(...prices) : 0;
  const minPriceDate = prices.length > 0 ? 
    chartData.find(data => data.price === minPrice)?.date : null;
  
  const maxPrice = prices.length > 0 ? Math.max(...prices) : 0;
  const maxPriceDate = prices.length > 0 ? 
    chartData.find(data => data.price === maxPrice)?.date : null;
  
  // Calculate average price
  const avgPrice = prices.length > 0 ? 
    prices.reduce((sum, price) => sum + price, 0) / prices.length : 0;
  
  const isLoading = storeLoading || historyLoading;
  const isError = storeError || historyError;
  
  if (isLoading) {
    return <div className="flex justify-center py-12">Loading...</div>;
  }
  
  if (isError || !storeData) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center space-x-2 text-red-500">
            <AlertCircle />
            <p>Error loading store data</p>
          </div>
          <Button className="mt-4" asChild>
            <Link to="/">Return Home</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <div className="space-y-6">
      <div className="flex items-center">
        <Button variant="ghost" asChild className="mr-2">
          <Link to="/">
            <ArrowLeft className="mr-1 h-4 w-4" />
            Back
          </Link>
        </Button>
        <h1 className="text-2xl font-bold">Price History</h1>
      </div>
      
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-xl">{storeData.name}</CardTitle>
          <div className="flex items-center text-sm text-muted-foreground">
            <MapPin className="mr-1 h-4 w-4" />
            <span>{storeData.address}, {storeData.city}, {storeData.state} {storeData.zipCode}</span>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-medium text-lg mb-2">Store Information</h3>
              <div className="space-y-2 text-sm">
                {storeData.phone && (
                  <div className="flex items-center">
                    <Phone className="mr-2 h-4 w-4 text-muted-foreground" />
                    <span>{storeData.phone}</span>
                  </div>
                )}
                {storeData.website && (
                  <div className="flex items-center">
                    <Globe className="mr-2 h-4 w-4 text-muted-foreground" />
                    <a 
                      href={storeData.website.startsWith('http') ? storeData.website : `https://${storeData.website}`} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-primary hover:underline"
                    >
                      Visit Website
                    </a>
                  </div>
                )}
                {storeData.hours && (
                  <div className="flex items-center">
                    <Clock className="mr-2 h-4 w-4 text-muted-foreground" />
                    <span>{storeData.hours}</span>
                  </div>
                )}
              </div>
              
              <h3 className="font-medium text-lg mt-4 mb-2">Current Prices</h3>
              <div className="space-y-2">
                <div className="flex justify-between py-1 border-b border-gray-100">
                  <span>Brown Cage-Free Large (dozen)</span>
                  <span className="font-medium">
                    {storeData.prices.brown ? `$${storeData.prices.brown.toFixed(2)}` : 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-gray-100">
                  <span>White Cage-Free Large (dozen)</span>
                  <span className="font-medium">
                    {storeData.prices.white ? `$${storeData.prices.white.toFixed(2)}` : 'N/A'}
                  </span>
                </div>
              </div>
              
              <div className="mt-4">
                <Button className="w-full" asChild>
                  <a 
                    href={getGoogleMapsDirectionsUrl(storeData.address, storeData.city, storeData.state, storeData.zipCode)} 
                    target="_blank" 
                    rel="noopener noreferrer"
                  >
                    Get Directions
                  </a>
                </Button>
              </div>
            </div>
            
            <div>
              <Tabs defaultValue="brown" onValueChange={(value) => setEggType(value as "brown" | "white")}>
                <div className="flex justify-between items-center mb-2">
                  <h3 className="font-medium text-lg">Price History</h3>
                  <TabsList>
                    <TabsTrigger value="brown">Brown</TabsTrigger>
                    <TabsTrigger value="white">White</TabsTrigger>
                  </TabsList>
                </div>
                
                <TabsContent value="brown">
                  <PriceHistoryContent 
                    chartData={chartData} 
                    avgPrice={avgPrice}
                    minPrice={minPrice}
                    minPriceDate={minPriceDate}
                    maxPrice={maxPrice}
                    maxPriceDate={maxPriceDate}
                  />
                </TabsContent>
                
                <TabsContent value="white">
                  <PriceHistoryContent 
                    chartData={chartData} 
                    avgPrice={avgPrice}
                    minPrice={minPrice}
                    minPriceDate={minPriceDate}
                    maxPrice={maxPrice}
                    maxPriceDate={maxPriceDate}
                  />
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

interface PriceHistoryContentProps {
  chartData: Array<{ date: string; price: number }>;
  avgPrice: number;
  minPrice: number;
  minPriceDate: string | null;
  maxPrice: number;
  maxPriceDate: string | null;
}

function PriceHistoryContent({ 
  chartData, 
  avgPrice, 
  minPrice, 
  minPriceDate, 
  maxPrice, 
  maxPriceDate 
}: PriceHistoryContentProps) {
  if (chartData.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No price history data available yet.
      </div>
    );
  }
  
  return (
    <div>
      <div className="h-64 mt-4">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="date" 
              tickFormatter={(value) => value.split(' ')[0]} 
              tick={{ fontSize: 12 }}
            />
            <YAxis 
              tickFormatter={(value) => `$${value.toFixed(2)}`}
              domain={['auto', 'auto']}
              tick={{ fontSize: 12 }}
            />
            <Tooltip 
              formatter={(value: number) => [`$${value.toFixed(2)}`, "Price"]}
              labelFormatter={(label) => `Date: ${label}`}
            />
            <Line 
              type="monotone" 
              dataKey="price" 
              stroke="#3B82F6" 
              strokeWidth={2}
              dot={{ r: 4 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
      
      <div className="mt-4 space-y-3">
        <div className="bg-gray-50 p-3 rounded-lg">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">Average Price</span>
            <span className="text-sm">${avgPrice.toFixed(2)}</span>
          </div>
        </div>
        
        <div className="bg-gray-50 p-3 rounded-lg">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">Lowest Price</span>
            <span className="text-sm">${minPrice.toFixed(2)}{minPriceDate ? ` - ${minPriceDate}` : ''}</span>
          </div>
        </div>
        
        <div className="bg-gray-50 p-3 rounded-lg">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">Highest Price</span>
            <span className="text-sm">${maxPrice.toFixed(2)}{maxPriceDate ? ` - ${maxPriceDate}` : ''}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
