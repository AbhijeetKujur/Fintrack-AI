import React, { useMemo, useState } from 'react';
import { Expense, Budget } from '../types';
import { CATEGORIES, CATEGORY_COLORS } from '../constants';
import { useCurrency } from '../context/CurrencyContext';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  Cell, PieChart, Pie, Legend, LineChart, Line 
} from 'recharts';
import { TrendingUp, AlertCircle, CheckCircle2, PieChart as PieChartIcon, BarChart3, Calendar, ChevronLeft, ChevronRight, Download } from 'lucide-react';
import html2pdf from 'html2pdf.js';

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

function downloadMonthlyReport(expenses: Expense[], budgets: Budget[], month: number, year: number, currencySymbol: string, convertAmount: (amount: number) => number) {
  const monthName = MONTHS[month];
  const fileName = `${monthName}-${year}-Report.pdf`;
  
  // Filter expenses for the selected month
  const monthlyExpenses = expenses.filter(e => {
    const d = new Date(e.date);
    return d.getMonth() === month && d.getFullYear() === year;
  });

  // Calculate category totals
  const categoryTotals: Record<string, number> = {};
  const categoryData: Array<{ name: string; spent: number; budget: number; status: string }> = [];
  
  CATEGORIES.filter(cat => cat !== 'Money Received').forEach(category => {
    const spent = monthlyExpenses.filter(e => e.category === category).reduce((acc, e) => acc + e.amount, 0);
    const budget = budgets.find(b => b.category === category)?.amount || 0;
    categoryTotals[category] = spent;
    
    if (spent > 0 || budget > 0) {
      categoryData.push({
        name: category,
        spent,
        budget,
        status: budget === 0 ? 'no-budget' : spent > budget ? 'over' : 'under'
      });
    }
  });

  // Calculate totals
  const totalSpent = convertAmount(Object.values(categoryTotals).reduce((a, b) => a + b, 0));
  const totalBudget = convertAmount(budgets.filter(b => b.category !== 'Money Received').reduce((acc, b) => acc + b.amount, 0));
  const totalIncome = convertAmount(monthlyExpenses
    .filter(e => e.category === 'Money Received' || e.tags.includes('#money-received'))
    .reduce((acc, e) => acc + e.amount, 0));

  const html = `
    <html>
      <head>
        <meta charset="utf-8" />
      </head>
      <body style="margin: 0; padding: 20px; font-family: Arial, sans-serif; background: white;">
        <div style="padding: 20px; background: white;">
          <h1 style="text-align: center; color: black; font-size: 28px; margin: 0 0 10px 0; font-weight: bold;">Monthly Financial Report</h1>
          <p style="text-align: center; color: black; font-size: 16px; margin: 0 0 20px 0; font-weight: bold; padding-bottom: 15px; border-bottom: 3px solid #1f6b55;">${monthName} ${year}</p>

          <table style="width: 100%; margin: 20px 0; border-collapse: collapse;">
            <tr>
              <td style="width: 25%; padding: 15px; border: 1px solid #999; background: #f5f5f5;">
                <div style="color: black; font-size: 11px; font-weight: bold; margin-bottom: 8px; text-transform: uppercase;">Monthly Income</div>
                <div style="color: black; font-size: 20px; font-weight: bold;">${currencySymbol}${totalIncome.toLocaleString()}</div>
              </td>
              <td style="width: 25%; padding: 15px; border: 1px solid #999; background: #f5f5f5;">
                <div style="color: black; font-size: 11px; font-weight: bold; margin-bottom: 8px; text-transform: uppercase;">Total Spent</div>
                <div style="color: black; font-size: 20px; font-weight: bold;">${currencySymbol}${totalSpent.toLocaleString()}</div>
              </td>
              <td style="width: 25%; padding: 15px; border: 1px solid #999; background: #f5f5f5;">
                <div style="color: black; font-size: 11px; font-weight: bold; margin-bottom: 8px; text-transform: uppercase;">Total Budget</div>
                <div style="color: black; font-size: 20px; font-weight: bold;">${currencySymbol}${totalBudget.toLocaleString()}</div>
              </td>
              <td style="width: 25%; padding: 15px; border: 1px solid #999; background: #f5f5f5;">
                <div style="color: black; font-size: 11px; font-weight: bold; margin-bottom: 8px; text-transform: uppercase;">Utilization</div>
                <div style="color: black; font-size: 20px; font-weight: bold;">${totalBudget > 0 ? ((totalSpent / totalBudget) * 100).toFixed(1) : 0}%</div>
              </td>
            </tr>
          </table>

          <h3 style="color: black; font-size: 13px; font-weight: bold; margin: 20px 0 10px 0; text-transform: uppercase; padding-top: 10px;">Category Breakdown</h3>
          <table style="width: 100%; border-collapse: collapse; border: 1px solid #999;">
            <thead>
              <tr style="background: #e0e0e0;">
                <th style="color: black; padding: 10px; text-align: left; font-size: 11px; font-weight: bold; border: 1px solid #999;">Category</th>
                <th style="color: black; padding: 10px; text-align: right; font-size: 11px; font-weight: bold; border: 1px solid #999;">Spent</th>
                <th style="color: black; padding: 10px; text-align: right; font-size: 11px; font-weight: bold; border: 1px solid #999;">Budget</th>
                <th style="color: black; padding: 10px; text-align: left; font-size: 11px; font-weight: bold; border: 1px solid #999;">Status</th>
                <th style="color: black; padding: 10px; text-align: right; font-size: 11px; font-weight: bold; border: 1px solid #999;">Variance</th>
              </tr>
            </thead>
            <tbody>
              ${categoryData.map(item => {
                const spent = convertAmount(item.spent);
                const budget = convertAmount(item.budget);
                const variance = budget > 0 ? (spent > budget ? spent - budget : budget - spent) : 0;
                
                return `<tr>
                  <td style="color: black; padding: 8px; border: 1px solid #ddd; font-size: 11px;">${item.name}</td>
                  <td style="color: black; padding: 8px; border: 1px solid #ddd; font-size: 11px; text-align: right;">${currencySymbol}${spent.toLocaleString()}</td>
                  <td style="color: black; padding: 8px; border: 1px solid #ddd; font-size: 11px; text-align: right;">${currencySymbol}${budget.toLocaleString()}</td>
                  <td style="color: black; padding: 8px; border: 1px solid #ddd; font-size: 11px;">${item.status === 'over' ? 'Over' : item.status === 'no-budget' ? 'No Budget' : 'On Track'}</td>
                  <td style="color: black; padding: 8px; border: 1px solid #ddd; font-size: 11px; text-align: right; font-weight: bold;">${currencySymbol}${variance.toLocaleString()}</td>
                </tr>`;
              }).join('')}
            </tbody>
          </table>

          <h3 style="color: black; font-size: 13px; font-weight: bold; margin: 20px 0 10px 0; text-transform: uppercase;">Transactions (${monthlyExpenses.length} total)</h3>
          <table style="width: 100%; border-collapse: collapse; border: 1px solid #999;">
            <thead>
              <tr style="background: #e0e0e0;">
                <th style="color: black; padding: 8px; text-align: left; font-size: 10px; font-weight: bold; border: 1px solid #999;">Date</th>
                <th style="color: black; padding: 8px; text-align: left; font-size: 10px; font-weight: bold; border: 1px solid #999;">Merchant</th>
                <th style="color: black; padding: 8px; text-align: left; font-size: 10px; font-weight: bold; border: 1px solid #999;">Category</th>
                <th style="color: black; padding: 8px; text-align: right; font-size: 10px; font-weight: bold; border: 1px solid #999;">Amount</th>
                <th style="color: black; padding: 8px; text-align: left; font-size: 10px; font-weight: bold; border: 1px solid #999;">Status</th>
              </tr>
            </thead>
            <tbody>
              ${monthlyExpenses.slice(0, 20).map(expense => `<tr>
                <td style="color: black; padding: 6px; border: 1px solid #ddd; font-size: 10px;">${new Date(expense.date).toLocaleDateString()}</td>
                <td style="color: black; padding: 6px; border: 1px solid #ddd; font-size: 10px;">${expense.merchant}</td>
                <td style="color: black; padding: 6px; border: 1px solid #ddd; font-size: 10px;">${expense.category}</td>
                <td style="color: black; padding: 6px; border: 1px solid #ddd; font-size: 10px; text-align: right;">${expense.category === 'Money Received' || expense.tags.includes('#money-received') ? '+' : '-'}${currencySymbol}${expense.amount.toFixed(2)}</td>
                <td style="color: black; padding: 6px; border: 1px solid #ddd; font-size: 10px;">${expense.status || 'completed'}</td>
              </tr>`).join('')}
            </tbody>
          </table>
          ${monthlyExpenses.length > 20 ? `<p style="margin-top: 10px; font-size: 11px; color: black; font-weight: bold;">... and ${monthlyExpenses.length - 20} more transactions</p>` : ''}

          <div style="text-align: center; margin-top: 30px; padding-top: 15px; border-top: 1px solid #999;">
            <p style="color: black; font-size: 10px; font-weight: bold; margin: 0;">Generated on ${new Date().toLocaleDateString()} | Personal Finance Report</p>
          </div>
        </div>
      </body>
    </html>
  `;

  const options = {
    margin: 10,
    filename: fileName,
    image: { type: 'jpeg', quality: 0.99 },
    html2canvas: { scale: 2, logging: false, useCORS: true, backgroundColor: '#ffffff' },
    jsPDF: { orientation: 'portrait', unit: 'mm', format: 'a4' }
  };

  html2pdf().set(options).from(html).save();
}

function downloadYearlyReport(expenses: Expense[], budgets: Budget[], year: number, currencySymbol: string, convertAmount: (amount: number) => number) {
  const fileName = `${year}-Yearly-Report.pdf`;
  
  // Monthly summary
  const months = Array(12).fill(0).map((_, i) => i);
  const monthlyData = months.map(monthIdx => {
    const monthExpenses = expenses.filter(e => {
      const d = new Date(e.date);
      return d.getMonth() === monthIdx && d.getFullYear() === year;
    });

    const monthIncome = convertAmount(monthExpenses
      .filter(e => e.category === 'Money Received' || e.tags.includes('#money-received'))
      .reduce((acc, e) => acc + e.amount, 0));

    const monthSpent = convertAmount(monthExpenses
      .filter(e => e.category !== 'Money Received' && !e.tags.includes('#money-received'))
      .reduce((acc, e) => acc + e.amount, 0));

    return {
      month: MONTHS[monthIdx],
      income: monthIncome,
      spent: monthSpent
    };
  });

  // Category annual summary
  const categoryData: Array<{ name: string; spent: number; budget: number; variance: string }> = [];
  CATEGORIES.filter(cat => cat !== 'Money Received').forEach(category => {
    const yearExpenses = expenses.filter(e => {
      const d = new Date(e.date);
      return d.getFullYear() === year && e.category === category;
    });

    const totalSpent = convertAmount(yearExpenses.reduce((acc, e) => acc + e.amount, 0));
    const budget = convertAmount((budgets.find(b => b.category === category)?.amount || 0) * 12);
    
    if (totalSpent > 0 || budget > 0) {
      const variance = budget > 0 
        ? (totalSpent > budget 
          ? `Over by ${currencySymbol}${(totalSpent - budget).toFixed(2)}` 
          : `Under by ${currencySymbol}${(budget - totalSpent).toFixed(2)}`) 
        : 'N/A';

      categoryData.push({
        name: category,
        spent: totalSpent,
        budget: budget,
        variance
      });
    }
  });

  // Yearly totals
  const yearExpenses = expenses.filter(e => new Date(e.date).getFullYear() === year);
  const yearIncome = convertAmount(yearExpenses
    .filter(e => e.category === 'Money Received' || e.tags.includes('#money-received'))
    .reduce((acc, e) => acc + e.amount, 0));
  const yearSpent = convertAmount(yearExpenses
    .filter(e => e.category !== 'Money Received' && !e.tags.includes('#money-received'))
    .reduce((acc, e) => acc + e.amount, 0));
  const yearBudget = convertAmount(budgets.filter(b => b.category !== 'Money Received').reduce((acc, b) => acc + (b.amount * 12), 0));

  const html = `
    <html>
      <head>
        <meta charset="utf-8" />
      </head>
      <body style="margin: 0; padding: 20px; font-family: Arial, sans-serif; background: white;">
        <div style="padding: 20px; background: white;">
          <h1 style="text-align: center; color: black; font-size: 28px; margin: 0 0 10px 0; font-weight: bold;">Annual Financial Report</h1>
          <p style="text-align: center; color: black; font-size: 16px; margin: 0 0 20px 0; font-weight: bold; padding-bottom: 15px; border-bottom: 3px solid #1f6b55;">Year ${year}</p>

          <table style="width: 100%; margin: 20px 0; border-collapse: collapse;">
            <tr>
              <td style="width: 25%; padding: 15px; border: 1px solid #999; background: #f5f5f5;">
                <div style="color: black; font-size: 11px; font-weight: bold; margin-bottom: 8px; text-transform: uppercase;">Annual Income</div>
                <div style="color: black; font-size: 20px; font-weight: bold;">${currencySymbol}${yearIncome.toLocaleString()}</div>
              </td>
              <td style="width: 25%; padding: 15px; border: 1px solid #999; background: #f5f5f5;">
                <div style="color: black; font-size: 11px; font-weight: bold; margin-bottom: 8px; text-transform: uppercase;">Annual Spent</div>
                <div style="color: black; font-size: 20px; font-weight: bold;">${currencySymbol}${yearSpent.toLocaleString()}</div>
              </td>
              <td style="width: 25%; padding: 15px; border: 1px solid #999; background: #f5f5f5;">
                <div style="color: black; font-size: 11px; font-weight: bold; margin-bottom: 8px; text-transform: uppercase;">Annual Budget</div>
                <div style="color: black; font-size: 20px; font-weight: bold;">${currencySymbol}${yearBudget.toLocaleString()}</div>
              </td>
              <td style="width: 25%; padding: 15px; border: 1px solid #999; background: #f5f5f5;">
                <div style="color: black; font-size: 11px; font-weight: bold; margin-bottom: 8px; text-transform: uppercase;">Utilization</div>
                <div style="color: black; font-size: 20px; font-weight: bold;">${yearBudget > 0 ? ((yearSpent / yearBudget) * 100).toFixed(1) : 0}%</div>
              </td>
            </tr>
          </table>

          <h3 style="color: black; font-size: 13px; font-weight: bold; margin: 20px 0 10px 0; text-transform: uppercase; padding-top: 10px;">Monthly Trend</h3>
          <table style="width: 100%; border-collapse: collapse; border: 1px solid #999;">
            <thead>
              <tr style="background: #e0e0e0;">
                <th style="color: black; padding: 8px; text-align: left; font-size: 11px; font-weight: bold; border: 1px solid #999;">Month</th>
                <th style="color: black; padding: 8px; text-align: right; font-size: 11px; font-weight: bold; border: 1px solid #999;">Income</th>
                <th style="color: black; padding: 8px; text-align: right; font-size: 11px; font-weight: bold; border: 1px solid #999;">Spent</th>
                <th style="color: black; padding: 8px; text-align: right; font-size: 11px; font-weight: bold; border: 1px solid #999;">Net</th>
              </tr>
            </thead>
            <tbody>
              ${monthlyData.map(item => `<tr>
                <td style="color: black; padding: 6px; border: 1px solid #ddd; font-size: 11px;">${item.month}</td>
                <td style="color: black; padding: 6px; border: 1px solid #ddd; font-size: 11px; text-align: right; font-weight: bold;">${currencySymbol}${item.income.toLocaleString()}</td>
                <td style="color: black; padding: 6px; border: 1px solid #ddd; font-size: 11px; text-align: right;">${currencySymbol}${item.spent.toLocaleString()}</td>
                <td style="color: black; padding: 6px; border: 1px solid #ddd; font-size: 11px; text-align: right; font-weight: bold;">${currencySymbol}${Math.abs(item.income - item.spent).toLocaleString()}</td>
              </tr>`).join('')}
            </tbody>
          </table>

          <h3 style="color: black; font-size: 13px; font-weight: bold; margin: 20px 0 10px 0; text-transform: uppercase;">Category Annual Summary</h3>
          <table style="width: 100%; border-collapse: collapse; border: 1px solid #999;">
            <thead>
              <tr style="background: #e0e0e0;">
                <th style="color: black; padding: 8px; text-align: left; font-size: 11px; font-weight: bold; border: 1px solid #999;">Category</th>
                <th style="color: black; padding: 8px; text-align: right; font-size: 11px; font-weight: bold; border: 1px solid #999;">Spent</th>
                <th style="color: black; padding: 8px; text-align: right; font-size: 11px; font-weight: bold; border: 1px solid #999;">Budget</th>
                <th style="color: black; padding: 8px; text-align: right; font-size: 11px; font-weight: bold; border: 1px solid #999;">Variance</th>
              </tr>
            </thead>
            <tbody>
              ${categoryData.map(item => `<tr>
                <td style="color: black; padding: 6px; border: 1px solid #ddd; font-size: 11px;">${item.name}</td>
                <td style="color: black; padding: 6px; border: 1px solid #ddd; font-size: 11px; text-align: right;">${currencySymbol}${item.spent.toLocaleString()}</td>
                <td style="color: black; padding: 6px; border: 1px solid #ddd; font-size: 11px; text-align: right;">${currencySymbol}${item.budget.toLocaleString()}</td>
                <td style="color: black; padding: 6px; border: 1px solid #ddd; font-size: 11px; text-align: right; font-weight: bold;">${item.variance}</td>
              </tr>`).join('')}
            </tbody>
          </table>

          <div style="color: black; font-size: 12px; font-weight: bold; margin: 20px 0;">
            <p style="margin: 0;">Net Income: ${currencySymbol}${(yearIncome - yearSpent).toLocaleString()}</p>
          </div>

          <div style="text-align: center; margin-top: 30px; padding-top: 15px; border-top: 1px solid #999;">
            <p style="color: black; font-size: 10px; font-weight: bold; margin: 0;">Generated on ${new Date().toLocaleDateString()} | Personal Finance Report</p>
          </div>
        </div>
      </body>
    </html>
  `;

  const options = {
    margin: 10,
    filename: fileName,
    image: { type: 'jpeg', quality: 0.99 },
    html2canvas: { scale: 2, logging: false, useCORS: true, backgroundColor: '#ffffff' },
    jsPDF: { orientation: 'portrait', unit: 'mm', format: 'a4' }
  };

  html2pdf().set(options).from(html).save();
}

export default function SpendingReports({ expenses, budgets }: SpendingReportsProps) {
  const { selectedCurrency, convertAmount, formatAmount } = useCurrency();
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
            <h3 className="text-sm font-bold text-[#eef1ff]">{MONTHS[selectedMonth]} {selectedYear}</h3>
            <p className="text-[10px] text-[#b8b9ea] font-mono uppercase tracking-widest">Reporting Period</p>
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
          <div className="flex items-center gap-2 ml-4 pl-4 border-l border-[#e2ebe3]">
            <button
              onClick={() => downloadMonthlyReport(expenses, budgets, selectedMonth, selectedYear, selectedCurrency.symbol, convertAmount)}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#1f6b55] to-[#245f56] text-white rounded-xl text-sm font-bold hover:from-[#1a5a49] hover:to-[#1f534b] transition-all shadow-lg"
              title="Download monthly report as CSV"
            >
              <Download size={16} />
              <span className="hidden sm:inline">Monthly</span>
            </button>
            <button
              onClick={() => downloadYearlyReport(expenses, budgets, selectedYear, selectedCurrency.symbol, convertAmount)}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#1f6b55] to-[#245f56] text-white rounded-xl text-sm font-bold hover:from-[#1a5a49] hover:to-[#1f534b] transition-all shadow-lg"
              title="Download yearly report as CSV"
            >
              <Download size={16} />
              <span className="hidden sm:inline">Yearly</span>
            </button>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="section-subcard section-hover p-6 rounded-3xl">
          <p className="text-[10px] font-bold uppercase tracking-widest text-[#b8b9ea] mb-1">Monthly Money Received</p>
          <h4 className="text-2xl font-bold text-[#2d8a67]">{formatAmount(totalIncome)}</h4>
          <div className="mt-4 flex items-center gap-2 text-xs text-[#b8b9ea]">
            <TrendingUp size={14} className="text-[#2d8a67]" />
            <span>Received this month</span>
          </div>
        </div>
        <div className="section-subcard section-hover p-6 rounded-3xl">
          <p className="text-[10px] font-bold uppercase tracking-widest text-[#b8b9ea] mb-1">Monthly Money Transfer</p>
          <h4 className="text-2xl font-bold text-[#eef1ff]">{formatAmount(totalSpent)}</h4>
          <div className="mt-4 flex items-center gap-2 text-xs text-[#b8b9ea]">
            <TrendingUp size={14} className="text-[#7b8a81]" />
            <span>Across {monthlyData.filter(d => d.spent > 0).length} categories</span>
          </div>
        </div>
        <div className="section-subcard section-hover p-6 rounded-3xl">
          <p className="text-[10px] font-bold uppercase tracking-widest text-[#b8b9ea] mb-1">Budget Utilization</p>
          <h4 className="text-2xl font-bold text-[#eef1ff]">
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
          <p className="text-[10px] font-bold uppercase tracking-widest text-[#b8b9ea] mb-1">Top Category</p>
          <h4 className="text-2xl font-bold text-[#eef1ff]">{topSpending[0]?.name || 'N/A'}</h4>
          <p className="mt-4 text-xs text-[#b8b9ea]">
            {formatAmount(topSpending[0]?.spent || 0)} spent this month
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
              <h3 className="text-lg font-bold text-[#eef1ff]">Spent vs Budget</h3>
              <p className="text-xs text-[#b8b9ea]">Comparison by category</p>
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
              <h3 className="text-lg font-bold text-[#eef1ff]">Expense Distribution</h3>
              <p className="text-xs text-[#b8b9ea]">Where your money goes</p>
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
                  formatter={(value) => <span className="text-[10px] font-bold uppercase tracking-widest text-[#b8b9ea]">{value}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Detailed Analysis Table */}
      <div className="section-card section-hover p-8">
        <h3 className="text-lg font-bold text-[#eef1ff] mb-6">Category Breakdown</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-[#e2ebe3]">
                <th className="pb-4 text-[10px] font-bold uppercase tracking-widest text-[#b8b9ea]">Category</th>
                <th className="pb-4 text-[10px] font-bold uppercase tracking-widest text-[#b8b9ea]">Spent</th>
                <th className="pb-4 text-[10px] font-bold uppercase tracking-widest text-[#b8b9ea]">Budget</th>
                <th className="pb-4 text-[10px] font-bold uppercase tracking-widest text-[#b8b9ea]">Status</th>
                <th className="pb-4 text-[10px] font-bold uppercase tracking-widest text-[#b8b9ea] text-right">Variance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#eef3ef]">
              {monthlyData.map((item) => (
                <tr key={item.name} className="group hover:bg-[#f5faf6] transition-colors">
                  <td className="py-4 text-sm font-bold text-[#eef1ff]">{item.name}</td>
                  <td className="py-4 text-sm text-[#b8b9ea] font-mono">{formatAmount(item.spent)}</td>
                  <td className="py-4 text-sm text-[#b8b9ea] font-mono">{formatAmount(item.budget)}</td>
                  <td className="py-4">
                    {item.budget === 0 ? (
                      <span className="text-[10px] font-bold uppercase tracking-widest text-[#b8b9ea]">No Budget</span>
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
                    {item.over > 0 ? `+${formatAmount(item.over)}` : `-${formatAmount(item.remaining)}`}
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
            <h3 className="text-lg font-bold text-[#eef1ff]">Monthly Trend</h3>
            <p className="text-xs text-[#b8b9ea]">Received vs Spent (Last 6 Months)</p>
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
                formatter={(value) => <span className="text-[10px] font-bold uppercase tracking-widest text-[#b8b9ea]">{value}</span>}
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
