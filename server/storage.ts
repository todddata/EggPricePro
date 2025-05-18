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
    // This is a simplified version for the in-memory storage
    // Real implementation would use actual geospatial calculation
    return true; // For development, assume all stores are within radius
  }
  
  // Initialize with sample data for development
  private initSampleData() {
    // Create sample stores
    const sampleStores: InsertStore[] = [
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
    
    [1, 2, 3, 4].forEach(storeId => {
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
