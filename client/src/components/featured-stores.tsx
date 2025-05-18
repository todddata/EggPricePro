import { Card, CardContent } from "@/components/ui/card";
import { getGoogleMapsDirectionsUrl } from "@/lib/map-utils";
import { type StoreWithPrices } from "@shared/schema";

interface FeaturedStoresProps {
  stores: StoreWithPrices[];
}

export default function FeaturedStores({ stores }: FeaturedStoresProps) {
  // Sort stores by price (lowest first)
  const sortedStores = [...stores]
    .filter(store => store.currentPrice !== null)
    .sort((a, b) => {
      if (a.currentPrice === null) return 1;
      if (b.currentPrice === null) return -1;
      return a.currentPrice - b.currentPrice;
    })
    .slice(0, 4); // Take the top 4
  
  if (sortedStores.length === 0) {
    return null;
  }
  
  return (
    <div className="mt-6">
      <h2 className="text-lg font-semibold mb-4">Featured Stores</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {sortedStores.map((store, index) => (
          <Card key={store.id} className="overflow-hidden hover:shadow-md transition-shadow">
            {/* Store image - Using a placeholder image */}
            <div className="h-36 bg-gray-100 relative">
              <StoreImage index={index} />
            </div>
            
            <CardContent className="p-4">
              <h3 className="font-semibold">{store.name}</h3>
              <p className="text-sm text-gray-500">{store.address}</p>
              <div className="mt-2 flex justify-between items-center">
                <span className={`px-2 py-1 ${getPriceBadgeColor(index)} text-xs font-semibold rounded-full`}>
                  ${store.currentPrice?.toFixed(2)}
                </span>
                <a 
                  href={getGoogleMapsDirectionsUrl(store.address, store.city, store.state, store.zipCode)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:text-primary/80 text-sm"
                >
                  Get Directions
                </a>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function getPriceBadgeColor(index: number): string {
  const colors = [
    "bg-green-100 text-green-800",   // Lowest price
    "bg-green-100 text-green-800",   // Second lowest
    "bg-yellow-100 text-yellow-800", // Third
    "bg-red-100 text-red-800",       // Fourth
  ];
  
  return colors[index] || colors[0];
}

function StoreImage({ index }: { index: number }) {
  // SVG placeholder for store fronts
  const storeSvgs = [
    // Storefront 1
    <svg key="store1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-full h-full text-gray-400 p-8">
      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 21v-7.5a.75.75 0 01.75-.75h3a.75.75 0 01.75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349m-16.5 11.65V9.35m0 0a3.001 3.001 0 003.75-.615A2.993 2.993 0 009.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 002.25 1.016c.896 0 1.7-.393 2.25-1.016a3.001 3.001 0 003.75.614m-16.5 0a3.004 3.004 0 01-.621-4.72L4.318 3.44A1.5 1.5 0 015.378 3h13.243a1.5 1.5 0 011.06.44l1.19 1.189a3 3 0 01-.621 4.72m-13.5 8.65h3.75a.75.75 0 00.75-.75V13.5a.75.75 0 00-.75-.75H6.75a.75.75 0 00-.75.75v3.75c0 .415.336.75.75.75z" />
    </svg>,
    
    // Storefront 2
    <svg key="store2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-full h-full text-gray-400 p-8">
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3.75h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008z" />
    </svg>,
    
    // Storefront 3
    <svg key="store3" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-full h-full text-gray-400 p-8">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
    </svg>,
    
    // Storefront 4
    <svg key="store4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-full h-full text-gray-400 p-8">
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 21v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21m0 0h4.5V3.545M12.75 21h7.5V10.75M2.25 21h1.5m18 0h-18M2.25 9l4.5-1.636M18.75 3l-1.5.545m0 6.205l3 1m1.5.5l-1.5-.5M6.75 7.364V3h-3v18m3-13.636l10.5-3.819" />
    </svg>
  ];
  
  // Return the appropriate SVG based on index, or the first one as default
  return storeSvgs[index % storeSvgs.length] || storeSvgs[0];
}
