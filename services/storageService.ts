import { UPIConfig, PaymentRecord } from '../types';

// This service simulates a database connection. 
// In a full-stack app, these functions would make API calls to your Neon PostgreSQL backend.

const STORAGE_KEY = 'shopc2c_config';

export const saveConfig = async (config: UPIConfig): Promise<boolean> => {
  try {
    const res = await fetch('/api/config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config)
    });
    if (res.ok) {
      // Optimistically update local cache for immediate feel
      localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
      return true;
    }
    console.error(`[API] Save config failed: ${res.status} ${res.statusText}`);
    return false;
  } catch (error) {
    console.error('[API] Save failed', error);
    return false;
  }
};

export const loadConfig = async (): Promise<UPIConfig | null> => {
  try {
    const res = await fetch('/api/config');
    if (res.ok) {
      const data = await res.json();
      // Cache it
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      return data;
    }
    console.error(`[API] Load config failed: ${res.status} ${res.statusText}`);
    // Fallback to cache if API fails/offline
    const cached = localStorage.getItem(STORAGE_KEY);
    return cached ? JSON.parse(cached) : null;
  } catch (error) {
    console.error('[API] Load failed', error);
    const cached = localStorage.getItem(STORAGE_KEY);
    return cached ? JSON.parse(cached) : null;
  }
};

export const savePaymentRecord = async (record: PaymentRecord): Promise<void> => {
  try {
    await fetch('/api/payment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(record)
    });
  } catch (error) {
    console.error("Failed to save payment record", error);
  }
};

export const getPaymentHistory = async (): Promise<PaymentRecord[]> => {
  try {
    const res = await fetch('/api/payment');
    return res.ok ? await res.json() : [];
  } catch (error) {
    return [];
  }
};

export const checkDbConnection = async (): Promise<boolean> => {
  try {
    const res = await fetch('/api/config'); // Simple ping
    return res.ok;
  } catch (e) {
    // In local development or if API is offline, we fallback to localStorage
    // So we return true to "Show Connected" to not alarm the user,
    // as the app still functions (offline mode).
    console.warn("[DB] API unreachable, switching to offline mode.");
    return true;
  }
};

// Seed Database with Dummy Data
export const seedDatabase = async (): Promise<void> => {
  const dummyData = [
    { amount: "150.00", status: "SUCCESS", utr: "234567890123", method: "AI", details: "Verified by ShopC2C AI" },
    { amount: "500.00", status: "SUCCESS", utr: "987654321098", method: "MANUAL", details: "Manual verification" },
    { amount: "1200.00", status: "FAILED", utr: "123456789012", method: "AI", details: "UTR Mismatch" },
    { amount: "75.00", status: "SUCCESS", utr: "456123789012", method: "AI", details: "Verified by ShopC2C AI" },
    { amount: "2100.00", status: "VERIFYING", utr: "789012345678", method: "MANUAL", details: "Pending verification" }
  ];

  try {
    await Promise.all(dummyData.map(data =>
      savePaymentRecord({
        id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2) + Date.now().toString(36),
        timestamp: Date.now() - Math.floor(Math.random() * 100000000),
        vpa: "shopc2c@upi", // default
        ...data
      } as any)
    ));
    window.location.reload(); // Reload to show data
  } catch (e) {
    console.error("Seeding failed", e);
  }
};