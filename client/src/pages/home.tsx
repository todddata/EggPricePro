import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import SearchForm from "@/components/search-form";
// Import our radius-aware map component specifically designed to handle radius changes
import RadiusAwareMap from "@/components/radius-aware-map";
import PriceTable from "@/components/price-table";
import StoreDetailsModal from "@/components/store-details-modal";
import PriceHistoryChart from "@/components/price-history-chart";
import FeaturedStores from "@/components/featured-stores";
import EggInfoSection from "@/components/egg-info-section";
import { type SearchResultsResponse } from "@shared/schema";

// This is a test comment #3

export default function Home() {
  // Form state
  const [zipCode, setZipCode] = useState("94110");
  const [radius, setRadius] = useState(5);
  const [eggType, setEggType] = useState<"brown" | "white">("brown");
  
  // Selected store for modal
  const [selectedStoreId, setSelectedStoreId] = useState<number | null>(null);
  
  // Store for price history chart
  const [historyStoreId, setHistoryStoreId] = useState<string>("all");
  
  // Stable query key to prevent infinite requests
  const { data: searchResults, isLoading, isError, error, refetch } = useQuery<SearchResultsResponse>({
    queryKey: ["prices", zipCode, radius, eggType],
    queryFn: async () => {
      console.log(`Fetching data for zip code: ${zipCode}, radius: ${radius}, egg type: ${eggType}`);
      const response = await fetch(
        `/api/prices?zipCode=${zipCode}&radius=${radius}&eggType=${eggType}`,
        { cache: 'no-store' }
      );
      if (!response.ok) {
        throw new Error('Failed to fetch prices');
      }
      return response.json();
    },
    enabled: zipCode.length === 5 && radius >= 1 && radius <= 20,
    staleTime: 0, // Consider data stale immediately
  });
  
  // Handle search submission
  const handleSearch = (newZipCode: string, newRadius: number, newEggType: "brown" | "white") => {
    console.log("Home page received search:", { newZipCode, newRadius, newEggType });
    
    // Update state with new search parameters
    setZipCode(newZipCode);
    setRadius(newRadius);
    setEggType(newEggType);
    
    // Force a complete reset of the query cache for prices
    queryClient.invalidateQueries({ queryKey: ["prices"] });
    queryClient.resetQueries({ queryKey: ["prices"] });
    
    // Refetch data with the new parameters
    setTimeout(() => {
      refetch().catch(err => {
        console.error("Error when refetching data:", err);
      });
    }, 100);
  };
  
  // Handle store selection for modal
  const handleStoreSelect = (storeId: number) => {
    setSelectedStoreId(storeId);
  };
  
  // Handle store selection for price history chart
  const handleHistoryStoreChange = (storeId: string) => {
    setHistoryStoreId(storeId);
  };
  
  return (
    <>
      <div className="mb-4">
        <SearchForm 
          initialZipCode={zipCode}
          initialRadius={radius}
          initialEggType={eggType}
          onSearch={handleSearch}
        />

      </div>
      
      {isLoading && (
        <div className="text-center py-12">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]"></div>
          <p className="mt-2 text-gray-600">Loading egg prices...</p>
        </div>
      )}
      
      {isError && (
        <div className="text-center py-12">
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            <p className="font-medium">Error loading egg prices</p>
            <p className="text-sm">{(error as Error)?.message || 'Please try a different search'}</p>
          </div>
        </div>
      )}
      
      {searchResults && searchResults.stores.length > 0 && (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
            <div className="lg:col-span-2">
              <RadiusAwareMap 
                stores={searchResults.stores}
                minPrice={searchResults.minPrice || 0}
                maxPrice={searchResults.maxPrice || 0}
                onStoreSelect={handleStoreSelect}
              />
            </div>
            
            <div className="lg:col-span-1">
              <PriceTable 
                stores={searchResults.stores}
                minPrice={searchResults.minPrice || 0}
                maxPrice={searchResults.maxPrice || 0}
                eggType={eggType}
                onStoreSelect={handleStoreSelect}
              />
            </div>
          </div>
          
          <div className="mt-6 bg-white rounded-lg shadow-sm p-6">
            <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
              <h2 className="text-lg font-semibold">Price History</h2>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-500">Select store:</span>
                <select 
                  className="text-sm border border-gray-300 rounded-md p-1"
                  value={historyStoreId}
                  onChange={(e) => handleHistoryStoreChange(e.target.value)}
                >
                  <option value="all">All Stores (Average)</option>
                  {searchResults.stores.map(store => (
                    <option key={store.id} value={String(store.id)}>{store.name}</option>
                  ))}
                </select>
              </div>
            </div>
            
            <PriceHistoryChart 
              stores={searchResults.stores}
              selectedStoreId={historyStoreId}
              eggType={eggType}
            />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-sm font-semibold text-gray-700 mb-2">Average Price Trend</h3>
                <p className="text-sm text-gray-600">
                  {searchResults.stores.some(s => s.priceHistory && s.priceHistory.length > 1) ? (
                    <>
                      Egg prices have varied over the last 30 days in this area.
                      Check individual store histories for detailed trends.
                    </>
                  ) : (
                    <>Price history data is being collected. Check back soon for trend analysis.</>
                  )}
                </p>
              </div>
              
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-sm font-semibold text-gray-700 mb-2">Best Value Stores</h3>
                <div className="space-y-2">
                  {searchResults.stores
                    .filter(store => store.currentPrice !== null)
                    .sort((a, b) => (a.currentPrice || 0) - (b.currentPrice || 0))
                    .slice(0, 2)
                    .map(store => (
                      <div key={store.id} className="flex justify-between">
                        <span className="text-sm">{store.name}</span>
                        <span className="text-sm font-medium text-primary-dark">
                          ${store.currentPrice?.toFixed(2)}
                        </span>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          </div>
          
          <FeaturedStores stores={searchResults.stores} />
          
          <EggInfoSection />
        </>
      )}

      {searchResults && searchResults.stores.length === 0 && (
        <div className="text-center py-12">
          <p className="text-lg text-gray-700">No stores found within {radius} miles of {zipCode}.</p>
          <p className="text-sm text-gray-500 mt-2">Try increasing the search radius or searching a different zip code.</p>
        </div>
      )}
      
      {/* Store details modal */}
      {selectedStoreId !== null && (
        <StoreDetailsModal
          storeId={selectedStoreId}
          eggType={eggType}
          onClose={() => setSelectedStoreId(null)}
        />
      )}
    </>
  );
}
