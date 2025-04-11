import express, { type Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { 
  loginSchema, 
  registerSchema, 
  keyValidationSchema,
  insertKeySchema,
  insertReferralTokenSchema,
  DeviceRegistration
} from '@shared/schema';
import { ZodError } from 'zod';
import session from 'express-session';
import MemoryStore from 'memorystore';

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);
  
  // Initialize session
  const SessionStore = MemoryStore(session);
  app.use(session({
    secret: process.env.SESSION_SECRET || 'x-ruler-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: process.env.NODE_ENV === 'production', maxAge: 86400000 }, // 1 day
    store: new SessionStore({ checkPeriod: 86400000 }) // prune expired entries every 24h
  }));
  
  // Middleware to check authentication
  function requireAuth(req: Request, res: Response, next: Function) {
    if (!req.session.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }
    next();
  }
  
  function requireAdmin(req: Request, res: Response, next: Function) {
    if (!req.session.user || req.session.user.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }
    next();
  }
  
  function requireReseller(req: Request, res: Response, next: Function) {
    if (!req.session.user || req.session.user.role !== 'reseller') {
      return res.status(403).json({ message: 'Reseller access required' });
    }
    next();
  }
  
  // Ensure data directory exists
  await storage.ensureDataDirectory();
  
  // Authentication Routes
  app.post('/api/admin/login', async (req, res) => {
    try {
      const { username, password } = loginSchema.parse(req.body);
      
      const admin = await storage.getAdmin(username);
      if (!admin || admin.password !== password) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }
      
      req.session.user = { id: 0, username, role: 'admin' };
      return res.status(200).json({ message: 'Login successful', user: { username, role: 'admin' } });
    } catch (err) {
      if (err instanceof ZodError) {
        return res.status(400).json({ message: 'Invalid input', errors: err.errors });
      }
      return res.status(500).json({ message: 'An error occurred' });
    }
  });
  
  app.post('/api/reseller/login', async (req, res) => {
    try {
      const { username, password } = loginSchema.parse(req.body);
      
      const reseller = await storage.getResellerByUsername(username);
      if (!reseller || reseller.password !== password) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }
      
      req.session.user = { id: reseller.id, username, role: 'reseller' };
      return res.status(200).json({ 
        message: 'Login successful', 
        user: { id: reseller.id, username, role: 'reseller', credits: reseller.credits } 
      });
    } catch (err) {
      if (err instanceof ZodError) {
        return res.status(400).json({ message: 'Invalid input', errors: err.errors });
      }
      return res.status(500).json({ message: 'An error occurred' });
    }
  });
  
  app.post('/api/reseller/register', async (req, res) => {
    try {
      const { username, password, referralToken } = registerSchema.parse(req.body);
      
      // Check if username is available
      const existingReseller = await storage.getResellerByUsername(username);
      if (existingReseller) {
        return res.status(400).json({ message: 'Username already taken' });
      }
      
      // Validate referral token
      const token = await storage.getReferralToken(referralToken);
      if (!token || token.used) {
        return res.status(400).json({ message: 'Invalid or used referral token' });
      }
      
      // Create reseller
      const newReseller = await storage.createReseller({
        username,
        password,
        credits: 0
      });
      
      // Mark token as used
      await storage.useReferralToken(referralToken, username);
      
      return res.status(201).json({ 
        message: 'Registration successful', 
        reseller: { id: newReseller.id, username, credits: newReseller.credits } 
      });
    } catch (err) {
      if (err instanceof ZodError) {
        return res.status(400).json({ message: 'Invalid input', errors: err.errors });
      }
      return res.status(500).json({ message: 'An error occurred' });
    }
  });
  
  app.post('/api/logout', (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ message: 'Logout failed' });
      }
      res.clearCookie('connect.sid');
      return res.status(200).json({ message: 'Logout successful' });
    });
  });
  
  app.get('/api/me', (req, res) => {
    if (!req.session.user) {
      return res.status(401).json({ message: 'Not authenticated' });
    }
    return res.status(200).json({ user: req.session.user });
  });
  
  // Admin Routes
  app.post('/api/admin/referral-token', requireAdmin, async (req, res) => {
    try {
      const token = crypto.randomBytes(12).toString('hex').toUpperCase();
      const tokenPrefix = 'X-R-T0K3N-';
      const fullToken = `${tokenPrefix}${token}`;
      
      const newToken = await storage.createReferralToken({
        token: fullToken,
        createdBy: req.session.user!.username,
      });
      
      return res.status(201).json({ token: newToken });
    } catch (err) {
      return res.status(500).json({ message: 'Failed to generate referral token' });
    }
  });
  
  app.get('/api/admin/resellers', requireAdmin, async (req, res) => {
    try {
      const resellers = await storage.getAllResellers();
      return res.status(200).json({ resellers });
    } catch (err) {
      return res.status(500).json({ message: 'Failed to fetch resellers' });
    }
  });
  
  app.post('/api/admin/resellers/:id/credits', requireAdmin, async (req, res) => {
    try {
      const resellerId = parseInt(req.params.id);
      const { credits } = req.body;
      
      if (isNaN(credits) || credits < 0) {
        return res.status(400).json({ message: 'Invalid credits value' });
      }
      
      const reseller = await storage.getReseller(resellerId);
      if (!reseller) {
        return res.status(404).json({ message: 'Reseller not found' });
      }
      
      const updatedReseller = await storage.updateResellerCredits(
        resellerId, 
        reseller.credits + credits
      );
      
      return res.status(200).json({ reseller: updatedReseller });
    } catch (err) {
      return res.status(500).json({ message: 'Failed to add credits' });
    }
  });
  
  app.delete('/api/admin/resellers/:id', requireAdmin, async (req, res) => {
    try {
      const resellerId = parseInt(req.params.id);
      const success = await storage.deleteReseller(resellerId);
      
      if (!success) {
        return res.status(404).json({ message: 'Reseller not found' });
      }
      
      return res.status(200).json({ message: 'Reseller deleted successfully' });
    } catch (err) {
      return res.status(500).json({ message: 'Failed to delete reseller' });
    }
  });
  
  app.get('/api/admin/keys', requireAdmin, async (req, res) => {
    try {
      const keys = await storage.getAllKeys();
      return res.status(200).json({ keys });
    } catch (err) {
      return res.status(500).json({ message: 'Failed to fetch keys' });
    }
  });
  
  // Reseller Routes
  app.get('/api/reseller/credits', requireReseller, async (req, res) => {
    try {
      const reseller = await storage.getReseller(req.session.user!.id);
      if (!reseller) {
        return res.status(404).json({ message: 'Reseller not found' });
      }
      
      return res.status(200).json({ credits: reseller.credits });
    } catch (err) {
      return res.status(500).json({ message: 'Failed to fetch credits' });
    }
  });
  
  app.get('/api/reseller/keys', requireReseller, async (req, res) => {
    try {
      const keys = await storage.getKeysByReseller(req.session.user!.username);
      return res.status(200).json({ keys });
    } catch (err) {
      return res.status(500).json({ message: 'Failed to fetch keys' });
    }
  });
  
  app.post('/api/reseller/keys', requireReseller, async (req, res) => {
    try {
      const { game, deviceLimit, expiryDays, customKey } = req.body;
      
      // Validate input
      if (!game || !deviceLimit || !expiryDays) {
        return res.status(400).json({ message: 'Missing required fields' });
      }
      
      if (isNaN(deviceLimit) || ![1, 2, 100].includes(parseInt(deviceLimit))) {
        return res.status(400).json({ message: 'Invalid device limit' });
      }
      
      if (isNaN(expiryDays) || expiryDays < 1 || expiryDays > 365) {
        return res.status(400).json({ message: 'Invalid expiry days' });
      }
      
      // Check credits
      const reseller = await storage.getReseller(req.session.user!.id);
      if (!reseller) {
        return res.status(404).json({ message: 'Reseller not found' });
      }
      
      if (reseller.credits < 1) {
        return res.status(400).json({ message: 'Insufficient credits' });
      }
      
      // Generate key
      const keyPrefix = game.toUpperCase().replace(/\s+/g, '');
      const generatedKey = customKey || storage.generateUniqueKey(keyPrefix);
      
      // Check if key already exists
      const existingKey = await storage.getKey(generatedKey);
      if (existingKey) {
        return res.status(400).json({ message: 'Key already exists' });
      }
      
      // Calculate expiry date
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + parseInt(expiryDays));
      
      // Create key
      const newKey = await storage.createKey({
        key: generatedKey,
        game,
        deviceLimit: parseInt(deviceLimit),
        expiryDays: parseInt(expiryDays),
        createdBy: req.session.user!.username,
        expiresAt
      });
      
      // Deduct credits
      await storage.updateResellerCredits(reseller.id, reseller.credits - 1);
      
      return res.status(201).json({ 
        key: newKey,
        creditsRemaining: reseller.credits - 1
      });
    } catch (err) {
      return res.status(500).json({ message: 'Failed to generate key' });
    }
  });
  
  app.delete('/api/reseller/keys/:id', requireReseller, async (req, res) => {
    try {
      const keyId = parseInt(req.params.id);
      
      // Check if key exists and belongs to reseller
      const key = await storage.getKeyById(keyId);
      if (!key) {
        return res.status(404).json({ message: 'Key not found' });
      }
      
      if (key.createdBy !== req.session.user!.username) {
        return res.status(403).json({ message: 'Not authorized to revoke this key' });
      }
      
      // Deactivate key
      const updatedKey = await storage.deactivateKey(keyId);
      
      return res.status(200).json({ message: 'Key revoked successfully', key: updatedKey });
    } catch (err) {
      return res.status(500).json({ message: 'Failed to revoke key' });
    }
  });
  
  // Key Verification API Endpoints (Public)
  app.get('/api/verify', async (req, res) => {
    try {
      const { key, deviceId } = req.query;
      
      if (!key || !deviceId) {
        return res.status(400).json({ 
          success: false,
          message: 'Key and deviceId are required' 
        });
      }
      
      return await verifyKey(String(key), String(deviceId), res);
    } catch (err) {
      return res.status(500).json({ 
        success: false,
        message: 'An error occurred during verification' 
      });
    }
  });
  
  app.post('/api/verify', async (req, res) => {
    try {
      const { key, deviceId } = keyValidationSchema.parse(req.body);
      return await verifyKey(key, deviceId, res);
    } catch (err) {
      if (err instanceof ZodError) {
        return res.status(400).json({ 
          success: false,
          message: 'Invalid input',
          errors: err.errors 
        });
      }
      return res.status(500).json({ 
        success: false,
        message: 'An error occurred during verification' 
      });
    }
  });
  
  // Helper function for key verification
  async function verifyKey(key: string, deviceId: string, res: Response) {
    // Get key
    const keyData = await storage.getKey(key);
    if (!keyData) {
      return res.status(404).json({ 
        success: false,
        message: 'Invalid key' 
      });
    }
    
    // Check if key is active
    if (!keyData.isActive) {
      return res.status(403).json({ 
        success: false,
        message: 'Key has been revoked' 
      });
    }
    
    // Check expiry
    if (new Date() > new Date(keyData.expiresAt)) {
      return res.status(403).json({ 
        success: false,
        message: 'Key has expired' 
      });
    }
    
    // Check device registrations
    const registrations = await storage.getDeviceRegistrationsByKey(keyData.id);
    
    // Check if this device is already registered
    const existingRegistration = await storage.getDeviceRegistrationByKeyAndDevice(keyData.id, deviceId);
    
    if (existingRegistration) {
      // Device is already registered, allow access
      return res.status(200).json({ 
        success: true,
        message: 'Key validated successfully',
        game: keyData.game,
        expiresAt: keyData.expiresAt
      });
    }
    
    // Check if device limit is reached
    if (registrations.length >= keyData.deviceLimit) {
      return res.status(403).json({ 
        success: false,
        message: `Device limit reached (${keyData.deviceLimit})` 
      });
    }
    
    // Register new device
    await storage.registerDevice({
      keyId: keyData.id,
      deviceId
    });
    
    return res.status(200).json({ 
      success: true,
      message: 'Key validated and device registered',
      game: keyData.game,
      expiresAt: keyData.expiresAt
    });
  }

  return httpServer;
}
