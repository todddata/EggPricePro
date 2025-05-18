import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { zipCodeSchema, radiusSchema, eggTypeSchema, type SearchResultsResponse } from "@shared/schema";
import { scheduleDailyPriceUpdates } from "./cron";
import { getCoordinatesForZipCode, isWithinRadius } from "./utils/geocoding";

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
      
      // Filter stores by distance - improved accuracy for demonstration
      const storesInRadius = allStores.filter(store => {
        const storeLat = Number(store.latitude);
        const storeLng = Number(store.longitude);
        // Add a slight buffer (0.1 miles) to include edge cases
        return isWithinRadius(centerCoords.lat, centerCoords.lng, storeLat, storeLng, radius + 0.1);
      });
      
      console.log(`Found ${storesInRadius.length} stores within ${radius} miles of ${zipCode}`);
      
      // Return empty results rather than error when no stores found
      if (storesInRadius.length === 0) {
        console.log(`No stores found within ${radius} miles of ${zipCode}`);
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
