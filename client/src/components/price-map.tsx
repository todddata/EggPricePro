import { useEffect, useRef, useState } from "react";
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

export default function PriceMap({ stores, minPrice, maxPrice, onStoreSelect }: PriceMapProps) {
  // Track when the map has been rendered
  const [mapRendered, setMapRendered] = useState(false);
  
  // Get zip code for display
  const zipCode = stores.length > 0 ? stores[0].zipCode : "94110";
  
  // Get center coordinates - calculate average lat/lng from all stores
  let centerLat = 39.8283; // Default center of US
  let centerLng = -98.5795;
  
  if (stores.length > 0) {
    // Use the coordinates of the first store as map center
    centerLat = Number(stores[0].latitude);
    centerLng = Number(stores[0].longitude);
  }
  
  // This ensures the map is completely recreated when the store data changes
  useEffect(() => {
    setMapRendered(false);
    setTimeout(() => setMapRendered(true), 100);
  }, [zipCode]);
  
  console.log(`Map rendering for zip code ${zipCode} with ${stores.length} stores at [${centerLat}, ${centerLng}]`);
  
  return (
    <Card className="overflow-hidden">
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold">Price Map for {zipCode}</h2>
        <p className="text-sm text-gray-500">
          Showing {stores.length} stores with egg prices
        </p>
      </div>
      
      <div className="h-[500px] w-full relative">
        {mapRendered && (
          <MapContainer 
            key={`map-${zipCode}-${Date.now()}`}
            center={[centerLat, centerLng]} 
            zoom={12}
            style={{ height: '100%', width: '100%' }}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            
            {/* The MapBounds component fits the map to show all markers */}
            <MapBounds stores={stores} />
            
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
            
            {/* Map Legend */}
            <MapLegend minPrice={minPrice} maxPrice={maxPrice} />
          </MapContainer>
        )}
        
        {!mapRendered && (
          <div className="flex items-center justify-center h-full bg-gray-100">
            <p>Loading map...</p>
          </div>
        )}
      </div>
    </Card>
  );
}

interface StoreMarkerProps {
  store: StoreWithPrices;
  minPrice: number;
  maxPrice: number;
  onStoreSelect: (storeId: number) => void;
}

function StoreMarker({ store, minPrice, maxPrice, onStoreSelect }: StoreMarkerProps) {
  // Create a custom circular marker with the price as text
  const priceColor = getPriceColor(store.currentPrice || 0, minPrice, maxPrice);
  
  const markerHtml = `
    <div style="
      background-color: ${priceColor}; 
      color: white; 
      border-radius: 50%; 
      width: 50px; 
      height: 50px; 
      display: flex; 
      align-items: center; 
      justify-content: center; 
      font-weight: bold;
      border: 2px solid white;
      box-shadow: 0 2px 5px rgba(0,0,0,0.3);
    ">
      ${store.currentPrice ? `$${store.currentPrice.toFixed(2)}` : 'N/A'}
    </div>
  `;
  
  const customIcon = L.divIcon({
    html: markerHtml,
    className: '',
    iconSize: [50, 50],
    iconAnchor: [25, 25],
    popupAnchor: [0, -25]
  });
  
  return (
    <Marker 
      position={[Number(store.latitude), Number(store.longitude)]} 
      icon={customIcon}
      eventHandlers={{
        click: () => onStoreSelect(store.id)
      }}
    >
      <Popup>
        <div className="p-2 min-w-[200px]">
          <h3 className="font-semibold text-base">{store.name}</h3>
          <p className="text-sm text-gray-600">{store.address}, {store.city}</p>
          {store.currentPrice && (
            <p className="text-sm font-semibold mt-1">Price: ${store.currentPrice.toFixed(2)}</p>
          )}
          <div className="mt-2 flex justify-between items-center">
            <button 
              className="text-sm text-primary hover:text-primary/80"
              onClick={() => onStoreSelect(store.id)}
            >
              View Details
            </button>
            
            <a 
              href={getGoogleMapsDirectionsUrl(store.address, store.city, store.state, store.zipCode)}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-primary hover:text-primary/80"
            >
              Get Directions
            </a>
          </div>
        </div>
      </Popup>
    </Marker>
  );
}

// Component to automatically fit the map to show all markers
interface MapBoundsProps {
  stores: StoreWithPrices[];
}

function MapBounds({ stores }: MapBoundsProps) {
  const map = useMap();
  
  useEffect(() => {
    if (stores.length === 0) return;
    
    try {
      // Create a LatLngBounds object to fit all store positions
      const positions = stores.map(store => [
        Number(store.latitude), 
        Number(store.longitude)
      ] as [number, number]);
      
      // Create bounds and add some padding
      const bounds = L.latLngBounds(positions);
      
      // First invalidate size to ensure the map container is properly measured
      map.invalidateSize();
      
      // Then fit the bounds after a short delay
      setTimeout(() => {
        map.fitBounds(bounds, { padding: [30, 30], maxZoom: 14 });
      }, 300);
    } catch (error) {
      console.error("Error setting map bounds:", error);
    }
  }, [map, stores]);
  
  return null;
}

interface MapLegendProps {
  minPrice: number;
  maxPrice: number;
}

function MapLegend({ minPrice, maxPrice }: MapLegendProps) {
  const legendRef = useRef<L.Control | null>(null);
  const map = useMap();
  
  useEffect(() => {
    if (legendRef.current) {
      legendRef.current.remove();
    }
    
    const legend = new L.Control({ position: 'bottomright' });
    
    legend.onAdd = () => {
      const div = L.DomUtil.create('div', '');
      div.className = 'bg-white p-3 rounded-md shadow-lg text-sm';
      
      div.innerHTML = `
        <div class="font-medium mb-1 text-gray-800">Price Range</div>
        <div class="flex items-center space-x-2">
          <div class="w-5 h-5 rounded-full" style="background-color: #10B981;"></div>
          <span>$${minPrice.toFixed(2)}</span>
          <div class="w-16 h-2 bg-gradient-to-r from-green-500 via-yellow-400 to-red-500 rounded"></div>
          <div class="w-5 h-5 rounded-full" style="background-color: #EF4444;"></div>
          <span>$${maxPrice.toFixed(2)}</span>
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
