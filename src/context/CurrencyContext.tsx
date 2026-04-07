import React, { createContext, useContext, useState, useEffect } from 'react';

export interface Currency {
  code: string;
  name: string;
  symbol: string;
  rate: number;
}

interface CurrencyContextType {
  selectedCurrency: Currency;
  setSelectedCurrency: (currency: Currency) => void;
  currencies: Currency[];
  loading: boolean;
  convertAmount: (amountInINR: number) => number;
  formatAmount: (amountInINR: number) => string;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

export const AVAILABLE_CURRENCIES = [
  { code: 'INR', name: 'Indian Rupee', symbol: '₹' },
  { code: 'USD', name: 'US Dollar', symbol: '$' },
  { code: 'EUR', name: 'Euro', symbol: '€' },
  { code: 'GBP', name: 'British Pound', symbol: '£' },
  { code: 'JPY', name: 'Japanese Yen', symbol: '¥' },
  { code: 'AED', name: 'UAE Dirham', symbol: 'د.إ' },
  { code: 'SGD', name: 'Singapore Dollar', symbol: 'S$' },
  { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$' },
  { code: 'AUD', name: 'Australian Dollar', symbol: 'A$' },
  { code: 'CHF', name: 'Swiss Franc', symbol: 'CHF' },
  { code: 'CNY', name: 'Chinese Yuan', symbol: '¥' },
  { code: 'THB', name: 'Thai Baht', symbol: '฿' },
  { code: 'MYR', name: 'Malaysian Ringgit', symbol: 'RM' },
];

export function CurrencyProvider({ children }: { children: React.ReactNode }) {
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCurrency, setSelectedCurrencyState] = useState<Currency>({
    code: 'INR',
    name: 'Indian Rupee',
    symbol: '₹',
    rate: 1
  });

  // Fetch exchange rates on mount
  useEffect(() => {
    const fetchRates = async () => {
      try {
        setLoading(true);
        const response = await fetch(
          'https://api.exchangerate-api.com/v4/latest/INR'
        );
        
        if (!response.ok) throw new Error('Failed to fetch rates');
        
        const data = await response.json();
        
        const updatedCurrencies = AVAILABLE_CURRENCIES.map(curr => ({
          ...curr,
          rate: curr.code === 'INR' ? 1 : (data.rates[curr.code] || 0)
        }));
        
        setCurrencies(updatedCurrencies);
        
        // Load saved currency preference or default to INR
        const saved = localStorage.getItem('selectedCurrency');
        if (saved) {
          const parsed = JSON.parse(saved);
          const currency = updatedCurrencies.find(c => c.code === parsed.code);
          if (currency) {
            setSelectedCurrencyState(currency);
          }
        }
      } catch (error) {
        console.error('Error fetching exchange rates:', error);
        // Use fallback rates
        const fallbackCurrencies = AVAILABLE_CURRENCIES.map(curr => ({
          ...curr,
          rate: curr.code === 'INR' ? 1 : getFallbackRate(curr.code)
        }));
        setCurrencies(fallbackCurrencies);
      } finally {
        setLoading(false);
      }
    };

    fetchRates();
  }, []);

  const setSelectedCurrency = (currency: Currency) => {
    setSelectedCurrencyState(currency);
    localStorage.setItem('selectedCurrency', JSON.stringify({
      code: currency.code,
      name: currency.name,
      symbol: currency.symbol
    }));
  };

  const convertAmount = (amountInINR: number): number => {
    return amountInINR * selectedCurrency.rate;
  };

  const formatAmount = (amountInINR: number): string => {
    const converted = convertAmount(amountInINR);
    return `${selectedCurrency.symbol}${converted.toLocaleString('en-US', { 
      minimumFractionDigits: 2, 
      maximumFractionDigits: 2 
    })}`;
  };

  return (
    <CurrencyContext.Provider value={{
      selectedCurrency,
      setSelectedCurrency,
      currencies,
      loading,
      convertAmount,
      formatAmount
    }}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  const context = useContext(CurrencyContext);
  if (!context) {
    throw new Error('useCurrency must be used within CurrencyProvider');
  }
  return context;
}

function getFallbackRate(code: string): number {
  const rates: Record<string, number> = {
    USD: 0.012,
    EUR: 0.011,
    GBP: 0.0095,
    JPY: 1.75,
    AED: 0.044,
    SGD: 0.016,
    CAD: 0.016,
    AUD: 0.018,
    CHF: 0.0107,
    CNY: 0.086,
    THB: 0.41,
    MYR: 0.055,
  };
  return rates[code] || 0;
}
