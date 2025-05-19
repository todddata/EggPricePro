import { useEffect, useState, useRef } from "react";
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

interface MapProps {
  stores: StoreWithPrices[];
  minPrice: number;
  maxPrice: number;
  onStoreSelect: (storeId: number) => void;
}

// This component is specifically designed to handle radius changes
export default function RadiusAwareMap({ stores, minPrice, maxPrice, onStoreSelect }: MapProps) {
  const zipCode = stores.length > 0 ? stores[0].zipCode : "";
  
  // Get radius from URL search params
  const getSearchRadius = () => {
    const urlParams = new URLSearchParams(window.location.search);
    const radiusParam = urlParams.get('radius');
    
    if (radiusParam && !isNaN(parseInt(radiusParam))) {
      return parseInt(radiusParam);
    }
    
    // Use the form field input from the slider (if any)
    const rangeInputs = document.querySelectorAll('input[type="range"]');
    let rangeInputArray = Array.from(rangeInputs);
    for (let i = 0; i < rangeInputArray.length; i++) {
      const value = rangeInputArray[i].value;
      if (value && !isNaN(parseInt(value))) {
        return parseInt(value);
      }
    }
    
    // If stores exist, inspect their data to find a consistent radius
    if (stores.length > 0) {
      // Try to infer from the distance between points
      // This is a simplified heuristic
      let maxDist = 0;
      const centerLat = Number(stores[0].latitude);
      const centerLng = Number(stores[0].longitude);
      
      for (const store of stores) {
        const lat = Number(store.latitude);
        const lng = Number(store.longitude);
        const dist = Math.sqrt(Math.pow(lat - centerLat, 2) + Math.pow(lng - centerLng, 2));
        maxDist = Math.max(maxDist, dist);
      }
      
      // Very rough conversion to miles (this is just for visualization)
      const approxRadius = Math.ceil(maxDist * 69) + 2; // 1 degree ≈ 69 miles
      return Math.min(Math.max(approxRadius, 5), 20); // Constrain between 5-20 miles
    }
    
    // Safe default
    return 10;
  };
  
  const radius = getSearchRadius();
  const [mapKey, setMapKey] = useState(`map-${zipCode}-${radius}-${Date.now()}`);
  
  // Force map recreation when zipcode or radius changes
  useEffect(() => {
    setMapKey(`map-${zipCode}-${radius}-${Date.now()}`);
  }, [zipCode, radius, stores.length]);
  
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
  
  // Get central coordinates from the first store
  const centerLat = Number(stores[0].latitude);
  const centerLng = Number(stores[0].longitude);
  
  // Set initial zoom based on radius - the key to fixing the zoom issue
  // Update this function with more granular zoom levels
  const getInitialZoom = () => {
    console.log(`Setting zoom level for radius: ${radius} miles`);
    
    // Very specific zoom levels based on testing
    if (radius <= 2) return 14;
    if (radius <= 3) return 13;
    if (radius <= 5) return 12;
    if (radius <= 7) return 11;
    if (radius <= 10) return 10;
    if (radius <= 14) return 9;
    if (radius <= 18) return 8;
    return 7; // For the largest radius values
  };
  
  return (
    <Card className="overflow-hidden">
      <div className="p-4 border-b">
        <h2 className="text-lg font-medium">Price Map for {zipCode}</h2>
        <p className="text-sm text-gray-500">
          Showing <span className="font-semibold">{stores.length} stores</span> within <span className="font-semibold">{radius} miles</span>
        </p>
      </div>
      
      <div className="relative" style={{ height: "500px" }}>
        <MapContainer
          key={mapKey}
          center={[centerLat, centerLng]}
          zoom={getInitialZoom()}
          style={mapStyles}
        >
          {/* Add the tiles */}
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          />
          
          {/* Markers for each store */}
          {stores.map(store => (
            <StoreMarker
              key={store.id}
              store={store}
              minPrice={minPrice}
              maxPrice={maxPrice}
              onStoreSelect={onStoreSelect}
            />
          ))}
          
          {/* Radius circle to show coverage area */}
          <RadiusCircle 
            center={[centerLat, centerLng]} 
            radius={radius} 
          />
          
          {/* Map legend */}
          <MapLegend minPrice={minPrice} maxPrice={maxPrice} />
        </MapContainer>
      </div>
    </Card>
  );
}

// Component to draw a circle showing the search radius
function RadiusCircle({ 
  center, 
  radius 
}: { 
  center: [number, number]; 
  radius: number; 
}) {
  const map = useMap();
  
  useEffect(() => {
    // Convert miles to meters (1 mile ≈ 1609.34 meters)
    const radiusInMeters = radius * 1609.34;
    
    // Create a circle to show the search radius
    const circle = L.circle(center, {
      radius: radiusInMeters,
      color: '#3b82f6',
      fillColor: '#3b82f680',
      fillOpacity: 0.1,
      weight: 1
    });
    
    // Add to map
    circle.addTo(map);
    
    // Force the map to zoom out enough to show the entire circle
    // This is critical for larger radius values
    const bounds = circle.getBounds();
    
    // Use animated and padded bounds to ensure proper zooming
    requestAnimationFrame(() => {
      // Give the map a moment to initialize properly
      setTimeout(() => {
        try {
          console.log(`Fitting map to show ${radius} mile radius`);
          
          // For large radius values, we need more padding
          const padding = radius > 10 ? [50, 50] : [30, 30];
          
          // Check if the map is still valid before attempting to fit bounds
          if (map && map._loaded) {
            try {
              // Apply bounds with animation for smoother transition
              map.fitBounds(bounds, { 
                padding: padding,
                animate: true,
                duration: 0.5  // Faster animation
              });
              
              // For very large radius values, explicitly set zoom level
              if (radius > 15) {
                setTimeout(() => {
                  // Make sure map is still valid
                  if (map && map._loaded) {
                    try {
                      // Double-check if we need to zoom out more
                      const currentZoom = map.getZoom();
                      const targetZoom = radius > 18 ? 7 : radius > 14 ? 8 : 9;
                      
                      if (currentZoom && currentZoom > targetZoom) {
                        console.log(`Adjusting zoom from ${currentZoom} to ${targetZoom} for ${radius} mile radius`);
                        map.setZoom(targetZoom);
                      }
                    } catch (zoomErr) {
                      console.log("Error adjusting zoom:", zoomErr);
                    }
                  }
                }, 300);
              }
            } catch (fitErr) {
              console.log("Error fitting bounds:", fitErr);
              
              // Fallback to just setting a zoom level based on radius
              try {
                const zoomLevel = radius <= 2 ? 14 :
                                radius <= 3 ? 13 :
                                radius <= 5 ? 12 :
                                radius <= 7 ? 11 :
                                radius <= 10 ? 10 :
                                radius <= 14 ? 9 : 
                                radius <= 18 ? 8 : 7;
                map.setZoom(zoomLevel);
              } catch (e) {
                console.log("Fallback zoom failed:", e);
              }
            }
          } else {
            console.log("Map not ready yet, skipping bounds fitting");
          }
        } catch (err) {
          console.error("Error fitting map to bounds:", err);
        }
      }, 150);
    });
    
    // Clean up
    return () => {
      circle.remove();
    };
  }, [map, center, radius]);
  
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
  
  // Create marker HTML with tooltip
  const markerHtml = `
    <div 
      style="
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 50%;
        background-color: ${priceColor};
        color: white;
        font-weight: bold;
        width: 48px;
        height: 48px;
        border: 2px solid white;
        box-shadow: 0 2px 5px rgba(0,0,0,0.3);
        position: relative;
      "
      title="${store.name}: $${(store.currentPrice || 0).toFixed(2)}"
      class="store-marker"
    >
      $${(store.currentPrice || 0).toFixed(2)}
      <span 
        style="
          position: absolute;
          bottom: -40px;
          left: 50%;
          transform: translateX(-50%);
          background: rgba(0,0,0,0.75);
          color: white;
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 12px;
          white-space: nowrap;
          pointer-events: none;
          opacity: 0;
          transition: opacity 0.2s;
          z-index: 1000;
        "
        class="store-tooltip"
      >
        ${store.name}
      </span>
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
          z-index: 1000;
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