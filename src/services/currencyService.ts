import { CurrencyCode, CurrencyConfig, CurrencyDetail } from '../types';

export const SUPPORTED_CURRENCIES: Record<CurrencyCode, CurrencyDetail> = {
  USD: {
    code: 'USD',
    name: 'US Dollar',
    symbol: '$',
    flag: '🇺🇸',
    rateFromUSD: 1.0,
    decimals: 2,
    symbolPosition: 'prefix',
  },
  EUR: {
    code: 'EUR',
    name: 'Euro',
    symbol: '€',
    flag: '🇪🇺',
    rateFromUSD: 0.92,
    decimals: 2,
    symbolPosition: 'prefix',
  },
  GBP: {
    code: 'GBP',
    name: 'British Pound',
    symbol: '£',
    flag: '🇬🇧',
    rateFromUSD: 0.79,
    decimals: 2,
    symbolPosition: 'prefix',
  },
  JPY: {
    code: 'JPY',
    name: 'Japanese Yen',
    symbol: '¥',
    flag: '🇯🇵',
    rateFromUSD: 152.5,
    decimals: 0,
    symbolPosition: 'prefix',
  },
  CAD: {
    code: 'CAD',
    name: 'Canadian Dollar',
    symbol: 'CA$',
    flag: '🇨🇦',
    rateFromUSD: 1.37,
    decimals: 2,
    symbolPosition: 'prefix',
  },
  AUD: {
    code: 'AUD',
    name: 'Australian Dollar',
    symbol: 'A$',
    flag: '🇦🇺',
    rateFromUSD: 1.53,
    decimals: 2,
    symbolPosition: 'prefix',
  },
  INR: {
    code: 'INR',
    name: 'Indian Rupee',
    symbol: '₹',
    flag: '🇮🇳',
    rateFromUSD: 83.7,
    decimals: 2,
    symbolPosition: 'prefix',
  },
  CHF: {
    code: 'CHF',
    name: 'Swiss Franc',
    symbol: 'CHF ',
    flag: '🇨🇭',
    rateFromUSD: 0.89,
    decimals: 2,
    symbolPosition: 'prefix',
  },
  CNY: {
    code: 'CNY',
    name: 'Chinese Yuan',
    symbol: '¥',
    flag: '🇨🇳',
    rateFromUSD: 7.24,
    decimals: 2,
    symbolPosition: 'prefix',
  },
  SGD: {
    code: 'SGD',
    name: 'Singapore Dollar',
    symbol: 'S$',
    flag: '🇸🇬',
    rateFromUSD: 1.35,
    decimals: 2,
    symbolPosition: 'prefix',
  },
  BRL: {
    code: 'BRL',
    name: 'Brazilian Real',
    symbol: 'R$',
    flag: '🇧🇷',
    rateFromUSD: 5.45,
    decimals: 2,
    symbolPosition: 'prefix',
  },
  MXN: {
    code: 'MXN',
    name: 'Mexican Peso',
    symbol: 'Mex$',
    flag: '🇲🇽',
    rateFromUSD: 18.5,
    decimals: 2,
    symbolPosition: 'prefix',
  },
  KRW: {
    code: 'KRW',
    name: 'South Korean Won',
    symbol: '₩',
    flag: '🇰🇷',
    rateFromUSD: 1385.0,
    decimals: 0,
    symbolPosition: 'prefix',
  },
  AED: {
    code: 'AED',
    name: 'UAE Dirham',
    symbol: 'AED ',
    flag: '🇦🇪',
    rateFromUSD: 3.67,
    decimals: 2,
    symbolPosition: 'prefix',
  },
  NZD: {
    code: 'NZD',
    name: 'New Zealand Dollar',
    symbol: 'NZ$',
    flag: '🇳🇿',
    rateFromUSD: 1.64,
    decimals: 2,
    symbolPosition: 'prefix',
  },
  SEK: {
    code: 'SEK',
    name: 'Swedish Krona',
    symbol: ' kr',
    flag: '🇸🇪',
    rateFromUSD: 10.55,
    decimals: 2,
    symbolPosition: 'suffix',
  },
  NOK: {
    code: 'NOK',
    name: 'Norwegian Krone',
    symbol: ' kr',
    flag: '🇳🇴',
    rateFromUSD: 10.65,
    decimals: 2,
    symbolPosition: 'suffix',
  },
  ZAR: {
    code: 'ZAR',
    name: 'South African Rand',
    symbol: 'R ',
    flag: '🇿🇦',
    rateFromUSD: 18.2,
    decimals: 2,
    symbolPosition: 'prefix',
  },
  HKD: {
    code: 'HKD',
    name: 'Hong Kong Dollar',
    symbol: 'HK$',
    flag: '🇭🇰',
    rateFromUSD: 7.82,
    decimals: 2,
    symbolPosition: 'prefix',
  },
};

export const CURRENCY_LIST = Object.values(SUPPORTED_CURRENCIES);

export const DEFAULT_CURRENCY_CONFIG: CurrencyConfig = {
  baseCurrency: 'USD',
  displayCurrency: 'USD',
  customRates: {},
  autoUpdateRates: true,
};

export function getCurrencyDetail(code: CurrencyCode = 'USD'): CurrencyDetail {
  return SUPPORTED_CURRENCIES[code] || SUPPORTED_CURRENCIES.USD;
}

export function getCurrencySymbol(code: CurrencyCode = 'USD'): string {
  return getCurrencyDetail(code).symbol;
}

/**
 * Calculates the exchange rate from one currency to another, factoring in any custom user rates.
 */
export function getExchangeRate(
  from: CurrencyCode,
  to: CurrencyCode,
  customRates?: Partial<Record<CurrencyCode, number>>
): number {
  if (from === to) return 1.0;

  const fromDetail = getCurrencyDetail(from);
  const toDetail = getCurrencyDetail(to);

  const fromRateUSD = customRates?.[from] ?? fromDetail.rateFromUSD;
  const toRateUSD = customRates?.[to] ?? toDetail.rateFromUSD;

  if (fromRateUSD <= 0) return 1.0;

  // 1 USD = fromRateUSD * FROM
  // 1 USD = toRateUSD * TO
  // 1 FROM = (toRateUSD / fromRateUSD) * TO
  return toRateUSD / fromRateUSD;
}

/**
 * Converts a numerical amount from one currency to another.
 */
export function convertAmount(
  amount: number,
  from: CurrencyCode,
  to: CurrencyCode,
  customRates?: Partial<Record<CurrencyCode, number>>
): number {
  if (isNaN(amount) || amount === 0 || from === to) return amount;
  const rate = getExchangeRate(from, to, customRates);
  return amount * rate;
}

export interface FormatCurrencyOptions {
  compact?: boolean;
  hideSymbol?: boolean;
  showCode?: boolean;
  decimals?: number;
  fromCurrency?: CurrencyCode; // If converting from a base currency before formatting
  customRates?: Partial<Record<CurrencyCode, number>>;
}

/**
 * Formats a monetary amount into a clean, locale-aware string in the specified currency.
 */
export function formatCurrency(
  amount: number,
  currencyCode: CurrencyCode = 'USD',
  options: FormatCurrencyOptions = {}
): string {
  if (isNaN(amount)) return '$0.00';

  let finalAmount = amount;
  if (options.fromCurrency && options.fromCurrency !== currencyCode) {
    finalAmount = convertAmount(
      amount,
      options.fromCurrency,
      currencyCode,
      options.customRates
    );
  }

  const detail = getCurrencyDetail(currencyCode);
  const decimals = options.decimals !== undefined ? options.decimals : detail.decimals;

  let formattedNum = '';

  if (options.compact) {
    const abs = Math.abs(finalAmount);
    if (abs >= 1_000_000) {
      formattedNum = (finalAmount / 1_000_000).toFixed(1) + 'M';
    } else if (abs >= 1_000) {
      formattedNum = (finalAmount / 1_000).toFixed(1) + 'k';
    } else {
      formattedNum = finalAmount.toLocaleString('en-US', {
        minimumFractionDigits: 0,
        maximumFractionDigits: decimals,
      });
    }
  } else {
    formattedNum = finalAmount.toLocaleString('en-US', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });
  }

  if (options.hideSymbol) {
    return options.showCode ? `${formattedNum} ${currencyCode}` : formattedNum;
  }

  const isNegative = finalAmount < 0;
  const cleanFormatted = isNegative ? formattedNum.replace('-', '') : formattedNum;

  let result = '';
  if (detail.symbolPosition === 'prefix') {
    result = `${isNegative ? '-' : ''}${detail.symbol}${cleanFormatted}`;
  } else {
    result = `${isNegative ? '-' : ''}${cleanFormatted}${detail.symbol}`;
  }

  if (options.showCode) {
    result += ` (${currencyCode})`;
  }

  return result;
}
