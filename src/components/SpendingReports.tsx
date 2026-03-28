import React, { useMemo, useState } from 'react';
import { Expense, Budget } from '../types';
import { CATEGORIES, CATEGORY_COLORS } from '../constants';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  Cell, PieChart, Pie, Legend, LineChart, Line 
} from 'recharts';
import { TrendingUp, AlertCircle, CheckCircle2, PieChart as PieChartIcon, BarChart3, Calendar, ChevronLeft, ChevronRight } from 'lucide-react';

interface SpendingReportsProps {
  expenses: Expense[];
  budgets: Budget[];
}

function getCategoryColor(category: string) {
  return CATEGORY_COLORS[category] ?? '#4F9878';
}

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export default function SpendingReports({ expenses, budgets }: SpendingReportsProps) {
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const monthlyData = useMemo(() => {
    const categoryTotals: Record<string, number> = {};
    CATEGORIES.forEach(cat => categoryTotals[cat] = 0);

    expenses.forEach(expense => {
      const expenseDate = new Date(expense.date);
      if (expenseDate.getMonth() === selectedMonth && expenseDate.getFullYear() === selectedYear) {
        categoryTotals[expense.category] = (categoryTotals[expense.category] || 0) + expense.amount;
      }
    });

    return CATEGORIES
      .filter(cat => cat !== 'Money Received')
      .map(category => {
        const budget = budgets.find(b => b.category === category)?.amount || 0;
        const spent = categoryTotals[category];
        return {
          name: category,
          spent,
          budget,
          remaining: Math.max(0, budget - spent),
          over: Math.max(0, spent - budget),
          status: budget === 0 ? 'no-budget' : spent > budget ? 'over' : 'under'
        };
      }).filter(item => item.spent > 0 || item.budget > 0);
  }, [expenses, budgets, selectedMonth, selectedYear]);

  const totalIncome = useMemo(() => {
    return expenses
      .filter(e => {
        const d = new Date(e.date);
        return d.getMonth() === selectedMonth && d.getFullYear() === selectedYear && (e.category === 'Money Received' || e.tags.includes('#money-received'));
      })
      .reduce((acc, curr) => acc + curr.amount, 0);
  }, [expenses, selectedMonth, selectedYear]);

  const trendData = useMemo(() => {
    const last6Months = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(selectedYear, selectedMonth - i, 1);
      const month = d.getMonth();
      const year = d.getFullYear();
      
      const spent = expenses
        .filter(e => {
          const ed = new Date(e.date);
          return ed.getMonth() === month && ed.getFullYear() === year && !(e.category === 'Money Received' || e.tags.includes('#money-received'));
        })
        .reduce((acc, curr) => acc + curr.amount, 0);

      const income = expenses
        .filter(e => {
          const ed = new Date(e.date);
          return ed.getMonth() === month && ed.getFullYear() === year && (e.category === 'Money Received' || e.tags.includes('#money-received'));
        })
        .reduce((acc, curr) => acc + curr.amount, 0);

      last6Months.push({
        name: MONTHS[month].substring(0, 3),
        spent,
        income
      });
    }
    return last6Months;
  }, [expenses, selectedMonth, selectedYear]);

  const topSpending = [...monthlyData].sort((a, b) => b.spent - a.spent).slice(0, 3);
  const totalSpent = monthlyData.reduce((acc, curr) => acc + curr.spent, 0);
  const totalBudget = monthlyData.reduce((acc, curr) => acc + curr.budget, 0);

  const handlePrevMonth = () => {
    if (selectedMonth === 0) {
      setSelectedMonth(11);
      setSelectedYear(selectedYear - 1);
    } else {
      setSelectedMonth(selectedMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (selectedMonth === 11) {
      setSelectedMonth(0);
      setSelectedYear(selectedYear + 1);
    } else {
      setSelectedMonth(selectedMonth + 1);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Month Selector */}
      <div className="section-card section-hover flex items-center justify-between p-4 rounded-2xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#ebf3ed] flex items-center justify-center text-[#1f6b55]">
            <Calendar size={20} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-[#1e2a25]">{MONTHS[selectedMonth]} {selectedYear}</h3>
            <p className="text-[10px] text-[#617067] font-mono uppercase tracking-widest">Reporting Period</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={handlePrevMonth}
            className="p-2 hover:bg-[#edf4ef] rounded-xl transition-colors text-[#77857d] hover:text-[#1e2a25]"
          >
            <ChevronLeft size={20} />
          </button>
          <button 
            onClick={handleNextMonth}
            className="p-2 hover:bg-[#edf4ef] rounded-xl transition-colors text-[#77857d] hover:text-[#1e2a25]"
          >
            <ChevronRight size={20} />
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="section-subcard section-hover p-6 rounded-3xl">
          <p className="text-[10px] font-bold uppercase tracking-widest text-[#728077] mb-1">Monthly Money Received</p>
          <h4 className="text-2xl font-bold text-[#2d8a67]">₹{totalIncome.toLocaleString()}</h4>
          <div className="mt-4 flex items-center gap-2 text-xs text-[#5d6b63]">
            <TrendingUp size={14} className="text-[#2d8a67]" />
            <span>Received this month</span>
          </div>
        </div>
        <div className="section-subcard section-hover p-6 rounded-3xl">
          <p className="text-[10px] font-bold uppercase tracking-widest text-[#728077] mb-1">Monthly Money Transfer</p>
          <h4 className="text-2xl font-bold text-[#1e2a25]">₹{totalSpent.toLocaleString()}</h4>
          <div className="mt-4 flex items-center gap-2 text-xs text-[#5d6b63]">
            <TrendingUp size={14} className="text-[#7b8a81]" />
            <span>Across {monthlyData.filter(d => d.spent > 0).length} categories</span>
          </div>
        </div>
        <div className="section-subcard section-hover p-6 rounded-3xl">
          <p className="text-[10px] font-bold uppercase tracking-widest text-[#728077] mb-1">Budget Utilization</p>
          <h4 className="text-2xl font-bold text-[#1e2a25]">
            {totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 100) : 0}%
          </h4>
          <div className="mt-4 w-full bg-[#dde8df] h-1.5 rounded-full overflow-hidden">
            <div 
              className={`h-full transition-all duration-1000 ${totalSpent > totalBudget ? 'bg-[#b44f48]' : 'bg-[#1f6b55]'}`}
              style={{ width: `${Math.min(100, totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0)}%` }}
            />
          </div>
        </div>
        <div className="section-subcard section-hover p-6 rounded-3xl">
          <p className="text-[10px] font-bold uppercase tracking-widest text-[#728077] mb-1">Top Category</p>
          <h4 className="text-2xl font-bold text-[#1e2a25]">{topSpending[0]?.name || 'N/A'}</h4>
          <p className="mt-4 text-xs text-[#5d6b63]">
            ₹{topSpending[0]?.spent.toLocaleString() || 0} spent this month
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Spent by Category Chart */}
        <div className="section-card section-hover p-8">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-2xl bg-[#1f6b55] text-white flex items-center justify-center">
              <BarChart3 size={20} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-[#1e2a25]">Spent vs Budget</h3>
              <p className="text-xs text-[#607066]">Comparison by category</p>
            </div>
          </div>
          
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fill: '#94A3B8', fontWeight: 600 }}
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fill: '#94A3B8', fontWeight: 600 }}
                />
                <Tooltip 
                  cursor={{ fill: '#F8FAFC' }}
                  contentStyle={{ 
                    borderRadius: '16px', 
                    border: 'none', 
                    boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                    fontSize: '12px'
                  }}
                />
                <Bar dataKey="spent" name="Spent" radius={[4, 4, 0, 0]}>
                  {monthlyData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={getCategoryColor(entry.name)} />
                  ))}
                </Bar>
                <Bar dataKey="budget" name="Budget" fill="#D7EBE1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Distribution Pie Chart */}
        <div className="section-card section-hover p-8">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-2xl bg-[#1f6b55] text-white flex items-center justify-center">
              <PieChartIcon size={20} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-[#1e2a25]">Expense Distribution</h3>
              <p className="text-xs text-[#607066]">Where your money goes</p>
            </div>
          </div>

          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={monthlyData.filter(d => d.spent > 0)}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="spent"
                >
                  {monthlyData.filter(d => d.spent > 0).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={getCategoryColor(entry.name)} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    borderRadius: '16px', 
                    border: 'none', 
                    boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                    fontSize: '12px'
                  }}
                />
                <Legend 
                  verticalAlign="bottom" 
                  height={36}
                  iconType="circle"
                  formatter={(value) => <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500">{value}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Detailed Analysis Table */}
      <div className="section-card section-hover p-8">
        <h3 className="text-lg font-bold text-[#1e2a25] mb-6">Category Breakdown</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-[#e2ebe3]">
                <th className="pb-4 text-[10px] font-bold uppercase tracking-widest text-[#728077]">Category</th>
                <th className="pb-4 text-[10px] font-bold uppercase tracking-widest text-[#728077]">Spent</th>
                <th className="pb-4 text-[10px] font-bold uppercase tracking-widest text-[#728077]">Budget</th>
                <th className="pb-4 text-[10px] font-bold uppercase tracking-widest text-[#728077]">Status</th>
                <th className="pb-4 text-[10px] font-bold uppercase tracking-widest text-[#728077] text-right">Variance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#eef3ef]">
              {monthlyData.map((item) => (
                <tr key={item.name} className="group hover:bg-[#f5faf6] transition-colors">
                  <td className="py-4 text-sm font-bold text-[#1f2d26]">{item.name}</td>
                  <td className="py-4 text-sm text-[#56655c] font-mono">₹{item.spent.toLocaleString()}</td>
                  <td className="py-4 text-sm text-[#76837c] font-mono">₹{item.budget.toLocaleString()}</td>
                  <td className="py-4">
                    {item.budget === 0 ? (
                      <span className="text-[10px] font-bold uppercase tracking-widest text-[#78867f]">No Budget</span>
                    ) : item.spent > item.budget ? (
                      <div className="flex items-center gap-1.5 text-[#b44f48]">
                        <AlertCircle size={14} />
                        <span className="text-[10px] font-bold uppercase tracking-widest">Over</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 text-[#2d8a67]">
                        <CheckCircle2 size={14} />
                        <span className="text-[10px] font-bold uppercase tracking-widest">On Track</span>
                      </div>
                    )}
                  </td>
                  <td className={`py-4 text-sm font-bold text-right font-mono ${item.over > 0 ? 'text-[#b44f48]' : 'text-[#2d8a67]'}`}>
                    {item.over > 0 ? `+₹${item.over.toLocaleString()}` : `-₹${item.remaining.toLocaleString()}`}
                  </td>
                </tr>
              ))}
              {monthlyData.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-[#78867f] text-sm">No data for this period.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Monthly Trend Chart */}
      <div className="section-card section-hover p-8">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-2xl bg-[#1f6b55] text-white flex items-center justify-center">
            <TrendingUp size={20} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-[#1e2a25]">Monthly Trend</h3>
            <p className="text-xs text-[#607066]">Received vs Spent (Last 6 Months)</p>
          </div>
        </div>
        
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={trendData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
              <XAxis 
                dataKey="name" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 10, fill: '#94A3B8', fontWeight: 600 }}
                dy={10}
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 10, fill: '#94A3B8', fontWeight: 600 }}
              />
              <Tooltip 
                contentStyle={{ 
                  borderRadius: '16px', 
                  border: 'none', 
                  boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                  fontSize: '12px'
                }}
              />
              <Legend 
                verticalAlign="top" 
                align="right"
                height={36}
                iconType="circle"
                formatter={(value) => <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500">{value}</span>}
              />
              <Line
                type="monotone"
                dataKey="income"
                name="Money Received"
                stroke={CATEGORY_COLORS['Money Received']}
                strokeWidth={3}
                dot={{ r: 4, fill: CATEGORY_COLORS['Money Received'] }}
                activeDot={{ r: 6 }}
              />
              <Line
                type="monotone"
                dataKey="spent"
                name="Money Transfer"
                stroke={CATEGORY_COLORS['Money Transfer']}
                strokeWidth={3}
                dot={{ r: 4, fill: CATEGORY_COLORS['Money Transfer'] }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
