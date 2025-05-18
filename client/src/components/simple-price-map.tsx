import { useEffect, useRef } from "react";
import { Card } from "@/components/ui/card";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import { getPriceColor } from "@/lib/price-utils";
import { getGoogleMapsDirectionsUrl } from "@/lib/map-utils";
import type { StoreWithPrices } from "@shared/schema";

interface PriceMapProps {
  stores: StoreWithPrices[];
  minPrice: number;
  maxPrice: number;
  onStoreSelect: (storeId: number) => void;
}

// Add a Legend control component that appears on the map
function MapLegend({ minPrice, maxPrice }: { minPrice: number; maxPrice: number }) {
  const map = useMap();
  const legendRef = useRef<L.Control | null>(null);
  
  useEffect(() => {
    if (legendRef.current) {
      legendRef.current.remove();
    }
    
    const legend = new L.Control({ position: 'bottomright' });
    legend.onAdd = function() {
      const div = L.DomUtil.create('div', 'info legend');
      div.innerHTML = `
        <div style="background: white; padding: 10px; border-radius: 4px; box-shadow: 0 1px 5px rgba(0,0,0,0.2);">
          <div style="font-weight: bold; margin-bottom: 6px;">Price Range</div>
          <div style="display: flex; align-items: center; gap: 6px;">
            <div style="width: 18px; height: 18px; border-radius: 50%; background-color: #10B981;"></div>
            <span>$${minPrice.toFixed(2)}</span>
            <div style="width: 50px; height: 4px; background: linear-gradient(to right, #10B981, #FBBF24, #EF4444);"></div>
            <div style="width: 18px; height: 18px; border-radius: 50%; background-color: #EF4444;"></div>
            <span>$${maxPrice.toFixed(2)}</span>
          </div>
        </div>
      `;
      return div;
    };
    
    legend.addTo(map);
    legendRef.current = legend;
    
    return () => {
      if (legendRef.current) {
        legendRef.current.remove();
      }
    };
  }, [map, minPrice, maxPrice]);
  
  return null;
}

// Component to fit map bounds to store markers
function FitBounds({ stores }: { stores: StoreWithPrices[] }) {
  const map = useMap();
  
  useEffect(() => {
    if (stores.length === 0) return;
    
    try {
      const points = stores.map(store => [
        Number(store.latitude), 
        Number(store.longitude)
      ] as [number, number]);
      
      const bounds = L.latLngBounds(points);
      map.fitBounds(bounds, { padding: [50, 50] });
    } catch (error) {
      console.error("Failed to fit bounds:", error);
    }
  }, [map, stores]);
  
  return null;
}

export default function SimplePriceMap({ stores, minPrice, maxPrice, onStoreSelect }: PriceMapProps) {
  // Get default center location
  const center = stores.length > 0 
    ? [Number(stores[0].latitude), Number(stores[0].longitude)] 
    : [39.8283, -98.5795]; // Default US center
  
  // Create unique key for map to ensure it completely re-renders when data changes
  const zipCode = stores.length > 0 ? stores[0].zipCode : "default";
  const mapKey = `map-${zipCode}-${Date.now()}`;
  
  return (
    <Card className="overflow-hidden">
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold">Price Map for {zipCode}</h2>
        <p className="text-sm text-gray-500">
          Showing {stores.length} stores with egg prices
        </p>
      </div>
      
      <div className="h-[500px] w-full relative">
        <MapContainer 
          key={mapKey}
          center={center as [number, number]} 
          zoom={10}
          style={{ height: "100%", width: "100%" }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          
          {/* Fit bounds to markers */}
          <FitBounds stores={stores} />
          
          {/* Add markers for stores */}
          {stores.map(store => {
            // Create price-colored marker
            const priceColor = getPriceColor(store.currentPrice || 0, minPrice, maxPrice);
            const markerHtml = `
              <div style="
                background-color: ${priceColor}; 
                width: 48px; 
                height: 48px; 
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                color: white;
                font-weight: bold;
                border: 2px solid white;
                box-shadow: 0 2px 4px rgba(0,0,0,0.3);
              ">
                $${(store.currentPrice || 0).toFixed(2)}
              </div>
            `;
            
            const icon = L.divIcon({
              html: markerHtml,
              className: "",
              iconSize: [48, 48],
              iconAnchor: [24, 24],
              popupAnchor: [0, -24]
            });
            
            return (
              <Marker
                key={store.id}
                position={[Number(store.latitude), Number(store.longitude)]}
                icon={icon}
                eventHandlers={{
                  click: () => onStoreSelect(store.id)
                }}
              >
                <Popup>
                  <div className="p-2 min-w-[200px]">
                    <h3 className="font-semibold">{store.name}</h3>
                    <p className="text-sm text-gray-600">
                      {store.address}, {store.city}
                    </p>
                    <p className="text-sm font-medium mt-1">
                      Price: ${(store.currentPrice || 0).toFixed(2)}
                    </p>
                    <div className="mt-2 flex justify-between">
                      <button
                        onClick={() => onStoreSelect(store.id)}
                        className="text-sm text-primary hover:underline"
                      >
                        View Details
                      </button>
                      <a
                        href={getGoogleMapsDirectionsUrl(
                          store.address,
                          store.city,
                          store.state,
                          store.zipCode
                        )}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-primary hover:underline"
                      >
                        Get Directions
                      </a>
                    </div>
                  </div>
                </Popup>
              </Marker>
            );
          })}
          
          {/* Add legend */}
          <MapLegend minPrice={minPrice} maxPrice={maxPrice} />
        </MapContainer>
      </div>
    </Card>
  );
}