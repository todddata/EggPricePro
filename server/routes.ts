import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { zipCodeSchema, radiusSchema, eggTypeSchema, type SearchResultsResponse } from "@shared/schema";
import { scheduleDailyPriceUpdates } from "./cron";
import { getCoordinatesForZipCode, isWithinRadius, calculateDistance } from "./utils/geocoding";

export async function registerRoutes(app: Express): Promise<Server> {
  // Schedule the daily price updates
  const updateInterval = scheduleDailyPriceUpdates();
  
  // Search for egg prices by zip code and radius
  app.get("/api/prices", async (req, res) => {
    try {
      console.log("API request received for prices:", req.query);
      const zipCode = req.query.zipCode as string;
      const radius = parseInt(req.query.radius as string || "5", 10);
      const eggType = (req.query.eggType as string || "brown").toLowerCase();
      
      // Validate inputs
      const zipValidation = zipCodeSchema.safeParse(zipCode);
      if (!zipValidation.success) {
        return res.status(400).json({ message: "Invalid zip code. Must be 5 digits." });
      }
      
      const radiusValidation = radiusSchema.safeParse(radius);
      if (!radiusValidation.success) {
        return res.status(400).json({ message: "Invalid radius. Must be between 1 and 20 miles." });
      }
      
      const eggTypeValidation = eggTypeSchema.safeParse(eggType);
      if (!eggTypeValidation.success) {
        return res.status(400).json({ message: "Invalid egg type. Must be 'white' or 'brown'." });
      }
      
      // Get coordinates for the zip code
      const centerCoords = await getCoordinatesForZipCode(zipCode);
      if (!centerCoords) {
        return res.status(400).json({ message: "Could not find coordinates for the provided zip code." });
      }
      
      // Get all stores
      const allStores = await storage.getStores();
      
      // Get all stores within radius regardless of zip code
      // This is critical to show stores from adjacent zip codes
      const storesInRadius = allStores.filter(store => {
        const storeLat = Number(store.latitude);
        const storeLng = Number(store.longitude);
        
        // Use isWithinRadius to calculate if store is within the search radius
        // Add extra buffer (0.5 miles) to ensure nearby stores are included
        const isInRadius = isWithinRadius(
          centerCoords.lat, 
          centerCoords.lng, 
          storeLat, 
          storeLng, 
          radius + 0.5
        );
        
        // For stores that are close to the boundary, log their info
        if (isInRadius) {
          console.log(`Store ${store.name} at ${store.address} is within ${radius} miles of ${zipCode}`);
        }
        
        return isInRadius;
      });
      
      console.log(`Found ${storesInRadius.length} stores within ${radius} miles of ${zipCode}`);
      
      // If no stores found, create demo stores for development environment
      if (storesInRadius.length === 0) {
        console.log(`No stores found within ${radius} miles of ${zipCode}`);
        
        // For development purposes, create demo stores for any valid zip code
        // This ensures the app always shows relevant results
        if (process.env.NODE_ENV === 'development') {
          console.log(`Creating demo stores for zip ${zipCode}`);
          
          // Create a store at the center of the search area
          const localStore = await storage.createStore({
            name: "Local Grocery",
            address: `123 Main Street`,
            city: getPlaceName(zipCode),
            state: getStateFromZip(zipCode),
            zipCode: zipCode,
            latitude: String(centerCoords.lat),
            longitude: String(centerCoords.lng),
            phone: "(555) 123-4567",
            website: "https://www.localgrocery.com",
            hours: "8:00 AM - 9:00 PM"
          });
          
          // Create a second store nearby
          const farmersMarket = await storage.createStore({
            name: "Farmers Market",
            address: `456 Oak Avenue`,
            city: getPlaceName(zipCode),
            state: getStateFromZip(zipCode),
            zipCode: zipCode,
            latitude: String(centerCoords.lat + 0.01),
            longitude: String(centerCoords.lng - 0.01),
            phone: "(555) 987-6543",
            website: "https://www.farmersmarket.com",
            hours: "7:00 AM - 6:00 PM"
          });
          
          // Create a third store slightly further away
          const organicShop = await storage.createStore({
            name: "Organic Essentials",
            address: `789 Maple Drive`,
            city: getPlaceName(zipCode),
            state: getStateFromZip(zipCode),
            zipCode: zipCode,
            latitude: String(centerCoords.lat - 0.02),
            longitude: String(centerCoords.lng + 0.015),
            phone: "(555) 345-6789",
            website: "https://www.organicstore.com",
            hours: "9:00 AM - 8:00 PM"
          });
          
          // Add price data for all three stores
          // Brown eggs
          await storage.createPrice({
            storeId: localStore.id,
            eggType: "brown",
            price: String(Math.round((4.29 + (Math.random() * 0.4 - 0.2)) * 100) / 100),
            recordedAt: new Date()
          });
          
          await storage.createPrice({
            storeId: farmersMarket.id,
            eggType: "brown",
            price: String(Math.round((4.59 + (Math.random() * 0.4 - 0.2)) * 100) / 100),
            recordedAt: new Date()
          });
          
          await storage.createPrice({
            storeId: organicShop.id,
            eggType: "brown",
            price: String(Math.round((4.89 + (Math.random() * 0.4 - 0.2)) * 100) / 100),
            recordedAt: new Date()
          });
          
          // White eggs
          await storage.createPrice({
            storeId: localStore.id,
            eggType: "white",
            price: String(Math.round((3.99 + (Math.random() * 0.4 - 0.2)) * 100) / 100),
            recordedAt: new Date()
          });
          
          await storage.createPrice({
            storeId: farmersMarket.id,
            eggType: "white",
            price: String(Math.round((4.19 + (Math.random() * 0.4 - 0.2)) * 100) / 100),
            recordedAt: new Date()
          });
          
          await storage.createPrice({
            storeId: organicShop.id,
            eggType: "white",
            price: String(Math.round((4.49 + (Math.random() * 0.4 - 0.2)) * 100) / 100),
            recordedAt: new Date()
          });
          
          // Recursive call to the same endpoint to get the newly created stores
          // This avoids duplicating the store retrieval logic
          return res.redirect(307, `/api/prices?zipCode=${zipCode}&radius=${radius}&eggType=${eggType}`);
        }
        
        return res.json({
          stores: [],
          minPrice: null,
          maxPrice: null
        });
      }
      
      // Add the zipCode to all store records for client reference
      const storesWithZipCode = storesInRadius.map(store => ({
        ...store,
        zipCode: zipCode  // Add requested zip code to each store
      }));
      
      // Get the latest prices for each store
      const storeIds = storesWithZipCode.map(store => store.id);
      const storesWithPrices = await storage.getStoresWithPrices(storeIds, eggType);
      
      // Calculate min and max prices for the color gradient
      const prices = storesWithPrices
        .map(store => store.currentPrice)
        .filter((price): price is number => price !== null);
      
      const minPrice = prices.length > 0 ? Math.min(...prices) : null;
      const maxPrice = prices.length > 0 ? Math.max(...prices) : null;
      
      // Return the search results
      const response: SearchResultsResponse = {
        stores: storesWithPrices.map(store => ({
          ...store,
          zipCode: zipCode  // Ensure zipCode is in the store data
        })),
        minPrice,
        maxPrice
      };
      
      console.log(`Successfully returning ${response.stores.length} stores for zip ${zipCode} with radius ${radius} miles`);
      res.json(response);
    } catch (error) {
      console.error("Error processing price search:", error);
      res.status(500).json({ message: "Error processing your request. Please try again later." });
    }
  });
  
  // Get price history for a specific store
  app.get("/api/stores/:storeId/prices", async (req, res) => {
    try {
      const storeId = parseInt(req.params.storeId, 10);
      const eggType = (req.query.eggType as string || "brown").toLowerCase();
      
      // Validate egg type
      const eggTypeValidation = eggTypeSchema.safeParse(eggType);
      if (!eggTypeValidation.success) {
        return res.status(400).json({ message: "Invalid egg type. Must be 'white' or 'brown'." });
      }
      
      // Get the store
      const store = await storage.getStore(storeId);
      if (!store) {
        return res.status(404).json({ message: "Store not found." });
      }
      
      // Get the price history
      const prices = (await storage.getPricesByStoreId(storeId))
        .filter(price => price.eggType === eggType)
        .sort((a, b) => new Date(a.recordedAt).getTime() - new Date(b.recordedAt).getTime());
      
      res.json(prices);
    } catch (error) {
      console.error("Error fetching price history:", error);
      res.status(500).json({ message: "Error processing your request. Please try again later." });
    }
  });
  
  // Get store details by ID
  app.get("/api/stores/:storeId", async (req, res) => {
    try {
      const storeId = parseInt(req.params.storeId, 10);
      
      // Get the store
      const store = await storage.getStore(storeId);
      if (!store) {
        return res.status(404).json({ message: "Store not found." });
      }
      
      // Get the latest prices for both egg types
      const brownPrice = await storage.getLatestPriceByStore(storeId, "brown");
      const whitePrice = await storage.getLatestPriceByStore(storeId, "white");
      
      res.json({
        ...store,
        prices: {
          brown: brownPrice ? Number(brownPrice.price) : null,
          white: whitePrice ? Number(whitePrice.price) : null
        }
      });
    } catch (error) {
      console.error("Error fetching store details:", error);
      res.status(500).json({ message: "Error processing your request. Please try again later." });
    }
  });
  
  // Health check endpoint
  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  const httpServer = createServer(app);
  
  // Clean up resources when the server closes
  httpServer.on("close", () => {
    clearInterval(updateInterval);
  });

  return httpServer;
}

/**
 * Helper function to get state abbreviation from zip code
 * Maps zip code first digit to a U.S. state for demo purposes
 */
function getStateFromZip(zipCode: string): string {
  const firstDigit = parseInt(zipCode.charAt(0), 10);
  
  switch (firstDigit) {
    case 0: return "CT"; // Connecticut (Northeast)
    case 1: return "NY"; // New York (Northeast)
    case 2: return "DC"; // Washington DC (Mid-Atlantic)
    case 3: return "FL"; // Florida (Southeast)
    case 4: return "IN"; // Indiana (Midwest)
    case 5: return "MI"; // Michigan (Midwest)
    case 6: return "MO"; // Missouri (Central)
    case 7: return "TX"; // Texas (South Central)
    case 8: return "CO"; // Colorado (Mountain West)
    case 9: return "CA"; // California (West Coast)
    default: return "CO"; // Default
  }
}

/**
 * Helper function to get a place name from zip code
 * Generates city names based on zip code for demo purposes
 */
function getPlaceName(zipCode: string): string {
  const firstDigit = parseInt(zipCode.charAt(0), 10);
  const lastTwoDigits = zipCode.substring(3, 5);
  
  // Basic mapping of zip code first digit to region
  const regions = [
    "New England", // 0
    "Metro", // 1
    "Capital", // 2
    "Coastal", // 3
    "Great Lakes", // 4
    "Midwestern", // 5
    "Central", // 6
    "Southern", // 7
    "Mountain", // 8
    "West Coast" // 9
  ];
  
  // Choose a prefix based on the region
  const regionPrefix = regions[firstDigit];
  
  // Generate a suffix based on last two digits
  const numValue = parseInt(lastTwoDigits, 10);
  let suffix = "";
  
  if (numValue < 20) suffix = "ville";
  else if (numValue < 40) suffix = "town";
  else if (numValue < 60) suffix = "burg";
  else if (numValue < 80) suffix = "field";
  else suffix = "city";
  
  return `${regionPrefix} ${suffix}`;
}
