import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Admin schema (admin credentials will be stored separately in a JSON file)
export const admins = pgTable("admins", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

// Reseller schema
export const resellers = pgTable("resellers", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  credits: integer("credits").notNull().default(0),
});

// ReferralToken schema
export const referralTokens = pgTable("referral_tokens", {
  id: serial("id").primaryKey(),
  token: text("token").notNull().unique(),
  used: boolean("used").notNull().default(false),
  createdBy: text("created_by").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  usedBy: text("used_by"),
  usedAt: timestamp("used_at"),
});

// Key schema
export const keys = pgTable("keys", {
  id: serial("id").primaryKey(),
  key: text("key").notNull().unique(),
  game: text("game").notNull(),
  deviceLimit: integer("device_limit").notNull(),
  expiryDays: integer("expiry_days").notNull(),
  isActive: boolean("is_active").notNull().default(true),
  createdBy: text("created_by").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  expiresAt: timestamp("expires_at").notNull(),
});

// DeviceRegistration schema
export const deviceRegistrations = pgTable("device_registrations", {
  id: serial("id").primaryKey(),
  keyId: integer("key_id").notNull(),
  deviceId: text("device_id").notNull(),
  registeredAt: timestamp("registered_at").notNull().defaultNow(),
});

// Insert schemas
export const insertResellerSchema = createInsertSchema(resellers).pick({
  username: true,
  password: true,
  credits: true,
});

export const insertReferralTokenSchema = createInsertSchema(referralTokens).pick({
  token: true,
  createdBy: true,
});

export const insertKeySchema = createInsertSchema(keys).pick({
  key: true,
  game: true,
  deviceLimit: true,
  expiryDays: true,
  createdBy: true,
  expiresAt: true,
});

export const insertDeviceRegistrationSchema = createInsertSchema(deviceRegistrations).pick({
  keyId: true,
  deviceId: true,
});

// Registration schema for reseller registration
export const registerSchema = z.object({
  username: z.string().min(3).max(50),
  password: z.string().min(6),
  referralToken: z.string().min(5),
});

// Login schema
export const loginSchema = z.object({
  username: z.string(),
  password: z.string(),
});

// Key validation schema
export const keyValidationSchema = z.object({
  key: z.string(),
  deviceId: z.string(),
});

// Type definitions
export type Reseller = typeof resellers.$inferSelect;
export type InsertReseller = z.infer<typeof insertResellerSchema>;

export type ReferralToken = typeof referralTokens.$inferSelect;
export type InsertReferralToken = z.infer<typeof insertReferralTokenSchema>;

export type Key = typeof keys.$inferSelect;
export type InsertKey = z.infer<typeof insertKeySchema>;

export type DeviceRegistration = typeof deviceRegistrations.$inferSelect;
export type InsertDeviceRegistration = z.infer<typeof insertDeviceRegistrationSchema>;

export type RegisterReseller = z.infer<typeof registerSchema>;
export type Login = z.infer<typeof loginSchema>;
export type KeyValidation = z.infer<typeof keyValidationSchema>;
