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

export default function PriceMap({ stores, minPrice, maxPrice, onStoreSelect }: PriceMapProps) {
  // Center the map on the first store, or default to San Francisco
  const initialCenter = stores.length > 0
    ? [Number(stores[0].latitude), Number(stores[0].longitude)]
    : [37.7749, -122.4194]; // San Francisco coordinates
  
  return (
    <Card className="overflow-hidden">
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold">Price Map</h2>
        <p className="text-sm text-gray-500">
          Egg prices at stores within the search radius
        </p>
      </div>
      
      <MapContainer center={[initialCenter[0], initialCenter[1]] as [number, number]} zoom={13}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {/* Center the map on our stores */}
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
  // Create a custom marker
  const priceColor = getPriceColor(store.currentPrice || 0, minPrice, maxPrice);
  
  const markerHtml = `
    <div class="map-marker" style="background-color: ${priceColor}; width: 48px; height: 48px;">
      ${store.currentPrice ? `$${store.currentPrice.toFixed(2)}` : 'N/A'}
    </div>
  `;
  
  const customIcon = L.divIcon({
    html: markerHtml,
    className: '',
    iconSize: [48, 48],
    iconAnchor: [24, 24]
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
        <div className="p-2">
          <h3 className="font-semibold text-base">{store.name}</h3>
          <p className="text-sm text-gray-600">{store.address}</p>
          {store.currentPrice && (
            <p className="text-sm font-semibold mt-1">${store.currentPrice.toFixed(2)}</p>
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

interface MapBoundsProps {
  stores: StoreWithPrices[];
}

function MapBounds({ stores }: MapBoundsProps) {
  const map = useMap();
  
  useEffect(() => {
    if (stores.length === 0) return;
    
    const bounds = new L.LatLngBounds(
      stores.map(store => [Number(store.latitude), Number(store.longitude)])
    );
    
    map.fitBounds(bounds, { padding: [50, 50] });
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
      const div = L.DomUtil.create('div', 'bg-white p-2 rounded shadow-md text-sm');
      
      div.innerHTML = `
        <div class="text-xs font-medium mb-1">Price Range</div>
        <div class="flex items-center space-x-1">
          <div class="w-4 h-4 rounded" style="background-color: #10B981;"></div>
          <span class="text-xs">$${minPrice.toFixed(2)}</span>
          <div class="w-10 h-1 bg-gradient-to-r from-green-500 to-red-500"></div>
          <div class="w-4 h-4 rounded" style="background-color: #EF4444;"></div>
          <span class="text-xs">$${maxPrice.toFixed(2)}</span>
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
