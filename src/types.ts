export type TransactionType = 'expense' | 'income';

export type CurrencyCode =
  | 'USD'
  | 'EUR'
  | 'GBP'
  | 'JPY'
  | 'CAD'
  | 'AUD'
  | 'INR'
  | 'CHF'
  | 'CNY'
  | 'SGD'
  | 'BRL'
  | 'MXN'
  | 'KRW'
  | 'AED'
  | 'NZD'
  | 'SEK'
  | 'NOK'
  | 'ZAR'
  | 'HKD';

export interface CurrencyDetail {
  code: CurrencyCode;
  name: string;
  symbol: string;
  flag: string;
  rateFromUSD: number; // 1 USD = rate * Currency
  decimals: number;
  symbolPosition: 'prefix' | 'suffix';
}

export interface CurrencyConfig {
  baseCurrency: CurrencyCode; // Data default (usually USD)
  displayCurrency: CurrencyCode; // Active selected currency for viewing & calculations
  customRates: Partial<Record<CurrencyCode, number>>; // User overrides for exchange rates if needed
  autoUpdateRates?: boolean;
}

export type PaymentMethod =
  | 'Credit Card'
  | 'Debit Card'
  | 'Bank Transfer'
  | 'Cash'
  | 'Apple Pay'
  | 'Google Pay'
  | 'PayPal'
  | 'Other';

export interface Transaction {
  id: string;
  date: string; // YYYY-MM-DD
  type: TransactionType;
  category: string;
  subcategory: string;
  amount: number;
  currency?: CurrencyCode;
  description: string;
  paymentMethod: PaymentMethod;
  isTaxDeductible: boolean;
  taxCategory?: string;
  notes?: string;
  syncedAt?: string | null;
  isPendingSync?: boolean;
  createdAt: string;
  recurringId?: string;
}

export type RecurringFrequency =
  | 'daily'
  | 'weekly'
  | 'biweekly'
  | 'monthly'
  | 'quarterly'
  | 'yearly';

export interface RecurringTransaction {
  id: string;
  description: string;
  amount: number;
  currency?: CurrencyCode;
  type: TransactionType;
  category: string;
  subcategory?: string;
  paymentMethod: PaymentMethod;
  isTaxDeductible: boolean;
  taxCategory?: string;
  frequency: RecurringFrequency;
  startDate: string; // YYYY-MM-DD
  nextDueDate: string; // YYYY-MM-DD
  lastAppliedDate?: string | null;
  isActive: boolean;
  notes?: string;
  createdAt: string;
}

export interface BudgetGoal {
  id: string;
  category: string;
  monthlyLimit: number;
  alertThresholdPercent: number; // e.g. 80
}

export interface SpendingAlert {
  id: string;
  timestamp: string;
  level: 'warning' | 'critical' | 'info';
  category: string;
  currentAmount: number;
  limitAmount: number;
  percentUsed: number;
  message: string;
  read: boolean;
}

export type SheetSyncMode = 'google_oauth' | 'sheet_id_direct' | 'webhook_appscript' | 'local_demo';

export interface SheetConfig {
  mode: SheetSyncMode;
  spreadsheetId: string;
  sheetName: string;
  accessToken: string;
  apiKey?: string;
  webhookUrl?: string;
  isConnected: boolean;
  lastSyncedAt: string | null;
  autoSyncIntervalMinutes: number; // 0 for manual, 1, 5, 15
  isSyncing: boolean;
  syncError: string | null;
}

export interface SecurityConfig {
  isBiometricAvailable: boolean;
  biometricEnabled: boolean;
  pinEnabled: boolean;
  pinHash: string | null;
  isLocked: boolean;
  autoLockMinutes: number;
  privacyBlur: boolean;
  credentialId?: string;
}

export interface AIClassificationResult {
  category: string;
  subcategory: string;
  type: TransactionType;
  extractedAmount: number | null;
  paymentMethod: PaymentMethod;
  isTaxDeductible: boolean;
  taxCategory: string;
  confidence: number;
  cleanDescription: string;
  reasoning: string;
}

export interface AITaxAnalysisResult {
  estimatedTaxSavings: number;
  taxableNetIncome: number;
  topWriteOffCategories: Array<{
    category: string;
    amount: number;
    irsSchedule: string;
    tip: string;
  }>;
  actionableTaxTips: string[];
  auditRiskScore: 'Low' | 'Moderate' | 'High';
  auditRiskReason: string;
  quarterlyEstimatedTaxRecommendation: number;
}

export interface AIInsight {
  id: string;
  title: string;
  type: 'saving_opportunity' | 'spending_anomaly' | 'forecast' | 'subscription_audit' | 'tax_boost';
  summary: string;
  impactAmount?: number;
  actionRecommendation: string;
  category?: string;
  urgency: 'low' | 'medium' | 'high';
}

export interface AIChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  suggestedPrompts?: string[];
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role?: string;
  passwordHash?: string;
  pinHash?: string | null;
  biometricCredentialId?: string;
  biometricRegisteredAt?: string | null;
  hasBiometrics: boolean;
  twoFactorEnabled?: boolean;
  createdAt: string;
  lastLoginAt: string;
  preferences?: {
    theme?: 'light' | 'dark' | 'system';
    currency?: CurrencyCode;
    quickBiometricLogin?: boolean;
    autoLockMinutes?: number;
  };
}

export interface AuthState {
  isAuthenticated: boolean;
  currentUser: UserProfile | null;
  isLoading?: boolean;
  sessionExpiresAt?: number | null;
  token?: string;
}
