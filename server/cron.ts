/**
 * Cron job to update egg prices daily
 * 
 * This would be integrated with the main Express server and run on a schedule.
 * For now, it contains the logic but won't be connected to external price sources.
 */

import { storage } from "./storage";
import { InsertPrice } from "@shared/schema";

/**
 * Update egg prices for all stores
 * In a real app, this would scrape websites, use APIs, or get data from partners
 */
export async function updateEggPrices(): Promise<void> {
  try {
    const stores = await storage.getStores();
    
    for (const store of stores) {
      await updatePricesForStore(store.id);
    }
    
    console.log(`[${new Date().toISOString()}] Successfully updated egg prices for ${stores.length} stores`);
  } catch (error) {
    console.error(`[${new Date().toISOString()}] Error updating egg prices:`, error);
  }
}

/**
 * Update egg prices for a specific store
 * Simulates getting the latest pricing data
 */
async function updatePricesForStore(storeId: number): Promise<void> {
  try {
    // Get the latest prices for brown and white eggs
    const latestBrownPrice = await storage.getLatestPriceByStore(storeId, "brown");
    const latestWhitePrice = await storage.getLatestPriceByStore(storeId, "white");
    
    if (!latestBrownPrice || !latestWhitePrice) {
      console.warn(`No existing price data for store ${storeId}. Skipping update.`);
      return;
    }
    
    // Simulate price changes by adding a small random variation (+/- 5%)
    const brownPriceNum = Number(latestBrownPrice.price);
    const whitePriceNum = Number(latestWhitePrice.price);
    
    const brownVariation = (Math.random() * 0.1) - 0.05; // +/- 5%
    const whiteVariation = (Math.random() * 0.1) - 0.05; // +/- 5%
    
    const newBrownPrice = Math.round((brownPriceNum * (1 + brownVariation)) * 100) / 100;
    const newWhitePrice = Math.round((whitePriceNum * (1 + whiteVariation)) * 100) / 100;
    
    // Create new price records
    const brownPriceRecord: InsertPrice = {
      storeId,
      eggType: "brown",
      price: String(newBrownPrice)
    };
    
    const whitePriceRecord: InsertPrice = {
      storeId,
      eggType: "white",
      price: String(newWhitePrice)
    };
    
    // Save the new prices
    await storage.createPrice(brownPriceRecord);
    await storage.createPrice(whitePriceRecord);
    
    console.log(`Updated prices for store ${storeId}: Brown=$${newBrownPrice}, White=$${newWhitePrice}`);
  } catch (error) {
    console.error(`Error updating prices for store ${storeId}:`, error);
  }
}

/**
 * Schedule the cron job to run every 24 hours
 * This is a simplified version - in production, use a proper cron library
 */
export function scheduleDailyPriceUpdates(): NodeJS.Timeout {
  const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000;
  
  // Run once immediately to ensure we have data
  updateEggPrices();
  
  // Then schedule to run every 24 hours
  return setInterval(updateEggPrices, TWENTY_FOUR_HOURS);
}
