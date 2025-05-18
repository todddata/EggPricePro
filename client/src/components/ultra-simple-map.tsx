import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import { getPriceColor } from "@/lib/price-utils";
import { getGoogleMapsDirectionsUrl } from "@/lib/map-utils";
import type { StoreWithPrices } from "@shared/schema";

// Map Container Styles
const mapStyles = {
  height: "500px",
  width: "100%"
};

// Direct CSS for price markers
const markerStyle = `
.price-marker {
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  color: white;
  font-weight: bold;
  border: 2px solid white;
  box-shadow: 0 2px 5px rgba(0,0,0,0.3);
}
`;

interface MapProps {
  stores: StoreWithPrices[];
  minPrice: number;
  maxPrice: number;
  onStoreSelect: (storeId: number) => void;
}

// Ultra simple map component that focuses solely on correctly handling zoom levels
export default function UltraSimpleMap({ stores, minPrice, maxPrice, onStoreSelect }: MapProps) {
  // Only initialize the map when we actually have data
  const [mapKey, setMapKey] = useState(`map-${Date.now()}`);
  
  // Track whether the map has been created yet
  const [mapReady, setMapReady] = useState(false);
  
  // Get zip code for display
  const zipCode = stores.length > 0 ? stores[0].zipCode : "No Data";
  
  // When stores or zip code changes, force a complete map recreation
  useEffect(() => {
    setMapKey(`map-${zipCode}-${Date.now()}`);
    setMapReady(false);
    
    // Short delay to ensure DOM is ready
    const timer = setTimeout(() => {
      setMapReady(true);
    }, 100);
    
    return () => clearTimeout(timer);
  }, [zipCode, stores.length]);
  
  // If no stores, show a placeholder
  if (stores.length === 0) {
    return (
      <Card className="overflow-hidden">
        <div className="p-4 border-b">
          <h2 className="text-lg font-medium">Price Map</h2>
          <p className="text-sm text-gray-500">No stores found in this area</p>
        </div>
        <div className="h-[500px] bg-gray-100 flex items-center justify-center">
          <p className="text-gray-500">No store data available</p>
        </div>
      </Card>
    );
  }
  
  return (
    <Card className="overflow-hidden">
      <style>{markerStyle}</style>
      
      <div className="p-4 border-b">
        <h2 className="text-lg font-medium">Price Map for {zipCode}</h2>
        <p className="text-sm text-gray-500">
          Showing {stores.length} stores with egg prices
        </p>
      </div>
      
      <div className="relative" style={{ height: "500px" }}>
        {mapReady && (
          <MapContainer
            key={mapKey}
            center={[Number(stores[0].latitude), Number(stores[0].longitude)]}
            zoom={12}
            style={mapStyles}
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            />
            
            {/* Map controller that handles bounds */}
            <MapController stores={stores} />
            
            {/* Add markers for each store */}
            {stores.map(store => (
              <StoreMarker
                key={store.id}
                store={store}
                minPrice={minPrice}
                maxPrice={maxPrice}
                onStoreSelect={onStoreSelect}
              />
            ))}
            
            {/* Legend */}
            <MapLegend minPrice={minPrice} maxPrice={maxPrice} />
          </MapContainer>
        )}
        
        {!mapReady && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
            <p>Loading map...</p>
          </div>
        )}
      </div>
    </Card>
  );
}

// Controller component that handles bounds
function MapController({ stores }: { stores: StoreWithPrices[] }) {
  const map = useMap();
  
  // Create a key that changes when store coordinates change
  const storesKey = stores.map(s => `${s.id}-${s.latitude}-${s.longitude}`).join('|');
  
  useEffect(() => {
    console.log(`Setting bounds for ${stores.length} stores`);
    
    // Create points array from store coordinates
    const points = stores.map(store => {
      const lat = Number(store.latitude);
      const lng = Number(store.longitude);
      return [lat, lng] as [number, number];
    });
    
    // Create bounds and set map view
    try {
      // First invalidate size to ensure proper dimensions
      map.invalidateSize(true);
      
      // Create bounds with padding
      const bounds = L.latLngBounds(points);
      const padding = [100, 100];
      
      // Apply bounds with animation
      setTimeout(() => {
        map.fitBounds(bounds, {
          padding: padding,
          animate: true,
          maxZoom: 14
        });
      }, 200);
    } catch (err) {
      console.error("Error setting map bounds:", err);
    }
    
    return () => {
      // Cleanup if needed
    };
  }, [map, storesKey]);
  
  return null;
}

// Store marker component
function StoreMarker({ store, minPrice, maxPrice, onStoreSelect }: {
  store: StoreWithPrices;
  minPrice: number;
  maxPrice: number;
  onStoreSelect: (id: number) => void;
}) {
  const priceColor = getPriceColor(store.currentPrice || 0, minPrice, maxPrice);
  
  // Create marker HTML
  const markerHtml = `
    <div class="price-marker" style="background-color: ${priceColor}; width: 48px; height: 48px;">
      $${(store.currentPrice || 0).toFixed(2)}
    </div>
  `;
  
  // Create custom icon
  const icon = L.divIcon({
    html: markerHtml,
    className: '',
    iconSize: [48, 48],
    iconAnchor: [24, 24],
    popupAnchor: [0, -20]
  });
  
  return (
    <Marker
      position={[Number(store.latitude), Number(store.longitude)]}
      icon={icon}
      eventHandlers={{
        click: () => onStoreSelect(store.id)
      }}
    >
      <Popup>
        <div className="p-2 min-w-[200px]">
          <h3 className="font-semibold">{store.name}</h3>
          <p className="text-sm text-gray-600">{store.address}, {store.city}</p>
          {store.currentPrice && (
            <p className="text-sm font-medium mt-1">
              Price: ${store.currentPrice.toFixed(2)}
            </p>
          )}
          <div className="mt-2 flex justify-between">
            <button
              onClick={() => onStoreSelect(store.id)}
              className="text-sm text-primary hover:underline"
            >
              Details
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
              Directions
            </a>
          </div>
        </div>
      </Popup>
    </Marker>
  );
}

// Map legend component
function MapLegend({ minPrice, maxPrice }: { minPrice: number; maxPrice: number }) {
  const map = useMap();
  
  useEffect(() => {
    // Create legend control
    const legend = new L.Control({ position: 'bottomright' });
    
    legend.onAdd = () => {
      const div = L.DomUtil.create('div', '');
      div.innerHTML = `
        <div style="
          background: white;
          padding: 8px;
          border-radius: 4px;
          box-shadow: 0 1px 5px rgba(0,0,0,0.2);
          font-size: 12px;
        ">
          <div style="font-weight: bold; margin-bottom: 5px;">Price Range</div>
          <div style="display: flex; align-items: center; gap: 5px;">
            <div style="width: 16px; height: 16px; background: #10B981; border-radius: 50%;"></div>
            <span>$${minPrice.toFixed(2)}</span>
            <div style="width: 50px; height: 3px; background: linear-gradient(to right, #10B981, #FBBF24, #EF4444);"></div>
            <div style="width: 16px; height: 16px; background: #EF4444; border-radius: 50%;"></div>
            <span>$${maxPrice.toFixed(2)}</span>
          </div>
        </div>
      `;
      return div;
    };
    
    // Add to map and store reference
    legend.addTo(map);
    
    // Remove on unmount
    return () => {
      legend.remove();
    };
  }, [map, minPrice, maxPrice]);
  
  return null;
}