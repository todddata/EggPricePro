import { Card } from "@/components/ui/card";
import { Link } from "wouter";
import { getPriceColor } from "@/lib/price-utils";
import { type StoreWithPrices } from "@shared/schema";
import { LineChart } from "lucide-react";

interface PriceTableProps {
  stores: StoreWithPrices[];
  minPrice: number;
  maxPrice: number;
  eggType: string;
  onStoreSelect: (storeId: number) => void;
}

export default function PriceTable({ stores, minPrice, maxPrice, eggType, onStoreSelect }: PriceTableProps) {
  // Sort stores by price (lowest first)
  const sortedStores = [...stores].sort((a, b) => {
    if (a.currentPrice === null) return 1;
    if (b.currentPrice === null) return -1;
    return a.currentPrice - b.currentPrice;
  });
  
  return (
    <Card className="bg-white rounded-lg shadow-sm h-full">
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold">Price Listing for {stores.length > 0 && stores[0].zipCode ? stores[0].zipCode : "94110"}</h2>
        <p className="text-sm text-gray-500">
          {eggType === "brown" ? "Brown" : "White"} Cage-Free Large Eggs
        </p>
      </div>
      
      <div className="p-2 max-h-[465px] overflow-y-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Store
              </th>
              <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Price
              </th>
              <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                History
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {sortedStores.map(store => (
              <tr 
                key={store.id} 
                className="hover:bg-gray-50 cursor-pointer" 
                onClick={() => onStoreSelect(store.id)}
              >
                <td className="px-3 py-3 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">{store.name}</div>
                  <div className="text-xs text-gray-500">{store.address}</div>
                </td>
                <td className="px-3 py-3 whitespace-nowrap">
                  {store.currentPrice !== null ? (
                    <PriceBadge 
                      price={store.currentPrice} 
                      minPrice={minPrice} 
                      maxPrice={maxPrice} 
                    />
                  ) : (
                    <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                      N/A
                    </span>
                  )}
                </td>
                <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-500">
                  <Link to={`/price-history/${store.id}`}>
                    <button className="text-primary hover:text-primary/80">
                      <LineChart className="h-5 w-5" />
                    </button>
                  </Link>
                </td>
              </tr>
            ))}
            
            {sortedStores.length === 0 && (
              <tr>
                <td colSpan={3} className="px-3 py-4 text-center text-sm text-gray-500">
                  No stores found with price data.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

interface PriceBadgeProps {
  price: number;
  minPrice: number;
  maxPrice: number;
}

function PriceBadge({ price, minPrice, maxPrice }: PriceBadgeProps) {
  const getBackgroundColor = () => {
    const priceColor = getPriceColor(price, minPrice, maxPrice);
    
    if (price === minPrice || Math.abs(price - minPrice) < 0.1) {
      return "bg-green-100 text-green-800";
    } else if (price === maxPrice || Math.abs(price - maxPrice) < 0.1) {
      return "bg-red-100 text-red-800";
    } else {
      // For middle prices
      return "bg-yellow-100 text-yellow-800";
    }
  };
  
  return (
    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getBackgroundColor()}`}>
      ${price.toFixed(2)}
    </span>
  );
}
