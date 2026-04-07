import React, { useState } from 'react';
import { useCurrency, AVAILABLE_CURRENCIES } from '../context/CurrencyContext';
import { ChevronDown } from 'lucide-react';

export default function CurrencySelector() {
  const { selectedCurrency, setSelectedCurrency, currencies, loading } = useCurrency();
  const [isOpen, setIsOpen] = useState(false);

  const handleSelect = (currency: typeof AVAILABLE_CURRENCIES[0]) => {
    const currencyWithRate = currencies.find(c => c.code === currency.code) || {
      ...currency,
      rate: currency.code === 'INR' ? 1 : 1
    };
    setSelectedCurrency(currencyWithRate);
    setIsOpen(false);
  };

  if (loading) {
    return (
      <div className="px-3 py-2 text-xs text-[#b8b9ea] font-medium">
        Loading rates...
      </div>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 bg-[#1e1a55] hover:bg-[#2a2463] text-white rounded-xl font-medium transition-all text-sm border border-[#2e2a73]"
      >
        <span className="text-lg">{selectedCurrency.symbol}</span>
        <span>{selectedCurrency.code}</span>
        <ChevronDown size={16} className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 bg-[#0a0820] border border-[#2e2a73] rounded-xl shadow-lg z-50">
          <div className="p-3 border-b border-[#2e2a73] max-h-96 overflow-y-auto">
            {AVAILABLE_CURRENCIES.map((currency) => (
              <button
                key={currency.code}
                onClick={() => handleSelect(currency)}
                className={`w-full text-left px-4 py-3 rounded-lg mb-1 transition-all flex items-center justify-between ${
                  selectedCurrency.code === currency.code
                    ? 'bg-[#1f6b55] text-white'
                    : 'hover:bg-[#1e1a55] text-[#b8b9ea] hover:text-white'
                }`}
              >
                <div>
                  <div className="font-medium">{currency.code}</div>
                  <div className="text-xs text-[#7a8780]">{currency.name}</div>
                </div>
                <span className="text-lg">{currency.symbol}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
