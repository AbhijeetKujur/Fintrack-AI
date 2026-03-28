import React, { useState } from 'react';
import { Plus, Trash2, Edit2, Check, X, PieChart, Target, Wallet } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Budget, Expense } from '../types';
import { CATEGORIES } from '../constants';

interface BudgetingProps {
  budgets: Budget[];
  expenses: Expense[];
  onAddBudget: (budget: Partial<Budget>) => void;
  onDeleteBudget: (id: string) => void;
}

export default function Budgeting({ budgets, expenses, onAddBudget, onDeleteBudget }: BudgetingProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [newBudget, setNewBudget] = useState<Partial<Budget>>({
    category: CATEGORIES[0],
    amount: 0,
    period: 'monthly'
  });

  const totalBudget = budgets.reduce((acc, curr) => acc + curr.amount, 0);
  const totalSpent = expenses
    .filter(e => !(e.category === 'Money Received' || e.tags.includes('#money-received')))
    .reduce((acc, curr) => acc + curr.amount, 0);

  const getSpentForCategory = (category: string) => {
    return expenses
      .filter(e => e.category === category)
      .reduce((acc, curr) => acc + curr.amount, 0);
  };

  return (
    <div className="space-y-8">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-gradient-to-br from-[#184f40] via-[#1f6b55] to-[#2b7b62] p-8 rounded-3xl text-white shadow-xl shadow-[#9fb6a8]">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center">
              <Wallet size={24} className="text-white" />
            </div>
            <div>
              <p className="text-xs font-mono uppercase tracking-widest text-[#cfe0d7]">Total Monthly Budget</p>
              <p className="text-3xl font-bold tracking-tight">₹{totalBudget.toLocaleString()}</p>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-xs font-medium">
              <span className="text-[#d6e6de]">Spent: ₹{totalSpent.toLocaleString()}</span>
              <span className="text-[#d6e6de]">{Math.round((totalSpent / totalBudget) * 100) || 0}%</span>
            </div>
            <div className="h-2 bg-white/10 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${Math.min((totalSpent / totalBudget) * 100, 100)}%` }}
                className="h-full bg-white rounded-full"
              />
            </div>
          </div>
        </div>

        <div className="section-card section-hover p-8 flex flex-col justify-center">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-[#ebf3ed] flex items-center justify-center">
              <Target size={24} className="text-[#1f6b55]" />
            </div>
            <div>
              <p className="text-xs font-mono uppercase tracking-widest text-[#607066]">Remaining Balance</p>
              <p className="text-3xl font-bold text-[#1e2a25] tracking-tight">₹{Math.max(totalBudget - totalSpent, 0).toLocaleString()}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Category Budgets */}
      <div className="section-card section-hover p-8">
        <div className="flex items-center justify-between mb-8">
          <h3 className="text-lg font-bold text-[#1e2a25]">Category Budgets</h3>
          <button
            onClick={() => setIsAdding(true)}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#1f6b55] to-[#245f56] text-white rounded-xl text-sm font-bold hover:from-[#1a5a49] hover:to-[#1f534b] transition-all shadow-lg shadow-[#9fb6a8]"
          >
            <Plus size={18} />
            Set New Budget
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <AnimatePresence mode="popLayout">
            {isAdding && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="p-6 rounded-2xl border-2 border-dashed border-[#cad7ce] bg-[#f3f8f4]"
              >
                <div className="space-y-4">
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-widest text-[#607066] mb-1 block">Category</label>
                    <select
                      value={newBudget.category}
                      onChange={(e) => setNewBudget({ ...newBudget, category: e.target.value })}
                      className="w-full bg-white border border-[#d5e1d8] rounded-xl px-4 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#1f6b55]/20"
                    >
                      {CATEGORIES.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-widest text-[#607066] mb-1 block">Monthly Amount</label>
                    <input
                      type="number"
                      value={newBudget.amount || ''}
                      onChange={(e) => setNewBudget({ ...newBudget, amount: parseFloat(e.target.value) })}
                      placeholder="0.00"
                      className="w-full bg-white border border-[#d5e1d8] rounded-xl px-4 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#1f6b55]/20"
                    />
                  </div>
                  <div className="flex gap-2 pt-2">
                    <button
                      onClick={() => {
                        onAddBudget(newBudget);
                        setIsAdding(false);
                        setNewBudget({ category: CATEGORIES[0], amount: 0, period: 'monthly' });
                      }}
                      className="flex-1 bg-gradient-to-r from-[#1f6b55] to-[#245f56] text-white py-2 rounded-xl text-xs font-bold hover:from-[#1a5a49] hover:to-[#1f534b]"
                    >
                      Save Budget
                    </button>
                    <button
                      onClick={() => setIsAdding(false)}
                      className="px-4 bg-white border border-[#d5e1d8] text-[#5f6f65] py-2 rounded-xl text-xs font-bold hover:bg-[#f2f7f3]"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            {budgets.map((budget) => {
              const spent = getSpentForCategory(budget.category);
              const percentage = Math.min((spent / budget.amount) * 100, 100);
              const isOver = spent > budget.amount;

              return (
                <motion.div
                  layout
                  key={budget.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="section-subcard p-6 group transition-all hover:-translate-y-0.5 hover:shadow-lg"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-[#eaf3ed] flex items-center justify-center">
                        <PieChart size={20} className="text-[#1f6b55]" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-[#1e2a25]">{budget.category}</p>
                        <p className="text-[10px] text-[#607066] font-mono uppercase tracking-widest">Monthly Limit: ₹{budget.amount}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => onDeleteBudget(budget.id)}
                      className="p-2 text-[#7a8780] hover:text-[#b44f48] opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-[10px] font-bold">
                      <span className={isOver ? "text-[#b44f48]" : "text-[#5f6f65]"}>
                        Spent: ₹{spent.toLocaleString()}
                      </span>
                      <span className="text-[#79877f]">{Math.round(percentage)}%</span>
                    </div>
                    <div className="h-1.5 bg-[#dce8df] rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${percentage}%` }}
                        className={cn(
                          "h-full rounded-full transition-colors duration-500",
                          isOver ? "bg-[#b44f48]" : "bg-[#1f6b55]"
                        )}
                      />
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(' ');
}
