import { 
  users, type User, type InsertUser,
  stores, type Store, type InsertStore,
  prices, type Price, type InsertPrice,
  type StoreWithPrices
} from "@shared/schema";

// modify the interface with any CRUD methods
// you might need
export interface IStorage {
  // User methods (keeping original methods)
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Store methods
  getStores(): Promise<Store[]>;
  getStore(id: number): Promise<Store | undefined>;
  getStoresByZipRadius(zipCode: string, radius: number): Promise<Store[]>;
  createStore(store: InsertStore): Promise<Store>;
  
  // Price methods
  getPrices(): Promise<Price[]>;
  getPricesByStoreId(storeId: number): Promise<Price[]>;
  getPricesByStoreIds(storeIds: number[]): Promise<Price[]>;
  getLatestPriceByStore(storeId: number, eggType: string): Promise<Price | undefined>;
  getLatestPricesByStoreIds(storeIds: number[], eggType: string): Promise<Map<number, Price | undefined>>;
  createPrice(price: InsertPrice): Promise<Price>;
  
  // Combined queries
  getStoresWithPrices(storeIds: number[], eggType: string): Promise<StoreWithPrices[]>;
}

export class MemStorage implements IStorage {
  private usersData: Map<number, User>;
  private storesData: Map<number, Store>;
  private pricesData: Map<number, Price>;
  private userCurrentId: number;
  private storeCurrentId: number;
  private priceCurrentId: number;

  constructor() {
    this.usersData = new Map();
    this.storesData = new Map();
    this.pricesData = new Map();
    this.userCurrentId = 1;
    this.storeCurrentId = 1;
    this.priceCurrentId = 1;
    
    // Add some initial data for development
    this.initSampleData();
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.usersData.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.usersData.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userCurrentId++;
    const user: User = { ...insertUser, id };
    this.usersData.set(id, user);
    return user;
  }
  
  // Store methods
  async getStores(): Promise<Store[]> {
    return Array.from(this.storesData.values());
  }
  
  async getStore(id: number): Promise<Store | undefined> {
    return this.storesData.get(id);
  }
  
  async getStoresByZipRadius(zipCode: string, radius: number): Promise<Store[]> {
    // For in-memory storage, we'll simulate filtering by zip code
    // In a real DB, this would use geospatial queries
    return Array.from(this.storesData.values()).filter(
      (store) => store.zipCode === zipCode || this.isWithinRadius(store, zipCode, radius)
    );
  }
  
  async createStore(insertStore: InsertStore): Promise<Store> {
    const id = this.storeCurrentId++;
    const store: Store = { ...insertStore, id };
    this.storesData.set(id, store);
    return store;
  }
  
  // Price methods
  async getPrices(): Promise<Price[]> {
    return Array.from(this.pricesData.values());
  }
  
  async getPricesByStoreId(storeId: number): Promise<Price[]> {
    return Array.from(this.pricesData.values())
      .filter(price => price.storeId === storeId)
      .sort((a, b) => new Date(b.recordedAt).getTime() - new Date(a.recordedAt).getTime());
  }
  
  async getPricesByStoreIds(storeIds: number[]): Promise<Price[]> {
    return Array.from(this.pricesData.values())
      .filter(price => storeIds.includes(price.storeId))
      .sort((a, b) => new Date(b.recordedAt).getTime() - new Date(a.recordedAt).getTime());
  }
  
  async getLatestPriceByStore(storeId: number, eggType: string): Promise<Price | undefined> {
    const storePrices = Array.from(this.pricesData.values())
      .filter(price => price.storeId === storeId && price.eggType === eggType)
      .sort((a, b) => new Date(b.recordedAt).getTime() - new Date(a.recordedAt).getTime());
    
    return storePrices.length > 0 ? storePrices[0] : undefined;
  }
  
  async getLatestPricesByStoreIds(storeIds: number[], eggType: string): Promise<Map<number, Price | undefined>> {
    const result = new Map<number, Price | undefined>();
    
    for (const storeId of storeIds) {
      const latestPrice = await this.getLatestPriceByStore(storeId, eggType);
      result.set(storeId, latestPrice);
    }
    
    return result;
  }
  
  async createPrice(insertPrice: InsertPrice): Promise<Price> {
    const id = this.priceCurrentId++;
    const price: Price = { 
      ...insertPrice, 
      id, 
      recordedAt: new Date() 
    };
    this.pricesData.set(id, price);
    return price;
  }
  
  // Combined queries
  async getStoresWithPrices(storeIds: number[], eggType: string): Promise<StoreWithPrices[]> {
    const stores = await Promise.all(
      storeIds.map(async (id) => {
        const store = await this.getStore(id);
        if (!store) return null;
        
        const latestPrice = await this.getLatestPriceByStore(id, eggType);
        const priceHistory = await this.getPricesByStoreId(id);
        
        return {
          ...store,
          currentPrice: latestPrice ? Number(latestPrice.price) : null,
          priceHistory: priceHistory.filter(p => p.eggType === eggType)
        };
      })
    );
    
    return stores.filter((s): s is StoreWithPrices => s !== null);
  }
  
  // Helper methods
  private isWithinRadius(store: Store, zipCode: string, radius: number): boolean {
    // For the 80126 zip code area
    if (zipCode === "80126") {
      // For development, we want to make sure we're showing the right number of stores at different radiuses
      // Define store-specific behavior for the 80126 demo zip code
      const zipCoords = { lat: 39.5486, lng: -104.9719 }; // Coordinates for 80126
      const storeLat = Number(store.latitude);
      const storeLng = Number(store.longitude);
      
      // Calculate the actual distance between coordinates
      const R = 3958.8; // Earth's radius in miles
      const dLat = (storeLat - zipCoords.lat) * Math.PI / 180;
      const dLng = (storeLng - zipCoords.lng) * Math.PI / 180;
      const a = 
        Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(zipCoords.lat * Math.PI / 180) * Math.cos(storeLat * Math.PI / 180) * 
        Math.sin(dLng/2) * Math.sin(dLng/2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
      const distance = R * c;
      
      // Round to two decimal places for display
      const distanceRounded = Math.round(distance * 100) / 100;
      
      // Log each store and its distance for debugging
      console.log(`Store ${store.name} is ${distanceRounded} miles from ${zipCode}`);
      
      // Check if the distance is within the specified radius
      // Adding a small buffer (0.1 miles) to account for rounding errors
      return distance <= (radius + 0.1);
    } 
    // For the San Francisco area zip codes
    else if (zipCode === "94110" || zipCode === "94105") {
      // Include all SF area stores for demo purposes
      return true;
    }
    
    // Default behavior for other zip codes
    return false;
  }
  
  // Initialize with sample data for development
  private initSampleData() {
    // Create sample stores
    const sampleStores: InsertStore[] = [
      // San Francisco area stores
      {
        name: "Trader Joe's",
        address: "555 Market St",
        city: "San Francisco",
        state: "CA",
        zipCode: "94105",
        latitude: "37.7897",
        longitude: "-122.3995",
        phone: "(415) 555-1234",
        website: "https://www.traderjoes.com",
        hours: "8:00 AM - 10:00 PM"
      },
      {
        name: "Safeway",
        address: "298 Main Ave",
        city: "San Francisco",
        state: "CA",
        zipCode: "94105",
        latitude: "37.7876",
        longitude: "-122.3962",
        phone: "(415) 555-5678",
        website: "https://www.safeway.com",
        hours: "7:00 AM - 11:00 PM"
      },
      {
        name: "Whole Foods",
        address: "123 Valencia St",
        city: "San Francisco",
        state: "CA",
        zipCode: "94110",
        latitude: "37.7735",
        longitude: "-122.4224",
        phone: "(415) 555-9012",
        website: "https://www.wholefoods.com",
        hours: "8:00 AM - 9:00 PM"
      },
      {
        name: "Rainbow Grocery",
        address: "1745 Folsom St",
        city: "San Francisco",
        state: "CA",
        zipCode: "94110",
        latitude: "37.7691",
        longitude: "-122.4152",
        phone: "(415) 555-3456",
        website: "https://www.rainbowgrocery.org",
        hours: "9:00 AM - 8:00 PM"
      },
      
      // Colorado area stores - 1-5 miles radius (80126 zip code - Highlands Ranch/Lone Tree)
      {
        name: "King Soopers",
        address: "9551 S University Blvd",
        city: "Highlands Ranch",
        state: "CO",
        zipCode: "80126",
        latitude: "39.5436",
        longitude: "-104.9712",
        phone: "(303) 470-7506",
        website: "https://www.kingsoopers.com",
        hours: "5:00 AM - 11:00 PM"
      },
      {
        name: "Sprouts Farmers Market",
        address: "9751 S University Blvd",
        city: "Highlands Ranch",
        state: "CO",
        zipCode: "80126",
        latitude: "39.5385",
        longitude: "-104.9709",
        phone: "(303) 470-1296",
        website: "https://www.sprouts.com",
        hours: "7:00 AM - 10:00 PM"
      },
      {
        name: "Natural Grocers",
        address: "8601 S Quebec St",
        city: "Highlands Ranch",
        state: "CO",
        zipCode: "80126",
        latitude: "39.5732",
        longitude: "-104.9082",
        phone: "(303) 470-0038",
        website: "https://www.naturalgrocers.com",
        hours: "8:00 AM - 9:00 PM"
      },
      {
        name: "Whole Foods Market",
        address: "9366 S Colorado Blvd",
        city: "Highlands Ranch",
        state: "CO",
        zipCode: "80126",
        latitude: "39.5512",
        longitude: "-104.9708",
        phone: "(303) 470-1775",
        website: "https://www.wholefoodsmarket.com",
        hours: "7:00 AM - 10:00 PM"
      },
      
      // 5-10 miles radius from 80126
      {
        name: "Safeway",
        address: "7375 E Arapahoe Rd",
        city: "Centennial",
        state: "CO",
        zipCode: "80112",
        latitude: "39.5924",
        longitude: "-104.9073",
        phone: "(303) 793-9565",
        website: "https://www.safeway.com",
        hours: "6:00 AM - 11:00 PM"
      },
      {
        name: "Trader Joe's",
        address: "5910 S University Blvd",
        city: "Greenwood Village",
        state: "CO",
        zipCode: "80121",
        latitude: "39.6079",
        longitude: "-104.9592",
        phone: "(303) 221-3482",
        website: "https://www.traderjoes.com",
        hours: "8:00 AM - 9:00 PM"
      },
      
      // 10-15 miles radius from 80126
      {
        name: "Marczyk Fine Foods",
        address: "770 E 17th Ave",
        city: "Denver",
        state: "CO",
        zipCode: "80203",
        latitude: "39.7431",
        longitude: "-104.9768",
        phone: "(303) 894-9499",
        website: "https://www.marczykfinefoods.com",
        hours: "8:00 AM - 8:00 PM"
      },
      {
        name: "H Mart",
        address: "2751 S Parker Rd",
        city: "Aurora",
        state: "CO",
        zipCode: "80014",
        latitude: "39.6670",
        longitude: "-104.8540",
        phone: "(303) 745-4592",
        website: "https://www.hmart.com",
        hours: "8:00 AM - 10:00 PM"
      },
      
      // 15-20 miles radius from 80126
      {
        name: "Pacific Ocean International Marketplace",
        address: "2200 W Alameda Ave",
        city: "Denver",
        state: "CO",
        zipCode: "80223",
        latitude: "39.7116",
        longitude: "-105.0120",
        phone: "(303) 936-4845",
        website: "https://www.pacificoceanmarket.com",
        hours: "9:00 AM - 8:00 PM"
      },
      {
        name: "Lowe's Mercado",
        address: "10471 E Martin Luther King Jr Blvd",
        city: "Denver",
        state: "CO",
        zipCode: "80238",
        latitude: "39.7619",
        longitude: "-104.8696",
        phone: "(303) 338-5274",
        website: "https://www.lowesmarkets.com",
        hours: "7:00 AM - 10:00 PM"
      }
    ];
    
    // Add sample stores
    sampleStores.forEach(store => {
      const id = this.storeCurrentId++;
      this.storesData.set(id, { ...store, id });
    });
    
    // Add sample prices for each store
    const today = new Date();
    const oneDay = 24 * 60 * 60 * 1000;
    
    // Get all store IDs - now includes Colorado stores too
    const allStoreIds = Array.from(this.storesData.keys());
    
    allStoreIds.forEach(storeId => {
      // Current prices
      this.createSamplePrice(storeId, "brown", this.getBasePriceForStore(storeId), today);
      this.createSamplePrice(storeId, "white", this.getBasePriceForStore(storeId) - 0.2, today);
      
      // Historical prices - last 30 days
      for (let i = 1; i <= 30; i++) {
        const date = new Date(today.getTime() - (i * oneDay));
        const brownVariation = (Math.random() * 0.4) - 0.2; // +/- 20 cents
        const whiteVariation = (Math.random() * 0.4) - 0.2; // +/- 20 cents
        
        this.createSamplePrice(
          storeId, 
          "brown", 
          this.getBasePriceForStore(storeId) + brownVariation,
          date
        );
        
        this.createSamplePrice(
          storeId, 
          "white", 
          this.getBasePriceForStore(storeId) - 0.2 + whiteVariation,
          date
        );
      }
    });
  }
  
  private createSamplePrice(storeId: number, eggType: string, price: number, date: Date): void {
    const id = this.priceCurrentId++;
    this.pricesData.set(id, {
      id,
      storeId,
      eggType,
      price: String(Math.max(1.99, Math.round(price * 100) / 100)), // Ensure no negative prices
      recordedAt: date
    });
  }
  
  private getBasePriceForStore(storeId: number): number {
    // Define base prices for each store
    const basePrices: Record<number, number> = {
      1: 3.99, // Trader Joe's
      2: 4.59, // Safeway
      3: 5.29, // Whole Foods
      4: 4.19  // Rainbow Grocery
    };
    
    return basePrices[storeId] || 4.29; // Default price if store not found
  }
}

export const storage = new MemStorage();
