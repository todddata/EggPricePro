import { useEffect, useRef } from "react";
import { Card } from "@/components/ui/card";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import { getPriceColor } from "@/lib/price-utils";
import { getGoogleMapsDirectionsUrl } from "@/lib/map-utils";
import type { StoreWithPrices } from "@shared/schema";

// Setup map marker icons
const defaultIcon = new L.Icon({
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

interface PriceMapProps {
  stores: StoreWithPrices[];
  minPrice: number;
  maxPrice: number;
  onStoreSelect: (storeId: number) => void;
}

export default function PriceMap({ stores, minPrice, maxPrice, onStoreSelect }: PriceMapProps) {
  // Add detailed logging to track map updates
  console.log("PriceMap received stores:", 
    stores.map(s => ({ id: s.id, name: s.name, zipCode: s.zipCode, lat: s.latitude, lng: s.longitude }))
  );
  
  // Use a key to force complete remount of the map component with every render
  // Include all store IDs in the key to ensure it's truly unique on each data change
  const storeIds = stores.map(s => s.id).join('-');
  const mapKey = `map-${stores.length > 0 ? stores[0].zipCode : 'empty'}-${storeIds}-${Date.now()}`;
  
  console.log("Map component using key:", mapKey);
  
  // Center the map on the first store, or use a default center
  const initialCenter = stores.length > 0
    ? [Number(stores[0].latitude), Number(stores[0].longitude)]
    : [39.8283, -98.5795]; // Center of the US
    
  console.log("Map initial center set to:", initialCenter);
  
  return (
    <Card className="overflow-hidden">
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold">Price Map for {stores.length > 0 && stores[0].zipCode ? stores[0].zipCode : "94110"}</h2>
        <p className="text-sm text-gray-500">
          Egg prices at stores within the search radius
        </p>
      </div>
      
      <div className="leaflet-container">
        {/* Completely recreate the map container on each render to force proper updates */}
        <MapContainer 
          key={mapKey}
          center={[initialCenter[0], initialCenter[1]] as [number, number]} 
          zoom={stores.length > 0 ? 13 : 4}
          style={{ height: '500px', width: '100%' }}
        >
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
  
  // Create a unique key that changes when store coordinates change
  const locationKey = stores
    .map(store => `${store.latitude},${store.longitude}`)
    .join('|');
  
  useEffect(() => {
    console.log("MapBounds effect running with zip code:", 
      stores.length > 0 ? stores[0].zipCode : "none", 
      "and store count:", stores.length);
    
    // If no stores are found, center on the default location
    if (stores.length === 0) {
      console.log("No stores found, centering map on US default");
      map.setView([39.8283, -98.5795], 4);
      return;
    }
    
    // Force the map to fit to the store locations
    try {
      const coordinates = stores.map(store => [
        Number(store.latitude), 
        Number(store.longitude)
      ] as [number, number]);
      
      console.log("Setting map bounds to coordinates in zip code:", 
        stores[0].zipCode, 
        "coordinates:", coordinates);
      
      const bounds = new L.LatLngBounds(coordinates);
      
      // Use a sequence of timeouts to ensure the map properly updates
      // First force an invalidation of the map size
      map.invalidateSize({ animate: false });
      
      // Then fit the bounds with a slight delay
      setTimeout(() => {
        console.log("Fitting map to bounds");
        map.fitBounds(bounds, { padding: [50, 50], animate: true });
        
        // Do a final check to make sure the bounds took effect
        setTimeout(() => {
          const mapCenter = map.getCenter();
          console.log("Map is now centered at:", mapCenter);
          
          // If we're still not centered correctly, force it one more time
          const firstStoreLat = Number(stores[0].latitude);
          const firstStoreLng = Number(stores[0].longitude);
          
          // If map center is far from where it should be, force it directly
          if (Math.abs(mapCenter.lat - firstStoreLat) > 5 || 
              Math.abs(mapCenter.lng - firstStoreLng) > 5) {
            console.log("Map still not centered correctly, forcing center");
            map.setView([firstStoreLat, firstStoreLng], 11);
          }
        }, 300);
      }, 200);
    } catch (error) {
      console.error("Error setting map bounds:", error);
    }
  }, [map, locationKey]); // Use locationKey to ensure this runs when store coordinates change
  
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
