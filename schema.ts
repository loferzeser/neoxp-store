import {
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
  decimal,
  boolean,
  json,
} from "drizzle-orm/mysql-core";

// ===== USERS =====
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "service", "admin", "super_admin", "developer"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// ===== PRODUCTS (EA BOTS) =====
export const products = mysqlTable("products", {
  id: int("id").autoincrement().primaryKey(),
  slug: varchar("slug", { length: 128 }).notNull().unique(),
  name: varchar("name", { length: 255 }).notNull(),
  shortDesc: text("shortDesc"),
  description: text("description"),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  salePrice: decimal("salePrice", { precision: 10, scale: 2 }),
  category: mysqlEnum("category", [
    "scalping",
    "swing",
    "grid",
    "hedging",
    "trend",
    "arbitrage",
    "indicator_tv",
    "strategy_tv",
    "script_tv",
    "tool",
    "other",
  ]).default("other").notNull(),
  platform: mysqlEnum("platform", ["MT4", "MT5", "both"]).default("MT4").notNull(),
  saleType: mysqlEnum("saleType", ["buy_once", "rent", "both"]).default("buy_once").notNull(),
  rentalPrice: decimal("rentalPrice", { precision: 10, scale: 2 }),
  rentalDurationDays: int("rentalDurationDays"),
  currency: varchar("currency", { length: 10 }).default("THB").notNull(),
  imageUrl: text("imageUrl"),
  screenshotUrls: json("screenshotUrls").$type<string[]>().default([]),
  fileKey: text("fileKey"),
  fileUrl: text("fileUrl"),
  // Performance metrics
  winRate: decimal("winRate", { precision: 5, scale: 2 }),
  monthlyReturn: decimal("monthlyReturn", { precision: 5, scale: 2 }),
  maxDrawdown: decimal("maxDrawdown", { precision: 5, scale: 2 }),
  profitFactor: decimal("profitFactor", { precision: 5, scale: 2 }),
  totalTrades: int("totalTrades"),
  // Status
  isActive: boolean("isActive").default(true).notNull(),
  isFeatured: boolean("isFeatured").default(false).notNull(),
  isNew: boolean("isNew").default(false).notNull(),
  downloadCount: int("downloadCount").default(0).notNull(),
  // Tags
  tags: json("tags").$type<string[]>().default([]),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Product = typeof products.$inferSelect;
export type InsertProduct = typeof products.$inferInsert;

// ===== ORDERS =====
export const orders = mysqlTable("orders", {
  id: int("id").autoincrement().primaryKey(),
  orderNumber: varchar("orderNumber", { length: 32 }).notNull().unique(),
  userId: int("userId").notNull(),
  status: mysqlEnum("status", ["pending", "paid", "processing", "completed", "cancelled", "refunded"]).default("pending").notNull(),
  totalAmount: decimal("totalAmount", { precision: 10, scale: 2 }).notNull(),
  currency: varchar("currency", { length: 10 }).default("THB").notNull(),
  paymentMethod: mysqlEnum("paymentMethod", ["card", "promptpay", "bank_transfer", "crypto"]).default("card").notNull(),
  // Stripe
  stripeSessionId: varchar("stripeSessionId", { length: 255 }),
  stripePaymentIntentId: varchar("stripePaymentIntentId", { length: 255 }),
  // Customer info
  customerEmail: varchar("customerEmail", { length: 320 }),
  customerName: text("customerName"),
  // Metadata
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  paidAt: timestamp("paidAt"),
});

export type Order = typeof orders.$inferSelect;
export type InsertOrder = typeof orders.$inferInsert;

// ===== ORDER ITEMS =====
export const orderItems = mysqlTable("order_items", {
  id: int("id").autoincrement().primaryKey(),
  orderId: int("orderId").notNull(),
  productId: int("productId").notNull(),
  productName: varchar("productName", { length: 255 }).notNull(),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  quantity: int("quantity").default(1).notNull(),
  // Download tracking
  downloadToken: varchar("downloadToken", { length: 128 }),
  downloadCount: int("downloadCount").default(0).notNull(),
  downloadExpiry: timestamp("downloadExpiry"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type OrderItem = typeof orderItems.$inferSelect;
export type InsertOrderItem = typeof orderItems.$inferInsert;

// ===== CART ITEMS =====
export const cartItems = mysqlTable("cart_items", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  productId: int("productId").notNull(),
  quantity: int("quantity").default(1).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type CartItem = typeof cartItems.$inferSelect;
export type InsertCartItem = typeof cartItems.$inferInsert;

// ===== REVIEWS =====
export const reviews = mysqlTable("reviews", {
  id: int("id").autoincrement().primaryKey(),
  productId: int("productId").notNull(),
  userId: int("userId").notNull(),
  rating: int("rating").notNull(), // 1-5
  title: varchar("title", { length: 255 }),
  content: text("content"),
  isVerified: boolean("isVerified").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Review = typeof reviews.$inferSelect;
export type InsertReview = typeof reviews.$inferInsert;

// ===== API CONFIG (Developer Console) =====
export const apiConfigs = mysqlTable("api_configs", {
  id: int("id").autoincrement().primaryKey(),
  service: varchar("service", { length: 64 }).notNull(),
  keyName: varchar("keyName", { length: 128 }).notNull().unique(),
  encryptedValue: text("encryptedValue").notNull(),
  isActive: boolean("isActive").default(true).notNull(),
  lastUsedAt: timestamp("lastUsedAt"),
  updatedBy: int("updatedBy"),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ApiConfig = typeof apiConfigs.$inferSelect;
export type InsertApiConfig = typeof apiConfigs.$inferInsert;

// ===== FEATURE FLAGS =====
export const featureFlags = mysqlTable("feature_flags", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 128 }).notNull().unique(),
  value: boolean("value").default(false).notNull(),
  description: text("description"),
  updatedBy: int("updatedBy"),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type FeatureFlag = typeof featureFlags.$inferSelect;
export type InsertFeatureFlag = typeof featureFlags.$inferInsert;

// ===== SYSTEM CONFIG =====
export const systemConfig = mysqlTable("system_config", {
  id: int("id").autoincrement().primaryKey(),
  key: varchar("key", { length: 128 }).notNull().unique(),
  value: text("value").notNull(),
  category: varchar("category", { length: 64 }).notNull(),
  description: text("description"),
  updatedBy: int("updatedBy"),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type SystemConfigRow = typeof systemConfig.$inferSelect;
export type InsertSystemConfig = typeof systemConfig.$inferInsert;

// ===== ADMIN LOGS =====
export const adminLogs = mysqlTable("admin_logs", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  action: varchar("action", { length: 255 }).notNull(),
  details: json("details").$type<Record<string, unknown>>(),
  ipAddress: varchar("ipAddress", { length: 64 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type AdminLog = typeof adminLogs.$inferSelect;
export type InsertAdminLog = typeof adminLogs.$inferInsert;
