import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { getGoogleMapsDirectionsUrl } from "@/lib/map-utils";
import { formatDate } from "@/lib/price-utils";
import { type Store, type Price } from "@shared/schema";

interface StoreDetailsModalProps {
  storeId: number;
  eggType: string;
  onClose: () => void;
}

export default function StoreDetailsModal({ storeId, eggType, onClose }: StoreDetailsModalProps) {
  const [isOpen, setIsOpen] = useState(true);
  
  // Query store details
  const { data: storeData, isLoading: storeLoading } = useQuery<Store & { prices: { brown: number | null, white: number | null } }>({
    queryKey: [`/api/stores/${storeId}`],
  });
  
  // Query price history for both egg types
  const { data: brownPriceHistory, isLoading: brownHistoryLoading } = useQuery<Price[]>({
    queryKey: [`/api/stores/${storeId}/prices?eggType=brown`],
  });
  
  const { data: whitePriceHistory, isLoading: whiteHistoryLoading } = useQuery<Price[]>({
    queryKey: [`/api/stores/${storeId}/prices?eggType=white`],
  });
  
  // Format price history data for the chart
  const chartData = [
    ...(brownPriceHistory || []).map(price => ({
      date: formatDate(new Date(price.recordedAt)),
      brown: Number(price.price),
      white: undefined
    })),
    ...(whitePriceHistory || []).map(price => ({
      date: formatDate(new Date(price.recordedAt)),
      brown: undefined,
      white: Number(price.price)
    }))
  ]
  // Sort by date
  .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
  // Merge entries with the same date
  .reduce((acc, curr) => {
    const existingEntry = acc.find(item => item.date === curr.date);
    
    if (existingEntry) {
      if (curr.brown !== undefined) existingEntry.brown = curr.brown;
      if (curr.white !== undefined) existingEntry.white = curr.white;
      return acc;
    }
    
    return [...acc, curr];
  }, [] as Array<{date: string, brown?: number, white?: number}>);
  
  const isLoading = storeLoading || brownHistoryLoading || whiteHistoryLoading;
  
  const handleClose = () => {
    setIsOpen(false);
    onClose();
  };
  
  // If the modal is closed, don't render anything
  if (!isOpen) return null;
  
  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open) handleClose();
    }}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {isLoading ? "Loading..." : storeData?.name}
          </DialogTitle>
        </DialogHeader>
        
        {isLoading ? (
          <div className="py-8 flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : storeData && (
          <div className="py-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                {/* Placeholder for an egg display image */}
                <div className="bg-gray-100 w-full h-48 rounded-lg flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
              </div>
              
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Store Details</h4>
                <div className="space-y-3 text-sm">
                  <div className="flex">
                    <div className="w-24 text-gray-500">Address:</div>
                    <div>{storeData.address}, {storeData.city}, {storeData.state} {storeData.zipCode}</div>
                  </div>
                  
                  {storeData.hours && (
                    <div className="flex">
                      <div className="w-24 text-gray-500">Hours:</div>
                      <div>{storeData.hours}</div>
                    </div>
                  )}
                  
                  {storeData.phone && (
                    <div className="flex">
                      <div className="w-24 text-gray-500">Phone:</div>
                      <div>{storeData.phone}</div>
                    </div>
                  )}
                  
                  {storeData.website && (
                    <div className="flex">
                      <div className="w-24 text-gray-500">Website:</div>
                      <div>
                        <a 
                          href={storeData.website.startsWith('http') ? storeData.website : `https://${storeData.website}`} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="text-primary hover:text-primary/80"
                        >
                          Visit Website
                        </a>
                      </div>
                    </div>
                  )}
                </div>
                
                <h4 className="font-semibold text-gray-900 mt-4 mb-2">Current Egg Prices</h4>
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
              </div>
            </div>
            
            <div className="mt-6">
              <h4 className="font-semibold text-gray-900 mb-3">Price Trend (Last 30 Days)</h4>
              {chartData.length > 0 ? (
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis 
                        tickFormatter={(value) => `$${value.toFixed(2)}`}
                        domain={['auto', 'auto']}
                      />
                      <Tooltip 
                        formatter={(value: number) => [`$${value.toFixed(2)}`, ""]}
                        labelFormatter={(label) => `Date: ${label}`}
                      />
                      <Line 
                        name="Brown Eggs" 
                        type="monotone" 
                        dataKey="brown" 
                        stroke="#92400E" 
                        strokeWidth={2}
                        connectNulls={true}
                      />
                      <Line 
                        name="White Eggs" 
                        type="monotone" 
                        dataKey="white" 
                        stroke="#3B82F6" 
                        strokeWidth={2}
                        connectNulls={true}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-48 flex items-center justify-center text-gray-500">
                  No price history data available.
                </div>
              )}
            </div>
          </div>
        )}
        
        <DialogFooter className="flex justify-between sm:justify-between">
          <Button asChild>
            <a 
              href={storeData ? getGoogleMapsDirectionsUrl(storeData.address, storeData.city, storeData.state, storeData.zipCode) : "#"} 
              target="_blank" 
              rel="noopener noreferrer"
            >
              Get Directions
            </a>
          </Button>
          <Button variant="outline" onClick={handleClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
