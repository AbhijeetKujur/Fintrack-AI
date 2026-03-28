import React, { useState, useRef, useEffect } from 'react';
import { Plus, Tag as TagIcon, Calendar, IndianRupee, Store, FileText } from 'lucide-react';
import { Expense, Tag } from '../types';
import { CATEGORIES } from '../constants';

interface ManualExpenseFormProps {
  onAddExpense: (expense: Partial<Expense>) => Promise<void>;
  availableTags: Tag[];
}

export default function ManualExpenseForm({ onAddExpense, availableTags }: ManualExpenseFormProps) {
  const [amount, setAmount] = useState('');
  const [merchant, setMerchant] = useState('');
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [time, setTime] = useState('');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [status, setStatus] = useState<'pending' | 'completed' | 'cancelled'>('completed');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [filteredSuggestions, setFilteredSuggestions] = useState<Tag[]>([]);
  const suggestionRef = useRef<HTMLDivElement>(null);
  const labelClass = 'text-[10px] font-bold uppercase tracking-widest text-[#aeb1ed] ml-1';
  const inputClass = 'w-full px-4 py-3 bg-[#1a174c] border border-[#3f3a90] rounded-2xl text-sm text-[#eef1ff] placeholder:text-[#8b8dc9] focus:ring-2 focus:ring-[#7b5cff]/40 focus:border-[#7b5cff] transition-all';
  const inputWithIconClass = 'w-full pl-10 pr-4 py-3 bg-[#1a174c] border border-[#3f3a90] rounded-2xl text-sm text-[#eef1ff] placeholder:text-[#8b8dc9] focus:ring-2 focus:ring-[#7b5cff]/40 focus:border-[#7b5cff] transition-all';

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (suggestionRef.current && !suggestionRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleTagChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setTags(value);

    const lastTag = value.split(',').pop()?.trim().toLowerCase() || '';
    if (lastTag.length > 0) {
      const suggestions = availableTags.filter(tag => 
        tag.name.toLowerCase().includes(lastTag) && 
        !value.toLowerCase().includes(tag.name.toLowerCase())
      );
      setFilteredSuggestions(suggestions);
      setShowSuggestions(suggestions.length > 0);
    } else {
      setShowSuggestions(false);
    }
  };

  const selectSuggestion = (tagName: string) => {
    const tagParts = tags.split(',').map(t => t.trim());
    tagParts.pop(); // Remove the partial tag
    const newTags = [...tagParts, tagName].join(', ') + ', ';
    setTags(newTags);
    setShowSuggestions(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !merchant) return;

    setIsSubmitting(true);
    try {
      await onAddExpense({
        amount: parseFloat(amount),
        merchant,
        category,
        date,
        time,
        description,
        paymentMethod,
        status,
        tags: tags.split(',').map(t => t.trim()).filter(t => t !== '').map(t => t.startsWith('#') ? t : `#${t}`),
      });
      // Reset form
      setAmount('');
      setMerchant('');
      setCategory(CATEGORIES[0]);
      setDate(new Date().toISOString().split('T')[0]);
      setTime('');
      setDescription('');
      setTags('');
      setPaymentMethod('');
      setStatus('completed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="section-card section-hover p-8 rounded-3xl border border-[#3f3a90] shadow-sm h-full">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#6f58f7] to-[#2db8ff] text-white flex items-center justify-center">
          <Plus size={20} />
        </div>
        <div>
          <h3 className="text-lg font-bold text-[#eef1ff]">Manual Entry</h3>
          <p className="text-xs text-[#b8b9ea]">Add an expense manually</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className={labelClass}>Amount (₹)</label>
            <div className="relative">
              <IndianRupee size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8b8dc9]" />
              <input
                type="number"
                step="0.01"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className={inputWithIconClass}
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <label className={labelClass}>Merchant</label>
            <div className="relative">
              <Store size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8b8dc9]" />
              <input
                type="text"
                required
                value={merchant}
                onChange={(e) => setMerchant(e.target.value)}
                placeholder="Store or Service name"
                className={inputWithIconClass}
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className={labelClass}>Date</label>
            <div className="relative">
              <Calendar size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8b8dc9]" />
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className={inputWithIconClass}
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <label className={labelClass}>Time (Optional)</label>
            <input
              type="text"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              placeholder="e.g. 10:30 AM"
              className={inputClass}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className={labelClass}>Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className={`${inputClass} appearance-none`}
            >
              {CATEGORIES.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5 relative" ref={suggestionRef}>
            <label className={labelClass}>Tags (comma separated)</label>
            <div className="relative">
              <TagIcon size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8b8dc9]" />
              <input
                type="text"
                value={tags}
                onChange={handleTagChange}
                onFocus={() => tags.length > 0 && setShowSuggestions(true)}
                placeholder="food, grocery"
                className={inputWithIconClass}
              />
            </div>
            {showSuggestions && (
              <div className="absolute z-50 w-full mt-1 bg-[#171547] border border-[#3f3a90] rounded-xl shadow-xl overflow-hidden max-h-40 overflow-y-auto">
                {filteredSuggestions.map(tag => (
                  <button
                    key={tag.id}
                    type="button"
                    onClick={() => selectSuggestion(tag.name)}
                    className="w-full text-left px-4 py-2 text-sm text-[#eef1ff] hover:bg-[#262162] transition-colors font-mono"
                  >
                    {tag.name}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className={labelClass}>Payment Method</label>
            <input
              type="text"
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              placeholder="e.g. UPI, Card"
              className={inputClass}
            />
          </div>
          <div className="space-y-1.5">
            <label className={labelClass}>Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as any)}
              className={`${inputClass} appearance-none`}
            >
              <option value="completed">Completed</option>
              <option value="pending">Pending</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>

        <div className="space-y-1.5">
          <label className={labelClass}>Description</label>
          <div className="relative">
            <FileText size={14} className="absolute left-4 top-4 text-[#8b8dc9]" />
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional details..."
              rows={2}
              className="w-full pl-10 pr-4 py-3 bg-[#1a174c] border border-[#3f3a90] rounded-2xl text-sm text-[#eef1ff] placeholder:text-[#8b8dc9] focus:ring-2 focus:ring-[#7b5cff]/40 focus:border-[#7b5cff] transition-all resize-none"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-4 bg-gradient-to-r from-[#7b5cff] via-[#5f5be8] to-[#2fbbff] text-white rounded-2xl font-bold hover:brightness-110 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-[#1d1858]/70 mt-2"
        >
          {isSubmitting ? 'Saving...' : 'Save Expense'}
        </button>
      </form>
    </div>
  );
}
