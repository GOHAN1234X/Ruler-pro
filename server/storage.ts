import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { 
  Reseller, InsertReseller, 
  ReferralToken, InsertReferralToken, 
  Key, InsertKey, 
  DeviceRegistration, InsertDeviceRegistration 
} from '@shared/schema';

// Define the admin type
interface Admin {
  username: string;
  password: string;
}

export interface IStorage {
  // Admin methods
  getAdmin(username: string): Promise<Admin | undefined>;
  
  // Reseller methods
  getReseller(id: number): Promise<Reseller | undefined>;
  getResellerByUsername(username: string): Promise<Reseller | undefined>;
  getAllResellers(): Promise<Reseller[]>;
  createReseller(reseller: InsertReseller): Promise<Reseller>;
  updateResellerCredits(id: number, credits: number): Promise<Reseller | undefined>;
  deleteReseller(id: number): Promise<boolean>;
  
  // Referral token methods
  createReferralToken(token: InsertReferralToken): Promise<ReferralToken>;
  getReferralToken(token: string): Promise<ReferralToken | undefined>;
  useReferralToken(token: string, username: string): Promise<ReferralToken | undefined>;
  getAllReferralTokens(): Promise<ReferralToken[]>;
  
  // Key methods
  createKey(key: InsertKey): Promise<Key>;
  getKey(key: string): Promise<Key | undefined>;
  getKeyById(id: number): Promise<Key | undefined>;
  getKeysByReseller(reseller: string): Promise<Key[]>;
  getAllKeys(): Promise<Key[]>;
  deactivateKey(id: number): Promise<Key | undefined>;
  
  // Device registration methods
  registerDevice(registration: InsertDeviceRegistration): Promise<DeviceRegistration>;
  getDeviceRegistrationsByKey(keyId: number): Promise<DeviceRegistration[]>;
  getDeviceRegistrationByKeyAndDevice(keyId: number, deviceId: string): Promise<DeviceRegistration | undefined>;
  
  // Utils
  ensureDataDirectory(): Promise<void>;
}

export class MemStorage implements IStorage {
  private admins: Map<string, Admin>;
  private resellers: Map<number, Reseller>;
  private referralTokens: Map<string, ReferralToken>;
  private keys: Map<number, Key>;
  private deviceRegistrations: Map<number, DeviceRegistration>;
  
  private currentResellerId: number;
  private currentReferralTokenId: number;
  private currentKeyId: number;
  private currentDeviceRegistrationId: number;
  
  private dataDir: string;
  
  constructor() {
    this.admins = new Map<string, Admin>();
    this.resellers = new Map<number, Reseller>();
    this.referralTokens = new Map<string, ReferralToken>();
    this.keys = new Map<number, Key>();
    this.deviceRegistrations = new Map<number, DeviceRegistration>();
    
    this.currentResellerId = 1;
    this.currentReferralTokenId = 1;
    this.currentKeyId = 1;
    this.currentDeviceRegistrationId = 1;
    
    this.dataDir = path.join(process.cwd(), 'data');
    
    // Load data from files if they exist
    this.loadData();
  }
  
  // Admin methods
  async getAdmin(username: string): Promise<Admin | undefined> {
    return this.admins.get(username);
  }
  
  // Reseller methods
  async getReseller(id: number): Promise<Reseller | undefined> {
    return this.resellers.get(id);
  }
  
  async getResellerByUsername(username: string): Promise<Reseller | undefined> {
    for (const reseller of this.resellers.values()) {
      if (reseller.username === username) {
        return reseller;
      }
    }
    return undefined;
  }
  
  async getAllResellers(): Promise<Reseller[]> {
    return Array.from(this.resellers.values());
  }
  
  async createReseller(reseller: InsertReseller): Promise<Reseller> {
    const id = this.currentResellerId++;
    const newReseller: Reseller = { 
      ...reseller, 
      id, 
      credits: reseller.credits || 0,  // Ensure credits is not undefined
      createdAt: new Date()
    };
    this.resellers.set(id, newReseller);
    
    // Create reseller json file
    await this.ensureDataDirectory();
    const resellerFile = path.join(this.dataDir, `${newReseller.username}.json`);
    await fs.promises.writeFile(resellerFile, JSON.stringify({ keys: [] }), 'utf8');
    
    await this.saveData();
    return newReseller;
  }
  
  async updateResellerCredits(id: number, credits: number): Promise<Reseller | undefined> {
    const reseller = await this.getReseller(id);
    if (!reseller) {
      return undefined;
    }
    
    const updatedReseller: Reseller = { ...reseller, credits };
    this.resellers.set(id, updatedReseller);
    
    await this.saveData();
    return updatedReseller;
  }
  
  async deleteReseller(id: number): Promise<boolean> {
    const reseller = await this.getReseller(id);
    if (!reseller) {
      return false;
    }
    
    // Delete reseller json file
    const resellerFile = path.join(this.dataDir, `${reseller.username}.json`);
    if (fs.existsSync(resellerFile)) {
      await fs.promises.unlink(resellerFile);
    }
    
    const result = this.resellers.delete(id);
    await this.saveData();
    return result;
  }
  
  // Referral token methods
  async createReferralToken(token: InsertReferralToken): Promise<ReferralToken> {
    const id = this.currentReferralTokenId++;
    const newToken: ReferralToken = { 
      ...token, 
      id,
      used: false,
      createdAt: new Date(),
      usedBy: null,
      usedAt: null 
    };
    
    this.referralTokens.set(token.token, newToken);
    await this.saveData();
    return newToken;
  }
  
  async getReferralToken(token: string): Promise<ReferralToken | undefined> {
    return this.referralTokens.get(token);
  }
  
  async useReferralToken(token: string, username: string): Promise<ReferralToken | undefined> {
    const referralToken = await this.getReferralToken(token);
    if (!referralToken || referralToken.used) {
      return undefined;
    }
    
    const updatedToken: ReferralToken = {
      ...referralToken,
      used: true,
      usedBy: username,
      usedAt: new Date()
    };
    
    this.referralTokens.set(token, updatedToken);
    await this.saveData();
    return updatedToken;
  }
  
  async getAllReferralTokens(): Promise<ReferralToken[]> {
    return Array.from(this.referralTokens.values());
  }
  
  // Key methods
  async createKey(key: InsertKey): Promise<Key> {
    const id = this.currentKeyId++;
    const newKey: Key = { 
      ...key, 
      id,
      isActive: true,
      createdAt: new Date()
    };
    
    this.keys.set(id, newKey);
    
    // Add to reseller's json file
    await this.updateResellerKeyFile(newKey.createdBy, newKey);
    
    await this.saveData();
    return newKey;
  }
  
  async getKey(key: string): Promise<Key | undefined> {
    for (const k of this.keys.values()) {
      if (k.key === key) {
        return k;
      }
    }
    return undefined;
  }
  
  async getKeyById(id: number): Promise<Key | undefined> {
    return this.keys.get(id);
  }
  
  async getKeysByReseller(reseller: string): Promise<Key[]> {
    const resellerKeys: Key[] = [];
    for (const key of this.keys.values()) {
      if (key.createdBy === reseller) {
        resellerKeys.push(key);
      }
    }
    return resellerKeys;
  }
  
  async getAllKeys(): Promise<Key[]> {
    return Array.from(this.keys.values());
  }
  
  async deactivateKey(id: number): Promise<Key | undefined> {
    const key = await this.getKeyById(id);
    if (!key) {
      return undefined;
    }
    
    const updatedKey: Key = { ...key, isActive: false };
    this.keys.set(id, updatedKey);
    
    // Update in reseller's json file
    await this.updateResellerKeyFile(updatedKey.createdBy, updatedKey);
    
    await this.saveData();
    return updatedKey;
  }
  
  // Device registration methods
  async registerDevice(registration: InsertDeviceRegistration): Promise<DeviceRegistration> {
    const id = this.currentDeviceRegistrationId++;
    const newRegistration: DeviceRegistration = { 
      ...registration, 
      id,
      registeredAt: new Date()
    };
    
    this.deviceRegistrations.set(id, newRegistration);
    await this.saveData();
    return newRegistration;
  }
  
  async getDeviceRegistrationsByKey(keyId: number): Promise<DeviceRegistration[]> {
    const registrations: DeviceRegistration[] = [];
    for (const reg of this.deviceRegistrations.values()) {
      if (reg.keyId === keyId) {
        registrations.push(reg);
      }
    }
    return registrations;
  }
  
  async getDeviceRegistrationByKeyAndDevice(keyId: number, deviceId: string): Promise<DeviceRegistration | undefined> {
    for (const reg of this.deviceRegistrations.values()) {
      if (reg.keyId === keyId && reg.deviceId === deviceId) {
        return reg;
      }
    }
    return undefined;
  }
  
  // Data persistence
  private async loadData() {
    await this.ensureDataDirectory();
    
    // Load admin data
    const adminFile = path.join(this.dataDir, 'admin.json');
    if (fs.existsSync(adminFile)) {
      try {
        const adminData = await fs.promises.readFile(adminFile, 'utf8');
        const { admin } = JSON.parse(adminData);
        if (admin) {
          this.admins.set(admin.username, admin);
        }
      } catch (error) {
        console.error('Failed to load admin data:', error);
      }
    } else {
      // Create admin file if it doesn't exist
      await fs.promises.writeFile(
        adminFile, 
        JSON.stringify({ admin: { username: 'admin', password: '&-+(' } }), 
        'utf8'
      );
    }
    
    // Load referral tokens
    const tokenFile = path.join(this.dataDir, 'token.json');
    if (fs.existsSync(tokenFile)) {
      try {
        const tokenData = await fs.promises.readFile(tokenFile, 'utf8');
        const { tokens } = JSON.parse(tokenData);
        if (tokens && Array.isArray(tokens)) {
          for (const token of tokens) {
            this.referralTokens.set(token.token, {
              ...token,
              createdAt: new Date(token.createdAt),
              usedAt: token.usedAt ? new Date(token.usedAt) : null
            });
          }
          this.currentReferralTokenId = Math.max(...tokens.map((t: ReferralToken) => t.id), 0) + 1;
        }
      } catch (error) {
        console.error('Failed to load token data:', error);
      }
    } else {
      // Create token file if it doesn't exist
      await fs.promises.writeFile(
        tokenFile, 
        JSON.stringify({ tokens: [] }), 
        'utf8'
      );
    }
    
    // Load resellers
    const resellerFile = path.join(this.dataDir, 'reseller.json');
    if (fs.existsSync(resellerFile)) {
      try {
        const resellerData = await fs.promises.readFile(resellerFile, 'utf8');
        const { resellers } = JSON.parse(resellerData);
        if (resellers && Array.isArray(resellers)) {
          for (const reseller of resellers) {
            this.resellers.set(reseller.id, {
              ...reseller,
              createdAt: new Date(reseller.createdAt)
            });
          }
          this.currentResellerId = Math.max(...resellers.map((r: Reseller) => r.id), 0) + 1;
        }
      } catch (error) {
        console.error('Failed to load reseller data:', error);
      }
    } else {
      // Create reseller file if it doesn't exist
      await fs.promises.writeFile(
        resellerFile, 
        JSON.stringify({ resellers: [] }), 
        'utf8'
      );
    }
    
    // Load storage state (for keys and device registrations)
    const storageFile = path.join(this.dataDir, 'storage.json');
    if (fs.existsSync(storageFile)) {
      try {
        const storageData = await fs.promises.readFile(storageFile, 'utf8');
        const data = JSON.parse(storageData);
        
        // Load keys
        if (data.keys) {
          for (const key of data.keys) {
            this.keys.set(key.id, {
              ...key,
              createdAt: new Date(key.createdAt),
              expiresAt: new Date(key.expiresAt)
            });
          }
          this.currentKeyId = Math.max(...data.keys.map((k: Key) => k.id), 0) + 1;
        }
        
        // Load device registrations
        if (data.deviceRegistrations) {
          for (const reg of data.deviceRegistrations) {
            this.deviceRegistrations.set(reg.id, {
              ...reg,
              registeredAt: new Date(reg.registeredAt)
            });
          }
          this.currentDeviceRegistrationId = Math.max(...data.deviceRegistrations.map((d: DeviceRegistration) => d.id), 0) + 1;
        }
        
      } catch (error) {
        console.error('Failed to load storage data:', error);
      }
    }
    
    // Load individual reseller key files
    const resellerUsernames = Array.from(this.resellers.values()).map(r => r.username);
    for (const username of resellerUsernames) {
      const resellerKeyFile = path.join(this.dataDir, `${username}.json`);
      if (fs.existsSync(resellerKeyFile)) {
        try {
          const keyData = await fs.promises.readFile(resellerKeyFile, 'utf8');
          const data = JSON.parse(keyData);
          if (data.keys && Array.isArray(data.keys)) {
            // Update keys in the main storage based on each reseller's file
            for (const key of data.keys) {
              this.keys.set(key.id, {
                ...key,
                createdAt: new Date(key.createdAt),
                expiresAt: new Date(key.expiresAt)
              });
            }
          }
        } catch (error) {
          console.error(`Failed to load keys for reseller ${username}:`, error);
        }
      }
    }
  }
  
  private async saveData() {
    await this.ensureDataDirectory();
    
    // Save admin data
    const adminFile = path.join(this.dataDir, 'admin.json');
    const adminData = {
      admin: Array.from(this.admins.values())[0] // Store the first admin (we only have one)
    };
    await fs.promises.writeFile(adminFile, JSON.stringify(adminData, null, 2), 'utf8');
    
    // Save referral tokens
    const tokenFile = path.join(this.dataDir, 'token.json');
    const tokenData = {
      tokens: Array.from(this.referralTokens.values())
    };
    await fs.promises.writeFile(tokenFile, JSON.stringify(tokenData, null, 2), 'utf8');
    
    // Save resellers
    const resellerFile = path.join(this.dataDir, 'reseller.json');
    const resellerData = {
      resellers: Array.from(this.resellers.values())
    };
    await fs.promises.writeFile(resellerFile, JSON.stringify(resellerData, null, 2), 'utf8');
    
    // Save storage (for other data)
    const storageFile = path.join(this.dataDir, 'storage.json');
    const storageData = {
      keys: Array.from(this.keys.values()),
      deviceRegistrations: Array.from(this.deviceRegistrations.values())
    };
    
    await fs.promises.writeFile(storageFile, JSON.stringify(storageData, null, 2), 'utf8');
  }
  
  async updateResellerKeyFile(username: string, key: Key) {
    await this.ensureDataDirectory();
    
    const resellerFile = path.join(this.dataDir, `${username}.json`);
    if (!fs.existsSync(resellerFile)) {
      await fs.promises.writeFile(resellerFile, JSON.stringify({ keys: [key] }), 'utf8');
      return;
    }
    
    try {
      const resellerData = await fs.promises.readFile(resellerFile, 'utf8');
      const data = JSON.parse(resellerData);
      
      // Update or add key
      const keyIndex = data.keys.findIndex((k: Key) => k.id === key.id);
      if (keyIndex >= 0) {
        data.keys[keyIndex] = key;
      } else {
        data.keys.push(key);
      }
      
      await fs.promises.writeFile(resellerFile, JSON.stringify(data, null, 2), 'utf8');
    } catch (error) {
      console.error(`Failed to update reseller key file for ${username}:`, error);
    }
  }
  
  async ensureDataDirectory(): Promise<void> {
    if (!fs.existsSync(this.dataDir)) {
      await fs.promises.mkdir(this.dataDir, { recursive: true });
    }
  }
  
  // Utility methods
  generateUniqueKey(prefix: string = 'FREEFIRE', customKey: string | null = null): string {
    if (customKey) {
      return customKey;
    }
    
    const randomPart = crypto.randomBytes(8).toString('hex').toUpperCase();
    return `${prefix}-${randomPart.slice(0, 6)}-${randomPart.slice(6, 12)}`;
  }
}

export const storage = new MemStorage();
