export enum PaymentStatus {
  IDLE = 'IDLE',
  VERIFYING = 'VERIFYING',
  SUCCESS = 'SUCCESS',
  FAILED = 'FAILED',
  SCANNING = 'SCANNING', // For AI Receipt Analysis
}

export interface UPIConfig {
  pa: string; // Payee Address (VPA)
  pn: string; // Payee Name
  am?: string; // Amount
  tn?: string; // Transaction Note
  title?: string; // Custom Page Title
  amountLocked?: boolean; // If true, user cannot edit amount
  redirectUrl?: string; // URL to redirect after successful payment
  maintenanceMode?: boolean; // Toggles maintenance screen
  maintenanceMessage?: string; // Custom message for users
  maintenanceEndTime?: number; // Unix timestamp for when maintenance should end
}

export interface VerificationResult {
  isValid: boolean;
  message: string;
  extractedData?: {
    utr?: string;
    amount?: string;
    status?: string;
  };
}

export interface PaymentRecord {
  id: string;
  timestamp: number;
  amount: string;
  status: PaymentStatus;
  utr?: string;
  vpa: string;
  method: 'MANUAL' | 'AI';
  details?: string;
}