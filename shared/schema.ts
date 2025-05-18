import { pgTable, text, serial, numeric, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User authentication schema (keeping existing users table)
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

// Stores schema
export const stores = pgTable("stores", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  address: text("address").notNull(),
  city: text("city").notNull(),
  state: text("state").notNull(),
  zipCode: text("zip_code").notNull(),
  latitude: numeric("latitude", { precision: 10, scale: 7 }).notNull(),
  longitude: numeric("longitude", { precision: 10, scale: 7 }).notNull(),
  phone: text("phone"),
  website: text("website"),
  hours: text("hours"),
});

export const insertStoreSchema = createInsertSchema(stores).omit({
  id: true,
});

// Prices schema
export const prices = pgTable("prices", {
  id: serial("id").primaryKey(),
  storeId: integer("store_id").notNull(),
  price: numeric("price", { precision: 10, scale: 2 }).notNull(),
  eggType: text("egg_type").notNull(), // "white" or "brown"
  recordedAt: timestamp("recorded_at").defaultNow().notNull(),
});

export const insertPriceSchema = createInsertSchema(prices).omit({
  id: true,
  recordedAt: true,
});

// Type definitions
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Store = typeof stores.$inferSelect;
export type InsertStore = z.infer<typeof insertStoreSchema>;

export type Price = typeof prices.$inferSelect;
export type InsertPrice = z.infer<typeof insertPriceSchema>;

// Validation schemas
export const zipCodeSchema = z.string().regex(/^\d{5}$/, "Zip code must be 5 digits");
export const radiusSchema = z.number().int().min(1).max(20);
export const eggTypeSchema = z.enum(["white", "brown"]);

// API response types
export type StoreWithPrices = Store & {
  currentPrice: number | null;
  priceHistory?: Price[];
};

export type SearchResultsResponse = {
  stores: StoreWithPrices[];
  minPrice: number | null;
  maxPrice: number | null;
};
